import { useState } from "react";
import { User } from "@supabase/supabase-js";
import { motion } from "framer-motion";
import { FileText, CheckCircle2, Lightbulb, Target, Workflow, BookOpen, Download, ChevronDown, ChevronRight, Copy, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, getCurrency, setCurrency, CURRENCIES, type CurrencyCode } from "@/lib/currency";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface FrameworksPageProps {
  user: User | null;
}

interface Template {
  id: string;
  title: string;
  description: string;
  category: string;
  content: string;
}

const templates: Template[] = [
  {
    id: "brief",
    title: "Client Brief Template",
    description: "Standardized questionnaire for new client onboarding.",
    category: "templates",
    content: `# Client Brief\n\n## Project Overview\n- Project Name:\n- Client Name:\n- Contact Email:\n- Deadline:\n\n## Objectives\n1. What is the primary goal?\n2. Who is the target audience?\n3. What is the desired outcome?\n\n## Brand Guidelines\n- Color palette:\n- Font preferences:\n- Tone of voice:\n\n## Deliverables\n- [ ] Item 1\n- [ ] Item 2\n\n## Budget\n- Estimated budget:\n- Payment terms:`,
  },
  {
    id: "proposal",
    title: "Project Proposal Template",
    description: "Professional proposal structure for pitching clients.",
    category: "templates",
    content: `# Project Proposal\n\n## Executive Summary\n[Brief overview of the project]\n\n## Scope of Work\n1. Phase 1: Discovery\n2. Phase 2: Design\n3. Phase 3: Development\n4. Phase 4: Delivery\n\n## Timeline\n| Phase | Duration | Deliverables |\n|-------|----------|-------------|\n| Discovery | 1 week | Brief, Moodboard |\n| Design | 2 weeks | Mockups, Revisions |\n\n## Investment\n- Total: [Amount]\n- 50% upfront, 50% on delivery\n\n## Terms & Conditions\n[Standard terms]`,
  },
  {
    id: "handoff",
    title: "Delivery Checklist",
    description: "Ensure nothing is missed during project handoff.",
    category: "templates",
    content: `# Delivery Checklist\n\n## Files\n- [ ] Final design files (source)\n- [ ] Exported assets (PNG, SVG, PDF)\n- [ ] Style guide document\n\n## Communication\n- [ ] Send delivery email\n- [ ] Schedule review call\n- [ ] Collect feedback\n\n## Finance\n- [ ] Send final invoice\n- [ ] Confirm payment received\n- [ ] Archive project\n\n## Follow-up\n- [ ] Request testimonial\n- [ ] Update portfolio\n- [ ] Add to case studies`,
  },
  {
    id: "feedback",
    title: "Feedback Collection Script",
    description: "Questions to ask clients after project completion.",
    category: "guides",
    content: `# Post-Project Feedback\n\n1. How would you rate the overall experience? (1-10)\n2. Was the project delivered on time?\n3. How was the communication throughout?\n4. Would you recommend us to others?\n5. What could we improve?\n6. Any additional comments?\n\n## Follow-up Actions\n- Send thank you note\n- If rating ≥ 8: Request public testimonial\n- If rating < 7: Schedule improvement call`,
  },
];

