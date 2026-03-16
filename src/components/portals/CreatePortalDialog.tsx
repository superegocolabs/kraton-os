import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CreatePortalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: { client_id: string; slug: string; studio_name: string; welcome_message: string; accent_color: string }) => void;
  isSubmitting: boolean;
  clients: { id: string; name: string }[];
}

export function CreatePortalDialog({ open, onOpenChange, onSubmit, isSubmitting, clients }: CreatePortalDialogProps) {
  const [clientId, setClientId] = useState("");
  const [studioName, setStudioName] = useState("Kraton Studio");
  const [welcomeMessage, setWelcomeMessage] = useState("Welcome to your project portal. Here you'll find all updates and deliverables.");
  const [accentColor, setAccentColor] = useState("#C5A47E");

  const selectedClient = clients.find((c) => c.id === clientId);
  const autoSlug = selectedClient
    ? selectedClient.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
    : "";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId || !autoSlug) return;
    onSubmit({
      client_id: clientId,
      slug: autoSlug,
      studio_name: studioName.trim(),
      welcome_message: welcomeMessage.trim(),
      accent_color: accentColor,
    });
    setClientId("");
    setStudioName("Kraton Studio");
    setWelcomeMessage("Welcome to your project portal. Here you'll find all updates and deliverables.");
    setAccentColor("#C5A47E");
  };

  const fieldClass = "bg-transparent border-0 border-b border-border rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary font-body";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">Create Client Portal</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <label className="text-xs font-body font-medium text-muted-foreground uppercase tracking-wider">Client *</label>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger className={`mt-1.5 ${fieldClass} border-b`}>
                <SelectValue placeholder="Select a client" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {autoSlug && (
            <div>
              <label className="text-xs font-body font-medium text-muted-foreground uppercase tracking-wider">Portal URL</label>
              <p className="mt-1.5 text-sm text-muted-foreground font-body">/portal/{autoSlug}</p>
            </div>
          )}

          <div>
            <label className="text-xs font-body font-medium text-muted-foreground uppercase tracking-wider">Studio Name</label>
            <Input value={studioName} onChange={(e) => setStudioName(e.target.value)} className={`mt-1.5 ${fieldClass}`} maxLength={100} />
          </div>

          <div>
            <label className="text-xs font-body font-medium text-muted-foreground uppercase tracking-wider">Welcome Message</label>
            <Textarea
              value={welcomeMessage}
              onChange={(e) => setWelcomeMessage(e.target.value)}
              className="mt-1.5 bg-transparent border border-border rounded-lg focus-visible:ring-0 focus-visible:border-primary font-body resize-none"
              rows={3}
              maxLength={500}
            />
          </div>

          <div>
            <label className="text-xs font-body font-medium text-muted-foreground uppercase tracking-wider">Accent Color</label>
            <div className="flex items-center gap-3 mt-1.5">
              <input
                type="color"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent"
              />
              <Input
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                className={`flex-1 ${fieldClass}`}
                maxLength={7}
              />
            </div>
          </div>

          <div className="pt-2">
            <Button type="submit" variant="accent" className="w-full" disabled={isSubmitting || !clientId}>
              {isSubmitting ? "Creating..." : "Create Portal"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
