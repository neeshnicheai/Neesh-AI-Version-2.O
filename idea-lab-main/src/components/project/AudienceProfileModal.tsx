import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    X,
    Mail,
    User,
    MessageSquare,
    HelpCircle,
    Send,
    ChevronDown,
    ChevronRight,
    CheckCircle2,
    Clock,
    Calendar,
    Briefcase,
    Activity,
    Target,
    Loader2,
} from "lucide-react";
import type { AudienceMemberDetail, AudienceQuestionDTO } from "@/hooks/useResponsePage";

// Occupation tag colors
const occupationColors: Record<string, { bg: string; text: string; border: string }> = {
    Developer: { bg: "bg-blue-500/15", text: "text-blue-600", border: "border-blue-500/30" },
    Marketer: { bg: "bg-emerald-500/15", text: "text-emerald-600", border: "border-emerald-500/30" },
    Investor: { bg: "bg-amber-500/15", text: "text-amber-600", border: "border-amber-500/30" },
    Designer: { bg: "bg-purple-500/15", text: "text-purple-600", border: "border-purple-500/30" },
    Entrepreneur: { bg: "bg-orange-500/15", text: "text-orange-600", border: "border-orange-500/30" },
    Researcher: { bg: "bg-teal-500/15", text: "text-teal-600", border: "border-teal-500/30" },
    "Marketing Manager": { bg: "bg-emerald-500/15", text: "text-emerald-600", border: "border-emerald-500/30" },
    "Content Writer": { bg: "bg-cyan-500/15", text: "text-cyan-600", border: "border-cyan-500/30" },
    "Business Man": { bg: "bg-blue-500/15", text: "text-blue-600", border: "border-blue-500/30" },
};

const getOccupationStyle = (occupation: string | null) => {
    if (!occupation) return { bg: "bg-gray-500/15", text: "text-gray-600", border: "border-gray-500/30" };
    return occupationColors[occupation] || { bg: "bg-gray-500/15", text: "text-gray-600", border: "border-gray-500/30" };
};

interface AudienceProfileModalProps {
    member: AudienceMemberDetail;
    onClose: () => void;
    onAnswerQuestion: (questionId: string, answer: string) => Promise<boolean>;
    answeringId: string | null;
}

