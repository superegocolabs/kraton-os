import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Nav */}
      <nav className="h-14 flex items-center justify-between px-6 lg:px-12 border-b border-border">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-display font-bold text-foreground">Kraton</span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-[0.15em] font-body">
            Creative OS
          </span>
        </div>
        <Button
          variant="ghost"
          className="text-sm font-body text-muted-foreground hover:text-foreground"
          onClick={() => navigate("/auth")}
        >
          Sign In
        </Button>
      </nav>

      {/* Hero */}
      <div className="flex-1 flex items-center justify-center px-6 lg:px-12">
        <motion.div
          className="max-w-2xl text-center"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <p className="text-xs font-body uppercase tracking-[0.2em] text-primary mb-6">
            Creative Business Operating System
          </p>
          <h1 className="text-4xl md:text-6xl font-display font-extrabold leading-[1.1] text-foreground">
            The Architectural Backbone for Your Creative Studio.
          </h1>
          <p className="mt-6 text-base md:text-lg text-muted-foreground font-body max-w-lg mx-auto leading-relaxed">
            From landing clients to tracking finances — Kraton is the complete system for running a stable, dependable creative business.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Button
              variant="accent"
              size="lg"
              onClick={() => navigate("/auth")}
              className="gap-2"
            >
              Get Started <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Features */}
      <div className="border-t border-border px-6 lg:px-12 py-16">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              num: "01",
              title: "Pre-Made Frameworks",
              desc: "Exact steps to find, pitch, and land clients. From proposals and contracts to onboarding — each step is clear.",
            },
            {
              num: "02",
              title: "Logical Workspace",
              desc: "Manage finances, CRM, invoices, marketing, and daily projects in one unified spot. Never get lost in tabs again.",
            },
            {
              num: "03",
              title: "Client Portals",
              desc: "Customisable, sharable client portals that keep you and your clients organised, happy, and recurring.",
            },
          ].map((f, i) => (
            <motion.div
              key={f.num}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 + i * 0.08 }}
            >
              <span className="text-primary font-display font-bold text-sm">{f.num}</span>
              <h3 className="mt-2 text-lg font-display font-bold text-foreground">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground font-body leading-relaxed">
                {f.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border px-6 lg:px-12 py-6">
        <p className="text-xs text-muted-foreground font-body text-center">
          © {new Date().getFullYear()} Kraton — Creative Operating System. All rights reserved.
        </p>
      </footer>
    </div>
  );
};

export default Index;
