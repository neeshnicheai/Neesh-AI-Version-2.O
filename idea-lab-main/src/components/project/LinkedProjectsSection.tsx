import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Link2, ExternalLink, Unlink, Search, Beaker, Lightbulb, Wrench } from "lucide-react";
import type { LinkedProject } from "@/hooks/useProjectLinks";

const LINK_TYPE_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
    RESEARCH: {
        label: "Research",
        color: "text-blue-400",
        bg: "bg-blue-500/15 border-blue-500/30",
        icon: <Beaker className="w-3 h-3" />,
    },
    USECASE: {
        label: "Use Case",
        color: "text-emerald-400",
        bg: "bg-emerald-500/15 border-emerald-500/30",
        icon: <Lightbulb className="w-3 h-3" />,
    },
    SOLUTION: {
        label: "Solution",
        color: "text-purple-400",
        bg: "bg-purple-500/15 border-purple-500/30",
        icon: <Wrench className="w-3 h-3" />,
    },
};

interface LinkedProjectsSectionProps {
    linkedProjects: LinkedProject[];
    loading: boolean;
    onUnlink: (linkId: string) => void;
}

const LinkedProjectsSection = ({ linkedProjects, loading, onUnlink }: LinkedProjectsSectionProps) => {
    const navigate = useNavigate();

    if (loading) {
        return (
            <div className="border border-border bg-card">
                <div className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Link2 className="w-5 h-5 text-primary" />
                        <h2 className="text-lg font-semibold text-foreground">Linked Projects</h2>
                    </div>
                    <div className="animate-pulse space-y-3">
                        <div className="h-16 bg-muted rounded" />
                        <div className="h-16 bg-muted rounded" />
                    </div>
                </div>
            </div>
        );
    }

    if (linkedProjects.length === 0) {
        return (
            <div className="border border-border bg-card rounded-lg">
                <div className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                        <Link2 className="w-5 h-5 text-primary" />
                        <h2 className="text-lg font-semibold text-foreground">Linked Projects</h2>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        No linked projects yet. Use the + button above to connect related projects and enable knowledge sharing.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="border border-border bg-card">
            <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Link2 className="w-5 h-5 text-primary" />
                        <h2 className="text-lg font-semibold text-foreground">Linked Projects</h2>
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                            {linkedProjects.length}
                        </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Knowledge is shared across linked projects
                    </p>
                </div>

                <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                    {linkedProjects.map((project) => {
                        const typeConfig = LINK_TYPE_CONFIG[project.linkType] || LINK_TYPE_CONFIG.RESEARCH;

                        return (
                            <div
                                key={project.linkId}
                                className="group flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/20 hover:bg-muted/40 hover:border-primary/30 transition-all cursor-pointer"
                                onClick={() => navigate(`/project/${project.projectId}`)}
                            >
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                                        <ExternalLink className="w-4 h-4 text-primary" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h3 className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                                            {project.projectTitle}
                                        </h3>
                                        {project.projectSummary && (
                                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                                                {project.projectSummary}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                                    <span
                                        className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border ${typeConfig.bg} ${typeConfig.color}`}
                                    >
                                        {typeConfig.icon}
                                        {typeConfig.label}
                                    </span>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onUnlink(project.linkId);
                                        }}
                                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                                        title="Unlink project"
                                    >
                                        <Unlink className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default LinkedProjectsSection;
