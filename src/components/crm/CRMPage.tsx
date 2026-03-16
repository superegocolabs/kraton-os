import { useState } from "react";
import { User } from "@supabase/supabase-js";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Plus, Search, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ClientList } from "./ClientList";
import { ClientDetail } from "./ClientDetail";
import { AddClientDialog } from "./AddClientDialog";
import type { Tables } from "@/integrations/supabase/types";

type Client = Tables<"clients">;

interface CRMPageProps {
  user: User | null;
}

export function CRMPage({ user }: CRMPageProps) {
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  const { data: clients, isLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Client[];
    },
  });

  const addClient = useMutation({
    mutationFn: async (values: { name: string; email: string; phone: string; company: string; status: string }) => {
      const { error } = await supabase.from("clients").insert({
        ...values,
        user_id: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["clients", "count"] });
      toast.success("Client added successfully.");
      setAddDialogOpen(false);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteClient = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("clients").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["clients", "count"] });
      toast.success("Client deleted.");
      setSelectedClientId(null);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const updateClient = useMutation({
    mutationFn: async ({ id, ...values }: { id: string; name?: string; email?: string; phone?: string; company?: string; status?: string; notes?: string }) => {
      const { error } = await supabase.from("clients").update({ ...values, updated_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Client updated.");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const filtered = clients?.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.company?.toLowerCase().includes(search.toLowerCase())
  );

  const selectedClient = clients?.find((c) => c.id === selectedClientId);

  if (selectedClient) {
    return (
      <div className="p-6 lg:p-8 max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <button
            onClick={() => setSelectedClientId(null)}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors duration-150 font-body mb-6"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Clients
          </button>
          <ClientDetail
            client={selectedClient}
            onUpdate={(values) => updateClient.mutate({ id: selectedClient.id, ...values })}
            onDelete={() => deleteClient.mutate(selectedClient.id)}
            isUpdating={updateClient.isPending}
          />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Clients</h1>
            <p className="text-sm text-muted-foreground font-body mt-1">
              Manage your client relationships.
            </p>
          </div>
          <Button variant="accent" className="gap-2" onClick={() => setAddDialogOpen(true)}>
            <Plus className="h-4 w-4" /> Add Client
          </Button>
        </div>

        {/* Search */}
        <div className="mt-6 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-card border-border font-body"
          />
        </div>

        {/* List */}
        <div className="mt-6">
          <ClientList
            clients={filtered ?? []}
            isLoading={isLoading}
            onSelect={setSelectedClientId}
          />
        </div>
      </motion.div>

      <AddClientDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSubmit={(values) => addClient.mutate(values)}
        isSubmitting={addClient.isPending}
      />
    </div>
  );
}
