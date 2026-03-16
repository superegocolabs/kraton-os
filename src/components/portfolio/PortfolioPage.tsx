import { useState } from "react";
import { User } from "@supabase/supabase-js";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Image, Eye, ExternalLink, FolderOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/currency";

interface PortfolioPageProps {
  user: User | null;
}

export function PortfolioPage({ user }: PortfolioPageProps) {
  const [filter, setFilter] = useState<string>("all");

  const { data: projects, isLoading } = useQuery({
    queryKey: ["portfolio-projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*, clients(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filtered = projects?.filter((p) => {
    if (filter === "all") return true;
    return p.status === filter;
  });

  const completedCount = projects?.filter((p) => p.status === "completed").length ?? 0;
  const activeCount = projects?.filter((p) => p.status === "active").length ?? 0;
  const totalBudget = projects?.reduce((s, p) => s + Number(p.budget ?? 0), 0) ?? 0;

  const statusColor: Record<string, string> = {
    active: "bg-blue-500/20 text-blue-400",
    completed: "bg-green-500/20 text-green-400",
    on_hold: "bg-yellow-500/20 text-yellow-400",
    cancelled: "bg-red-500/20 text-red-400",
  };

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        {/* Header */}
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Portfolio</h1>
          <p className="text-sm text-muted-foreground font-body mt-1">
            Showcase your completed and ongoing projects.
          </p>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Total Projects", value: String(projects?.length ?? 0), icon: FolderOpen },
            { label: "Active", value: String(activeCount), icon: Eye },
            { label: "Completed", value: String(completedCount), icon: Image },
            { label: "Total Budget", value: formatCurrency(totalBudget), icon: ExternalLink },
          ].map((s) => (
            <div key={s.label} className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-body uppercase tracking-[0.15em] text-muted-foreground">{s.label}</span>
                <s.icon className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <p className="text-xl font-display font-bold text-foreground">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div className="mt-6 flex gap-1">
          {["all", "active", "completed", "on_hold", "cancelled"].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-2 text-xs font-body uppercase tracking-wider rounded-md transition-colors duration-150 ${
                filter === s
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {s.replace("_", " ")}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading
            ? [1, 2, 3].map((i) => (
                <div key={i} className="h-48 rounded-lg bg-card border border-border animate-pulse" />
              ))
            : filtered && filtered.length > 0
            ? filtered.map((project, i) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.03 }}
                  className="bg-card border border-border rounded-lg p-5 flex flex-col justify-between group hover:border-primary/30 transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <Badge className={`text-[10px] uppercase tracking-wider ${statusColor[project.status] ?? "bg-muted text-muted-foreground"}`}>
                        {project.status.replace("_", " ")}
                      </Badge>
                      {project.budget && (
                        <span className="text-xs font-display font-bold text-muted-foreground">
                          {formatCurrency(Number(project.budget))}
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-display font-semibold text-foreground">
                      {project.name}
                    </h3>
                    {(project as any).clients?.name && (
                      <p className="text-xs text-muted-foreground font-body mt-1">
                        {(project as any).clients.name}
                      </p>
                    )}
                    {project.description && (
                      <p className="text-xs text-muted-foreground font-body mt-2 line-clamp-2">
                        {project.description}
                      </p>
                    )}
                  </div>
                  <div className="mt-4 flex items-center gap-3 text-[10px] text-muted-foreground font-body">
                    {project.start_date && (
                      <span>{new Date(project.start_date).toLocaleDateString("id-ID", { month: "short", year: "numeric" })}</span>
                    )}
                    {project.start_date && project.end_date && <span>→</span>}
                    {project.end_date && (
                      <span>{new Date(project.end_date).toLocaleDateString("id-ID", { month: "short", year: "numeric" })}</span>
                    )}
                  </div>
                </motion.div>
              ))
            : (
                <div className="col-span-full text-center py-16">
                  <FolderOpen className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground font-body">No projects in your portfolio yet.</p>
                </div>
              )}
        </div>
      </motion.div>
    </div>
  );
}
