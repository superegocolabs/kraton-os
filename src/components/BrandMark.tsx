import { Aperture } from "lucide-react";
import { cn } from "@/lib/utils";

export function BrandMark({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground"><Aperture className="h-5 w-5" strokeWidth={2.5} /></span>
      {!compact && <span className="font-display text-xl font-bold">Kraton<span className="font-normal opacity-60">OS</span></span>}
    </div>
  );
}