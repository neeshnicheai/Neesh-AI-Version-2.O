import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
    Search,
    Eye,
    MessageSquare,
    ChevronDown,
    Loader2,
    Users,
    User,
} from "lucide-react";
import { useResponsePage, type AudienceMemberSummary } from "@/hooks/useResponsePage";
import AudienceProfileModal from "@/components/project/AudienceProfileModal";

// Occupation tag colors matching the spec
const occupationColors: Record<string, { bg: string; text: string; dot: string }> = {
    Developer: { bg: "bg-blue-500/15", text: "text-blue-600", dot: "bg-blue-500" },
    Marketer: { bg: "bg-emerald-500/15", text: "text-emerald-600", dot: "bg-emerald-500" },
    Investor: { bg: "bg-amber-500/15", text: "text-amber-600", dot: "bg-amber-500" },
    Designer: { bg: "bg-purple-500/15", text: "text-purple-600", dot: "bg-purple-500" },
    Entrepreneur: { bg: "bg-orange-500/15", text: "text-orange-600", dot: "bg-orange-500" },
    Researcher: { bg: "bg-teal-500/15", text: "text-teal-600", dot: "bg-teal-500" },
    "Marketing Manager": { bg: "bg-emerald-500/15", text: "text-emerald-600", dot: "bg-emerald-500" },
    "Content Writer": { bg: "bg-cyan-500/15", text: "text-cyan-600", dot: "bg-cyan-500" },
    "Business Man": { bg: "bg-blue-500/15", text: "text-blue-600", dot: "bg-blue-500" },
};

const getOccColor = (occupation: string | null) => {
    if (!occupation) return { bg: "bg-gray-500/15", text: "text-gray-500", dot: "bg-gray-400" };
    return occupationColors[occupation] || { bg: "bg-gray-500/15", text: "text-gray-500", dot: "bg-gray-400" };
};

interface ResponseTabProps {
    projectId: string;
}

