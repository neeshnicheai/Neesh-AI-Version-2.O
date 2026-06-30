import { useState, useMemo } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Search, Link2, Check, Loader2, Beaker, Lightbulb, Wrench } from "lucide-react";
import { useProjects, type Project } from "@/hooks/useProjects";

const LINK_TYPES = [
    { value: "RESEARCH", label: "Research", icon: <Beaker className="w-3.5 h-3.5" />, color: "text-blue-400" },
    { value: "USECASE", label: "Use Case", icon: <Lightbulb className="w-3.5 h-3.5" />, color: "text-emerald-400" },
    { value: "SOLUTION", label: "Solution", icon: <Wrench className="w-3.5 h-3.5" />, color: "text-purple-400" },
];

interface LinkProjectModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    currentProjectId: string;
    alreadyLinkedIds: string[];
    onLinkProject: (linkedProjectId: string, linkType: string) => Promise<boolean>;
}

const LinkProjectModal = ({
    open,
    onOpenChange,
    currentProjectId,
    alreadyLinkedIds,
    onLinkProject,
}: LinkProjectModalProps) => {
    const { projects, loading: projectsLoading } = useProjects();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedTypes, setSelectedTypes] = useState<Record<string, string>>({});
    const [linkingId, setLinkingId] = useState<string | null>(null);

    // Filter out current project and already linked projects
    const availableProjects = useMemo(() => {
        return projects.filter((p) => {
            if (p.id === currentProjectId) return false;
            if (alreadyLinkedIds.includes(p.id)) return false;
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                return (
                    p.title.toLowerCase().includes(q) ||
                    (p.one_line_summary && p.one_line_summary.toLowerCase().includes(q))
                );
            }
            return true;
        });
    }, [projects, currentProjectId, alreadyLinkedIds, searchQuery]);

    const handleLink = async (projectId: string) => {
        const linkType = selectedTypes[projectId] || "RESEARCH";
        setLinkingId(projectId);
        try {
            const success = await onLinkProject(projectId, linkType);
            if (success) {
                // Remove from selection state
                setSelectedTypes((prev) => {
                    const copy = { ...prev };
                    delete copy[projectId];
                    return copy;
                });
            }
        } finally {
            setLinkingId(null);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[520px] bg-card border-border">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-foreground">
                        <Link2 className="w-5 h-5 text-primary" />
                        Connect Project
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        Link projects to share knowledge across chatbots. Select a relationship tag for each project.
                    </DialogDescription>
                </DialogHeader>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search projects..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>

                {/* Project List */}
                <div className="max-h-[360px] overflow-y-auto space-y-2 pr-1">
                    {projectsLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : availableProjects.length === 0 ? (
                        <div className="text-center py-12">
                            <Link2 className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
                            <p className="text-sm text-muted-foreground">
                                {searchQuery ? "No matching projects found" : "No projects available to link"}
                            </p>
                        </div>
                    ) : (
                        availableProjects.map((project) => (
                            <div
                                key={project.id}
                                className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors"
                            >
                                <div className="min-w-0 flex-1">
                                    <h4 className="text-sm font-medium text-foreground truncate">
                                        {project.title}
                                    </h4>
                                    {project.one_line_summary && (
                                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                                            {project.one_line_summary}
                                        </p>
                                    )}
                                </div>

                                <Select
                                    value={selectedTypes[project.id] || "RESEARCH"}
                                    onValueChange={(val) =>
                                        setSelectedTypes((prev) => ({ ...prev, [project.id]: val }))
                                    }
                                >
                                    <SelectTrigger className="w-[120px] h-8 text-xs flex-shrink-0">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {LINK_TYPES.map((type) => (
                                            <SelectItem key={type.value} value={type.value}>
                                                <span className={`flex items-center gap-1.5 ${type.color}`}>
                                                    {type.icon}
                                                    {type.label}
                                                </span>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 px-3 flex-shrink-0 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors"
                                    onClick={() => handleLink(project.id)}
                                    disabled={linkingId === project.id}
                                >
                                    {linkingId === project.id ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                        <>
                                            <Link2 className="w-3.5 h-3.5 mr-1" />
                                            Link
                                        </>
                                    )}
                                </Button>
                            </div>
                        ))
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default LinkProjectModal;
