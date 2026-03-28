import { useState, useCallback, useEffect, useRef } from "react";
import { User } from "@supabase/supabase-js";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Plus, Presentation, Trash2, Play, ArrowLeft, ChevronLeft, ChevronRight, Pencil, Maximize2, Type, GripVertical, X } from "lucide-react";
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

interface TextElement {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontWeight: string;
  color: string;
}

interface Slide {
  layout: string;
  title: string;
  subtitle: string;
  body: string;
  items: string[];
  elements?: TextElement[];
}

const TEMPLATES: Record<string, { name: string; description: string; color: string; gradient: string; slides: Slide[] }> = {
  minimal: {
    name: "Minimal",
    description: "Clean, focused presentation",
    color: "hsl(32, 30%, 63%)",
    gradient: "from-[#1a1a1a] to-[#0a0a0a]",
    slides: [
      { layout: "title", title: "Your Presentation Title", subtitle: "A brief tagline or subtitle", body: "", items: [] },
      { layout: "intro", title: "About Us", subtitle: "", body: "We are a creative studio focused on delivering exceptional results for our clients.", items: [] },
      { layout: "problem", title: "The Challenge", subtitle: "", body: "Understanding the core problem we're solving.", items: ["Market analysis", "Pain points", "Opportunities"] },
      { layout: "solution", title: "Our Approach", subtitle: "", body: "A strategic solution tailored to your needs.", items: ["Research & Discovery", "Strategy Development", "Creative Execution"] },
      { layout: "features", title: "What We Offer", subtitle: "", body: "", items: ["Brand Identity", "Web Design", "Content Strategy", "Digital Marketing"] },
      { layout: "process", title: "Our Process", subtitle: "", body: "", items: ["Discovery", "Strategy", "Design", "Development", "Launch"] },
      { layout: "work", title: "Selected Work", subtitle: "", body: "A showcase of our recent projects.", items: [] },
      { layout: "quote", title: "Working with this team transformed our brand completely.", subtitle: "— Happy Client", body: "", items: [] },
      { layout: "pricing", title: "Investment", subtitle: "", body: "Flexible packages for your goals.", items: ["Starter Package", "Growth Package", "Enterprise Package"] },
      { layout: "contact", title: "Let's Work Together", subtitle: "Get in touch to start your project", body: "hello@studio.com", items: [] },
    ],
  },
  creative: {
    name: "Creative",
    description: "Bold & vibrant visual impact",
    color: "#F96167",
    gradient: "from-[#2a0a0c] to-[#0a0a0a]",
    slides: [
      { layout: "title", title: "Creative Presentation", subtitle: "Bold ideas. Beautiful execution.", body: "", items: [] },
      { layout: "intro", title: "Who We Are", subtitle: "", body: "A team of passionate creatives pushing boundaries.", items: [] },
      { layout: "problem", title: "The Problem", subtitle: "", body: "Your brand deserves to stand out.", items: ["Low engagement", "Outdated visuals", "Unclear messaging"] },
      { layout: "solution", title: "The Solution", subtitle: "", body: "Fresh creative direction that captures attention.", items: ["Visual Identity", "Campaign Design", "Content Creation"] },
      { layout: "features", title: "Services", subtitle: "", body: "", items: ["Branding", "Photography", "Video Production", "Social Media"] },
      { layout: "process", title: "How We Work", subtitle: "", body: "", items: ["Brief", "Concept", "Create", "Refine", "Deliver"] },
      { layout: "work", title: "Our Portfolio", subtitle: "", body: "Selected projects showcasing our creative range.", items: [] },
      { layout: "quote", title: "They brought our vision to life in ways we never imagined.", subtitle: "— Creative Director, Brand Co.", body: "", items: [] },
      { layout: "pricing", title: "Packages", subtitle: "", body: "Choose the package that fits your vision.", items: ["Essential", "Professional", "Premium"] },
      { layout: "contact", title: "Ready to Create?", subtitle: "Let's make something amazing together", body: "studio@creative.com", items: [] },
    ],
  },
  corporate: {
    name: "Corporate",
    description: "Professional business style",
    color: "#065A82",
    gradient: "from-[#051a28] to-[#0a0a0a]",
    slides: [
      { layout: "title", title: "Business Proposal", subtitle: "Strategic Solutions for Growth", body: "", items: [] },
      { layout: "intro", title: "Company Overview", subtitle: "", body: "Delivering measurable results through strategic thinking.", items: [] },
      { layout: "problem", title: "Market Analysis", subtitle: "", body: "Key insights driving our recommendations.", items: ["Industry trends", "Competitive landscape", "Growth opportunities"] },
      { layout: "solution", title: "Strategic Framework", subtitle: "", body: "A comprehensive approach to your objectives.", items: ["Assessment", "Strategy", "Implementation"] },
      { layout: "features", title: "Core Capabilities", subtitle: "", body: "", items: ["Strategic Planning", "Market Research", "Brand Development", "Digital Transformation"] },
      { layout: "process", title: "Timeline", subtitle: "", body: "", items: ["Week 1-2: Discovery", "Week 3-4: Strategy", "Week 5-8: Execution", "Week 9-10: Review", "Week 11-12: Optimization"] },
      { layout: "work", title: "Case Studies", subtitle: "", body: "Proven results across industries.", items: [] },
      { layout: "quote", title: "Their strategic approach delivered a 40% increase in revenue.", subtitle: "— CEO, Enterprise Corp.", body: "", items: [] },
      { layout: "pricing", title: "Engagement Options", subtitle: "", body: "Scalable solutions for all sizes.", items: ["Consulting", "Full Service", "Retainer"] },
      { layout: "contact", title: "Next Steps", subtitle: "Schedule a consultation", body: "partnerships@company.com", items: [] },
    ],
  },
  elegant: {
    name: "Elegant",
    description: "Luxury, refined & sophisticated",
    color: "#D4AF37",
    gradient: "from-[#1a1508] to-[#0a0a0a]",
    slides: [
      { layout: "title", title: "Elegant Presentation", subtitle: "Where Luxury Meets Purpose", body: "", items: [] },
      { layout: "intro", title: "Our Philosophy", subtitle: "", body: "Crafting timeless experiences with meticulous attention to detail and uncompromising quality.", items: [] },
      { layout: "problem", title: "The Opportunity", subtitle: "", body: "Elevating your brand to match the caliber of your vision.", items: ["Premium positioning", "Refined aesthetics", "Exclusive appeal"] },
      { layout: "solution", title: "The Approach", subtitle: "", body: "A bespoke process designed for discerning clients.", items: ["Consultation", "Concept Development", "Artful Execution"] },
      { layout: "features", title: "Our Expertise", subtitle: "", body: "", items: ["Luxury Branding", "Editorial Design", "Art Direction", "Experiential Design"] },
      { layout: "process", title: "The Journey", subtitle: "", body: "", items: ["Vision", "Inspiration", "Creation", "Refinement", "Unveiling"] },
      { layout: "work", title: "Selected Portfolio", subtitle: "", body: "A curated collection of our finest work.", items: [] },
      { layout: "quote", title: "Exceptional taste and flawless execution — a true partner in luxury.", subtitle: "— Founder, Maison Luxe", body: "", items: [] },
      { layout: "pricing", title: "Investment Tiers", subtitle: "", body: "Tailored engagements for exceptional results.", items: ["Atelier", "Signature", "Bespoke"] },
      { layout: "contact", title: "Begin Your Story", subtitle: "Schedule a private consultation", body: "atelier@elegant.com", items: [] },
    ],
  },
  neon: {
    name: "Neon",
    description: "Futuristic & eye-catching",
    color: "#00F5D4",
    gradient: "from-[#001a15] to-[#0a0a0a]",
    slides: [
      { layout: "title", title: "Neon Presentation", subtitle: "The Future is Now", body: "", items: [] },
      { layout: "intro", title: "About Us", subtitle: "", body: "We build digital products that push the boundaries of what's possible.", items: [] },
      { layout: "problem", title: "The Gap", subtitle: "", body: "Your digital presence should feel as innovative as your product.", items: ["Outdated tech stack", "Poor UX", "Slow performance"] },
      { layout: "solution", title: "Our Stack", subtitle: "", body: "Cutting-edge technology with pixel-perfect execution.", items: ["React & Next.js", "AI Integration", "Real-time Systems"] },
      { layout: "features", title: "Capabilities", subtitle: "", body: "", items: ["Web Apps", "Mobile Apps", "AI/ML Solutions", "Cloud Infrastructure"] },
      { layout: "process", title: "Sprint Plan", subtitle: "", body: "", items: ["Sprint 0: Setup", "Sprint 1-2: Core", "Sprint 3-4: Features", "Sprint 5: Polish", "Sprint 6: Launch"] },
      { layout: "work", title: "Shipped Products", subtitle: "", body: "Products that millions of users love.", items: [] },
      { layout: "quote", title: "They turned our MVP into a product that raised $10M Series A.", subtitle: "— CTO, TechStart", body: "", items: [] },
      { layout: "pricing", title: "Plans", subtitle: "", body: "Scale as you grow.", items: ["Launchpad", "Growth", "Enterprise"] },
      { layout: "contact", title: "Let's Build", subtitle: "Start your project today", body: "hello@neonlab.dev", items: [] },
    ],
  },
  warmth: {
    name: "Warmth",
    description: "Cozy, personal & inviting",
    color: "#E07A5F",
    gradient: "from-[#1a0e0a] to-[#0a0a0a]",
    slides: [
      { layout: "title", title: "Warm Presentation", subtitle: "Crafted with Heart & Soul", body: "", items: [] },
      { layout: "intro", title: "Our Story", subtitle: "", body: "Born from a passion for meaningful design that connects people and brands.", items: [] },
      { layout: "problem", title: "What We See", subtitle: "", body: "Too many brands feel cold and disconnected from their audience.", items: ["Generic branding", "Lack of personality", "Weak storytelling"] },
      { layout: "solution", title: "What We Do", subtitle: "", body: "We infuse warmth and authenticity into every touchpoint.", items: ["Brand Storytelling", "Visual Identity", "Content Strategy"] },
      { layout: "features", title: "Services", subtitle: "", body: "", items: ["Brand Identity", "Packaging Design", "Photography", "Social Media"] },
      { layout: "process", title: "How It Works", subtitle: "", body: "", items: ["Coffee Chat", "Deep Dive", "Mood Board", "Design", "Launch Day"] },
      { layout: "work", title: "Featured Work", subtitle: "", body: "Projects close to our heart.", items: [] },
      { layout: "quote", title: "They captured the essence of our brand perfectly — it finally feels like us.", subtitle: "— Owner, Artisan Bakery", body: "", items: [] },
      { layout: "pricing", title: "Packages", subtitle: "", body: "Thoughtfully structured for every stage.", items: ["Seed", "Bloom", "Flourish"] },
      { layout: "contact", title: "Let's Connect", subtitle: "We'd love to hear your story", body: "hello@warmstudio.co", items: [] },
    ],
  },
  pitch: {
    name: "Pitch Deck",
    description: "Startup investor pitch",
    color: "#7C3AED",
    gradient: "from-[#0f0520] to-[#0a0a0a]",
    slides: [
      { layout: "title", title: "Company Name", subtitle: "Tagline — One sentence that captures everything", body: "", items: [] },
      { layout: "problem", title: "The Problem", subtitle: "", body: "A massive $XX billion market suffers from this critical pain point.", items: ["Pain point 1", "Pain point 2", "Pain point 3"] },
      { layout: "solution", title: "Our Solution", subtitle: "", body: "We've built the first platform that solves this elegantly.", items: ["Key differentiator 1", "Key differentiator 2", "Key differentiator 3"] },
      { layout: "features", title: "How It Works", subtitle: "", body: "", items: ["Step 1: Sign up", "Step 2: Connect", "Step 3: Grow", "Step 4: Scale"] },
      { layout: "work", title: "Traction", subtitle: "", body: "10K+ users · $500K ARR · 40% MoM growth · 95% retention", items: [] },
      { layout: "intro", title: "Business Model", subtitle: "", body: "SaaS subscription with three tiers. Average contract value $2,400/year with 120% net revenue retention.", items: [] },
      { layout: "process", title: "Go-to-Market", subtitle: "", body: "", items: ["Product-led growth", "Content marketing", "Strategic partnerships", "Enterprise sales", "Community building"] },
      { layout: "features", title: "The Team", subtitle: "", body: "", items: ["CEO — 10yr industry veteran", "CTO — Ex-Google engineer", "CMO — Growth expert", "COO — Operations leader"] },
      { layout: "pricing", title: "The Ask", subtitle: "", body: "Raising $3M Series Seed to accelerate growth.", items: ["Product development", "Team expansion", "Market expansion"] },
      { layout: "contact", title: "Thank You", subtitle: "Let's change the industry together", body: "founder@startup.com", items: [] },
    ],
  },
  portfolio: {
    name: "Portfolio",
    description: "Showcase creative work",
    color: "#EC4899",
    gradient: "from-[#1a0515] to-[#0a0a0a]",
    slides: [
      { layout: "title", title: "Creative Portfolio", subtitle: "Selected Works 2024–2025", body: "", items: [] },
      { layout: "intro", title: "Hello, I'm [Name]", subtitle: "", body: "A multidisciplinary designer specializing in brand identity, digital experiences, and visual storytelling.", items: [] },
      { layout: "features", title: "What I Do", subtitle: "", body: "", items: ["Brand Identity", "UI/UX Design", "Motion Graphics", "Art Direction"] },
      { layout: "work", title: "Project: Lumina", subtitle: "", body: "Complete rebrand for a premium wellness company. Increased brand recognition by 300%.", items: [] },
      { layout: "work", title: "Project: Vertex", subtitle: "", body: "Digital product design for a fintech startup. Launched to 50K users in first month.", items: [] },
      { layout: "work", title: "Project: Aura", subtitle: "", body: "Visual identity and packaging design for an artisan fragrance house.", items: [] },
      { layout: "quote", title: "One of the most talented designers I've ever worked with.", subtitle: "— Design Lead, Google", body: "", items: [] },
      { layout: "process", title: "My Process", subtitle: "", body: "", items: ["Listen", "Research", "Explore", "Create", "Iterate"] },
      { layout: "intro", title: "Awards & Recognition", subtitle: "", body: "Awwwards Site of the Day · Behance Featured · Communication Arts Award · Red Dot Design Award", items: [] },
      { layout: "contact", title: "Let's Create Together", subtitle: "Open for freelance & collaboration", body: "hello@designer.com", items: [] },
    ],
  },
};

