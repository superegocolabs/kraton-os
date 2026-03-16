import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AddInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: {
    invoice_number: string;
    amount: number;
    client_id: string | null;
    project_id: string | null;
    due_date: string | null;
    status: string;
    notes: string;
  }) => void;
  isSubmitting: boolean;
  clients: { id: string; name: string }[];
}

export function AddInvoiceDialog({ open, onOpenChange, onSubmit, isSubmitting, clients }: AddInvoiceDialogProps) {
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [clientId, setClientId] = useState<string>("none");
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState("draft");
  const [notes, setNotes] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!invoiceNumber.trim() || !amount || isNaN(parsedAmount) || parsedAmount <= 0) return;
    if (invoiceNumber.trim().length > 50 || notes.trim().length > 500) return;
    onSubmit({
      invoice_number: invoiceNumber.trim(),
      amount: parsedAmount,
      client_id: clientId === "none" ? null : clientId,
      project_id: null,
      due_date: dueDate || null,
      status,
      notes: notes.trim(),
    });
    setInvoiceNumber("");
    setAmount("");
    setClientId("none");
    setDueDate("");
    setStatus("draft");
    setNotes("");
  };

  const fieldClass = "bg-transparent border-0 border-b border-border rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary font-body";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">New Invoice</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <label className="text-xs font-body font-medium text-muted-foreground uppercase tracking-wider">
              Invoice Number *
            </label>
            <Input
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              className={`mt-1.5 ${fieldClass}`}
              placeholder="INV-001"
              required
              maxLength={50}
            />
          </div>

          <div>
            <label className="text-xs font-body font-medium text-muted-foreground uppercase tracking-wider">
              Amount *
            </label>
            <Input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={`mt-1.5 ${fieldClass}`}
              placeholder="0.00"
              type="number"
              step="0.01"
              min="0"
              required
            />
          </div>

          <div>
            <label className="text-xs font-body font-medium text-muted-foreground uppercase tracking-wider">
              Client
            </label>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger className={`mt-1.5 ${fieldClass} border-b`}>
                <SelectValue placeholder="Select client" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="none">No client</SelectItem>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs font-body font-medium text-muted-foreground uppercase tracking-wider">
              Due Date
            </label>
            <Input
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className={`mt-1.5 ${fieldClass}`}
              type="date"
            />
          </div>

          <div>
            <label className="text-xs font-body font-medium text-muted-foreground uppercase tracking-wider">
              Status
            </label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className={`mt-1.5 ${fieldClass} border-b`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="pt-2">
            <Button type="submit" variant="accent" className="w-full" disabled={isSubmitting || !invoiceNumber.trim() || !amount}>
              {isSubmitting ? "Creating..." : "Create Invoice"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
