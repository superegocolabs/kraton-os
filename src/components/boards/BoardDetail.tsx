import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { ArrowLeft, Plus, X, Calendar, Tag, User, Trash2, Pencil, Check, Eye, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter as AlertFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import { BoardTeamManager } from "./BoardTeamManager";

interface Board {
  id: string;
  title: string;
  description: string | null;
}

interface BoardDetailProps {
  board: Board;
  onBack: () => void;
}

const LABEL_COLORS = [
  { name: "Red", color: "bg-red-500/20 text-red-400" },
  { name: "Blue", color: "bg-blue-500/20 text-blue-400" },
  { name: "Green", color: "bg-green-500/20 text-green-400" },
  { name: "Yellow", color: "bg-yellow-500/20 text-yellow-400" },
  { name: "Purple", color: "bg-purple-500/20 text-purple-400" },
  { name: "Orange", color: "bg-orange-500/20 text-orange-400" },
];

const STATUS_OPTIONS = [
  { name: "To Do", color: "bg-muted text-muted-foreground" },
  { name: "In Progress", color: "bg-blue-500/20 text-blue-400" },
  { name: "Complete", color: "bg-green-500/20 text-green-400" },
  { name: "Waitlist", color: "bg-yellow-500/20 text-yellow-400" },
];

function getCardStatus(labels: string[] | null): string | null {
  if (!labels) return null;
  return STATUS_OPTIONS.find(s => labels.includes(s.name))?.name ?? null;
}

function getStatusStyle(status: string): string {
  return STATUS_OPTIONS.find(s => s.name === status)?.color ?? "bg-muted text-muted-foreground";
}

export function BoardDetail({ board, onBack }: BoardDetailProps) {
  const [addingListTitle, setAddingListTitle] = useState("");
  const [isAddingList, setIsAddingList] = useState(false);
  const [addingCardToListId, setAddingCardToListId] = useState<string | null>(null);
  const [newCardTitle, setNewCardTitle] = useState("");
  const [editingCard, setEditingCard] = useState<any | null>(null);
  const [previewCard, setPreviewCard] = useState<any | null>(null);
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [editingListTitle, setEditingListTitle] = useState("");
  const [teamOpen, setTeamOpen] = useState(false);
  const queryClient = useQueryClient();

  // Board members count
  const { data: boardMembers } = useQuery({
    queryKey: ["board-members", board.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("board_members").select("id").eq("board_id", board.id);
      if (error) throw error;
      return data;
    },
  });

  const { data: lists } = useQuery({
    queryKey: ["board-lists", board.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("board_lists").select("*").eq("board_id", board.id).order("position");
      if (error) throw error;
      return data;
    },
  });

  const { data: cards } = useQuery({
    queryKey: ["board-cards", board.id],
    queryFn: async () => {
      if (!lists?.length) return [];
      const listIds = lists.map((l) => l.id);
      const { data, error } = await supabase.from("board_cards").select("*").in("list_id", listIds).order("position");
      if (error) throw error;
      return data;
    },
    enabled: !!lists?.length,
  });

  const addList = useMutation({
    mutationFn: async () => {
      const pos = (lists?.length ?? 0) * 1000;
      const { error } = await supabase.from("board_lists").insert({ board_id: board.id, title: addingListTitle.trim(), position: pos });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["board-lists", board.id] }); setAddingListTitle(""); setIsAddingList(false); },
    onError: (err: any) => toast.error(err.message),
  });

  const updateListTitle = useMutation({
    mutationFn: async ({ id, title }: { id: string; title: string }) => {
      const { error } = await supabase.from("board_lists").update({ title }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["board-lists", board.id] }); setEditingListId(null); },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteList = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("board_lists").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["board-lists", board.id] }); queryClient.invalidateQueries({ queryKey: ["board-cards", board.id] }); },
    onError: (err: any) => toast.error(err.message),
  });

  const addCard = useMutation({
    mutationFn: async (listId: string) => {
      const listCards = cards?.filter((c) => c.list_id === listId) ?? [];
      const pos = listCards.length * 1000;
      const { error } = await supabase.from("board_cards").insert({ list_id: listId, title: newCardTitle.trim(), position: pos });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["board-cards", board.id] }); setNewCardTitle(""); setAddingCardToListId(null); },
    onError: (err: any) => toast.error(err.message),
  });

  const updateCard = useMutation({
    mutationFn: async (card: any) => {
      const { id, ...rest } = card;
      const { error } = await supabase.from("board_cards").update({ ...rest, updated_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["board-cards", board.id] }); setEditingCard(null); toast.success("Card updated."); },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteCard = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("board_cards").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["board-cards", board.id] }); setEditingCard(null); },
    onError: (err: any) => toast.error(err.message),
  });

  const moveCard = useMutation({
    mutationFn: async ({ cardId, newListId, newPosition }: { cardId: string; newListId: string; newPosition: number }) => {
      const { error } = await supabase.from("board_cards").update({ list_id: newListId, position: newPosition, updated_at: new Date().toISOString() }).eq("id", cardId);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["board-cards", board.id] }); },
    onError: (err: any) => toast.error(err.message),
  });

  const getCardsForList = (listId: string) =>
    (cards?.filter((c) => c.list_id === listId) ?? []).sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination || !cards) return;
    const { destination, draggableId } = result;
    const destListId = destination.droppableId;
    const destCards = getCardsForList(destListId).filter((c) => c.id !== draggableId);

    let newPosition: number;
    if (destCards.length === 0) {
      newPosition = 1000;
    } else if (destination.index === 0) {
      newPosition = (destCards[0]?.position ?? 1000) - 500;
    } else if (destination.index >= destCards.length) {
      newPosition = (destCards[destCards.length - 1]?.position ?? 0) + 1000;
    } else {
      const before = destCards[destination.index - 1]?.position ?? 0;
      const after = destCards[destination.index]?.position ?? before + 2000;
      newPosition = Math.round((before + after) / 2);
    }
    moveCard.mutate({ cardId: draggableId, newListId: destListId, newPosition });
  };

  const cardLabelsWithoutStatus = (labels: string[] | null) => {
    if (!labels) return [];
    return labels.filter(l => !STATUS_OPTIONS.some(s => s.name === l));
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-4 md:px-6 py-4 border-b border-border flex items-center gap-4">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors font-body">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="min-w-0">
          <h1 className="text-lg font-display font-bold text-foreground truncate">{board.title}</h1>
          {board.description && <p className="text-xs text-muted-foreground font-body truncate">{board.description}</p>}
        </div>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs font-body ml-auto shrink-0" onClick={() => setTeamOpen(true)}>
          <Users className="h-3.5 w-3.5" />
          Share {boardMembers?.length ? `(${boardMembers.length})` : ""}
        </Button>
      </div>

      <BoardTeamManager boardId={board.id} boardTitle={board.title} open={teamOpen} onOpenChange={setTeamOpen} />

      {/* Board with DnD */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex-1 overflow-x-auto p-4 md:p-6">
          <div className="flex gap-4 items-start min-h-full">
            {lists?.map((list) => (
              <div key={list.id} className="w-[280px] md:w-72 shrink-0 bg-card/50 border border-border rounded-lg">
                {/* List header - editable */}
                <div className="px-3 py-2.5 flex items-center justify-between border-b border-border">
                  {editingListId === list.id ? (
                    <div className="flex items-center gap-1 flex-1">
                      <Input
                        value={editingListTitle}
                        onChange={(e) => setEditingListTitle(e.target.value)}
                        className="h-7 text-sm font-display font-bold bg-transparent border-border"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && editingListTitle.trim()) updateListTitle.mutate({ id: list.id, title: editingListTitle.trim() });
                          if (e.key === "Escape") setEditingListId(null);
                        }}
                      />
                      <button onClick={() => editingListTitle.trim() && updateListTitle.mutate({ id: list.id, title: editingListTitle.trim() })} className="text-primary hover:text-foreground p-0.5">
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <h3
                      className="text-sm font-display font-bold text-foreground cursor-pointer hover:text-primary transition-colors"
                      onDoubleClick={() => { setEditingListId(list.id); setEditingListTitle(list.title); }}
                    >
                      {list.title}
                    </h3>
                  )}
                  <div className="flex items-center gap-0.5">
                    <button onClick={() => { setEditingListId(list.id); setEditingListTitle(list.title); }} className="text-muted-foreground hover:text-foreground transition-colors p-1">
                      <Pencil className="h-3 w-3" />
                    </button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button className="text-muted-foreground hover:text-destructive transition-colors p-1"><X className="h-3.5 w-3.5" /></button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-card border-border">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="font-display">Delete list?</AlertDialogTitle>
                          <AlertDialogDescription className="font-body text-muted-foreground">This will delete "{list.title}" and all its cards.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertFooter>
                          <AlertDialogCancel className="font-body">Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteList.mutate(list.id)} className="bg-destructive text-destructive-foreground font-body">Delete</AlertDialogAction>
                        </AlertFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>

                {/* Cards - droppable */}
                <Droppable droppableId={list.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`p-2 space-y-2 min-h-[60px] transition-colors ${snapshot.isDraggingOver ? "bg-primary/5" : ""}`}
                    >
                      {getCardsForList(list.id).map((card, index) => {
                        const status = getCardStatus(card.labels as string[] | null);
                        const otherLabels = cardLabelsWithoutStatus(card.labels as string[] | null);

                        return (
                          <Draggable key={card.id} draggableId={card.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`bg-background border border-border rounded-md p-3 cursor-grab active:cursor-grabbing hover:border-primary/40 transition-colors group ${snapshot.isDragging ? "shadow-lg border-primary/60 rotate-2" : ""}`}
                              >
                                {/* Status badge + labels */}
                                <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                                  {status && (
                                    <span className={`text-[9px] px-1.5 py-0.5 rounded-sm font-body uppercase tracking-wider font-medium ${getStatusStyle(status)}`}>
                                      {status}
                                    </span>
                                  )}
                                  {otherLabels.map((label: string) => {
                                    const lc = LABEL_COLORS.find((l) => l.name === label);
                                    return (
                                      <span key={label} className={`text-[9px] px-1.5 py-0.5 rounded-sm font-body uppercase tracking-wider ${lc?.color ?? "bg-muted text-muted-foreground"}`}>
                                        {label}
                                      </span>
                                    );
                                  })}
                                </div>
                                <p className="text-sm font-body text-foreground">{card.title}</p>
                                <div className="flex items-center justify-between mt-2">
                                  <div className="flex items-center gap-2">
                                    {card.due_date && (
                                      <span className="text-[10px] text-muted-foreground font-body flex items-center gap-0.5">
                                        <Calendar className="h-2.5 w-2.5" />
                                        {new Date(card.due_date).toLocaleDateString("en-US", { day: "numeric", month: "short" })}
                                      </span>
                                    )}
                                    {card.assignee && (
                                      <span className="text-[10px] text-muted-foreground font-body flex items-center gap-0.5">
                                        <User className="h-2.5 w-2.5" />
                                        {card.assignee}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all">
                                    <button
                                      onClick={(e) => { e.stopPropagation(); setPreviewCard(card); }}
                                      className="text-muted-foreground hover:text-foreground transition-colors p-0.5"
                                      title="Preview"
                                    >
                                      <Eye className="h-3 w-3" />
                                    </button>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); setEditingCard({ ...card }); }}
                                      className="text-muted-foreground hover:text-foreground transition-colors p-0.5"
                                      title="Edit"
                                    >
                                      <Pencil className="h-3 w-3" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}

                      {/* Add card inline */}
                      {addingCardToListId === list.id ? (
                        <div className="space-y-2">
                          <Input
                            value={newCardTitle}
                            onChange={(e) => setNewCardTitle(e.target.value)}
                            placeholder="Card title..."
                            className="bg-background border-border font-body text-sm"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && newCardTitle.trim()) addCard.mutate(list.id);
                              if (e.key === "Escape") setAddingCardToListId(null);
                            }}
                          />
                          <div className="flex gap-2">
                            <Button size="sm" variant="accent" className="text-xs" onClick={() => addCard.mutate(list.id)} disabled={!newCardTitle.trim()}>Add card</Button>
                            <button onClick={() => setAddingCardToListId(null)} className="text-muted-foreground hover:text-foreground transition-colors"><X className="h-4 w-4" /></button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setAddingCardToListId(list.id); setNewCardTitle(""); }}
                          className="w-full text-left px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground font-body rounded-md hover:bg-muted transition-colors flex items-center gap-1"
                        >
                          <Plus className="h-3 w-3" /> Add card
                        </button>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}

            {/* Add list */}
            <div className="w-[280px] md:w-72 shrink-0">
              {isAddingList ? (
                <div className="bg-card/50 border border-border rounded-lg p-3 space-y-2">
                  <Input
                    value={addingListTitle}
                    onChange={(e) => setAddingListTitle(e.target.value)}
                    placeholder="List title..."
                    className="bg-background border-border font-body text-sm"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && addingListTitle.trim()) addList.mutate();
                      if (e.key === "Escape") setIsAddingList(false);
                    }}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" variant="accent" className="text-xs" onClick={() => addList.mutate()} disabled={!addingListTitle.trim()}>Add list</Button>
                    <button onClick={() => setIsAddingList(false)} className="text-muted-foreground hover:text-foreground transition-colors"><X className="h-4 w-4" /></button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setIsAddingList(true)}
                  className="w-full bg-card/30 border border-dashed border-border rounded-lg p-3 text-sm text-muted-foreground hover:text-foreground hover:border-primary/40 font-body transition-colors flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" /> Add another list
                </button>
              )}
            </div>
          </div>
        </div>
      </DragDropContext>

      {/* Preview Card Dialog (read-only) */}
      <Dialog open={!!previewCard} onOpenChange={(open) => !open && setPreviewCard(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <Eye className="h-4 w-4 text-primary" /> Card Preview
            </DialogTitle>
          </DialogHeader>
          {previewCard && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-display font-bold text-foreground">{previewCard.title}</h3>
                {(() => {
                  const status = getCardStatus(previewCard.labels as string[] | null);
                  return status ? (
                    <span className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-md font-body font-medium ${getStatusStyle(status)}`}>{status}</span>
                  ) : null;
                })()}
              </div>
              {previewCard.description && (
                <div>
                  <p className="text-xs text-muted-foreground font-body uppercase tracking-wider mb-1">Description</p>
                  <p className="text-sm text-foreground font-body whitespace-pre-wrap">{previewCard.description}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                {previewCard.due_date && (
                  <div>
                    <p className="text-xs text-muted-foreground font-body uppercase tracking-wider mb-1">Due Date</p>
                    <p className="text-sm text-foreground font-body flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-primary" />{new Date(previewCard.due_date).toLocaleDateString()}</p>
                  </div>
                )}
                {previewCard.assignee && (
                  <div>
                    <p className="text-xs text-muted-foreground font-body uppercase tracking-wider mb-1">Assignee</p>
                    <p className="text-sm text-foreground font-body flex items-center gap-1.5"><User className="h-3.5 w-3.5 text-primary" />{previewCard.assignee}</p>
                  </div>
                )}
              </div>
              {cardLabelsWithoutStatus(previewCard.labels as string[] | null).length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground font-body uppercase tracking-wider mb-2">Labels</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {cardLabelsWithoutStatus(previewCard.labels as string[] | null).map((label: string) => {
                      const lc = LABEL_COLORS.find((l) => l.name === label);
                      return <span key={label} className={`text-xs px-2 py-0.5 rounded-md font-body ${lc?.color ?? "bg-muted text-muted-foreground"}`}>{label}</span>;
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setPreviewCard(null); setEditingCard({ ...previewCard }); }} className="gap-1.5">
              <Pencil className="h-3.5 w-3.5" /> Edit Card
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Card Dialog */}
      <Dialog open={!!editingCard} onOpenChange={(open) => !open && setEditingCard(null)}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <Pencil className="h-4 w-4 text-primary" /> Edit Card
            </DialogTitle>
          </DialogHeader>
          {editingCard && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-body font-medium text-muted-foreground uppercase tracking-wider">Title</label>
                <Input value={editingCard.title} onChange={(e) => setEditingCard({ ...editingCard, title: e.target.value })} className="mt-1.5 bg-transparent border-border font-body" />
              </div>
              <div>
                <label className="text-xs font-body font-medium text-muted-foreground uppercase tracking-wider">Description</label>
                <Textarea
                  value={editingCard.description ?? ""}
                  onChange={(e) => setEditingCard({ ...editingCard, description: e.target.value })}
                  className="mt-1.5 bg-transparent border-border font-body min-h-[100px]"
                  placeholder="Add description..."
                />
              </div>

              {/* Status */}
              <div>
                <label className="text-xs font-body font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Status</label>
                <div className="flex flex-wrap gap-2">
                  {STATUS_OPTIONS.map((s) => {
                    const currentLabels = (editingCard.labels as string[]) ?? [];
                    const isSelected = currentLabels.includes(s.name);
                    return (
                      <button
                        key={s.name}
                        onClick={() => {
                          // Remove all status labels first, then toggle
                          let newLabels = currentLabels.filter(l => !STATUS_OPTIONS.some(so => so.name === l));
                          if (!isSelected) newLabels = [...newLabels, s.name];
                          setEditingCard({ ...editingCard, labels: newLabels });
                        }}
                        className={`text-xs px-2.5 py-1 rounded-md font-body transition-all ${s.color} ${isSelected ? "ring-2 ring-primary" : "opacity-60 hover:opacity-100"}`}
                      >
                        {s.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-body font-medium text-muted-foreground uppercase tracking-wider">Due Date</label>
                  <Input type="date" value={editingCard.due_date ?? ""} onChange={(e) => setEditingCard({ ...editingCard, due_date: e.target.value || null })} className="mt-1.5 bg-transparent border-border font-body" />
                </div>
                <div>
                  <label className="text-xs font-body font-medium text-muted-foreground uppercase tracking-wider">Assignee</label>
                  <Input value={editingCard.assignee ?? ""} onChange={(e) => setEditingCard({ ...editingCard, assignee: e.target.value || null })} className="mt-1.5 bg-transparent border-border font-body" placeholder="Assignee name" />
                </div>
              </div>

              {/* Color Labels */}
              <div>
                <label className="text-xs font-body font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Labels</label>
                <div className="flex flex-wrap gap-2">
                  {LABEL_COLORS.map((lc) => {
                    const currentLabels = (editingCard.labels as string[]) ?? [];
                    const isSelected = currentLabels.includes(lc.name);
                    return (
                      <button
                        key={lc.name}
                        onClick={() => {
                          const newLabels = isSelected ? currentLabels.filter((l: string) => l !== lc.name) : [...currentLabels, lc.name];
                          setEditingCard({ ...editingCard, labels: newLabels });
                        }}
                        className={`text-xs px-2.5 py-1 rounded-md font-body transition-all ${lc.color} ${isSelected ? "ring-2 ring-primary" : "opacity-60 hover:opacity-100"}`}
                      >
                        {lc.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {lists && lists.length > 1 && (
                <div>
                  <label className="text-xs font-body font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Move to List</label>
                  <div className="flex flex-wrap gap-2">
                    {lists.map((list) => (
                      <button
                        key={list.id}
                        onClick={() => {
                          if (list.id !== editingCard.list_id) {
                            const destCards = getCardsForList(list.id);
                            const pos = destCards.length * 1000;
                            moveCard.mutate({ cardId: editingCard.id, newListId: list.id, newPosition: pos });
                            setEditingCard({ ...editingCard, list_id: list.id });
                          }
                        }}
                        className={`text-xs px-2.5 py-1 rounded-md font-body transition-all border ${list.id === editingCard.list_id ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground hover:text-foreground hover:border-primary/40"}`}
                      >
                        {list.title}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="flex justify-between">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-destructive hover:text-destructive gap-1.5"><Trash2 className="h-3.5 w-3.5" /> Delete</Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-card border-border">
                <AlertDialogHeader>
                  <AlertDialogTitle className="font-display">Delete card?</AlertDialogTitle>
                  <AlertDialogDescription className="font-body text-muted-foreground">This card will be permanently deleted.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertFooter>
                  <AlertDialogCancel className="font-body">Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => editingCard && deleteCard.mutate(editingCard.id)} className="bg-destructive text-destructive-foreground font-body">Delete</AlertDialogAction>
                </AlertFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button variant="accent" onClick={() => editingCard && updateCard.mutate(editingCard)} disabled={updateCard.isPending}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