const frameworks = [
  {
    id: "discovery",
    title: "Discovery & Brief",
    icon: Lightbulb,
    description: "Initial client consultation, project scoping, mood boards, and creative direction.",
    steps: [
      { name: "Client questionnaire", detail: "Send the brief template. Collect project goals, brand guidelines, and preferences." },
      { name: "Mood board creation", detail: "Curate visual references on Pinterest or Figma. Share with client for alignment." },
      { name: "Scope definition", detail: "Define deliverables, exclusions, and revision rounds. Document in the proposal." },
      { name: "Timeline estimation", detail: "Break project into phases. Add buffer time for revisions." },
      { name: "Budget proposal", detail: "Calculate costs per deliverable. Present tiered pricing if applicable." },
    ],
    category: "pre-production",
  },
  {
    id: "proposal",
    title: "Proposal & Contract",
    icon: FileText,
    description: "Professional proposal creation, contract signing, and deposit collection.",
    steps: [
      { name: "Draft proposal", detail: "Use the proposal template. Customize per client needs." },
      { name: "Review with client", detail: "Schedule a call to walk through the proposal. Answer questions." },
      { name: "Revise if needed", detail: "Adjust scope, timeline, or pricing based on feedback." },
      { name: "Send contract", detail: "Include payment terms, IP rights, cancellation policy." },
      { name: "Collect deposit", detail: "Request 50% upfront before starting work. Create invoice in Finance." },
    ],
    category: "pre-production",
  },
  {
    id: "production",
    title: "Production Workflow",
    icon: Workflow,
    description: "Core creative execution — shoots, design sprints, editing sessions.",
    steps: [
      { name: "Pre-production planning", detail: "Create shot lists, wireframes, or design briefs. Book resources." },
      { name: "Talent/vendor coordination", detail: "Confirm availability, send call sheets, share references." },
      { name: "Execution day", detail: "Follow the plan. Document progress. Communicate any changes." },
      { name: "Raw review", detail: "Review raw output. Select best takes or directions." },
      { name: "Post-production", detail: "Edit, refine, and polish. Prepare for client review." },
    ],
    category: "production",
  },
  {
    id: "delivery",
    title: "Delivery & Handoff",
    icon: Target,
    description: "Final delivery, revisions, and client approval process.",
    steps: [
      { name: "Draft delivery", detail: "Share work-in-progress through the client portal." },
      { name: "Client review round 1", detail: "Collect structured feedback via portal comments." },
      { name: "Revisions", detail: "Implement changes within the agreed revision rounds." },
      { name: "Final approval", detail: "Get written approval via portal or email before final handoff." },
      { name: "File handoff & archiving", detail: "Use the delivery checklist. Send final invoice." },
    ],
    category: "post-production",
  },
  {
    id: "closing",
    title: "Project Closing",
    icon: CheckCircle2,
    description: "Final invoicing, feedback collection, and portfolio update.",
    steps: [
      { name: "Send final invoice", detail: "Create final invoice in Finance. Set payment terms." },
      { name: "Collect testimonial", detail: "Use the feedback script. Request written or video testimonial." },
      { name: "Update portfolio", detail: "Add project to Portfolio page with case study details." },
      { name: "Archive project files", detail: "Organize and backup all project files for future reference." },
      { name: "Follow-up email", detail: "Send a thank you. Offer ongoing retainer or maintenance." },
    ],
    category: "post-production",
  },
];

const categories = [
  { value: "all", label: "All" },
  { value: "pre-production", label: "Pre-Production" },
  { value: "production", label: "Production" },
  { value: "post-production", label: "Post-Production" },
];

const resourceCategories = [
  { value: "all", label: "All" },
  { value: "templates", label: "Templates" },
  { value: "guides", label: "Guides" },
];

