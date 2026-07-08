import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useParams, useNavigate, useSearchParams } from "react-router-dom";
import defaultChatbotAvatar from "@/assets/chatbot-avatar.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Check,
  Copy,
  FileEdit,
  Database,
  MessageSquare,
  Bell,
  Upload,
  Trash2,
  Plus,
  ChevronLeft,
  Users,
  Search,
  Star,
  Eye,
  MoreVertical,
  Image,
  Sparkles,
  ExternalLink,
  ChevronRight,
  FolderOpen,
  RefreshCw,
  FileText,
  Pencil,
  Loader2,
  PanelLeftClose,
  PanelLeft,
  Bot,
  Calendar,
  Clock,
  BarChart3,
  ChevronUp,
  ChevronDown,
  Type,
  ImageIcon,
  Video,
  Bold,
  Italic,
  Strikethrough,
  Link as LinkIcon,
  AArrowUp,
  AArrowDown,
} from "lucide-react";
import { NeeshLogo } from "@/components/NeeshLogo";
import ResponseTab from "@/components/project/ResponseTab";
import NotificationTab from "@/components/project/NotificationTab";
import AudienceInsights from "@/components/project/AudienceInsights";
import { useNotifications } from "@/hooks/useNotifications";
import ProjectOverview from "@/components/project/ProjectOverview";
import CreateProjectWizard from "@/components/project/CreateProjectWizard";
import { useCoverImage } from "@/hooks/useCoverImage";
import { useProjects, type Project as ProjectType } from "@/hooks/useProjects";
import { useBlogs } from "@/hooks/useBlogs";
import { useDocuments } from "@/hooks/useDocuments";
import { useAudienceData } from "@/hooks/useAudienceData";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "sonner";
import { uploadFileToStorage, migrateBase64ToStorage, isBase64 } from "@/lib/storage";

// Occupation colors for tags
const occupationColors: Record<string, { bg: string; text: string }> = {
  "Business Man": { bg: "bg-blue-500/20", text: "text-blue-400" },
  "Marketing Manager": { bg: "bg-purple-500/20", text: "text-purple-400" },
  "Content Writer": { bg: "bg-green-500/20", text: "text-green-400" },
  "Developer": { bg: "bg-orange-500/20", text: "text-orange-400" },
  "Designer": { bg: "bg-pink-500/20", text: "text-pink-400" },
  "Entrepreneur": { bg: "bg-yellow-500/20", text: "text-yellow-400" },
  "default": { bg: "bg-muted", text: "text-muted-foreground" },
};

const getOccupationColor = (occupation: string) => {
  return occupationColors[occupation] || occupationColors["default"];
};