const AudienceProfileModal = ({ member, onClose, onAnswerQuestion, answeringId }: AudienceProfileModalProps) => {
    const [activeSection, setActiveSection] = useState<"answered" | "unanswered">("unanswered");
    const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);
    const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});

    const answeredQuestions = member.questions.filter((q) => q.status === "answered");
    const unansweredQuestions = member.questions.filter((q) => q.status === "unanswered");

    const toggleQuestion = (id: string) => {
        setExpandedQuestionId(expandedQuestionId === id ? null : id);
    };

    const handleReplyChange = (questionId: string, text: string) => {
        setReplyTexts((prev) => ({ ...prev, [questionId]: text }));
    };

    const handleReplyAndNotify = async (questionId: string) => {
        const answer = replyTexts[questionId]?.trim();
        if (!answer) return;
        const success = await onAnswerQuestion(questionId, answer);
        if (success) {
            setReplyTexts((prev) => ({ ...prev, [questionId]: "" }));
            setExpandedQuestionId(null);
        }
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return "N/A";
        return new Date(dateStr).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    const formatDateTime = (dateStr: string | null) => {
        if (!dateStr) return "N/A";
        return new Date(dateStr).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const occStyle = getOccupationStyle(member.occupation);

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-card rounded-2xl border border-border/30 shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-fade">
                {/* Header */}
                <div className="p-6 border-b border-border/50 flex items-center justify-between bg-gradient-to-r from-primary/5 to-transparent">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center ring-2 ring-primary/20">
                            <User className="w-8 h-8 text-primary" />
                        </div>
                        <div>
                            <h2 className="font-display font-bold text-2xl">{member.name}</h2>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${occStyle.bg} ${occStyle.text} ${occStyle.border}`}>
                                    {member.occupation || "Unknown"}
                                </span>
                                <span className="text-sm text-muted-foreground">{member.email}</span>
                            </div>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="rounded-xl hover:bg-destructive/10 hover:text-destructive">
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                    <div className="p-6 space-y-6">
                        {/* Section A: Profile Information */}
                        <div className="bg-muted/30 rounded-2xl p-6 border border-border/30">
                            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                <User className="w-5 h-5 text-primary" />
                                Profile Information
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <InfoCard icon={<Mail className="w-4 h-4" />} label="Email" value={member.email} />
                                <InfoCard icon={<Briefcase className="w-4 h-4" />} label="Occupation" value={member.occupation || "N/A"} />
                                <InfoCard icon={<Target className="w-4 h-4" />} label="Persona Confidence" value={member.confidenceScore ? `${Math.round(member.confidenceScore * 100)}%` : "N/A"} />
                                <InfoCard icon={<Calendar className="w-4 h-4" />} label="First Visit" value={formatDate(member.firstInteractionAt)} />
                                <InfoCard icon={<Clock className="w-4 h-4" />} label="Last Interaction" value={formatDate(member.lastInteractionAt)} />
                                <InfoCard icon={<Activity className="w-4 h-4" />} label="Engagement Score" value={member.engagementScore ? `${member.engagementScore}/100` : "N/A"} />
                            </div>
                        </div>

                        {/* Section B: Feedback */}
                        <div className="bg-muted/30 rounded-2xl p-6 border border-border/30">
                            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                <MessageSquare className="w-5 h-5 text-accent" />
                                Feedback
                            </h3>
                            {member.feedbackText ? (() => {
                                // Parse feedbackText: lines like "Question?: Answer"
                                const lines = member.feedbackText.split('\n').filter(l => l.trim());
                                let additionalComment = '';
                                const feedbackItems: { label: string; value: string }[] = [];

                                for (const line of lines) {
                                    const colonIdx = line.indexOf(':');
                                    if (colonIdx === -1) {
                                        // No colon — treat as plain comment
                                        additionalComment += (additionalComment ? '\n' : '') + line.trim();
                                        continue;
                                    }
                                    const key = line.substring(0, colonIdx).trim();
                                    const val = line.substring(colonIdx + 1).trim();
                                    // Check if this is the additional comments field
                                    if (/additional\s*comments?/i.test(key)) {
                                        additionalComment += (additionalComment ? '\n' : '') + val;
                                    } else if (val) {
                                        feedbackItems.push({ label: key.replace(/\?$/, '').trim(), value: val });
                                    }
                                }

                                return (
                                    <div className="space-y-4">
                                        {/* Main feedback / Additional Comments */}
                                        {additionalComment && (
                                            <div className="bg-card p-4 rounded-xl border border-border/30">
                                                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5 font-medium">Feedback</p>
                                                <p className="text-foreground leading-relaxed">{additionalComment}</p>
                                            </div>
                                        )}

                                        {/* Structured feedback items grid */}
                                        {feedbackItems.length > 0 && (
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                {feedbackItems.map((item, i) => (
                                                    <div key={i} className="bg-card p-3 rounded-xl border border-border/30">
                                                        <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-1 font-medium">{item.label}</p>
                                                        <p className="text-foreground text-sm font-semibold">{item.value}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* If no additional comment was found but there are structured items, show fallback */}
                                        {!additionalComment && feedbackItems.length === 0 && (
                                            <p className="text-foreground leading-relaxed bg-card p-4 rounded-xl border border-border/30">
                                                {member.feedbackText}
                                            </p>
                                        )}

                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                            {member.feedbackSubmittedAt && (
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    {formatDateTime(member.feedbackSubmittedAt)}
                                                </span>
                                            )}
                                            {member.feedbackSource && (
                                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                                                    {member.feedbackSource}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })() : (
                                <p className="text-muted-foreground italic">No feedback submitted yet</p>
                            )}
                        </div>

                        {/* Section C: Chatbot Interaction */}
                        <div className="bg-muted/30 rounded-2xl p-6 border border-border/30">
                            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                <HelpCircle className="w-5 h-5 text-primary" />
                                Chatbot Interactions
                            </h3>

                            {/* Tabs */}
                            <div className="flex items-center gap-2 mb-5">
                                <button
                                    onClick={() => setActiveSection("answered")}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${activeSection === "answered"
                                        ? "bg-emerald-500/15 text-emerald-700 border border-emerald-500/30 shadow-sm"
                                        : "text-muted-foreground hover:bg-muted border border-transparent"
                                        }`}
                                >
                                    <CheckCircle2 className="w-4 h-4" />
                                    Answered Questions
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeSection === "answered" ? "bg-emerald-500/20" : "bg-muted-foreground/15"
                                        }`}>
                                        {answeredQuestions.length}
                                    </span>
                                </button>
                                <button
                                    onClick={() => setActiveSection("unanswered")}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${activeSection === "unanswered"
                                        ? "bg-amber-500/15 text-amber-700 border border-amber-500/30 shadow-sm"
                                        : "text-muted-foreground hover:bg-muted border border-transparent"
                                        }`}
                                >
                                    <HelpCircle className="w-4 h-4" />
                                    Unanswered Questions
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeSection === "unanswered" ? "bg-amber-500/20" : "bg-muted-foreground/15"
                                        }`}>
                                        {unansweredQuestions.length}
                                    </span>
                                </button>
                            </div>

                            {/* Questions List */}
                            <div className="space-y-3">
                                {activeSection === "answered" ? (
                                    answeredQuestions.length > 0 ? (
                                        answeredQuestions.map((q) => (
                                            <AnsweredQuestionItem
                                                key={q.id}
                                                question={q}
                                                expanded={expandedQuestionId === q.id}
                                                onToggle={() => toggleQuestion(q.id)}
                                                replyText={replyTexts[q.id] || ""}
                                                onReplyChange={(text) => handleReplyChange(q.id, text)}
                                                onReplyAndNotify={() => handleReplyAndNotify(q.id)}
                                                isAnswering={answeringId === q.id}
                                            />
                                        ))
                                    ) : (
                                        <EmptyState message="No answered questions yet" />
                                    )
                                ) : unansweredQuestions.length > 0 ? (
                                    unansweredQuestions.map((q) => (
                                        <UnansweredQuestionItem
                                            key={q.id}
                                            question={q}
                                            expanded={expandedQuestionId === q.id}
                                            onToggle={() => toggleQuestion(q.id)}
                                            replyText={replyTexts[q.id] || ""}
                                            onReplyChange={(text) => handleReplyChange(q.id, text)}
                                            onReplyAndNotify={() => handleReplyAndNotify(q.id)}
                                            isAnswering={answeringId === q.id}
                                        />
                                    ))
                                ) : (
                                    <EmptyState message="No unanswered questions — all caught up! 🎉" />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ===== Sub-components =====

const InfoCard = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
    <div className="bg-card rounded-xl p-3.5 border border-border/30">
        <div className="flex items-center gap-2 mb-1.5">
            <span className="text-primary">{icon}</span>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
        </div>
        <p className="font-semibold text-foreground text-sm">{value}</p>
    </div>
);

const AnsweredQuestionItem = ({
    question,
    expanded,
    onToggle,
    replyText,
    onReplyChange,
    onReplyAndNotify,
    isAnswering,
}: {
    question: AudienceQuestionDTO;
    expanded: boolean;
    onToggle: () => void;
    replyText: string;
    onReplyChange: (text: string) => void;
    onReplyAndNotify: () => void;
    isAnswering: boolean;
}) => (
    <div className="rounded-xl border border-border/30 overflow-hidden bg-card transition-all">
        <button
            onClick={onToggle}
            className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors text-left"
        >
            <div className="flex-1 pr-4">
                <p className="font-medium text-foreground text-sm">{question.questionText}</p>
                <p className="text-xs text-muted-foreground mt-1">
                    {question.askedAt ? new Date(question.askedAt).toLocaleDateString() : ""}
                </p>
            </div>
            <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                {expanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
            </div>
        </button>
        {expanded && (
            <div className="px-4 pb-4 space-y-3 border-t border-border/30 pt-3 animate-slide-down">
                <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Full Question</p>
                    <p className="text-foreground text-sm">{question.questionText}</p>
                </div>
                {question.chatbotAnswer && (
                    <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Chatbot Answer</p>
                        <p className="text-foreground text-sm bg-muted/30 p-3 rounded-lg border border-border/30">{question.chatbotAnswer}</p>
                    </div>
                )}
                {question.customAdminAnswer && (
                    <div>
                        <p className="text-xs font-medium text-emerald-600 uppercase tracking-wider mb-1">Admin Reply</p>
                        <p className="text-foreground text-sm bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/20">{question.customAdminAnswer}</p>
                    </div>
                )}
                <div className="pt-2">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Edit reply (overrides chatbot response):</p>
                    <div className="flex gap-2">
                        <Textarea
                            placeholder="Type a new reply..."
                            value={replyText}
                            onChange={(e) => onReplyChange(e.target.value)}
                            className="flex-1 min-h-[70px] resize-none rounded-xl text-sm"
                        />
                        <Button
                            onClick={onReplyAndNotify}
                            disabled={!replyText.trim() || isAnswering}
                            size="sm"
                            className="rounded-xl self-end"
                        >
                            {isAnswering ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Send className="w-4 h-4 mr-1" />}
                            Reply & Notify
                        </Button>
                    </div>
                </div>
            </div>
        )}
    </div>
);

const UnansweredQuestionItem = ({
    question,
    expanded,
    onToggle,
    replyText,
    onReplyChange,
    onReplyAndNotify,
    isAnswering,
}: {
    question: AudienceQuestionDTO;
    expanded: boolean;
    onToggle: () => void;
    replyText: string;
    onReplyChange: (text: string) => void;
    onReplyAndNotify: () => void;
    isAnswering: boolean;
}) => (
    <div className="rounded-xl border border-amber-500/30 overflow-hidden bg-card transition-all">
        <button
            onClick={onToggle}
            className="w-full flex items-center justify-between p-4 hover:bg-amber-500/5 transition-colors text-left"
        >
            <div className="flex-1 pr-4">
                <p className="font-medium text-foreground text-sm">{question.questionText}</p>
                <p className="text-xs text-muted-foreground mt-1">
                    {question.askedAt ? new Date(question.askedAt).toLocaleDateString() : ""}
                </p>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500 animate-pulse" />
                {expanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
            </div>
        </button>
        {expanded && (
            <div className="px-4 pb-4 space-y-3 border-t border-amber-500/20 pt-3 animate-slide-down">
                <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Full Question</p>
                    <p className="text-foreground text-sm">{question.questionText}</p>
                </div>
                <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">Your answer:</p>
                    <Textarea
                        placeholder="Type your answer here..."
                        value={replyText}
                        onChange={(e) => onReplyChange(e.target.value)}
                        className="min-h-[90px] resize-none rounded-xl text-sm"
                    />
                </div>
                <div className="flex justify-end">
                    <Button
                        onClick={onReplyAndNotify}
                        disabled={!replyText.trim() || isAnswering}
                        className="rounded-xl gap-2"
                    >
                        {isAnswering ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        Reply & Notify
                    </Button>
                </div>
            </div>
        )}
    </div>
);

const EmptyState = ({ message }: { message: string }) => (
    <div className="p-8 text-center text-muted-foreground border border-dashed border-border/50 rounded-xl">
        <HelpCircle className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
        <p className="text-sm">{message}</p>
    </div>
);

export default AudienceProfileModal;