export function FrameworksPage({ user }: FrameworksPageProps) {
  const [filter, setFilter] = useState("all");
  const [resourceFilter, setResourceFilter] = useState("all");
  const [currency, setCurrencyState] = useState<CurrencyCode>(getCurrency());
  const [activeTab, setActiveTab] = useState<"sops" | "resources">("sops");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCurrencyChange = (code: string) => {
    setCurrency(code as CurrencyCode);
    setCurrencyState(code as CurrencyCode);
    window.dispatchEvent(new Event("storage"));
  };

  const handleCopyTemplate = (template: Template) => {
    navigator.clipboard.writeText(template.content);
    setCopiedId(template.id);
    toast.success(`"${template.title}" copied to clipboard`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filtered = filter === "all" ? frameworks : frameworks.filter((f) => f.category === filter);
  const filteredResources = resourceFilter === "all" ? templates : templates.filter((t) => t.category === resourceFilter);

  const categoryColor: Record<string, string> = {
    "pre-production": "bg-blue-500/20 text-blue-400",
    production: "bg-primary/20 text-primary",
    "post-production": "bg-green-500/20 text-green-400",
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Frameworks</h1>
            <p className="text-sm text-muted-foreground font-body mt-1">
              SOPs, templates & guides for your creative workflows.
            </p>
          </div>
        </div>

        {/* Settings: Currency */}
        <div className="mt-6 bg-card border border-border rounded-lg p-4">
          <h3 className="text-xs font-body uppercase tracking-[0.15em] text-muted-foreground mb-3">
            Studio Settings
          </h3>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-sm font-body text-foreground">Default Currency</label>
              <Select value={currency} onValueChange={handleCurrencyChange}>
                <SelectTrigger className="w-48 bg-transparent border-border font-body">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.symbol} — {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <span className="text-xs text-muted-foreground font-body">
              Preview: {formatCurrency(1500000, currency)}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-6 flex gap-1 border-b border-border pb-0">
          {[
            { key: "sops" as const, label: "SOPs", icon: BookOpen },
            { key: "resources" as const, label: "Templates & Guides", icon: FileText },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-body uppercase tracking-wider rounded-t-md transition-colors ${
                activeTab === tab.key
                  ? "bg-card text-foreground border border-border border-b-card -mb-px"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "sops" && (
          <>
            {/* Filter */}
            <div className="mt-4 flex gap-1 flex-wrap">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setFilter(cat.value)}
                  className={`px-3 py-2 text-xs font-body uppercase tracking-wider rounded-md transition-colors duration-150 ${
                    filter === cat.value
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Frameworks Grid */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {filtered.map((fw, i) => (
                <motion.div
                  key={fw.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.05 }}
                >
                  <Card className="bg-card border-border hover:border-primary/30 transition-colors h-full">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center">
                            <fw.icon className="h-4 w-4 text-primary" />
                          </div>
                          <CardTitle className="text-base font-display">{fw.title}</CardTitle>
                        </div>
                        <Badge className={`text-[9px] uppercase tracking-wider ${categoryColor[fw.category] ?? "bg-muted text-muted-foreground"}`}>
                          {fw.category.replace("-", " ")}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-muted-foreground font-body mb-4">{fw.description}</p>
                      <Accordion type="single" collapsible className="w-full">
                        {fw.steps.map((step, si) => (
                          <AccordionItem key={si} value={`step-${si}`} className="border-border/50">
                            <AccordionTrigger className="py-2 text-xs font-body text-foreground hover:no-underline">
                              <span className="flex items-center gap-2">
                                <span className="text-[10px] font-display font-bold text-muted-foreground w-5 text-right">{si + 1}.</span>
                                {step.name}
                              </span>
                            </AccordionTrigger>
                            <AccordionContent className="text-xs text-muted-foreground font-body pl-7">
                              {step.detail}
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </>
        )}

        {activeTab === "resources" && (
          <>
            <div className="mt-4 flex gap-1 flex-wrap">
              {resourceCategories.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setResourceFilter(cat.value)}
                  className={`px-3 py-2 text-xs font-body uppercase tracking-wider rounded-md transition-colors duration-150 ${
                    resourceFilter === cat.value
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredResources.map((tmpl, i) => (
                <motion.div
                  key={tmpl.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.05 }}
                >
                  <Card className="bg-card border-border hover:border-primary/30 transition-colors h-full">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-display">{tmpl.title}</CardTitle>
                        <Badge className={`text-[9px] uppercase tracking-wider ${tmpl.category === "templates" ? "bg-primary/20 text-primary" : "bg-blue-500/20 text-blue-400"}`}>
                          {tmpl.category}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-muted-foreground font-body mb-4">{tmpl.description}</p>
                      <div className="bg-muted/50 rounded-md p-3 max-h-32 overflow-auto">
                        <pre className="text-[10px] text-muted-foreground font-mono whitespace-pre-wrap">{tmpl.content.slice(0, 200)}...</pre>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3 gap-1.5 text-xs font-body"
                        onClick={() => handleCopyTemplate(tmpl)}
                      >
                        {copiedId === tmpl.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        {copiedId === tmpl.id ? "Copied!" : "Copy to Clipboard"}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
