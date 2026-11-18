import { User } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FileText,
  Users,
  DollarSign,
  Plus,
  TrendingUp,
  Clock,
  Briefcase,
  ArrowUpRight,
  CalendarDays,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { formatCurrency } from "@/lib/currency";
import { useState } from "react";
import { AddInvoiceDialog } from "@/components/finance/AddInvoiceDialog";
import { AddClientDialog } from "@/components/crm/AddClientDialog";
import { AddProjectDialog } from "@/components/projects/AddProjectDialog";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import studio from "@/assets/kraton-studio.png.asset.json";
import { ProjectStatusChart } from "@/components/dashboard/ProjectStatusChart";

interface DashboardContentProps {
  user: User | null;
}

const fadeIn = (delay: number) => ({
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, delay },
});

export function DashboardContent({ user }: DashboardContentProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const firstName = user?.user_metadata?.full_name?.split(" ")[0] || "Creative";
  const { activeProjects, totalClients, monthlyRevenue, pendingInvoices, recentActivity } = useDashboardStats();

  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [clientOpen, setClientOpen] = useState(false);
  const [projectOpen, setProjectOpen] = useState(false);

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("id, name").order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const createInvoice = useMutation({
    mutationFn: async (values: any) => {
      const { error } = await supabase.from("invoices").insert({ ...values, user_id: user?.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      setInvoiceOpen(false);
      toast.success("Invoice created");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const createClient = useMutation({
    mutationFn: async (values: any) => {
      const { error } = await supabase.from("clients").insert({ ...values, user_id: user?.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      setClientOpen(false);
      toast.success("Client added");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const createProject = useMutation({
    mutationFn: async (values: any) => {
      const { error } = await supabase.from("projects").insert({ ...values, user_id: user?.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setProjectOpen(false);
      toast.success("Project created");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const fmtCurrency = (val: number) => formatCurrency(val);

  return (
    <div className="p-5 sm:p-8 lg:p-10 max-w-7xl mx-auto">
      <motion.div {...fadeIn(0)} className="flex flex-wrap items-start justify-between gap-4">
        <div><p className="mb-2 text-xs font-medium text-primary">YOUR CREATIVE WORKSPACE</p><h1 className="text-2xl font-display font-bold text-foreground break-words">Good {getGreeting()}, {firstName}.</h1><p className="text-sm text-muted-foreground mt-2">Here's what's happening in your studio.</p></div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2"><CalendarDays className="h-4 w-4" />{new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</div>
      </motion.div>
      <div className="relative isolate mt-7 flex min-h-48 items-center overflow-hidden bg-cover px-6 py-8 text-cover-foreground sm:px-8">
        <img src={studio.url} alt="Creative studio sculptures" className="absolute inset-0 -z-10 h-full w-full object-cover object-[75%_center]" />
        <div className="max-w-xs"><p className="text-xs text-cover-accent mb-3">A NEW DAY. A FRESH CANVAS.</p><h2 className="text-2xl font-semibold leading-snug">Make room for<br />your best work.</h2><Button variant="link" className="mt-3 px-0 text-cover-accent hover:text-cover-foreground" onClick={() => navigate("/dashboard/boards")}>Go to your boards <ArrowUpRight /></Button></div>
      </div>

      {/* Bento Grid */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Live Projects — Spans 2 cols */}
        <motion.div
          {...fadeIn(0.05)}
          className="bg-secondary border border-border rounded-lg p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-body uppercase tracking-[0.15em] text-muted-foreground">
              Live Projects
            </h3>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-4xl font-display font-bold text-foreground">
            {activeProjects.isLoading ? "—" : activeProjects.data}
          </p>
          <p className="text-sm text-muted-foreground font-body mt-1">
            {activeProjects.data === 0 ? "No active projects yet" : "Active projects"}
          </p>
        </motion.div>

        {/* Revenue */}
        <motion.div
          {...fadeIn(0.1)}
          className="bg-card border border-border rounded-lg p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-body uppercase tracking-[0.15em] text-muted-foreground">
              Revenue
            </h3>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-2xl font-display font-bold text-foreground break-words">
            {monthlyRevenue.isLoading ? "—" : fmtCurrency(monthlyRevenue.data ?? 0)}
          </p>
          <p className="text-sm text-muted-foreground font-body mt-1">This month</p>
        </motion.div>

        {/* Clients */}
        <motion.div
          {...fadeIn(0.15)}
          className="bg-highlight border border-border rounded-lg p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-body uppercase tracking-[0.15em] text-muted-foreground">
              Total Clients
            </h3>
            <Users className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-2xl font-display font-bold text-foreground break-words">
            {totalClients.isLoading ? "—" : totalClients.data}
          </p>
          <p className="text-sm text-muted-foreground font-body mt-1">In your CRM</p>
        </motion.div>

        {/* Pending Invoices */}
        <motion.div
          {...fadeIn(0.25)}
          className="bg-coral border border-border rounded-lg p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-body uppercase tracking-[0.15em] text-muted-foreground">
              Pending Invoices
            </h3>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-2xl font-display font-bold text-foreground break-words">
            {pendingInvoices.isLoading ? "—" : pendingInvoices.data}
          </p>
          <p className="text-sm text-muted-foreground font-body mt-1">Awaiting payment</p>
        </motion.div>

        {/* Quick Actions — Spans 2 cols */}
        <motion.div
          {...fadeIn(0.2)}
          className="lg:col-span-2 border-b border-border py-6"
        >
          <h3 className="text-xs font-body uppercase tracking-[0.15em] text-muted-foreground mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="justify-start gap-2 font-body text-sm h-11"
              onClick={() => setInvoiceOpen(true)}
            >
              <Plus className="h-4 w-4 text-primary" />
              New Invoice
            </Button>
            <Button
              variant="outline"
              className="justify-start gap-2 font-body text-sm h-11"
              onClick={() => navigate("/dashboard/portals")}
            >
              <FileText className="h-4 w-4 text-primary" />
              Manage Portals
            </Button>
            <Button
              variant="outline"
              className="justify-start gap-2 font-body text-sm h-11"
              onClick={() => setClientOpen(true)}
            >
              <Users className="h-4 w-4 text-primary" />
              Add Client
            </Button>
            <Button
              variant="outline"
              className="justify-start gap-2 font-body text-sm h-11"
              onClick={() => setProjectOpen(true)}
            >
              <Briefcase className="h-4 w-4 text-primary" />
              New Project
            </Button>
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          {...fadeIn(0.3)}
          className="md:col-span-2 border-b border-border py-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-body uppercase tracking-[0.15em] text-muted-foreground">
              Recent Activity
            </h3>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </div>
          {recentActivity.isLoading ? (
            <p className="text-sm text-muted-foreground font-body">Loading...</p>
          ) : recentActivity.data && recentActivity.data.length > 0 ? (
            <ul className="space-y-2">
              {recentActivity.data.map((item, i) => (
                <li key={i} className="text-sm text-muted-foreground font-body truncate">
                  {item.label}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground font-body">No recent activity</p>
          )}
        </motion.div>

        {/* Revenue Chart — Spans 2 cols */}
        <motion.div {...fadeIn(0.35)} className="lg:col-span-2 bg-card border border-border rounded-lg p-6">
          <h3 className="text-xs font-body uppercase tracking-[0.15em] text-muted-foreground mb-4">
            Revenue trend · Last 6 months
          </h3>
          <RevenueChart />
        </motion.div>

        {/* Project Status Chart */}
        <motion.div {...fadeIn(0.4)} className="lg:col-span-2 bg-card border border-border rounded-lg p-6">
          <h3 className="text-xs font-body uppercase tracking-[0.15em] text-muted-foreground mb-4">
            Project Status
          </h3>
          <ProjectStatusChart />
        </motion.div>
      </div>

      {/* Dialogs */}
      <AddInvoiceDialog
        open={invoiceOpen}
        onOpenChange={setInvoiceOpen}
        onSubmit={(v) => createInvoice.mutate(v)}
        isSubmitting={createInvoice.isPending}
        clients={clients}
      />
      <AddClientDialog
        open={clientOpen}
        onOpenChange={setClientOpen}
        onSubmit={(v) => createClient.mutate(v)}
        isSubmitting={createClient.isPending}
      />
      <AddProjectDialog
        open={projectOpen}
        onOpenChange={setProjectOpen}
        onSubmit={(v) => createProject.mutate(v)}
        isSubmitting={createProject.isPending}
        clients={clients}
      />
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 18) return "afternoon";
  return "evening";
}
