import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { FolderOpen, FileText, CheckCircle2, Clock, Upload, Eye, X, Send, File, Lock, Download, MessageSquare, ThumbsUp, RotateCcw } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { getThemeByColor } from "@/lib/brandThemes";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const ClientPortalView = () => {
  const { slug } = useParams<{ slug: string }>();
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<{ invoiceId: string; file: File } | null>(null);
  const [isSending, setIsSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // PIN gate state
  const [pinVerified, setPinVerified] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);

  const { data: portal, isLoading: portalLoading } = useQuery({
    queryKey: ["portal", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_portals")
        .select("*, clients!fk_client_portals_client(id, name, company, email)")
        .eq("slug", slug!)
        .eq("is_active", true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  // Get portal owner's brand info from profiles
  const portalUserId = portal?.user_id;
  const { data: ownerProfile } = useQuery({
    queryKey: ["portal-owner-profile", portalUserId],
    queryFn: async () => {
      if (!portalUserId) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("brand_name, brand_logo_url, full_name, brand_color")
        .eq("id", portalUserId)
        .maybeSingle();
      if (error) return null;
      return data;
    },
    enabled: !!portalUserId,
  });

  const brandName = (ownerProfile as any)?.brand_name || portal?.studio_name || "";
  const brandLogoUrl = (ownerProfile as any)?.brand_logo_url || "";

  const accessCode = (portal as any)?.access_code as string | null;
  const hasPin = !!accessCode && accessCode.length > 0;

  const handlePinSubmit = () => {
    if (pinInput === accessCode) {
      setPinVerified(true);
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

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
    enabled: !!clientId && (!hasPin || pinVerified),
  });

  const { data: invoices, refetch: refetchInvoices } = useQuery({
    queryKey: ["portal-invoices", clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("id, invoice_number, amount, status, due_date, notes, paid_date, payment_proof_url, line_items, hidden_from_portal")
        .eq("client_id", clientId!)
        .neq("status", "draft")
        .eq("hidden_from_portal", false)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!clientId && (!hasPin || pinVerified),
  });

  const handleSendProof = async () => {
    if (!pendingFile) return;
    setIsSending(true);
    try {
      const { invoiceId, file } = pendingFile;
      const ext = file.name.split(".").pop();
      const path = `${invoiceId}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("payment-proofs")
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("payment-proofs").getPublicUrl(path);
      const { error: updateError } = await supabase
        .from("invoices")
        .update({ payment_proof_url: urlData.publicUrl })
        .eq("id", invoiceId);
      if (updateError) throw updateError;
      toast.success("Payment proof submitted successfully!");
      setPendingFile(null);
      refetchInvoices();
    } catch (err: any) {
      toast.error("Failed to send: " + err.message);
    } finally {
      setIsSending(false);
    }
  };

  const handleDownloadPdf = (inv: any) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    const items = (() => {
      try {
        const parsed = typeof inv.line_items === "string" ? JSON.parse(inv.line_items) : inv.line_items;
        return Array.isArray(parsed) ? parsed : [];
      } catch { return []; }
    })();
    const itemsHtml = items.map((item: any, i: number) =>
      `<tr><td style="padding:8px;border-bottom:1px solid #eee">${item.description || item.name || `Item ${i + 1}`}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${formatCurrency(Number(item.amount || 0))}</td></tr>`
    ).join("");
    const pdfAccent = (ownerProfile as any)?.brand_color || portal?.accent_color || "#C5A47E";
    const logoHtml = brandLogoUrl ? `<img src="${brandLogoUrl}" style="height:40px;margin-bottom:8px;" />` : "";
    printWindow.document.write(`
      <!DOCTYPE html><html><head><title>Invoice ${inv.invoice_number}</title>
      <style>body{font-family:Inter,sans-serif;margin:0;padding:40px;color:#333}
       .header{border-bottom:3px solid ${pdfAccent};padding-bottom:20px;margin-bottom:30px}
       .brand{font-size:10px;text-transform:uppercase;letter-spacing:3px;color:${pdfAccent}}
      h1{font-size:28px;margin:4px 0}table{width:100%;border-collapse:collapse}
      .total{font-size:24px;font-weight:bold;text-align:right;margin-top:20px}
      @media print{body{padding:20px}}</style></head>
      <body>
        <div class="header">
          ${logoHtml}
          <p class="brand">${brandName}</p>
          <h1>INVOICE</h1>
          <p>${inv.invoice_number}</p>
        </div>
        <p><strong>Bill To:</strong> ${portal?.clients?.name ?? ""}</p>
        ${inv.due_date ? `<p><strong>Due Date:</strong> ${new Date(inv.due_date).toLocaleDateString()}</p>` : ""}
        <p><strong>Status:</strong> ${inv.status.toUpperCase()}</p>
        ${items.length > 0 ? `<table style="margin-top:20px"><thead><tr><th style="text-align:left;padding:8px;border-bottom:2px solid #333">Description</th><th style="text-align:right;padding:8px;border-bottom:2px solid #333">Amount</th></tr></thead><tbody>${itemsHtml}</tbody></table>` : ""}
        <div class="total">${formatCurrency(Number(inv.amount))}</div>
        ${inv.notes ? `<p style="margin-top:30px;color:#888;font-size:12px"><strong>Notes:</strong> ${inv.notes}</p>` : ""}
        <script>setTimeout(()=>window.print(),500)</script>
      </body></html>
    `);
    printWindow.document.close();
  };

  if (portalLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A]">
        <div className="h-5 w-5 border-2 border-[#C5A47E] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!portal) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A] px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>Portal Not Found</h1>
          <p className="text-[#888] mt-2" style={{ fontFamily: 'Inter, sans-serif' }}>This portal may have been deactivated or doesn't exist.</p>
        </div>
      </div>
    );
  }

  const accent = (ownerProfile as any)?.brand_color || portal.accent_color || "#C5A47E";
  const theme = getThemeByColor(accent);
  const pt = theme.portal; // portal theme colors

  // PIN Gate
  if (hasPin && !pinVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ fontFamily: 'Inter, sans-serif', backgroundColor: pt.bg }}>
        <div className="h-1 absolute top-0 left-0 right-0" style={{ backgroundColor: accent }} />
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-sm mx-auto w-full">
          {brandLogoUrl && (
            <img src={brandLogoUrl} alt="Brand" className="h-12 mx-auto mb-4 object-contain" />
          )}
          <div className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center" style={{ backgroundColor: accent + "20" }}>
            <Lock className="h-7 w-7" style={{ color: accent }} />
          </div>
          <p className="text-[10px] uppercase tracking-[0.25em] mb-2" style={{ color: accent }}>{brandName}</p>
          <h1 className="text-xl font-bold mb-2" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: pt.text }}>Portal Access</h1>
          <p className="text-sm mb-6" style={{ color: pt.muted }}>Enter the access code to view this portal.</p>
          <div className="space-y-3">
            <Input
              value={pinInput}
              onChange={(e) => { setPinInput(e.target.value); setPinError(false); }}
              placeholder="Access code"
              className="text-center tracking-[0.3em] focus-visible:ring-0"
              style={{ backgroundColor: pt.card, borderColor: pt.border, color: pt.text }}
              maxLength={6}
              onKeyDown={(e) => e.key === "Enter" && handlePinSubmit()}
            />
            {pinError && <p className="text-xs text-red-400">Invalid access code. Please try again.</p>}
            <Button className="w-full" style={{ backgroundColor: accent, color: pt.bg }} onClick={handlePinSubmit} disabled={!pinInput}>
              Enter Portal
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  const fmt = (v: number) => formatCurrency(v);

  const projectStatusColor = (status: string) => {
    if (status === "completed") return "#4ade80";
    if (status === "active" || status === "in_progress") return accent;
    return pt.muted;
  };

  const projectStatusLabel = (status: string) => {
    if (status === "completed") return "Complete";
    if (status === "active" || status === "in_progress") return "In Progress";
    if (status === "on_hold") return "On Hold";
    return status.replace("_", " ");
  };

  const statusIcon = (status: string) => {
    if (status === "completed" || status === "paid") return <CheckCircle2 className="h-3.5 w-3.5" style={{ color: "#4ade80" }} />;
    if (status === "active" || status === "sent") return <Clock className="h-3.5 w-3.5" style={{ color: accent }} />;
    return <Clock className="h-3.5 w-3.5" style={{ color: pt.muted }} />;
  };

  const lineItems = (inv: any) => {
    try {
      const items = typeof inv.line_items === "string" ? JSON.parse(inv.line_items) : inv.line_items;
      return Array.isArray(items) ? items : [];
    } catch { return []; }
  };

  return (
    <div className="min-h-screen" style={{ fontFamily: 'Inter, sans-serif', backgroundColor: pt.bg }}>
      <div className="h-1" style={{ backgroundColor: accent }} />

      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          {/* Header with brand */}
          <div className="flex items-center gap-4 mb-2">
            {brandLogoUrl && (
              <img src={brandLogoUrl} alt="Brand" className="h-10 w-10 rounded-lg object-contain" style={{ borderColor: pt.border, borderWidth: 1, borderStyle: 'solid' }} />
            )}
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em]" style={{ color: accent }}>{brandName}</p>
              <h1 className="text-2xl md:text-3xl font-bold mt-1" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: pt.text }}>
                Welcome, {portal.clients?.name}
              </h1>
            </div>
          </div>
          <p className="mt-3 text-sm leading-relaxed max-w-lg" style={{ color: pt.muted }}>
            {String(portal.welcome_message ?? "").replace(/<[^>]*>/g, "")}
          </p>

          {/* Projects with status badges */}
          <div className="mt-10 md:mt-12">
            <h2 className="text-xs uppercase tracking-[0.15em] mb-4 flex items-center gap-2" style={{ color: pt.muted }}>
              <FolderOpen className="h-3.5 w-3.5" /> Projects
            </h2>
            {projects && projects.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {projects.map((p, i) => (
                  <motion.div key={p.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: i * 0.05 }}
                    className="rounded-lg p-4" style={{ backgroundColor: pt.card, borderColor: pt.border, borderWidth: 1, borderStyle: 'solid' }}>
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-medium" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: pt.text }}>{p.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full shrink-0 font-medium" style={{
                        backgroundColor: projectStatusColor(p.status) + "20",
                        color: projectStatusColor(p.status),
                      }}>
                        {projectStatusLabel(p.status)}
                      </span>
                    </div>
                    {p.description && <p className="text-xs mt-2 leading-relaxed" style={{ color: pt.muted }}>{p.description}</p>}
                    {(p.start_date || p.end_date) && (
                      <p className="text-[10px] mt-2" style={{ color: pt.muted + "88" }}>
                        {p.start_date && new Date(p.start_date).toLocaleDateString()}
                        {p.start_date && p.end_date && " — "}
                        {p.end_date && new Date(p.end_date).toLocaleDateString()}
                      </p>
                    )}
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-sm" style={{ color: pt.muted }}>No projects yet.</p>
            )}
          </div>

          {/* Invoices */}
          <div className="mt-10 md:mt-12">
            <h2 className="text-xs uppercase tracking-[0.15em] mb-4 flex items-center gap-2" style={{ color: pt.muted }}>
              <FileText className="h-3.5 w-3.5" /> Invoices
            </h2>
            {invoices && invoices.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {invoices.map((inv, i) => (
                  <motion.div key={inv.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: i * 0.05 }}
                    className="bg-[#171717] border border-[#262626] rounded-lg p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <FileText className="h-3.5 w-3.5 shrink-0" style={{ color: accent }} />
                          <span className="text-sm font-medium text-white" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>{inv.invoice_number}</span>
                        </div>
                        {inv.due_date && <p className="text-[10px] text-[#555] mt-1">Due {new Date(inv.due_date).toLocaleDateString()}</p>}
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full shrink-0 font-medium" style={{
                        backgroundColor: inv.status === "paid" ? "#4ade8020" : accent + "20",
                        color: inv.status === "paid" ? "#4ade80" : accent,
                      }}>
                        {inv.status === "paid" ? "Paid" : inv.status === "sent" ? "Pending" : inv.status}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-sm font-bold text-white" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>{fmt(Number(inv.amount))}</span>
                      <div className="flex gap-1">
                        <button onClick={() => setSelectedInvoice(inv)} className="p-1.5 rounded hover:bg-[#262626] transition-colors text-[#888] hover:text-white" title="View details">
                          <Eye className="h-4 w-4" />
                        </button>
                        {inv.status !== "paid" && (
                          <button onClick={() => { setUploadingId(inv.id); fileInputRef.current?.click(); }} className="p-1.5 rounded hover:bg-[#262626] transition-colors text-[#888] hover:text-white" title="Upload payment proof">
                            <Upload className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {pendingFile?.invoiceId === inv.id && (
                      <div className="mt-3 p-3 bg-[#1a1a1a] border border-[#333] rounded-md">
                        <div className="flex items-center gap-2 text-sm text-white">
                          <File className="h-4 w-4 shrink-0" style={{ color: accent }} />
                          <span className="truncate flex-1">{pendingFile.file.name}</span>
                          <span className="text-xs text-[#888] shrink-0">{(pendingFile.file.size / 1024).toFixed(0)} KB</span>
                        </div>
                        <div className="flex gap-2 mt-2">
                          <Button size="sm" className="flex-1 gap-1.5 text-xs" style={{ backgroundColor: accent, color: "#0A0A0A" }} onClick={handleSendProof} disabled={isSending}>
                            <Send className="h-3.5 w-3.5" />{isSending ? "Sending..." : "Send"}
                          </Button>
                          <Button size="sm" variant="outline" className="text-xs border-[#333] text-[#888] hover:text-white hover:bg-[#262626]" onClick={() => setPendingFile(null)} disabled={isSending}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#888]">No invoices yet.</p>
            )}
          </div>

          {/* Client Feedback Section */}
          <ClientFeedbackSection portalId={portal.id} accent={accent} clientName={portal.clients?.name ?? "Client"} projects={projects} invoices={invoices} />

          {/* Footer */}
          <div className="mt-12 md:mt-16 pt-6 border-t border-[#262626]">
            <p className="text-[10px] text-[#555] uppercase tracking-[0.15em]">
              Powered by {brandName} · Built with Kraton
            </p>
          </div>
        </motion.div>
      </div>

      <input ref={fileInputRef} type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => {
        const file = e.target.files?.[0];
        if (file && uploadingId) { setPendingFile({ invoiceId: uploadingId, file }); setUploadingId(null); }
        e.target.value = "";
      }} />

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setSelectedInvoice(null)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-[#171717] border border-[#262626] rounded-lg max-w-lg w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}>
            <div className="p-4 md:p-6 border-b border-[#262626]">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {brandLogoUrl && <img src={brandLogoUrl} alt="Brand" className="h-8 object-contain" />}
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.25em] mb-1" style={{ color: accent }}>{brandName}</p>
                    <h2 className="text-xl font-bold text-white" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>INVOICE</h2>
                    <p className="text-sm text-[#888] mt-1">{selectedInvoice.invoice_number}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedInvoice(null)} className="text-[#888] hover:text-white p-1">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-4 md:p-6 border-b border-[#262626]">
              <p className="text-[10px] uppercase tracking-[0.15em] text-[#888] mb-2">Bill To</p>
              <p className="text-sm font-medium text-white">{portal.clients?.name}</p>
              {portal.clients?.company && <p className="text-xs text-[#888]">{portal.clients.company}</p>}
              {portal.clients?.email && <p className="text-xs text-[#888]">{portal.clients.email}</p>}
              <div className="grid grid-cols-2 gap-4 mt-4">
                {selectedInvoice.due_date && (
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.15em] text-[#888]">Due Date</p>
                    <p className="text-sm text-white mt-0.5">{new Date(selectedInvoice.due_date).toLocaleDateString()}</p>
                  </div>
                )}
                <div>
                  <p className="text-[10px] uppercase tracking-[0.15em] text-[#888]">Status</p>
                  <p className="text-sm mt-0.5 uppercase font-medium" style={{ color: selectedInvoice.status === "paid" ? "#4ade80" : accent }}>{selectedInvoice.status}</p>
                </div>
              </div>
            </div>

            {lineItems(selectedInvoice).length > 0 && (
              <div className="p-4 md:p-6 border-b border-[#262626]">
                <p className="text-[10px] uppercase tracking-[0.15em] text-[#888] mb-3">Items</p>
                <div className="space-y-2">
                  {lineItems(selectedInvoice).map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-white">{item.description || item.name || `Item ${idx + 1}`}</span>
                      <span className="text-white font-medium">{fmt(Number(item.amount || 0))}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="p-4 md:p-6 border-b border-[#262626]">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-[#888]">Total</span>
                <span className="text-2xl font-bold text-white" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>{fmt(Number(selectedInvoice.amount))}</span>
              </div>
            </div>

            {selectedInvoice.notes && (
              <div className="p-4 md:p-6 border-b border-[#262626]">
                <p className="text-[10px] uppercase tracking-[0.15em] text-[#888] mb-2">Notes</p>
                <p className="text-sm text-[#888] leading-relaxed">{selectedInvoice.notes}</p>
              </div>
            )}

            {selectedInvoice.payment_proof_url && (
              <div className="p-4 md:p-6 border-b border-[#262626]">
                <p className="text-[10px] uppercase tracking-[0.15em] text-[#888] mb-2">Payment Proof</p>
                <a href={selectedInvoice.payment_proof_url} target="_blank" rel="noopener noreferrer" className="text-sm underline" style={{ color: accent }}>View uploaded proof</a>
              </div>
            )}

            <div className="p-4 md:p-6 flex flex-col sm:flex-row gap-2">
              <Button variant="outline" className="flex-1 gap-2 border-[#262626] text-white hover:bg-[#262626]" onClick={() => handleDownloadPdf(selectedInvoice)}>
                <Download className="h-4 w-4" /> Download PDF
              </Button>
              {selectedInvoice.status !== "paid" && (
                <Button variant="outline" className="flex-1 gap-2 border-[#262626] text-white hover:bg-[#262626]"
                  onClick={() => { setUploadingId(selectedInvoice.id); fileInputRef.current?.click(); }}>
                  <Upload className="h-4 w-4" /> Upload Payment Proof
                </Button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

// Client Feedback Section Component
function ClientFeedbackSection({ portalId, accent, clientName, projects, invoices }: {
  portalId: string;
  accent: string;
  clientName: string;
  projects?: any[];
  invoices?: any[];
}) {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [feedbackType, setFeedbackType] = useState<"comment" | "approval" | "revision">("comment");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");

  const { data: feedback } = useQuery({
    queryKey: ["portal-feedback", portalId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_feedback")
        .select("*")
        .eq("portal_id", portalId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const submitFeedback = useMutation({
    mutationFn: async () => {
      const payload: any = {
        portal_id: portalId,
        author_name: clientName,
        message,
        feedback_type: feedbackType,
      };
      if (selectedProjectId) payload.project_id = selectedProjectId;
      const { error } = await supabase.from("client_feedback").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portal-feedback", portalId] });
      setMessage("");
      toast.success("Feedback submitted!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const typeIcon = (type: string) => {
    if (type === "approval") return <ThumbsUp className="h-3.5 w-3.5" style={{ color: "#4ade80" }} />;
    if (type === "revision") return <RotateCcw className="h-3.5 w-3.5" style={{ color: "#f59e0b" }} />;
    return <MessageSquare className="h-3.5 w-3.5" style={{ color: accent }} />;
  };

  const typeLabel = (type: string) => {
    if (type === "approval") return "Approval";
    if (type === "revision") return "Revision Request";
    return "Comment";
  };

  return (
    <div className="mt-10 md:mt-12">
      <h2 className="text-xs uppercase tracking-[0.15em] text-[#888] mb-4 flex items-center gap-2">
        <MessageSquare className="h-3.5 w-3.5" /> Feedback
      </h2>

      {/* Submit form */}
      <div className="bg-[#171717] border border-[#262626] rounded-lg p-4">
        <div className="flex flex-wrap gap-2 mb-3">
          {(["comment", "approval", "revision"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFeedbackType(type)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] uppercase tracking-wider font-medium transition-colors ${
                feedbackType === type
                  ? "text-white"
                  : "text-[#888] hover:text-white"
              }`}
              style={feedbackType === type ? { backgroundColor: accent + "30", color: accent } : {}}
            >
              {typeIcon(type)}
              {typeLabel(type)}
            </button>
          ))}
        </div>

        {projects && projects.length > 0 && (
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="w-full mb-3 bg-[#0A0A0A] border border-[#262626] rounded-md px-3 py-2 text-xs text-white"
          >
            <option value="">General feedback</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        )}

        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Write your feedback..."
          className="bg-[#0A0A0A] border-[#262626] text-white text-sm min-h-[80px] focus-visible:ring-0"
          style={{ borderColor: accent + "30" }}
        />
        <Button
          className="mt-3 gap-1.5 text-xs"
          style={{ backgroundColor: accent, color: "#0A0A0A" }}
          onClick={() => submitFeedback.mutate()}
          disabled={!message.trim() || submitFeedback.isPending}
        >
          <Send className="h-3.5 w-3.5" />
          {submitFeedback.isPending ? "Sending..." : "Submit Feedback"}
        </Button>
      </div>

      {/* Feedback list */}
      {feedback && feedback.length > 0 && (
        <div className="mt-4 space-y-2">
          {feedback.map((fb: any) => (
            <div key={fb.id} className="bg-[#171717] border border-[#262626] rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                {typeIcon(fb.feedback_type)}
                <span className="text-[10px] uppercase tracking-wider font-medium" style={{ color: accent }}>
                  {typeLabel(fb.feedback_type)}
                </span>
                <span className="text-[10px] text-[#555] ml-auto">
                  {new Date(fb.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <p className="text-sm text-white leading-relaxed">{fb.message}</p>
              <p className="text-[10px] text-[#888] mt-1">— {fb.author_name}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ClientPortalView;
