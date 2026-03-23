import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useUserRole } from "@/hooks/useUserRole";

interface Notification {
  id: string;
  message: string;
  time: string;
  type: "payment_proof" | "membership_proof";
}

export function NotificationBell({ userId }: { userId?: string }) {
  const { data: role } = useUserRole(userId);
  const queryClient = useQueryClient();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Fetch initial unread payment proofs (invoices with proof but not yet paid)
  const { data: paymentProofs } = useQuery({
    queryKey: ["admin-notifications-invoices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("id, invoice_number, payment_proof_url, updated_at")
        .not("payment_proof_url", "is", null)
        .neq("status", "paid")
        .order("updated_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data ?? [];
    },
    enabled: role === "admin",
  });

  // Fetch membership payment proofs pending approval
  const { data: membershipProofs } = useQuery({
    queryKey: ["admin-notifications-memberships"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("memberships")
        .select("id, user_id, payment_proof_url, updated_at")
        .not("payment_proof_url", "is", null)
        .eq("is_active", false)
        .order("updated_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data ?? [];
    },
    enabled: role === "admin",
  });

  useEffect(() => {
    if (role !== "admin") return;

    const items: Notification[] = [];
    paymentProofs?.forEach((p) => {
      items.push({
        id: `inv-${p.id}`,
        message: `Payment proof uploaded for ${p.invoice_number}`,
        time: p.updated_at,
        type: "payment_proof",
      });
    });
    membershipProofs?.forEach((m) => {
      items.push({
        id: `mem-${m.id}`,
        message: `Membership payment proof uploaded`,
        time: m.updated_at,
        type: "membership_proof",
      });
    });
    items.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    setNotifications(items.slice(0, 15));
  }, [paymentProofs, membershipProofs, role]);

  // Realtime subscription for new payment proofs
  useEffect(() => {
    if (role !== "admin") return;

    const channel = supabase
      .channel("admin-notifications")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "invoices" }, (payload) => {
        if (payload.new.payment_proof_url && !payload.old.payment_proof_url) {
          queryClient.invalidateQueries({ queryKey: ["admin-notifications-invoices"] });
        }
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "memberships" }, (payload) => {
        if (payload.new.payment_proof_url && !payload.old.payment_proof_url) {
          queryClient.invalidateQueries({ queryKey: ["admin-notifications-memberships"] });
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [role, queryClient]);

  if (role !== "admin") return null;

  const count = notifications.length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-8 w-8 text-muted-foreground hover:text-foreground">
          <Bell className="h-4 w-4" />
          {count > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] px-1 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center">
              {count > 9 ? "9+" : count}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 bg-card border-border" align="end">
        <div className="p-3 border-b border-border">
          <h4 className="text-xs font-body uppercase tracking-[0.15em] text-muted-foreground">Notifications</h4>
        </div>
        <div className="max-h-80 overflow-auto">
          {notifications.length > 0 ? (
            notifications.map((n) => (
              <div key={n.id} className="px-3 py-2.5 border-b border-border/50 hover:bg-muted/30 transition-colors">
                <p className="text-xs font-body text-foreground">{n.message}</p>
                <p className="text-[10px] text-muted-foreground font-body mt-0.5">
                  {new Date(n.time).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            ))
          ) : (
            <div className="p-4 text-center">
              <p className="text-xs text-muted-foreground font-body">No notifications</p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
