import { useState, useEffect } from "react";
import {
    Bell,
    Search,
    Users,
    ChevronRight,
    ChevronDown,
    Clock,
    Loader2,
    AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNotifications, type ClusterSummary } from "@/hooks/useNotifications";
import ClusterDetailModal from "./ClusterDetailModal";

const statusColors: Record<string, { bg: string; text: string; label: string }> = {
    UNANSWERED: { bg: "bg-red-500/15", text: "text-red-400", label: "Unanswered" },
    PARTIALLY_ANSWERED: { bg: "bg-amber-500/15", text: "text-amber-400", label: "Partial" },
    ANSWERED: { bg: "bg-emerald-500/15", text: "text-emerald-400", label: "Answered" },
    MONITORING: { bg: "bg-blue-500/15", text: "text-blue-400", label: "Monitoring" },
    RESOLVED: { bg: "bg-gray-500/15", text: "text-gray-400", label: "Resolved" },
};

interface NotificationTabProps {
    projectId: string;
}

function parsePersonaSummary(json: string | null): Record<string, number> {
    if (!json) return {};
    try {
        return JSON.parse(json);
    } catch {
        return {};
    }
}

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

export default function NotificationTab({ projectId }: NotificationTabProps) {
    const {
        clusters,
        clusterDetail,
        loading,
        detailLoading,
        sendingReply,
        unansweredCount,
        fetchClusters,
        fetchClusterDetail,
        sendReply,
        setClusterDetail,
    } = useNotifications(projectId);

    const [search, setSearch] = useState("");
    const [sort, setSort] = useState<"priority" | "recent" | "most_asked">("priority");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [selectedCluster, setSelectedCluster] = useState<ClusterSummary | null>(null);

    // Fetch clusters on mount and when filters change
    useEffect(() => {
        fetchClusters(statusFilter, sort, search);
    }, [fetchClusters, statusFilter, sort]);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchClusters(statusFilter, sort, search);
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    const handleClusterClick = async (cluster: ClusterSummary) => {
        setSelectedCluster(cluster);
        await fetchClusterDetail(cluster.id);
    };

    const handleCloseDetail = () => {
        setSelectedCluster(null);
        setClusterDetail(null);
        // Refresh list after possible reply
        fetchClusters(statusFilter, sort, search);
    };

    const sortLabels: Record<string, string> = {
        priority: "Priority",
        recent: "Recent",
        most_asked: "Most Asked",
    };

    return (
        <div className="max-w-4xl mx-auto">
            {/* Detail Modal */}
            {selectedCluster && (
                <ClusterDetailModal
                    cluster={selectedCluster}
                    detail={clusterDetail}
                    detailLoading={detailLoading}
                    sendingReply={sendingReply}
                    onClose={handleCloseDetail}
                    onSendReply={sendReply}
                />
            )}

            <div className="bg-card rounded-2xl border border-border/30 p-8 shadow-card">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                        <Bell className="w-6 h-6 text-accent" />
                    </div>
                    <div>
                        <h2 className="font-display font-semibold text-xl">Unanswered Questions</h2>
                        <p className="text-sm text-muted-foreground">
                            Questions frequently asked by multiple users
                        </p>
                    </div>
                </div>

                {/* Filters Bar */}
                <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground">
                            {unansweredCount > 0 ? `${unansweredCount} need attention` : "All caught up!"}
                        </span>
                        {unansweredCount > 0 && (
                            <span className="text-xs font-bold px-2 py-0.5 bg-red-500/15 text-red-400 rounded-full">
                                {unansweredCount}
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Status Filter */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="rounded-xl gap-2">
                                    Status: {statusFilter === "all" ? "All" : statusColors[statusFilter]?.label || statusFilter}
                                    <ChevronDown className="w-4 h-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-xl">
                                <DropdownMenuItem onClick={() => setStatusFilter("all")} className="cursor-pointer">All</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setStatusFilter("UNANSWERED")} className="cursor-pointer">Unanswered</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setStatusFilter("PARTIALLY_ANSWERED")} className="cursor-pointer">Partially Answered</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setStatusFilter("ANSWERED")} className="cursor-pointer">Answered</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Sort */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="rounded-xl gap-2">
                                    Sort: {sortLabels[sort]}
                                    <ChevronDown className="w-4 h-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-xl">
                                <DropdownMenuItem onClick={() => setSort("priority")} className="cursor-pointer">Priority</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setSort("most_asked")} className="cursor-pointer">Most Asked</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setSort("recent")} className="cursor-pointer">Recent</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Search */}
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search questions..."
                                className="pl-10 w-[200px] h-10"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground mr-2" />
                        <span className="text-muted-foreground">Loading questions...</span>
                    </div>
                )}

                {/* Empty State */}
                {!loading && clusters.length === 0 && (
                    <div className="p-12 text-center border border-border/50 rounded-2xl">
                        <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                            <AlertCircle className="w-8 h-8 text-muted-foreground/50" />
                        </div>
                        <p className="font-medium text-foreground mb-1">No questions found</p>
                        <p className="text-sm text-muted-foreground">
                            {search ? "Try adjusting your search terms" : "Questions from your chatbot will appear here"}
                        </p>
                    </div>
                )}

                {/* Cluster List */}
                {!loading && clusters.length > 0 && (
                    <div className="space-y-3">
                        {clusters.map((cluster) => {
                            const personas = parsePersonaSummary(cluster.personaSummary);
                            const topPersonas = Object.entries(personas)
                                .sort(([, a], [, b]) => b - a)
                                .slice(0, 3);
                            const sc = statusColors[cluster.status] || statusColors.UNANSWERED;

                            return (
                                <div
                                    key={cluster.id}
                                    onClick={() => handleClusterClick(cluster)}
                                    className="flex items-center justify-between p-5 border border-border/50 rounded-2xl hover:bg-muted/30 hover:border-primary/30 transition-all duration-200 cursor-pointer group"
                                >
                                    <div className="flex items-center gap-4 flex-1 min-w-0">
                                        <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                                            <Users className="w-6 h-6 text-muted-foreground" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-foreground mb-1 truncate">{cluster.canonicalQuestion}</p>
                                            <div className="flex items-center gap-3 flex-wrap">
                                                <span className="text-sm text-muted-foreground">
                                                    {cluster.totalAskCount} {cluster.totalAskCount === 1 ? "user" : "users"} asked
                                                </span>
                                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${sc.bg} ${sc.text}`}>
                                                    {sc.label}
                                                </span>
                                                {topPersonas.length > 0 && (
                                                    <div className="flex items-center gap-1">
                                                        {topPersonas.map(([persona, count]) => (
                                                            <span
                                                                key={persona}
                                                                className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
                                                            >
                                                                {persona} ({count})
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                            <Clock className="w-3.5 h-3.5" />
                                            {timeAgo(cluster.lastAskedAt)}
                                        </div>
                                        <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-base">
                                            {cluster.totalAskCount}
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
