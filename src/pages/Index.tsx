import { useNavigate } from "react-router-dom";
import { ArrowRight, ArrowUpRight, FolderOpen, Layers, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/BrandMark";
import studio from "@/assets/kraton-studio.png.asset.json";

const Index = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background">
      <nav className="flex h-20 items-center justify-between border-b border-border px-6 lg:px-12">
        <BrandMark />
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => navigate("/auth")}>Sign in</Button>
          <Button className="hidden sm:inline-flex" onClick={() => navigate("/auth")} >Open workspace <ArrowUpRight /></Button>
        </div>
      </nav>
      <section className="relative isolate flex min-h-[520px] items-center overflow-hidden bg-cover px-6 py-16 text-cover-foreground lg:min-h-[580px] lg:px-12">
        <img src={studio.url} alt="Mint and lilac studio sculptures with polished chrome" className="absolute inset-0 -z-10 h-full w-full object-cover object-[65%_center]" />
        <div className="absolute inset-0 -z-10 bg-cover/65 sm:bg-cover/20" />
        <div className="w-full max-w-7xl mx-auto">
          <div className="max-w-lg">
            <p className="mb-6 flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-cover-accent"><span className="h-1.5 w-1.5 rounded-full bg-cover-accent" /> A little structure. More possibility.</p>
            <h1 className="font-display text-5xl font-bold leading-[1.1] sm:text-7xl">KratonOS<span className="block mt-3 text-3xl font-medium leading-tight sm:text-4xl">Space for your<br />next great thing.</span></h1>
            <p className="mt-6 max-w-sm text-base leading-relaxed text-cover-muted">Your projects, your people, your ideas.<br />One connected home for your creative studio.</p>
            <Button size="lg" onClick={() => navigate("/auth")} className="mt-8 bg-cover-accent text-cover hover:bg-cover-accent/90">Enter your workspace <ArrowRight /></Button>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-12 lg:py-12">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-3"><h2 className="text-2xl font-semibold">Less scattered. More connected.</h2><span className="text-xs text-muted-foreground">Made for the way studios work.</span></div>
        <div className="grid gap-8 md:grid-cols-3">
          {[
            { icon: FolderOpen, title: "Your studio, in sync", desc: "Projects, clients, and finances — together, from first conversation to final delivery.", color: "bg-secondary text-secondary-foreground", number: "01" },
            { icon: Layers, title: "Room for your ideas", desc: "Boards, notes, and presentations that turn a spark of inspiration into something real.", color: "bg-highlight text-highlight-foreground", number: "02" },
            { icon: Globe, title: "A better client experience", desc: "A personal, branded space to share progress, invoices, and the work you're proud of.", color: "bg-coral text-coral-foreground", number: "03" },
          ].map(({ icon: Icon, ...item }) => <div key={item.number} className="border-t border-border pt-6"><div className="flex items-center justify-between"><span className={`flex h-10 w-10 items-center justify-center rounded-md ${item.color}`}><Icon className="h-5 w-5" /></span><span className="text-xs text-muted-foreground">/{item.number}</span></div><h3 className="mt-5 text-lg font-semibold">{item.title}</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.desc}</p></div>)}
        </div>
      </section>
      <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-border px-6 py-6 text-xs text-muted-foreground lg:px-12"><span>© {new Date().getFullYear()} KratonOS</span><span>A home for creative work.</span></footer>
    </div>
  );
};
export default Index;
