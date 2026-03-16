import { useState } from "react";
import { motion } from "framer-motion";
import { Trash2, Save, Mail, Phone, Building2, StickyNote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

type Client = Tables<"clients">;

interface ClientDetailProps {
  client: Client;
  onUpdate: (values: Partial<Client>) => void;
  onDelete: () => void;
  isUpdating: boolean;
}

export function ClientDetail({ client, onUpdate, onDelete, isUpdating }: ClientDetailProps) {
  const [name, setName] = useState(client.name);
  const [email, setEmail] = useState(client.email ?? "");
  const [phone, setPhone] = useState(client.phone ?? "");
  const [company, setCompany] = useState(client.company ?? "");
  const [status, setStatus] = useState(client.status);
  const [notes, setNotes] = useState(client.notes ?? "");

  const handleSave = () => {
    if (!name.trim()) return;
    onUpdate({ name: name.trim(), email: email.trim() || null, phone: phone.trim() || null, company: company.trim() || null, status, notes: notes.trim() || null });
  };

  const fieldClass = "bg-transparent border-0 border-b border-border rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary font-body";

  return (
    <div>
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">{client.name}</h1>
          <p className="text-xs text-muted-foreground font-body mt-1">
            Added {new Date(client.created_at).toLocaleDateString()}
          </p>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-card border-border">
            <AlertDialogHeader>
              <AlertDialogTitle className="font-display">Delete client?</AlertDialogTitle>
              <AlertDialogDescription className="font-body text-muted-foreground">
                This will permanently delete "{client.name}" and cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="font-body">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground font-body">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
        <div>
          <label className="text-xs font-body font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            Name
          </label>
          <Input value={name} onChange={(e) => setName(e.target.value)} className={`mt-1.5 ${fieldClass}`} />
        </div>

        <div>
          <label className="text-xs font-body font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Mail className="h-3 w-3" /> Email
          </label>
          <Input value={email} onChange={(e) => setEmail(e.target.value)} className={`mt-1.5 ${fieldClass}`} type="email" />
        </div>

        <div>
          <label className="text-xs font-body font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Phone className="h-3 w-3" /> Phone
          </label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} className={`mt-1.5 ${fieldClass}`} />
        </div>

        <div>
          <label className="text-xs font-body font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Building2 className="h-3 w-3" /> Company
          </label>
          <Input value={company} onChange={(e) => setCompany(e.target.value)} className={`mt-1.5 ${fieldClass}`} />
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
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-6">
        <label className="text-xs font-body font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <StickyNote className="h-3 w-3" /> Notes
        </label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          className="mt-1.5 bg-transparent border border-border rounded-lg focus-visible:ring-0 focus-visible:border-primary font-body resize-none"
          placeholder="Add notes about this client..."
        />
      </div>

      <div className="mt-8">
        <Button variant="accent" className="gap-2" onClick={handleSave} disabled={isUpdating || !name.trim()}>
          <Save className="h-4 w-4" /> {isUpdating ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
