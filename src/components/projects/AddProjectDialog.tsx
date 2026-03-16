import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AddProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: { name: string; description: string; client_id: string | null; budget: number; status: string; start_date: string | null; end_date: string | null }) => void;
  isSubmitting: boolean;
  clients: { id: string; name: string }[];
}

export function AddProjectDialog({ open, onOpenChange, onSubmit, isSubmitting, clients }: AddProjectDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [clientId, setClientId] = useState<string>("none");
  const [budget, setBudget] = useState("");
  const [status, setStatus] = useState("active");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({
      name: name.trim(),
      description: description.trim(),
      client_id: clientId === "none" ? null : clientId,
      budget: parseFloat(budget) || 0,
      status,
      start_date: startDate || null,
      end_date: endDate || null,
    });
    setName(""); setDescription(""); setClientId("none"); setBudget(""); setStatus("active"); setStartDate(""); setEndDate("");
  };

  const fieldClass = "bg-transparent border-0 border-b border-border rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary font-body";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">New Project</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <label className="text-xs font-body font-medium text-muted-foreground uppercase tracking-wider">Name *</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className={`mt-1.5 ${fieldClass}`} placeholder="Project name" required maxLength={100} />
          </div>
          <div>
            <label className="text-xs font-body font-medium text-muted-foreground uppercase tracking-wider">Client</label>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger className={`mt-1.5 ${fieldClass} border-b`}><SelectValue placeholder="Select client" /></SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="none">No client</SelectItem>
                {clients.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-body font-medium text-muted-foreground uppercase tracking-wider">Budget</label>
            <Input value={budget} onChange={(e) => setBudget(e.target.value)} className={`mt-1.5 ${fieldClass}`} placeholder="0.00" type="number" step="0.01" min="0" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-body font-medium text-muted-foreground uppercase tracking-wider">Start Date</label>
              <Input value={startDate} onChange={(e) => setStartDate(e.target.value)} className={`mt-1.5 ${fieldClass}`} type="date" />
            </div>
            <div>
              <label className="text-xs font-body font-medium text-muted-foreground uppercase tracking-wider">End Date</label>
              <Input value={endDate} onChange={(e) => setEndDate(e.target.value)} className={`mt-1.5 ${fieldClass}`} type="date" />
            </div>
          </div>
          <div>
            <label className="text-xs font-body font-medium text-muted-foreground uppercase tracking-wider">Status</label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className={`mt-1.5 ${fieldClass} border-b`}><SelectValue /></SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="on_hold">On Hold</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="pt-2">
            <Button type="submit" variant="accent" className="w-full" disabled={isSubmitting || !name.trim()}>
              {isSubmitting ? "Creating..." : "Create Project"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
