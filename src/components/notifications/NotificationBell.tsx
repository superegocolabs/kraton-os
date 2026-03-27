import { useState, useEffect } from "react";
import { Bell, CheckCircle2, XCircle, Users, Crown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useUserRole } from "@/hooks/useUserRole";
import { useMembership } from "@/hooks/useMembership";
import { toast } from "sonner";

interface Notification {
  id: string;
  message: string;
  title: string;
  time: string;
  type: string;
  is_read: boolean;
  metadata?: any;
}

export function NotificationBell({ userId }: { userId?: string }) {
  const { data: role } = useUserRole(userId);
  const { isMember } = useMembership(userId);
  const queryClient = useQueryClient();

  // Admin notifications (payment proofs)
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

  // User notifications (board invitations etc)
  const { data: userNotifications } = useQuery({
    queryKey: ["user-notifications", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_notifications")
        .select("*")
        .eq("is_read", false)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!userId,
  });

  // Board invitations for current user
  const { data: pendingInvitations } = useQuery({
    queryKey: ["my-board-invitations", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("board_invitations")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!userId,
  });

  // Get board titles for invitations
  const { data: inviteBoards } = useQuery({
    queryKey: ["invite-boards", pendingInvitations?.map(i => i.board_id)],
    queryFn: async () => {
      if (!pendingInvitations?.length) return [];
      const boardIds = [...new Set(pendingInvitations.map(i => i.board_id))];
      const { data, error } = await supabase
        .from("boards")
        .select("id, title")
        .in("id", boardIds);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!pendingInvitations?.length,
  });

  const acceptInvite = useMutation({
    mutationFn: async (invite: any) => {
      // Check membership
      if (!isMember) {
        throw new Error("Kamu perlu membership aktif untuk menerima undangan board.");
      }

      // Update invitation status
      const { error: updateErr } = await supabase
        .from("board_invitations")
        .update({ status: "accepted", responded_at: new Date().toISOString() })
        .eq("id", invite.id);
      if (updateErr) throw updateErr;

      // Add as board member
      const { error: memberErr } = await supabase
        .from("board_members")
        .insert({ board_id: invite.board_id, user_id: userId!, role: "editor" });
      if (memberErr) throw memberErr;

      // Notify board owner
      await supabase.from("user_notifications").insert({
        user_id: invite.invited_by,
        type: "invite_accepted",
        title: "Undangan Diterima",
        message: `Undanganmu ke board telah diterima!`,
        metadata: { board_id: invite.board_id, invitation_id: invite.id },
      });

      // Mark related notifications as read
      await supabase
        .from("user_notifications")
        .update({ is_read: true })
        .eq("type", "board_invite")
        .eq("user_id", userId!);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-board-invitations"] });
      queryClient.invalidateQueries({ queryKey: ["user-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["boards"] });
      queryClient.invalidateQueries({ queryKey: ["board-members"] });
      toast.success("Undangan diterima! Kamu sekarang bisa mengakses board ini.");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const rejectInvite = useMutation({
    mutationFn: async (invite: any) => {
      const { error } = await supabase
        .from("board_invitations")
        .update({ status: "rejected", responded_at: new Date().toISOString() })
        .eq("id", invite.id);
      if (error) throw error;

      // Notify board owner
      await supabase.from("user_notifications").insert({
        user_id: invite.invited_by,
        type: "invite_rejected",
        title: "Undangan Ditolak",
        message: `Undanganmu ke board telah ditolak.`,
        metadata: { board_id: invite.board_id, invitation_id: invite.id },
      });

      // Mark related notifications as read
      await supabase
        .from("user_notifications")
        .update({ is_read: true })
        .eq("type", "board_invite")
        .eq("user_id", userId!);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-board-invitations"] });
      queryClient.invalidateQueries({ queryKey: ["user-notifications"] });
      toast.success("Undangan ditolak.");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("user_notifications")
        .update({ is_read: true })
        .eq("user_id", userId!)
        .eq("is_read", false);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-notifications"] });
    },
  });

  // Realtime
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel("user-notifications-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "user_notifications", filter: `user_id=eq.${userId}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["user-notifications", userId] });
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "board_invitations", filter: `invited_user_id=eq.${userId}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["my-board-invitations", userId] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId, queryClient]);

  // Admin realtime
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

  // Combine notifications
  const allNotifications: any[] = [];

  // Admin payment proofs
  if (role === "admin") {
    paymentProofs?.forEach((p) => {
      allNotifications.push({
        id: `inv-${p.id}`,
        title: "Payment Proof",
        message: `Payment proof uploaded for ${p.invoice_number}`,
        time: p.updated_at,
        type: "payment_proof",
        is_read: false,
      });
    });
    membershipProofs?.forEach((m) => {
      allNotifications.push({
        id: `mem-${m.id}`,
        title: "Membership Proof",
        message: `Membership payment proof uploaded`,
        time: m.updated_at,
        type: "membership_proof",
        is_read: false,
      });
    });
  }

  // User notifications
  userNotifications?.forEach((n) => {
    allNotifications.push({
      id: n.id,
      title: n.title,
      message: n.message,
      time: n.created_at,
      type: n.type,
      is_read: n.is_read,
      metadata: n.metadata,
    });
  });

  allNotifications.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  const displayNotifs = allNotifications.slice(0, 20);

  const getBoardTitle = (boardId: string) => inviteBoards?.find(b => b.id === boardId)?.title ?? "Board";

  const count = (pendingInvitations?.length ?? 0) + (role === "admin" ? (paymentProofs?.length ?? 0) + (membershipProofs?.length ?? 0) : 0) + (userNotifications?.filter(n => !n.is_read).length ?? 0);

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
        <div className="p-3 border-b border-border flex items-center justify-between">
          <h4 className="text-xs font-body uppercase tracking-[0.15em] text-muted-foreground">Notifikasi</h4>
          {(userNotifications?.length ?? 0) > 0 && (
            <button onClick={() => markAllRead.mutate()} className="text-[10px] text-primary hover:underline font-body">
              Tandai semua dibaca
            </button>
          )}
        </div>
        <div className="max-h-96 overflow-auto">
          {/* Board Invitations */}
          {pendingInvitations && pendingInvitations.length > 0 && (
            <div>
              {pendingInvitations.map((invite) => (
                <div key={invite.id} className="px-3 py-3 border-b border-border/50 bg-primary/5">
                  <div className="flex items-start gap-2">
                    <Users className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-body font-medium text-foreground">
                        Undangan Board
                      </p>
                      <p className="text-[10px] text-muted-foreground font-body mt-0.5">
                        Kamu diundang ke board "{getBoardTitle(invite.board_id)}"
                      </p>
                      {!isMember && (
                        <div className="flex items-center gap-1 mt-1.5 text-[10px] text-yellow-500 font-body">
                          <Crown className="h-3 w-3" />
                          <span>Butuh membership aktif</span>
                        </div>
                      )}
                      <div className="flex gap-2 mt-2">
                        <Button
                          size="sm"
                          variant="accent"
                          className="h-6 text-[10px] px-2 gap-1"
                          onClick={() => acceptInvite.mutate(invite)}
                          disabled={acceptInvite.isPending || !isMember}
                        >
                          <CheckCircle2 className="h-3 w-3" /> Terima
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 text-[10px] px-2 gap-1"
                          onClick={() => rejectInvite.mutate(invite)}
                          disabled={rejectInvite.isPending}
                        >
                          <XCircle className="h-3 w-3" /> Tolak
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Other notifications */}
          {displayNotifs.length > 0 ? (
            displayNotifs.map((n) => (
              <div key={n.id} className="px-3 py-2.5 border-b border-border/50 hover:bg-muted/30 transition-colors">
                <p className="text-xs font-body font-medium text-foreground">{n.title}</p>
                <p className="text-[10px] text-muted-foreground font-body mt-0.5">{n.message}</p>
                <p className="text-[10px] text-muted-foreground/60 font-body mt-0.5">
                  {new Date(n.time).toLocaleDateString("id-ID", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            ))
          ) : pendingInvitations?.length === 0 ? (
            <div className="p-4 text-center">
              <p className="text-xs text-muted-foreground font-body">Tidak ada notifikasi</p>
            </div>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}
