import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MembershipGateProps {
  currentCount: number;
  limit: number;
  isMember: boolean;
  featureName: string;
  children: React.ReactNode;
  onUpgrade?: () => void;
}

export function MembershipGate({
  currentCount,
  limit,
  isMember,
  featureName,
  children,
  onUpgrade,
}: MembershipGateProps) {
  if (isMember || currentCount < limit) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      <div className="pointer-events-none opacity-40">{children}</div>
      <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg">
        <div className="text-center p-6 max-w-sm">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-lg font-display font-bold text-foreground mb-2">
            Upgrade Membership
          </h3>
          <p className="text-sm text-muted-foreground font-body mb-4">
            Anda sudah mencapai batas {limit} {featureName} untuk akun gratis.
            Upgrade membership untuk menambah lebih banyak.
          </p>
          {onUpgrade && (
            <Button variant="accent" onClick={onUpgrade}>
              Upgrade Sekarang
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
