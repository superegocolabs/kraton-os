import { useState } from "react";
import { User } from "@supabase/supabase-js";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Plus, Search, DollarSign, TrendingUp, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { InvoiceList } from "./InvoiceList";
import { AddInvoiceDialog } from "./AddInvoiceDialog";
import type { Tables } from "@/integrations/supabase/types";
import type { InvoiceFormValues, InvoiceInitialValues } from "./AddInvoiceDialog";
import { formatCurrency } from "@/lib/currency";

type Invoice = Tables<"invoices">;
type Client = Tables<"clients">;

interface FinancePageProps {
  user: User | null;
}

export function FinancePage({ user }: FinancePageProps) {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<InvoiceInitialValues | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const queryClient = useQueryClient();

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["invoices"] });
    queryClient.invalidateQueries({ queryKey: ["invoices", "pending"] });
    queryClient.invalidateQueries({ queryKey: ["invoices", "revenue", "month"] });
  };

  const { data: invoices, isLoading } = useQuery({
    queryKey: ["invoices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("*, clients(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as (Invoice & { clients: { name: string } | null })[];
    },
  });

  const { data: clients } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("id, name").order("name");
      if (error) throw error;
      return data as Pick<Client, "id" | "name">[];
    },
  });

  const addInvoice = useMutation({
    mutationFn: async (values: InvoiceFormValues) => {
      const { error } = await supabase.from("invoices").insert({
        ...values,
        user_id: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAll();
      toast.success("Invoice created.");
      setAddDialogOpen(false);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const updateInvoice = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: InvoiceFormValues }) => {
      const { error } = await supabase
        .from("invoices")
        .update({ ...values, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAll();
      toast.success("Invoice updated.");
      setEditingInvoice(null);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const markAsPaid = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("invoices")
        .update({ status: "paid", paid_date: new Date().toISOString().split("T")[0], updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAll();
      toast.success("Invoice marked as paid.");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const toggleHidden = useMutation({
    mutationFn: async ({ id, hidden }: { id: string; hidden: boolean }) => {
      const { error } = await supabase
        .from("invoices")
        .update({ hidden_from_portal: hidden, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, { hidden }) => {
      invalidateAll();
      toast.success(hidden ? "Invoice hidden from client portal." : "Invoice visible to client.");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteInvoice = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("invoices").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAll();
      toast.success("Invoice deleted.");
    },
    onError: (err: any) => toast.error(err.message),
  });

  // Stats
  const totalRevenue = invoices?.filter((i) => i.status === "paid").reduce((s, i) => s + Number(i.amount), 0) ?? 0;
  const pendingAmount = invoices?.filter((i) => i.status === "sent" || i.status === "overdue").reduce((s, i) => s + Number(i.amount), 0) ?? 0;
  const overdueCount = invoices?.filter((i) => i.status === "overdue").length ?? 0;
  const paidCount = invoices?.filter((i) => i.status === "paid").length ?? 0;

  const fmt = (v: number) => formatCurrency(v);

  const filtered = invoices?.filter((inv) => {
    const matchSearch =
      inv.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
      inv.clients?.name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || inv.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const handleEditInvoice = (inv: Invoice & { clients: { name: string } | null }) => {
    setEditingInvoice({
      id: inv.id,
      invoice_number: inv.invoice_number,
      amount: Number(inv.amount),
      client_id: inv.client_id,
      project_id: inv.project_id,
      due_date: inv.due_date,
      status: inv.status,
      notes: inv.notes,
    });
  };

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Finance</h1>
            <p className="text-sm text-muted-foreground font-body mt-1">Track invoices and revenue.</p>
          </div>
          <Button variant="accent" className="gap-2" onClick={() => setAddDialogOpen(true)}>
            <Plus className="h-4 w-4" /> New Invoice
          </Button>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Total Revenue", value: fmt(totalRevenue), icon: TrendingUp },
            { label: "Pending", value: fmt(pendingAmount), icon: Clock },
            { label: "Overdue", value: String(overdueCount), icon: DollarSign },
            { label: "Paid", value: String(paidCount), icon: CheckCircle2 },
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

        {/* Filters */}
        <div className="mt-6 flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search invoices..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-card border-border font-body"
            />
          </div>
          <div className="flex gap-1">
            {["all", "draft", "sent", "paid", "overdue"].map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-2 text-xs font-body uppercase tracking-wider rounded-md transition-colors duration-150 ${
                  filterStatus === s
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="mt-4">
          <InvoiceList
            invoices={filtered ?? []}
            isLoading={isLoading}
            onMarkPaid={(id) => markAsPaid.mutate(id)}
            onDelete={(id) => deleteInvoice.mutate(id)}
            onToggleHidden={(id, hidden) => toggleHidden.mutate({ id, hidden })}
            onEdit={handleEditInvoice}
          />
        </div>
      </motion.div>

      {/* Add new invoice dialog */}
      <AddInvoiceDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSubmit={(values) => addInvoice.mutate(values)}
        isSubmitting={addInvoice.isPending}
        clients={clients ?? []}
      />

      {/* Edit invoice dialog */}
      <AddInvoiceDialog
        open={!!editingInvoice}
        onOpenChange={(open) => { if (!open) setEditingInvoice(null); }}
        onSubmit={(values) => editingInvoice && updateInvoice.mutate({ id: editingInvoice.id, values })}
        isSubmitting={updateInvoice.isPending}
        clients={clients ?? []}
        initialValues={editingInvoice}
      />
    </div>
  );
}
