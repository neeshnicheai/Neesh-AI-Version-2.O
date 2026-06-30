import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import {
  X,
  Users,
  Send,
  Mail,
  MessageSquare,
  CheckCircle2,
  User,
} from "lucide-react";
import { toast } from "sonner";

interface Audience {
  id: string;
  name: string;
  email: string;
  avatar: string;
  askedAt: string;
}

interface QuestionDetailViewProps {
  question: {
    id: string;
    question: string;
    count: number;
  };
  onClose: () => void;
}

// Mock audience data for the question
const mockAudience: Audience[] = [
  {
    id: "1",
    name: "Alex Johnson",
    email: "alex@gmail.com",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
    askedAt: "2 hours ago",
  },
  {
    id: "2",
    name: "Sarah Miller",
    email: "sarah.m@gmail.com",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face",
    askedAt: "5 hours ago",
  },
  {
    id: "3",
    name: "Mike Chen",
    email: "mike.chen@company.com",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
    askedAt: "1 day ago",
  },
  {
    id: "4",
    name: "Emma Wilson",
    email: "emma.w@outlook.com",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
    askedAt: "1 day ago",
  },
  {
    id: "5",
    name: "David Brown",
    email: "david.b@gmail.com",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face",
    askedAt: "2 days ago",
  },
  {
    id: "6",
    name: "Lisa Anderson",
    email: "lisa.a@company.com",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face",
    askedAt: "3 days ago",
  },
];

const QuestionDetailView = ({ question, onClose }: QuestionDetailViewProps) => {
  const [reply, setReply] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [notifiedUsers, setNotifiedUsers] = useState<string[]>([]);

  const handleSelectUser = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers([...selectedUsers, userId]);
    } else {
      setSelectedUsers(selectedUsers.filter((id) => id !== userId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(mockAudience.map((user) => user.id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleSendToSelected = () => {
    if (!reply.trim()) {
      toast.error("Please write a reply before sending");
      return;
    }
    if (selectedUsers.length === 0) {
      toast.error("Please select at least one user to notify");
      return;
    }
    
    // Add selected users to notified list
    setNotifiedUsers([...notifiedUsers, ...selectedUsers]);
    toast.success(`Notification sent to ${selectedUsers.length} user(s)`);
    setSelectedUsers([]);
  };

  const handleSendToIndividual = (userId: string, email: string) => {
    if (!reply.trim()) {
      toast.error("Please write a reply before sending");
      return;
    }
    
    setNotifiedUsers([...notifiedUsers, userId]);
    toast.success(`Notification sent to ${email}`);
  };

  const isUserNotified = (userId: string) => notifiedUsers.includes(userId);

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl border border-border/30 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-border/50 flex items-start justify-between">
          <div className="flex items-start gap-4 flex-1">
            <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
              <MessageSquare className="w-7 h-7 text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-display font-semibold text-xl mb-2">Question Details</h2>
              <p className="text-foreground leading-relaxed">{question.question}</p>
              <div className="flex items-center gap-2 mt-3">
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
                  <Users className="w-4 h-4" />
                  <span>{question.count} users asked this</span>
                </div>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-xl flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Audience List */}
          <div className="w-1/2 border-r border-border/50 flex flex-col">
            <div className="p-4 border-b border-border/50 bg-muted/30">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Audience
                </h3>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                  {mockAudience.length} users
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="select-all"
                    checked={selectedUsers.length === mockAudience.length}
                    onCheckedChange={handleSelectAll}
                  />
                  <label htmlFor="select-all" className="text-sm text-muted-foreground cursor-pointer">
                    Select all
                  </label>
                </div>
                {selectedUsers.length > 0 && (
                  <span className="text-xs text-primary font-medium">
                    {selectedUsers.length} selected
                  </span>
                )}
              </div>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-4 space-y-3">
                {mockAudience.map((user) => (
                  <div
                    key={user.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 ${
                      isUserNotified(user.id)
                        ? "border-success/30 bg-success/5"
                        : selectedUsers.includes(user.id)
                        ? "border-primary/30 bg-primary/5"
                        : "border-border/50 hover:border-primary/30 hover:bg-muted/30"
                    }`}
                  >
                    <Checkbox
                      checked={selectedUsers.includes(user.id)}
                      onCheckedChange={(checked) =>
                        handleSelectUser(user.id, checked as boolean)
                      }
                      disabled={isUserNotified(user.id)}
                    />
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-10 h-10 rounded-full ring-2 ring-border/50"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate">{user.name}</p>
                        {isUserNotified(user.id) && (
                          <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {user.email}
                      </p>
                      <p className="text-xs text-muted-foreground/70">
                        Asked {user.askedAt}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-lg flex-shrink-0"
                      onClick={() => handleSendToIndividual(user.id, user.email)}
                      disabled={isUserNotified(user.id) || !reply.trim()}
                    >
                      <Mail className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Reply Section */}
          <div className="w-1/2 flex flex-col">
            <div className="p-4 border-b border-border/50 bg-muted/30">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Send className="w-4 h-4" />
                Reply & Notify
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Write your answer and send notifications to users
              </p>
            </div>

            <div className="flex-1 p-4 flex flex-col">
              <div className="flex-1 mb-4">
                <Textarea
                  placeholder="Write your answer to this question..."
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  className="h-full min-h-[200px] resize-none rounded-xl"
                />
              </div>

              <div className="space-y-3">
                {/* Email Subject */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">
                    Email Subject
                  </label>
                  <Input
                    placeholder="Re: Your question about..."
                    className="rounded-xl"
                    defaultValue={`Answer to: ${question.question.slice(0, 50)}...`}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3">
                  <Button
                    onClick={handleSendToSelected}
                    disabled={selectedUsers.length === 0 || !reply.trim()}
                    className="flex-1 rounded-xl"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Send to Selected ({selectedUsers.length})
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      handleSelectAll(true);
                      if (reply.trim()) {
                        handleSendToSelected();
                      }
                    }}
                    disabled={!reply.trim()}
                    className="rounded-xl"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Send to All
                  </Button>
                </div>

                {/* Status */}
                {notifiedUsers.length > 0 && (
                  <div className="flex items-center gap-2 text-sm text-success bg-success/10 px-3 py-2 rounded-xl">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {notifiedUsers.length} user(s) have been notified
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionDetailView;
