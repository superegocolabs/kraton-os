import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useDashboardStats() {
  const activeProjects = useQuery({
    queryKey: ["projects", "active"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("projects")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");
      if (error) throw error;
      return count ?? 0;
    },
  });

  const totalClients = useQuery({
    queryKey: ["clients", "count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("clients")
        .select("*", { count: "exact", head: true });
      if (error) throw error;
      return count ?? 0;
    },
  });

  const monthlyRevenue = useQuery({
    queryKey: ["invoices", "revenue", "month"],
    queryFn: async () => {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const { data, error } = await supabase
        .from("invoices")
        .select("amount")
        .eq("status", "paid")
        .gte("paid_date", startOfMonth);
      if (error) throw error;
      return data?.reduce((sum, inv) => sum + Number(inv.amount), 0) ?? 0;
    },
  });

  const pendingInvoices = useQuery({
    queryKey: ["invoices", "pending"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("invoices")
        .select("*", { count: "exact", head: true })
        .in("status", ["sent", "overdue"]);
      if (error) throw error;
      return count ?? 0;
    },
  });

  const recentActivity = useQuery({
    queryKey: ["activity", "recent"],
    queryFn: async () => {
      // Fetch recent projects, clients, invoices combined
      const [projects, clients, invoices] = await Promise.all([
        supabase.from("projects").select("id, name, created_at").order("created_at", { ascending: false }).limit(3),
        supabase.from("clients").select("id, name, created_at").order("created_at", { ascending: false }).limit(3),
        supabase.from("invoices").select("id, invoice_number, amount, created_at").order("created_at", { ascending: false }).limit(3),
      ]);

      const items = [
        ...(projects.data?.map((p) => ({ type: "project" as const, label: `Project "${p.name}" created`, date: p.created_at })) ?? []),
        ...(clients.data?.map((c) => ({ type: "client" as const, label: `Client "${c.name}" added`, date: c.created_at })) ?? []),
        ...(invoices.data?.map((i) => ({ type: "invoice" as const, label: `Invoice ${i.invoice_number} — $${i.amount}`, date: i.created_at })) ?? []),
      ];

      return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
    },
  });

  return { activeProjects, totalClients, monthlyRevenue, pendingInvoices, recentActivity };
}
