import { useState, useMemo } from "react";
import {
    X,
    Users,
    Send,
    CheckCircle2,
    Clock,
    Mail,
    Loader2,
    ChevronDown,
    ChevronUp,
    User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ClusterSummary, ClusterDetail, ClusterInstance } from "@/hooks/useNotifications";
import { toast } from "sonner";

interface ClusterDetailModalProps {
    cluster: ClusterSummary;
    detail: ClusterDetail | null;
    detailLoading: boolean;
    sendingReply: boolean;
    onClose: () => void;
    onSendReply: (
        clusterId: string,
        instanceIds: string[],
        answerText: string,
        emailSubject: string,
        sendToAll: boolean
    ) => Promise<any>;
}

const statusColors: Record<string, { bg: string; text: string; label: string }> = {
    UNANSWERED: { bg: "bg-red-500/15", text: "text-red-400", label: "Unanswered" },
    PARTIALLY_ANSWERED: { bg: "bg-amber-500/15", text: "text-amber-400", label: "Partial" },
    ANSWERED: { bg: "bg-emerald-500/15", text: "text-emerald-400", label: "Answered" },
    MONITORING: { bg: "bg-blue-500/15", text: "text-blue-400", label: "Monitoring" },
    RESOLVED: { bg: "bg-gray-500/15", text: "text-gray-400", label: "Resolved" },
};

const personaColors: Record<string, { bg: string; text: string }> = {
    developer: { bg: "bg-orange-500/15", text: "text-orange-400" },
    marketer: { bg: "bg-purple-500/15", text: "text-purple-400" },
    designer: { bg: "bg-pink-500/15", text: "text-pink-400" },
    entrepreneur: { bg: "bg-yellow-500/15", text: "text-yellow-400" },
    investor: { bg: "bg-emerald-500/15", text: "text-emerald-400" },
    researcher: { bg: "bg-cyan-500/15", text: "text-cyan-400" },
    default: { bg: "bg-muted", text: "text-muted-foreground" },
};

