import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const STATUS_COLORS: Record<string, string> = {
  active: "hsl(var(--primary))",
  completed: "hsl(var(--success))",
  on_hold: "hsl(var(--muted-foreground))",
  cancelled: "hsl(var(--destructive))",
};

export function ProjectStatusChart() {
  const { data, isLoading } = useQuery({
    queryKey: ["project-status-chart"],
    queryFn: async () => {
      const { data: projects, error } = await supabase.from("projects").select("status");
      if (error) throw error;
      const counts: Record<string, number> = {};
      (projects ?? []).forEach((p) => {
        counts[p.status] = (counts[p.status] || 0) + 1;
      });
      return Object.entries(counts).map(([status, count]) => ({
        status: status.replace("_", " "),
        count,
        color: STATUS_COLORS[status] || "hsl(var(--muted-foreground))",
      }));
    },
  });

  if (isLoading || !data || data.length === 0) {
    return <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">{isLoading ? "Loading..." : "No projects yet"}</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data}>
        <XAxis dataKey="status" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip
          contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: 12 }}
          labelStyle={{ color: "hsl(var(--muted-foreground))" }}
        />
        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
