import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const STATUS_COLORS: Record<string, string> = {
  active: "hsl(32, 30%, 63%)",
  completed: "hsl(142, 71%, 45%)",
  on_hold: "hsl(0, 0%, 55%)",
  cancelled: "hsl(0, 62%, 50%)",
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
        color: STATUS_COLORS[status] || "hsl(0, 0%, 40%)",
      }));
    },
  });

  if (isLoading || !data || data.length === 0) {
    return <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">{isLoading ? "Loading..." : "No projects yet"}</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data}>
        <XAxis dataKey="status" tick={{ fill: "hsl(0, 0%, 55%)", fontSize: 11, textTransform: "capitalize" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "hsl(0, 0%, 55%)", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip
          contentStyle={{ background: "hsl(0, 0%, 9%)", border: "1px solid hsl(0, 0%, 15%)", borderRadius: 6, fontSize: 12 }}
          labelStyle={{ color: "hsl(0, 0%, 55%)" }}
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
