import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Mail, Lock, User, Eye, EyeOff } from "lucide-react";
import medicoAiLogo from "@/assets/medicoai-logo.png";

const Auth = () => {
  const { user, loading, signUp, signIn, resetPassword } = useAuth();
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [studentName, setStudentName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-secondary" />
      </div>
    );
  }

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return toast.error("Enter your email");
    
    setSubmitting(true);
    try {
      if (mode === "forgot") {
        const { error } = await resetPassword(email);
        if (error) throw error;
        toast.success("Password reset email sent! Check your inbox.");
        setMode("login");
      } else if (mode === "signup") {
        if (password.length < 6) return toast.error("Password must be at least 6 characters");
        const { error } = await signUp(email, password, studentName);
        if (error) throw error;
        toast.success("Account created! Check your email to verify your account.");
      } else {
        const { error } = await signIn(email, password);
        if (error) throw error;
        toast.success("Welcome back! 🩺");
      }
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <img src={medicoAiLogo} alt="MedicoAI Learn logo" width={64} height={64} className="mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-foreground">MedicoAI Learn</h1>
          <p className="text-sm text-muted-foreground mt-1">Your AI-powered MBBS &amp; BDS study companion</p>
        </div>

        <Card className="border-none shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">
              {mode === "login" ? "Welcome Back" : mode === "signup" ? "Create Account" : "Reset Password"}
            </CardTitle>
            <CardDescription className="text-xs">
              {mode === "login" ? "Sign in to sync your progress" : mode === "signup" ? "Start your medical study journey" : "We'll send you a reset link"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-3">
              {mode === "signup" && (
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input value={studentName} onChange={e => setStudentName(e.target.value)} placeholder="Your name" className="pl-9" />
                </div>
              )}
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address" className="pl-9" required />
              </div>
              {mode !== "forgot" && (
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Password"
                    className="pl-9 pr-9"
                    required
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              )}
              <Button type="submit" className="w-full gradient-dental text-primary-foreground font-semibold" disabled={submitting}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : mode === "login" ? "Sign In" : mode === "signup" ? "Create Account" : "Send Reset Link"}
              </Button>
            </form>

            <div className="mt-4 space-y-2 text-center">
              {mode === "login" && (
                <>
                  <button onClick={() => setMode("forgot")} className="text-xs text-secondary hover:underline block mx-auto">Forgot password?</button>
                  <p className="text-xs text-muted-foreground">
                    Don't have an account?{" "}
                    <button onClick={() => setMode("signup")} className="text-secondary font-medium hover:underline">Sign up</button>
                  </p>
                </>
              )}
              {mode === "signup" && (
                <p className="text-xs text-muted-foreground">
                  Already have an account?{" "}
                  <button onClick={() => setMode("login")} className="text-secondary font-medium hover:underline">Sign in</button>
                </p>
              )}
              {mode === "forgot" && (
                <button onClick={() => setMode("login")} className="text-xs text-secondary hover:underline">Back to login</button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
