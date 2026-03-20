import { useState, useCallback } from "react";
import { User } from "@supabase/supabase-js";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Plus, Presentation, Trash2, Play, ArrowLeft, ChevronLeft, ChevronRight, Edit3, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface SlideshowPageProps { user: User | null; }

interface Slide {
  layout: string;
  title: string;
  subtitle: string;
  body: string;
  items: string[];
}

const TEMPLATES: Record<string, { name: string; description: string; color: string; slides: Slide[] }> = {
  minimal: {
    name: "Minimal",
    description: "Clean, focused presentation with elegant typography",
    color: "hsl(32, 30%, 63%)",
    slides: [
      { layout: "title", title: "Your Presentation Title", subtitle: "A brief tagline or subtitle", body: "", items: [] },
      { layout: "intro", title: "About Us", subtitle: "", body: "We are a creative studio focused on delivering exceptional results for our clients.", items: [] },
      { layout: "problem", title: "The Challenge", subtitle: "", body: "Understanding the core problem we're solving for your business.", items: ["Market analysis", "Pain points", "Opportunities"] },
      { layout: "solution", title: "Our Approach", subtitle: "", body: "A strategic solution tailored to your specific needs.", items: ["Research & Discovery", "Strategy Development", "Creative Execution"] },
      { layout: "features", title: "What We Offer", subtitle: "", body: "", items: ["Brand Identity", "Web Design", "Content Strategy", "Digital Marketing"] },
      { layout: "process", title: "Our Process", subtitle: "", body: "", items: ["1. Discovery", "2. Strategy", "3. Design", "4. Development", "5. Launch"] },
      { layout: "work", title: "Selected Work", subtitle: "", body: "A showcase of our recent projects and collaborations.", items: [] },
      { layout: "quote", title: '"Working with this team transformed our brand completely."', subtitle: "— Happy Client", body: "", items: [] },
      { layout: "pricing", title: "Investment", subtitle: "", body: "Flexible packages designed to fit your budget and goals.", items: ["Starter Package", "Growth Package", "Enterprise Package"] },
      { layout: "contact", title: "Let's Work Together", subtitle: "Get in touch to start your project", body: "hello@studio.com", items: [] },
    ],
  },
  creative: {
    name: "Creative",
    description: "Bold and vibrant with strong visual impact",
    color: "#F96167",
    slides: [
      { layout: "title", title: "Creative Presentation", subtitle: "Bold ideas. Beautiful execution.", body: "", items: [] },
      { layout: "intro", title: "Who We Are", subtitle: "", body: "A team of passionate creatives pushing boundaries in design and storytelling.", items: [] },
      { layout: "problem", title: "The Problem", subtitle: "", body: "Your brand deserves to stand out in a crowded market.", items: ["Low engagement", "Outdated visuals", "Unclear messaging"] },
      { layout: "solution", title: "The Solution", subtitle: "", body: "Fresh, bold creative direction that captures attention and drives results.", items: ["Visual Identity", "Campaign Design", "Content Creation"] },
      { layout: "features", title: "Services", subtitle: "", body: "", items: ["Branding", "Photography", "Video Production", "Social Media"] },
      { layout: "process", title: "How We Work", subtitle: "", body: "", items: ["1. Brief", "2. Concept", "3. Create", "4. Refine", "5. Deliver"] },
      { layout: "work", title: "Our Portfolio", subtitle: "", body: "Selected projects that showcase our creative range.", items: [] },
      { layout: "quote", title: '"They brought our vision to life in ways we never imagined."', subtitle: "— Creative Director, Brand Co.", body: "", items: [] },
      { layout: "pricing", title: "Packages", subtitle: "", body: "Choose the package that fits your vision.", items: ["Essential", "Professional", "Premium"] },
      { layout: "contact", title: "Ready to Create?", subtitle: "Let's make something amazing together", body: "studio@creative.com", items: [] },
    ],
  },
  corporate: {
    name: "Corporate",
    description: "Professional and structured for business presentations",
    color: "#065A82",
    slides: [
      { layout: "title", title: "Business Proposal", subtitle: "Strategic Solutions for Growth", body: "", items: [] },
      { layout: "intro", title: "Company Overview", subtitle: "", body: "Delivering measurable results through strategic thinking and professional execution.", items: [] },
      { layout: "problem", title: "Market Analysis", subtitle: "", body: "Key insights driving our strategic recommendations.", items: ["Industry trends", "Competitive landscape", "Growth opportunities"] },
      { layout: "solution", title: "Strategic Framework", subtitle: "", body: "A comprehensive approach to achieving your business objectives.", items: ["Phase 1: Assessment", "Phase 2: Strategy", "Phase 3: Implementation"] },
      { layout: "features", title: "Core Capabilities", subtitle: "", body: "", items: ["Strategic Planning", "Market Research", "Brand Development", "Digital Transformation"] },
      { layout: "process", title: "Implementation Timeline", subtitle: "", body: "", items: ["Week 1-2: Discovery", "Week 3-4: Strategy", "Week 5-8: Execution", "Week 9-10: Review", "Week 11-12: Optimization"] },
      { layout: "work", title: "Case Studies", subtitle: "", body: "Proven results across industries and markets.", items: [] },
      { layout: "quote", title: '"Their strategic approach delivered a 40% increase in revenue."', subtitle: "— CEO, Enterprise Corp.", body: "", items: [] },
      { layout: "pricing", title: "Engagement Options", subtitle: "", body: "Scalable solutions for businesses of all sizes.", items: ["Consulting", "Full Service", "Retainer"] },
      { layout: "contact", title: "Next Steps", subtitle: "Schedule a consultation to discuss your goals", body: "partnerships@company.com", items: [] },
    ],
  },
};

