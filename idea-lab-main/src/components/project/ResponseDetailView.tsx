import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  X,
  Mail,
  MessageSquare,
  HelpCircle,
  Send,
  Bell,
  CheckCircle,
  Bot,
  Loader2,
} from "lucide-react";
import { useQuestions } from "@/hooks/useQuestions";
import { useEffect } from "react";

interface ResponseDetailViewProps {
  response: {
    id: string;
    name: string;
    email: string;
    occupation: string;
    feedback: string;
    avatar: string;
  };
  onClose: () => void;
  projectId: string;
}

const ResponseDetailView = ({ response, onClose, projectId }: ResponseDetailViewProps) => {
  const [activeTab, setActiveTab] = useState<"asked" | "unanswered">("asked");
  const [replyText, setReplyText] = useState("");
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
  const [expandedAnswer, setExpandedAnswer] = useState<string | null>(null);

  const {
    answeredQuestions,
    unansweredMemberQuestions,
    memberLoading,
    fetchMemberQuestions,
    resolveQuestion
  } = useQuestions(projectId);

  // Fetch the real questions for this audience member on mount
  useEffect(() => {
    if (response.id) {
      fetchMemberQuestions(response.id);
    }
  }, [response.id, fetchMemberQuestions]);

  const handleSendReply = () => {
    if (replyText.trim() && selectedQuestion) {
      console.log("Sending reply:", replyText, "to question:", selectedQuestion);
      setReplyText("");
      setSelectedQuestion(null);
    }
  };

  const handleNotify = () => {
    console.log("Notifying user:", response.email);
  };

  const formatTime = (isoString: string | null) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl border border-border/30 shadow-card w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-border/50 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img
              src={response.avatar}
              alt={response.name}
              className="w-14 h-14 rounded-full ring-2 ring-primary/20"
            />
            <div>
              <h2 className="font-display font-semibold text-xl">{response.name}</h2>
              <p className="text-sm text-muted-foreground">{response.occupation}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-xl">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col p-6 gap-6">
          {/* User Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-muted/30 rounded-xl p-4 border border-border/30">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">Email</span>
              </div>
              <p className="font-medium text-foreground">{response.email}</p>
            </div>
            <div className="bg-muted/30 rounded-xl p-4 border border-border/30">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-accent" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">Feedback</span>
              </div>
              {(() => {
                const text = response.feedback;
                if (!text) return <p className="text-muted-foreground italic">No feedback</p>;
                const lines = text.split('\n').filter((l: string) => l.trim());
                let additionalComment = '';
                const items: { label: string; value: string }[] = [];
                for (const line of lines) {
                  const colonIdx = line.indexOf(':');
                  if (colonIdx === -1) {
                    additionalComment += (additionalComment ? '\n' : '') + line.trim();
                    continue;
                  }
                  const key = line.substring(0, colonIdx).trim();
                  const val = line.substring(colonIdx + 1).trim();
                  if (/additional\s*comments?/i.test(key)) {
                    additionalComment += (additionalComment ? '\n' : '') + val;
                  } else if (val) {
                    items.push({ label: key.replace(/\?$/, '').trim(), value: val });
                  }
                }
                return (
                  <div className="space-y-3">
                    {additionalComment && (
                      <p className="font-medium text-foreground">{additionalComment}</p>
                    )}
                    {items.length > 0 && (
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {items.map((item, i) => (
                          <div key={i} className="bg-card p-2.5 rounded-lg border border-border/30">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">{item.label}</p>
                            <p className="text-foreground text-sm font-semibold">{item.value}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    {!additionalComment && items.length === 0 && (
                      <p className="font-medium text-foreground">{text}</p>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-2 border-b border-border/50 pb-3">
            <button
              onClick={() => setActiveTab("asked")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === "asked"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
                }`}
            >
              <HelpCircle className="w-4 h-4" />
              Answered
              <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === "asked"
                  ? "bg-primary-foreground/20"
                  : "bg-muted-foreground/20"
                }`}>
                {memberLoading ? "..." : answeredQuestions.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("unanswered")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === "unanswered"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
                }`}
            >
              <MessageSquare className="w-4 h-4" />
              Unanswered
              <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === "unanswered"
                  ? "bg-primary-foreground/20"
                  : "bg-accent/50"
                }`}>
                {memberLoading ? "..." : unansweredMemberQuestions.length}
              </span>
            </button>
          </div>

          {/* Questions List */}
          <div className="flex-1 flex flex-col min-h-0">
            {memberLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Loading questions...</span>
              </div>
            ) : (
              <ScrollArea className="flex-1 pr-4">
                <div className="space-y-3">
                  {activeTab === "asked" ? (
                    answeredQuestions.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <CheckCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
                        <p className="text-sm">No answered questions yet</p>
                      </div>
                    ) : (
                      answeredQuestions.map((q) => (
                        <div
                          key={q.id}
                          className="p-4 bg-muted/30 rounded-xl border border-border/30 hover:border-primary/30 transition-all cursor-pointer"
                          onClick={() => setExpandedAnswer(expandedAnswer === q.id ? null : q.id)}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <p className="font-medium text-foreground mb-1">{q.questionText}</p>
                              <p className="text-xs text-muted-foreground">{formatTime(q.askedAt)}</p>
                            </div>
                            <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                          </div>
                          {/* Show chatbot answer when expanded */}
                          {expandedAnswer === q.id && q.chatbotAnswer && (
                            <div className="mt-3 pt-3 border-t border-border/30">
                              <div className="flex items-start gap-2">
                                <Bot className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                                <div>
                                  <p className="text-xs font-medium text-primary mb-1">Chatbot Answer</p>
                                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{q.chatbotAnswer}</p>
                                </div>
                              </div>
                              {q.customAdminAnswer && (
                                <div className="flex items-start gap-2 mt-3 pt-3 border-t border-border/20">
                                  <Send className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                                  <div>
                                    <p className="text-xs font-medium text-accent mb-1">Admin Reply</p>
                                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{q.customAdminAnswer}</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))
                    )
                  ) : (
                    unansweredMemberQuestions.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
                        <p className="text-sm">No unanswered questions</p>
                      </div>
                    ) : (
                      unansweredMemberQuestions.map((q) => (
                        <div
                          key={q.id}
                          onClick={() => setSelectedQuestion(q.id)}
                          className={`p-4 rounded-xl border transition-all cursor-pointer ${selectedQuestion === q.id
                              ? "bg-primary/10 border-primary/50"
                              : "bg-muted/30 border-border/30 hover:border-primary/30"
                            }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <p className="font-medium text-foreground mb-1">{q.questionText}</p>
                              <p className="text-xs text-muted-foreground">{formatTime(q.askedAt)}</p>
                              {q.chatbotAnswer && (
                                <div className="mt-2 flex items-start gap-2">
                                  <Bot className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                                  <p className="text-xs text-muted-foreground italic">{q.chatbotAnswer}</p>
                                </div>
                              )}
                            </div>
                            <div className="w-3 h-3 rounded-full bg-warning shrink-0 mt-1" />
                          </div>
                        </div>
                      ))
                    )
                  )}
                </div>
              </ScrollArea>
            )}

            {/* Reply Section - Only show for unanswered tab */}
            {activeTab === "unanswered" && (
              <div className="mt-4 pt-4 border-t border-border/50">
                <div className="flex items-center gap-2 mb-3">
                  <Send className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">
                    {selectedQuestion
                      ? "Reply to selected question"
                      : "Select a question to reply"}
                  </span>
                </div>
                <div className="flex gap-3">
                  <Textarea
                    placeholder="Type your reply here..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="flex-1 min-h-[80px] resize-none rounded-xl"
                    disabled={!selectedQuestion}
                  />
                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={handleSendReply}
                      disabled={!replyText.trim() || !selectedQuestion}
                      className="rounded-xl"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Send
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleNotify}
                      disabled={!selectedQuestion}
                      className="rounded-xl"
                    >
                      <Bell className="w-4 h-4 mr-2" />
                      Notify
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResponseDetailView;
