import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { ArrowLeft, Dumbbell, BookOpen, Moon, Droplets, Plus, Check, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { addDays, format } from "date-fns";

const categories = [
  { id: "exercise", label: "Exercise", icon: Dumbbell },
  { id: "reading", label: "Reading", icon: BookOpen },
  { id: "sleep", label: "Sleep", icon: Moon },
  { id: "hydration", label: "Hydration", icon: Droplets },
  { id: "other", label: "+ More", icon: Plus },
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
  const [habitName, setHabitName] = useState("");
  const [category, setCategory] = useState("");
  const [duration, setDuration] = useState(14);
  const [stake, setStake] = useState(500);
  const [selectedCharity, setSelectedCharity] = useState("");
  const [charities, setCharities] = useState<Charity[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase.from("charities").select("id, name, description, category").then(({ data }) => {
      setCharities(data || []);
    });
  }, []);

  const canSubmit = habitName && category && selectedCharity && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit || !user) return;
    setSubmitting(true);

    const startDate = format(new Date(), "yyyy-MM-dd");
    const endDate = format(addDays(new Date(), duration - 1), "yyyy-MM-dd");

    // Create habit
    const { data: habit, error: habitError } = await supabase
      .from("habits")
      .insert({
        user_id: user.id,
        title: habitName,
        category,
        frequency: "daily",
        start_date: startDate,
        end_date: endDate,
        status: "active",
      })
      .select("id")
      .single();

    if (habitError || !habit) {
      toast.error("Failed to create habit");
      setSubmitting(false);
      return;
    }

    // Create stake
    const { error: stakeError } = await supabase.from("stakes").insert({
      habit_id: habit.id,
      user_id: user.id,
      charity_id: selectedCharity,
      amount: stake,
      currency: "GBP",
      status: "held",
    });

    if (stakeError) {
      toast.error("Failed to set stake");
      setSubmitting(false);
      return;
    }

    toast.success("Habit created! Let's go! 🚀");
    navigate("/dashboard");
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

        <div className="space-y-3">
          <Label className="text-muted-foreground text-xs uppercase tracking-wider">Set Your Stake</Label>
          <div className="flex gap-2">
            {stakeOptions.map((amount) => (
              <button
                key={amount}
                onClick={() => setStake(amount)}
                className={cn(
                  "flex-1 py-3 rounded-xl text-sm font-bold font-heading transition-all",
                  stake === amount ? "bg-primary text-primary-foreground glow-primary" : "bg-secondary text-foreground hover:bg-secondary/80"
                )}
              >
                £{amount / 100}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">💡 Recommended for first timers: £5</p>
        </div>

        <div className="space-y-3">
          <Label className="text-muted-foreground text-xs uppercase tracking-wider">Choose Your Charity</Label>
          <div className="space-y-2">
            {charities.map((charity) => (
              <button
                key={charity.id}
                onClick={() => setSelectedCharity(charity.id)}
                className={cn(
                  "w-full flex items-center gap-3 p-4 rounded-xl transition-all text-left",
                  selectedCharity === charity.id ? "bg-primary/10 border-2 border-primary" : "glass-card hover:bg-secondary/80"
                )}
              >
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                  <Heart className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold font-heading text-sm">{charity.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{charity.description}</p>
                </div>
                {selectedCharity === charity.id && <Check className="w-5 h-5 text-primary flex-shrink-0" />}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <Button variant="hero" size="lg" className="w-full" disabled={!canSubmit} onClick={handleSubmit}>
            {submitting ? "Creating..." : "Confirm & Start"}
          </Button>
          <Button variant="outline" size="lg" className="w-full" onClick={() => navigate(-1)}>
            Back
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default CreateHabit;
