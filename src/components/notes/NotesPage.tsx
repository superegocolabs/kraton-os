import { useState } from "react";
import { User } from "@supabase/supabase-js";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import {
  Plus, FileText, Trash2, Bold, Italic, Underline, ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useMembership, FREE_LIMITS } from "@/hooks/useMembership";
import { useRef, useCallback, useEffect } from "react";

interface NotesPageProps {
  user: User | null;
}

const NOTE_FREE_LIMIT = 3;

export function NotesPage({ user }: NotesPageProps) {
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { isMember } = useMembership(user?.id);
  const editorRef = useRef<HTMLDivElement>(null);

  const { data: notes, isLoading } = useQuery({
    queryKey: ["notes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createNote = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from("notes")
        .insert({ user_id: user!.id, title: "Untitled", content: "" })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      setSelectedNoteId(data.id);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const updateNote = useMutation({
    mutationFn: async ({ id, title, content }: { id: string; title: string; content: string }) => {
      const { error } = await supabase
        .from("notes")
        .update({ title, content, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });

  const deleteNote = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      setSelectedNoteId(null);
      toast.success("Note deleted.");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const selectedNote = notes?.find((n) => n.id === selectedNoteId);
  const noteCount = notes?.length ?? 0;
  const canCreate = isMember || noteCount < NOTE_FREE_LIMIT;

  const handleCreate = () => {
    if (!canCreate) {
      toast.error("Upgrade membership untuk membuat notes lebih banyak.");
      return;
    }
    createNote.mutate();
  };

  const execCommand = useCallback((cmd: string) => {
    document.execCommand(cmd, false);
    editorRef.current?.focus();
  }, []);

  // Auto-save debounce
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleContentChange = useCallback(() => {
    if (!selectedNote || !editorRef.current) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      updateNote.mutate({
        id: selectedNote.id,
        title: selectedNote.title,
        content: editorRef.current?.innerHTML ?? "",
      });
    }, 800);
  }, [selectedNote, updateNote]);

  // Set editor content when note changes
  useEffect(() => {
    if (editorRef.current && selectedNote) {
      editorRef.current.innerHTML = selectedNote.content ?? "";
    }
  }, [selectedNoteId]);

  // Editor view
  if (selectedNote) {
    return (
      <div className="p-6 lg:p-8 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <button
            onClick={() => setSelectedNoteId(null)}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors font-body mb-4"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Notes
          </button>

          <NoteTitle
            initialTitle={selectedNote.title}
            onSave={(title) =>
              updateNote.mutate({
                id: selectedNote.id,
                title,
                content: editorRef.current?.innerHTML ?? selectedNote.content ?? "",
              })
            }
          />

          {/* Toolbar */}
          <div className="flex items-center gap-1 mt-4 mb-2 border border-border rounded-lg p-1 bg-card w-fit">
            <button
              onClick={() => execCommand("bold")}
              className="p-2 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title="Bold"
            >
              <Bold className="h-4 w-4" />
            </button>
            <button
              onClick={() => execCommand("italic")}
              className="p-2 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title="Italic"
            >
              <Italic className="h-4 w-4" />
            </button>
            <button
              onClick={() => execCommand("underline")}
              className="p-2 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title="Underline"
            >
              <Underline className="h-4 w-4" />
            </button>
            <div className="w-px h-5 bg-border mx-1" />
            <button
              onClick={() => execCommand("insertUnorderedList")}
              className="p-2 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors text-xs font-body"
              title="Bullet List"
            >
              • List
            </button>
            <button
              onClick={() => execCommand("insertOrderedList")}
              className="p-2 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors text-xs font-body"
              title="Numbered List"
            >
              1. List
            </button>
          </div>

          {/* Editor */}
          <div
            ref={editorRef}
            contentEditable
            onInput={handleContentChange}
            className="min-h-[400px] bg-card border border-border rounded-lg p-4 font-body text-sm text-foreground focus:outline-none focus:border-primary/40 transition-colors prose prose-invert max-w-none"
            style={{ lineHeight: 1.7 }}
          />

          <div className="mt-3 flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-xs text-destructive hover:text-destructive"
              onClick={() => deleteNote.mutate(selectedNote.id)}
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete Note
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  // List view
  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Notes</h1>
            <p className="text-sm text-muted-foreground font-body mt-1">
              Tulis catatan dan ide.
              {!isMember && (
                <span className="text-primary ml-2">
                  ({noteCount}/{NOTE_FREE_LIMIT} notes)
                </span>
              )}
            </p>
          </div>
          <Button variant="accent" className="gap-2" onClick={handleCreate} disabled={createNote.isPending}>
            <Plus className="h-4 w-4" /> New Note
          </Button>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading ? (
            <div className="col-span-full text-center py-12 text-muted-foreground font-body text-sm">Loading...</div>
          ) : notes?.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground font-body text-sm">Belum ada notes. Buat catatan pertama!</p>
            </div>
          ) : (
            notes?.map((note) => {
              const preview = (note.content ?? "").replace(/<[^>]*>/g, "").slice(0, 100);
              return (
                <motion.div
                  key={note.id}
                  whileHover={{ y: -2 }}
                  className="bg-card border border-border rounded-lg p-5 cursor-pointer hover:border-primary/40 transition-colors group relative"
                  onClick={() => setSelectedNoteId(note.id)}
                >
                  <div className="flex items-start justify-between">
                    <h3 className="font-display font-bold text-foreground text-sm truncate">
                      {note.title}
                    </h3>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNote.mutate(note.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all p-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  {preview && (
                    <p className="text-xs text-muted-foreground font-body mt-1.5 line-clamp-3">{preview}</p>
                  )}
                  <p className="text-[10px] text-muted-foreground font-body mt-3 uppercase tracking-wider">
                    {new Date(note.updated_at).toLocaleDateString("id-ID")}
                  </p>
                </motion.div>
              );
            })
          )}
        </div>
      </motion.div>
    </div>
  );
}

// Inline editable title component
function NoteTitle({ initialTitle, onSave }: { initialTitle: string; onSave: (title: string) => void }) {
  const [title, setTitle] = useState(initialTitle);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = (val: string) => {
    setTitle(val);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => onSave(val || "Untitled"), 800);
  };

  return (
    <Input
      value={title}
      onChange={(e) => handleChange(e.target.value)}
      className="text-xl font-display font-bold text-foreground bg-transparent border-0 border-b border-border rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary h-auto py-1"
      placeholder="Note title"
    />
  );
}
