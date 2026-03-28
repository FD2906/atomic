import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useMonthlyStakes } from "@/hooks/useMonthlyStakes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { ArrowLeft, Dumbbell, BookOpen, Moon, Droplets, Plus, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { addDays, format } from "date-fns";
import CharitySelector from "@/components/create-habit/CharitySelector";
import SecurityBadge from "@/components/create-habit/SecurityBadge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const categories = [
  { id: "exercise", label: "Exercise", icon: Dumbbell },
  { id: "reading", label: "Reading", icon: BookOpen },
  { id: "sleep", label: "Sleep", icon: Moon },
  { id: "hydration", label: "Hydration", icon: Droplets },
  { id: "other", label: "More", icon: Plus },
];

const stakeOptions = [200, 500, 1000, 2000];

interface Charity {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
}

const CreateHabit = () => {
  const navigate = useNavigate();
  const { user } = useAuth("/login");
  const { profile } = useProfile();
  const { monthlyTotal } = useMonthlyStakes(user?.id);
  const [habitName, setHabitName] = useState("");
  const [category, setCategory] = useState("");
  const [duration, setDuration] = useState(14);
  const [dailyDeadline, setDailyDeadline] = useState("23:00");
  const [stake, setStake] = useState(500);
  const [selectedCharity, setSelectedCharity] = useState("");
  const [charities, setCharities] = useState<Charity[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [showLimitWarning, setShowLimitWarning] = useState(false);
  const [customStake, setCustomStake] = useState(false);
  const [customAmount, setCustomAmount] = useState("");
  const [completedHabitsCount, setCompletedHabitsCount] = useState<number | null>(null);
  const [showFirstTimeWarning, setShowFirstTimeWarning] = useState(false);
  const [pendingStake, setPendingStake] = useState<number | null>(null);
  const [recentFailure, setRecentFailure] = useState(false);
  const [showCoolingOff, setShowCoolingOff] = useState(false);

  useEffect(() => {
    supabase.from("charities").select("id, name, description, category").then(({ data }) => {
      setCharities(data || []);
    });
    if (user) {
      supabase
        .from("habits")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "completed")
        .then(({ count }) => setCompletedHabitsCount(count ?? 0));

      // Check for recent failure (cooling-off US14)
      const twentyFourHrsAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      supabase
        .from("stakes")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "donated")
        .gte("date_resolved", twentyFourHrsAgo)
        .then(({ count }) => setRecentFailure((count ?? 0) > 0));
    }
  }, [user]);

  const isFirstTimeUser = completedHabitsCount !== null && completedHabitsCount < 3;

  const handleStakeSelection = (amount: number) => {
    if (isFirstTimeUser && amount > 5000) {
      setPendingStake(amount);
      setShowFirstTimeWarning(true);
    } else {
      setStake(amount);
    }
  };

  const canSubmit = habitName && category && selectedCharity && !submitting;

  const newMonthlyTotal = monthlyTotal + stake;
  const spendingLimit = profile?.spending_limit ?? null;
  const wouldExceedLimit = spendingLimit != null && newMonthlyTotal > spendingLimit;
  const isNear80Pct = spendingLimit != null && !wouldExceedLimit && newMonthlyTotal >= spendingLimit * 0.8;
  const remainingAllowance = spendingLimit != null ? Math.max(0, spendingLimit - monthlyTotal) : null;

  const handleConfirmSubmit = async () => {
    if (!canSubmit || !user) return;
    setSubmitting(true);

    try {
      const startDate = format(new Date(), "yyyy-MM-dd");
      const endDate = format(addDays(new Date(), duration - 1), "yyyy-MM-dd");

      const { data: habit, error: habitError } = await supabase
        .from("habits")
        .insert({
          user_id: user.id,
          title: habitName,
          category,
          frequency: "daily",
          start_date: startDate,
          end_date: endDate,
          daily_deadline: dailyDeadline,
          charity_id: selectedCharity || null,
          status: "pending_payment",
        } as any)
        .select("id")
        .single();

      if (habitError || !habit) {
        console.error("Habit insert error:", habitError);
        toast.error(habitError?.message || "Failed to create habit");
        setSubmitting(false);
        return;
      }

      const { data: stakeData, error: stakeError } = await supabase.from("stakes").insert({
        habit_id: habit.id,
        user_id: user.id,
        charity_id: selectedCharity,
        amount: stake,
        currency: "GBP",
        status: "held",
      }).select("id").single();

      if (stakeError) {
        console.error("Stake insert error:", stakeError);
        toast.error(stakeError.message || "Failed to set stake");
        setSubmitting(false);
        return;
      }

      const charityName = charities.find((c) => c.id === selectedCharity)?.name || "Charity";

      // Redirect to Stripe Checkout
      const { data: checkoutData, error: checkoutError } = await supabase.functions.invoke(
        "create-stake-checkout",
        {
          body: {
            habitId: habit.id,
            stakeId: stakeData.id,
            amount: stake,
            charityName,
            habitName,
          },
        }
      );

      if (checkoutError || !checkoutData?.url) {
        console.error("Checkout error:", checkoutError);
        toast.error("Failed to start payment. Please try again.");
        setSubmitting(false);
        return;
      }

      // Redirect to Stripe Checkout in same tab
      window.location.href = checkoutData.url;
    } catch (err) {
      console.error("Unexpected error creating habit:", err);
      toast.error("An unexpected error occurred. Please try again.");
      setSubmitting(false);
    }
  };

  const handleSubmit = () => {
    if (!canSubmit || !user) return;
    if (recentFailure && !showCoolingOff) {
      setShowCoolingOff(true);
      return;
    }
    if (wouldExceedLimit) {
      setShowLimitWarning(true);
    } else {
      handleConfirmSubmit();
    }
  };

  return (
    <div className="px-4 pt-6 pb-8 space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg bg-secondary hover:bg-secondary/80">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold font-heading">New Habit</h1>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        <div className="space-y-2">
          <Label className="text-muted-foreground text-xs uppercase tracking-wider">Habit Name</Label>
          <Input
            value={habitName}
            onChange={(e) => setHabitName(e.target.value)}
            placeholder="e.g. Morning Run"
            className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-muted-foreground text-xs uppercase tracking-wider">Category</Label>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all",
                  category === cat.id ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground hover:bg-secondary/80"
                )}
              >
                <cat.icon className="w-4 h-4" />
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-muted-foreground text-xs uppercase tracking-wider">Duration (Days)</Label>
          <Input
            type="number"
            value={duration}
            onChange={(e) => setDuration(parseInt(e.target.value) || 1)}
            min={1}
            max={90}
            className="bg-secondary border-border text-foreground w-24"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-muted-foreground text-xs uppercase tracking-wider">Daily Deadline</Label>
          <Input
            type="time"
            value={dailyDeadline}
            onChange={(e) => setDailyDeadline(e.target.value)}
            className="bg-secondary border-border text-foreground w-36"
          />
          <p className="text-xs text-muted-foreground">⏰ You'll get a reminder 2 hours before this time</p>
        </div>

        <div className="space-y-3">
          <Label className="text-muted-foreground text-xs uppercase tracking-wider">Set Your Stake</Label>
          <div className="flex gap-2">
            {stakeOptions.map((amount) => (
              <button
                key={amount}
                onClick={() => {
                  setCustomStake(false);
                  setCustomAmount("");
                  handleStakeSelection(amount);
                }}
                className={cn(
                  "flex-1 py-3 rounded-xl text-sm font-bold font-heading transition-all",
                  !customStake && stake === amount ? "bg-primary text-primary-foreground glow-primary" : "bg-secondary text-foreground hover:bg-secondary/80"
                )}
              >
                £{amount / 100}
              </button>
            ))}
          </div>

          <button
            onClick={() => setCustomStake(true)}
            className={cn(
              "w-full py-3 rounded-xl text-sm font-bold font-heading transition-all",
              customStake ? "bg-primary text-primary-foreground glow-primary" : "bg-secondary text-foreground hover:bg-secondary/80"
            )}
          >
            Custom Amount
          </button>

          {customStake && (
            <div className="flex items-center gap-2">
              <span className="text-foreground font-bold">£</span>
              <Input
                type="number"
                min={2}
                max={500}
                placeholder="Enter amount (£2 – £500)"
                value={customAmount}
                onChange={(e) => {
                  setCustomAmount(e.target.value);
                  const pence = Math.round(parseFloat(e.target.value) * 100);
                  if (!isNaN(pence) && pence >= 200) {
                    handleStakeSelection(pence);
                  }
                }}
                className="bg-secondary border-border text-foreground flex-1"
              />
            </div>
          )}

          <p className="text-xs text-muted-foreground">💡 Recommended for first timers: £5</p>
          {remainingAllowance !== null && (
            <p className={cn("text-xs font-medium", isNear80Pct ? "text-warning" : "text-muted-foreground")}>
              {isNear80Pct && "⚠️ "}£{(remainingAllowance / 100).toFixed(0)} of £{(spendingLimit! / 100).toFixed(0)} remaining this month
            </p>
          )}
        </div>

        {/* First-time high stake warning */}
        <AlertDialog open={showFirstTimeWarning} onOpenChange={setShowFirstTimeWarning}>
          <AlertDialogContent className="bg-background border-border">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 font-heading">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                High Stake Warning
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-2">
                <span className="block">
                  You're staking <strong className="text-foreground">£{pendingStake ? pendingStake / 100 : 0}</strong>, which is over <strong className="text-foreground">£50</strong>.
                </span>
                <span className="block">
                  As a new user with fewer than 3 completed habits, we recommend starting smaller to build confidence. If you fail to complete your habit, this amount will be donated to your chosen charity.
                </span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
              <AlertDialogCancel onClick={() => {
                setShowFirstTimeWarning(false);
                setPendingStake(null);
              }}>
                Choose Lower Stake
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (pendingStake) setStake(pendingStake);
                  setShowFirstTimeWarning(false);
                  setPendingStake(null);
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                I Understand, Continue
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <div className="space-y-3">
          <Label className="text-muted-foreground text-xs uppercase tracking-wider">Choose Your Charity</Label>
          <CharitySelector
            charities={charities}
            selectedCharity={selectedCharity}
            onSelect={setSelectedCharity}
          />
        </div>

        {isNear80Pct && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-warning/10 border border-warning/20">
            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-warning" />
            </div>
            <p className="text-xs text-warning">
              You're nearing your monthly limit. £{(remainingAllowance! / 100).toFixed(0)} of £{(spendingLimit! / 100).toFixed(0)} remaining.
            </p>
          </div>
        )}

        {wouldExceedLimit && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20">
            <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
            <p className="text-xs text-destructive">
              This stake will bring your monthly total to £{(newMonthlyTotal / 100).toFixed(0)}, exceeding your £{(spendingLimit! / 100).toFixed(0)} limit. You cannot proceed.
            </p>
          </div>
        )}

        <div className="space-y-3 pt-2">
          <SecurityBadge />
          <Button variant="hero" size="lg" className="w-full" disabled={!canSubmit} onClick={handleSubmit}>
            {submitting ? "Processing..." : `Confirm & Pay £${(stake / 100).toFixed(0)}`}
          </Button>
          <Button variant="outline" size="lg" className="w-full" onClick={() => navigate(-1)}>
            Back
          </Button>
        </div>
      </motion.div>

      <AlertDialog open={showLimitWarning} onOpenChange={setShowLimitWarning}>
        <AlertDialogContent className="bg-background border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 font-heading">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Spending Limit Warning
            </AlertDialogTitle>
            <AlertDialogDescription>
              This stake of £{(stake / 100).toFixed(0)} will bring your monthly total to £{(newMonthlyTotal / 100).toFixed(0)}, which exceeds your spending limit of £{((profile?.spending_limit ?? 0) / 100).toFixed(0)}. Do you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSubmit} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Stake Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cooling-Off Warning (US14) */}
      <AlertDialog open={showCoolingOff} onOpenChange={setShowCoolingOff}>
        <AlertDialogContent className="bg-background border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 font-heading">
              <AlertTriangle className="w-5 h-5 text-warning" />
              Recent Stake Lost
            </AlertDialogTitle>
            <AlertDialogDescription>
              You recently lost a stake. Are you sure you want to stake again? Consider taking a break before committing more money.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
            <AlertDialogCancel onClick={() => setShowCoolingOff(false)}>
              Wait Until Tomorrow
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowCoolingOff(false);
                if (wouldExceedLimit) {
                  setShowLimitWarning(true);
                } else {
                  handleConfirmSubmit();
                }
              }}
              className="bg-warning text-warning-foreground hover:bg-warning/90"
            >
              Yes, I'm Sure
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CreateHabit;
