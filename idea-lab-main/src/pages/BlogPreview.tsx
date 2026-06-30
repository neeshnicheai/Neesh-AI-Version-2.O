import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Image, Share2, Clock, Send, MessageCircle, Copy, Check, Link2, Loader2, Sparkles } from "lucide-react";
import { NeeshLogo } from "@/components/NeeshLogo";
import ReactMarkdown from 'react-markdown';
import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import defaultChatbotAvatar from "@/assets/chatbot-avatar.png";
import { toast } from "@/hooks/use-toast";
import { generateShareableUrl } from "@/lib/slugify";
import { useBlogs, type Blog, type CustomField } from "@/hooks/useBlogs";
import { useProjects } from "@/hooks/useProjects";
import { useCoverImage } from "@/hooks/useCoverImage";
import { supabase } from "@/integrations/supabase/client";
import { usePublicFAQs } from "@/hooks/useFAQs";
import CommentSection from "@/components/project/CommentSection";
import { useQuestions } from "@/hooks/useQuestions";
import apiClient from "@/lib/api";
import MoreLikeThis from "@/components/project/MoreLikeThis";
import BlogMetaTags from "@/components/BlogMetaTags";

interface FeedbackFormField {
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
}

interface Section {
  id: string;
  title: string;
  content: string;
  type: string;
  // For feedback sections
  feedbackTitle?: string;
  feedbackDescription?: string;
  feedbackFields?: FeedbackFormField[];
}

interface BlogData {
  title: string;
  coverImage?: string;
  sections: Section[];
}

interface ChatMessage {
  id: string;
  role: "user" | "bot";
  content: string;
  timestamp: Date;
}

interface BlogPreviewProps {
  publicId?: string;
}

