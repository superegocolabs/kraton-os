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

interface AddClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: { name: string; email: string; phone: string; company: string; status: string }) => void;
  isSubmitting: boolean;
}

export function AddClientDialog({ open, onOpenChange, onSubmit, isSubmitting }: AddClientDialogProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [status, setStatus] = useState("lead");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      company: company.trim(),
      status,
    });
    // Reset
    setName("");
    setEmail("");
    setPhone("");
    setCompany("");
    setStatus("lead");
  };

  const fieldClass = "bg-transparent border-0 border-b border-border rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary font-body";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">Add Client</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <label className="text-xs font-body font-medium text-muted-foreground uppercase tracking-wider">
              Name *
            </label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className={`mt-1.5 ${fieldClass}`} placeholder="Client name" required maxLength={100} />
          </div>

          <div>
            <label className="text-xs font-body font-medium text-muted-foreground uppercase tracking-wider">
              Email
            </label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} className={`mt-1.5 ${fieldClass}`} placeholder="email@example.com" type="email" maxLength={255} />
          </div>

          <div>
            <label className="text-xs font-body font-medium text-muted-foreground uppercase tracking-wider">
              Phone
            </label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} className={`mt-1.5 ${fieldClass}`} placeholder="+62 xxx" maxLength={30} />
          </div>

          <div>
            <label className="text-xs font-body font-medium text-muted-foreground uppercase tracking-wider">
              Company
            </label>
            <Input value={company} onChange={(e) => setCompany(e.target.value)} className={`mt-1.5 ${fieldClass}`} placeholder="Company name" maxLength={100} />
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
                <SelectItem value="lead">Lead</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="pt-2">
            <Button type="submit" variant="accent" className="w-full" disabled={isSubmitting || !name.trim()}>
              {isSubmitting ? "Adding..." : "Add Client"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
