import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Check, ArrowRight, Shield, Heart, RotateCcw, Lock, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import SecurityBadge from "@/components/create-habit/SecurityBadge";

const stages = [
  {
    key: "held",
    label: "Held",
    description: "Your stake is securely held while you complete your habit.",
    icon: Shield,
    color: "text-warning",
    bgColor: "bg-warning/10",
    borderColor: "border-warning/30",
  },
  {
    key: "returned",
    label: "Returned (Success)",
    description: "Complete your habit and your full stake is returned to you.",
    icon: RotateCcw,
    color: "text-success",
    bgColor: "bg-success/10",
    borderColor: "border-success/30",
  },
  {
    key: "donated",
    label: "Donated (Failure)",
    description: "If you don't complete the habit, your stake goes to charity.",
    icon: Heart,
    color: "text-destructive",
    bgColor: "bg-destructive/10",
    borderColor: "border-destructive/30",
  },
];

const StakeConfirmation = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);

  const transactionId = params.get("txn") || "—";
  const amount = params.get("amount") || "0";
  const charity = params.get("charity") || "Charity";
  const habitName = params.get("habit") || "Habit";
  const sessionId = params.get("session_id") || "";

  useEffect(() => {
    const verify = async () => {
      if (!sessionId || !transactionId) {
        setVerifying(false);
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke("verify-payment", {
          body: { sessionId, stakeId: transactionId },
        });

        if (!error && data?.verified) {
          setVerified(true);
        }
      } catch (err) {
        console.error("Payment verification error:", err);
      } finally {
        setVerifying(false);
      }
    };

    verify();
  }, [sessionId, transactionId]);

  if (verifying) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Verifying your payment...</p>
      </div>
    );
  }

  if (!verified) {
    return (
      <div className="px-4 pt-6 pb-8 space-y-6 max-w-lg mx-auto">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex flex-col items-center gap-3 pt-4">
          <div className="w-16 h-16 rounded-full bg-destructive/10 border-2 border-destructive flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="text-xl font-bold font-heading">Payment Not Confirmed</h1>
          <p className="text-sm text-muted-foreground text-center">
            We couldn't verify your payment. Your habit/challenge won't be active until payment is completed.
          </p>
        </motion.div>
        <div className="space-y-3 pt-4">
          <Button variant="hero" size="lg" className="w-full" onClick={() => navigate("/dashboard")}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-8 space-y-6 max-w-lg mx-auto">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="flex flex-col items-center gap-3 pt-4"
      >
        <div className="w-16 h-16 rounded-full bg-success/10 border-2 border-success flex items-center justify-center">
          <Check className="w-8 h-8 text-success" />
        </div>
        <h1 className="text-xl font-bold font-heading">Payment Successful!</h1>
        <p className="text-sm text-muted-foreground text-center">
          Your stake has been securely processed. Here's how it works:
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card rounded-xl p-4 space-y-3"
      >
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Transaction Summary</h2>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Transaction ID</span>
            <span className="font-mono text-xs text-foreground">{transactionId.slice(0, 8)}...</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Habit</span>
            <span className="font-semibold text-foreground">{habitName}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Stake Amount</span>
            <span className="font-bold text-primary">£{amount}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Charity</span>
            <span className="font-semibold text-foreground">{charity}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Payment Status</span>
            <span className="flex items-center gap-1 text-success font-semibold">
              <Lock className="w-3 h-3" /> Secured
            </span>
          </div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
        <SecurityBadge />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="space-y-3"
      >
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Your Stake Journey</h2>
        <div className="relative space-y-0">
          {stages.map((stage, i) => (
            <div key={stage.key} className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <div className={cn("w-10 h-10 rounded-full flex items-center justify-center border-2", stage.bgColor, stage.borderColor)}>
                  <stage.icon className={cn("w-5 h-5", stage.color)} />
                </div>
                {i < stages.length - 1 && <div className="w-0.5 h-10 bg-border" />}
              </div>
              <div className="pt-1.5 pb-4">
                <p className={cn("text-sm font-bold font-heading", stage.color)}>{stage.label}</p>
                <p className="text-xs text-muted-foreground">{stage.description}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="space-y-3 pt-2">
        <Button variant="hero" size="lg" className="w-full" onClick={() => navigate("/dashboard")}>
          Go to Dashboard <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </motion.div>
    </div>
  );
};

export default StakeConfirmation;