const ResponseTab = ({ projectId }: ResponseTabProps) => {
    const {
        members,
        selectedMember,
        loading,
        detailLoading,
        answeringId,
        fetchMembers,
        fetchMemberDetail,
        answerQuestion,
        closeDetail,
    } = useResponsePage(projectId);

    const [searchQuery, setSearchQuery] = useState("");
    const [occupationFilter, setOccupationFilter] = useState<string>("all");
    const [statusFilter, setStatusFilter] = useState<string>("all");

    // Fetch members on mount
    useEffect(() => {
        fetchMembers();
    }, [fetchMembers]);

    // Get unique occupations from members
    const uniqueOccupations = [...new Set(members.map((m) => m.occupation).filter(Boolean))] as string[];

    // Filter members
    const filteredMembers = members.filter((member) => {
        const matchesSearch =
            searchQuery === "" ||
            member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (member.feedbackSummary || "").toLowerCase().includes(searchQuery.toLowerCase());

        const matchesOccupation =
            occupationFilter === "all" || member.occupation === occupationFilter;

        const matchesStatus = statusFilter === "all" || (() => {
            if (statusFilter === "Active" && member.lastInteractionAt) {
                const daysSince = (Date.now() - new Date(member.lastInteractionAt).getTime()) / (1000 * 60 * 60 * 24);
                return daysSince < 30;
            }
            if (statusFilter === "Inactive" && member.lastInteractionAt) {
                const daysSince = (Date.now() - new Date(member.lastInteractionAt).getTime()) / (1000 * 60 * 60 * 24);
                return daysSince >= 30;
            }
            if (statusFilter === "High Engagement") {
                return (member.engagementScore || 0) >= 70;
            }
            return true;
        })();

        return matchesSearch && matchesOccupation && matchesStatus;
    });

    const handleViewMember = async (memberId: string) => {
        await fetchMemberDetail(memberId);
    };

    return (
        <>
            <div className="max-w-6xl mx-auto">
                <div className="bg-card rounded-2xl border border-border/30 shadow-card overflow-hidden">
                    {/* Header */}
                    <div className="p-6 border-b border-border/50">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/15 to-accent/15 flex items-center justify-center">
                                <Users className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <h2 className="font-display font-bold text-xl">Audience Management</h2>
                                <p className="text-sm text-muted-foreground">
                                    {members.length} audience member{members.length !== 1 ? "s" : ""} • View and manage user feedback & interactions
                                </p>
                            </div>
                        </div>

                        {/* Filters */}
                        <div className="flex items-center gap-3 flex-wrap">
                            <div className="relative flex-1 max-w-md">
                                <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Search by name, email, or feedback..."
                                    className="pl-11"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="rounded-xl gap-2">
                                        {occupationFilter === "all" ? "All Occupations" : occupationFilter}
                                        <ChevronDown className="w-4 h-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="rounded-xl">
                                    <DropdownMenuItem onClick={() => setOccupationFilter("all")} className="cursor-pointer">
                                        All Occupations
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    {uniqueOccupations.map((occ) => {
                                        const color = getOccColor(occ);
                                        return (
                                            <DropdownMenuItem
                                                key={occ}
                                                onClick={() => setOccupationFilter(occ)}
                                                className="cursor-pointer"
                                            >
                                                <span className={`w-2.5 h-2.5 rounded-full mr-2 ${color.dot}`} />
                                                {occ}
                                            </DropdownMenuItem>
                                        );
                                    })}
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="rounded-xl gap-2">
                                        {statusFilter === "all" ? "All Status" : statusFilter}
                                        <ChevronDown className="w-4 h-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="rounded-xl">
                                    <DropdownMenuItem onClick={() => setStatusFilter("all")} className="cursor-pointer">
                                        All Status
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => setStatusFilter("Active")} className="cursor-pointer">
                                        Active
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setStatusFilter("Inactive")} className="cursor-pointer">
                                        Inactive
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setStatusFilter("High Engagement")} className="cursor-pointer">
                                        High Engagement
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

                    {/* Table */}
                    {loading ? (
                        <div className="flex items-center justify-center p-12">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-border/50 bg-muted/30">
                                        <th className="text-left p-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Name</th>
                                        <th className="text-left p-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Email</th>
                                        <th className="text-left p-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Occupation</th>
                                        <th className="text-left p-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Feedback</th>
                                        <th className="text-left p-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredMembers.length > 0 ? (
                                        filteredMembers.map((member) => {
                                            const occColor = getOccColor(member.occupation);
                                            return (
                                                <tr
                                                    key={member.id}
                                                    className="border-b border-border/30 hover:bg-muted/30 transition-colors group"
                                                >
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center ring-2 ring-border/50">
                                                                <User className="w-5 h-5 text-primary" />
                                                            </div>
                                                            <span className="font-medium text-foreground">{member.name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-muted-foreground text-sm">{member.email}</td>
                                                    <td className="p-4">
                                                        <span
                                                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${occColor.bg} ${occColor.text}`}
                                                        >
                                                            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${occColor.dot}`} />
                                                            {member.occupation || "Other"}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-muted-foreground text-sm max-w-[220px] truncate">
                                                        {(() => {
                                                            const raw = member.feedbackSummary;
                                                            if (!raw) return "No feedback yet";
                                                            const lines = raw.split('\n').filter((l: string) => l.trim());
                                                            for (const line of lines) {
                                                                const colonIdx = line.indexOf(':');
                                                                if (colonIdx === -1) continue;
                                                                const key = line.substring(0, colonIdx).trim();
                                                                if (/additional\s*comments?/i.test(key)) {
                                                                    const val = line.substring(colonIdx + 1).trim();
                                                                    if (val) return val;
                                                                }
                                                            }
                                                            // Fallback: show first line that has no question pattern
                                                            for (const line of lines) {
                                                                if (line.indexOf(':') === -1 || line.indexOf('?') === -1) {
                                                                    return line.trim();
                                                                }
                                                            }
                                                            return raw;
                                                        })()}
                                                    </td>
                                                    <td className="p-4">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="rounded-lg gap-1.5 opacity-70 group-hover:opacity-100 transition-opacity"
                                                            onClick={() => handleViewMember(member.id)}
                                                            disabled={detailLoading}
                                                        >
                                                            {detailLoading ? (
                                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                            ) : (
                                                                <Eye className="w-4 h-4" />
                                                            )}
                                                            View
                                                        </Button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="p-12 text-center">
                                                <div className="flex flex-col items-center gap-3">
                                                    <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center">
                                                        <Users className="w-8 h-8 text-muted-foreground/50" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-foreground mb-1">
                                                            {members.length === 0
                                                                ? "No audience members yet"
                                                                : "No results match your filters"}
                                                        </p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {members.length === 0
                                                                ? "Audience members will appear here once users interact with your project"
                                                                : "Try adjusting your search or filter criteria"}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {filteredMembers.length > 0 && (
                        <div className="p-4 flex items-center justify-between text-sm text-muted-foreground bg-muted/20 border-t border-border/30">
                            <span>
                                1-{filteredMembers.length} of {members.length}
                            </span>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" disabled className="rounded-lg">
                                    Previous
                                </Button>
                                <span className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium text-xs">
                                    1
                                </span>
                                <Button variant="outline" size="sm" className="rounded-lg">
                                    Next
                                </Button>
                            </div>
                            <span>Page 1 of 1</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Audience Profile Modal */}
            {selectedMember && (
                <AudienceProfileModal
                    member={selectedMember}
                    onClose={closeDetail}
                    onAnswerQuestion={answerQuestion}
                    answeringId={answeringId}
                />
            )}
        </>
    );
};

export default ResponseTab;
