import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Plus,
  Search,
  Star,
  ArrowRight,
  LogOut,
  Settings,
  Loader2,
  FolderOpen,
  FileText,
  Tag,
  AlignLeft,
  FileEdit,
  HelpCircle,
  Link2,
  Check,
  BookOpen,
  Sparkles,
  Database,
  MessageSquare,
  Bell as BellIcon,
  Bot,
  BarChart3,
  ChevronRight,
  User,
  Megaphone,
  Lock,
  Trash2,
  PartyPopper,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useProjects, type Project } from "@/hooks/useProjects";
import { useProfile } from "@/hooks/useProfile";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { usePromotions } from "@/hooks/usePromotions";
import { usePaymentVerification } from "@/hooks/usePayments";
import { toast } from "sonner";
import { NeeshLogo } from "@/components/NeeshLogo";
import { BetaBadge } from "@/components/BetaBadge";
import { generateShareableUrl } from "@/lib/slugify";
import apiClient from "@/lib/api";

// Status styles mapping

const statusStyles = {
  draft: "status-draft",
  active: "status-active",
  published: "status-published",
};

// Helper function to get cover image URL from localStorage
const getProjectCoverImage = (projectId: string): string | null => {
  // Check the key used by useCoverImage hook (this is the primary storage)
  const coverImageData = localStorage.getItem(`cover-image-${projectId}`);
  if (coverImageData) {
    return coverImageData;
  }
  // Fallback: check URL-based storage
  const savedUrl = localStorage.getItem(`cover-image-url-${projectId}`);
  if (savedUrl) {
    return savedUrl;
  }
  // Fallback: check old blog localStorage format
  const savedData = localStorage.getItem(`blog-${projectId}`);
  if (savedData) {
    try {
      const parsed = JSON.parse(savedData);
      return parsed.coverImage || null;
    } catch {
      return null;
    }
  }
  return null;
};

