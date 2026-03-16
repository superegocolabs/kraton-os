import { motion } from "framer-motion";
import { FolderOpen, Building2, Calendar } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Project = Tables<"projects"> & { clients: { name: string } | null };

interface ProjectListProps {
  projects: Project[];
  isLoading: boolean;
  onSelect: (id: string) => void;
}

const statusStyles: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  active: "bg-primary/20 text-primary",
  completed: "bg-green-500/20 text-green-400",
  on_hold: "bg-yellow-500/20 text-yellow-400",
  cancelled: "bg-muted text-muted-foreground",
};

export function ProjectList({ projects, isLoading, onSelect }: ProjectListProps) {
  const fmt = (v: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(v);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-lg bg-card border border-border animate-pulse" />
        ))}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-16">
        <FolderOpen className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground font-body">No projects yet. Create your first project to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {projects.map((project, i) => (
        <motion.button
          key={project.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: i * 0.03 }}
          onClick={() => onSelect(project.id)}
          className="w-full text-left bg-card border border-border rounded-lg p-4 hover:border-primary/30 transition-colors duration-150 group"
        >
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-display font-semibold text-foreground group-hover:text-primary transition-colors duration-150 truncate">
                  {project.name}
                </h3>
                <span className={`text-[10px] uppercase tracking-wider font-body font-medium px-2 py-0.5 rounded shrink-0 ${statusStyles[project.status] ?? statusStyles.draft}`}>
                  {project.status.replace("_", " ")}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-1.5">
                {project.clients?.name && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground font-body truncate">
                    <Building2 className="h-3 w-3 shrink-0" /> {project.clients.name}
                  </span>
                )}
                {project.start_date && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground font-body">
                    <Calendar className="h-3 w-3 shrink-0" /> {new Date(project.start_date).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
            {project.budget && Number(project.budget) > 0 && (
              <span className="text-sm font-display font-bold text-foreground whitespace-nowrap ml-4">
                {fmt(Number(project.budget))}
              </span>
            )}
          </div>
        </motion.button>
      ))}
    </div>
  );
}
