import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { FolderOpen, FileText, CheckCircle2, Clock } from "lucide-react";

const ClientPortalView = () => {
  const { slug } = useParams<{ slug: string }>();

  const { data: portal, isLoading: portalLoading } = useQuery({
    queryKey: ["portal", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_portals")
        .select("*, clients(id, name)")
        .eq("slug", slug!)
        .eq("is_active", true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  const clientId = portal?.clients?.id;

  const { data: projects } = useQuery({
    queryKey: ["portal-projects", clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, status, description, start_date, end_date")
        .eq("client_id", clientId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!clientId,
  });

  const { data: invoices } = useQuery({
    queryKey: ["portal-invoices", clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("id, invoice_number, amount, status, due_date")
        .eq("client_id", clientId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!clientId,
  });

  if (portalLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A]">
        <div className="h-5 w-5 border-2 border-[#C5A47E] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!portal) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A]">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
            Portal Not Found
          </h1>
          <p className="text-[#888] mt-2" style={{ fontFamily: 'Inter, sans-serif' }}>
            This portal may have been deactivated or doesn't exist.
          </p>
        </div>
      </div>
    );
  }

  const accent = portal.accent_color ?? "#C5A47E";
  const fmt = (v: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(v);

  const statusIcon = (status: string) => {
    if (status === "completed" || status === "paid") return <CheckCircle2 className="h-3.5 w-3.5" style={{ color: "#4ade80" }} />;
    if (status === "active" || status === "sent") return <Clock className="h-3.5 w-3.5" style={{ color: accent }} />;
    return <Clock className="h-3.5 w-3.5" style={{ color: "#888" }} />;
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A]" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Accent bar */}
      <div className="h-1" style={{ backgroundColor: accent }} />

      <div className="max-w-3xl mx-auto px-6 py-12">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          {/* Header */}
          <p className="text-[10px] uppercase tracking-[0.25em]" style={{ color: accent, fontFamily: 'Inter, sans-serif' }}>
            {portal.studio_name}
          </p>
          <h1 className="text-3xl font-bold text-white mt-2" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
            {portal.clients?.name}
          </h1>
          <p className="text-[#888] mt-3 text-sm leading-relaxed max-w-lg">
            {String(portal.welcome_message ?? "").replace(/<[^>]*>/g, "")}
          </p>

          {/* Projects */}
          <div className="mt-12">
            <h2 className="text-xs uppercase tracking-[0.15em] text-[#888] mb-4 flex items-center gap-2">
              <FolderOpen className="h-3.5 w-3.5" /> Projects
            </h2>
            {projects && projects.length > 0 ? (
              <div className="space-y-3">
                {projects.map((p, i) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: i * 0.05 }}
                    className="bg-[#171717] border border-[#262626] rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {statusIcon(p.status)}
                        <span className="text-sm font-medium text-white" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
                          {p.name}
                        </span>
                      </div>
                      <span className="text-[10px] uppercase tracking-wider text-[#888]">{p.status.replace("_", " ")}</span>
                    </div>
                    {p.description && (
                      <p className="text-xs text-[#888] mt-2 leading-relaxed">{p.description}</p>
                    )}
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#888]">No projects yet.</p>
            )}
          </div>

          {/* Invoices */}
          <div className="mt-12">
            <h2 className="text-xs uppercase tracking-[0.15em] text-[#888] mb-4 flex items-center gap-2">
              <FileText className="h-3.5 w-3.5" /> Invoices
            </h2>
            {invoices && invoices.length > 0 ? (
              <div className="space-y-2">
                {invoices.map((inv, i) => (
                  <motion.div
                    key={inv.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: i * 0.05 }}
                    className="bg-[#171717] border border-[#262626] rounded-lg p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      {statusIcon(inv.status)}
                      <div>
                        <span className="text-sm font-medium text-white" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
                          {inv.invoice_number}
                        </span>
                        {inv.due_date && (
                          <p className="text-[10px] text-[#888] mt-0.5">
                            Due {new Date(inv.due_date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-white" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
                        {fmt(Number(inv.amount))}
                      </span>
                      <p className="text-[10px] uppercase tracking-wider mt-0.5" style={{ color: inv.status === "paid" ? "#4ade80" : accent }}>
                        {inv.status}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#888]">No invoices yet.</p>
            )}
          </div>

          {/* Footer */}
          <div className="mt-16 pt-6 border-t border-[#262626]">
            <p className="text-[10px] text-[#555] uppercase tracking-[0.15em]">
              Powered by {portal.studio_name} · Built with Kraton
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ClientPortalView;
