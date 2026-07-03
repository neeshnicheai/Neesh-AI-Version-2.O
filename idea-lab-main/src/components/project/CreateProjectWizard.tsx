import { useState, useCallback, useEffect } from "react";
import { X, Rocket, FileEdit, ArrowRight, Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import SpotlightQuestion from "./SpotlightQuestion";
import { type CreateProjectInput, type Project, type UpdateProjectInput } from "@/hooks/useProjects";
import { type UpdateBlogInput, type CustomField } from "@/hooks/useBlogs";
import { toast } from "sonner";

// ─── Constants ────────────────────────────────────────────────
const INDUSTRIES = [
  "SaaS", "Fintech", "HealthTech", "EdTech", "E-Commerce",
  "AI / ML", "CleanTech", "FoodTech", "Logistics",
  "Social Media", "Gaming", "Real Estate", "Travel",
  "Media & Entertainment", "Other",
];

const STARTUP_STAGES = [
  { value: "IDEA", label: "Idea" },
  { value: "PRE_MVP", label: "Pre-MVP" },
  { value: "MVP_PROTOTYPE", label: "MVP / Prototype" },
  { value: "BETA_WITH_USERS", label: "Beta with Users" },
  { value: "LAUNCHED", label: "Launched" },
];

const EARLY_STAGES = ["IDEA", "PRE_MVP", "MVP_PROTOTYPE"];
const LATER_STAGES = ["BETA_WITH_USERS", "LAUNCHED"];

// ─── Question types ────────────────────────────────────────────
type QuestionInputType = "textarea" | "mcq" | "numeric" | "checkbox" | "team_builder" | "role_mapper";

interface WizardQuestion {
  id: string;
  title: string;
  description: string;
  placeholder: string;
  inputType: QuestionInputType;
  // For blog auto-population
  sectionTitle?: string;
  blogField?: boolean;
  fieldType?: string; // "spotlight_section" | "spotlight_links"
  // For MCQ / checkbox
  options?: { value: string; label: string }[];
  // For validation answer key
  validationKey?: string;
}

// ─── All questions in document order ───────────────────────────
const ALL_QUESTIONS: WizardQuestion[] = [
  // 1. Problem Story (Blog)
  {
    id: "problem_story",
    title: "Problem Story",
    description: "Describe a real situation where someone experienced this problem. What were they trying to do, what went wrong, and what was the outcome?",
    placeholder: "Explain your problem statement in brief",
    inputType: "textarea",
    sectionTitle: "The Problem",
    blogField: true,
  },
  // 2. Why This Happens (Blog)
  {
    id: "why_this_happens",
    title: "Why This Happens",
    description: "In your opinion, what is the root cause of this problem, and why haven't existing solutions solved it effectively?",
    placeholder: "Describe the root cause and why existing solutions fall short",
    inputType: "textarea",
    sectionTitle: "Root Cause Analysis",
    blogField: true,
  },
  // 3. CVP Q1: Customer Alternative
  {
    id: "cvp_customer_alternative",
    title: "What does your customer do today?",
    description: "How are your potential customers currently dealing with the problem you're solving?",
    placeholder: "",
    inputType: "mcq",
    validationKey: "cvp_customer_alternative",
    options: [
      { value: "competitor_product", label: "They use a competitor's product or service" },
      { value: "manual_workaround", label: "They use manual workarounds (spreadsheets, pen & paper, etc.)" },
      { value: "internal_tool", label: "They have built an internal tool or process" },
      { value: "do_nothing", label: "They do nothing — they tolerate the problem" },
      { value: "free_tools", label: "They use free / open-source tools" },
    ],
  },
  // 4. CVP Q2: Value driver
  {
    id: "cvp_value_driver",
    title: "What is the primary value you offer?",
    description: "What is the single most important improvement your solution delivers compared to existing alternatives?",
    placeholder: "",
    inputType: "mcq",
    validationKey: "cvp_value_driver",
    options: [
      { value: "save_time", label: "Saves significant time (speed / automation)" },
      { value: "save_money", label: "Saves money (lower cost)" },
      { value: "better_quality", label: "Better quality / accuracy" },
      { value: "new_capability", label: "Enables something previously impossible" },
      { value: "convenience", label: "More convenient / easier to use" },
    ],
  },
  // 5. CVP Q3: Current solution cost
  {
    id: "cvp_current_solution_cost",
    title: "Cost of the Current Solution",
    description: "How much does your target customer currently spend (per month or per year) on the problem or existing solution?",
    placeholder: "Enter amount in ₹ (e.g., 50000)",
    inputType: "numeric",
    validationKey: "cvp_current_solution_cost",
  },
  // 6. Current Solutions & Limitations (Blog)
  {
    id: "current_solutions",
    title: "Current Solutions",
    description: "How are people solving this problem today, and what are the biggest limitations or frustrations with those approaches?",
    placeholder: "Describe the current solutions and their limitations",
    inputType: "textarea",
    sectionTitle: "Existing Solutions & Gaps",
    blogField: true,
  },
  // 7. Our Solution (Blog)
  {
    id: "our_solution",
    title: "Our Solution",
    description: "What are you building, who is it for, and how does it solve this problem differently from existing solutions?",
    placeholder: "Describe your solution and how it's different",
    inputType: "textarea",
    sectionTitle: "What We're Building",
    blogField: true,
  },
  // 8. CVP Q4: MVP cost
  {
    id: "cvp_mvp_cost",
    title: "Your Solution's Price Point",
    description: "How much will your solution cost the customer (per month or per year)? Use the same time period as the previous cost question.",
    placeholder: "Enter amount in ₹ (e.g., 5000)",
    inputType: "numeric",
    validationKey: "cvp_mvp_cost",
  },
  // 9. CVP Q5: Source of numbers
  {
    id: "cvp_source_of_numbers",
    title: "How confident are you in these numbers?",
    description: "What is the basis for the cost figures and improvement claims you've stated?",
    placeholder: "",
    inputType: "mcq",
    validationKey: "cvp_source_of_numbers",
    options: [
      { value: "validated_data", label: "Based on real customer data / pilot results" },
      { value: "market_research", label: "Based on published market research" },
      { value: "competitor_pricing", label: "Based on competitor pricing" },
      { value: "expert_interviews", label: "Based on expert / mentor interviews" },
      { value: "guess", label: "Educated guess / assumption" },
    ],
  },
  // 10. Product Walkthrough (Blog)
  {
    id: "product_walkthrough",
    title: "How It Works",
    description: "Walk us through how a customer would use your product from start to finish in the simplest possible way.",
    placeholder: "Walk us through the customer journey step by step",
    inputType: "textarea",
    sectionTitle: "Product Walkthrough",
    blogField: true,
  },
  // 11. Target Customer (Blog)
  {
    id: "target_customer",
    title: "Target Customer",
    description: "Who is your primary target customer? (Who requires your product)",
    placeholder: "Describe your ideal customer profile",
    inputType: "textarea",
    sectionTitle: "Who It's For",
    blogField: true,
  },
  // 12. Market Q1: How customers solve today
  {
    id: "market_how_solve_today",
    title: "How are customers solving this problem today?",
    description: "At a market level, what is the dominant behavior pattern for addressing this problem?",
    placeholder: "",
    inputType: "mcq",
    validationKey: "market_how_solve_today",
    options: [
      { value: "paying_solution", label: "Most people pay for an existing product / service" },
      { value: "free_alternative", label: "Most people use a free alternative" },
      { value: "manual_process", label: "Most people handle it manually" },
      { value: "do_nothing", label: "Most people do nothing" },
    ],
  },
  // 13. Market Q2: Behavioral change
  {
    id: "market_behavioral_change",
    title: "How much behavioral change is required?",
    description: "How significantly will your customers need to change their current habits or workflow to adopt your solution?",
    placeholder: "",
    inputType: "mcq",
    validationKey: "market_behavioral_change",
    options: [
      { value: "none", label: "No change — it's a drop-in replacement" },
      { value: "low", label: "Minimal change — a small learning curve" },
      { value: "medium", label: "Moderate change — new workflow but familiar concepts" },
      { value: "high", label: "Major change — completely new way of doing things" },
    ],
  },
  // 14. Market Q3: Currently spending money
  {
    id: "market_spending_money",
    title: "Are customers currently spending money?",
    description: "Are your target customers already paying for a solution to this problem (even an imperfect one)?",
    placeholder: "",
    inputType: "mcq",
    validationKey: "market_spending_money",
    options: [
      { value: "yes", label: "Yes — they already pay for existing solutions" },
      { value: "some", label: "Some do, some don't" },
      { value: "no", label: "No — nobody pays for this today" },
    ],
  },
  // 15. Market Q4: Annual spend
  {
    id: "market_annual_spend",
    title: "Average Annual Customer Spend",
    description: "How much does (or will) a single customer pay per year for your solution?",
    placeholder: "Enter amount in ₹ per year (e.g., 60000)",
    inputType: "numeric",
    validationKey: "market_annual_spend",
  },
  // 16. Market Q5: Target market size
  {
    id: "market_target_size",
    title: "How large is your target market?",
    description: "Based on the customer spend you just entered, how many potential customers can you address?",
    placeholder: "",
    inputType: "mcq",
    validationKey: "market_target_size",
    options: [
      { value: "very_large", label: "Very large — millions of potential customers" },
      { value: "large", label: "Large — hundreds of thousands of customers" },
      { value: "medium", label: "Medium — tens of thousands of customers" },
      { value: "small", label: "Small — thousands of customers" },
      { value: "niche", label: "Niche — hundreds of customers" },
    ],
  },
  // 17. Market Q6: Launch geography
  {
    id: "market_launch_geography",
    title: "Where will you launch first?",
    description: "What is your initial target geography for the first 12 months?",
    placeholder: "",
    inputType: "mcq",
    validationKey: "market_launch_geography",
    options: [
      { value: "metro", label: "Metro cities (Tier 1 — Bangalore, Mumbai, Delhi, etc.)" },
      { value: "tier2", label: "Tier 2 cities (Pune, Jaipur, Lucknow, etc.)" },
      { value: "tier2_tier3", label: "Tier 2 & Tier 3 cities combined" },
      { value: "pan_india", label: "Pan-India from day one" },
      { value: "global", label: "Global / International market" },
    ],
  },
  // 18. Founder Story (Blog)
  {
    id: "founder_story",
    title: "Founder Story",
    description: "What personal experience, observation, or event motivated you to build this startup?",
    placeholder: "Share the story behind why you started building this",
    inputType: "textarea",
    sectionTitle: "The Founder's Story",
    blogField: true,
  },
  // 19. Acquisition Q0: Social media presence
  {
    id: "acquisition_social_media",
    title: "Your Online Presence",
    description: "Which platforms do you actively use to share content or engage with your audience? Select all that apply.",
    placeholder: "",
    inputType: "checkbox",
    validationKey: "acquisition_social_media",
    blogField: true,
    sectionTitle: "Online Presence",
    fieldType: "spotlight_links",
    options: [
      { value: "twitter", label: "Twitter / X" },
      { value: "linkedin", label: "LinkedIn" },
      { value: "instagram", label: "Instagram" },
      { value: "youtube", label: "YouTube" },
      { value: "website", label: "Personal Website / Blog" },
      { value: "reddit", label: "Reddit" },
      { value: "whatsapp_community", label: "WhatsApp Community" },
      { value: "none", label: "No active online presence" },
    ],
  },
  // 20. Acquisition Q1: Initial trust channel
  {
    id: "acquisition_trust_channel",
    title: "How will customers first trust you?",
    description: "What is the primary channel through which your first 10-50 customers will discover and trust your product?",
    placeholder: "",
    inputType: "mcq",
    validationKey: "acquisition_trust_channel",
    options: [
      { value: "direct_outreach", label: "Direct outreach (cold emails, DMs, calls)" },
      { value: "community", label: "Community (forums, groups, events)" },
      { value: "referral", label: "Word-of-mouth / referrals" },
      { value: "content_marketing", label: "Content marketing (blogs, videos)" },
      { value: "paid_ads", label: "Paid advertising" },
      { value: "partnerships", label: "Partnerships / collaborations" },
    ],
  },
  // 21. Acquisition Q2: Can identify 10 people
  {
    id: "acquisition_identify_10",
    title: "Can you name 10 potential customers?",
    description: "Right now, can you identify 10 specific people (by name) who fit your ideal customer profile and would want your product?",
    placeholder: "",
    inputType: "mcq",
    validationKey: "acquisition_identify_10",
    options: [
      { value: "yes", label: "Yes — I can name them right now" },
      { value: "some", label: "I can name a few but not 10" },
      { value: "no", label: "No — I haven't identified specific people yet" },
    ],
  },
  // 22. The Hook (Blog)
  {
    id: "the_hook",
    title: "The Hook",
    description: "What's the one surprising fact, observation, or insight about this problem that would immediately make your ideal customer stop and read?",
    placeholder: "Write your hook — one powerful insight or fact",
    inputType: "textarea",
    sectionTitle: "The Hook",
    blogField: true,
  },
  // 23. Acquisition Q3: Trust driver
  {
    id: "acquisition_trust_driver",
    title: "What makes customers trust you?",
    description: "What is the single strongest reason a customer would trust you over alternatives?",
    placeholder: "",
    inputType: "mcq",
    validationKey: "acquisition_trust_driver",
    options: [
      { value: "expertise", label: "Deep domain expertise / credentials" },
      { value: "track_record", label: "Proven track record / past success" },
      { value: "social_proof", label: "Social proof (testimonials, case studies, press)" },
      { value: "brand", label: "Strong personal brand / audience" },
      { value: "technology", label: "Unique technology / IP" },
      { value: "price", label: "Best price / free tier" },
    ],
  },
  // 24. Acquisition Q4: Founder/team description
  {
    id: "acquisition_founder_description",
    title: "How would you describe yourself?",
    description: "Which best describes your background and credibility relative to the problem you're solving?",
    placeholder: "",
    inputType: "mcq",
    validationKey: "acquisition_founder_description",
    options: [
      { value: "domain_expert", label: "Domain expert — I've worked in this industry for years" },
      { value: "serial_entrepreneur", label: "Serial entrepreneur — I've built and scaled companies before" },
      { value: "technical_expert", label: "Technical expert — I have deep tech skills relevant to this" },
      { value: "passionate_outsider", label: "Passionate outsider — new to this industry but deeply motivated" },
      { value: "academic_researcher", label: "Academic / researcher — coming from a research background" },
    ],
  },
  // 25. Acquisition Q5: Customer validation
  {
    id: "acquisition_customer_validation",
    title: "What customer validation do you have?",
    description: "What is the strongest evidence you have that people will pay for your solution?",
    placeholder: "",
    inputType: "mcq",
    validationKey: "acquisition_customer_validation",
    options: [
      { value: "paying_customers", label: "We have paying customers" },
      { value: "users_no_revenue", label: "We have users but no revenue yet" },
      { value: "waitlist", label: "We have a waitlist / signed LOIs" },
      { value: "interested", label: "People have told us they're interested" },
      { value: "none", label: "No validation yet — just our conviction" },
    ],
  },
  // 26. Defensibility Q1: Competitor protection
  {
    id: "defensibility_competitor_protection",
    title: "What protects you from competitors?",
    description: "If a well-funded competitor decided to copy your idea today, what is your strongest defense?",
    placeholder: "",
    inputType: "mcq",
    validationKey: "defensibility_competitor_protection",
    options: [
      { value: "network_effects", label: "Network effects — the more users, the better it gets" },
      { value: "data_moat", label: "Proprietary data — unique dataset that's hard to replicate" },
      { value: "patent", label: "Patent / IP protection" },
      { value: "trade_secret", label: "Trade secret / proprietary process" },
      { value: "brand", label: "Brand loyalty and switching costs" },
      { value: "speed", label: "Execution speed — we move faster than anyone" },
      { value: "none", label: "Honestly, not much yet" },
    ],
  },
  // 27. Defensibility Q2: Entry barriers
  {
    id: "defensibility_entry_barriers",
    title: "How hard is it for a new entrant?",
    description: "How difficult would it be for a new team to build what you've built from scratch?",
    placeholder: "",
    inputType: "mcq",
    validationKey: "defensibility_entry_barriers",
    options: [
      { value: "high", label: "Very hard — requires years of data, relationships, or R&D" },
      { value: "medium", label: "Moderately hard — requires significant effort and expertise" },
      { value: "low", label: "Relatively easy — a good team could replicate in months" },
    ],
  },
  // 28. Defensibility Q3: Continuous innovation
  {
    id: "defensibility_continuous_innovation",
    title: "How will you stay ahead?",
    description: "What is your plan for continuous innovation over the next 12-18 months?",
    placeholder: "",
    inputType: "mcq",
    validationKey: "defensibility_continuous_innovation",
    options: [
      { value: "strong_roadmap", label: "We have a detailed product roadmap that compounds our advantage" },
      { value: "some_plans", label: "We have some plans but nothing concrete yet" },
      { value: "no_plans", label: "We haven't thought this far ahead" },
    ],
  },
  // 29. Buildability Q1: Team profiles
  {
    id: "buildability_team_profiles",
    title: "Your Founding Team",
    description: "Add each team member's name, role, and core skill. Include yourself.",
    placeholder: "",
    inputType: "team_builder",
    validationKey: "buildability_team_profiles",
  },
  // 30. Buildability Q2: Role coverage
  {
    id: "buildability_role_coverage",
    title: "Team Role Coverage",
    description: "For each critical function below, select the team member who covers it. Leave blank if no one covers it.",
    placeholder: "",
    inputType: "role_mapper",
    validationKey: "buildability_role_coverage",
  },
  // 31. Buildability Q3: MVP construction
  {
    id: "buildability_mvp_construction",
    title: "How will / did you build the MVP?",
    description: "What is your primary approach for building the first version of your product?",
    placeholder: "",
    inputType: "mcq",
    validationKey: "buildability_mvp_construction",
    options: [
      { value: "built_internally", label: "Built in-house by the founding team" },
      { value: "outsourced", label: "Outsourced to a development agency / freelancer" },
      { value: "no_code", label: "No-code / low-code tools" },
      { value: "not_started", label: "Haven't started building yet" },
    ],
  },
  // 32. Buildability Q4: Current stage
  {
    id: "buildability_current_stage",
    title: "Where are you right now?",
    description: "What stage best describes your startup today?",
    placeholder: "",
    inputType: "mcq",
    validationKey: "buildability_current_stage",
    options: [
      { value: "IDEA", label: "Idea stage — concept only" },
      { value: "PRE_MVP", label: "Pre-MVP — building the first version" },
      { value: "MVP_PROTOTYPE", label: "MVP / Prototype — built but no real users" },
      { value: "BETA_WITH_USERS", label: "Beta with users — active users testing" },
      { value: "LAUNCHED", label: "Launched — live product with real customers" },
    ],
  },
  // 33. Buildability Q5: Funding dependency
  {
    id: "buildability_funding_dependency",
    title: "How dependent are you on funding?",
    description: "Can you continue building and acquiring customers without external funding?",
    placeholder: "",
    inputType: "mcq",
    validationKey: "buildability_funding_dependency",
    options: [
      { value: "bootstrapped", label: "No external funding needed — bootstrapped / self-funded" },
      { value: "funded_optional", label: "Funding would accelerate but isn't required" },
      { value: "need_funding_to_scale", label: "Need funding to scale, but can survive without it" },
      { value: "need_funding_to_start", label: "Cannot proceed without external funding" },
    ],
  },
  // 34. Vision (Blog)
  {
    id: "vision",
    title: "Vision",
    description: "If your startup succeeds, what meaningful change will it create for your customers or the industry over the next few years?",
    placeholder: "Describe the future you're building towards",
    inputType: "textarea",
    sectionTitle: "Our Vision",
    blogField: true,
  },
  // 35. Call to Action (Blog)
  {
    id: "call_to_action",
    title: "Call to Action",
    description: "What's the one thing you'd want someone reading your spotlight to do next? Join a waitlist, try a demo, follow you, share feedback?",
    placeholder: "Write your call to action",
    inputType: "textarea",
    sectionTitle: "Get Involved",
    blogField: true,
  },
];

// ─── Types ────────────────────────────────────────────────────
type WizardStep = "basic_info" | "path_selection" | "questions";

interface TeamMember {
  name: string;
  role: string;
  skill: string;
}

const CRITICAL_ROLES = [
  "Technology / Engineering",
  "Business / Sales",
  "Marketing / Growth",
  "Design / UX",
  "Domain Expertise",
  "Operations",
];

interface CreateProjectWizardProps {
  project?: Project | null;
  onClose: () => void;
  createProject: (input: CreateProjectInput) => Promise<Project | null>;
  updateProject: (id: string, input: UpdateProjectInput) => Promise<Project | null>;
  upsertBlog: (projectId: string, input: UpdateBlogInput) => Promise<any>;
  onProjectCreated: (project: Project) => void;
  canCreateProject: boolean;
}

// ─── Component ────────────────────────────────────────────────
const CreateProjectWizard = ({
  project = null,
  onClose,
  createProject,
  updateProject,
  upsertBlog,
  onProjectCreated,
  canCreateProject,
}: CreateProjectWizardProps) => {
  // Step tracking
  const [step, setStep] = useState<WizardStep>("basic_info");
  const [questionIndex, setQuestionIndex] = useState(0);

  // Basic info
  const [projectName, setProjectName] = useState("");
  const [oneLineDesc, setOneLineDesc] = useState("");
  const [industry, setIndustry] = useState("");
  const [startupStage, setStartupStage] = useState("");

  // Question answers — keyed by question id
  const [answers, setAnswers] = useState<Record<string, any>>({});

  // Team builder state
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([{ name: "", role: "", skill: "" }]);
  const [roleMappings, setRoleMappings] = useState<Record<string, string>>({});

  // Created project
  const [createdProject, setCreatedProject] = useState<Project | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Restore answers if resuming an existing project
  useEffect(() => {
    if (project) {
      setCreatedProject(project);
      setProjectName(project.title);
      setOneLineDesc(project.one_line_summary || "");
      setIndustry(project.industry || "");
      setStartupStage(project.startup_stage || "");

      if (project.validation_report) {
        // Already validated, but let's load validation answers to be sure
      }

      const rawAnswers = project.validation_report ? "" : ""; // dummy to satisfy linter
      
      if (project.validation_report === null || project.validation_report === undefined || project.validation_report === "" || project.validation_report === "{}") {
        // Questionnaire is incomplete
        if (project.validation_answers) {
          try {
            const parsed = JSON.parse(project.validation_answers);
            const initialAnswers: Record<string, any> = {};

            ALL_QUESTIONS.forEach((q) => {
              if (q.validationKey && parsed[q.validationKey] !== undefined) {
                if (q.id === "buildability_team_profiles") {
                  if (Array.isArray(parsed[q.validationKey]) && parsed[q.validationKey].length > 0) {
                    setTeamMembers(parsed[q.validationKey]);
                  }
                } else if (q.id === "buildability_role_coverage") {
                  if (parsed[q.validationKey]) {
                    setRoleMappings(parsed[q.validationKey]);
                  }
                } else {
                  initialAnswers[q.id] = parsed[q.validationKey];
                }
              }
            });

            setAnswers(initialAnswers);

            // Find first unanswered question
            let firstUnanswered = 0;
            for (let i = 0; i < ALL_QUESTIONS.length; i++) {
              const q = ALL_QUESTIONS[i];
              let hasAnswer = false;

              if (q.id === "buildability_team_profiles") {
                const profiles = parsed["buildability_team_profiles"];
                hasAnswer = Array.isArray(profiles) && profiles.some((m: any) => m.name && m.name.trim());
              } else if (q.id === "buildability_role_coverage") {
                const coverage = parsed["buildability_role_coverage"];
                hasAnswer = coverage && Object.keys(coverage).length > 0;
              } else if (q.inputType === "checkbox") {
                const val = parsed[q.validationKey || ""];
                hasAnswer = Array.isArray(val) && val.length > 0;
              } else {
                const val = parsed[q.validationKey || ""];
                hasAnswer = val !== undefined && val !== null && String(val).trim() !== "";
              }

              if (!hasAnswer) {
                firstUnanswered = i;
                break;
              }
            }

            setQuestionIndex(firstUnanswered);
            setStep("questions");
          } catch (e) {
            console.error("Error parsing validation answers", e);
            setStep("questions");
          }
        } else {
          setStep("questions");
        }
      }
    }
  }, [project]);

  // ─── Helpers ─────────────────────────────────────────────
  const currentQuestion = ALL_QUESTIONS[questionIndex];
  const isLastQuestion = questionIndex === ALL_QUESTIONS.length - 1;

  const getAnswerValue = (questionId: string): any => {
    if (questionId === "buildability_team_profiles") return teamMembers;
    if (questionId === "buildability_role_coverage") return roleMappings;
    return answers[questionId] || "";
  };

  const setAnswerValue = (questionId: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  // Build the validation answers JSON from all answers
  const buildValidationAnswersJson = (): string => {
    const validationData: Record<string, any> = {};
    ALL_QUESTIONS.forEach((q) => {
      if (q.validationKey) {
        if (q.id === "buildability_team_profiles") {
          validationData[q.validationKey] = teamMembers.filter((m) => m.name.trim());
        } else if (q.id === "buildability_role_coverage") {
          validationData[q.validationKey] = roleMappings;
        } else if (q.inputType === "checkbox") {
          validationData[q.validationKey] = answers[q.id] || [];
        } else {
          validationData[q.validationKey] = answers[q.id] || "";
        }
      }
    });
    return JSON.stringify(validationData);
  };

  // Build blog custom fields from blog answers
  const generateCustomFields = (): CustomField[] => {
    const fields: CustomField[] = [];
    let order = 1;
    ALL_QUESTIONS.forEach((q) => {
      if (!q.blogField || !q.sectionTitle) return;
      const value = answers[q.id];
      if (!value || (typeof value === "string" && !value.trim())) return;

      if (q.inputType === "checkbox" && Array.isArray(value)) {
        fields.push({
          id: crypto.randomUUID(),
          type: q.fieldType || "spotlight_links",
          sectionTitle: q.sectionTitle,
          value: value.join(", "),
          order: order++,
        });
      } else {
        fields.push({
          id: crypto.randomUUID(),
          type: q.fieldType || "spotlight_section",
          sectionTitle: q.sectionTitle,
          value: String(value),
          order: order++,
        });
      }
    });
    return fields;
  };

  const saveBlog = useCallback(
    async (project: Project) => {
      const customFields = generateCustomFields();
      await upsertBlog(project.id, {
        heading: project.title,
        introduction: oneLineDesc,
        content: "",
        custom_fields: customFields,
      });
    },
    [upsertBlog, oneLineDesc, answers]
  );

  // ─── Step 1: Basic Info Submit ──────────────────────────
  const handleBasicInfoSubmit = async () => {
    if (!projectName.trim()) { toast.error("Please enter a project name"); return; }
    if (!oneLineDesc.trim()) { toast.error("Please enter a one-sentence description"); return; }
    if (!industry) { toast.error("Please select an industry"); return; }
    if (!startupStage) { toast.error("Please select a startup stage"); return; }

    setIsCreating(true);
    try {
      const project = await createProject({
        title: projectName,
        one_line_summary: oneLineDesc,
        introduction: oneLineDesc,
        description: "",
        industry,
        startup_stage: startupStage,
      });
      if (!project) { setIsCreating(false); return; }
      setCreatedProject(project);

      if (LATER_STAGES.includes(startupStage)) {
        setStep("path_selection");
      } else {
        setStep("questions");
      }
    } catch {
      toast.error("Failed to create project");
    } finally {
      setIsCreating(false);
    }
  };

  // ─── Step 2: Path Selection ─────────────────────────────
  const handlePathSelection = async (path: "structured" | "manual") => {
    if (path === "structured") {
      setStep("questions");
    } else {
      if (createdProject) {
        setIsSaving(true);
        try {
          const updated = await updateProject(createdProject.id, { onboarding_completed: true });
          if (updated) onProjectCreated(updated);
        } catch {
          toast.error("Failed to choose path. Please try again.");
        } finally {
          setIsSaving(false);
        }
      }
    }
  };

  // ─── Step 3: Question navigation ───────────────────────
  const handleQuestionNext = async () => {
    if (!createdProject) return;

    // Validate required
    const q = currentQuestion;
    if (q.inputType === "textarea") {
      if (!answers[q.id]?.trim()) { toast.error("Please answer this question"); return; }
    } else if (q.inputType === "mcq") {
      if (!answers[q.id]) { toast.error("Please select an option"); return; }
    } else if (q.inputType === "numeric") {
      if (!answers[q.id] && answers[q.id] !== 0) { toast.error("Please enter a value"); return; }
    }

    setIsSaving(true);
    try {
      // Incremental blog save on every step
      await saveBlog(createdProject);

      const validationJson = buildValidationAnswersJson();

      if (isLastQuestion) {
        // Final step: submit validation answers and complete onboarding
        const updated = await updateProject(createdProject.id, {
          validation_answers: validationJson,
          onboarding_completed: true,
        });
        if (updated) onProjectCreated(updated);
      } else {
        // Incremental validation save
        await updateProject(createdProject.id, {
          validation_answers: validationJson,
          onboarding_completed: false,
        });
        setQuestionIndex((prev) => prev + 1);
      }
    } catch {
      toast.error("Failed to save. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleQuestionBack = () => {
    if (questionIndex > 0) {
      setQuestionIndex((prev) => prev - 1);
    } else {
      if (LATER_STAGES.includes(startupStage)) {
        setStep("path_selection");
      } else {
        setStep("basic_info");
      }
    }
  };

  // ─── Custom Inputs ─────────────────────────────────────
  const renderMCQ = (q: WizardQuestion) => (
    <div className="space-y-3 w-full">
      {q.options?.map((opt) => {
        const selected = answers[q.id] === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => setAnswerValue(q.id, opt.value)}
            className="w-full text-left px-5 py-4 rounded-xl border-2 transition-all duration-200 flex items-center gap-3"
            style={{
              borderColor: selected ? "hsl(190, 85%, 38%)" : "hsl(210, 15%, 88%)",
              backgroundColor: selected ? "hsl(190, 85%, 96%)" : "white",
              boxShadow: selected ? "0 2px 12px rgba(9, 218, 237, 0.12)" : "none",
            }}
          >
            <div
              className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
              style={{
                borderColor: selected ? "hsl(190, 85%, 38%)" : "hsl(210, 15%, 78%)",
                backgroundColor: selected ? "hsl(190, 85%, 38%)" : "transparent",
              }}
            >
              {selected && <div className="w-2 h-2 rounded-full bg-white" />}
            </div>
            <span className="text-sm font-medium text-gray-800">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );

  const renderCheckbox = (q: WizardQuestion) => {
    const selected: string[] = Array.isArray(answers[q.id]) ? answers[q.id] : [];
    const toggle = (val: string) => {
      if (val === "none") {
        setAnswerValue(q.id, selected.includes("none") ? [] : ["none"]);
        return;
      }
      const without = selected.filter((v) => v !== "none");
      if (without.includes(val)) {
        setAnswerValue(q.id, without.filter((v) => v !== val));
      } else {
        setAnswerValue(q.id, [...without, val]);
      }
    };
    return (
      <div className="space-y-3 w-full">
        {q.options?.map((opt) => {
          const checked = selected.includes(opt.value);
          return (
            <button
              key={opt.value}
              onClick={() => toggle(opt.value)}
              className="w-full text-left px-5 py-4 rounded-xl border-2 transition-all duration-200 flex items-center gap-3"
              style={{
                borderColor: checked ? "hsl(190, 85%, 38%)" : "hsl(210, 15%, 88%)",
                backgroundColor: checked ? "hsl(190, 85%, 96%)" : "white",
              }}
            >
              <div
                className="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0"
                style={{
                  borderColor: checked ? "hsl(190, 85%, 38%)" : "hsl(210, 15%, 78%)",
                  backgroundColor: checked ? "hsl(190, 85%, 38%)" : "transparent",
                }}
              >
                {checked && (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <span className="text-sm font-medium text-gray-800">{opt.label}</span>
            </button>
          );
        })}
      </div>
    );
  };

  const renderNumeric = (q: WizardQuestion) => (
    <div className="relative w-full max-w-md mx-auto">
      <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 text-lg font-medium">₹</span>
      <input
        type="number"
        value={answers[q.id] || ""}
        onChange={(e) => setAnswerValue(q.id, e.target.value ? Number(e.target.value) : "")}
        placeholder={q.placeholder}
        className="w-full pl-10 pr-6 py-5 text-lg text-gray-800 bg-white rounded-2xl focus:outline-none transition-all duration-200 placeholder:text-gray-400"
        style={{
          border: "2px solid hsl(190, 85%, 55%)",
          boxShadow: "0 2px 12px rgba(9, 218, 237, 0.08)",
        }}
        onFocus={(e) => {
          e.target.style.border = "2px solid hsl(190, 85%, 38%)";
          e.target.style.boxShadow = "0 4px 20px rgba(9, 218, 237, 0.15)";
        }}
        onBlur={(e) => {
          e.target.style.border = "2px solid hsl(190, 85%, 55%)";
          e.target.style.boxShadow = "0 2px 12px rgba(9, 218, 237, 0.08)";
        }}
      />
    </div>
  );

  const renderTeamBuilder = () => (
    <div className="space-y-4 w-full">
      {teamMembers.map((member, idx) => (
        <div key={idx} className="flex gap-3 items-start">
          <div className="flex-1 space-y-2">
            <Input
              placeholder="Name"
              value={member.name}
              onChange={(e) => {
                const updated = [...teamMembers];
                updated[idx] = { ...updated[idx], name: e.target.value };
                setTeamMembers(updated);
              }}
              className="h-11 rounded-xl border-2"
              style={{ borderColor: "hsl(190, 85%, 75%)" }}
            />
          </div>
          <div className="flex-1 space-y-2">
            <Input
              placeholder="Role (e.g., CEO, CTO)"
              value={member.role}
              onChange={(e) => {
                const updated = [...teamMembers];
                updated[idx] = { ...updated[idx], role: e.target.value };
                setTeamMembers(updated);
              }}
              className="h-11 rounded-xl border-2"
              style={{ borderColor: "hsl(190, 85%, 75%)" }}
            />
          </div>
          <div className="flex-1 space-y-2">
            <Input
              placeholder="Core Skill"
              value={member.skill}
              onChange={(e) => {
                const updated = [...teamMembers];
                updated[idx] = { ...updated[idx], skill: e.target.value };
                setTeamMembers(updated);
              }}
              className="h-11 rounded-xl border-2"
              style={{ borderColor: "hsl(190, 85%, 75%)" }}
            />
          </div>
          {teamMembers.length > 1 && (
            <button
              onClick={() => setTeamMembers(teamMembers.filter((_, i) => i !== idx))}
              className="mt-2 text-gray-400 hover:text-red-500 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      ))}
      <button
        onClick={() => setTeamMembers([...teamMembers, { name: "", role: "", skill: "" }])}
        className="flex items-center gap-2 text-sm font-medium transition-colors"
        style={{ color: "hsl(190, 85%, 38%)" }}
      >
        <Plus className="w-4 h-4" /> Add Team Member
      </button>
    </div>
  );

  const renderRoleMapper = () => {
    const validMembers = teamMembers.filter((m) => m.name.trim());
    return (
      <div className="space-y-4 w-full">
        {CRITICAL_ROLES.map((role) => (
          <div key={role} className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700 w-48 flex-shrink-0">{role}</span>
            <Select
              value={roleMappings[role] || ""}
              onValueChange={(val) => setRoleMappings((prev) => ({ ...prev, [role]: val }))}
            >
              <SelectTrigger
                className="h-11 rounded-xl border-2 flex-1"
                style={{ borderColor: "hsl(190, 85%, 75%)" }}
              >
                <SelectValue placeholder="Select team member" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No one covers this</SelectItem>
                {validMembers.map((m) => (
                  <SelectItem key={m.name} value={m.name}>
                    {m.name} ({m.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>
    );
  };

  const getCustomInput = (q: WizardQuestion): React.ReactNode | undefined => {
    switch (q.inputType) {
      case "mcq": return renderMCQ(q);
      case "checkbox": return renderCheckbox(q);
      case "numeric": return renderNumeric(q);
      case "team_builder": return renderTeamBuilder();
      case "role_mapper": return renderRoleMapper();
      default: return undefined; // textarea uses default
    }
  };

  // Check if current question has a valid answer for enabling Next
  const isCurrentAnswered = (): boolean => {
    const q = currentQuestion;
    if (!q) return false;
    if (q.inputType === "textarea") return !!answers[q.id]?.trim();
    if (q.inputType === "mcq") return !!answers[q.id];
    if (q.inputType === "numeric") return answers[q.id] !== "" && answers[q.id] !== undefined;
    if (q.inputType === "checkbox") return Array.isArray(answers[q.id]) && answers[q.id].length > 0;
    if (q.inputType === "team_builder") return teamMembers.some((m) => m.name.trim());
    if (q.inputType === "role_mapper") return true; // optional
    return true;
  };

  // ─── Render: Basic Info ─────────────────────────────────
  if (step === "basic_info") {
    return (
      <div className="fixed inset-0 z-50 bg-white flex flex-col">
        <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <Rocket className="w-6 h-6" style={{ color: "hsl(190, 85%, 38%)" }} />
            <h2 className="text-xl font-bold text-gray-900">Create Your Spotlight</h2>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="w-full max-w-lg space-y-6">
            <div className="text-center space-y-2 mb-8">
              <h1 className="text-3xl md:text-4xl font-bold" style={{ color: "hsl(190, 85%, 38%)" }}>
                Tell us about your startup
              </h1>
              <p className="text-gray-500 text-base">A few quick details to get started</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Startup / Project Name *</label>
              <Input value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="e.g., Neesh AI" className="h-12 text-base rounded-xl border-2 focus:ring-0" style={{ borderColor: "hsl(190, 85%, 75%)" }} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">One-sentence Description *</label>
              <Input value={oneLineDesc} onChange={(e) => setOneLineDesc(e.target.value)} placeholder="Describe what your startup does in one sentence" className="h-12 text-base rounded-xl border-2 focus:ring-0" style={{ borderColor: "hsl(190, 85%, 75%)" }} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Industry *</label>
              <Select value={industry} onValueChange={setIndustry}>
                <SelectTrigger className="h-12 text-base rounded-xl border-2" style={{ borderColor: "hsl(190, 85%, 75%)" }}>
                  <SelectValue placeholder="Select your industry" />
                </SelectTrigger>
                <SelectContent>
                  {INDUSTRIES.map((ind) => (<SelectItem key={ind} value={ind}>{ind}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Startup Stage *</label>
              <Select value={startupStage} onValueChange={setStartupStage}>
                <SelectTrigger className="h-12 text-base rounded-xl border-2" style={{ borderColor: "hsl(190, 85%, 75%)" }}>
                  <SelectValue placeholder="Select your stage" />
                </SelectTrigger>
                <SelectContent>
                  {STARTUP_STAGES.map((s) => (<SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleBasicInfoSubmit}
              disabled={isCreating}
              className="w-full h-12 text-base font-semibold rounded-xl gap-2"
              style={{ background: "linear-gradient(135deg, hsl(190, 85%, 38%), hsl(186, 93%, 48%))" }}
            >
              {isCreating ? (<><Loader2 className="w-4 h-4 animate-spin" /> Creating...</>) : (<>Continue <ArrowRight className="w-4 h-4" /></>)}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Render: Path Selection ─────────────────────────────
  if (step === "path_selection") {
    return (
      <div className="fixed inset-0 z-50 bg-white flex flex-col">
        <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100">
          <button onClick={() => setStep("basic_info")} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-2">← Back</button>
          <button onClick={onClose} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="w-full max-w-2xl space-y-8">
            <div className="text-center space-y-3">
              <h1 className="text-3xl md:text-4xl font-bold" style={{ color: "hsl(190, 85%, 38%)" }}>How would you like to create your Spotlight?</h1>
              <p className="text-gray-500 text-base">Choose your path to showcase your startup</p>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <button
                onClick={() => handlePathSelection("structured")}
                className="group p-8 rounded-2xl border-2 text-left transition-all duration-200 hover:shadow-lg"
                style={{ borderColor: "hsl(190, 85%, 75%)" }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "hsl(190, 85%, 38%)"; e.currentTarget.style.boxShadow = "0 8px 30px rgba(9, 218, 237, 0.15)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "hsl(190, 85%, 75%)"; e.currentTarget.style.boxShadow = "none"; }}
              >
                <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-4" style={{ background: "hsl(186, 60%, 93%)" }}>
                  <Rocket className="w-7 h-7" style={{ color: "hsl(190, 85%, 38%)" }} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Structured Spotlight Creation</h3>
                <p className="text-sm text-gray-500 leading-relaxed">Answer guided questions and we'll automatically create a beautiful blog showcasing your startup story, problem, and vision.</p>
              </button>
              <button
                onClick={() => handlePathSelection("manual")}
                className="group p-8 rounded-2xl border-2 text-left transition-all duration-200 hover:shadow-lg"
                style={{ borderColor: "hsl(190, 85%, 75%)" }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "hsl(190, 85%, 38%)"; e.currentTarget.style.boxShadow = "0 8px 30px rgba(9, 218, 237, 0.15)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "hsl(190, 85%, 75%)"; e.currentTarget.style.boxShadow = "none"; }}
              >
                <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-4" style={{ background: "hsl(186, 60%, 93%)" }}>
                  <FileEdit className="w-7 h-7" style={{ color: "hsl(190, 85%, 38%)" }} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Create Spotlight on Your Own</h3>
                <p className="text-sm text-gray-500 leading-relaxed">Jump straight into the blog editor and craft your Spotlight from scratch with full creative control.</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Render: Questions ──────────────────────────────────
  if (step === "questions" && currentQuestion) {
    const customInput = getCustomInput(currentQuestion);

    return (
      <div className="fixed inset-0 z-50">
        <button
          onClick={onClose}
          className="fixed top-6 right-8 z-[51] w-10 h-10 rounded-full flex items-center justify-center bg-white/80 hover:bg-gray-100 transition-colors shadow-sm"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>

        <SpotlightQuestion
          title={currentQuestion.title}
          description={currentQuestion.description}
          placeholder={currentQuestion.placeholder}
          value={currentQuestion.inputType === "textarea" ? (answers[currentQuestion.id] || "") : ""}
          onChange={(val) => setAnswerValue(currentQuestion.id, val)}
          onNext={handleQuestionNext}
          onBack={handleQuestionBack}
          currentStep={questionIndex + 1}
          totalSteps={ALL_QUESTIONS.length}
          isSubmitting={isSaving}
          isLastStep={isLastQuestion}
          customInput={customInput}
        />
      </div>
    );
  }

  return null;
};

export default CreateProjectWizard;
