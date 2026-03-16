import { useState } from "react";
import { Trash2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { Tables } from "@/integrations/supabase/types";

type Portal = Tables<"client_portals"> & { clients: { name: string } | null };

interface PortalSettingsProps {
  portal: Portal;
  onUpdate: (values: Partial<Tables<"client_portals">>) => void;
  onDelete: () => void;
  isUpdating: boolean;
}

export function PortalSettings({ portal, onUpdate, onDelete, isUpdating }: PortalSettingsProps) {
  const [studioName, setStudioName] = useState(portal.studio_name ?? "");
  const [welcomeMessage, setWelcomeMessage] = useState(portal.welcome_message ?? "");
  const [accentColor, setAccentColor] = useState(portal.accent_color ?? "#C5A47E");

  const handleSave = () => {
    onUpdate({
      studio_name: studioName.trim() || null,
      welcome_message: welcomeMessage.trim() || null,
      accent_color: accentColor,
    });
  };

  const fieldClass = "bg-transparent border-0 border-b border-border rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary font-body";

  return (
    <div>
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">
            Portal — {portal.clients?.name}
          </h1>
          <p className="text-xs text-muted-foreground font-body mt-1">/portal/{portal.slug}</p>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-card border-border">
            <AlertDialogHeader>
              <AlertDialogTitle className="font-display">Delete portal?</AlertDialogTitle>
              <AlertDialogDescription className="font-body text-muted-foreground">
                This will permanently delete this client portal.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="font-body">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground font-body">Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Live Preview */}
      <div className="mb-8 rounded-lg border border-border overflow-hidden">
        <div className="h-1.5" style={{ backgroundColor: accentColor }} />
        <div className="bg-card p-6">
          <p className="text-[10px] uppercase tracking-[0.2em] font-body" style={{ color: accentColor }}>
            {studioName}
          </p>
          <h2 className="text-lg font-display font-bold text-foreground mt-1">
            {portal.clients?.name}
          </h2>
          <p className="text-sm text-muted-foreground font-body mt-2">{welcomeMessage}</p>
        </div>
      </div>

      <div className="space-y-5">
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
            <Input value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className={`flex-1 ${fieldClass}`} maxLength={7} />
          </div>
        </div>

        <div className="pt-4">
          <Button variant="accent" className="gap-2" onClick={handleSave} disabled={isUpdating}>
            <Save className="h-4 w-4" /> {isUpdating ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}
