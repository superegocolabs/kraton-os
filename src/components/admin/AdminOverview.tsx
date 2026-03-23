import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Users, CreditCard, Receipt, Shield, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";

export function AdminOverview() {
  const { data: profileCount } = useQuery({
    queryKey: ["admin", "profile-count"],
    queryFn: async () => {
      const { count, error } = await supabase.from("profiles").select("*", { count: "exact", head: true });
      if (error) throw error;
      return count ?? 0;
    },
  });

  const { data: membershipCount } = useQuery({
    queryKey: ["admin", "membership-count"],
    queryFn: async () => {
      const { count, error } = await supabase.from("memberships").select("*", { count: "exact", head: true }).eq("is_active", true);
      if (error) throw error;
      return count ?? 0;
    },
  });

  const { data: proofCount } = useQuery({
    queryKey: ["admin", "proof-count"],
    queryFn: async () => {
      const { count, error } = await supabase.from("invoices").select("*", { count: "exact", head: true }).not("payment_proof_url", "is", null);
      if (error) throw error;
      return count ?? 0;
    },
  });

  const { data: feedbackCount } = useQuery({
    queryKey: ["admin", "feedback-count"],
    queryFn: async () => {
      const { count, error } = await supabase.from("client_feedback").select("*", { count: "exact", head: true });
      if (error) throw error;
      return count ?? 0;
    },
  });

  const stats = [
    { label: "Total Users", value: profileCount ?? 0, icon: Users },
    { label: "Active Members", value: membershipCount ?? 0, icon: CreditCard },
    { label: "Payment Proofs", value: proofCount ?? 0, icon: Receipt },
    { label: "Client Feedback", value: feedbackCount ?? 0, icon: MessageSquare },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        <h1 className="text-2xl font-display font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground font-body mt-1">Manage users, memberships, and payments.</p>
        <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3">
          {stats.map((s) => (
            <div key={s.label} className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-body uppercase tracking-[0.15em] text-muted-foreground">{s.label}</span>
                <s.icon className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <p className="text-xl font-display font-bold text-foreground">{s.value}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
