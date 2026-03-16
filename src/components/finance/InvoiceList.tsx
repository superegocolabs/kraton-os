import { motion } from "framer-motion";
import { DollarSign, CheckCircle2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { Tables } from "@/integrations/supabase/types";

type Invoice = Tables<"invoices"> & { clients: { name: string } | null };

interface InvoiceListProps {
  invoices: Invoice[];
  isLoading: boolean;
  onMarkPaid: (id: string) => void;
  onDelete: (id: string) => void;
}

const statusStyles: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-blue-500/20 text-blue-400",
  paid: "bg-green-500/20 text-green-400",
  overdue: "bg-red-500/20 text-red-400",
  cancelled: "bg-muted text-muted-foreground",
};

export function InvoiceList({ invoices, isLoading, onMarkPaid, onDelete }: InvoiceListProps) {
  const fmt = (v: number) => formatCurrency(v);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 rounded-lg bg-card border border-border animate-pulse" />
        ))}
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="text-center py-16">
        <DollarSign className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground font-body">No invoices found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {invoices.map((inv, i) => (
        <motion.div
          key={inv.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: i * 0.03 }}
          className="bg-card border border-border rounded-lg p-4 flex items-center gap-4"
        >
          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <span className="text-sm font-display font-semibold text-foreground">
                {inv.invoice_number}
              </span>
              <span className={`text-[10px] uppercase tracking-wider font-body font-medium px-2 py-0.5 rounded ${statusStyles[inv.status] ?? statusStyles.draft}`}>
                {inv.status}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1">
              {inv.clients?.name && (
                <span className="text-xs text-muted-foreground font-body">{inv.clients.name}</span>
              )}
              {inv.due_date && (
                <span className="text-xs text-muted-foreground font-body">
                  Due {new Date(inv.due_date).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>

          {/* Amount */}
          <span className="text-lg font-display font-bold text-foreground whitespace-nowrap">
            {fmt(Number(inv.amount))}
          </span>

          {/* Actions */}
          <div className="flex items-center gap-1">
            {(inv.status === "sent" || inv.status === "overdue" || inv.status === "draft") && (
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-green-400"
                onClick={() => onMarkPaid(inv.id)}
                title="Mark as paid"
              >
                <CheckCircle2 className="h-4 w-4" />
              </Button>
            )}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-card border-border">
                <AlertDialogHeader>
                  <AlertDialogTitle className="font-display">Delete invoice?</AlertDialogTitle>
                  <AlertDialogDescription className="font-body text-muted-foreground">
                    This will permanently delete invoice "{inv.invoice_number}".
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="font-body">Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDelete(inv.id)} className="bg-destructive text-destructive-foreground font-body">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