const Dashboard = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newProject, setNewProject] = useState({
    title: "",
    summary: "",
    introduction: "",
    description: "",
  });
  const { user, loading: authLoading, signOut } = useAuth();
  const { projects, loading: projectsLoading, createProject } = useProjects();
  const { profile } = useProfile();
  const { subscription, isPro, isFree, canCreateProject, upgradeToPro, refetch: refetchSubscription, daysRemaining } = useSubscription();
  const { promotions, submitPromotion, removePromotion } = usePromotions();
  const { verifying } = usePaymentVerification();
  const [helpOpen, setHelpOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [betaUpgradeSuccess, setBetaUpgradeSuccess] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [promoteOpen, setPromoteOpen] = useState(false);
  const [promoteProjectId, setPromoteProjectId] = useState<string | null>(null);
  const [isPromoting, setIsPromoting] = useState(false);
  const navigate = useNavigate();

  // Cover images fetched from backend (for projects without localStorage images)
  const [coverImages, setCoverImages] = useState<Record<string, string>>({});

  // Fetch cover images from backend for projects that don't have them in localStorage
  useEffect(() => {
    if (!projects?.length) return;

    const fetchMissingCoverImages = async () => {
      console.log("[Dashboard] Checking for missing cover images...");
      const missingProjects = projects.filter(p => !getProjectCoverImage(p.id));
      
      if (missingProjects.length === 0) return;

      try {
        const results = await Promise.all(
          missingProjects.map(async (project) => {
            try {
              const blogData = await apiClient.get<{ coverImageUrl?: string }>(
                `/api/projects/${project.id}/blog`
              );
              return { id: project.id, url: blogData?.coverImageUrl || null };
            } catch {
              return { id: project.id, url: null };
            }
          })
        );

        const updates: Record<string, string> = {};
        results.forEach(result => {
          if (result.url) {
            updates[result.id] = result.url;
            localStorage.setItem(`cover-image-${result.id}`, result.url);
          }
        });

        if (Object.keys(updates).length > 0) {
          setCoverImages(prev => ({ ...prev, ...updates }));
        }
      } catch (error) {
        console.error("[Dashboard] Error fetching cover images:", error);
      }
    };

    fetchMissingCoverImages();
  }, [projects]);

  // Debug logging
  console.log("[Dashboard] Render state:", {
    authLoading,
    projectsLoading,
    user: user?.email,
    userId: user?.id,
    projectsCount: projects?.length,
  });

  const handleCopyLink = async (e: React.MouseEvent, projectId: string, projectTitle: string) => {
    e.preventDefault();
    e.stopPropagation();
    const url = generateShareableUrl(projectId, projectTitle);
    await navigator.clipboard.writeText(url);
    setCopiedId(projectId);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  useEffect(() => {
    console.log("[Dashboard] useEffect - Auth check:", { authLoading, hasUser: !!user });
    if (!authLoading && !user) {
      console.log("[Dashboard] No user, redirecting to login");
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check project limit for Free users
    if (!canCreateProject) {
      setUpgradeOpen(true);
      return;
    }

    console.log("[Dashboard] Creating project:", newProject);
    setIsCreating(true);
    const result = await createProject({
      title: newProject.title,
      one_line_summary: newProject.summary,
      introduction: newProject.introduction,
      description: newProject.description,
    });
    console.log("[Dashboard] Create project result:", result);
    setIsCreating(false);
    if (result) {
      setNewProject({ title: "", summary: "", introduction: "", description: "" });
      setIsCreateOpen(false);
      refetchSubscription();
      navigate(`/project/${result.id}`);
    }
  };

  const handleUpgrade = async () => {
    setIsUpgrading(true);
    const success = await upgradeToPro();
    setIsUpgrading(false);
    if (success) {
      setUpgradeOpen(false);
      setBetaUpgradeSuccess(true);
    } else {
      toast.error("Failed to upgrade. Please try again.");
    }
  };

  const handlePromoteBlog = async () => {
    if (!promoteProjectId) {
      toast.error("Please select a project.");
      return;
    }
    setIsPromoting(true);
    try {
      await submitPromotion(promoteProjectId);
      toast.success("Blog promoted successfully! It will appear in 'More Like This' sections.");
      setPromoteOpen(false);
      setPromoteProjectId(null);
    } catch (err: any) {
      toast.error(err?.message || "Failed to promote blog.");
    } finally {
      setIsPromoting(false);
    }
  };



  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error("Failed to sign out");
    } else {
      toast.success("Signed out successfully");
      navigate("/");
    }
  };

  const filteredProjects = projects
    .filter((p) => p.title.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.title.localeCompare(b.title);
        case "rating": {
          const statusOrder: Record<string, number> = { published: 0, active: 1, draft: 2 };
          return (statusOrder[a.status.toLowerCase()] ?? 3) - (statusOrder[b.status.toLowerCase()] ?? 3);
        }
        case "recent":
        default:
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      }
    });

  const loading = authLoading || projectsLoading;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center hero-gradient">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${star <= Math.floor(rating)
              ? "fill-warning text-warning"
              : star <= rating
                ? "fill-warning/50 text-warning"
                : "text-muted-foreground/30"
              }`}
          />
        ))}
        <span className="ml-1.5 text-sm font-semibold">{rating.toFixed(1)}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border/50 sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <NeeshLogo size="md" />
              <BetaBadge variant="glow" type="beta" />
              <span className="text-sm text-muted-foreground hidden sm:block">
                AI-powered content & niche projects
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* Help Workflow Guide */}
              <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
                <DialogTrigger asChild>
                  <button className="icon-button w-10 h-10">
                    <HelpCircle className="w-5 h-5 text-muted-foreground" />
                  </button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="font-display text-xl flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-primary" />
                      How Neesh AI Works
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    {[
                      { icon: Sparkles, title: "1. Overview", desc: "Get a bird's-eye view of your project: idea health score, validation stage, gap detection, persona engagement, and AI-generated summary — all computed from real audience data." },
                      { icon: FileEdit, title: "2. Blog Editor", desc: "Write and format your blog using the rich-text editor. Add text, images, video, and feedback forms. Preview your blog and share the public link with your audience." },
                      { icon: Database, title: "3. Knowledge Base", desc: "Upload documents (PDF, DOCX, TXT) that train the AI chatbot. The chatbot uses this knowledge to answer visitor questions accurately." },
                      { icon: MessageSquare, title: "4. Response", desc: "View all feedback form submissions and chatbot interactions. See answered and unanswered questions, filter by occupation, and understand what your audience is asking." },
                      { icon: BellIcon, title: "5. Notification", desc: "See clustered question patterns from chatbot interactions. Identify recurring themes and gaps in your content so you can improve your knowledge base." },
                      { icon: Bot, title: "6. Chatbot", desc: "Test your AI chatbot as visitors will see it. The chatbot answers questions using your uploaded knowledge base documents." },
                      { icon: BarChart3, title: "7. Audience Insights", desc: "AI-powered persona detection categorizes your audience (developers, marketers, investors, etc.). View confusion points, common questions, and content suggestions per persona." },
                    ].map((step) => (
                      <div key={step.title} className="flex gap-3 p-3 rounded-xl bg-muted/40 hover:bg-muted/60 transition-colors">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                          <step.icon className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground text-sm">{step.title}</h4>
                          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{step.desc}</p>
                        </div>
                      </div>
                    ))}
                    <div className="pt-2 border-t border-border/50">
                      <p className="text-xs text-muted-foreground text-center">
                        Share your blog → Visitors ask questions & give feedback → AI detects personas → You iterate on your idea
                      </p>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => {
                    if (!canCreateProject) {
                      setUpgradeOpen(true);
                    } else {
                      setIsCreateOpen(true);
                    }
                  }}>
                    <Plus className="w-4 h-4" />
                    New Project
                    <BetaBadge variant="static" type="beta" className="ml-1.5" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle className="font-display text-xl">Create New Project</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateProject} className="space-y-5 mt-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        Project Title
                      </div>
                      <Input
                        placeholder="Enter your project title"
                        value={newProject.title}
                        onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <Tag className="w-4 h-4 text-muted-foreground" />
                        One Line
                      </div>
                      <Input
                        placeholder="Write a short, catchy summary..."
                        value={newProject.summary}
                        onChange={(e) => setNewProject({ ...newProject, summary: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <AlignLeft className="w-4 h-4 text-muted-foreground" />
                        Introduction
                      </div>
                      <Input
                        placeholder="Write a brief introduction to outline the project's purpose..."
                        value={newProject.introduction}
                        onChange={(e) => setNewProject({ ...newProject, introduction: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <FileEdit className="w-4 h-4 text-muted-foreground" />
                        Description
                      </div>
                      <Textarea
                        placeholder="Describe your project in detail..."
                        value={newProject.description}
                        onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                        rows={4}
                        className="resize-none"
                      />
                    </div>
                    <Button type="submit" className="w-full">
                      <Plus className="w-4 h-4" />
                      Create Project
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="w-11 h-11 rounded-full bg-muted flex items-center justify-center overflow-hidden ring-2 ring-border/50 hover:ring-primary/50 transition-all">
                    {profile?.profileImageUrl ? (
                      <img
                        src={profile.profileImageUrl}
                        alt="User"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-5 h-5 text-muted-foreground" />
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-3 py-2 text-sm text-muted-foreground truncate">
                    {user.email}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/profile")}>
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive" onClick={handleSignOut}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Upgrade Modal — Beta instant upgrade */}
      <Dialog open={upgradeOpen} onOpenChange={setUpgradeOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl flex items-center gap-2">
              ⚡ Upgrade to Pro
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-600/10 via-green-600/10 to-teal-500/10 border border-emerald-500/20">
              <div className="flex items-center gap-2 mb-2">
                <BetaBadge variant="glow" type="beta" />
                <p className="text-sm text-foreground font-medium">
                  Free during Beta!
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                Since Neesh AI is in Beta, all Pro features are completely free. Upgrade now to unlock:
              </p>
              <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Unlimited projects</li>
                <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Remove "Powered by Neesh AI" branding</li>
                <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Add your own logo & branding</li>
                <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Promote blogs in "More Like This" network</li>
              </ul>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setUpgradeOpen(false)} className="flex-1">
                Maybe Later
              </Button>
              <Button onClick={handleUpgrade} disabled={isUpgrading} className="flex-1 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white">
                {isUpgrading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Upgrade Free ⚡
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Beta Upgrade Success Modal */}
      <Dialog open={betaUpgradeSuccess} onOpenChange={setBetaUpgradeSuccess}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center text-center py-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500/20 to-green-500/20 flex items-center justify-center mb-4">
              <PartyPopper className="w-8 h-8 text-emerald-500" />
            </div>
            <h2 className="font-display text-2xl font-bold text-foreground mb-2">
              🎉 Welcome to Pro!
            </h2>
            <BetaBadge variant="glow" type="beta" className="mb-3" />
            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
              Since Neesh AI is currently in <strong className="text-foreground">Beta</strong>, the Pro plan is free for you! Enjoy unlimited projects, custom branding, cross-promotion, and all premium features.
            </p>
            <Button
              onClick={() => setBetaUpgradeSuccess(false)}
              className="mt-6 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white px-8"
            >
              Let's Go! 🚀
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Promote Blog Modal (Pro users) */}
      <Dialog open={promoteOpen} onOpenChange={setPromoteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl flex items-center gap-2">
              🚀 Promote Your Blog
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <p className="text-sm text-muted-foreground">
              Your blog will appear in the "More Like This" section of all other published blogs.
            </p>
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Project</label>
              <Select value={promoteProjectId || ""} onValueChange={setPromoteProjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a project to promote" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handlePromoteBlog} className="w-full" disabled={isPromoting || !promoteProjectId}>
              {isPromoting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Promote Blog
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">

        {/* Title and filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">
              Your Projects
            </h1>
            <p className="text-muted-foreground mt-1">Manage and track your validation projects</p>
          </div>

          <div className="flex items-center gap-3">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[160px] h-11 rounded-xl">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Sort by: Recent</SelectItem>
                <SelectItem value="rating">Sort by: Rating</SelectItem>
                <SelectItem value="name">Sort by: Name</SelectItem>
              </SelectContent>
            </Select>

            <div className="relative">
              <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search projects"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 w-[200px]"
              />
            </div>
          </div>
        </div>

        {/* Projects Grid */}
        {filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => {
              const coverImage = getProjectCoverImage(project.id) || coverImages[project.id] || null;
              return (
                <Link
                  key={project.id}
                  to={`/project/${project.id}`}
                  className="group block"
                >
                  <div className="bg-card rounded-2xl border border-border/30 overflow-hidden hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300">
                    {/* Cover Image Area */}
                    <div className="relative h-48 overflow-hidden">
                      {coverImage ? (
                        <>
                          <img
                            src={coverImage.includes('supabase') ? `${coverImage}${coverImage.includes('?') ? '&' : '?'}width=600&quality=75` : coverImage}
                            alt={project.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                            decoding="async"
                          />
                          {/* Gradient fade to bottom */}
                          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
                        </>
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/10 via-accent/10 to-muted flex items-center justify-center">
                          <FolderOpen className="w-12 h-12 text-muted-foreground/30" />
                          {/* Gradient fade to bottom */}
                          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
                        </div>
                      )}

                      {/* Status badge and copy link overlay */}
                      <div className="absolute top-3 right-3 flex items-center gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={(e) => handleCopyLink(e, project.id, project.title)}
                              className="w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-background transition-colors border border-border/50"
                            >
                              {copiedId === project.id ? (
                                <Check className="w-4 h-4 text-green-500" />
                              ) : (
                                <Link2 className="w-4 h-4 text-muted-foreground" />
                              )}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Copy shareable link</p>
                          </TooltipContent>
                        </Tooltip>
                        <span className={`text-xs font-semibold px-3 py-1.5 rounded-full capitalize backdrop-blur-sm ${statusStyles[project.status.toLowerCase() as keyof typeof statusStyles] || "status-draft"}`}>
                          {project.status.toLowerCase()}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      {/* Title */}
                      <h3 className="font-display font-semibold text-lg text-foreground group-hover:text-primary transition-colors mb-2">
                        {project.title}
                      </h3>

                      {/* Summary */}
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2 leading-relaxed">
                        {project.one_line_summary || "No description"}
                      </p>

                      {/* Updated date and arrow */}
                      <div className="flex items-center justify-between pt-3 border-t border-border/50">
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Updated {new Date(project.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                          <ArrowRight className="w-5 h-5" />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-6">
              <FolderOpen className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="font-display font-semibold text-xl text-foreground mb-2">
              No projects found
            </h3>
            <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
              {searchQuery ? "Try a different search term" : "Create your first project to get started"}
            </p>
            <Button onClick={() => setIsCreateOpen(true)} size="lg">
              <Plus className="w-5 h-5" />
              Create Your First Project
            </Button>
          </div>
        )}

        {/* ═══════════════════════════════════════════════
            CROSS-PROMOTION ENGINE SECTION
            ═══════════════════════════════════════════════ */}
        <section className="mt-12 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600/20 to-indigo-600/20 flex items-center justify-center">
                <Megaphone className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-xl font-bold text-foreground">
                    Cross-Promotion Engine
                  </h2>
                  {isPro && (
                    <span className="px-2 py-0.5 rounded-full bg-[#09daed]/10 text-[#09daed] text-[10px] font-bold border border-[#09daed]/20">PRO</span>
                  )}
                </div>
                <div className="flex flex-col">
                  <p className="text-sm text-muted-foreground">
                    Promote your blogs in other users' "More Like This" sections
                  </p>
                  {isPro && daysRemaining !== null && (
                    <span className={`text-[10px] font-medium mt-0.5 ${daysRemaining <= 5 ? 'text-red-500' : 'text-[#09daed]'}`}>
                      ⏳ {daysRemaining > 0 ? `PRO status expires in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}` : 'Subscription expired'}
                    </span>
                  )}
                </div>
              </div>
            </div>
            {isPro && (
              <Button onClick={() => setPromoteOpen(true)} className="gap-1.5 shadow-sm">
                <Plus className="w-4 h-4" />
                Add Project
              </Button>
            )}
          </div>

          {isPro ? (
            // ── Pro users: show managed promotions ──
            <div>
              {promotions.filter(p => p.status === 'ACTIVE').length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {promotions.filter(p => p.status === 'ACTIVE').map((promo) => {
                    const project = projects.find(p => p.id === promo.projectId);
                    const coverImg = project ? (getProjectCoverImage(project.id) || coverImages[project.id]) : promo.coverImageUrl;
                    return (
                      <div
                        key={promo.id}
                        className="relative bg-card rounded-xl border border-blue-500/20 overflow-hidden group hover:shadow-lg transition-all"
                      >
                        {/* Cover */}
                        <div className="relative h-32 overflow-hidden bg-gradient-to-br from-blue-600/10 via-indigo-600/10 to-muted">
                          {coverImg ? (
                            <img src={coverImg} alt={promo.blogTitle} className="w-full h-full object-cover" loading="lazy" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Megaphone className="w-8 h-8 text-muted-foreground/30" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent" />
                        </div>

                        {/* Content */}
                        <div className="p-4">
                          <h4 className="font-semibold text-sm mb-2 line-clamp-1">{promo.blogTitle}</h4>

                          {/* Tags display removed */}

                          {/* Status + Remove */}
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 uppercase">
                              {promo.status === 'ACTIVE' ? '● Live' : promo.status}
                            </span>
                            <button
                              type="button"
                              onClick={async (e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                console.log("[Dashboard] Remove button clicked for promotion ID:", promo.id);
                                if (!window.confirm(`Are you sure you want to remove this promotion?\nTitle: ${promo.blogTitle}`)) {
                                  console.log("[Dashboard] Removal cancelled by user.");
                                  return;
                                }
                                console.log("[Dashboard] Proceeding with removal...");
                                const ok = await removePromotion(promo.id);
                                if (ok) {
                                  console.log("[Dashboard] Promotion removal successful.");
                                  toast.success("Promotion removed.");
                                } else {
                                  console.error("[Dashboard] Promotion removal failed.");
                                  toast.error("Failed to remove promotion.");
                                }
                              }}
                              className="p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm border border-red-100 flex items-center gap-1.5"
                              title="Remove promotion"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span className="text-[10px] font-bold">Remove</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 bg-card rounded-xl border border-dashed border-blue-500/30">
                  <div className="w-14 h-14 rounded-2xl bg-blue-600/10 flex items-center justify-center mx-auto mb-4">
                    <Megaphone className="w-7 h-7 text-blue-500" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">No promoted projects yet</h3>
                  <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
                    Add your projects here to promote them in other users' blogs under "More Like This" sections.
                  </p>
                  <Button onClick={() => setPromoteOpen(true)} className="gap-1.5 shadow-sm">
                    <Plus className="w-4 h-4" />
                    Promote Your First Project
                  </Button>
                </div>
              )}
            </div>
          ) : (
            // ── Free users: locked section with upgrade CTA ──
            <div className="relative rounded-xl border border-border/50 bg-card overflow-hidden">
              {/* Blurred overlay */}
              <div className="absolute inset-0 bg-background/60 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
                <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Lock className="w-7 h-7 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-lg text-foreground mb-1">Pro Feature</h3>
                <BetaBadge variant="glow" type="beta" className="mb-2" />
                <p className="text-sm text-muted-foreground mb-4 max-w-sm text-center">
                  Free during Beta! Upgrade to Pro to promote your blogs across the Neesh AI network.
                </p>
                <Button onClick={() => setUpgradeOpen(true)} disabled={isUpgrading} className="gap-1.5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white">
                  {isUpgrading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Upgrade Free ⚡
                </Button>
              </div>

              {/* Placeholder cards (decorative, behind blur) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 opacity-40 select-none pointer-events-none">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-muted rounded-xl h-48 animate-pulse" />
                ))}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Dashboard;