const Project = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { profile } = useProfile();
  const { getProject, updateProject, deleteProject } = useProjects();
  const { getBlog, upsertBlog } = useBlogs();
  const { documents, loading: docsLoading, uploading: docUploading, uploadDocument, deleteDocument: removeDocument, renameDocument, refreshKnowledge } = useDocuments(id);

  const [project, setProject] = useState<ProjectType | null>(null);
  const [projectLoading, setProjectLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "blog" | "knowledge" | "response" | "notification" | "chatbot" | "audience">(() => {
    const tab = searchParams.get('tab');
    if (tab === 'blog') return 'blog';
    return 'overview';
  });
  
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const { coverImage, uploading, uploadCoverImage, removeCoverImage } = useCoverImage(id);
  const { badgeCount, fetchBadgeCount, clusters, fetchClusters } = useNotifications(id);
  const { members: audienceMembers } = useAudienceData(id);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  // Auto-open wizard if shareable resume link was used (?resume=true)
  useEffect(() => {
    if (searchParams.get('resume') === 'true') {
      setIsWizardOpen(true);
    }
  }, [searchParams]);

  // Response section state
  const [responseSearch, setResponseSearch] = useState("");
  const [occupationFilter, setOccupationFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [sections, setSections] = useState<Array<{
    id: string;
    title: string;
    content: string;
    type: "text" | "image" | "video" | "feedback";
    imageUrl?: string;
    videoUrl?: string;
    feedbackTitle?: string;
    feedbackDescription?: string;
    feedbackFields?: Array<{
      id: string;
      type: string;
      label: string;
      placeholder?: string;
      required: boolean;
      options?: string[];
      scaleMin?: number;
      scaleMax?: number;
      scaleMinLabel?: string;
      scaleMaxLabel?: string;
    }>;
  }>>([
    { id: "1", title: "Introduction", content: "", type: "text" },
    { id: "2", title: "Content", content: "", type: "text" },
  ]);

  // Filter responses (using real audience data)
  const filteredResponses = audienceMembers.filter(member => {
    if (!member.feedbackSummary) return false;
    const matchesSearch = responseSearch === "" ||
      member.name.toLowerCase().includes(responseSearch.toLowerCase()) ||
      member.email.toLowerCase().includes(responseSearch.toLowerCase()) ||
      (member.feedbackSummary && member.feedbackSummary.toLowerCase().includes(responseSearch.toLowerCase()));
    const matchesOccupation = occupationFilter === "all" || member.occupation === occupationFilter;
    return matchesSearch && matchesOccupation;
  });

  // Get unique occupations for filter
  const uniqueOccupations = [...new Set(audienceMembers.map(m => m.occupation).filter(Boolean))];

  // Notifications filtering/sorting now handled inside NotificationTab component

  // Load project from database
  useEffect(() => {
    const loadProject = async () => {
      if (!id) return;
      setProjectLoading(true);
      const data = await getProject(id);
      if (data) {
        setProject(data);
      } else {
        toast.error("Project not found");
        navigate("/dashboard");
      }
      setProjectLoading(false);
    };
    loadProject();
  }, [id]);

  // Load blog data
  useEffect(() => {
    const loadBlog = async () => {
      if (!id || !project) return;
      console.log("[Blog Load] Loading blog for project:", id);
      const blog = await getBlog(id);
      console.log("[Blog Load] Received blog:", blog);
      if (blog) {
        console.log("[Blog Load] Updating sections with blog data");
        console.log("[Blog Load] Introduction:", blog.introduction);
        console.log("[Blog Load] Content:", blog.content);
        console.log("[Blog Load] Custom fields:", blog.custom_fields);

        // Start with intro and content sections
        // Fall back to project fields if blog hasn't been saved yet
        const loadedSections: typeof sections = [
          { id: "1", title: "Introduction", content: blog.introduction || project?.introduction || "", type: "text" },
          { id: "2", title: "Content", content: blog.content || project?.description || "", type: "text" },
        ];

        // Add custom fields as sections (including feedback)
        if (blog.custom_fields && Array.isArray(blog.custom_fields)) {
          blog.custom_fields.forEach((field: any, idx: number) => {
            console.log(`[Blog Load] Processing custom field [${idx}]:`, field);
            if (field.type === "feedback") {
              console.log("[Blog Load] ✅ Found feedback form section:", field.title, "with", field.fields?.length, "fields");
              loadedSections.push({
                id: field.id || `feedback-${idx}`,
                title: field.title || "Feedback Form",
                content: field.description || "",
                type: "feedback",
                feedbackTitle: field.title,
                feedbackDescription: field.description,
                feedbackFields: field.fields || [],
              });
            } else if (field.type === "image") {
              loadedSections.push({
                id: field.id,
                title: `Image ${field.order + 1}`,
                content: field.value || "",
                type: "image",
                imageUrl: field.value,
              });
            } else if (field.type === "video") {
              loadedSections.push({
                id: field.id,
                title: `Video ${field.order + 1}`,
                content: field.value || "",
                type: "video",
                videoUrl: field.value,
              });
            } else {
              loadedSections.push({
                id: field.id,
                title: `Section ${field.order + 1}`,
                content: field.value || "",
                type: "text",
              });
            }
          });
        }

        console.log("[Blog Load] Final loaded sections:", loadedSections);
        console.log("[Blog Load] Feedback sections count:", loadedSections.filter(s => s.type === "feedback").length);
        setSections(loadedSections);
      } else {
        console.log("[Blog Load] No blog found");
      }
    };
    loadBlog();
  }, [id, project?.id]);

  const handleCoverImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadCoverImage(file);
    }
  };

  const sidebarItems = [
    { id: "overview", label: "Overview", icon: Sparkles },
    { id: "blog", label: "Blog Editor", icon: FileEdit },
    { id: "knowledge", label: "Knowledge Base", icon: Database },
    { id: "response", label: "Response", icon: MessageSquare },
    { id: "notification", label: "Notification", icon: Bell },
    { id: "chatbot", label: "Chatbot", icon: Bot },
    { id: "audience", label: "Audience Insights", icon: BarChart3 },
  ];

  const addSection = (type: "text" | "image" | "video") => {
    const titleMap = {
      text: `Section ${sections.length + 1}`,
      image: `Image ${sections.filter(s => s.type === "image").length + 1}`,
      video: `Video ${sections.filter(s => s.type === "video").length + 1}`,
    };
    const newSection = {
      id: String(Date.now()),
      title: titleMap[type],
      content: "",
      type,
      imageUrl: undefined,
      videoUrl: undefined,
    };
    setSections([...sections, newSection]);
  };

  const moveSection = (index: number, direction: "up" | "down") => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === sections.length - 1)
    ) {
      return;
    }

    const newSections = [...sections];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    [newSections[index], newSections[targetIndex]] = [newSections[targetIndex], newSections[index]];
    setSections(newSections);
  };

  const deleteSection = (sectionId: string) => {
    setSections(sections.filter(s => s.id !== sectionId));
  };

  const handleSectionImageUpload = async (sectionId: string, file: File) => {
    if (!id) return;
    console.log(`[SectionImage] Upload started for section ${sectionId}`);

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload a valid image file.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image too large. Please upload an image under 10MB.");
      return;
    }

    // Show a temporary blob URL immediately
    const tempUrl = URL.createObjectURL(file);
    setSections(prev => prev.map(s =>
      s.id === sectionId ? { ...s, imageUrl: tempUrl, content: file.name } : s
    ));

    try {
      // Compress then upload to Supabase Storage
      const { compressImage } = await import("@/lib/imageUtils");
      const compressed = await compressImage(file);
      const storageUrl = await uploadFileToStorage(id, compressed, "image");
      console.log(`[SectionImage] ✅ Uploaded to Storage: ${storageUrl}`);

      // Replace temp blob URL with persistent Storage URL
      URL.revokeObjectURL(tempUrl);
      setSections(prev => prev.map(s =>
        s.id === sectionId ? { ...s, imageUrl: storageUrl, content: storageUrl } : s
      ));
      toast.success("Image uploaded successfully");
    } catch (err) {
      console.error("[SectionImage] ❌ Upload failed:", err);
      toast.error("Failed to upload image. Save to retry.");
    }
  };

  const handleSectionVideoUpload = async (sectionId: string, file: File) => {
    if (!id) return;
    console.log(`[SectionVideo] Upload started for section ${sectionId}`);

    if (!file.type.startsWith("video/")) {
      toast.error("Please upload a valid video file.");
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      toast.error("Video too large. Please upload a video under 100MB.");
      return;
    }

    // Show a temporary blob URL immediately
    const tempUrl = URL.createObjectURL(file);
    setSections(prev => prev.map(s =>
      s.id === sectionId ? { ...s, videoUrl: tempUrl, content: file.name } : s
    ));

    try {
      // Upload directly to Supabase Storage (no base64 conversion)
      const storageUrl = await uploadFileToStorage(id, file, "video");
      console.log(`[SectionVideo] ✅ Uploaded to Storage: ${storageUrl}`);

      // Replace temp blob URL with persistent Storage URL
      URL.revokeObjectURL(tempUrl);
      setSections(prev => prev.map(s =>
        s.id === sectionId ? { ...s, videoUrl: storageUrl, content: storageUrl } : s
      ));
      toast.success("Video uploaded successfully");
    } catch (err) {
      console.error("[SectionVideo] ❌ Upload failed:", err);
      toast.error("Failed to upload video. Save to retry.");
    }
  };

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadDocument(file);
    }
  };





  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      await uploadDocument(file);
    }
  };

  const handleRefreshKnowledge = async () => {
    setIsRefreshing(true);
    try {
      await refreshKnowledge();
    } catch (err) {
      console.error("Error refreshing knowledge:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const startEditingDoc = (doc: typeof documents[0]) => {
    setEditingDocId(doc.id);
    setEditingName(doc.original_filename);
  };

  const saveDocName = async () => {
    if (editingDocId && editingName.trim()) {
      await renameDocument(editingDocId, editingName.trim());
    }
    setEditingDocId(null);
    setEditingName("");
  };

  const deleteDocument = async (docId: string) => {
    await removeDocument(docId);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${star <= Math.floor(rating)
              ? "fill-warning text-warning"
              : "text-muted-foreground/30"
              }`}
          />
        ))}
        <span className="ml-1 text-sm font-semibold">{rating.toFixed(1)}</span>
      </div>
    );
  };

  const handleDeleteProject = async () => {
    if (!id) return;
    setIsDeleting(true);
    try {
      const success = await deleteProject(id);
      if (success) {
        navigate("/dashboard");
      }
    } catch (err) {
      toast.error("Failed to delete project");
    } finally {
      setIsDeleting(false);
    }
  };

  // Show loading state while project is being fetched
  if (projectLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading project...</p>
        </div>
      </div>
    );
  }

  // Show error if project not found
  if (!project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">Project not found</p>
          <Link to="/dashboard">
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar - Fixed position, no scroll */}
      <aside className={`${sidebarCollapsed ? "w-16" : "w-72"} bg-card border-r border-border/50 flex flex-col shadow-sm transition-all duration-300 h-screen sticky top-0`}>
        {/* Header */}
        <div className="p-5 border-b border-border/50 flex items-center justify-between flex-shrink-0">
          {!sidebarCollapsed && (
            <Link to="/dashboard">
              <NeeshLogo size="sm" />
            </Link>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-9 h-9 bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
          >
            {sidebarCollapsed ? <PanelLeft className="w-6 h-6" /> : <PanelLeftClose className="w-6 h-6" />}
          </button>
        </div>

        {/* Project Info */}
        {!sidebarCollapsed && (
          <div className="p-5 border-b border-border/50 flex-shrink-0">
            <h2 className="font-display font-semibold text-lg mb-2">Blog Editor</h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-8 h-8 bg-primary/10 flex items-center justify-center">
                <Database className="w-5 h-5 text-primary" />
              </div>
              <span className="truncate">{project.title}</span>
            </div>
          </div>
        )}

        {/* Navigation - Scrollable if needed */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-3 transition-all duration-200 ${activeTab === item.id
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                } ${sidebarCollapsed ? "justify-center px-2" : ""}`}
              title={sidebarCollapsed ? item.label : undefined}
            >
              <item.icon className="w-6 h-6 flex-shrink-0" />
              {!sidebarCollapsed && (
                <>
                  <span className="text-sm font-medium">{item.label}</span>
                  {item.id === "notification" && badgeCount > 0 && (
                    <span className={`ml-auto text-xs font-semibold px-2.5 py-1 ${activeTab === item.id
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-accent text-accent-foreground"
                      }`}>
                      {badgeCount}
                    </span>
                  )}
                </>
              )}
            </button>
          ))}
        </nav>

        {/* Back to Dashboard at bottom */}
        <div className="p-4 border-t border-border/50 flex-shrink-0 mt-auto">
          <Link
            to="/dashboard"
            className={`flex items-center gap-3 px-4 py-3 text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200 ${sidebarCollapsed ? "justify-center px-2" : ""}`}
            title={sidebarCollapsed ? "Back to Dashboard" : undefined}
          >
            <ChevronLeft className="w-6 h-6 flex-shrink-0" />
            {!sidebarCollapsed && <span className="text-sm font-medium">Back to Dashboard</span>}
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="h-16 bg-card border-b border-border/50 flex items-center justify-between px-6 shadow-sm">
          <div className="flex items-center gap-3">
            {activeTab === "blog" && (
              <>
                <Link to={`/project/${id}/preview`}>
                  <Button variant="outline" size="sm" className="rounded-xl gap-2">
                    <ExternalLink className="w-4 h-4" />
                    View Blog
                  </Button>
                </Link>
                <Link to={`/project/${id}/feedback`}>
                  <Button variant="outline" size="sm" className="rounded-xl">
                    <Sparkles className="w-4 h-4" />
                    Feedback
                  </Button>
                </Link>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            {activeTab === "blog" && (
              <>
                <Link to={`/project/${id}/preview`}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    Preview
                  </Button>
                </Link>
                <Button
                  size="sm"
                  onClick={async () => {
                    if (!id) return;
                    setIsSaving(true);
                    try {
                      // Map sections to blog fields
                      const introSection = sections.find(s => s.id === "1");
                      const contentSection = sections.find(s => s.id === "2");
                      const customSections = sections.filter(s => s.id !== "1" && s.id !== "2");

                      console.log("[Blog Save] All sections:", sections);
                      console.log("[Blog Save] Introduction section:", introSection);
                      console.log("[Blog Save] Content section:", contentSection);
                      console.log("[Blog Save] Introduction value:", introSection?.content);
                      console.log("[Blog Save] Content value:", contentSection?.content);
                      console.log("[Blog Save] Custom sections (including feedback):", customSections);
                      console.log("[Blog Save] Feedback sections:", customSections.filter(s => s.type === "feedback"));

                      // Build custom_fields — migrate any remaining base64 to Storage URLs
                      const customFields = await Promise.all(
                        customSections.map(async (s, index) => {
                          if (s.type === "feedback") {
                            return {
                              id: s.id,
                              type: "feedback",
                              title: s.feedbackTitle || s.title,
                              description: s.feedbackDescription || s.content,
                              fields: s.feedbackFields || [],
                              order: index,
                            };
                          }
                          if (s.type === "image") {
                            const imgValue = s.imageUrl || s.content || "";
                            // Migrate base64 to Storage if needed
                            const finalUrl = isBase64(imgValue)
                              ? await migrateBase64ToStorage(id, imgValue, "image")
                              : imgValue;
                            return {
                              id: s.id,
                              type: "image",
                              value: finalUrl,
                              order: index,
                            };
                          }
                          if (s.type === "video") {
                            const vidValue = s.videoUrl || s.content || "";
                            // Migrate base64 to Storage if needed
                            const finalUrl = isBase64(vidValue)
                              ? await migrateBase64ToStorage(id, vidValue, "video")
                              : vidValue;
                            return {
                              id: s.id,
                              type: "video",
                              value: finalUrl,
                              order: index,
                            };
                          }
                          return {
                            id: s.id,
                            type: s.type,
                            value: s.content,
                            order: index,
                          };
                        })
                      );

                      // Migrate cover image base64 to Storage URL if needed
                      const finalCoverUrl = isBase64(coverImage || "")
                        ? await migrateBase64ToStorage(id, coverImage, "cover")
                        : (coverImage || undefined);

                      const blogData = {
                        heading: project?.title,
                        cover_image_url: finalCoverUrl,
                        introduction: introSection?.content || "",
                        content: contentSection?.content || "",
                        custom_fields: customFields,
                      };

                      console.log("[Blog Save] Cover image:", coverImage ? `present (len=${coverImage.length}, starts=${coverImage.substring(0, 30)})` : "NONE");
                      console.log("[Blog Save] Data being sent to backend:", { ...blogData, cover_image_url: blogData.cover_image_url ? `<base64 len=${blogData.cover_image_url.length}>` : 'undefined' });

                      const result = await upsertBlog(id, blogData);
                      console.log("[Blog Save] Result from backend:", result);

                      // Also update project title if changed
                      if (project) {
                        await updateProject(id, { title: project.title });
                      }

                      toast.success("Blog saved successfully!");
                    } catch (err) {
                      console.error("[Blog Save] Error:", err);
                      toast.error("Failed to save blog");
                    } finally {
                      setIsSaving(false);
                    }
                  }}
                  disabled={isSaving}
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {isSaving ? "Saving..." : "Save"}
                </Button>
              </>
            )}
            <div className="w-10 h-10 rounded-full bg-muted overflow-hidden ring-2 ring-border/50">
              {profile?.profileImageUrl ? (
                <img
                  src={profile.profileImageUrl}
                  alt="User"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-sm font-semibold text-muted-foreground">
                    {user?.email?.charAt(0).toUpperCase() || "U"}
                  </span>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto p-8 bg-background">
          {activeTab === "overview" && project && (
            <>
              <ProjectOverview
                projectId={id || "1"}
                projectData={{
                  title: project.title,
                  summary: project.one_line_summary || "",
                  description: project.description || "",
                  status: project.status,
                  onboardingCompleted: project.onboarding_completed,
                }}
                validationReport={project.validation_report || null}
                onResumeOnboarding={() => setIsWizardOpen(true)}
                questionsData={clusters.slice(0, 5).map((q) => ({
                  question: q.canonicalQuestion,
                  count: q.totalAskCount,
                  answeredCount: q.status === "answered" ? q.totalAskCount : 0,
                }))}
                onDeleteProject={handleDeleteProject}
                isDeleting={isDeleting}
              />
              {isWizardOpen && (
                <CreateProjectWizard
                  project={project}
                  onClose={() => setIsWizardOpen(false)}
                  createProject={async () => null}
                  updateProject={updateProject}
                  upsertBlog={upsertBlog}
                  onProjectCreated={(updatedProject) => {
                    setProject(updatedProject);
                    setIsWizardOpen(false);
                  }}
                  canCreateProject={true}
                />
              )}
            </>
          )}

          {activeTab === "blog" && (
            <div className="max-w-3xl mx-auto space-y-6">
              {/* Project Header Card */}
              <div className="bg-card rounded-2xl border border-border/30 p-6 shadow-card">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Database className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <Input
                        value={project.title}
                        onChange={(e) => setProject({ ...project, title: e.target.value })}
                        className="font-display font-semibold text-xl border-0 p-0 h-auto focus-visible:ring-0 bg-transparent"
                      />
                      <span className="status-draft text-xs font-semibold px-3 py-1 rounded-full mt-1 inline-block">
                        Draft
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="rounded-xl">
                      <Copy className="w-5 h-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="rounded-xl text-destructive">
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </div>
                </div>

                {/* Upload Image Area */}
                <input
                  type="file"
                  id="cover-image-upload"
                  accept="image/*"
                  onChange={handleCoverImageUpload}
                  className="hidden"
                />
                {coverImage ? (
                  <div className="relative rounded-2xl overflow-hidden group">
                    <img
                      src={coverImage}
                      alt="Cover"
                      className="w-full h-[300px] object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <label
                        htmlFor="cover-image-upload"
                        className="px-4 py-2 bg-white text-black rounded-xl font-medium cursor-pointer hover:bg-white/90 transition-colors"
                      >
                        Change Image
                      </label>
                      <button
                        onClick={removeCoverImage}
                        className="px-4 py-2 bg-destructive text-destructive-foreground rounded-xl font-medium hover:bg-destructive/90 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <label
                    htmlFor="cover-image-upload"
                    className={`block border-2 border-dashed border-border rounded-2xl p-10 text-center bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
                  >
                    <div className="w-16 h-16 rounded-2xl bg-card shadow-card flex items-center justify-center mx-auto mb-4">
                      {uploading ? (
                        <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
                      ) : (
                        <Image className="w-8 h-8 text-muted-foreground" />
                      )}
                    </div>
                    <p className="font-semibold text-foreground mb-1">
                      {uploading ? 'Uploading...' : 'Upload Cover Image'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Drag & drop or <span className="text-primary font-medium">browse</span> PNG, JPG, GIF (max 5MB)
                    </p>
                  </label>
                )}
              </div>

              {/* Content Sections */}
              {sections.map((section, index) => (
                <div key={section.id} className="bg-card rounded-2xl border border-border/30 p-6 shadow-card">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl ${section.type === "image" ? "bg-primary/10" : "bg-accent/10"} flex items-center justify-center`}>
                        {section.type === "image" ? (
                          <ImageIcon className="w-5 h-5 text-primary" />
                        ) : (
                          <Type className="w-5 h-5 text-accent" />
                        )}
                      </div>
                      <Input
                        value={section.title}
                        onChange={(e) => {
                          setSections(sections.map(s =>
                            s.id === section.id ? { ...s, title: e.target.value } : s
                          ));
                        }}
                        className="font-semibold text-foreground border-0 p-0 h-auto focus-visible:ring-0 bg-transparent max-w-[200px]"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      {/* Move Up/Down */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-lg"
                        onClick={() => moveSection(index, "up")}
                        disabled={index === 0}
                      >
                        <ChevronUp className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-lg"
                        onClick={() => moveSection(index, "down")}
                        disabled={index === sections.length - 1}
                      >
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-lg text-destructive"
                        onClick={() => deleteSection(section.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Content based on section type */}
                  {section.type === "feedback" ? (
                    // Render feedback form preview in editor
                    <div className="space-y-4">
                      {(() => { console.log("[Blog Editor] ✅ Rendering feedback section:", section.feedbackTitle, "fields:", section.feedbackFields?.length); return null; })()}
                      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-3">
                        <p className="text-sm text-primary font-medium">📋 Feedback Form (Preview - editable via Feedback Builder)</p>
                      </div>
                      <h3 className="text-lg font-semibold text-foreground">{section.feedbackTitle || section.title}</h3>
                      {section.feedbackDescription && (
                        <p className="text-sm text-muted-foreground">{section.feedbackDescription}</p>
                      )}
                      <div className="space-y-3 opacity-75">
                        {section.feedbackFields?.map((field) => (
                          <div key={field.id} className="space-y-1">
                            <label className="block text-sm font-medium text-foreground">
                              {field.label}
                              {field.required && <span className="text-destructive ml-1">*</span>}
                            </label>
                            {field.type === "long_text" ? (
                              <div className="w-full min-h-[60px] px-3 py-2 border border-border rounded-lg bg-muted/30 text-muted-foreground text-sm">
                                {field.placeholder || "Text input..."}
                              </div>
                            ) : field.type === "rating" ? (
                              <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <span key={star} className="text-lg opacity-50">⭐</span>
                                ))}
                              </div>
                            ) : field.type === "multiple_choice" || field.type === "checkboxes" || field.type === "dropdown" ? (
                              <div className="space-y-1">
                                {field.options?.map((opt, oi) => (
                                  <div key={oi} className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <div className={`w-4 h-4 border border-border rounded${field.type === "multiple_choice" ? "-full" : ""}`} />
                                    <span>{opt}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="w-full h-10 px-3 py-2 border border-border rounded-lg bg-muted/30 text-muted-foreground text-sm flex items-center">
                                {field.placeholder || `${field.type} input...`}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      {(!section.feedbackFields || section.feedbackFields.length === 0) && (
                        <p className="text-sm text-muted-foreground italic">No feedback fields configured. Use the Feedback Builder to add fields.</p>
                      )}
                    </div>
                  ) : section.type === "image" ? (
                    <div>
                      <input
                        type="file"
                        id={`section-image-${section.id}`}
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleSectionImageUpload(section.id, file);
                        }}
                        className="hidden"
                      />
                      {section.imageUrl ? (
                        <div className="relative rounded-xl overflow-hidden group bg-muted/10 flex justify-center">
                          <img
                            src={section.imageUrl}
                            alt={section.title}
                            className="max-w-full h-auto max-h-[400px] object-contain rounded-xl"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                            <label
                              htmlFor={`section-image-${section.id}`}
                              className="px-4 py-2 bg-white text-black rounded-xl font-medium cursor-pointer hover:bg-white/90 transition-colors"
                            >
                              Change
                            </label>
                            <button
                              onClick={() => setSections(sections.map(s =>
                                s.id === section.id ? { ...s, imageUrl: undefined, content: "" } : s
                              ))}
                              className="px-4 py-2 bg-destructive text-destructive-foreground rounded-xl font-medium hover:bg-destructive/90 transition-colors"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ) : (
                        <label
                          htmlFor={`section-image-${section.id}`}
                          className="block border-2 border-dashed border-border rounded-xl p-8 text-center bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                        >
                          <ImageIcon className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">
                            Click to upload an image
                          </p>
                        </label>
                      )}
                    </div>
                  ) : section.type === "video" ? (
                    <div>
                      <input
                        type="file"
                        id={`section-video-${section.id}`}
                        accept="video/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleSectionVideoUpload(section.id, file);
                        }}
                        className="hidden"
                      />
                      {section.videoUrl ? (
                        <div className="relative rounded-xl overflow-hidden group bg-black flex justify-center">
                          <video
                            src={section.videoUrl}
                            controls
                            preload="metadata"
                            className="max-w-full h-auto max-h-[500px] object-contain rounded-xl"
                          />
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                            <label
                              htmlFor={`section-video-${section.id}`}
                              className="px-3 py-1.5 bg-white text-black rounded-lg text-sm font-medium cursor-pointer hover:bg-white/90 transition-colors shadow-md"
                            >
                              Change
                            </label>
                            <button
                              onClick={() => setSections(sections.map(s =>
                                s.id === section.id ? { ...s, videoUrl: undefined, content: "" } : s
                              ))}
                              className="px-3 py-1.5 bg-destructive text-destructive-foreground rounded-lg text-sm font-medium hover:bg-destructive/90 transition-colors shadow-md"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ) : (
                        <label
                          htmlFor={`section-video-${section.id}`}
                          className="block border-2 border-dashed border-border rounded-xl p-8 text-center bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                        >
                          <Video className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">
                            Click to upload a video (max 100MB)
                          </p>
                        </label>
                      )}
                    </div>
                  ) : (
                    <div>
                      {/* Rich Text Toolbar */}
                      <div className="flex items-center gap-1 mb-2 p-1 bg-muted/50 rounded-lg border border-border/30 flex-wrap">
                        <button
                          type="button"
                          onClick={() => document.execCommand('bold')}
                          className="p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Bold"
                        >
                          <Bold className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => document.execCommand('italic')}
                          className="p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Italic"
                        >
                          <Italic className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => document.execCommand('strikeThrough')}
                          className="p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Strikethrough"
                        >
                          <Strikethrough className="w-4 h-4" />
                        </button>
                        <div className="w-px h-6 bg-border/50 mx-1" />
                        <button
                          type="button"
                          onClick={() => document.execCommand('fontSize', false, '5')}
                          className="p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Increase Font Size"
                        >
                          <AArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => document.execCommand('fontSize', false, '2')}
                          className="p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Decrease Font Size"
                        >
                          <AArrowDown className="w-4 h-4" />
                        </button>
                        <div className="w-px h-6 bg-border/50 mx-1" />
                        <button
                          type="button"
                          onClick={() => {
                            const url = prompt('Enter URL:');
                            if (url) document.execCommand('createLink', false, url);
                          }}
                          className="p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Insert Link"
                        >
                          <LinkIcon className="w-4 h-4" />
                        </button>
                      </div>
                      {/* ContentEditable Rich Text Area */}
                      <div
                        contentEditable
                        suppressContentEditableWarning
                        className="min-h-[150px] p-3 rounded-lg text-foreground bg-background border border-border focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary prose prose-sm dark:prose-invert max-w-none"
                        dangerouslySetInnerHTML={{ __html: section.content }}
                        onBlur={(e) => {
                          const html = e.currentTarget.innerHTML;
                          setSections(sections.map(s =>
                            s.id === section.id ? { ...s, content: html } : s
                          ));
                        }}
                      />
                    </div>
                  )}
                </div>
              ))}

              {/* Add Section Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="w-full border-2 border-dashed border-border rounded-2xl p-6 text-center text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-all duration-200"
                  >
                    <Plus className="w-5 h-5 inline-block mr-2" />
                    Add New Section
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-48">
                  <DropdownMenuItem onClick={() => addSection("text")} className="cursor-pointer">
                    <Type className="w-4 h-4 mr-2" />
                    Content Section
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => addSection("image")} className="cursor-pointer">
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Image Section
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => addSection("video")} className="cursor-pointer">
                    <Video className="w-4 h-4 mr-2" />
                    Video Section
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          {activeTab === "response" && (
            <ResponseTab projectId={id!} />
          )}

          {activeTab === "notification" && (
            <NotificationTab projectId={id!} />
          )}

          {activeTab === "knowledge" && (
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Upload Section */}
              <div className="bg-card rounded-2xl border border-border/30 p-8 shadow-card">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Database className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h2 className="font-display font-semibold text-xl">Knowledge Base</h2>
                      <p className="text-sm text-muted-foreground">
                        Upload documents to train your chatbot
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl gap-2"
                    onClick={handleRefreshKnowledge}
                    disabled={isRefreshing}
                  >
                    <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
                    {isRefreshing ? "Updating..." : "Refresh Knowledge"}
                  </Button>
                </div>

                <input
                  type="file"
                  id="doc-upload"
                  accept=".pdf,.txt,.doc,.docx"
                  onChange={handleDocumentUpload}
                  className="hidden"
                />
                <label
                  htmlFor="doc-upload"
                  className={`border-2 border-dashed rounded-2xl p-12 text-center transition-colors cursor-pointer block ${isDragging
                    ? "border-primary bg-primary/10"
                    : "border-border bg-muted/30 hover:bg-muted/50 hover:border-primary/50"
                    }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <div className="w-20 h-20 rounded-2xl bg-card shadow-card flex items-center justify-center mx-auto mb-6">
                    <Upload className={`w-10 h-10 ${isDragging ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <p className="font-semibold text-foreground text-lg mb-2">Upload Documents</p>
                  <p className="text-muted-foreground mb-4">
                    Drag & drop files or <span className="text-primary font-medium cursor-pointer">browse</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Supports PDF, TXT, DOC, DOCX (Max 10MB per file)
                  </p>
                </label>
              </div>

              {/* Document Library */}
              <div className="bg-card rounded-2xl border border-border/30 p-6 shadow-card">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                        <FolderOpen className="w-5 h-5 text-accent" />
                      </div>
                      <div>
                        <h3 className="font-display font-semibold text-lg">Knowledge Base Files</h3>
                        <p className="text-sm text-muted-foreground">{documents.length} files available</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="group relative bg-muted/30 rounded-2xl p-5 border border-border/50 hover:border-primary/50 hover:bg-muted/50 transition-all duration-300 hover:shadow-lg"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                            <FileText className="w-6 h-6 text-primary" />
                          </div>
                          <div className="flex opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-lg"
                              onClick={() => startEditingDoc(doc)}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => deleteDocument(doc.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          {editingDocId === doc.id ? (
                            <Input
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              onBlur={saveDocName}
                              onKeyDown={(e) => e.key === "Enter" && saveDocName()}
                              autoFocus
                              className="h-8 text-sm font-medium"
                            />
                          ) : (
                            <h4 className="font-semibold text-foreground truncate pr-2" title={doc.original_filename}>
                              {doc.original_filename}
                            </h4>
                          )}

                          <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <span 
                                className="font-medium text-primary bg-primary/10 px-2 py-0.5 rounded text-[10px] uppercase truncate max-w-[130px] inline-block"
                                title={doc.mime_type || "FILE"}
                              >
                                {doc.mime_type?.includes('wordprocessingml') ? 'DOCX' : doc.mime_type?.split('/')[1] || "FILE"}
                              </span>
                              <span className="flex-shrink-0">v{doc.version || 1}</span>
                            </div>
                            <div className="flex items-center gap-1.5 mt-1">
                              <Calendar className="w-3 h-3" />
                              <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                              <Clock className="w-3 h-3 ml-1" />
                              <span>{new Date(doc.created_at).toLocaleTimeString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

          {activeTab === "chatbot" && (
            <div className="max-w-4xl mx-auto">
              <div className="bg-card rounded-2xl border border-border/30 p-8 shadow-card text-center">
                <div className="w-32 h-32 flex items-center justify-center mx-auto mb-6">
                  <img src={defaultChatbotAvatar} alt="Chatbot" className="w-full h-full object-contain drop-shadow-md" />
                </div>
                <h2 className="font-display font-semibold text-2xl mb-3">Test Your Chatbot</h2>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Open the full chatbot testing interface to test responses, manage FAQs, and customize settings.
                </p>
                <Link to={`/project/${id}/chatbot`}>
                  <Button size="lg" className="rounded-xl gap-2">
                    <ExternalLink className="w-5 h-5" />
                    Open Chatbot Tester
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {activeTab === "audience" && (
            <div className="max-w-6xl mx-auto">
              <AudienceInsights projectId={id || "1"} />
            </div>
          )}
        </main>
      </div>

      {/* Response Detail Modal is now handled inside ResponseTab */}
      {/* Notification Detail Modal is now handled inside NotificationTab */}
    </div>
  );
};

export default Project;