function SlideRenderer({ slide, templateColor, slideIndex, totalSlides }: { slide: Slide; templateColor: string; slideIndex: number; totalSlides: number }) {
  const bg = slideIndex === 0 || slide.layout === "contact" || slide.layout === "quote" ? "bg-foreground" : "bg-card";
  const textColor = slideIndex === 0 || slide.layout === "contact" || slide.layout === "quote" ? "text-background" : "text-foreground";
  const mutedColor = slideIndex === 0 || slide.layout === "contact" || slide.layout === "quote" ? "text-background/60" : "text-muted-foreground";

  return (
    <div className={`w-full aspect-video ${bg} rounded-lg border border-border p-6 md:p-10 flex flex-col justify-center relative overflow-hidden`}>
      <div className="absolute top-3 right-4 text-[10px] font-body" style={{ color: templateColor }}>{slideIndex + 1} / {totalSlides}</div>

      {slide.layout === "title" && (
        <div className="text-center">
          <h2 className={`text-xl md:text-3xl font-display font-bold ${textColor} leading-tight`}>{slide.title}</h2>
          {slide.subtitle && <p className={`text-sm md:text-base font-body mt-3 ${mutedColor}`}>{slide.subtitle}</p>}
        </div>
      )}

      {slide.layout === "quote" && (
        <div className="text-center max-w-lg mx-auto">
          <div className="text-4xl mb-4" style={{ color: templateColor }}>"</div>
          <p className={`text-base md:text-lg font-display font-medium ${textColor} italic leading-relaxed`}>{slide.title.replace(/"/g, "")}</p>
          {slide.subtitle && <p className={`text-xs font-body mt-4 ${mutedColor}`}>{slide.subtitle}</p>}
        </div>
      )}

      {(slide.layout === "intro" || slide.layout === "problem" || slide.layout === "solution" || slide.layout === "work") && (
        <div>
          <div className="w-8 h-0.5 mb-4" style={{ backgroundColor: templateColor }} />
          <h3 className={`text-lg md:text-xl font-display font-bold ${textColor}`}>{slide.title}</h3>
          {slide.body && <p className={`text-sm font-body mt-3 ${mutedColor} leading-relaxed max-w-lg`}>{slide.body}</p>}
          {slide.items.length > 0 && (
            <div className="mt-4 space-y-2">
              {slide.items.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: templateColor }} />
                  <span className={`text-sm font-body ${textColor}`}>{item}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {(slide.layout === "features" || slide.layout === "pricing") && (
        <div>
          <div className="w-8 h-0.5 mb-4" style={{ backgroundColor: templateColor }} />
          <h3 className={`text-lg md:text-xl font-display font-bold ${textColor} mb-4`}>{slide.title}</h3>
          {slide.body && <p className={`text-sm font-body mb-4 ${mutedColor}`}>{slide.body}</p>}
          <div className="grid grid-cols-2 gap-3">
            {slide.items.map((item, i) => (
              <div key={i} className="p-3 rounded-md border border-border/50">
                <span className={`text-sm font-body font-medium ${textColor}`}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {slide.layout === "process" && (
        <div>
          <div className="w-8 h-0.5 mb-4" style={{ backgroundColor: templateColor }} />
          <h3 className={`text-lg md:text-xl font-display font-bold ${textColor} mb-4`}>{slide.title}</h3>
          <div className="space-y-3">
            {slide.items.map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-display font-bold shrink-0" style={{ backgroundColor: templateColor, color: "#0A0A0A" }}>{i + 1}</div>
                <span className={`text-sm font-body ${textColor}`}>{item.replace(/^\d+\.\s*/, "")}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {slide.layout === "contact" && (
        <div className="text-center">
          <h3 className={`text-lg md:text-2xl font-display font-bold ${textColor}`}>{slide.title}</h3>
          {slide.subtitle && <p className={`text-sm font-body mt-2 ${mutedColor}`}>{slide.subtitle}</p>}
          {slide.body && <p className="text-sm font-body mt-4 font-medium" style={{ color: templateColor }}>{slide.body}</p>}
        </div>
      )}
    </div>
  );
}

export function SlideshowPage({ user }: SlideshowPageProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("minimal");
  const [currentSlide, setCurrentSlide] = useState(0);
  const [editingSlide, setEditingSlide] = useState<number | null>(null);
  const [isPresenting, setIsPresenting] = useState(false);
  const queryClient = useQueryClient();

  // Check feature flag
  const { data: featureFlag } = useQuery({
    queryKey: ["app-settings", "feature_slideshow"],
    queryFn: async () => {
      const { data, error } = await supabase.from("app_settings").select("*").eq("key", "feature_slideshow").maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const isEnabled = featureFlag ? ((featureFlag as any).value as any)?.enabled === true : false;

  const { data: presentations, isLoading } = useQuery({
    queryKey: ["presentations"],
    queryFn: async () => {
      const { data, error } = await supabase.from("presentations").select("*").order("updated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: isEnabled,
  });

  const createPresentation = useMutation({
    mutationFn: async () => {
      const template = TEMPLATES[selectedTemplate];
      const { error } = await supabase.from("presentations").insert({
        user_id: user!.id, title: newTitle.trim() || "Untitled Presentation",
        template: selectedTemplate, slides: template.slides,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["presentations"] }); toast.success("Presentation created."); setCreateOpen(false); setNewTitle(""); },
    onError: (err: any) => toast.error(err.message),
  });

  const deletePresentation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("presentations").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["presentations"] }); toast.success("Presentation deleted."); setSelectedId(null); },
    onError: (err: any) => toast.error(err.message),
  });

  const updateSlides = useMutation({
    mutationFn: async ({ id, slides }: { id: string; slides: Slide[] }) => {
      const { error } = await supabase.from("presentations").update({ slides, updated_at: new Date().toISOString() } as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["presentations"] }); },
  });

  const selected = presentations?.find((p) => p.id === selectedId);
  const slides: Slide[] = selected ? (selected as any).slides ?? [] : [];
  const templateColor = selected ? TEMPLATES[(selected as any).template]?.color ?? "hsl(32, 30%, 63%)" : "hsl(32, 30%, 63%)";

  // Feature disabled state
  if (!isEnabled) {
    return (
      <div className="p-4 md:p-6 lg:p-8 max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Presentation className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-display font-bold text-foreground">Slideshow</h2>
            <p className="text-sm text-muted-foreground font-body mt-2 max-w-md mx-auto">
              This feature is currently in development. Stay tuned for updates!
            </p>
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted text-muted-foreground text-xs font-body uppercase tracking-wider">
              <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
              In Development
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // Presentation view (fullscreen-like)
  if (isPresenting && selected) {
    return (
      <div className="fixed inset-0 bg-background z-50 flex items-center justify-center" onClick={() => setIsPresenting(false)}>
        <div className="w-full max-w-5xl px-4" onClick={(e) => e.stopPropagation()}>
          <SlideRenderer slide={slides[currentSlide]} templateColor={templateColor} slideIndex={currentSlide} totalSlides={slides.length} />
          <div className="flex items-center justify-center gap-4 mt-4">
            <Button variant="outline" size="sm" onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))} disabled={currentSlide === 0}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs text-muted-foreground font-body">{currentSlide + 1} / {slides.length}</span>
            <Button variant="outline" size="sm" onClick={() => setCurrentSlide(Math.min(slides.length - 1, currentSlide + 1))} disabled={currentSlide === slides.length - 1}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => setIsPresenting(false)}>Exit</Button>
          </div>
        </div>
      </div>
    );
  }

  // Single presentation editor
  if (selected) {
    const handleSlideEdit = (index: number, field: keyof Slide, value: any) => {
      const newSlides = [...slides];
      newSlides[index] = { ...newSlides[index], [field]: value };
      updateSlides.mutate({ id: selected.id, slides: newSlides });
    };

    return (
      <div className="p-4 md:p-6 lg:p-8 max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <div className="flex items-center justify-between mb-6 gap-4">
            <button onClick={() => { setSelectedId(null); setCurrentSlide(0); }} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors font-body">
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </button>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => { setCurrentSlide(0); setIsPresenting(true); }}>
                <Play className="h-3 w-3" /> Present
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-destructive"><Trash2 className="h-3 w-3" /> Delete</Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-card border-border">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="font-display">Delete presentation?</AlertDialogTitle>
                    <AlertDialogDescription className="font-body text-muted-foreground">This will permanently delete this presentation.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="font-body">Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => deletePresentation.mutate(selected.id)} className="bg-destructive text-destructive-foreground font-body">Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          <h1 className="text-xl font-display font-bold text-foreground mb-1">{(selected as any).title}</h1>
          <p className="text-xs text-muted-foreground font-body mb-6 uppercase tracking-wider">Template: {TEMPLATES[(selected as any).template]?.name ?? (selected as any).template}</p>

          {/* Slide preview */}
          <div className="mb-4">
            <SlideRenderer slide={slides[currentSlide]} templateColor={templateColor} slideIndex={currentSlide} totalSlides={slides.length} />
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mb-6">
            <Button variant="outline" size="sm" onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))} disabled={currentSlide === 0}>
              <ChevronLeft className="h-4 w-4 mr-1" /> Prev
            </Button>
            <span className="text-sm text-muted-foreground font-body">{currentSlide + 1} / {slides.length}</span>
            <Button variant="outline" size="sm" onClick={() => setCurrentSlide(Math.min(slides.length - 1, currentSlide + 1))} disabled={currentSlide === slides.length - 1}>
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>

          {/* Edit current slide */}
          <div className="bg-card border border-border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-body uppercase tracking-wider text-muted-foreground">Edit Slide {currentSlide + 1}</h3>
              <span className="text-[10px] font-body text-muted-foreground uppercase">{slides[currentSlide]?.layout}</span>
            </div>
            <div>
              <label className="text-xs font-body text-muted-foreground">Title</label>
              <Input value={slides[currentSlide]?.title ?? ""} onChange={(e) => handleSlideEdit(currentSlide, "title", e.target.value)} className="mt-1 bg-transparent border-border font-body" />
            </div>
            <div>
              <label className="text-xs font-body text-muted-foreground">Subtitle</label>
              <Input value={slides[currentSlide]?.subtitle ?? ""} onChange={(e) => handleSlideEdit(currentSlide, "subtitle", e.target.value)} className="mt-1 bg-transparent border-border font-body" />
            </div>
            <div>
              <label className="text-xs font-body text-muted-foreground">Body</label>
              <Textarea value={slides[currentSlide]?.body ?? ""} onChange={(e) => handleSlideEdit(currentSlide, "body", e.target.value)} className="mt-1 bg-transparent border-border font-body min-h-[60px]" />
            </div>
            {slides[currentSlide]?.items?.length > 0 && (
              <div>
                <label className="text-xs font-body text-muted-foreground">Items (one per line)</label>
                <Textarea
                  value={(slides[currentSlide]?.items ?? []).join("\n")}
                  onChange={(e) => handleSlideEdit(currentSlide, "items", e.target.value.split("\n"))}
                  className="mt-1 bg-transparent border-border font-body min-h-[80px]"
                />
              </div>
            )}
          </div>

          {/* Slide thumbnails */}
          <div className="mt-6 grid grid-cols-5 gap-2">
            {slides.map((slide, i) => (
              <button key={i} onClick={() => setCurrentSlide(i)}
                className={`aspect-video rounded border text-[8px] font-body p-1 truncate transition-colors ${i === currentSlide ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground hover:border-primary/40"}`}>
                {i + 1}. {slide.title.slice(0, 20)}
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  // List view
  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-xl md:text-2xl font-display font-bold text-foreground">Slideshow</h1>
            <p className="text-sm text-muted-foreground font-body mt-1">Create presentations for client pitches.</p>
          </div>
          <Button variant="accent" className="gap-2 shrink-0" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" /> <span className="hidden sm:inline">New Presentation</span>
          </Button>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading ? (
            <div className="col-span-full text-center py-12 text-muted-foreground font-body text-sm">Loading...</div>
          ) : presentations?.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Presentation className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground font-body text-sm">No presentations yet. Create your first one!</p>
            </div>
          ) : (
            presentations?.map((pres) => {
              const template = TEMPLATES[(pres as any).template];
              return (
                <motion.div key={pres.id} whileHover={{ y: -2 }}
                  className="bg-card border border-border rounded-lg p-5 cursor-pointer hover:border-primary/40 transition-colors group relative"
                  onClick={() => setSelectedId(pres.id)}>
                  <div className="absolute top-0 left-0 right-0 h-1 rounded-t-lg" style={{ backgroundColor: template?.color ?? "hsl(32, 30%, 63%)" }} />
                  <div className="flex items-start justify-between mt-1">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-display font-bold text-foreground truncate">{(pres as any).title}</h3>
                      <p className="text-xs text-muted-foreground font-body mt-1">{template?.name ?? (pres as any).template} · {((pres as any).slides as Slide[])?.length ?? 0} slides</p>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button onClick={(e) => e.stopPropagation()} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all p-1">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-card border-border" onClick={(e) => e.stopPropagation()}>
                        <AlertDialogHeader>
                          <AlertDialogTitle className="font-display">Delete presentation?</AlertDialogTitle>
                          <AlertDialogDescription className="font-body text-muted-foreground">This will permanently delete this presentation.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="font-body">Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deletePresentation.mutate(pres.id)} className="bg-destructive text-destructive-foreground font-body">Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                  <p className="text-[10px] text-muted-foreground font-body mt-3 uppercase tracking-wider">{new Date((pres as any).updated_at).toLocaleDateString()}</p>
                </motion.div>
              );
            })
          )}
        </div>
      </motion.div>

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle className="font-display">New Presentation</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-body font-medium text-muted-foreground uppercase tracking-wider">Title</label>
              <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Presentation title" className="mt-1.5 bg-transparent border-border font-body" />
            </div>
            <div>
              <label className="text-xs font-body font-medium text-muted-foreground uppercase tracking-wider mb-3 block">Template</label>
              <div className="grid grid-cols-3 gap-3">
                {Object.entries(TEMPLATES).map(([key, tmpl]) => (
                  <button key={key} onClick={() => setSelectedTemplate(key)}
                    className={`p-3 rounded-lg border text-left transition-colors ${selectedTemplate === key ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary/40"}`}>
                    <div className="w-full h-1 rounded mb-2" style={{ backgroundColor: tmpl.color }} />
                    <p className="text-sm font-display font-bold text-foreground">{tmpl.name}</p>
                    <p className="text-[10px] text-muted-foreground font-body mt-0.5">{tmpl.description}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="accent" onClick={() => createPresentation.mutate()} disabled={createPresentation.isPending}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
