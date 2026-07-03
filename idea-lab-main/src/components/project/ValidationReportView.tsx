import { useMemo } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Shield,
  Target,
  Users,
  Wrench,
  ArrowRight,
  Info,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────
interface ModuleData {
  name: string;
  confidence: number;
  status: string;
  insight: string;
  warnings: string[];
}

interface ValidationReport {
  overallScore: number;
  overallStatus: string;
  hasFatalZero: boolean;
  modules: {
    cvp: ModuleData;
    market: ModuleData;
    acquisition: ModuleData;
    defensibility: ModuleData;
    buildability: ModuleData;
  };
  strengths: string[];
  weaknesses: string[];
  warnings: string[];
  nextStep: string;
}

interface ValidationReportViewProps {
  reportJson: string;
}

// ─── Module icon / color mappings ──────────────────────────────
const MODULE_META: Record<string, { icon: typeof Target; gradient: string; bg: string }> = {
  cvp: {
    icon: Target,
    gradient: "linear-gradient(135deg, #3B82F6, #60A5FA)",
    bg: "rgba(59, 130, 246, 0.08)",
  },
  market: {
    icon: TrendingUp,
    gradient: "linear-gradient(135deg, #8B5CF6, #A78BFA)",
    bg: "rgba(139, 92, 246, 0.08)",
  },
  acquisition: {
    icon: Users,
    gradient: "linear-gradient(135deg, #10B981, #34D399)",
    bg: "rgba(16, 185, 129, 0.08)",
  },
  defensibility: {
    icon: Shield,
    gradient: "linear-gradient(135deg, #F59E0B, #FBBF24)",
    bg: "rgba(245, 158, 11, 0.08)",
  },
  buildability: {
    icon: Wrench,
    gradient: "linear-gradient(135deg, #EF4444, #F87171)",
    bg: "rgba(239, 68, 68, 0.08)",
  },
};

// ─── Helper: score ring color ──────────────────────────────────
function scoreColor(score: number): string {
  if (score >= 85) return "#10B981";
  if (score >= 70) return "#3B82F6";
  if (score >= 55) return "#F59E0B";
  return "#EF4444";
}

function statusBadgeStyle(status: string): { bg: string; text: string } {
  switch (status) {
    case "Strong": return { bg: "rgba(16, 185, 129, 0.12)", text: "#059669" };
    case "Moderate": return { bg: "rgba(59, 130, 246, 0.12)", text: "#2563EB" };
    case "Weak": return { bg: "rgba(245, 158, 11, 0.12)", text: "#D97706" };
    case "Critical": return { bg: "rgba(239, 68, 68, 0.12)", text: "#DC2626" };
    default: return { bg: "rgba(107, 114, 128, 0.12)", text: "#6B7280" };
  }
}

