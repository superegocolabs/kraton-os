import { useState } from "react";
import { User } from "@supabase/supabase-js";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Plus, Kanban, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { BoardDetail } from "./BoardDetail";
import { useMembership, FREE_LIMITS } from "@/hooks/useMembership";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter as AlertFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";

interface BoardsPageProps { user: User | null; }

export function BoardsPage({ user }: BoardsPageProps) {
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const queryClient = useQueryClient();
  const { isMember } = useMembership(user?.id);

  const { data: boards, isLoading } = useQuery({
    queryKey: ["boards"],
    queryFn: async () => {
      const { data, error } = await supabase.from("boards").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const addBoard = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("boards").insert({ title: newTitle.trim(), description: newDesc.trim() || null, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["boards"] }); toast.success("Board created."); setAddDialogOpen(false); setNewTitle(""); setNewDesc(""); },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteBoard = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("boards").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["boards"] }); toast.success("Board deleted."); },
    onError: (err: any) => toast.error(err.message),
  });

  const selectedBoard = boards?.find((b) => b.id === selectedBoardId);
  if (selectedBoard) return <BoardDetail board={selectedBoard} onBack={() => setSelectedBoardId(null)} />;

  const boardCount = boards?.length ?? 0;
  const canCreate = isMember || boardCount < FREE_LIMITS.boards;
  const handleCreate = () => {
    if (!canCreate) { toast.error("Upgrade your membership to create more boards."); return; }
    setAddDialogOpen(true);
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-xl md:text-2xl font-display font-bold text-foreground">Boards</h1>
            <p className="text-sm text-muted-foreground font-body mt-1">
              Manage tasks and workflows with kanban boards.
              {!isMember && <span className="text-primary ml-2">({boardCount}/{FREE_LIMITS.boards} boards)</span>}
            </p>
          </div>
          <Button variant="accent" className="gap-2 shrink-0" onClick={handleCreate}>
            <Plus className="h-4 w-4" /> <span className="hidden sm:inline">New Board</span>
          </Button>
        </div>
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading ? (
            <div className="col-span-full text-center py-12 text-muted-foreground font-body text-sm">Loading...</div>
          ) : boards?.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Kanban className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground font-body text-sm">No boards yet. Create your first board!</p>
            </div>
          ) : (
            boards?.map((board) => (
              <motion.div key={board.id} whileHover={{ y: -2 }}
                className="bg-card border border-border rounded-lg p-5 cursor-pointer hover:border-primary/40 transition-colors group relative"
                onClick={() => setSelectedBoardId(board.id)}>
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display font-bold text-foreground truncate">{board.title}</h3>
                    {board.description && <p className="text-xs text-muted-foreground font-body mt-1 line-clamp-2">{board.description}</p>}
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button onClick={(e) => e.stopPropagation()} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all p-1">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-card border-border" onClick={(e) => e.stopPropagation()}>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="font-display">Delete board?</AlertDialogTitle>
                        <AlertDialogDescription className="font-body text-muted-foreground">This will permanently delete "{board.title}" and all its lists and cards.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertFooter>
                        <AlertDialogCancel className="font-body">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteBoard.mutate(board.id)} className="bg-destructive text-destructive-foreground font-body">Delete</AlertDialogAction>
                      </AlertFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
                <p className="text-[10px] text-muted-foreground font-body mt-3 uppercase tracking-wider">{new Date(board.created_at).toLocaleDateString()}</p>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="font-display">New Board</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-body font-medium text-muted-foreground uppercase tracking-wider">Title</label>
              <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Board title" className="mt-1.5 bg-transparent border-border font-body" />
            </div>
            <div>
              <label className="text-xs font-body font-medium text-muted-foreground uppercase tracking-wider">Description</label>
              <Textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Optional description" className="mt-1.5 bg-transparent border-border font-body min-h-[80px]" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="accent" onClick={() => addBoard.mutate()} disabled={!newTitle.trim() || addBoard.isPending}>Create Board</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
