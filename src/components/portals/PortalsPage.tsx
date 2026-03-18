import { useState } from "react";
import { User } from "@supabase/supabase-js";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Plus, ExternalLink, Copy, Settings, Power, PowerOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CreatePortalDialog } from "./CreatePortalDialog";
import { PortalSettings } from "./PortalSettings";
import type { Tables } from "@/integrations/supabase/types";

type Portal = Tables<"client_portals"> & { clients: { name: string } | null };

interface PortalsPageProps {
  user: User | null;
}

export function PortalsPage({ user }: PortalsPageProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editingPortalId, setEditingPortalId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: portals, isLoading } = useQuery({
    queryKey: ["portals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_portals")
        .select("*, clients!fk_client_portals_client(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Portal[];
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

  // Clients that don't already have a portal
  const availableClients = clients?.filter(
    (c) => !portals?.some((p) => p.client_id === c.id)
  ) ?? [];

  const createPortal = useMutation({
    mutationFn: async (values: { client_id: string; slug: string; studio_name: string; welcome_message: string; accent_color: string; access_code: string }) => {
      const { error } = await supabase.from("client_portals").insert({ ...values, user_id: user!.id } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portals"] });
      toast.success("Portal created.");
      setCreateOpen(false);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const updatePortal = useMutation({
    mutationFn: async ({ id, ...values }: { id: string } & Partial<Tables<"client_portals">>) => {
      const { error } = await supabase.from("client_portals").update({ ...values, updated_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portals"] });
      toast.success("Portal updated.");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("client_portals").update({ is_active, updated_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portals"] });
      toast.success("Portal status updated.");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deletePortal = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("client_portals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portals"] });
      toast.success("Portal deleted.");
      setEditingPortalId(null);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const copyLink = (slug: string) => {
    const url = `${window.location.origin}/portal/${slug}`;
    navigator.clipboard.writeText(url);
    toast.success("Portal link copied to clipboard.");
  };

  const editingPortal = portals?.find((p) => p.id === editingPortalId);

  if (editingPortal) {
    return (
      <div className="p-6 lg:p-8 max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <button
            onClick={() => setEditingPortalId(null)}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors duration-150 font-body mb-6"
          >
            ← Back to Portals
          </button>
          <PortalSettings
            portal={editingPortal}
            onUpdate={(values) => updatePortal.mutate({ id: editingPortal.id, ...values })}
            onDelete={() => deletePortal.mutate(editingPortal.id)}
            isUpdating={updatePortal.isPending}
          />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Client Portals</h1>
            <p className="text-sm text-muted-foreground font-body mt-1">
              Create sharable portals for your clients.
            </p>
          </div>
          <Button variant="accent" className="gap-2" onClick={() => setCreateOpen(true)} disabled={availableClients.length === 0}>
            <Plus className="h-4 w-4" /> Create Portal
          </Button>
        </div>

        {availableClients.length === 0 && clients && clients.length === 0 && (
          <div className="mt-4 bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground font-body">Add clients in CRM first to create portals.</p>
          </div>
        )}

        {/* Portal Grid */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {isLoading && [1, 2].map((i) => (
            <div key={i} className="h-40 rounded-lg bg-card border border-border animate-pulse" />
          ))}

          {portals?.map((portal, i) => (
            <motion.div
              key={portal.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: i * 0.05 }}
              className="bg-card border border-border rounded-lg p-5 relative group"
            >
              {/* Color accent bar */}
              <div
                className="absolute top-0 left-0 right-0 h-1 rounded-t-lg"
                style={{ backgroundColor: portal.accent_color ?? "#C5A47E" }}
              />

              <div className="flex items-start justify-between mt-1">
                <div className="min-w-0">
                  <h3 className="text-sm font-display font-semibold text-foreground truncate">
                    {portal.clients?.name ?? "Unknown Client"}
                  </h3>
                  <p className="text-xs text-muted-foreground font-body mt-0.5">
                    {portal.studio_name}
                  </p>
                  <p className="text-xs text-muted-foreground font-body mt-1 truncate">
                    /portal/{portal.slug}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => toggleActive.mutate({ id: portal.id, is_active: !portal.is_active })}
                    className={`p-1.5 rounded transition-colors duration-150 ${portal.is_active ? "text-green-400 hover:bg-green-500/10" : "text-muted-foreground hover:bg-muted"}`}
                    title={portal.is_active ? "Active — click to deactivate" : "Inactive — click to activate"}
                  >
                    {portal.is_active ? <Power className="h-3.5 w-3.5" /> : <PowerOff className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs font-body"
                  onClick={() => copyLink(portal.slug)}
                >
                  <Copy className="h-3 w-3" /> Copy Link
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs font-body"
                  onClick={() => window.open(`/portal/${portal.slug}`, "_blank")}
                >
                  <ExternalLink className="h-3 w-3" /> Preview
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-xs font-body text-muted-foreground"
                  onClick={() => setEditingPortalId(portal.id)}
                >
                  <Settings className="h-3 w-3" /> Settings
                </Button>
              </div>
            </motion.div>
          ))}

          {!isLoading && portals?.length === 0 && (
            <div className="col-span-full text-center py-16">
              <ExternalLink className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground font-body">No portals yet. Create one for your client.</p>
            </div>
          )}
        </div>
      </motion.div>

      <CreatePortalDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={(values) => createPortal.mutate(values)}
        isSubmitting={createPortal.isPending}
        clients={availableClients}
      />
    </div>
  );
}