// ─── Component ─────────────────────────────────────────────────
const ValidationReportView = ({ reportJson }: ValidationReportViewProps) => {
  const report = useMemo<ValidationReport | null>(() => {
    try {
      return JSON.parse(reportJson);
    } catch {
      return null;
    }
  }, [reportJson]);

  if (!report || !report.modules) {
    return null;
  }

  const mainColor = scoreColor(report.overallScore);
  const circumference = 2 * Math.PI * 80;
  const strokeDash = (report.overallScore / 100) * circumference;

  return (
    <div className="space-y-6">
      {/* ──── Hero: Overall Score ──── */}
      <div
        className="rounded-2xl p-8 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)",
        }}
      >
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-5" style={{ background: mainColor, transform: "translate(30%, -30%)" }} />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-5" style={{ background: mainColor, transform: "translate(-30%, 30%)" }} />

        <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
          {/* Score Ring */}
          <div className="relative flex-shrink-0">
            <svg width="200" height="200" viewBox="0 0 200 200" className="transform -rotate-90">
              {/* Background track */}
              <circle cx="100" cy="100" r="80" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="12" />
              {/* Score arc */}
              <circle
                cx="100" cy="100" r="80"
                fill="none"
                stroke={mainColor}
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={`${strokeDash} ${circumference}`}
                style={{ transition: "stroke-dasharray 1s ease-out" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-bold text-white">{report.overallScore}%</span>
              <span className="text-xs font-medium uppercase tracking-wider mt-1" style={{ color: mainColor }}>
                Validation Score
              </span>
            </div>
          </div>

          {/* Status & Summary */}
          <div className="text-center md:text-left flex-1">
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold mb-3"
              style={{ background: `${mainColor}22`, color: mainColor }}
            >
              {report.overallScore >= 70 ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              {report.overallStatus}
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Phase 1 Validation Report</h2>
            <p className="text-slate-400 text-sm leading-relaxed max-w-lg">
              Your startup has been evaluated across 5 critical dimensions using investor-grade algorithms.
              {report.hasFatalZero && " One or more modules scored critically — address these before seeking investment."}
            </p>
          </div>
        </div>
      </div>

      {/* ──── Warnings ──── */}
      {report.warnings.length > 0 && (
        <div className="space-y-2">
          {report.warnings.map((warning, i) => (
            <div
              key={i}
              className="flex items-start gap-3 px-5 py-4 rounded-xl border"
              style={{
                background: "rgba(245, 158, 11, 0.06)",
                borderColor: "rgba(245, 158, 11, 0.2)",
              }}
            >
              <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800 font-medium">{warning}</p>
            </div>
          ))}
        </div>
      )}

      {/* ──── Module Cards Grid ──── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(Object.entries(report.modules) as [string, ModuleData][]).map(([key, mod]) => {
          const meta = MODULE_META[key] || MODULE_META.cvp;
          const Icon = meta.icon;
          const badge = statusBadgeStyle(mod.status);
          const confCircum = 2 * Math.PI * 28;
          const confDash = (mod.confidence / 100) * confCircum;

          return (
            <div
              key={key}
              className="rounded-xl border border-gray-100 bg-white p-5 hover:shadow-md transition-shadow duration-200"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ background: meta.bg }}
                  >
                    <Icon className="w-5 h-5" style={{ color: mod.status === "Critical" ? "#EF4444" : undefined }} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">{mod.name}</h4>
                    <span
                      className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: badge.bg, color: badge.text }}
                    >
                      {mod.status}
                    </span>
                  </div>
                </div>

                {/* Mini confidence ring */}
                <div className="relative">
                  <svg width="64" height="64" viewBox="0 0 64 64" className="transform -rotate-90">
                    <circle cx="32" cy="32" r="28" fill="none" stroke="#f1f5f9" strokeWidth="4" />
                    <circle
                      cx="32" cy="32" r="28"
                      fill="none"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeDasharray={`${confDash} ${confCircum}`}
                      style={{
                        stroke: mod.confidence >= 70 ? "#10B981" : mod.confidence >= 40 ? "#F59E0B" : "#EF4444",
                        transition: "stroke-dasharray 0.8s ease-out",
                      }}
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-700">
                    {mod.confidence}%
                  </span>
                </div>
              </div>

              {/* Insight */}
              <p className="text-xs text-gray-600 leading-relaxed">{mod.insight}</p>

              {/* Module-specific warnings */}
              {mod.warnings.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-50 space-y-1">
                  {mod.warnings.map((w, wi) => (
                    <div key={wi} className="flex items-start gap-1.5">
                      <AlertTriangle className="w-3 h-3 text-amber-500 flex-shrink-0 mt-0.5" />
                      <span className="text-[11px] text-amber-700">{w}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ──── Strengths & Weaknesses ──── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Strengths */}
        <div className="rounded-xl border border-gray-100 bg-white p-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            <h3 className="text-base font-bold text-gray-900">Strengths</h3>
          </div>
          <div className="space-y-3">
            {report.strengths.length > 0 ? (
              report.strengths.map((s, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 flex-shrink-0" />
                  <p className="text-sm text-gray-700">{s}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-400 italic">Complete more questions to identify strengths</p>
            )}
          </div>
        </div>

        {/* Weaknesses */}
        <div className="rounded-xl border border-gray-100 bg-white p-6">
          <div className="flex items-center gap-2 mb-4">
            <XCircle className="w-5 h-5 text-red-500" />
            <h3 className="text-base font-bold text-gray-900">Areas to Improve</h3>
          </div>
          <div className="space-y-3">
            {report.weaknesses.length > 0 ? (
              report.weaknesses.map((w, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2 flex-shrink-0" />
                  <p className="text-sm text-gray-700">{w}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-400 italic">No critical weaknesses identified</p>
            )}
          </div>
        </div>
      </div>

      {/* ──── Next Step ──── */}
      {report.nextStep && (
        <div
          className="rounded-xl p-6 flex items-center gap-4"
          style={{
            background: "linear-gradient(135deg, hsl(190, 85%, 96%), hsl(190, 85%, 92%))",
            border: "1px solid hsl(190, 85%, 80%)",
          }}
        >
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg, hsl(190, 85%, 38%), hsl(186, 93%, 48%))" }}
          >
            <ArrowRight className="w-6 h-6 text-white" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-gray-900 mb-1">Recommended Next Step</h4>
            <p className="text-sm text-gray-700">{report.nextStep}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ValidationReportView;
