import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Eye, EyeOff, Check, X } from "lucide-react";

const PasswordRequirement = ({ met, label }: { met: boolean; label: string }) => (
  <div className="flex items-center gap-1.5">
    {met ? <Check className="h-3 w-3 text-green-500" /> : <X className="h-3 w-3 text-muted-foreground/50" />}
    <span className={`text-xs font-body ${met ? "text-green-500" : "text-muted-foreground/60"}`}>{label}</span>
  </div>
);

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Supabase will auto-exchange the token from the URL hash
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const passwordChecks = useMemo(() => ({
    hasMinLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSymbol: /[^A-Za-z0-9]/.test(password),
  }), [password]);

  const isPasswordStrong = Object.values(passwordChecks).every(Boolean);
  const strengthPercent = useMemo(() => (Object.values(passwordChecks).filter(Boolean).length / 4) * 100, [passwordChecks]);
  const strengthColor = strengthPercent <= 25 ? "bg-red-500" : strengthPercent <= 50 ? "bg-orange-500" : strengthPercent <= 75 ? "bg-yellow-500" : "bg-green-500";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Password tidak cocok.");
      return;
    }
    if (!isPasswordStrong) {
      toast.error("Password belum memenuhi semua persyaratan.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password berhasil diperbarui!");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fieldClass = "bg-transparent border-0 border-b border-border rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary font-body";

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground font-body">Memverifikasi link reset...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-8">
      <motion.div
        className="w-full max-w-sm"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-xl font-display font-bold text-foreground mb-1">KratonOS</h1>
        <h2 className="text-2xl font-display font-bold text-foreground mt-6">Buat Password Baru</h2>
        <p className="mt-2 text-sm text-muted-foreground font-body">
          Masukkan password baru untuk akun Anda.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label className="text-xs font-body font-medium text-muted-foreground uppercase tracking-wider">
              Password Baru
            </label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`mt-1.5 pr-10 ${fieldClass}`}
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {password.length > 0 && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-3 space-y-2">
                <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                  <motion.div className={`h-full rounded-full ${strengthColor}`} initial={{ width: 0 }} animate={{ width: `${strengthPercent}%` }} transition={{ duration: 0.3 }} />
                </div>
                <div className="grid grid-cols-2 gap-1">
                  <PasswordRequirement met={passwordChecks.hasMinLength} label="Min. 8 karakter" />
                  <PasswordRequirement met={passwordChecks.hasUppercase} label="Huruf kapital" />
                  <PasswordRequirement met={passwordChecks.hasNumber} label="Angka" />
                  <PasswordRequirement met={passwordChecks.hasSymbol} label="Simbol (!@#$)" />
                </div>
              </motion.div>
            )}
          </div>

          <div>
            <label className="text-xs font-body font-medium text-muted-foreground uppercase tracking-wider">
              Konfirmasi Password
            </label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`mt-1.5 ${fieldClass}`}
              placeholder="••••••••"
              required
            />
            {confirmPassword.length > 0 && password !== confirmPassword && (
              <p className="text-xs text-red-500 mt-1 font-body">Password tidak cocok</p>
            )}
          </div>

          <Button type="submit" variant="accent" className="w-full mt-6" disabled={loading || !isPasswordStrong}>
            {loading ? "Updating..." : "Perbarui Password"}
          </Button>
        </form>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