const BlogPreview = ({ publicId }: BlogPreviewProps) => {
  const { id: paramId } = useParams();
  const id = publicId || paramId;
  const { getPublicBlog } = useBlogs();
  const { getProject } = useProjects();
  const { coverImage } = useCoverImage(id);
  const { faqs, loading: faqsLoading } = usePublicFAQs(id);
  const { reportQuestion } = useQuestions(id);

  const [blogData, setBlogData] = useState<BlogData | null>(null);

  // Chatbot settings derived from blogData
  const botName = blogData?.chatbot_name || 'Health Blog Assistant';
  const chatbotAvatar = blogData?.bot_avatar_url || defaultChatbotAvatar;
  const initialWelcomeMessage = blogData?.welcome_message || "Hello! 👋 I'm here to help answer any questions you have about this blog post. Feel free to ask me anything!";
  const [chatbotVisible, setChatbotVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadStartTime] = useState(() => Date.now());
  const [slowLoad, setSlowLoad] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [readingProgress, setReadingProgress] = useState(0);
  const [coverImageBroken, setCoverImageBroken] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("");
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  // Re-initialize welcome message when blogData changes
  useEffect(() => {
    setChatMessages([{
      id: "1",
      role: "bot",
      content: initialWelcomeMessage,
      timestamp: new Date(),
    }]);
  }, [initialWelcomeMessage]);
  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [feedbackValues, setFeedbackValues] = useState<Record<string, any>>({});
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [branding, setBranding] = useState<{
    subscriptionPlan: string;
    customLogoUrl: string | null;
    customBrandingText: string | null;
    showNeeshBranding: boolean;
  } | null>(null);

  // Generate a stable session ID once per page load for grouping anonymous chat questions
  const sessionIdRef = useRef<string>(
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function" 
      ? crypto.randomUUID() 
      : Math.random().toString(36).substring(2, 15)
  );

  const updateFeedbackValue = useCallback((fieldId: string, value: any) => {
    setFeedbackValues(prev => ({ ...prev, [fieldId]: value }));
  }, []);

  const handleFeedbackSubmit = useCallback(async () => {
    if (!id || submittingFeedback) return;

    const name = feedbackValues['__name__'] || '';
    const email = feedbackValues['__email__'] || '';
    const occupation = feedbackValues['__occupation__'] || '';

    // Build feedback text from all dynamic fields (skip our fixed fields)
    const feedbackParts: string[] = [];
    for (const [key, val] of Object.entries(feedbackValues)) {
      if (key.startsWith('__')) continue; // skip fixed fields
      if (val && typeof val === 'string') {
        feedbackParts.push(`${key}: ${val}`);
      } else if (val && typeof val === 'number') {
        feedbackParts.push(`${key}: ${val}`);
      } else if (val && typeof val === 'boolean') {
        feedbackParts.push(`${key}: ${val ? 'Yes' : 'No'}`);
      } else if (Array.isArray(val)) {
        feedbackParts.push(`${key}: ${val.join(', ')}`);
      }
    }

    if (!name.trim() || !email.trim()) {
      toast({ title: "Missing info", description: "Please fill in your name and email.", variant: "destructive" });
      return;
    }

    setSubmittingFeedback(true);
    try {
      await apiClient.post(`/api/public/projects/${id}/feedback`, {
        name: name.trim(),
        email: email.trim(),
        occupation: occupation.trim() || undefined,
        feedbackText: feedbackParts.join('\n') || 'Feedback submitted via blog',
      }, { skipAuth: true });

      toast({ title: "Thank you! 🎉", description: "Your feedback has been submitted successfully." });
      setFeedbackSubmitted(true);
      // Allow re-submission after 3 seconds
      setTimeout(() => {
        setFeedbackSubmitted(false);
        setFeedbackValues(prev => {
          // Keep name/email/occupation, reset dynamic fields
          const kept: Record<string, any> = {};
          if (prev['__name__']) kept['__name__'] = prev['__name__'];
          if (prev['__email__']) kept['__email__'] = prev['__email__'];
          if (prev['__occupation__']) kept['__occupation__'] = prev['__occupation__'];
          return kept;
        });
      }, 3000);
    } catch (err) {
      console.error('Feedback submission error:', err);
      toast({ title: "Submission failed", description: "Please try again later.", variant: "destructive" });
    } finally {
      setSubmittingFeedback(false);
    }
  }, [id, feedbackValues, submittingFeedback]);

  const heroRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Map<string, HTMLElement>>(new Map());
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const chatbotSectionRef = useRef<HTMLDivElement>(null);
  const commentSectionRef = useRef<HTMLDivElement>(null);

  // Show "taking longer than usual" after 5 seconds (Render cold start)
  useEffect(() => {
    if (!loading) return;
    const timer = setTimeout(() => setSlowLoad(true), 5000);
    return () => clearTimeout(timer);
  }, [loading]);

  // Fetch blog data from the database — only depends on `id`, NOT `coverImage`
  // coverImage from localStorage is used as a fallback at render time, not as a trigger.
  useEffect(() => {
    const loadBlogData = async () => {
      if (!id) return;
      setLoading(true);

      try {
        console.log(`[BlogPreview] Starting data fetch for id: ${id}, publicMode: ${!!publicId}`);
        // For public access (shared link), only fetch blog data via public endpoint
        // For owner preview, also fetch project data for additional context
        const blog = await getPublicBlog(id);
        console.log("[BlogPreview] Public blog response:", blog);

        const project = publicId ? null : await getProject(id).catch(() => null);
        console.log("[BlogPreview] Project response (fallback):", project);

        if (blog || project) {
          // Build sections from blog data
          const sections: Section[] = [];

          if (blog?.introduction) {
            sections.push({
              id: "intro",
              title: "Introduction",
              content: blog.introduction,
              type: "text",
            });
          }

          if (blog?.content) {
            sections.push({
              id: "content",
              title: "Content",
              content: blog.content,
              type: "text",
            });
          }

          // Add custom fields as sections
          if (blog?.custom_fields && Array.isArray(blog.custom_fields)) {
            blog.custom_fields.forEach((field: any, idx: number) => {
              if (field.type === "feedback") {
                // Feedback form section
                sections.push({
                  id: field.id || `feedback-${idx}`,
                  title: field.title || "Feedback Form",
                  content: field.description || "",
                  type: "feedback",
                  feedbackTitle: field.title,
                  feedbackDescription: field.description,
                  feedbackFields: field.fields || [],
                });
              } else if (field.type === "image" && field.value) {
                // Image section
                sections.push({
                  id: field.id,
                  title: `Image ${field.order + 1}`,
                  content: field.value,
                  type: "image",
                });
              } else if (field.type === "video" && field.value) {
                // Video section
                sections.push({
                  id: field.id,
                  title: `Video ${field.order + 1}`,
                  content: field.value,
                  type: "video",
                });
              } else if (field.value) {
                // Content/text section
                sections.push({
                  id: field.id,
                  title: `Section ${field.order + 1}`,
                  content: field.value,
                  type: field.type || "text",
                });
              }
            });
          }


          console.log("Raw blog data:", blog);
          console.log("Constructed sections:", sections);

          // Use DB image if available and non-empty, otherwise try localStorage fallback
          const dbCoverImage = blog?.cover_image_url && blog.cover_image_url.length > 10 ? blog.cover_image_url : null;
          const finalCoverImage = dbCoverImage || coverImage || undefined;

          setBlogData({
            title: blog?.heading || project?.title || "Untitled",
            coverImage: finalCoverImage,
            sections,
          });
          console.log('[BlogPreview] Cover image source:',
            dbCoverImage ? `DB (len=${dbCoverImage.length}, starts=${dbCoverImage.substring(0, 50)})` :
              coverImage ? `localStorage (len=${coverImage.length})` : 'NONE — image not saved to DB or localStorage');
        }
      } catch (err) {
        console.error("Error loading blog data:", err);
      } finally {
        setLoading(false);
        setSlowLoad(false);
      }
    };

    loadBlogData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Fetch branding info for the blog
  useEffect(() => {
    if (!id) return;
    const fetchBranding = async () => {
      try {
        const data = await apiClient.get<{
          subscriptionPlan: string;
          customLogoUrl: string | null;
          customBrandingText: string | null;
          showNeeshBranding: boolean;
        }>(`/api/public/blog-branding/${id}`, { skipAuth: true });
        setBranding(data);
      } catch (err) {
        console.error("[BlogPreview] Error fetching branding:", err);
        setBranding({ subscriptionPlan: "FREE", customLogoUrl: null, customBrandingText: null, showNeeshBranding: true });
      }
    };
    fetchBranding();
  }, [id]);

  // Scroll and reading progress effect - MUST be before any conditional returns
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);

      // Calculate reading progress
      if (contentRef.current) {
        const contentTop = contentRef.current.offsetTop;
        const contentHeight = contentRef.current.scrollHeight;
        const windowHeight = window.innerHeight;
        const scrolled = window.scrollY - contentTop + windowHeight;
        const progress = Math.min(100, Math.max(0, (scrolled / contentHeight) * 100));
        setReadingProgress(progress);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Intersection observer for section visibility
  useEffect(() => {
    if (!blogData) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const sectionId = entry.target.getAttribute("data-section-id");
          if (sectionId) {
            setVisibleSections((prev) => {
              const newSet = new Set(prev);
              if (entry.isIntersecting) {
                newSet.add(sectionId);
                setActiveSection(sectionId);
              }
              return newSet;
            });
          }
        });
      },
      { threshold: 0.3, rootMargin: "-20% 0px -60% 0px" }
    );

    sectionRefs.current.forEach((element) => {
      observer.observe(element);
    });

    return () => observer.disconnect();
  }, [blogData]);

  // Intersection observer for floating chatbot FAB visibility
  useEffect(() => {
    if (!chatbotSectionRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => setChatbotVisible(entry.isIntersecting),
      { threshold: 0.1 }
    );
    observer.observe(chatbotSectionRef.current);
    return () => observer.disconnect();
  }, [blogData]);

  // Scroll chat to bottom when new messages arrive, but only if user is near bottom
  useEffect(() => {
    if (!chatContainerRef.current) return;
    
    const container = chatContainerRef.current;
    const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 150;
    
    if (isAtBottom) {
      // Use scrollTo on the container instead of scrollIntoView on the element
      // to avoid jumping the whole page viewport
      container.scrollTo({
        top: container.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [chatMessages, isTyping]);

  // Calculate reading time
  const readingTime = useMemo(() => {
    if (!blogData) return 0;
    const totalWords = blogData.sections.reduce((acc, section) => {
      return acc + (section.content?.split(/\s+/).length || 0) + (section.title?.split(/\s+/).length || 0);
    }, 0) + (blogData.title?.split(/\s+/).length || 0);
    return Math.max(1, Math.ceil(totalWords / 200));
  }, [blogData]);

  // FAQ chips for quick questions
  const defaultChips = [
    "Summarize this blog",
    "What's the main takeaway?",
    "Explain in simple terms",
    "Related topics?",
  ];

  const faqChips = useMemo(() => {
    if (faqs && faqs.length > 0) {
      return faqs.map(f => f.question);
    }
    return defaultChips;
  }, [faqs]);

  const shareableUrl = useMemo(() => {
    if (!blogData || !id) return "";
    return generateShareableUrl(id, blogData.title);
  }, [blogData, id]);

  // Render feedback form field based on type
  const renderFeedbackField = (field: FeedbackFormField) => {
    const value = feedbackValues[field.label] ?? '';
    switch (field.type) {
      case "short_text":
      case "email":
      case "phone":
      case "url":
      case "number":
        return (
          <Input
            type={field.type === "number" ? "number" : field.type === "email" ? "email" : "text"}
            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
            className="w-full"
            value={value}
            onChange={(e) => updateFeedbackValue(field.label, field.type === "number" ? Number(e.target.value) : e.target.value)}
          />
        );
      case "long_text":
        return (
          <textarea
            placeholder={field.placeholder || "Enter your response..."}
            className="w-full min-h-[120px] px-3 py-2 border border-border rounded-lg bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            value={value}
            onChange={(e) => updateFeedbackValue(field.label, e.target.value)}
          />
        );
      case "rating":
        return (
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => updateFeedbackValue(field.label, star)}
                className={`w-10 h-10 rounded-lg border transition-colors text-lg ${value >= star
                  ? 'bg-primary/20 border-primary shadow-sm'
                  : 'border-border hover:bg-primary/10 hover:border-primary'
                  }`}
              >
                ⭐
              </button>
            ))}
          </div>
        );
      case "multiple_choice":
        return (
          <div className="space-y-2">
            {field.options?.map((option, idx) => (
              <label key={idx} className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${value === option ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted/30'
                }`}>
                <input type="radio" name={field.id} className="w-4 h-4" checked={value === option}
                  onChange={() => updateFeedbackValue(field.label, option)} />
                <span className="text-foreground">{option}</span>
              </label>
            ))}
          </div>
        );
      case "checkboxes": {
        const checkedValues: string[] = Array.isArray(value) ? value : [];
        return (
          <div className="space-y-2">
            {field.options?.map((option, idx) => (
              <label key={idx} className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${checkedValues.includes(option) ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted/30'
                }`}>
                <input type="checkbox" className="w-4 h-4" checked={checkedValues.includes(option)}
                  onChange={(e) => {
                    const newValues = e.target.checked
                      ? [...checkedValues, option]
                      : checkedValues.filter(v => v !== option);
                    updateFeedbackValue(field.label, newValues);
                  }} />
                <span className="text-foreground">{option}</span>
              </label>
            ))}
          </div>
        );
      }
      case "dropdown":
        return (
          <select className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
            value={value}
            onChange={(e) => updateFeedbackValue(field.label, e.target.value)}>
            <option value="">Select an option</option>
            {field.options?.map((option, idx) => (
              <option key={idx} value={option}>{option}</option>
            ))}
          </select>
        );
      case "linear_scale":
        return (
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{field.scaleMinLabel || field.scaleMin}</span>
            <div className="flex gap-2">
              {Array.from({ length: (field.scaleMax || 5) - (field.scaleMin || 1) + 1 }, (_, i) => (field.scaleMin || 1) + i).map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => updateFeedbackValue(field.label, num)}
                  className={`w-10 h-10 rounded-lg border transition-colors font-medium ${value === num
                    ? 'bg-primary/20 border-primary shadow-sm'
                    : 'border-border hover:bg-primary/10 hover:border-primary'
                    }`}
                >
                  {num}
                </button>
              ))}
            </div>
            <span className="text-sm text-muted-foreground">{field.scaleMaxLabel || field.scaleMax}</span>
          </div>
        );
      case "date":
        return <Input type="date" className="w-full" value={value} onChange={(e) => updateFeedbackValue(field.label, e.target.value)} />;
      case "time":
        return <Input type="time" className="w-full" value={value} onChange={(e) => updateFeedbackValue(field.label, e.target.value)} />;
      case "toggle":
        return (
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" className="w-5 h-5" checked={!!value}
              onChange={(e) => updateFeedbackValue(field.label, e.target.checked)} />
            <span className="text-foreground">{field.placeholder || "Toggle"}</span>
          </label>
        );
      case "occupation":
        return <Input placeholder={field.placeholder || "e.g. Developer, Designer, Student..."} className="w-full" value={value}
          onChange={(e) => updateFeedbackValue(field.label, e.target.value)} />;
      default:
        return <Input placeholder={field.placeholder} className="w-full" value={value}
          onChange={(e) => updateFeedbackValue(field.label, e.target.value)} />;
    }
  };
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        {/* Skeleton Hero */}
        <div className="relative h-[80vh] overflow-hidden bg-gradient-to-br from-primary/10 via-accent/5 to-background">
          <div className="absolute inset-0">
            <div className="absolute w-64 h-64 rounded-full bg-primary/10 blur-3xl animate-pulse" style={{ top: '10%', left: '20%' }} />
            <div className="absolute w-48 h-48 rounded-full bg-accent/15 blur-3xl animate-pulse" style={{ top: '40%', right: '15%', animationDelay: '1s' }} />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16">
            <div className="max-w-5xl mx-auto space-y-4">
              <div className="h-12 w-3/4 bg-muted/50 rounded-xl animate-pulse" />
              <div className="h-8 w-1/2 bg-muted/30 rounded-lg animate-pulse" style={{ animationDelay: '200ms' }} />
            </div>
          </div>
        </div>

        {/* Skeleton Content */}
        <div className="max-w-5xl mx-auto px-6 py-16 space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card border border-border p-8 shadow-sm space-y-4" style={{ animationDelay: `${i * 150}ms` }}>
              <div className="h-4 w-full bg-muted/40 rounded animate-pulse" />
              <div className="h-4 w-5/6 bg-muted/30 rounded animate-pulse" style={{ animationDelay: '100ms' }} />
              <div className="h-4 w-4/6 bg-muted/20 rounded animate-pulse" style={{ animationDelay: '200ms' }} />
            </div>
          ))}
        </div>

        {/* Centered loading indicator */}
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
          <div className="flex items-center gap-3 px-5 py-3 rounded-full bg-card/90 backdrop-blur-xl border border-border/50 shadow-lg">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">
              {slowLoad ? 'Almost there — waking up the servers...' : 'Loading blog...'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  const handleSendMessage = async (message: string) => {
    if (!message.trim() || isTyping) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: message,
      timestamp: new Date(),
    };

    setChatMessages((prev) => [...prev, userMessage]);
    setChatInput("");
    setIsTyping(true);

    try {
      // Call the backend API (same endpoint as the chatbot tester)
      const response = await apiClient.post<any>(`/api/public/projects/${id}/chat`, {
        query: message,
        userName: feedbackValues['__name__'] || undefined,
        userEmail: feedbackValues['__email__'] || undefined,
        sessionId: sessionIdRef.current,
      }, { skipAuth: true });

      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "bot",
        content: response?.answer || "I couldn't generate a response.",
        timestamp: new Date(),
      };

      setChatMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      console.error("Chat error:", err);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "bot",
        content: "I'm sorry, something went wrong. Please try again.",
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleShare = async () => {
    if (!shareableUrl) return;
    await navigator.clipboard.writeText(shareableUrl);
    setLinkCopied(true);
    toast({
      title: "Link copied!",
      description: "Shareable blog URL has been copied to clipboard.",
    });
    setTimeout(() => setLinkCopied(false), 2000);
  };


  const scrollToSection = (sectionId: string) => {
    const element = sectionRefs.current.get(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Meta tags for social sharing */}
      <BlogMetaTags
        title={blogData?.title || "Untitled Blog"}
        description={blogData?.sections?.[0]?.content?.substring(0, 160) || "Read this blog on Neesh AI"}
        imageUrl={blogData?.coverImage || undefined}
        url={shareableUrl}
      />
      {/* Reading Progress Bar */}
      <div className="fixed top-0 left-0 right-0 z-[60] h-1">
        <div
          className="h-full bg-gradient-to-r from-primary via-accent to-primary transition-all duration-150 ease-out"
          style={{ width: `${readingProgress}%` }}
        />
      </div>

      {/* Floating Header */}
      <header className="fixed top-1 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/30">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to={publicId ? "/" : "/dashboard"}>
            <NeeshLogo size="sm" />
          </Link>

          <div className="flex items-center gap-3">
            {blogData && (
              <>
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 text-sm text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{readingTime} min read</span>
                </div>

                {/* Shareable link with copy */}
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border border-border/50">
                  <Link2 className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground max-w-[150px] truncate">
                    {shareableUrl.replace(window.location.origin, '')}
                  </span>
                  <button
                    onClick={handleShare}
                    className="p-1 hover:bg-muted rounded transition-colors"
                  >
                    {linkCopied ? (
                      <Check className="w-3.5 h-3.5 text-green-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                    )}
                  </button>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full md:hidden"
                  onClick={handleShare}
                >
                  {linkCopied ? <Check className="w-4 h-4 text-green-500" /> : <Share2 className="w-4 h-4" />}
                </Button>
              </>
            )}
            {!publicId && (
              <Link to={`/project/${id}?tab=blog`}>
                <Button variant="outline" className="rounded-2xl gap-2">
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Back to Editor</span>
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Floating Section Navigation */}
      {blogData && blogData.sections.length > 0 && (
        <nav className="fixed right-6 top-1/2 -translate-y-1/2 z-40 hidden lg:flex flex-col gap-3">
          {blogData.sections.map((section, index) => (
            <button
              key={section.id}
              onClick={() => scrollToSection(section.id)}
              className="group relative flex items-center justify-end"
              aria-label={`Go to ${section.title}`}
            >
              <span className="absolute right-6 px-2 py-1 rounded-lg bg-slate-900 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-md z-50 pointer-events-none">
                {section.title || `Section ${index + 1}`}
              </span>
              <div
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${activeSection === section.id
                  ? "bg-accent scale-125 shadow-[0_0_12px_hsl(var(--accent))]"
                  : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                  }`}
              />
            </button>
          ))}

          {/* Comment Section dot */}
          <button
            onClick={() => commentSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
            className="group relative flex items-center justify-end"
            aria-label="Go to Comments"
          >
            <span className="absolute right-6 px-2 py-1 rounded-lg bg-slate-900 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-md z-50 pointer-events-none">
              Comments
            </span>
            <div className="w-2.5 h-2.5 rounded-full transition-all duration-300 bg-muted-foreground/30 hover:bg-muted-foreground/50" />
          </button>

          {/* Chatbot Section dot */}
          <button
            onClick={() => chatbotSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
            className="group relative flex items-center justify-end"
            aria-label="Go to Chatbot"
          >
            <span className="absolute right-6 px-2 py-1 rounded-lg bg-slate-900 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-md z-50 pointer-events-none">
              AI Chatbot
            </span>
            <div className="w-2.5 h-2.5 rounded-full transition-all duration-300 bg-muted-foreground/30 hover:bg-muted-foreground/50" />
          </button>
        </nav>
      )}

      {blogData ? (
        <>
          {/* Hero Section with Parallax - PRESERVED */}
          <div ref={heroRef} className="relative h-[80vh] overflow-hidden">
            {blogData.coverImage && !coverImageBroken ? (
              <div
                className="absolute inset-0"
                style={{ transform: `translateY(${scrollY * 0.4}px)` }}
              >
                <img
                  src={blogData.coverImage}
                  alt="Cover"
                  className="w-full h-[120%] object-cover"
                  loading="lazy"
                  decoding="async"
                  onError={() => setCoverImageBroken(true)}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
              </div>
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-accent/10 to-background overflow-hidden">
                {/* Animated floating orbs */}
                <div className="absolute inset-0">
                  <div
                    className="absolute w-64 h-64 rounded-full bg-primary/10 blur-3xl animate-float"
                    style={{ top: "10%", left: "20%", animationDelay: "0s" }}
                  />
                  <div
                    className="absolute w-48 h-48 rounded-full bg-accent/15 blur-3xl animate-float"
                    style={{ top: "40%", right: "15%", animationDelay: "2s" }}
                  />
                  <div
                    className="absolute w-56 h-56 rounded-full bg-primary/8 blur-3xl animate-float"
                    style={{ bottom: "20%", left: "30%", animationDelay: "4s" }}
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
              </div>
            )}

            {/* Title Content - PRESERVED */}
            <div
              className="absolute bottom-0 left-0 right-0 p-8 md:p-16"
              style={{
                transform: `translateY(${scrollY * 0.2}px)`,
                opacity: Math.max(0, 1 - scrollY / 400),
              }}
            >
              <div className="max-w-5xl mx-auto">
                <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold text-foreground leading-tight drop-shadow-lg">
                  {blogData.title || "Untitled Blog"}
                </h1>
              </div>
            </div>

            {/* Scroll indicator */}
            <div
              className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-muted-foreground"
              style={{ opacity: Math.max(0, 1 - scrollY / 200) }}
            >
              <span className="text-xs uppercase tracking-widest">Scroll</span>
              <div className="w-px h-8 bg-gradient-to-b from-muted-foreground/50 to-transparent animate-pulse" />
            </div>
          </div>

          {/* Blog Content */}
          <main ref={contentRef} className="relative bg-background">
            <div className="max-w-5xl mx-auto px-6 py-16">
              {/* Sections with glassmorphism and animations */}
              <div className="space-y-4">
                {blogData.sections.map((section, index) => (
                  <section
                    key={section.id}
                    ref={(el) => {
                      if (el) sectionRefs.current.set(section.id, el);
                    }}
                    data-section-id={section.id}
                    className="relative transition-all duration-700 opacity-100 translate-y-0"
                    style={{ transitionDelay: `${index * 100}ms` }}
                  >
                    {(() => { console.log(`Rendering section [${section.id}], type: ${section.type}, content length: ${section.content?.length}`); return null; })()}
                    {/* Clean card styling - no glassmorphism per design system */}
                    <div className="relative bg-card border border-border p-8 shadow-sm overflow-hidden">
                      {/* Accent line */}
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />

                      {section.type === "feedback" ? (
                        // Render Feedback Form
                        <div className="pl-4">
                          <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-2">
                            {section.feedbackTitle || section.title}
                          </h2>
                          {section.feedbackDescription && (
                            <p className="text-muted-foreground mb-6">{section.feedbackDescription}</p>
                          )}
                          <div className="space-y-6">
                            {/* Fixed identity fields */}
                            <div className="space-y-2">
                              <label className="block text-foreground font-medium">Name <span className="text-destructive ml-1">*</span></label>
                              <Input placeholder="Your name" className="w-full" value={feedbackValues['__name__'] || ''}
                                onChange={(e) => updateFeedbackValue('__name__', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                              <label className="block text-foreground font-medium">Email <span className="text-destructive ml-1">*</span></label>
                              <Input type="email" placeholder="your@email.com" className="w-full" value={feedbackValues['__email__'] || ''}
                                onChange={(e) => updateFeedbackValue('__email__', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                              <label className="block text-foreground font-medium">Occupation</label>
                              <Input placeholder="e.g. Developer, Designer, Student..." className="w-full" value={feedbackValues['__occupation__'] || ''}
                                onChange={(e) => updateFeedbackValue('__occupation__', e.target.value)} />
                            </div>
                            {/* Dynamic feedback fields from form builder — skip name/email/occupation duplicates */}
                            {section.feedbackFields?.filter((field) => {
                              const lbl = (field.label || '').toLowerCase().trim();
                              // Skip fields that duplicate our fixed identity fields
                              if (lbl.includes('name') || lbl.includes('your name')) return false;
                              if (lbl.includes('email') || lbl.includes('e-mail') || field.type === 'email') return false;
                              if (lbl.includes('occupation') || lbl.includes('job') || lbl.includes('profession') || lbl.includes('role')) return false;
                              return true;
                            }).map((field) => (
                              <div key={field.id} className="space-y-2">
                                <label className="block text-foreground font-medium">
                                  {field.label}
                                  {field.required && <span className="text-destructive ml-1">*</span>}
                                </label>
                                {renderFeedbackField(field)}
                              </div>
                            ))}
                            {feedbackSubmitted ? (
                              <div className="w-full mt-4 p-4 rounded-lg bg-green-500/10 border border-green-500/30 text-center">
                                <p className="text-green-600 dark:text-green-400 font-medium">✅ Thank you! Your feedback has been submitted.</p>
                              </div>
                            ) : (
                              <Button className="w-full mt-4" onClick={handleFeedbackSubmit} disabled={submittingFeedback}>
                                {submittingFeedback ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</> : 'Submit Feedback'}
                              </Button>
                            )}
                          </div>
                        </div>
                      ) : section.type === "image" ? (
                        // Render Image Section — no label in preview
                        <div className="pl-4 flex justify-center bg-muted/5 rounded-xl overflow-hidden">
                          <img
                            src={section.content}
                            alt={section.title}
                            className="max-w-full h-auto max-h-[600px] object-contain rounded-xl"
                          />
                        </div>
                      ) : section.type === "video" ? (
                        // Render Video Section — no label in preview
                        <div className="pl-4 flex justify-center rounded-xl overflow-hidden bg-black">
                          <video
                            src={section.content}
                            controls
                            preload="metadata"
                            className="max-w-full h-auto max-h-[600px] object-contain rounded-xl"
                          />
                        </div>
                      ) : (
                        // Render Text/Content Section — no label in preview
                        <>
                          {section.content ? (
                            <div
                              className="text-slate-900 dark:text-slate-50 leading-relaxed text-base pl-4 prose prose-slate dark:prose-invert max-w-none"
                              dangerouslySetInnerHTML={{ __html: section.content }}
                            />
                          ) : (
                            <p className="text-muted-foreground italic pl-4">
                              No content added yet...
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  </section>
                ))}
              </div>

              {blogData.sections.length === 0 && (
                <div className="text-center py-16 text-muted-foreground">
                  <p className="text-lg">No sections added yet.</p>
                  <p className="text-sm mt-2">Go back to the editor to add content.</p>
                </div>
              )}
            </div>

            {/* Comment Section */}
            <div ref={commentSectionRef}>
              {id && <CommentSection projectId={id} />}
            </div>

            {/* Embedded Chatbot Section */}
            <div ref={chatbotSectionRef} className="w-full px-6 pb-16">
              <div className="max-w-5xl mx-auto">
                <div className="relative bg-card/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-xl overflow-hidden">
                  {/* Decorative glow */}
                  <div className="absolute -top-20 -right-20 w-40 h-40 bg-accent/20 rounded-full blur-3xl" />
                  <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-primary/20 rounded-full blur-3xl" />

                  {/* Header */}
                  <div className="relative flex items-center gap-4 mb-6">
                    <div className="relative">
                      <div className="w-16 h-16 drop-shadow-[0_0_20px_hsl(var(--accent)/0.3)]">
                        <img src={chatbotAvatar} alt="AI Assistant" className="w-full h-full object-contain" />
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-card" />
                    </div>
                    <div>
                      <h3 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
                        <MessageCircle className="w-5 h-5 text-accent" />
                        {botName}
                      </h3>
                      <p className="text-sm text-muted-foreground">Have questions? I'm here to help!</p>
                    </div>
                  </div>

                  {/* Warning when email/name not provided */}
                  {(!feedbackValues['__name__']?.trim() || !feedbackValues['__email__']?.trim()) && (
                    <div className="relative flex items-start gap-3 mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
                      <Sparkles className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-amber-600 dark:text-amber-400">
                        Please enter your Name and Email in the feedback form to receive replies to your questions.
                      </p>
                    </div>
                  )}

                  {/* FAQ Chips */}
                  <div className="relative flex flex-wrap gap-2 mb-6">
                    {faqs.map((faq) => (
                      <button
                        key={faq.id}
                        onClick={() => handleSendMessage(faq.question)}
                        className="px-4 py-2 rounded-full bg-muted/50 hover:bg-muted text-sm text-foreground border border-border/50 transition-all hover:scale-105 hover:shadow-md"
                      >
                        {faq.question}
                      </button>
                    ))}
                  </div>

                  {/* Chat Messages */}
                  <div 
                    ref={chatContainerRef}
                    className="relative h-64 overflow-y-auto mb-4 space-y-4 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent pr-2"
                  >
                    {chatMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl px-4 py-3 ${msg.role === "user"
                            ? "bg-primary text-primary-foreground rounded-br-md"
                            : "bg-muted/80 text-foreground border border-border/50 rounded-bl-md shadow-sm"
                            }`}
                        >
                          {msg.role === "user" ? (
                            <p className="text-[15px] sm:text-base leading-relaxed tracking-wide whitespace-pre-wrap">{msg.content}</p>
                          ) : (
                            <div className="prose prose-sm dark:prose-invert max-w-none text-left w-full break-words [&>p]:mb-3 [&>p:last-child]:mb-0 [&>ul]:mb-3 [&>ol]:mb-3 [&>ul]:pl-6 [&>ol]:pl-6 [&>li]:mb-2 [&>ul>li]:list-disc [&>ol>li]:list-decimal leading-relaxed">
                              <ReactMarkdown>
                                {msg.content}
                              </ReactMarkdown>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Typing indicator */}
                    {isTyping && (
                      <div className="flex justify-start">
                        <div className="bg-muted/80 rounded-2xl rounded-bl-md px-4 py-3">
                          <div className="flex gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: "0ms" }} />
                            <div className="w-2 h-2 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: "150ms" }} />
                            <div className="w-2 h-2 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: "300ms" }} />
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Input Area */}
                  <div className="relative flex gap-3">
                    <Input
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage(chatInput);
                        }
                      }}
                      placeholder="Type your question..."
                      className="flex-1 rounded-xl bg-muted/50 border-border/50 focus:border-accent"
                    />
                    <Button
                      onClick={() => handleSendMessage(chatInput)}
                      disabled={!chatInput.trim() || isTyping}
                      className="rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* More Like This — Tag-based cross-promotion carousel */}
            <div className="max-w-5xl mx-auto px-6">
              <MoreLikeThis projectId={id} />
            </div>

            {/* Branding Footer */}
            <footer className="border-t border-border/30 mt-12 py-8">
              <div className="max-w-5xl mx-auto px-6 text-center">
                {branding?.showNeeshBranding !== false ? (
                  <div className="flex items-center justify-center gap-2 opacity-60 hover:opacity-100 transition-opacity">
                    <span className="text-xs text-muted-foreground">Powered by</span>
                    <NeeshLogo size="sm" />
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-3">
                    {branding?.customLogoUrl && (
                      <img
                        src={branding.customLogoUrl}
                        alt="Brand logo"
                        className="h-6 w-auto object-contain"
                      />
                    )}
                    {branding?.customBrandingText && (
                      <span className="text-sm text-muted-foreground font-medium">
                        {branding.customBrandingText}
                      </span>
                    )}
                    {!branding?.customLogoUrl && !branding?.customBrandingText && (
                      <div className="flex items-center justify-center gap-2 opacity-60">
                        <span className="text-xs text-muted-foreground">Powered by</span>
                        <NeeshLogo size="sm" />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </footer>
          </main>
        </>
      ) : (
        <main className="pt-24 max-w-3xl mx-auto px-6 py-12">
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-3xl bg-muted/50 flex items-center justify-center mx-auto mb-6">
              <Image className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="font-display text-2xl font-semibold text-foreground mb-2">
              No Blog Content
            </h2>
            <p className="text-muted-foreground mb-6">
              {publicId ? "This blog has no content yet." : "Start editing your blog to see the preview here."}
            </p>
            {!publicId && (
              <Link to={`/project/${id}?tab=blog`}>
                <Button className="rounded-2xl">Go to Editor</Button>
              </Link>
            )}
          </div>
        </main>
      )}

      {/* Floating Chatbot FAB — uses chatbot avatar icon */}
      {blogData && !chatbotVisible && (
        <button
          onClick={() => chatbotSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
          className="group fixed bottom-6 right-6 z-50 flex items-center gap-0 hover:gap-3 transition-all duration-300"
          aria-label="Chat with AI"
        >
          {/* Tooltip bubble */}
          <span className="max-w-0 overflow-hidden group-hover:max-w-[150px] transition-all duration-300 whitespace-nowrap bg-card border border-border/50 text-foreground text-sm font-medium px-0 group-hover:px-3 py-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100">
            Any help ??
          </span>
          {/* Avatar circle */}
          <div className="w-32 h-32 hover:scale-110 transition-transform duration-200 drop-shadow-[0_0_20px_rgba(9,218,237,0.7)]">
            <img src={chatbotAvatar} alt="AI Assistant" className="w-full h-full object-contain" />
          </div>
        </button>
      )}
    </div>
  );
};

export default BlogPreview;