function SlideRenderer({ slide, templateColor, slideIndex, totalSlides, isPresenting }: { slide: Slide; templateColor: string; slideIndex: number; totalSlides: number; isPresenting?: boolean }) {
  const isDark = slideIndex === 0 || slide.layout === "contact" || slide.layout === "quote";
  const bgClass = isDark ? "bg-foreground" : "bg-card";
  const textColor = isDark ? "text-background" : "text-foreground";
  const mutedColor = isDark ? "text-background/60" : "text-muted-foreground";
  const padClass = isPresenting ? "p-12 md:p-20" : "p-6 md:p-10";

  return (
    <div className={`w-full aspect-video ${bgClass} rounded-lg border border-border ${padClass} flex flex-col justify-center relative overflow-hidden`}>
      {/* Decorative accent line */}
      <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: templateColor }} />
      <div className="absolute top-3 right-4 text-[10px] font-body" style={{ color: templateColor }}>{slideIndex + 1} / {totalSlides}</div>

      {slide.layout === "title" && (
        <div className="text-center">
          <div className="w-12 h-1 mx-auto mb-6" style={{ backgroundColor: templateColor }} />
          <h2 className={`text-xl md:text-3xl ${isPresenting ? "lg:text-5xl" : ""} font-display font-bold ${textColor} leading-tight`}>{slide.title}</h2>
          {slide.subtitle && <p className={`text-sm md:text-base ${isPresenting ? "lg:text-xl" : ""} font-body mt-4 ${mutedColor}`}>{slide.subtitle}</p>}
        </div>
      )}

      {slide.layout === "quote" && (
        <div className="text-center max-w-2xl mx-auto">
          <div className="text-5xl mb-4 font-display" style={{ color: templateColor }}>"</div>
          <p className={`text-base md:text-lg ${isPresenting ? "lg:text-2xl" : ""} font-display font-medium ${textColor} italic leading-relaxed`}>{slide.title}</p>
          {slide.subtitle && <p className={`text-xs ${isPresenting ? "text-sm" : ""} font-body mt-6 ${mutedColor}`}>{slide.subtitle}</p>}
        </div>
      )}

      {(slide.layout === "intro" || slide.layout === "problem" || slide.layout === "solution" || slide.layout === "work") && (
        <div className="max-w-2xl">
          <div className="w-10 h-0.5 mb-6" style={{ backgroundColor: templateColor }} />
          <h3 className={`text-lg md:text-2xl ${isPresenting ? "lg:text-3xl" : ""} font-display font-bold ${textColor}`}>{slide.title}</h3>
          {slide.body && <p className={`text-sm ${isPresenting ? "text-base lg:text-lg" : ""} font-body mt-4 ${mutedColor} leading-relaxed`}>{slide.body}</p>}
          {slide.items.length > 0 && (
            <div className="mt-6 space-y-3">
              {slide.items.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: templateColor }} />
                  <span className={`text-sm ${isPresenting ? "text-base" : ""} font-body ${textColor}`}>{item}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {(slide.layout === "features" || slide.layout === "pricing") && (
        <div>
          <div className="w-10 h-0.5 mb-6" style={{ backgroundColor: templateColor }} />
          <h3 className={`text-lg md:text-2xl ${isPresenting ? "lg:text-3xl" : ""} font-display font-bold ${textColor} mb-6`}>{slide.title}</h3>
          {slide.body && <p className={`text-sm font-body mb-6 ${mutedColor}`}>{slide.body}</p>}
          <div className="grid grid-cols-2 gap-4">
            {slide.items.map((item, i) => (
              <div key={i} className="p-4 rounded-lg border border-border/50 hover:border-border transition-colors" style={{ backgroundColor: templateColor + "08" }}>
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-display font-bold mb-2" style={{ backgroundColor: templateColor + "20", color: templateColor }}>{i + 1}</div>
                <span className={`text-sm ${isPresenting ? "text-base" : ""} font-body font-medium ${textColor}`}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {slide.layout === "process" && (
        <div>
          <div className="w-10 h-0.5 mb-6" style={{ backgroundColor: templateColor }} />
          <h3 className={`text-lg md:text-2xl ${isPresenting ? "lg:text-3xl" : ""} font-display font-bold ${textColor} mb-6`}>{slide.title}</h3>
          <div className="space-y-4">
            {slide.items.map((item, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-display font-bold shrink-0" style={{ backgroundColor: templateColor, color: "#0A0A0A" }}>{i + 1}</div>
                <div className="flex-1 h-px bg-border" />
                <span className={`text-sm ${isPresenting ? "text-base" : ""} font-body ${textColor}`}>{item.replace(/^\d+\.\s*/, "")}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {slide.layout === "contact" && (
        <div className="text-center">
          <div className="w-12 h-1 mx-auto mb-6" style={{ backgroundColor: templateColor }} />
          <h3 className={`text-lg md:text-2xl ${isPresenting ? "lg:text-4xl" : ""} font-display font-bold ${textColor}`}>{slide.title}</h3>
          {slide.subtitle && <p className={`text-sm ${isPresenting ? "text-base" : ""} font-body mt-3 ${mutedColor}`}>{slide.subtitle}</p>}
          {slide.body && <p className={`text-sm ${isPresenting ? "text-lg" : ""} font-body mt-6 font-medium`} style={{ color: templateColor }}>{slide.body}</p>}
        </div>
      )}

      {/* Custom text elements */}
      {slide.elements?.map((el) => (
        <div
          key={el.id}
          className="absolute font-body select-none"
          style={{ left: `${el.x}%`, top: `${el.y}%`, fontSize: el.fontSize, fontWeight: el.fontWeight, color: el.color }}
        >
          {el.text}
        </div>
      ))}
    </div>
  );
}

export function SlideshowPage({ user }: SlideshowPageProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("minimal");
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPresenting, setIsPresenting] = useState(false);
  const [addingText, setAddingText] = useState(false);
  const [newTextValue, setNewTextValue] = useState("");
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

  // Keyboard navigation for presenting
  useEffect(() => {
    if (!isPresenting) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") setCurrentSlide(prev => Math.min(slides.length - 1, prev + 1));
      if (e.key === "ArrowLeft") setCurrentSlide(prev => Math.max(0, prev - 1));
      if (e.key === "Escape") setIsPresenting(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isPresenting, slides.length]);

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
            <p className="text-sm text-muted-foreground font-body mt-2 max-w-md mx-auto">This feature is currently in development. Stay tuned!</p>
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted text-muted-foreground text-xs font-body uppercase tracking-wider">
              <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" /> In Development
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // Fullscreen presentation
  if (isPresenting && selected) {
    return (
      <div className="fixed inset-0 bg-background z-50 flex flex-col items-center justify-center" onClick={() => setIsPresenting(false)}>
        <div className="w-full max-w-6xl px-4" onClick={(e) => e.stopPropagation()}>
          <SlideRenderer slide={slides[currentSlide]} templateColor={templateColor} slideIndex={currentSlide} totalSlides={slides.length} isPresenting />
          <div className="flex items-center justify-center gap-4 mt-6">
            <Button variant="outline" size="sm" onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))} disabled={currentSlide === 0}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground font-body">{currentSlide + 1} / {slides.length}</span>
            <Button variant="outline" size="sm" onClick={() => setCurrentSlide(Math.min(slides.length - 1, currentSlide + 1))} disabled={currentSlide === slides.length - 1}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => setIsPresenting(false)}>Exit (Esc)</Button>
          </div>
        </div>
      </div>
    );
  }

  // Editor
  if (selected) {
    const handleSlideEdit = (index: number, field: keyof Slide, value: any) => {
      const newSlides = [...slides];
      newSlides[index] = { ...newSlides[index], [field]: value };
      updateSlides.mutate({ id: selected.id, slides: newSlides });
    };

    const handleAddTextElement = () => {
      if (!newTextValue.trim()) return;
      const newSlides = [...slides];
      const currentElements = newSlides[currentSlide].elements ?? [];
      newSlides[currentSlide] = {
        ...newSlides[currentSlide],
        elements: [...currentElements, {
          id: Date.now().toString(),
          text: newTextValue.trim(),
          x: 10 + Math.random() * 30,
          y: 20 + Math.random() * 40,
          fontSize: 16,
          fontWeight: "normal",
          color: "#ffffff",
        }],
      };
      updateSlides.mutate({ id: selected.id, slides: newSlides });
      setNewTextValue("");
      setAddingText(false);
    };

    const handleRemoveTextElement = (elementId: string) => {
      const newSlides = [...slides];
      newSlides[currentSlide] = {
        ...newSlides[currentSlide],
        elements: (newSlides[currentSlide].elements ?? []).filter(e => e.id !== elementId),
      };
      updateSlides.mutate({ id: selected.id, slides: newSlides });
    };

    return (
      <div className="p-4 md:p-6 lg:p-8 max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
            <button onClick={() => { setSelectedId(null); setCurrentSlide(0); }} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors font-body">
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </button>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => { setAddingText(true); }}>
                <Type className="h-3 w-3" /> Add Text
              </Button>
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

          {/* Add Text Dialog */}
          <Dialog open={addingText} onOpenChange={setAddingText}>
            <DialogContent className="sm:max-w-sm" aria-describedby="add-text-desc">
              <DialogHeader><DialogTitle className="font-display">Add Text Element</DialogTitle></DialogHeader>
              <p id="add-text-desc" className="sr-only">Tambahkan elemen teks ke slide</p>
              <div>
                <Input value={newTextValue} onChange={(e) => setNewTextValue(e.target.value)} placeholder="Enter text..." className="bg-transparent border-border font-body"
                  onKeyDown={(e) => e.key === "Enter" && handleAddTextElement()} autoFocus />
              </div>
              <DialogFooter>
                <Button variant="accent" size="sm" onClick={handleAddTextElement} disabled={!newTextValue.trim()}>Add to Slide</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Slide preview */}
          <div className="mb-4">
            <SlideRenderer slide={slides[currentSlide]} templateColor={templateColor} slideIndex={currentSlide} totalSlides={slides.length} />
          </div>

          {/* Custom elements list */}
          {slides[currentSlide]?.elements && slides[currentSlide].elements!.length > 0 && (
            <div className="mb-4 p-3 bg-card border border-border rounded-lg">
              <p className="text-xs text-muted-foreground font-body uppercase tracking-wider mb-2">Text Elements</p>
              <div className="space-y-1.5">
                {slides[currentSlide].elements!.map((el) => (
                  <div key={el.id} className="flex items-center justify-between text-sm font-body text-foreground bg-background rounded-md px-3 py-1.5">
                    <span className="truncate">{el.text}</span>
                    <button onClick={() => handleRemoveTextElement(el.id)} className="text-muted-foreground hover:text-destructive transition-colors p-0.5">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

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
            {(slides[currentSlide]?.items?.length > 0 || ["features", "pricing", "process", "problem", "solution"].includes(slides[currentSlide]?.layout)) && (
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
                  className="bg-card border border-border rounded-lg p-5 cursor-pointer hover:border-primary/40 transition-colors group relative overflow-hidden"
                  onClick={() => setSelectedId(pres.id)}>
                  <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: template?.color ?? "hsl(32, 30%, 63%)" }} />
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
        <DialogContent className="sm:max-w-lg" aria-describedby="create-pres-desc">
          <DialogHeader><DialogTitle className="font-display">New Presentation</DialogTitle></DialogHeader>
          <p id="create-pres-desc" className="sr-only">Pilih template dan buat presentasi baru</p>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-body font-medium text-muted-foreground uppercase tracking-wider">Title</label>
              <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Presentation title" className="mt-1.5 bg-transparent border-border font-body" />
            </div>
            <div>
              <label className="text-xs font-body font-medium text-muted-foreground uppercase tracking-wider mb-3 block">Template</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {Object.entries(TEMPLATES).map(([key, tmpl]) => (
                  <button key={key} onClick={() => setSelectedTemplate(key)}
                    className={`p-2.5 rounded-lg border text-left transition-colors ${selectedTemplate === key ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary/40"}`}>
                    <div className="w-full h-1 rounded mb-2" style={{ backgroundColor: tmpl.color }} />
                    <p className="text-xs font-display font-bold text-foreground">{tmpl.name}</p>
                    <p className="text-[9px] text-muted-foreground font-body mt-0.5 line-clamp-1">{tmpl.description}</p>
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
