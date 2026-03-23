import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { MessageSquare, ThumbsUp, RotateCcw, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useQueryClient } from "@tanstack/react-query";

export function AdminFeedbackPage() {
  const queryClient = useQueryClient();

  const { data: feedback, isLoading } = useQuery({
    queryKey: ["admin-feedback"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_feedback")
        .select("*, client_portals(slug, clients(name))")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("client_feedback").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Feedback deleted");
    queryClient.invalidateQueries({ queryKey: ["admin-feedback"] });
  };

  const typeIcon = (type: string) => {
    if (type === "approval") return <ThumbsUp className="h-3.5 w-3.5 text-green-400" />;
    if (type === "revision") return <RotateCcw className="h-3.5 w-3.5 text-yellow-400" />;
    return <MessageSquare className="h-3.5 w-3.5 text-primary" />;
  };

  const typeBadge = (type: string) => {
    if (type === "approval") return "bg-green-500/20 text-green-400";
    if (type === "revision") return "bg-yellow-500/20 text-yellow-400";
    return "bg-primary/20 text-primary";
  };

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        <h1 className="text-2xl font-display font-bold text-foreground">Client Feedback</h1>
        <p className="text-sm text-muted-foreground font-body mt-1">Comments, approvals, and revision requests from clients.</p>

        <div className="mt-6 space-y-3">
          {isLoading ? (
            <p className="text-sm text-muted-foreground font-body">Loading...</p>
          ) : feedback && feedback.length > 0 ? (
            feedback.map((fb: any) => (
              <div key={fb.id} className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {typeIcon(fb.feedback_type)}
                    <Badge className={`text-[9px] uppercase tracking-wider ${typeBadge(fb.feedback_type)}`}>
                      {fb.feedback_type}
                    </Badge>
                    <span className="text-xs text-muted-foreground font-body">
                      from <span className="text-foreground font-medium">{fb.author_name}</span>
                    </span>
                    {fb.client_portals?.clients?.name && (
                      <span className="text-[10px] text-muted-foreground font-body">
                        · {fb.client_portals.clients.name}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] text-muted-foreground font-body">
                      {new Date(fb.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete feedback?</AlertDialogTitle>
                          <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(fb.id)}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                <p className="text-sm text-foreground font-body mt-2 leading-relaxed">{fb.message}</p>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground font-body">No feedback received yet.</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
