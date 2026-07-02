import { useState, useCallback } from "react";
import { X, Rocket, FileEdit, ArrowRight, Loader2, ChevronDown } from "lucide-react";
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
import { type CreateProjectInput, type Project } from "@/hooks/useProjects";
import { type UpdateBlogInput, type CustomField } from "@/hooks/useBlogs";
import { toast } from "sonner";

// ─── Constants ────────────────────────────────────────────────
const INDUSTRIES = [
  "SaaS",
  "Fintech",
  "HealthTech",
  "EdTech",
  "E-Commerce",
  "AI / ML",
  "CleanTech",
  "FoodTech",
  "Logistics",
  "Social Media",
  "Gaming",
  "Real Estate",
  "Travel",
  "Media & Entertainment",
  "Other",
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

// The 9+1 spotlight questions
const SPOTLIGHT_QUESTIONS = [
  {
    title: "Problem Story",
    description:
      "Describe a real situation where someone experienced this problem. What were they trying to do, what went wrong, and what was the outcome?",
    placeholder: "Explain your problem statement in brief",
    sectionTitle: "The Problem",
  },
  {
    title: "Why This Happens",
    description:
      "In your opinion, what is the root cause of this problem, and why haven't existing solutions solved it effectively?",
    placeholder: "Describe the root cause and why existing solutions fall short",
    sectionTitle: "Root Cause Analysis",
  },
  {
    title: "Current Solutions",
    description:
      "How are people solving this problem today, and what are the biggest limitations or frustrations with those approaches?",
    placeholder: "Describe the current solutions and their limitations",
    sectionTitle: "Existing Solutions & Gaps",
  },
  {
    title: "Our Solution",
    description:
      "What are you building, who is it for, and how does it solve this problem differently from existing solutions?",
    placeholder: "Describe your solution and how it's different",
    sectionTitle: "What We're Building",
  },
  {
    title: "How It Works",
    description:
      "Walk us through how a customer would use your product from start to finish in the simplest possible way.",
    placeholder: "Walk us through the customer journey step by step",
    sectionTitle: "Product Walkthrough",
  },
  {
    title: "Target Customer",
    description:
      "Who is your primary target customer? (Who requires your product)",
    placeholder: "Describe your ideal customer profile",
    sectionTitle: "Who It's For",
  },
  {
    title: "Founder Story",
    description:
      "What personal experience, observation, or event motivated you to build this startup?",
    placeholder: "Share the story behind why you started building this",
    sectionTitle: "The Founder's Story",
  },
  {
    title: "Online Presence",
    description:
      "Do you already have an online presence where you regularly share content or engage with your audience? Share your social media or website links.",
    placeholder: "Paste your social media / website links (comma-separated)",
    sectionTitle: "Online Presence",
    type: "spotlight_links" as const,
  },
  {
    title: "The Hook",
    description:
      "What's the one surprising fact, observation, or insight about this problem that would immediately make your ideal customer stop and read?",
    placeholder: "Write your hook — one powerful insight or fact",
    sectionTitle: "The Hook",
  },
  {
    title: "Vision",
    description:
      "If your startup succeeds, what meaningful change will it create for your customers or the industry over the next few years?",
    placeholder: "Describe the future you're building towards",
    sectionTitle: "Our Vision",
  },
];

// ─── Types ────────────────────────────────────────────────────
type WizardStep =
  | "basic_info"
  | "path_selection"
  | "spotlight_questions";

interface CreateProjectWizardProps {
  onClose: () => void;
  createProject: (input: CreateProjectInput) => Promise<Project | null>;
  upsertBlog: (projectId: string, input: UpdateBlogInput) => Promise<any>;
  onProjectCreated: (project: Project) => void;
  canCreateProject: boolean;
}

// ─── Component ────────────────────────────────────────────────
const CreateProjectWizard = ({
  onClose,
  createProject,
  upsertBlog,
  onProjectCreated,
  canCreateProject,
}: CreateProjectWizardProps) => {
  // Step tracking
  const [step, setStep] = useState<WizardStep>("basic_info");
  const [questionIndex, setQuestionIndex] = useState(0);

  // Basic info state
  const [projectName, setProjectName] = useState("");
  const [oneLineDesc, setOneLineDesc] = useState("");
  const [industry, setIndustry] = useState("");
  const [startupStage, setStartupStage] = useState("");

  // Question answers
  const [answers, setAnswers] = useState<string[]>(
    new Array(SPOTLIGHT_QUESTIONS.length).fill("")
  );

  // Created project reference (for incremental blog saves)
  const [createdProject, setCreatedProject] = useState<Project | null>(null);

  // Loading states
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // ─── Helpers ──────────────────────────────────────────
  const generateCustomFields = (answersArr: string[]): CustomField[] => {
    return SPOTLIGHT_QUESTIONS.map((q, i) => ({
      id: crypto.randomUUID(),
      type: q.type || "spotlight_section",
      sectionTitle: q.sectionTitle,
      value: answersArr[i] || "",
      order: i + 1,
    })).filter((f) => f.value.trim() !== "");
  };

  const saveBlogWithAnswers = useCallback(
    async (project: Project, answersArr: string[]) => {
      const customFields = generateCustomFields(answersArr);
      await upsertBlog(project.id, {
        heading: project.title,
        introduction: oneLineDesc,
        content: "",
        custom_fields: customFields,
      });
    },
    [upsertBlog, oneLineDesc]
  );

  // ─── Step 1: Basic Info Submit ────────────────────────
  const handleBasicInfoSubmit = async () => {
    if (!projectName.trim()) {
      toast.error("Please enter a project name");
      return;
    }
    if (!oneLineDesc.trim()) {
      toast.error("Please enter a one-sentence description");
      return;
    }
    if (!industry) {
      toast.error("Please select an industry");
      return;
    }
    if (!startupStage) {
      toast.error("Please select a startup stage");
      return;
    }

    setIsCreating(true);
    try {
      // Create the project immediately
      const project = await createProject({
        title: projectName,
        one_line_summary: oneLineDesc,
        introduction: oneLineDesc,
        description: "",
        industry,
        startup_stage: startupStage,
      });

      if (!project) {
        setIsCreating(false);
        return;
      }

      setCreatedProject(project);

      // Decide path based on startup stage
      if (LATER_STAGES.includes(startupStage)) {
        setStep("path_selection");
      } else {
        setStep("spotlight_questions");
      }
    } catch (err) {
      toast.error("Failed to create project");
    } finally {
      setIsCreating(false);
    }
  };

  // ─── Step 2: Path Selection ───────────────────────────
  const handlePathSelection = (path: "structured" | "manual") => {
    if (path === "structured") {
      setStep("spotlight_questions");
    } else {
      // Manual → go straight to project page (blog editor)
      if (createdProject) {
        onProjectCreated(createdProject);
      }
    }
  };

  // ─── Step 3: Question navigation ─────────────────────
  const handleQuestionNext = async () => {
    if (!createdProject) return;

    setIsSaving(true);
    try {
      // Save current answer to blog incrementally
      const updatedAnswers = [...answers];
      await saveBlogWithAnswers(createdProject, updatedAnswers);

      if (questionIndex < SPOTLIGHT_QUESTIONS.length - 1) {
        setQuestionIndex((prev) => prev + 1);
      } else {
        // All questions done → navigate to project
        onProjectCreated(createdProject);
      }
    } catch (err) {
      toast.error("Failed to save. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleQuestionBack = () => {
    if (questionIndex > 0) {
      setQuestionIndex((prev) => prev - 1);
    } else {
      // Go back to basic info or path selection
      if (LATER_STAGES.includes(startupStage)) {
        setStep("path_selection");
      } else {
        setStep("basic_info");
      }
    }
  };

  const handleAnswerChange = (value: string) => {
    setAnswers((prev) => {
      const updated = [...prev];
      updated[questionIndex] = value;
      return updated;
    });
  };

  // ─── Render: Basic Info ───────────────────────────────
  if (step === "basic_info") {
    return (
      <div className="fixed inset-0 z-50 bg-white flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <Rocket className="w-6 h-6" style={{ color: "hsl(190, 85%, 38%)" }} />
            <h2 className="text-xl font-bold text-gray-900">Create Your Spotlight</h2>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="w-full max-w-lg space-y-6">
            <div className="text-center space-y-2 mb-8">
              <h1
                className="text-3xl md:text-4xl font-bold"
                style={{ color: "hsl(190, 85%, 38%)" }}
              >
                Tell us about your startup
              </h1>
              <p className="text-gray-500 text-base">
                A few quick details to get started
              </p>
            </div>

            {/* Project Name */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">
                Startup / Project Name *
              </label>
              <Input
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="e.g., Neesh AI"
                className="h-12 text-base rounded-xl border-2 focus:ring-0"
                style={{
                  borderColor: "hsl(190, 85%, 75%)",
                }}
              />
            </div>

            {/* One sentence description */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">
                One-sentence Description *
              </label>
              <Input
                value={oneLineDesc}
                onChange={(e) => setOneLineDesc(e.target.value)}
                placeholder="Describe what your startup does in one sentence"
                className="h-12 text-base rounded-xl border-2 focus:ring-0"
                style={{
                  borderColor: "hsl(190, 85%, 75%)",
                }}
              />
            </div>

            {/* Industry */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">
                Industry *
              </label>
              <Select value={industry} onValueChange={setIndustry}>
                <SelectTrigger
                  className="h-12 text-base rounded-xl border-2"
                  style={{ borderColor: "hsl(190, 85%, 75%)" }}
                >
                  <SelectValue placeholder="Select your industry" />
                </SelectTrigger>
                <SelectContent>
                  {INDUSTRIES.map((ind) => (
                    <SelectItem key={ind} value={ind}>
                      {ind}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Startup Stage */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">
                Startup Stage *
              </label>
              <Select value={startupStage} onValueChange={setStartupStage}>
                <SelectTrigger
                  className="h-12 text-base rounded-xl border-2"
                  style={{ borderColor: "hsl(190, 85%, 75%)" }}
                >
                  <SelectValue placeholder="Select your stage" />
                </SelectTrigger>
                <SelectContent>
                  {STARTUP_STAGES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Submit */}
            <Button
              onClick={handleBasicInfoSubmit}
              disabled={isCreating}
              className="w-full h-12 text-base font-semibold rounded-xl gap-2"
              style={{
                background:
                  "linear-gradient(135deg, hsl(190, 85%, 38%), hsl(186, 93%, 48%))",
              }}
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Render: Path Selection (Beta / Launched) ─────────
  if (step === "path_selection") {
    return (
      <div className="fixed inset-0 z-50 bg-white flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100">
          <button
            onClick={() => setStep("basic_info")}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-2"
          >
            ← Back
          </button>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Cards */}
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="w-full max-w-2xl space-y-8">
            <div className="text-center space-y-3">
              <h1
                className="text-3xl md:text-4xl font-bold"
                style={{ color: "hsl(190, 85%, 38%)" }}
              >
                How would you like to create your Spotlight?
              </h1>
              <p className="text-gray-500 text-base">
                Choose your path to showcase your startup
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Structured path */}
              <button
                onClick={() => handlePathSelection("structured")}
                className="group p-8 rounded-2xl border-2 text-left transition-all duration-200 hover:shadow-lg"
                style={{
                  borderColor: "hsl(190, 85%, 75%)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "hsl(190, 85%, 38%)";
                  e.currentTarget.style.boxShadow = "0 8px 30px rgba(9, 218, 237, 0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "hsl(190, 85%, 75%)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: "hsl(186, 60%, 93%)" }}
                >
                  <Rocket className="w-7 h-7" style={{ color: "hsl(190, 85%, 38%)" }} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Structured Spotlight Creation
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Answer guided questions and we'll automatically create a beautiful
                  blog showcasing your startup story, problem, and vision.
                </p>
              </button>

              {/* Manual path */}
              <button
                onClick={() => handlePathSelection("manual")}
                className="group p-8 rounded-2xl border-2 text-left transition-all duration-200 hover:shadow-lg"
                style={{
                  borderColor: "hsl(190, 85%, 75%)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "hsl(190, 85%, 38%)";
                  e.currentTarget.style.boxShadow = "0 8px 30px rgba(9, 218, 237, 0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "hsl(190, 85%, 75%)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: "hsl(186, 60%, 93%)" }}
                >
                  <FileEdit className="w-7 h-7" style={{ color: "hsl(190, 85%, 38%)" }} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Create Spotlight on Your Own
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Jump straight into the blog editor and craft your Spotlight
                  from scratch with full creative control.
                </p>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Render: Spotlight Questions ──────────────────────
  if (step === "spotlight_questions") {
    const currentQuestion = SPOTLIGHT_QUESTIONS[questionIndex];
    const isLastStep = questionIndex === SPOTLIGHT_QUESTIONS.length - 1;

    return (
      <div className="fixed inset-0 z-50">
        {/* Close button overlaid on SpotlightQuestion */}
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
          value={answers[questionIndex]}
          onChange={handleAnswerChange}
          onNext={handleQuestionNext}
          onBack={handleQuestionBack}
          currentStep={questionIndex + 1}
          totalSteps={SPOTLIGHT_QUESTIONS.length}
          isSubmitting={isSaving}
          isLastStep={isLastStep}
        />
      </div>
    );
  }

  return null;
};

export default CreateProjectWizard;
