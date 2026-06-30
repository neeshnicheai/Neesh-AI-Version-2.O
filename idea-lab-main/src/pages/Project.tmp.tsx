import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useParams, useNavigate, useSearchParams } from "react-router-dom";
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
import { useCoverImage } from "@/hooks/useCoverImage";
import { useProjects, type Project as ProjectType } from "@/hooks/useProjects";
import { useBlogs } from "@/hooks/useBlogs";
import { useDocuments } from "@/hooks/useDocuments";
import { useAudienceData } from "@/hooks/useAudienceData";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "sonner";

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
