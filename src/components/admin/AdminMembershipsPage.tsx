import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { motion } from "framer-motion";
import { CreditCard, Check, X, Search, Eye, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useState } from "react";

interface AdminMembershipsPageProps {
  user: User | null;
}

export function AdminMembershipsPage({ user }: AdminMembershipsPageProps) {
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  const { data: profiles } = useQuery({
    queryKey: ["admin", "profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: memberships, isLoading } = useQuery({
    queryKey: ["admin", "memberships-all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("memberships").select("*");
      if (error) throw error;
      return data;
    },
  });

  const toggleMembership = useMutation({
    mutationFn: async ({ userId, activate }: { userId: string; activate: boolean }) => {
      const existing = memberships?.find((m) => m.user_id === userId);
      if (existing) {
        const { error } = await supabase.from("memberships").update({
          is_active: activate, granted_by: activate ? user!.id : null,
          granted_at: activate ? new Date().toISOString() : null,
          plan_name: activate ? "pro" : "free", updated_at: new Date().toISOString(),
        }).eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("memberships").insert({
          user_id: userId, is_active: activate,
          granted_by: activate ? user!.id : null,
          granted_at: activate ? new Date().toISOString() : null,
          plan_name: activate ? "pro" : "free",
        });
        if (error) throw error;
      }
    },
    onSuccess: (_, { activate }) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "memberships-all"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "membership-count"] });
      toast.success(activate ? "Membership activated." : "Membership revoked.");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const getMembershipForUser = (userId: string) => memberships?.find((m) => m.user_id === userId);

  const filtered = profiles?.filter(
    (p) => p.full_name?.toLowerCase().includes(search.toLowerCase()) || p.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Memberships</h1>
            <p className="text-sm text-muted-foreground font-body mt-1">Manage user memberships.</p>
          </div>
          <CreditCard className="h-5 w-5 text-muted-foreground" />
        </div>

        <div className="mt-6 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-card border-border font-body" />
        </div>

        <div className="mt-4 space-y-2">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground font-body text-sm">Loading...</div>
          ) : (
            filtered?.map((profile) => {
              const membership = getMembershipForUser(profile.id);
              const isActive = !!membership?.is_active;
              const proofUrl = (membership as any)?.payment_proof_url;
              return (
                <div key={profile.id} className="bg-card border border-border rounded-lg p-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-body text-sm font-medium text-foreground">{profile.full_name || "No Name"}</p>
                    <p className="text-xs text-muted-foreground font-body">{profile.email}</p>
                    {membership?.granted_at && (
                      <p className="text-[10px] text-muted-foreground font-body mt-1">Granted: {new Date(membership.granted_at).toLocaleDateString()}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {proofUrl && (
                      <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => window.open(proofUrl, "_blank")}>
                        <Eye className="h-3 w-3" /> Proof
                      </Button>
                    )}
                    {isActive ? (
                      <Badge className="bg-primary/20 text-primary text-[10px] uppercase">Active</Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] uppercase text-muted-foreground">Free</Badge>
                    )}
                    <Button size="sm" variant={isActive ? "outline" : "accent"} className="gap-1.5 text-xs"
                      onClick={() => toggleMembership.mutate({ userId: profile.id, activate: !isActive })} disabled={toggleMembership.isPending}>
                      {isActive ? <><X className="h-3 w-3" /> Revoke</> : <><Check className="h-3 w-3" /> Activate</>}
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </motion.div>
    </div>
  );
}
