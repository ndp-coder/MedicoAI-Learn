import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Lock } from "lucide-react";

const ResetPassword = () => {
  const { updatePassword } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setIsRecovery(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) return toast.error("Password must be at least 6 characters");
    if (password !== confirm) return toast.error("Passwords don't match");

    setSubmitting(true);
    try {
      const { error } = await updatePassword(password);
      if (error) throw error;
      toast.success("Password updated successfully!");
      navigate("/");
    } catch (err: any) {
      toast.error(err.message || "Failed to update password");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl gradient-dental flex items-center justify-center text-3xl mx-auto mb-3">🦷</div>
          <h1 className="text-xl font-bold text-foreground">Set New Password</h1>
        </div>
        <Card className="border-none shadow-lg">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="New password" className="pl-9" required />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Confirm password" className="pl-9" required />
              </div>
              <Button type="submit" className="w-full gradient-dental text-primary-foreground font-semibold" disabled={submitting}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update Password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;
