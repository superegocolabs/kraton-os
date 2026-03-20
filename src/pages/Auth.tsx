import { useState, useMemo } from "react";
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

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const passwordChecks = useMemo(() => ({
    hasMinLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSymbol: /[^A-Za-z0-9]/.test(password),
  }), [password]);

  const isPasswordStrong = Object.values(passwordChecks).every(Boolean);
  const strengthPercent = useMemo(() => (Object.values(passwordChecks).filter(Boolean).length / 4) * 100, [passwordChecks]);
  const strengthColor = strengthPercent <= 25 ? "bg-red-500" : strengthPercent <= 50 ? "bg-orange-500" : strengthPercent <= 75 ? "bg-yellow-500" : "bg-green-500";

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
      if (error) throw error;
      toast.success("Password reset link has been sent to your email.");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSignUp && !isPasswordStrong) { toast.error("Password doesn't meet all requirements."); return; }
    setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName }, emailRedirectTo: window.location.origin } });
        if (error) throw error;
        toast.success("Check your email for the confirmation link.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate("/dashboard");
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fieldClass = "bg-transparent border-0 border-b border-border rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary font-body";

  return (
    <div className="min-h-screen flex bg-background">
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 border-r border-border">
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight text-foreground">Kraton</h1>
          <span className="text-xs font-body uppercase tracking-[0.2em] text-muted-foreground ml-1">Creative OS</span>
        </div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
          <p className="text-4xl font-display font-bold leading-tight text-foreground max-w-md">The Architectural Backbone for High-Performance Creative Studios.</p>
          <p className="mt-6 text-muted-foreground font-body max-w-sm leading-relaxed">Systems, workspace, CRM, finance tracking — everything you need to run a stable and dependable creative business.</p>
        </motion.div>
        <p className="text-xs text-muted-foreground font-body">© {new Date().getFullYear()} Kraton. All rights reserved.</p>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div className="w-full max-w-sm" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} key={isForgotPassword ? "forgot" : isSignUp ? "signup" : "signin"}>
          <div className="lg:hidden mb-10"><h1 className="text-xl font-display font-bold text-foreground">Kraton</h1></div>

          {isForgotPassword ? (
            <>
              <h2 className="text-2xl font-display font-bold text-foreground">Reset Password</h2>
              <p className="mt-2 text-sm text-muted-foreground font-body">Enter your email and we'll send you a reset link.</p>
              <form onSubmit={handleForgotPassword} className="mt-8 space-y-4">
                <div>
                  <label className="text-xs font-body font-medium text-muted-foreground uppercase tracking-wider">Email</label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={`mt-1.5 ${fieldClass}`} placeholder="you@studio.com" required />
                </div>
                <Button type="submit" variant="accent" className="w-full mt-6" disabled={loading}>{loading ? "Sending..." : "Send Reset Link"}</Button>
              </form>
              <p className="mt-6 text-center text-sm text-muted-foreground font-body">
                <button onClick={() => setIsForgotPassword(false)} className="text-primary hover:text-primary/80 font-medium transition-colors duration-150">Back to Sign In</button>
              </p>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-display font-bold text-foreground">{isSignUp ? "Create your account" : "Welcome back"}</h2>
              <p className="mt-2 text-sm text-muted-foreground font-body">{isSignUp ? "Start building your creative operating system." : "Sign in to your workspace."}</p>
              <form onSubmit={handleSubmit} className="mt-8 space-y-4">
                {isSignUp && (
                  <div>
                    <label className="text-xs font-body font-medium text-muted-foreground uppercase tracking-wider">Full Name</label>
                    <Input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className={`mt-1.5 ${fieldClass}`} placeholder="Your name" required />
                  </div>
                )}
                <div>
                  <label className="text-xs font-body font-medium text-muted-foreground uppercase tracking-wider">Email</label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={`mt-1.5 ${fieldClass}`} placeholder="you@studio.com" required />
                </div>
                <div>
                  <label className="text-xs font-body font-medium text-muted-foreground uppercase tracking-wider">Password</label>
                  <div className="relative">
                    <Input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className={`mt-1.5 pr-10 ${fieldClass}`} placeholder="••••••••" required minLength={6} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-muted-foreground hover:text-foreground transition-colors" tabIndex={-1}>
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {isSignUp && password.length > 0 && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-3 space-y-2">
                      <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                        <motion.div className={`h-full rounded-full ${strengthColor}`} initial={{ width: 0 }} animate={{ width: `${strengthPercent}%` }} transition={{ duration: 0.3 }} />
                      </div>
                      <div className="grid grid-cols-2 gap-1">
                        <PasswordRequirement met={passwordChecks.hasMinLength} label="Min. 8 characters" />
                        <PasswordRequirement met={passwordChecks.hasUppercase} label="Uppercase letter" />
                        <PasswordRequirement met={passwordChecks.hasNumber} label="Number" />
                        <PasswordRequirement met={passwordChecks.hasSymbol} label="Symbol (!@#$)" />
                      </div>
                    </motion.div>
                  )}
                </div>
                <Button type="submit" variant="accent" className="w-full mt-6" disabled={loading || (isSignUp && !isPasswordStrong && password.length > 0)}>
                  {loading ? "Loading..." : isSignUp ? "Create Account" : "Sign In"}
                </Button>
              </form>
              {!isSignUp && (
                <p className="mt-4 text-center">
                  <button onClick={() => setIsForgotPassword(true)} className="text-xs text-muted-foreground hover:text-primary font-body transition-colors duration-150">Forgot password?</button>
                </p>
              )}
              <p className="mt-4 text-center text-sm text-muted-foreground font-body">
                {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
                <button onClick={() => setIsSignUp(!isSignUp)} className="text-primary hover:text-primary/80 font-medium transition-colors duration-150">{isSignUp ? "Sign in" : "Sign up"}</button>
              </p>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;
