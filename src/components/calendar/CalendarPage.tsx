import { useState, useMemo } from "react";
import { User } from "@supabase/supabase-js";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, FolderOpen, Kanban, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface CalendarPageProps {
  user: User | null;
}

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type: "project-start" | "project-end" | "board-card" | "invoice-due";
  status?: string;
}

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function CalendarPage({ user }: CalendarPageProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const { data: projects } = useQuery({
    queryKey: ["calendar-projects"],
    queryFn: async () => {
      const { data, error } = await supabase.from("projects").select("id, name, start_date, end_date, status");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: boardCards } = useQuery({
    queryKey: ["calendar-board-cards"],
    queryFn: async () => {
      const { data, error } = await supabase.from("board_cards").select("id, title, due_date, labels");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: invoices } = useQuery({
    queryKey: ["calendar-invoices"],
    queryFn: async () => {
      const { data, error } = await supabase.from("invoices").select("id, invoice_number, due_date, status");
      if (error) throw error;
      return data ?? [];
    },
  });

  const events = useMemo<CalendarEvent[]>(() => {
    const items: CalendarEvent[] = [];
    projects?.forEach((p) => {
      if (p.start_date) items.push({ id: `ps-${p.id}`, title: `${p.name} (Start)`, date: p.start_date, type: "project-start", status: p.status });
      if (p.end_date) items.push({ id: `pe-${p.id}`, title: `${p.name} (End)`, date: p.end_date, type: "project-end", status: p.status });
    });
    boardCards?.forEach((c) => {
      if (c.due_date) {
        const labels = (() => { try { const l = typeof c.labels === "string" ? JSON.parse(c.labels) : c.labels; return Array.isArray(l) ? l : []; } catch { return []; } })();
        const status = labels.find((l: string) => ["complete", "in_progress", "waitlist", "todo"].includes(l));
        items.push({ id: `bc-${c.id}`, title: c.title, date: c.due_date, type: "board-card", status });
      }
    });
    invoices?.forEach((inv) => {
      if (inv.due_date) items.push({ id: `inv-${inv.id}`, title: `Invoice ${inv.invoice_number}`, date: inv.due_date, type: "invoice-due", status: inv.status });
    });
    return items;
  }, [projects, boardCards, invoices]);

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const isToday = (day: number) => today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;

  const getEventsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return events.filter((e) => e.date === dateStr);
  };

  const navigate = (dir: number) => {
    setCurrentDate(new Date(year, month + dir, 1));
  };

  const goToday = () => setCurrentDate(new Date());

  const typeIcon = (type: CalendarEvent["type"]) => {
    if (type === "project-start" || type === "project-end") return <FolderOpen className="h-2.5 w-2.5 shrink-0" />;
    if (type === "board-card") return <Kanban className="h-2.5 w-2.5 shrink-0" />;
    return <FileText className="h-2.5 w-2.5 shrink-0" />;
  };

  const typeColor = (type: CalendarEvent["type"]) => {
    if (type === "project-start") return "text-green-400";
    if (type === "project-end") return "text-primary";
    if (type === "board-card") return "text-blue-400";
    return "text-yellow-400";
  };

  // Build grid cells
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  // Upcoming events (next 14 days)
  const upcoming = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const twoWeeks = new Date(now);
    twoWeeks.setDate(twoWeeks.getDate() + 14);
    return events
      .filter((e) => { const d = new Date(e.date); return d >= now && d <= twoWeeks; })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 10);
  }, [events]);

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Calendar</h1>
            <p className="text-sm text-muted-foreground font-body mt-1">Project deadlines, board tasks & invoice due dates.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToday} className="text-xs font-body">Today</Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}><ChevronLeft className="h-4 w-4" /></Button>
            <span className="text-sm font-display font-bold text-foreground min-w-[140px] text-center">{MONTH_NAMES[month]} {year}</span>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(1)}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Calendar Grid */}
          <div className="lg:col-span-3 bg-card border border-border rounded-lg overflow-hidden">
            {/* Day headers */}
            <div className="grid grid-cols-7 border-b border-border">
              {DAY_NAMES.map((d) => (
                <div key={d} className="p-2 text-center text-[10px] font-body uppercase tracking-wider text-muted-foreground">{d}</div>
              ))}
            </div>
            {/* Days */}
            <div className="grid grid-cols-7">
              {cells.map((day, i) => {
                const dayEvents = day ? getEventsForDay(day) : [];
                return (
                  <div key={i} className={`min-h-[80px] md:min-h-[100px] p-1 border-b border-r border-border/50 ${!day ? "bg-muted/20" : ""} ${day && isToday(day) ? "bg-primary/5" : ""}`}>
                    {day && (
                      <>
                        <span className={`text-xs font-body inline-flex items-center justify-center h-6 w-6 rounded-full ${isToday(day) ? "bg-primary text-primary-foreground font-bold" : "text-muted-foreground"}`}>
                          {day}
                        </span>
                        <div className="mt-0.5 space-y-0.5">
                          {dayEvents.slice(0, 3).map((ev) => (
                            <div key={ev.id} className={`flex items-center gap-1 px-1 py-0.5 rounded text-[9px] font-body truncate ${typeColor(ev.type)} bg-muted/50`}>
                              {typeIcon(ev.type)}
                              <span className="truncate">{ev.title}</span>
                            </div>
                          ))}
                          {dayEvents.length > 3 && (
                            <span className="text-[9px] text-muted-foreground font-body px-1">+{dayEvents.length - 3} more</span>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Upcoming Sidebar */}
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="text-xs font-body uppercase tracking-[0.15em] text-muted-foreground mb-3">Upcoming (14 days)</h3>
            {upcoming.length > 0 ? (
              <div className="space-y-2">
                {upcoming.map((ev) => (
                  <div key={ev.id} className="flex items-start gap-2 p-2 rounded-md bg-muted/30">
                    <div className={`mt-0.5 ${typeColor(ev.type)}`}>{typeIcon(ev.type)}</div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-body text-foreground truncate">{ev.title}</p>
                      <p className="text-[10px] text-muted-foreground font-body">{new Date(ev.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground font-body">No upcoming events.</p>
            )}

            {/* Legend */}
            <div className="mt-6 pt-4 border-t border-border">
              <h4 className="text-[10px] font-body uppercase tracking-wider text-muted-foreground mb-2">Legend</h4>
              <div className="space-y-1.5">
                {[
                  { type: "project-start" as const, label: "Project Start" },
                  { type: "project-end" as const, label: "Project End" },
                  { type: "board-card" as const, label: "Board Task" },
                  { type: "invoice-due" as const, label: "Invoice Due" },
                ].map((item) => (
                  <div key={item.type} className="flex items-center gap-2">
                    <span className={typeColor(item.type)}>{typeIcon(item.type)}</span>
                    <span className="text-[10px] text-muted-foreground font-body">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
