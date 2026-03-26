import { useState, useRef } from "react";
import { User } from "@supabase/supabase-js";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Save, Settings, Crown, Upload, Image, CreditCard, Check, Send, File, Palette, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useMembership } from "@/hooks/useMembership";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/currency";

interface ProfilePageProps { user: User | null; }

export function ProfilePage({ user }: ProfilePageProps) {
  const queryClient = useQueryClient();
  const { membership, isMember, isLoading: membershipLoading } = useMembership(user?.id);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const proofInputRef = useRef<HTMLInputElement>(null);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: membershipSettings } = useQuery({
    queryKey: ["membership-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("membership_settings").select("*").limit(1).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const [fullName, setFullName] = useState("");
  const [portalPin, setPortalPin] = useState("");
  const [brandName, setBrandName] = useState("");
  const [brandLogoUrl, setBrandLogoUrl] = useState("");
  const [brandColor, setBrandColor] = useState("#C5A47E");
  const [initialized, setInitialized] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [pendingProof, setPendingProof] = useState<File | null>(null);
  const [sendingProof, setSendingProof] = useState(false);

  if (profile && !initialized) {
    setFullName(profile.full_name ?? "");
    setPortalPin((profile as any).portal_pin ?? "");
    setBrandName((profile as any).brand_name ?? "");
    setBrandLogoUrl((profile as any).brand_logo_url ?? "");
    setBrandColor((profile as any).brand_color ?? "#C5A47E");
    setInitialized(true);
  }

  const updateProfile = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("profiles").update({
        full_name: fullName.trim() || null, portal_pin: portalPin.trim() || null,
        brand_name: brandName.trim() || null, brand_logo_url: brandLogoUrl.trim() || null,
        brand_color: brandColor || "#C5A47E",
      } as any).eq("id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["profile"] }); toast.success("Profile updated."); },
    onError: (err: any) => toast.error(err.message),
  });

  const handleLogoUpload = async (file: File) => {
    setUploadingLogo(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `logos/${user!.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("payment-proofs").upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("payment-proofs").getPublicUrl(path);
      setBrandLogoUrl(urlData.publicUrl);
      toast.success("Logo uploaded. Don't forget to save!");
    } catch (err: any) { toast.error("Upload failed: " + err.message); }
    finally { setUploadingLogo(false); }
  };

  const handleSendPaymentProof = async () => {
    if (!pendingProof) return;
    setSendingProof(true);
    try {
      const ext = pendingProof.name.split(".").pop();
      const path = `membership-proofs/${user!.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("payment-proofs").upload(path, pendingProof, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("payment-proofs").getPublicUrl(path);

      // Upsert membership with proof
      const existing = membership;
      if (existing) {
        await supabase.from("memberships").update({ payment_proof_url: urlData.publicUrl, updated_at: new Date().toISOString() } as any).eq("user_id", user!.id);
      } else {
        await supabase.from("memberships").insert({ user_id: user!.id, payment_proof_url: urlData.publicUrl, plan_name: "free", is_active: false } as any);
      }

      toast.success("Payment proof submitted! Admin will verify and activate your membership.");
      setPendingProof(null);
      queryClient.invalidateQueries({ queryKey: ["membership"] });
    } catch (err: any) { toast.error("Upload failed: " + err.message); }
    finally { setSendingProof(false); }
  };

  const fieldClass = "bg-transparent border-0 border-b border-border rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary font-body";
  const ms = membershipSettings as any;
  const features: string[] = ms?.features && Array.isArray(ms.features) ? ms.features : [];

  if (isLoading) {
    return <div className="p-6 flex items-center justify-center"><div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        <h1 className="text-xl md:text-2xl font-display font-bold text-foreground">Profile</h1>
        <p className="text-sm text-muted-foreground font-body mt-1">Manage your account settings.</p>

        <Tabs defaultValue="settings" className="mt-6">
          <TabsList className="bg-card border border-border w-full sm:w-auto">
            <TabsTrigger value="settings" className="gap-1.5 font-body text-sm"><Settings className="h-3.5 w-3.5" /> Settings</TabsTrigger>
            <TabsTrigger value="membership" className="gap-1.5 font-body text-sm"><Crown className="h-3.5 w-3.5" /> Membership</TabsTrigger>
          </TabsList>

          <TabsContent value="settings" className="mt-6">
            <div className="bg-card border border-border rounded-lg p-4 md:p-6 space-y-5">
              <div>
                <label className="text-xs font-body font-medium text-muted-foreground uppercase tracking-wider">Email</label>
                <p className="mt-1.5 text-sm text-foreground font-body">{user?.email}</p>
              </div>
              <div>
                <label className="text-xs font-body font-medium text-muted-foreground uppercase tracking-wider">Full Name</label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className={`mt-1.5 ${fieldClass}`} placeholder="Your name" maxLength={100} />
              </div>
              <div>
                <label className="text-xs font-body font-medium text-muted-foreground uppercase tracking-wider">Portal PIN</label>
                <p className="text-[10px] text-muted-foreground font-body mt-0.5 mb-1">Set a PIN to protect your client portals.</p>
                <Input value={portalPin} onChange={(e) => setPortalPin(e.target.value.replace(/\D/g, "").slice(0, 6))} className={`mt-1 ${fieldClass} max-w-[200px]`} placeholder="e.g. 1234" maxLength={6} inputMode="numeric" />
              </div>
              <div className="border-t border-border pt-5">
                <h3 className="text-sm font-display font-bold text-foreground mb-4">Brand Personalization</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-body font-medium text-muted-foreground uppercase tracking-wider">Brand Name</label>
                    <Input value={brandName} onChange={(e) => setBrandName(e.target.value)} className={`mt-1.5 ${fieldClass}`} placeholder="Your studio/brand name" maxLength={100} />
                  </div>
                  <div>
                    <label className="text-xs font-body font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Brand Logo</label>
                    <div className="flex items-center gap-4">
                      {brandLogoUrl ? (
                        <div className="w-16 h-16 rounded-lg border border-border bg-background flex items-center justify-center overflow-hidden">
                          <img src={brandLogoUrl} alt="Brand logo" className="w-full h-full object-contain" />
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-lg border border-dashed border-border bg-background flex items-center justify-center">
                          <Image className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <Button variant="outline" size="sm" className="gap-1.5 text-xs font-body" onClick={() => logoInputRef.current?.click()} disabled={uploadingLogo}>
                          <Upload className="h-3 w-3" /> {uploadingLogo ? "Uploading..." : "Upload Logo"}
                        </Button>
                        <p className="text-[10px] text-muted-foreground font-body mt-1">Will appear on invoices viewed by clients.</p>
                      </div>
                    </div>
                    <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleLogoUpload(file); e.target.value = ""; }} />
                  </div>
                  <div>
                    <label className="text-xs font-body font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
                      <Palette className="h-3 w-3 inline mr-1" />Brand Theme
                    </label>
                    <p className="text-[10px] text-muted-foreground font-body mb-3">Choose a theme for your client portals and invoices.</p>
                    
                    <div className="grid grid-cols-2 gap-2.5">
                      {BRAND_THEMES.map((theme) => (
                        <button
                          key={theme.name}
                          onClick={() => setBrandColor(theme.primary)}
                          className={`group relative p-3 rounded-lg border-2 transition-all text-left ${
                            brandColor === theme.primary
                              ? "border-foreground bg-muted/50"
                              : "border-border hover:border-muted-foreground bg-card"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex -space-x-1">
                              {theme.colors.map((c, i) => (
                                <div
                                  key={i}
                                  className="w-4 h-4 rounded-full border border-background"
                                  style={{ backgroundColor: c }}
                                />
                              ))}
                            </div>
                            {brandColor === theme.primary && (
                              <Check className="h-3 w-3 text-primary ml-auto" />
                            )}
                          </div>
                          <p className="text-xs font-display font-bold text-foreground">{theme.name}</p>
                          <p className="text-[10px] text-muted-foreground font-body">{theme.description}</p>
                        </button>
                      ))}
                    </div>

                    <div className="mt-3 p-3 rounded-lg border border-border" style={{ borderColor: brandColor + "40" }}>
                      <p className="text-[10px] text-muted-foreground font-body uppercase tracking-wider mb-1">Preview</p>
                      <div className="flex items-center gap-2">
                        {brandLogoUrl && <img src={brandLogoUrl} alt="" className="h-6 object-contain" />}
                        <span className="text-sm font-display font-bold" style={{ color: brandColor }}>{brandName || "Your Brand"}</span>
                      </div>
                      <div className="flex gap-1.5 mt-2">
                        <div className="h-1.5 flex-1 rounded-full" style={{ backgroundColor: brandColor }} />
                        <div className="h-1.5 flex-1 rounded-full" style={{ backgroundColor: brandColor, opacity: 0.5 }} />
                        <div className="h-1.5 flex-1 rounded-full" style={{ backgroundColor: brandColor, opacity: 0.2 }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="pt-3">
                <Button variant="accent" className="gap-2" onClick={() => updateProfile.mutate()} disabled={updateProfile.isPending}>
                  <Save className="h-4 w-4" /> {updateProfile.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="membership" className="mt-6">
            <div className="bg-card border border-border rounded-lg p-4 md:p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isMember ? "bg-primary/20" : "bg-muted"}`}>
                  <Crown className={`h-5 w-5 ${isMember ? "text-primary" : "text-muted-foreground"}`} />
                </div>
                <div>
                  <h3 className="font-display font-bold text-foreground">{isMember ? membership?.plan_name ?? "Premium" : "Free Plan"}</h3>
                  <p className="text-xs text-muted-foreground font-body">{isMember ? "Active membership" : "Limited features"}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm font-body">
                  <span className="text-muted-foreground">Status</span>
                  <span className={isMember ? "text-green-400" : "text-muted-foreground"}>{isMember ? "Active" : "Free"}</span>
                </div>
                {membership?.granted_at && (
                  <div className="flex justify-between text-sm font-body">
                    <span className="text-muted-foreground">Granted</span>
                    <span className="text-foreground">{new Date(membership.granted_at).toLocaleDateString()}</span>
                  </div>
                )}
                {membership?.expires_at && (
                  <div className="flex justify-between text-sm font-body">
                    <span className="text-muted-foreground">Expires</span>
                    <span className="text-foreground">{new Date(membership.expires_at).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              {!isMember && (
                <div className="mt-6 p-4 bg-muted rounded-lg space-y-4">
                  <div>
                    <h4 className="text-sm font-display font-bold text-foreground mb-1">
                      Upgrade to {ms?.plan_name ?? "Pro"}
                    </h4>
                    {ms?.price_label && (
                      <p className="text-lg font-display font-bold text-primary">{ms.price_label}</p>
                    )}
                    <p className="text-xs text-muted-foreground font-body mt-1">{ms?.description ?? "Full access to all features."}</p>
                  </div>

                  {features.length > 0 && (
                    <div className="space-y-1.5">
                      {features.map((f: string, i: number) => (
                        <div key={i} className="flex items-center gap-2 text-xs font-body text-foreground">
                          <Check className="h-3 w-3 text-primary shrink-0" />
                          <span>{f}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Team Plan */}
                  <div className="bg-background border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-primary" />
                        <span className="text-sm font-display font-bold text-foreground">Team Plan</span>
                      </div>
                      <span className="text-[10px] font-body text-primary bg-primary/10 px-2 py-0.5 rounded-full">20% off</span>
                    </div>
                    <div className="space-y-1 text-xs text-muted-foreground font-body">
                      <p>Add team members to your boards (min 2, max 10 per board).</p>
                      {ms?.price && (
                        <p className="text-primary font-medium">
                          {formatCurrency(Math.round(Number(ms.price) * 6 * 0.8))} per member / 6 months
                        </p>
                      )}
                      <p>Need more than 10? Contact admin.</p>
                    </div>
                  </div>
                  <div className="bg-background border border-border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <CreditCard className="h-4 w-4 text-primary" />
                      <span className="text-sm font-display font-bold text-foreground">Pay via QRIS</span>
                    </div>

                    {ms?.qris_image_url ? (
                      <div className="bg-card border border-border rounded-lg p-4 flex items-center justify-center mb-3">
                        <img src={ms.qris_image_url} alt="QRIS Code" className="w-40 h-40 object-contain" />
                      </div>
                    ) : (
                      <div className="bg-card border border-border rounded-lg p-6 flex items-center justify-center mb-3">
                        <div className="text-center">
                          <div className="w-32 h-32 bg-muted rounded-lg mx-auto mb-2 flex items-center justify-center">
                            <span className="text-[10px] text-muted-foreground font-body uppercase tracking-wider">QRIS Code</span>
                          </div>
                          <p className="text-[10px] text-muted-foreground font-body">Scan to pay</p>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2 text-xs text-muted-foreground font-body">
                      <p>1. Scan the QRIS code above using your e-wallet or mobile banking</p>
                      <p>2. After payment, screenshot the payment proof</p>
                      <p>3. Upload the proof below for admin verification</p>
                      <p>4. Admin will activate your membership</p>
                    </div>
                  </div>

                  {/* Payment proof upload */}
                  <div className="space-y-3">
                    <Button variant="outline" className="w-full gap-2 text-sm font-body" onClick={() => proofInputRef.current?.click()}>
                      <Upload className="h-4 w-4" /> Upload Payment Proof
                    </Button>
                    <input ref={proofInputRef} type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) setPendingProof(file); e.target.value = ""; }} />

                    {pendingProof && (
                      <div className="p-3 bg-background border border-border rounded-md">
                        <div className="flex items-center gap-2 text-sm text-foreground">
                          <File className="h-4 w-4 shrink-0 text-primary" />
                          <span className="truncate flex-1">{pendingProof.name}</span>
                          <span className="text-xs text-muted-foreground shrink-0">{(pendingProof.size / 1024).toFixed(0)} KB</span>
                        </div>
                        <div className="flex gap-2 mt-2">
                          <Button size="sm" variant="accent" className="flex-1 gap-1.5 text-xs" onClick={handleSendPaymentProof} disabled={sendingProof}>
                            <Send className="h-3.5 w-3.5" /> {sendingProof ? "Sending..." : "Submit Proof"}
                          </Button>
                          <Button size="sm" variant="outline" className="text-xs" onClick={() => setPendingProof(null)} disabled={sendingProof}>Cancel</Button>
                        </div>
                      </div>
                    )}
                  </div>

                  <p className="text-[10px] text-muted-foreground font-body text-center">Contact admin if you have any issues with the payment process.</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
