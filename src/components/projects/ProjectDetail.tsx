import { useState } from "react";
import { Trash2, Save, Building2, Calendar, DollarSign, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { Tables } from "@/integrations/supabase/types";

type Project = Tables<"projects"> & { clients: { name: string } | null };

interface ProjectDetailProps {
  project: Project;
  clients: { id: string; name: string }[];
  onUpdate: (values: Partial<Tables<"projects">>) => void;
  onDelete: () => void;
  isUpdating: boolean;
}

export function ProjectDetail({ project, clients, onUpdate, onDelete, isUpdating }: ProjectDetailProps) {
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description ?? "");
  const [clientId, setClientId] = useState(project.client_id ?? "none");
  const [status, setStatus] = useState(project.status);
  const [budget, setBudget] = useState(String(project.budget ?? "0"));
  const [startDate, setStartDate] = useState(project.start_date ?? "");
  const [endDate, setEndDate] = useState(project.end_date ?? "");

  const handleSave = () => {
    if (!name.trim()) return;
    onUpdate({
      name: name.trim(),
      description: description.trim() || null,
      client_id: clientId === "none" ? null : clientId,
      status,
      budget: parseFloat(budget) || 0,
      start_date: startDate || null,
      end_date: endDate || null,
    });
  };

  const fieldClass = "bg-transparent border-0 border-b border-border rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary font-body";

  return (
    <div>
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">{project.name}</h1>
          <p className="text-xs text-muted-foreground font-body mt-1">
            Created {new Date(project.created_at).toLocaleDateString()}
            {project.clients?.name && <> · {project.clients.name}</>}
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
              <AlertDialogTitle className="font-display">Delete project?</AlertDialogTitle>
              <AlertDialogDescription className="font-body text-muted-foreground">
                This will permanently delete "{project.name}".
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="font-body">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground font-body">Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
        <div>
          <label className="text-xs font-body font-medium text-muted-foreground uppercase tracking-wider">Name</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} className={`mt-1.5 ${fieldClass}`} />
        </div>

        <div>
          <label className="text-xs font-body font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Building2 className="h-3 w-3" /> Client
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
          <label className="text-xs font-body font-medium text-muted-foreground uppercase tracking-wider">Status</label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className={`mt-1.5 ${fieldClass} border-b`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="on_hold">On Hold</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-xs font-body font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <DollarSign className="h-3 w-3" /> Budget
          </label>
          <Input value={budget} onChange={(e) => setBudget(e.target.value)} className={`mt-1.5 ${fieldClass}`} type="number" step="0.01" min="0" />
        </div>

        <div>
          <label className="text-xs font-body font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="h-3 w-3" /> Start Date
          </label>
          <Input value={startDate} onChange={(e) => setStartDate(e.target.value)} className={`mt-1.5 ${fieldClass}`} type="date" />
        </div>

        <div>
          <label className="text-xs font-body font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="h-3 w-3" /> End Date
          </label>
          <Input value={endDate} onChange={(e) => setEndDate(e.target.value)} className={`mt-1.5 ${fieldClass}`} type="date" />
        </div>
      </div>

      <div className="mt-6">
        <label className="text-xs font-body font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <FileText className="h-3 w-3" /> Description
        </label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="mt-1.5 bg-transparent border border-border rounded-lg focus-visible:ring-0 focus-visible:border-primary font-body resize-none"
          placeholder="Project description..."
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
