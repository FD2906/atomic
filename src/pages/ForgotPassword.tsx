import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Zap } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Password reset email sent. Check your inbox.");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm space-y-8"
      >
        <div className="space-y-4 text-center">
          <div className="flex items-center justify-center gap-2">
            <Zap className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold font-heading text-gradient">ATOMIC</h1>
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">Reset your password</h2>
            <p className="text-sm text-muted-foreground">
              Enter your email and we&apos;ll send you a link to create a new password.
            </p>
          </div>
        </div>

        <form onSubmit={handleResetRequest} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-muted-foreground text-xs uppercase tracking-wider">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
            {loading ? "Sending reset email..." : "Send reset email"}
          </Button>
        </form>

        <Link
          to="/login"
          className="inline-flex items-center justify-center gap-2 text-sm text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </Link>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
