import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Dumbbell, BookOpen, Moon, Droplets, Plus, Check, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const categories = [
  { id: "exercise", label: "Exercise", icon: Dumbbell },
  { id: "reading", label: "Reading", icon: BookOpen },
  { id: "sleep", label: "Sleep", icon: Moon },
  { id: "hydration", label: "Hydration", icon: Droplets },
  { id: "other", label: "+ More", icon: Plus },
];

const stakeOptions = [200, 500, 1000, 2000]; // pence

const mockCharities = [
  { id: "1", name: "MIND", description: "Supporting those with mental health problems", category: "mental_health" },
  { id: "2", name: "WWF", description: "Protecting wildlife and wild places", category: "environment" },
  { id: "3", name: "Cancer Research UK", description: "Pioneering research to beat cancer", category: "health" },
  { id: "4", name: "Shelter", description: "Fighting homelessness and bad housing", category: "housing" },
  { id: "5", name: "British Heart Foundation", description: "Funding research into heart and circulatory diseases", category: "health" },
];

const CreateHabit = () => {
  const navigate = useNavigate();
  const [habitName, setHabitName] = useState("");
  const [category, setCategory] = useState("");
  const [duration, setDuration] = useState(14);
  const [stake, setStake] = useState(500);
  const [selectedCharity, setSelectedCharity] = useState("");

  const canSubmit = habitName && category && selectedCharity;

  const handleSubmit = () => {
    if (!canSubmit) return;
    // TODO: Save to database
    toast.success("Habit created! Let's go! 🚀");
    navigate("/dashboard");
  };

  return (
    <div className="px-4 pt-6 pb-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg bg-secondary hover:bg-secondary/80">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold font-heading">New Habit</h1>
      </div>

      {/* Form */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        {/* Habit Name */}
        <div className="space-y-2">
          <Label className="text-muted-foreground text-xs uppercase tracking-wider">Habit Name</Label>
          <Input
            value={habitName}
            onChange={(e) => setHabitName(e.target.value)}
            placeholder="e.g. Morning Run"
            className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
          />
        </div>

        {/* Category */}
        <div className="space-y-2">
          <Label className="text-muted-foreground text-xs uppercase tracking-wider">Category</Label>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all",
                  category === cat.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-foreground hover:bg-secondary/80"
                )}
              >
                <cat.icon className="w-4 h-4" />
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Duration */}
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

        {/* Stake */}
        <div className="space-y-3">
          <Label className="text-muted-foreground text-xs uppercase tracking-wider">Set Your Stake</Label>
          <div className="flex gap-2">
            {stakeOptions.map((amount) => (
              <button
                key={amount}
                onClick={() => setStake(amount)}
                className={cn(
                  "flex-1 py-3 rounded-xl text-sm font-bold font-heading transition-all",
                  stake === amount
                    ? "bg-primary text-primary-foreground glow-primary"
                    : "bg-secondary text-foreground hover:bg-secondary/80"
                )}
              >
                £{amount / 100}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">💡 Recommended for first timers: £5</p>
        </div>

        {/* Charity Selection */}
        <div className="space-y-3">
          <Label className="text-muted-foreground text-xs uppercase tracking-wider">Choose Your Charity</Label>
          <div className="space-y-2">
            {mockCharities.map((charity) => (
              <button
                key={charity.id}
                onClick={() => setSelectedCharity(charity.id)}
                className={cn(
                  "w-full flex items-center gap-3 p-4 rounded-xl transition-all text-left",
                  selectedCharity === charity.id
                    ? "bg-primary/10 border-2 border-primary"
                    : "glass-card hover:bg-secondary/80"
                )}
              >
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                  <Heart className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold font-heading text-sm">{charity.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{charity.description}</p>
                </div>
                {selectedCharity === charity.id && (
                  <Check className="w-5 h-5 text-primary flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3 pt-2">
          <Button
            variant="hero"
            size="lg"
            className="w-full"
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            Confirm & Start
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