function timeAgo(dateStr: string): string {
    const now = Date.now();
    const then = new Date(dateStr).getTime();
    const diff = now - then;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function ClusterDetailModal({
    cluster,
    detail,
    detailLoading,
    sendingReply,
    onClose,
    onSendReply,
}: ClusterDetailModalProps) {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [answerText, setAnswerText] = useState("");
    const [emailSubject, setEmailSubject] = useState(`Re: ${cluster.canonicalQuestion.slice(0, 60)}`);
    const [showReplyHistory, setShowReplyHistory] = useState(false);

    const instances = detail?.instances || [];
    const replyHistory = detail?.replyHistory || [];
    const unansweredInstances = useMemo(
        () => instances.filter((i) => i.status === "UNANSWERED"),
        [instances]
    );
    const answeredInstances = useMemo(
        () => instances.filter((i) => i.status === "ANSWERED"),
        [instances]
    );

    const allUnansweredSelected =
        unansweredInstances.length > 0 &&
        unansweredInstances.every((i) => selectedIds.has(i.id));

    const toggleSelect = (id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (allUnansweredSelected) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(unansweredInstances.map((i) => i.id)));
        }
    };

    const handleSendToSelected = async () => {
        if (selectedIds.size === 0) {
            toast.error("Select at least one user to send reply");
            return;
        }
        if (!answerText.trim()) {
            toast.error("Please write an answer");
            return;
        }
        const result = await onSendReply(
            cluster.id,
            Array.from(selectedIds),
            answerText,
            emailSubject,
            false
        );
        if (result) {
            toast.success(`Reply sent to ${result.answeredCount} users`);
            setAnswerText("");
            setSelectedIds(new Set());
        }
    };

    const handleSendToAll = async () => {
        if (!answerText.trim()) {
            toast.error("Please write an answer");
            return;
        }
        const result = await onSendReply(cluster.id, [], answerText, emailSubject, true);
        if (result) {
            toast.success(`Reply sent to ${result.answeredCount} users`);
            setAnswerText("");
            setSelectedIds(new Set());
        }
    };

    const sc = statusColors[detail?.status || cluster.status] || statusColors.UNANSWERED;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-card rounded-2xl border border-border/30 shadow-2xl w-[95vw] max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-border/30 flex-shrink-0">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                                    <Users className="w-5 h-5 text-accent" />
                                </div>
                                <h2 className="text-lg font-display font-semibold truncate">
                                    {cluster.canonicalQuestion}
                                </h2>
                            </div>
                            <div className="flex items-center gap-3 flex-wrap ml-[52px]">
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${sc.bg} ${sc.text}`}>
                                    {sc.label}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                    {detail?.totalAskCount || cluster.totalAskCount} users asked
                                </span>
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5" />
                                    Last: {timeAgo(cluster.lastAskedAt)}
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-9 h-9 rounded-xl bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors flex-shrink-0"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
                    {/* Left: Audience List */}
                    <div className="flex-1 overflow-y-auto border-r border-border/30 p-4">
                        {detailLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground mr-2" />
                                <span className="text-sm text-muted-foreground">Loading users...</span>
                            </div>
                        ) : (
                            <>
                                {/* Select All */}
                                {unansweredInstances.length > 0 && (
                                    <div className="flex items-center gap-2 mb-3 px-2">
                                        <input
                                            type="checkbox"
                                            checked={allUnansweredSelected}
                                            onChange={toggleSelectAll}
                                            className="w-4 h-4 rounded border-border accent-primary"
                                        />
                                        <span className="text-xs font-medium text-muted-foreground">
                                            Select all unanswered ({unansweredInstances.length})
                                        </span>
                                    </div>
                                )}

                                {/* Unanswered Section */}
                                {unansweredInstances.length > 0 && (
                                    <div className="mb-4">
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
                                            Unanswered ({unansweredInstances.length})
                                        </p>
                                        <div className="space-y-2">
                                            {unansweredInstances.map((instance) => (
                                                <InstanceRow
                                                    key={instance.id}
                                                    instance={instance}
                                                    selected={selectedIds.has(instance.id)}
                                                    onToggle={() => toggleSelect(instance.id)}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Answered Section */}
                                {answeredInstances.length > 0 && (
                                    <div>
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
                                            Answered ({answeredInstances.length})
                                        </p>
                                        <div className="space-y-2">
                                            {answeredInstances.map((instance) => (
                                                <InstanceRow
                                                    key={instance.id}
                                                    instance={instance}
                                                    selected={false}
                                                    onToggle={() => { }}
                                                    disabled
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {instances.length === 0 && (
                                    <div className="text-center py-8 text-sm text-muted-foreground">
                                        No users found for this question cluster
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Right: Reply Panel */}
                    <div className="w-full lg:w-[380px] flex flex-col p-4 flex-shrink-0">
                        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                            <Mail className="w-4 h-4 text-primary" />
                            Reply & Notify
                        </h3>

                        {/* Email Subject */}
                        <div className="mb-3">
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">
                                Email Subject
                            </label>
                            <Input
                                value={emailSubject}
                                onChange={(e) => setEmailSubject(e.target.value)}
                                className="h-9 text-sm"
                                placeholder="Re: Your question about..."
                            />
                        </div>

                        {/* Answer */}
                        <div className="mb-4 flex-1 flex flex-col">
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">
                                Your Answer
                            </label>
                            <Textarea
                                value={answerText}
                                onChange={(e) => setAnswerText(e.target.value)}
                                placeholder="Type your answer here..."
                                className="flex-1 min-h-[120px] text-sm resize-none"
                            />
                        </div>

                        {/* Actions */}
                        <div className="space-y-2">
                            <Button
                                onClick={handleSendToSelected}
                                disabled={sendingReply || selectedIds.size === 0 || !answerText.trim()}
                                className="w-full gap-2"
                                size="sm"
                            >
                                {sendingReply ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Send className="w-4 h-4" />
                                )}
                                Send to Selected ({selectedIds.size})
                            </Button>
                            <Button
                                onClick={handleSendToAll}
                                disabled={sendingReply || unansweredInstances.length === 0 || !answerText.trim()}
                                variant="outline"
                                className="w-full gap-2"
                                size="sm"
                            >
                                {sendingReply ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Send className="w-4 h-4" />
                                )}
                                Send to All Unanswered ({unansweredInstances.length})
                            </Button>
                        </div>

                        {/* Reply History */}
                        {replyHistory.length > 0 && (
                            <div className="mt-4 border-t border-border/30 pt-4">
                                <button
                                    onClick={() => setShowReplyHistory(!showReplyHistory)}
                                    className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors w-full"
                                >
                                    {showReplyHistory ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                    Reply History ({replyHistory.length})
                                </button>
                                {showReplyHistory && (
                                    <div className="mt-2 space-y-2 max-h-[200px] overflow-y-auto">
                                        {replyHistory.map((reply) => (
                                            <div
                                                key={reply.id}
                                                className="p-3 bg-muted/30 rounded-xl text-xs"
                                            >
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-muted-foreground">
                                                        Sent to {reply.recipientCount} users
                                                    </span>
                                                    <span className="text-muted-foreground">{timeAgo(reply.sentAt)}</span>
                                                </div>
                                                <p className="text-foreground line-clamp-3">{reply.answerContent}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ===== Instance Row Component =====

function InstanceRow({
    instance,
    selected,
    onToggle,
    disabled = false,
}: {
    instance: ClusterInstance;
    selected: boolean;
    onToggle: () => void;
    disabled?: boolean;
}) {
    const isAnswered = instance.status === "ANSWERED";
    const pc = personaColors[instance.userPersona?.toLowerCase() || ""] || personaColors.default;

    return (
        <div
            onClick={disabled ? undefined : onToggle}
            className={`flex items-start gap-3 p-3 rounded-xl border transition-all duration-150 ${disabled ? "opacity-70 cursor-default" : "cursor-pointer hover:bg-muted/20"
                } ${selected ? "border-primary/50 bg-primary/5" : "border-border/30"} ${isAnswered ? "border-emerald-500/20 bg-emerald-500/5" : ""
                }`}
        >
            {/* Checkbox */}
            {!disabled && (
                <input
                    type="checkbox"
                    checked={selected}
                    onChange={onToggle}
                    onClick={(e) => e.stopPropagation()}
                    className="w-4 h-4 rounded border-border accent-primary mt-0.5 flex-shrink-0"
                />
            )}
            {disabled && isAnswered && (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
            )}

            {/* Avatar */}
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-muted-foreground" />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium text-foreground truncate">
                        {instance.userName || "Anonymous"}
                    </span>
                    {instance.userPersona && (
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${pc.bg} ${pc.text}`}>
                            {instance.userPersona}
                        </span>
                    )}
                </div>
                {instance.userEmail && (
                    <p className="text-xs text-muted-foreground truncate mb-1">{instance.userEmail}</p>
                )}
                <p className="text-xs text-muted-foreground/80 italic">
                    "{instance.originalQuestion}"
                </p>
                <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {timeAgo(instance.askedAt)}
                    </span>
                    <span className="text-[10px] text-muted-foreground uppercase">
                        via {instance.source}
                    </span>
                    {isAnswered && instance.answeredAt && (
                        <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Answered {timeAgo(instance.answeredAt)}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
