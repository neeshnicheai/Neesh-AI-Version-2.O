import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, Send, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import apiClient from "@/lib/api";

interface Comment {
    id: string;
    name: string;
    text: string;
    timestamp: string;
}

interface CommentSectionProps {
    projectId: string;
}

const CommentSection = ({ projectId }: CommentSectionProps) => {
    const [comments, setComments] = useState<Comment[]>([]);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [text, setText] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // Fetch comments and subscribe to changes
    const fetchComments = async () => {
        try {
            const { data, error } = await (supabase as any)
                .from('blog_comments')
                .select('*')
                .eq('project_id', projectId)
                .order('created_at', { ascending: false });

            if (data && !error) {
                setComments(data.map((row: any) => ({
                    id: row.id,
                    name: row.name,
                    text: row.text,
                    timestamp: row.created_at
                })));
            }
        } catch (err) {
            console.error("Error fetching comments:", err);
        }
    };

    useEffect(() => {
        fetchComments();

        // Subscribe to real-time changes
        const channel = supabase
            .channel(`blog_comments_project_${projectId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'blog_comments',
                filter: `project_id=eq.${projectId}`
            }, (payload) => {
                console.log("[CommentSection] Received real-time update:", payload);
                fetchComments();
            })
            .subscribe((status) => {
                console.log(`[CommentSection] Subscription status for project ${projectId}:`, status);
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [projectId]);

    const handleSubmit = async () => {
        if (!name.trim() || !text.trim() || submitting) return;
        setSubmitting(true);

        try {
            const { error } = await (supabase as any).from('blog_comments').insert({
                project_id: projectId,
                name: name.trim(),
                text: text.trim()
            });

            if (!error) {
                // Also record this commenter as an audience member
                const resolvedEmail = email.trim() ||
                    `${name.trim().toLowerCase().replace(/\s+/g, '.')}.${Date.now()}@comment.anonymous`;
                apiClient.post(`/api/public/projects/${projectId}/feedback`, {
                    name: name.trim(),
                    email: resolvedEmail,
                    feedbackText: text.trim(),
                }, { skipAuth: true }).catch(() => {});

                setText("");
                fetchComments();
            } else {
                console.error("Failed to post comment:", error);
            }
        } catch (err) {
            console.error("Exception posting comment:", err);
        } finally {
            setSubmitting(false);
        }
    };

    const formatTime = (iso: string) => {
        const d = new Date(iso);
        const now = new Date();
        const diffMs = now.getTime() - d.getTime();
        const diffMin = Math.floor(diffMs / 60000);
        if (diffMin < 1) return "Just now";
        if (diffMin < 60) return `${diffMin}m ago`;
        const diffHr = Math.floor(diffMin / 60);
        if (diffHr < 24) return `${diffHr}h ago`;
        const diffDay = Math.floor(diffHr / 24);
        if (diffDay < 7) return `${diffDay}d ago`;
        return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    };

    return (
        <div className="w-full px-6 py-8">
            <div className="max-w-5xl mx-auto">
                <div className="relative bg-card border border-border/50 rounded-3xl p-6 md:p-8 shadow-sm">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <MessageCircle className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-foreground">Comments</h3>
                            <p className="text-sm text-muted-foreground">
                                {comments.length} {comments.length === 1 ? "comment" : "comments"}
                            </p>
                        </div>
                    </div>

                    {/* Comment Form */}
                    <div className="space-y-3 mb-8 p-4 bg-muted/30 rounded-2xl border border-border/30">
                        <div className="flex gap-2">
                            <Input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Your name *"
                                className="bg-background"
                            />
                            <Input
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Email (optional)"
                                type="email"
                                className="bg-background"
                            />
                        </div>
                        <div className="flex gap-2">
                            <Input
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                placeholder="Write a comment..."
                                className="flex-1 bg-background"
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSubmit();
                                    }
                                }}
                            />
                            <Button
                                onClick={handleSubmit}
                                disabled={!name.trim() || !text.trim() || submitting}
                                size="icon"
                                className="rounded-xl shrink-0"
                            >
                                {submitting ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Send className="w-4 h-4" />
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* Comments List */}
                    {comments.length === 0 ? (
                        <div className="text-center py-8">
                            <MessageCircle className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                            <p className="text-muted-foreground text-sm">No comments yet. Be the first to share your thoughts!</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {comments.map((comment) => (
                                <div
                                    key={comment.id}
                                    className="group flex gap-3 p-4 rounded-xl hover:bg-muted/30 transition-colors"
                                >
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center text-sm font-semibold text-foreground shrink-0">
                                        {comment.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-baseline gap-2 mb-1">
                                            <span className="font-medium text-foreground text-sm">{comment.name}</span>
                                            <span className="text-xs text-muted-foreground">{formatTime(comment.timestamp)}</span>
                                        </div>
                                        <p className="text-sm text-foreground/80 leading-relaxed">{comment.text}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CommentSection;
