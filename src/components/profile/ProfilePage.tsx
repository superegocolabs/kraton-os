import { useState } from "react";
import { User } from "@supabase/supabase-js";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Save, User as UserIcon, Settings, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useMembership } from "@/hooks/useMembership";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ProfilePageProps {
  user: User | null;
}

export function ProfilePage({ user }: ProfilePageProps) {
  const queryClient = useQueryClient();
  const { membership, isMember, isLoading: membershipLoading } = useMembership(user?.id);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const [fullName, setFullName] = useState("");
  const [portalPin, setPortalPin] = useState("");
  const [initialized, setInitialized] = useState(false);

  if (profile && !initialized) {
    setFullName(profile.full_name ?? "");
    setPortalPin((profile as any).portal_pin ?? "");
    setInitialized(true);
  }

  const updateProfile = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim() || null,
          portal_pin: portalPin.trim() || null,
        } as any)
        .eq("id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Profile updated.");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const fieldClass =
    "bg-transparent border-0 border-b border-border rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary font-body";

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        <h1 className="text-2xl font-display font-bold text-foreground">Profile</h1>
        <p className="text-sm text-muted-foreground font-body mt-1">Manage your account settings.</p>

        <Tabs defaultValue="settings" className="mt-6">
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="settings" className="gap-1.5 font-body text-sm">
              <Settings className="h-3.5 w-3.5" /> Settings
            </TabsTrigger>
            <TabsTrigger value="membership" className="gap-1.5 font-body text-sm">
              <Crown className="h-3.5 w-3.5" /> Membership
            </TabsTrigger>
          </TabsList>

          <TabsContent value="settings" className="mt-6">
            <div className="bg-card border border-border rounded-lg p-6 space-y-5">
              <div>
                <label className="text-xs font-body font-medium text-muted-foreground uppercase tracking-wider">
                  Email
                </label>
                <p className="mt-1.5 text-sm text-foreground font-body">{user?.email}</p>
              </div>

              <div>
                <label className="text-xs font-body font-medium text-muted-foreground uppercase tracking-wider">
                  Full Name
                </label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={`mt-1.5 ${fieldClass}`}
                  placeholder="Your name"
                  maxLength={100}
                />
              </div>

              <div>
                <label className="text-xs font-body font-medium text-muted-foreground uppercase tracking-wider">
                  Portal PIN
                </label>
                <p className="text-[10px] text-muted-foreground font-body mt-0.5 mb-1">
                  Set a PIN to protect your client portals. Clients will need this PIN to access the portal.
                </p>
                <Input
                  value={portalPin}
                  onChange={(e) => setPortalPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className={`mt-1 ${fieldClass} max-w-[200px]`}
                  placeholder="e.g. 1234"
                  maxLength={6}
                  inputMode="numeric"
                />
              </div>

              <div className="pt-3">
                <Button
                  variant="accent"
                  className="gap-2"
                  onClick={() => updateProfile.mutate()}
                  disabled={updateProfile.isPending}
                >
                  <Save className="h-4 w-4" /> {updateProfile.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="membership" className="mt-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isMember ? "bg-primary/20" : "bg-muted"}`}>
                  <Crown className={`h-5 w-5 ${isMember ? "text-primary" : "text-muted-foreground"}`} />
                </div>
                <div>
                  <h3 className="font-display font-bold text-foreground">
                    {isMember ? membership?.plan_name ?? "Premium" : "Free Plan"}
                  </h3>
                  <p className="text-xs text-muted-foreground font-body">
                    {isMember ? "Active membership" : "Limited features"}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm font-body">
                  <span className="text-muted-foreground">Status</span>
                  <span className={isMember ? "text-green-400" : "text-muted-foreground"}>
                    {isMember ? "Active" : "Free"}
                  </span>
                </div>
                {membership?.granted_at && (
                  <div className="flex justify-between text-sm font-body">
                    <span className="text-muted-foreground">Granted</span>
                    <span className="text-foreground">
                      {new Date(membership.granted_at).toLocaleDateString("id-ID")}
                    </span>
                  </div>
                )}
                {membership?.expires_at && (
                  <div className="flex justify-between text-sm font-body">
                    <span className="text-muted-foreground">Expires</span>
                    <span className="text-foreground">
                      {new Date(membership.expires_at).toLocaleDateString("id-ID")}
                    </span>
                  </div>
                )}
              </div>

              {!isMember && (
                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground font-body">
                    Hubungi admin untuk upgrade membership. Anda akan mendapatkan akses penuh
                    ke semua fitur tanpa batasan.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
