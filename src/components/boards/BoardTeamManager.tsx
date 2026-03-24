import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Users, Plus, X, Search, Crown, UserCheck } from "lucide-react";
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
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BoardTeamManager({ boardId, open, onOpenChange }: BoardTeamManagerProps) {
  const [searchEmail, setSearchEmail] = useState("");
  const [removingId, setRemovingId] = useState<string | null>(null);
  const queryClient = useQueryClient();

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

  // Search for users with active membership by email
  const { data: searchResults } = useQuery({
    queryKey: ["search-members", searchEmail],
    queryFn: async () => {
      if (!searchEmail || searchEmail.length < 3) return [];
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .ilike("email", `%${searchEmail}%`)
        .limit(5);
      if (error) throw error;
      // Filter out already added members
      const memberIds = members?.map(m => m.user_id) ?? [];
      return (data ?? []).filter(p => !memberIds.includes(p.id));
    },
    enabled: searchEmail.length >= 3 && open,
  });

  const addMember = useMutation({
    mutationFn: async (userId: string) => {
      // Check if user has active membership
      const { data: membership } = await supabase
        .from("memberships")
        .select("is_active, expires_at")
        .eq("user_id", userId)
        .maybeSingle();
      
      const isActive = membership?.is_active && 
        (!membership.expires_at || new Date(membership.expires_at) > new Date());
      
      if (!isActive) {
        throw new Error("This user doesn't have an active membership. Only members with active plans can be added to boards.");
      }

      // Check max 10 members
      if ((members?.length ?? 0) >= 10) {
        throw new Error("Maximum 10 team members per board. Contact us for larger teams.");
      }

      const { error } = await supabase
        .from("board_members")
        .insert({ board_id: boardId, user_id: userId, role: "editor" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["board-members", boardId] });
      setSearchEmail("");
      toast.success("Team member added!");
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
      toast.success("Team member removed.");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const getProfile = (userId: string) => memberProfiles?.find(p => p.id === userId);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" /> Board Team
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Search & Add */}
            <div>
              <label className="text-xs font-body font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
                Add Member by Email
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  placeholder="Search by email..."
                  className="pl-9 bg-transparent border-border font-body text-sm"
                />
              </div>
              <p className="text-[10px] text-muted-foreground font-body mt-1">
                Only users with active membership can be added (max 10).
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
                        onClick={() => addMember.mutate(user.id)}
                        disabled={addMember.isPending}
                      >
                        <Plus className="h-3 w-3" /> Add
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {searchEmail.length >= 3 && searchResults?.length === 0 && (
                <p className="text-xs text-muted-foreground font-body mt-2">No matching users found.</p>
              )}
            </div>

            {/* Current Members */}
            <div>
              <label className="text-xs font-body font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
                Current Members ({members?.length ?? 0}/10)
              </label>

              {isLoading ? (
                <div className="text-center py-4">
                  <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                </div>
              ) : members?.length === 0 ? (
                <p className="text-xs text-muted-foreground font-body py-4 text-center">
                  No team members yet. Add someone by searching their email above.
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
            <AlertDialogTitle className="font-display">Remove team member?</AlertDialogTitle>
            <AlertDialogDescription className="font-body text-muted-foreground">
              This person will lose access to this board.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-body">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => removingId && removeMember.mutate(removingId)}
              className="bg-destructive text-destructive-foreground font-body"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
