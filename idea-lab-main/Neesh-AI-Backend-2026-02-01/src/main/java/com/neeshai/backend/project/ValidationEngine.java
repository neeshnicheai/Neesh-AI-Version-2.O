package com.neeshai.backend.project;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.*;

/**
 * Stateless scoring engine for startup validation.
 * Implements 5 modules (CVP, Market, Acquisition, Defensibility, Buildability),
 * each scoring 0-3, with an overall multiplicative composite.
 *
 * All internal scores and algorithm details are stripped from the report —
 * only user-friendly insights, confidence percentages, and statuses are exposed.
 */
@Component
public class ValidationEngine {

    private static final Logger log = LoggerFactory.getLogger(ValidationEngine.class);

    private final ObjectMapper objectMapper;

    public ValidationEngine(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    // ───────────────────────────────────────────────────────────
    //  PUBLIC API
    // ───────────────────────────────────────────────────────────

    /**
     * Run the full validation pipeline and return a JSON report string.
     */
    public String generateReport(String answersJson) {
        try {
            Map<String, Object> answers = parseAnswers(answersJson);
            if (answers.isEmpty()) {
                return "{}";
            }

            // Module scores
            ModuleResult cvp = scoreCVP(answers);
            ModuleResult market = scoreMarket(answers);
            ModuleResult acquisition = scoreAcquisition(answers);
            ModuleResult defensibility = scoreDefensibility(answers);
            ModuleResult buildability = scoreBuildability(answers);

            // Overall composite
            int rawProduct = cvp.score * market.score * acquisition.score
                    * defensibility.score * buildability.score;
            double normalized = rawProduct / 243.0; // 3^5 = 243
            double validationPct = 50.0 + normalized * 48.0;

            // Fatal zero rule
            boolean hasFatalZero = cvp.score == 0 || market.score == 0
                    || acquisition.score == 0 || defensibility.score == 0
                    || buildability.score == 0;
            if (hasFatalZero) {
                validationPct = 35.0 + (normalized * 14.0); // 35-49 range
                if (validationPct > 49.0) validationPct = 49.0;
                if (validationPct < 35.0) validationPct = 35.0;
            }

            int overallScore = (int) Math.round(validationPct);
            String overallStatus = deriveOverallStatus(overallScore, hasFatalZero);

            // Collect warnings
            List<String> warnings = new ArrayList<>();
            warnings.addAll(cvp.warnings);
            warnings.addAll(market.warnings);
            warnings.addAll(acquisition.warnings);
            warnings.addAll(defensibility.warnings);
            warnings.addAll(buildability.warnings);

            // Collect strengths & weaknesses
            List<String> strengths = new ArrayList<>();
            List<String> weaknesses = new ArrayList<>();
            collectStrengthsWeaknesses(cvp, "Core Value Proposition", strengths, weaknesses);
            collectStrengthsWeaknesses(market, "Market Size", strengths, weaknesses);
            collectStrengthsWeaknesses(acquisition, "Customer Acquisition", strengths, weaknesses);
            collectStrengthsWeaknesses(defensibility, "Defensibility", strengths, weaknesses);
            collectStrengthsWeaknesses(buildability, "Buildability", strengths, weaknesses);

            // Next step
            String nextStep = deriveNextStep(cvp, market, acquisition, defensibility, buildability, hasFatalZero);

            // Build report map
            Map<String, Object> report = new LinkedHashMap<>();
            report.put("overallScore", overallScore);
            report.put("overallStatus", overallStatus);
            report.put("hasFatalZero", hasFatalZero);

            Map<String, Object> modules = new LinkedHashMap<>();
            modules.put("cvp", moduleToMap(cvp));
            modules.put("market", moduleToMap(market));
            modules.put("acquisition", moduleToMap(acquisition));
            modules.put("defensibility", moduleToMap(defensibility));
            modules.put("buildability", moduleToMap(buildability));
            report.put("modules", modules);

            report.put("strengths", strengths);
            report.put("weaknesses", weaknesses);
            report.put("warnings", warnings);
            report.put("nextStep", nextStep);

            return objectMapper.writeValueAsString(report);
        } catch (Exception e) {
            log.error("Error generating validation report", e);
            return "{}";
        }
    }

    // ───────────────────────────────────────────────────────────
    //  MODULE 1 — Core Value Proposition
    // ───────────────────────────────────────────────────────────

    private ModuleResult scoreCVP(Map<String, Object> a) {
        ModuleResult r = new ModuleResult("Core Value Proposition");

        String alternative = str(a, "cvp_customer_alternative");
        String valueDriver = str(a, "cvp_value_driver");
        double currentCost = num(a, "cvp_current_solution_cost");
        double mvpCost = num(a, "cvp_mvp_cost");
        String sourceOfNumbers = str(a, "cvp_source_of_numbers");

        // Improvement multiplier
        double multiplier = (mvpCost > 0) ? currentCost / mvpCost : 0;

        int score = 0;
        if (multiplier >= 10) {
            score = 3;
            r.insight = "Exceptional value — your solution delivers 10x+ improvement over existing alternatives. This is a strong investor signal.";
        } else if (multiplier >= 3) {
            score = 2;
            r.insight = "Solid value proposition — a 3-10x improvement shows meaningful differentiation. Investors will probe for proof points.";
        } else if (multiplier >= 1.5) {
            score = 1;
            r.insight = "Marginal value improvement (1.5-3x). Customers may not switch for incremental gains. Consider deepening the value gap.";
        } else {
            score = 0;
            r.insight = "Insufficient value multiplier. Customers are unlikely to adopt unless the improvement is dramatically better than their current approach.";
        }

        // Evidence validation cap
        if ("guess".equalsIgnoreCase(sourceOfNumbers) || "assumption".equalsIgnoreCase(sourceOfNumbers)) {
            if (score > 1) score = 1;
            r.warnings.add("Marketing Illusion — your value claims are based on assumptions rather than validated data. Investors will discount unverified projections.");
        }

        // "Doing nothing" alternative penalty
        if ("nothing".equalsIgnoreCase(alternative) || "do_nothing".equalsIgnoreCase(alternative)) {
            if (score > 1) score -= 1;
            r.warnings.add("Customers currently do nothing — meaning the pain point may not be urgent enough to drive adoption.");
        }

        r.score = score;
        r.confidence = computeConfidence(score, 3);
        r.status = deriveModuleStatus(score);
        return r;
    }

    // ───────────────────────────────────────────────────────────
    //  MODULE 2 — Market Size
    // ───────────────────────────────────────────────────────────

    private ModuleResult scoreMarket(Map<String, Object> a) {
        ModuleResult r = new ModuleResult("Market Size");

        String howSolveToday = str(a, "market_how_solve_today");
        String behavioralChange = str(a, "market_behavioral_change");
        String spendingMoney = str(a, "market_spending_money");
        double annualSpend = num(a, "market_annual_spend");
        String targetSize = str(a, "market_target_size");
        String geography = str(a, "market_launch_geography");

        // Revenue goal = 10 Crore = 100,000,000 INR
        double revenueGoal = 100_000_000.0;
        double marketShareAssumption = 0.02; // 2%
        double requiredTAM = revenueGoal / marketShareAssumption; // 500 Crore

        // Required customer base
        double requiredCustomers = (annualSpend > 0) ? revenueGoal / annualSpend : Double.MAX_VALUE;

        int score = 0;

        // Target size scoring
        if ("large".equalsIgnoreCase(targetSize) || "very_large".equalsIgnoreCase(targetSize)) {
            score = 3;
            r.insight = "Large addressable market. At 2% market share, the revenue target of ₹10Cr is achievable with your pricing.";
        } else if ("medium".equalsIgnoreCase(targetSize)) {
            score = 2;
            r.insight = "Medium-sized market. Revenue target is reachable but market share assumptions need validation.";
        } else if ("small".equalsIgnoreCase(targetSize) || "niche".equalsIgnoreCase(targetSize)) {
            score = 1;
            r.insight = "Small or niche market. You may need higher ARPU or market share beyond 2% to hit ₹10Cr revenue.";
        } else {
            score = 1;
            r.insight = "Market size unclear — further research needed to validate addressable market.";
        }

        // "Doing nothing" penalty
        if ("nothing".equalsIgnoreCase(howSolveToday) || "do_nothing".equalsIgnoreCase(howSolveToday)) {
            if (score > 0) score -= 1;
            r.warnings.add("Customers currently do nothing — you'll need to create demand, not capture existing demand.");
        }

        // Behavioral change penalty
        if ("high".equalsIgnoreCase(behavioralChange) || "major".equalsIgnoreCase(behavioralChange)) {
            if (score > 0) score -= 1;
            r.warnings.add("High behavioral change required — adoption friction will slow growth and increase acquisition costs.");
        }

        // Not spending money penalty
        if ("no".equalsIgnoreCase(spendingMoney)) {
            if (score > 0) score -= 1;
            r.warnings.add("Customers aren't currently spending money to solve this — monetization validation is critical.");
        }

        // Geography risk
        if ("tier2_tier3".equalsIgnoreCase(geography) || "rural".equalsIgnoreCase(geography)) {
            r.warnings.add("Geography Execution Risk — launching in Tier 2/3 cities or rural areas increases distribution complexity.");
        }

        r.score = Math.max(0, score);
        r.confidence = computeConfidence(r.score, 3);
        r.status = deriveModuleStatus(r.score);
        return r;
    }

    // ───────────────────────────────────────────────────────────
    //  MODULE 3 — Customer Acquisition
    // ───────────────────────────────────────────────────────────

    private ModuleResult scoreAcquisition(Map<String, Object> a) {
        ModuleResult r = new ModuleResult("Customer Acquisition");

        String trustChannel = str(a, "acquisition_trust_channel");
        String identify10 = str(a, "acquisition_identify_10");
        String trustDriver = str(a, "acquisition_trust_driver");
        String founderDesc = str(a, "acquisition_founder_description");
        String customerValidation = str(a, "acquisition_customer_validation");

        // Social media presence
        @SuppressWarnings("unchecked")
        List<String> socialMedia = a.get("acquisition_social_media") instanceof List
                ? (List<String>) a.get("acquisition_social_media")
                : List.of();

        int score = 0;

        // Trust channel scoring
        if ("direct_outreach".equalsIgnoreCase(trustChannel) || "community".equalsIgnoreCase(trustChannel)
                || "referral".equalsIgnoreCase(trustChannel)) {
            score += 1;
        }

        // Can identify 10 target people
        if ("yes".equalsIgnoreCase(identify10)) {
            score += 1;
        }

        // Trust driver
        if ("expertise".equalsIgnoreCase(trustDriver) || "track_record".equalsIgnoreCase(trustDriver)
                || "social_proof".equalsIgnoreCase(trustDriver)) {
            score += 1;
        }

        score = Math.min(score, 3);

        // Founder credibility boost/cap
        if ("domain_expert".equalsIgnoreCase(founderDesc) || "serial_entrepreneur".equalsIgnoreCase(founderDesc)) {
            if (score < 3) score = Math.min(score + 1, 3);
        }

        // Customer validation
        if ("paying_customers".equalsIgnoreCase(customerValidation)) {
            r.insight = "You have paying customers — this is the strongest acquisition signal for investors.";
        } else if ("users_no_revenue".equalsIgnoreCase(customerValidation)) {
            r.insight = "Users without revenue — good traction signal but monetization pathway needs clarity.";
        } else if ("maybe".equalsIgnoreCase(customerValidation) || "interested".equalsIgnoreCase(customerValidation)) {
            if (score > 1) score -= 1;
            r.warnings.add("Marketing Illusion — 'maybe' or 'interested' responses don't constitute validated demand. Investors see through this.");
            r.insight = "Customer interest without commitment. Focus on converting interest to tangible user actions.";
        } else {
            r.insight = "No customer validation yet. First-mile acquisition is the top priority before scaling plans.";
        }

        // Social media presence bonus insight
        if (socialMedia.size() >= 3) {
            r.insight = (r.insight != null ? r.insight + " " : "") + "Strong social presence across " + socialMedia.size() + " platforms — this aids organic acquisition.";
        }

        r.score = Math.max(0, score);
        r.confidence = computeConfidence(r.score, 3);
        r.status = deriveModuleStatus(r.score);
        return r;
    }

    // ───────────────────────────────────────────────────────────
    //  MODULE 4 — Defensibility
    // ───────────────────────────────────────────────────────────

    private ModuleResult scoreDefensibility(Map<String, Object> a) {
        ModuleResult r = new ModuleResult("Defensibility");

        String competitorProtection = str(a, "defensibility_competitor_protection");
        String entryBarriers = str(a, "defensibility_entry_barriers");
        String continuousInnovation = str(a, "defensibility_continuous_innovation");

        int score = 0;

        // Competitor entry protection
        if ("network_effects".equalsIgnoreCase(competitorProtection)
                || "data_moat".equalsIgnoreCase(competitorProtection)) {
            score += 2;
        } else if ("patent".equalsIgnoreCase(competitorProtection)
                || "trade_secret".equalsIgnoreCase(competitorProtection)) {
            score += 1;
            if ("patent".equalsIgnoreCase(competitorProtection)) {
                r.warnings.add("Patent Illusion — patents alone rarely prevent well-funded competitors. True defensibility comes from execution speed and network effects.");
            }
        } else if ("brand".equalsIgnoreCase(competitorProtection)
                || "speed".equalsIgnoreCase(competitorProtection)) {
            score += 1;
        }

        // Entry barriers
        if ("high".equalsIgnoreCase(entryBarriers)) {
            score += 1;
        } else if ("medium".equalsIgnoreCase(entryBarriers)) {
            // no change
        } else {
            if (score > 0) score -= 1;
        }

        // Continuous innovation
        if ("strong_roadmap".equalsIgnoreCase(continuousInnovation)
                || "yes".equalsIgnoreCase(continuousInnovation)) {
            if (score < 3) score += 1;
            r.insight = "Strong innovation roadmap signals long-term defensibility. Keep iterating faster than competitors.";
        } else if ("some_plans".equalsIgnoreCase(continuousInnovation)) {
            r.insight = "Partial innovation plans. Investors want to see a 12-month roadmap that compounds your competitive advantage.";
        } else {
            r.insight = "No clear innovation pipeline. Without continuous improvement, early advantages erode quickly.";
        }

        r.score = Math.min(3, Math.max(0, score));
        r.confidence = computeConfidence(r.score, 3);
        r.status = deriveModuleStatus(r.score);
        return r;
    }

    // ───────────────────────────────────────────────────────────
    //  MODULE 5 — Buildability
    // ───────────────────────────────────────────────────────────

    private ModuleResult scoreBuildability(Map<String, Object> a) {
        ModuleResult r = new ModuleResult("Buildability");

        String mvpConstruction = str(a, "buildability_mvp_construction");
        String currentStage = str(a, "buildability_current_stage");
        String fundingDependency = str(a, "buildability_funding_dependency");

        // Team coverage from buildability_role_coverage
        @SuppressWarnings("unchecked")
        Map<String, String> roleCoverage = a.get("buildability_role_coverage") instanceof Map
                ? (Map<String, String>) a.get("buildability_role_coverage")
                : Map.of();

        // Team profiles
        @SuppressWarnings("unchecked")
        List<Map<String, String>> teamProfiles = a.get("buildability_team_profiles") instanceof List
                ? (List<Map<String, String>>) a.get("buildability_team_profiles")
                : List.of();

        int score = 0;

        // MVP construction
        if ("built_internally".equalsIgnoreCase(mvpConstruction)
                || "in_house".equalsIgnoreCase(mvpConstruction)) {
            score += 1;
        } else if ("outsourced".equalsIgnoreCase(mvpConstruction)
                || "freelancer".equalsIgnoreCase(mvpConstruction)) {
            // no bonus
        } else if ("not_started".equalsIgnoreCase(mvpConstruction)) {
            // no bonus
        }

        // Startup stage progress
        if ("launched".equalsIgnoreCase(currentStage) || "LAUNCHED".equalsIgnoreCase(currentStage)) {
            score += 2;
        } else if ("beta_with_users".equalsIgnoreCase(currentStage) || "BETA_WITH_USERS".equalsIgnoreCase(currentStage)) {
            score += 2;
        } else if ("mvp_prototype".equalsIgnoreCase(currentStage) || "MVP_PROTOTYPE".equalsIgnoreCase(currentStage)) {
            score += 1;
        } else if ("pre_mvp".equalsIgnoreCase(currentStage) || "PRE_MVP".equalsIgnoreCase(currentStage)) {
            // no bonus
        }

        // Funding dependency
        if ("no_funding_needed".equalsIgnoreCase(fundingDependency)
                || "bootstrapped".equalsIgnoreCase(fundingDependency)) {
            if (score < 3) score += 1;
            r.insight = "Bootstrapped or self-funded — this shows strong execution capability and reduces investor risk.";
        } else if ("need_funding_to_start".equalsIgnoreCase(fundingDependency)) {
            r.warnings.add("Funding Illusion — needing funding before starting indicates execution risk. Investors prefer teams that can build first, raise later.");
            r.insight = "High funding dependency. Demonstrating progress without external capital significantly increases investability.";
        } else {
            r.insight = "Moderate funding dependency. Show investors you can achieve key milestones with current resources.";
        }

        // Team coverage analysis
        Set<String> coveredRoles = new HashSet<>();
        for (Map.Entry<String, String> entry : roleCoverage.entrySet()) {
            if (entry.getValue() != null && !entry.getValue().isBlank()
                    && !"none".equalsIgnoreCase(entry.getValue())) {
                coveredRoles.add(entry.getKey());
            }
        }

        // Key roles: tech, business, domain
        boolean hasTech = coveredRoles.stream().anyMatch(r2 ->
                r2.toLowerCase().contains("tech") || r2.toLowerCase().contains("engineer")
                || r2.toLowerCase().contains("developer") || r2.toLowerCase().contains("cto"));
        boolean hasBusiness = coveredRoles.stream().anyMatch(r2 ->
                r2.toLowerCase().contains("business") || r2.toLowerCase().contains("marketing")
                || r2.toLowerCase().contains("sales") || r2.toLowerCase().contains("ceo"));

        if (!hasTech && score > 1) {
            score -= 1;
            r.warnings.add("No technical co-founder or team member identified — this is a common red flag for investors.");
        }

        r.score = Math.min(3, Math.max(0, score));
        r.confidence = computeConfidence(r.score, 3);
        r.status = deriveModuleStatus(r.score);
        return r;
    }

    // ───────────────────────────────────────────────────────────
    //  HELPERS
    // ───────────────────────────────────────────────────────────

    private Map<String, Object> parseAnswers(String json) {
        if (json == null || json.isBlank()) return Map.of();
        try {
            return objectMapper.readValue(json, new TypeReference<Map<String, Object>>() {});
        } catch (JsonProcessingException e) {
            log.error("Error parsing validation answers JSON", e);
            return Map.of();
        }
    }

    private String str(Map<String, Object> map, String key) {
        Object val = map.get(key);
        return val != null ? val.toString() : "";
    }

    private double num(Map<String, Object> map, String key) {
        Object val = map.get(key);
        if (val instanceof Number) return ((Number) val).doubleValue();
        if (val instanceof String) {
            try { return Double.parseDouble((String) val); } catch (NumberFormatException e) { return 0; }
        }
        return 0;
    }

    private int computeConfidence(int score, int max) {
        // Map score to confidence: 0->25, 1->50, 2->75, 3->95
        if (score >= max) return 95;
        if (score == max - 1) return 75;
        if (score == max - 2) return 50;
        return 25;
    }

    private String deriveModuleStatus(int score) {
        return switch (score) {
            case 3 -> "Strong";
            case 2 -> "Moderate";
            case 1 -> "Weak";
            default -> "Critical";
        };
    }

    private String deriveOverallStatus(int score, boolean hasFatalZero) {
        if (hasFatalZero) return "Needs Critical Fixes";
        if (score >= 90) return "Investor Ready";
        if (score >= 75) return "Strong Foundation";
        if (score >= 60) return "Developing";
        return "Early Stage";
    }

    private void collectStrengthsWeaknesses(ModuleResult mod, String name,
            List<String> strengths, List<String> weaknesses) {
        if (mod.score >= 2) {
            strengths.add(name + ": " + (mod.insight != null ? mod.insight : mod.status));
        } else if (mod.score <= 1) {
            weaknesses.add(name + ": " + (mod.insight != null ? mod.insight : mod.status));
        }
    }

    private String deriveNextStep(ModuleResult cvp, ModuleResult market,
            ModuleResult acquisition, ModuleResult defensibility,
            ModuleResult buildability, boolean hasFatalZero) {
        if (hasFatalZero) {
            // Find the zero module
            if (cvp.score == 0) return "Focus on validating your value proposition — talk to 10 potential customers this week.";
            if (market.score == 0) return "Research your market size urgently — you need evidence that your TAM supports ₹10Cr revenue.";
            if (acquisition.score == 0) return "Define your customer acquisition channel — identify and reach 10 target customers.";
            if (defensibility.score == 0) return "Develop a defensibility strategy — what prevents competitors from copying you in 6 months?";
            if (buildability.score == 0) return "Build your core team — you need technical capability to execute on your vision.";
        }

        // Find weakest module
        ModuleResult weakest = cvp;
        if (market.score < weakest.score) weakest = market;
        if (acquisition.score < weakest.score) weakest = acquisition;
        if (defensibility.score < weakest.score) weakest = defensibility;
        if (buildability.score < weakest.score) weakest = buildability;

        return "Strengthen your " + weakest.name.toLowerCase() + " — this is currently your biggest gap.";
    }

    private Map<String, Object> moduleToMap(ModuleResult mod) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("name", mod.name);
        m.put("confidence", mod.confidence);
        m.put("status", mod.status);
        m.put("insight", mod.insight);
        m.put("warnings", mod.warnings);
        return m;
    }

    // ───────────────────────────────────────────────────────────
    //  INTERNAL MODEL
    // ───────────────────────────────────────────────────────────

    private static class ModuleResult {
        String name;
        int score = 0;        // 0-3 (NEVER exposed to frontend)
        int confidence = 25;  // % exposed
        String status = "Critical";
        String insight = "";
        List<String> warnings = new ArrayList<>();

        ModuleResult(String name) { this.name = name; }
    }
}
