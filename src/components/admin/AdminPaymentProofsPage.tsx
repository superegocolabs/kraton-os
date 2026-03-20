import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Receipt, ExternalLink, Check, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useState } from "react";
import { formatCurrency } from "@/lib/currency";

export function AdminPaymentProofsPage() {
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  const { data: invoices, isLoading } = useQuery({
    queryKey: ["admin", "invoices-with-proof"],
    queryFn: async () => {
      const { data, error } = await supabase.from("invoices").select("*, clients(name)").not("payment_proof_url", "is", null).order("updated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const markAsPaid = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("invoices").update({ status: "paid", paid_date: new Date().toISOString().split("T")[0], updated_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "invoices-with-proof"] });
      toast.success("Invoice marked as paid.");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const filtered = invoices?.filter(
    (inv) => inv.invoice_number.toLowerCase().includes(search.toLowerCase()) || (inv as any).clients?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Payment Proofs</h1>
            <p className="text-sm text-muted-foreground font-body mt-1">Review payment proofs from clients.</p>
          </div>
          <Receipt className="h-5 w-5 text-muted-foreground" />
        </div>

        <div className="mt-6 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search invoices..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-card border-border font-body" />
        </div>

        <div className="mt-4 space-y-2">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground font-body text-sm">Loading...</div>
          ) : filtered?.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground font-body text-sm">No payment proofs yet.</div>
          ) : (
            filtered?.map((inv) => (
              <div key={inv.id} className="bg-card border border-border rounded-lg p-4 flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-body text-sm font-medium text-foreground">{inv.invoice_number}</p>
                    <Badge variant={inv.status === "paid" ? "default" : "outline"} className={`text-[10px] uppercase ${inv.status === "paid" ? "bg-green-500/20 text-green-400" : ""}`}>
                      {inv.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground font-body mt-0.5">{(inv as any).clients?.name ?? "No Client"} · {formatCurrency(Number(inv.amount))}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => window.open(inv.payment_proof_url!, "_blank")}>
                    <ExternalLink className="h-3 w-3" /> View Proof
                  </Button>
                  {inv.status !== "paid" && (
                    <Button size="sm" variant="accent" className="gap-1.5 text-xs" onClick={() => markAsPaid.mutate(inv.id)} disabled={markAsPaid.isPending}>
                      <Check className="h-3 w-3" /> Confirm Paid
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}
