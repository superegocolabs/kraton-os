import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { motion } from "framer-motion";
import { Settings, Save, Upload, Image, ToggleLeft, ToggleRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

interface AdminSettingsPageProps {
  user: User | null;
}

export function AdminSettingsPage({ user }: AdminSettingsPageProps) {
  const queryClient = useQueryClient();
  const qrisInputRef = useRef<HTMLInputElement>(null);

  // Membership settings
  const { data: membershipSettings, isLoading: msLoading } = useQuery({
    queryKey: ["admin", "membership-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("membership_settings").select("*").limit(1).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // Feature flags
  const { data: featureFlags } = useQuery({
    queryKey: ["admin", "feature-flags"],
    queryFn: async () => {
      const { data, error } = await supabase.from("app_settings").select("*");
      if (error) throw error;
      return data;
    },
  });

  const [planName, setPlanName] = useState("");
  const [price, setPrice] = useState("");
  const [priceLabel, setPriceLabel] = useState("");
  const [description, setDescription] = useState("");
  const [features, setFeatures] = useState("");
  const [qrisUrl, setQrisUrl] = useState("");
  const [initialized, setInitialized] = useState(false);
  const [uploadingQris, setUploadingQris] = useState(false);

  if (membershipSettings && !initialized) {
    setPlanName((membershipSettings as any).plan_name ?? "");
    setPrice(String((membershipSettings as any).price ?? ""));
    setPriceLabel((membershipSettings as any).price_label ?? "");
    setDescription((membershipSettings as any).description ?? "");
    const feats = (membershipSettings as any).features;
    setFeatures(Array.isArray(feats) ? feats.join("\n") : "");
    setQrisUrl((membershipSettings as any).qris_image_url ?? "");
    setInitialized(true);
  }

  const updateSettings = useMutation({
    mutationFn: async () => {
      const featuresArray = features.split("\n").map(f => f.trim()).filter(Boolean);
      const { error } = await supabase.from("membership_settings").update({
        plan_name: planName, price: Number(price) || 0, price_label: priceLabel,
        description, features: featuresArray, qris_image_url: qrisUrl || null,
        updated_at: new Date().toISOString(), updated_by: user!.id,
      } as any).eq("id", (membershipSettings as any).id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "membership-settings"] });
      queryClient.invalidateQueries({ queryKey: ["membership-settings"] });
      toast.success("Membership settings saved.");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const toggleFeatureFlag = useMutation({
    mutationFn: async ({ key, enabled }: { key: string; enabled: boolean }) => {
      const flag = featureFlags?.find(f => (f as any).key === key);
      if (!flag) return;
      const val = { ...((flag as any).value as any), enabled };
      const { error } = await supabase.from("app_settings").update({ value: val, updated_at: new Date().toISOString() } as any).eq("id", flag.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "feature-flags"] });
      queryClient.invalidateQueries({ queryKey: ["app-settings"] });
      toast.success("Feature flag updated.");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const handleQrisUpload = async (file: File) => {
    setUploadingQris(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `qris/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("payment-proofs").upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("payment-proofs").getPublicUrl(path);
      setQrisUrl(urlData.publicUrl);
      toast.success("QRIS image uploaded. Don't forget to save!");
    } catch (err: any) {
      toast.error("Upload failed: " + err.message);
    } finally {
      setUploadingQris(false);
    }
  };

  const fieldClass = "bg-transparent border-border font-body";
  const slideshowFlag = featureFlags?.find(f => (f as any).key === "feature_slideshow");
  const slideshowEnabled = slideshowFlag ? ((slideshowFlag as any).value as any)?.enabled === true : false;

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        <div className="flex items-center gap-3 mb-6">
          <Settings className="h-5 w-5 text-muted-foreground" />
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Platform Settings</h1>
            <p className="text-sm text-muted-foreground font-body mt-1">Configure membership plans and feature access.</p>
          </div>
        </div>

        {/* Membership CMS */}
        <div className="bg-card border border-border rounded-lg p-4 md:p-6 space-y-5">
          <h2 className="text-sm font-display font-bold text-foreground uppercase tracking-wider">Membership Plan</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-body font-medium text-muted-foreground uppercase tracking-wider">Plan Name</label>
              <Input value={planName} onChange={(e) => setPlanName(e.target.value)} className={`mt-1.5 ${fieldClass}`} placeholder="e.g. Pro" />
            </div>
            <div>
              <label className="text-xs font-body font-medium text-muted-foreground uppercase tracking-wider">Price (number)</label>
              <Input value={price} onChange={(e) => setPrice(e.target.value)} className={`mt-1.5 ${fieldClass}`} placeholder="149000" type="number" />
            </div>
          </div>

          <div>
            <label className="text-xs font-body font-medium text-muted-foreground uppercase tracking-wider">Price Label (shown to users)</label>
            <Input value={priceLabel} onChange={(e) => setPriceLabel(e.target.value)} className={`mt-1.5 ${fieldClass}`} placeholder="Rp 149.000 / month" />
          </div>

          <div>
            <label className="text-xs font-body font-medium text-muted-foreground uppercase tracking-wider">Description</label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className={`mt-1.5 ${fieldClass} min-h-[60px]`} placeholder="Full access to all features..." />
          </div>

          <div>
            <label className="text-xs font-body font-medium text-muted-foreground uppercase tracking-wider">Features (one per line)</label>
            <Textarea value={features} onChange={(e) => setFeatures(e.target.value)} className={`mt-1.5 ${fieldClass} min-h-[100px]`} placeholder={"Unlimited Projects\nUnlimited Clients\nPriority Support"} />
          </div>

          <div>
            <label className="text-xs font-body font-medium text-muted-foreground uppercase tracking-wider mb-2 block">QRIS Payment Code</label>
            <div className="flex items-center gap-4">
              {qrisUrl ? (
                <div className="w-32 h-32 rounded-lg border border-border bg-background flex items-center justify-center overflow-hidden">
                  <img src={qrisUrl} alt="QRIS" className="w-full h-full object-contain" />
                </div>
              ) : (
                <div className="w-32 h-32 rounded-lg border border-dashed border-border bg-background flex items-center justify-center">
                  <Image className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              <div>
                <Button variant="outline" size="sm" className="gap-1.5 text-xs font-body" onClick={() => qrisInputRef.current?.click()} disabled={uploadingQris}>
                  <Upload className="h-3 w-3" /> {uploadingQris ? "Uploading..." : "Upload QRIS Image"}
                </Button>
                <p className="text-[10px] text-muted-foreground font-body mt-1">This will be shown to users on the membership page.</p>
              </div>
            </div>
            <input ref={qrisInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleQrisUpload(file); e.target.value = ""; }} />
          </div>

          <Button variant="accent" className="gap-2" onClick={() => updateSettings.mutate()} disabled={updateSettings.isPending || !membershipSettings}>
            <Save className="h-4 w-4" /> {updateSettings.isPending ? "Saving..." : "Save Settings"}
          </Button>
        </div>

        {/* Feature Flags */}
        <div className="bg-card border border-border rounded-lg p-4 md:p-6 mt-6">
          <h2 className="text-sm font-display font-bold text-foreground uppercase tracking-wider mb-4">Feature Flags</h2>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <p className="text-sm font-body font-medium text-foreground">Slideshow</p>
                <p className="text-xs text-muted-foreground font-body">Presentation builder for client pitches</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-body ${slideshowEnabled ? "text-green-400" : "text-muted-foreground"}`}>
                  {slideshowEnabled ? "Enabled" : "Disabled"}
                </span>
                <Switch
                  checked={slideshowEnabled}
                  onCheckedChange={(checked) => toggleFeatureFlag.mutate({ key: "feature_slideshow", enabled: checked })}
                  disabled={toggleFeatureFlag.isPending}
                />
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
