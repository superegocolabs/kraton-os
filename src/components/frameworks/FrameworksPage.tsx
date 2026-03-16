import { useState } from "react";
import { User } from "@supabase/supabase-js";
import { motion } from "framer-motion";
import { FileText, CheckCircle2, Lightbulb, Target, Workflow } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, getCurrency, setCurrency, CURRENCIES, type CurrencyCode } from "@/lib/currency";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FrameworksPageProps {
  user: User | null;
}

const frameworks = [
  {
    id: "discovery",
    title: "Discovery & Brief",
    icon: Lightbulb,
    description: "Initial client consultation, project scoping, mood boards, and creative direction.",
    steps: ["Client questionnaire", "Mood board creation", "Scope definition", "Timeline estimation", "Budget proposal"],
    category: "pre-production",
  },
  {
    id: "proposal",
    title: "Proposal & Contract",
    icon: FileText,
    description: "Professional proposal creation, contract signing, and deposit collection.",
    steps: ["Draft proposal", "Review with client", "Revise if needed", "Send contract", "Collect deposit"],
    category: "pre-production",
  },
  {
    id: "production",
    title: "Production Workflow",
    icon: Workflow,
    description: "Core creative execution — shoots, design sprints, editing sessions.",
    steps: ["Pre-production planning", "Talent/vendor coordination", "Execution day", "Raw review", "Post-production"],
    category: "production",
  },
  {
    id: "delivery",
    title: "Delivery & Handoff",
    icon: Target,
    description: "Final delivery, revisions, and client approval process.",
    steps: ["Draft delivery", "Client review round 1", "Revisions", "Final approval", "File handoff & archiving"],
    category: "post-production",
  },
  {
    id: "closing",
    title: "Project Closing",
    icon: CheckCircle2,
    description: "Final invoicing, feedback collection, and portfolio update.",
    steps: ["Send final invoice", "Collect testimonial", "Update portfolio", "Archive project files", "Follow-up email"],
    category: "post-production",
  },
];

const categories = [
  { value: "all", label: "All" },
  { value: "pre-production", label: "Pre-Production" },
  { value: "production", label: "Production" },
  { value: "post-production", label: "Post-Production" },
];

export function FrameworksPage({ user }: FrameworksPageProps) {
  const [filter, setFilter] = useState("all");
  const [currency, setCurrencyState] = useState<CurrencyCode>(getCurrency());

  const handleCurrencyChange = (code: string) => {
    setCurrency(code as CurrencyCode);
    setCurrencyState(code as CurrencyCode);
    // Force re-render across app by dispatching storage event
    window.dispatchEvent(new Event("storage"));
  };

  const filtered = filter === "all" ? frameworks : frameworks.filter((f) => f.category === filter);

  const categoryColor: Record<string, string> = {
    "pre-production": "bg-blue-500/20 text-blue-400",
    production: "bg-primary/20 text-primary",
    "post-production": "bg-green-500/20 text-green-400",
  };

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Frameworks</h1>
            <p className="text-sm text-muted-foreground font-body mt-1">
              Standard operating procedures & workflow templates for your studio.
            </p>
          </div>
        </div>

        {/* Settings: Currency */}
        <div className="mt-6 bg-card border border-border rounded-lg p-4">
          <h3 className="text-xs font-body uppercase tracking-[0.15em] text-muted-foreground mb-3">
            Studio Settings
          </h3>
          <div className="flex items-center gap-4">
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

        {/* Filter */}
        <div className="mt-6 flex gap-1">
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
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <div className="space-y-2">
                    {fw.steps.map((step, si) => (
                      <div key={si} className="flex items-center gap-2">
                        <span className="text-[10px] font-display font-bold text-muted-foreground w-5 text-right">
                          {si + 1}.
                        </span>
                        <span className="text-xs font-body text-foreground">{step}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
