import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { formatCurrency } from "@/lib/currency";

export function RevenueChart() {
  const { data, isLoading } = useQuery({
    queryKey: ["revenue-chart"],
    queryFn: async () => {
      const now = new Date();
      const months: { label: string; start: string; end: string }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
        months.push({
          label: d.toLocaleString("default", { month: "short" }),
          start: d.toISOString(),
          end: end.toISOString(),
        });
      }

      const { data: invoices, error } = await supabase
        .from("invoices")
        .select("amount, paid_date")
        .eq("status", "paid")
        .gte("paid_date", months[0].start);
      if (error) throw error;

      return months.map((m) => ({
        name: m.label,
        revenue: (invoices ?? [])
          .filter((inv) => inv.paid_date && inv.paid_date >= m.start.slice(0, 10) && inv.paid_date <= m.end.slice(0, 10))
          .reduce((sum, inv) => sum + Number(inv.amount), 0),
      }));
    },
  });

  if (isLoading || !data) {
    return <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">Loading...</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(32, 30%, 63%)" stopOpacity={0.4} />
            <stop offset="100%" stopColor="hsl(32, 30%, 63%)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="name" tick={{ fill: "hsl(0, 0%, 55%)", fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "hsl(0, 0%, 55%)", fontSize: 11 }} axisLine={false} tickLine={false} width={60} tickFormatter={(v) => formatCurrency(v)} />
        <Tooltip
          contentStyle={{ background: "hsl(0, 0%, 9%)", border: "1px solid hsl(0, 0%, 15%)", borderRadius: 6, fontSize: 12 }}
          labelStyle={{ color: "hsl(0, 0%, 55%)" }}
          formatter={(value: number) => [formatCurrency(value), "Revenue"]}
        />
        <Area type="monotone" dataKey="revenue" stroke="hsl(32, 30%, 63%)" fill="url(#revGrad)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
