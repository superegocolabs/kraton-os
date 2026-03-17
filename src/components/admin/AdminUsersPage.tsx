import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Users, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

export function AdminUsersPage() {
  const [search, setSearch] = useState("");

  const { data: profiles, isLoading } = useQuery({
    queryKey: ["admin", "profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: roles } = useQuery({
    queryKey: ["admin", "user-roles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: memberships } = useQuery({
    queryKey: ["admin", "memberships-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("memberships")
        .select("*");
      if (error) throw error;
      return data;
    },
  });

  const filtered = profiles?.filter(
    (p) =>
      p.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.email?.toLowerCase().includes(search.toLowerCase())
  );

  const getRoleForUser = (userId: string) =>
    roles?.find((r) => r.user_id === userId)?.role ?? "user";

  const getMembershipForUser = (userId: string) =>
    memberships?.find((m) => m.user_id === userId);

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Users</h1>
            <p className="text-sm text-muted-foreground font-body mt-1">
              Semua pengguna terdaftar.
            </p>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span className="text-sm font-body">{profiles?.length ?? 0} users</span>
          </div>
        </div>

        <div className="mt-6 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari user..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-card border-border font-body"
          />
        </div>

        <div className="mt-4 space-y-2">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground font-body text-sm">Loading...</div>
          ) : filtered?.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground font-body text-sm">Tidak ada user ditemukan.</div>
          ) : (
            filtered?.map((profile) => {
              const role = getRoleForUser(profile.id);
              const membership = getMembershipForUser(profile.id);
              return (
                <div
                  key={profile.id}
                  className="bg-card border border-border rounded-lg p-4 flex items-center justify-between"
                >
                  <div>
                    <p className="font-body text-sm font-medium text-foreground">
                      {profile.full_name || "No Name"}
                    </p>
                    <p className="text-xs text-muted-foreground font-body">{profile.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {role === "admin" && (
                      <Badge variant="destructive" className="text-[10px] uppercase">
                        Admin
                      </Badge>
                    )}
                    {membership?.is_active ? (
                      <Badge className="bg-primary/20 text-primary text-[10px] uppercase">
                        Member
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] uppercase text-muted-foreground">
                        Free
                      </Badge>
                    )}
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
