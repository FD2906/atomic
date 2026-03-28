import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { ArrowLeft, Banknote, Clock, Check, AlertTriangle, Shield } from "lucide-react";
import { toast } from "sonner";
import SecurityBadge from "@/components/create-habit/SecurityBadge";

const Withdraw = () => {
  const navigate = useNavigate();
  const { user } = useAuth("/login");
  const [availableBalance, setAvailableBalance] = useState(0);
  const [amount, setAmount] = useState("");
  const [accountHolderName, setAccountHolderName] = useState("");
  const [sortCode, setSortCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [txnId, setTxnId] = useState("");

  useEffect(() => {
    if (!user) return;
    const fetchBalance = async () => {
      const { data: returned } = await supabase
        .from("stakes")
        .select("amount")
        .eq("user_id", user.id)
        .eq("status", "returned");

      const { data: withdrawn } = await supabase
        .from("transactions")
        .select("amount")
        .eq("user_id", user.id)
        .eq("type", "withdrawal")
        .in("status", ["pending", "completed"]);

      const totalReturned = (returned || []).reduce((sum, s: any) => sum + Number(s.amount), 0);
      const totalWithdrawn = (withdrawn || []).reduce((sum, t: any) => sum + Number(t.amount), 0);
      setAvailableBalance(totalReturned - totalWithdrawn);
    };
    fetchBalance();
  }, [user]);

  const formatSortCode = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 6);
    if (digits.length > 4) return `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4)}`;
    if (digits.length > 2) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
    return digits;
  };

  const isValid =
    accountHolderName.trim().length >= 2 &&
    sortCode.replace(/\D/g, "").length === 6 &&
    /^\d{6,8}$/.test(accountNumber) &&
    parseFloat(amount) >= 1 &&
    parseFloat(amount) * 100 <= availableBalance;

  const handleSubmit = async () => {
    if (!isValid || submitting) return;
    setSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke("request-withdrawal", {
        body: {
          amount: Math.round(parseFloat(amount) * 100),
          accountHolderName: accountHolderName.trim(),
          sortCode: sortCode.replace(/\D/g, ""),
          accountNumber,
        },
      });

      if (error || !data?.success) {
        toast.error(data?.error || "Withdrawal request failed");
        setSubmitting(false);
        return;
      }

      setTxnId(data.transactionId);
      setSuccess(true);
      toast.success("Withdrawal request submitted!");
    } catch (err) {
      console.error("Withdrawal error:", err);
      toast.error("An unexpected error occurred");
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="px-4 pt-6 pb-8 space-y-6 max-w-lg mx-auto">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="flex flex-col items-center gap-3 pt-8"
        >
          <div className="w-16 h-16 rounded-full bg-success/10 border-2 border-success flex items-center justify-center">
            <Check className="w-8 h-8 text-success" />
          </div>
          <h1 className="text-xl font-bold font-heading">Withdrawal Requested!</h1>
          <p className="text-sm text-muted-foreground text-center">
            Your withdrawal of <strong className="text-foreground">£{amount}</strong> is being processed.
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card rounded-xl p-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Transaction ID</span>
            <span className="font-mono text-xs">{txnId.slice(0, 8)}...</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Amount</span>
            <span className="font-bold text-primary">£{amount}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Estimated Processing</span>
            <span className="flex items-center gap-1 font-semibold">
              <Clock className="w-3 h-3" /> 1-3 business days
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Account</span>
            <span className="font-semibold">****{accountNumber.slice(-4)}</span>
          </div>
        </motion.div>

        <SecurityBadge />

        <Button variant="hero" size="lg" className="w-full" onClick={() => navigate("/dashboard")}>
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-8 space-y-6 max-w-lg mx-auto">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg bg-secondary hover:bg-secondary/80">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <Banknote className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-bold font-heading">Withdraw Funds</h1>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-4 text-center space-y-1">
        <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Available Balance</p>
        <p className="text-3xl font-bold font-heading text-primary">£{(availableBalance / 100).toFixed(2)}</p>
        <p className="text-[10px] text-muted-foreground">From returned stakes</p>
      </motion.div>

      {availableBalance < 100 ? (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-warning/10 border border-warning/20">
          <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0" />
          <p className="text-xs text-warning">No funds available for withdrawal. Complete habits to get stakes returned.</p>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="space-y-5">
          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs uppercase tracking-wider">Withdrawal Amount (£)</Label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min={1}
              max={availableBalance / 100}
              step="0.01"
              placeholder={`Max £${(availableBalance / 100).toFixed(2)}`}
              className="bg-secondary border-border text-foreground"
            />
            {amount && parseFloat(amount) * 100 > availableBalance && (
              <p className="text-xs text-destructive">Exceeds available balance</p>
            )}
          </div>

          <div className="space-y-4 glass-card rounded-xl p-4">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Bank Account Details</p>
            </div>

            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs">Account Holder Name</Label>
              <Input
                value={accountHolderName}
                onChange={(e) => setAccountHolderName(e.target.value)}
                placeholder="John Smith"
                className="bg-secondary border-border text-foreground"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-muted-foreground text-xs">Sort Code</Label>
                <Input
                  value={sortCode}
                  onChange={(e) => setSortCode(formatSortCode(e.target.value))}
                  placeholder="12-34-56"
                  maxLength={8}
                  className="bg-secondary border-border text-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground text-xs">Account Number</Label>
                <Input
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, "").slice(0, 8))}
                  placeholder="12345678"
                  maxLength={8}
                  className="bg-secondary border-border text-foreground"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border">
            <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              Withdrawals are processed within <strong className="text-foreground">1-3 business days</strong> via bank transfer.
            </p>
          </div>

          <SecurityBadge />

          <div className="space-y-3 pt-1">
            <Button variant="hero" size="lg" className="w-full" disabled={!isValid || submitting} onClick={handleSubmit}>
              {submitting ? "Processing..." : `Withdraw £${amount || "0"}`}
            </Button>
            <Button variant="outline" size="lg" className="w-full" onClick={() => navigate(-1)}>
              Cancel
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Withdraw;
