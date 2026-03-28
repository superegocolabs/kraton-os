import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Users, Plus, X, Search, UserCheck, Send, Clock, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface BoardTeamManagerProps {
  boardId: string;
  boardTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BoardTeamManager({ boardId, boardTitle, open, onOpenChange }: BoardTeamManagerProps) {
  const [searchEmail, setSearchEmail] = useState("");
  const [removingId, setRemovingId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Current user
  const { data: currentUser } = useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data.user;
    },
  });

  // Get current board members
  const { data: members, isLoading } = useQuery({
    queryKey: ["board-members", boardId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("board_members")
        .select("*")
        .eq("board_id", boardId)
        .order("added_at");
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  // Get profiles for members
  const { data: memberProfiles } = useQuery({
    queryKey: ["board-member-profiles", members?.map(m => m.user_id)],
    queryFn: async () => {
      if (!members?.length) return [];
      const userIds = members.map(m => m.user_id);
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds);
      if (error) throw error;
      return data;
    },
    enabled: !!members?.length,
  });

  // Get pending invitations
  const { data: pendingInvites } = useQuery({
    queryKey: ["board-invitations", boardId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("board_invitations")
        .select("*")
        .eq("board_id", boardId)
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  // Get profiles for pending invites
  const { data: inviteProfiles } = useQuery({
    queryKey: ["board-invite-profiles", pendingInvites?.map(i => i.invited_user_id)],
    queryFn: async () => {
      if (!pendingInvites?.length) return [];
      const userIds = pendingInvites.map(i => i.invited_user_id);
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds);
      if (error) throw error;
      return data;
    },
    enabled: !!pendingInvites?.length,
  });

  // Search for users by email using security definer function
  const { data: searchResults } = useQuery({
    queryKey: ["search-members", searchEmail],
    queryFn: async () => {
      if (!searchEmail || searchEmail.length < 3) return [];
      const { data, error } = await supabase
        .rpc("search_profiles_by_email", { _email: searchEmail });
      if (error) throw error;
      const memberIds = members?.map(m => m.user_id) ?? [];
      const pendingIds = pendingInvites?.map(i => i.invited_user_id) ?? [];
      const excludeIds = [...memberIds, ...(currentUser?.id ? [currentUser.id] : [])];
      return (data ?? []).filter((p: any) => !excludeIds.includes(p.id) && !pendingIds.includes(p.id));
    },
    enabled: searchEmail.length >= 3 && open,
  });

  const sendInvite = useMutation({
    mutationFn: async (userId: string) => {
      // Check membership
      const { data: membership } = await supabase
        .from("memberships")
        .select("is_active, expires_at")
        .eq("user_id", userId)
        .maybeSingle();

      const isActive = membership?.is_active &&
        (!membership.expires_at || new Date(membership.expires_at) > new Date());

      // Check max members
      const totalMembers = (members?.length ?? 0) + (pendingInvites?.length ?? 0);
      if (totalMembers >= 10) {
        throw new Error("Maksimum 10 anggota per board. Hubungi admin untuk tim lebih besar.");
      }

      // Create invitation
      const { error } = await supabase
        .from("board_invitations")
        .insert({
          board_id: boardId,
          invited_by: currentUser!.id,
          invited_user_id: userId,
          status: "pending",
        });
      if (error) throw error;

      // Send notification to invited user
      const notifTitle = isActive ? "Board Invitation" : "Board Invitation (Membership Required)";
      const notifMessage = isActive
        ? `Kamu diundang ke board "${boardTitle}". Terima untuk mulai berkolaborasi!`
        : `Kamu diundang ke board "${boardTitle}", tapi kamu perlu membership aktif untuk bergabung.`;

      await supabase.from("user_notifications").insert({
        user_id: userId,
        type: "board_invite",
        title: notifTitle,
        message: notifMessage,
        metadata: { board_id: boardId, invitation_type: "board_invite" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["board-invitations", boardId] });
      setSearchEmail("");
      toast.success("Undangan terkirim!");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const cancelInvite = useMutation({
    mutationFn: async (inviteId: string) => {
      const { error } = await supabase
        .from("board_invitations")
        .delete()
        .eq("id", inviteId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["board-invitations", boardId] });
      toast.success("Undangan dibatalkan.");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const removeMember = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase
        .from("board_members")
        .delete()
        .eq("id", memberId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["board-members", boardId] });
      setRemovingId(null);
      toast.success("Anggota dihapus.");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const getProfile = (userId: string) => memberProfiles?.find(p => p.id === userId);
  const getInviteProfile = (userId: string) => inviteProfiles?.find(p => p.id === userId);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" /> Share Board
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Search & Invite */}
            <div>
              <label className="text-xs font-body font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
                Undang via Email
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  placeholder="Cari email user..."
                  className="pl-9 bg-transparent border-border font-body text-sm"
                />
              </div>
              <p className="text-[10px] text-muted-foreground font-body mt-1">
                User akan menerima notifikasi undangan. Member aktif bisa langsung accept. (max 10)
              </p>

              {/* Search results */}
              {searchResults && searchResults.length > 0 && (
                <div className="mt-2 border border-border rounded-md overflow-hidden">
                  {searchResults.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-2.5 hover:bg-muted/50 transition-colors">
                      <div className="min-w-0">
                        <p className="text-sm font-body font-medium text-foreground truncate">
                          {user.full_name || "No Name"}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-body truncate">{user.email}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="accent"
                        className="gap-1 text-xs shrink-0"
                        onClick={() => sendInvite.mutate(user.id)}
                        disabled={sendInvite.isPending}
                      >
                        <Send className="h-3 w-3" /> Undang
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {searchEmail.length >= 3 && searchResults?.length === 0 && (
                <p className="text-xs text-muted-foreground font-body mt-2">User tidak ditemukan.</p>
              )}
            </div>

            {/* Pending Invitations */}
            {pendingInvites && pendingInvites.length > 0 && (
              <div>
                <label className="text-xs font-body font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
                  Menunggu Respon ({pendingInvites.length})
                </label>
                <div className="space-y-1.5">
                  {pendingInvites.map((invite) => {
                    const profile = getInviteProfile(invite.invited_user_id);
                    return (
                      <div key={invite.id} className="flex items-center justify-between p-2.5 bg-accent/30 border border-accent/40 rounded-md">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-full bg-accent/50 flex items-center justify-center shrink-0">
                            <Clock className="h-3.5 w-3.5 text-accent-foreground" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-body font-medium text-foreground truncate">
                              {profile?.full_name || "No Name"}
                            </p>
                            <p className="text-[10px] text-muted-foreground font-body truncate">{profile?.email}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => cancelInvite.mutate(invite.id)}
                          className="text-muted-foreground hover:text-destructive transition-colors p-1 shrink-0"
                          title="Batalkan undangan"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Current Members */}
            <div>
              <label className="text-xs font-body font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
                Anggota ({members?.length ?? 0}/10)
              </label>

              {isLoading ? (
                <div className="text-center py-4">
                  <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                </div>
              ) : members?.length === 0 ? (
                <p className="text-xs text-muted-foreground font-body py-4 text-center">
                  Belum ada anggota. Undang seseorang dengan email di atas.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {members?.map((member) => {
                    const profile = getProfile(member.user_id);
                    return (
                      <div key={member.id} className="flex items-center justify-between p-2.5 bg-muted/30 rounded-md">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <UserCheck className="h-3.5 w-3.5 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-body font-medium text-foreground truncate">
                              {profile?.full_name || "No Name"}
                            </p>
                            <p className="text-[10px] text-muted-foreground font-body truncate">
                              {profile?.email}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[9px] uppercase tracking-wider font-body text-muted-foreground">
                            {member.role}
                          </span>
                          <button
                            onClick={() => setRemovingId(member.id)}
                            className="text-muted-foreground hover:text-destructive transition-colors p-1"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Remove confirmation */}
      <AlertDialog open={!!removingId} onOpenChange={(open) => !open && setRemovingId(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">Hapus anggota?</AlertDialogTitle>
            <AlertDialogDescription className="font-body text-muted-foreground">
              Orang ini akan kehilangan akses ke board ini.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-body">Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => removingId && removeMember.mutate(removingId)}
              className="bg-destructive text-destructive-foreground font-body"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
