import { useState } from "react";
import { User } from "@supabase/supabase-js";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Plus, Search, ArrowLeft, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ProjectList } from "./ProjectList";
import { ProjectDetail } from "./ProjectDetail";
import { AddProjectDialog } from "./AddProjectDialog";
import { useMembership, FREE_LIMITS } from "@/hooks/useMembership";
import type { Tables } from "@/integrations/supabase/types";

type Project = Tables<"projects"> & { clients: { name: string } | null };
interface ProjectsPageProps { user: User | null; }

export function ProjectsPage({ user }: ProjectsPageProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const queryClient = useQueryClient();
  const { isMember } = useMembership(user?.id);

  const { data: projects, isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase.from("projects").select("*, clients(name)").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Project[];
    },
  });

  const { data: clients } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("id, name").order("name");
      if (error) throw error;
      return data as { id: string; name: string }[];
    },
  });

  const addProject = useMutation({
    mutationFn: async (values: any) => { const { error } = await supabase.from("projects").insert({ ...values, user_id: user!.id }); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["projects"] }); toast.success("Project created."); setAddDialogOpen(false); },
    onError: (err: any) => toast.error(err.message),
  });

  const updateProject = useMutation({
    mutationFn: async ({ id, ...values }: any) => { const { error } = await supabase.from("projects").update({ ...values, updated_at: new Date().toISOString() }).eq("id", id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["projects"] }); toast.success("Project updated."); },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteProject = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("projects").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["projects"] }); toast.success("Project deleted."); setSelectedProjectId(null); },
    onError: (err: any) => toast.error(err.message),
  });

  const filtered = projects?.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.clients?.name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || p.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const selectedProject = projects?.find((p) => p.id === selectedProjectId);
  const projectCount = projects?.length ?? 0;
  const canCreate = isMember || projectCount < FREE_LIMITS.projects;

  const handleCreate = () => {
    if (!canCreate) { toast.error("Upgrade your membership to create more projects."); return; }
    setAddDialogOpen(true);
  };

  if (selectedProject) {
    return (
      <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <button onClick={() => setSelectedProjectId(null)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors duration-150 font-body mb-6">
            <ArrowLeft className="h-4 w-4" /> Back to Projects
          </button>
          <ProjectDetail project={selectedProject} clients={clients ?? []} onUpdate={(values) => updateProject.mutate({ id: selectedProject.id, ...values })} onDelete={() => deleteProject.mutate(selectedProject.id)} isUpdating={updateProject.isPending} />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-xl md:text-2xl font-display font-bold text-foreground">Projects</h1>
            <p className="text-sm text-muted-foreground font-body mt-1">
              Manage your creative projects.
              {!isMember && <span className="text-primary ml-2">({projectCount}/{FREE_LIMITS.projects} projects)</span>}
            </p>
          </div>
          <Button variant="accent" className="gap-2 shrink-0" onClick={handleCreate}>
            {canCreate ? <Plus className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
            <span className="hidden sm:inline">New Project</span>
          </Button>
        </div>
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search projects..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-card border-border font-body" />
          </div>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {["all", "draft", "active", "completed", "on_hold"].map((s) => (
              <button key={s} onClick={() => setFilterStatus(s)} className={`px-3 py-2 text-xs font-body uppercase tracking-wider rounded-md transition-colors duration-150 whitespace-nowrap ${filterStatus === s ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}>{s.replace("_", " ")}</button>
            ))}
          </div>
        </div>
        <div className="mt-4"><ProjectList projects={filtered ?? []} isLoading={isLoading} onSelect={setSelectedProjectId} /></div>
      </motion.div>
      <AddProjectDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} onSubmit={(values) => addProject.mutate(values)} isSubmitting={addProject.isPending} clients={clients ?? []} />
    </div>
  );
}
