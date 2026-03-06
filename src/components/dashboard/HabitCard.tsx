import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, Clock, X, Camera, TrendingUp, Dumbbell, BookOpen, Moon, Droplets } from "lucide-react";
import { cn } from "@/lib/utils";

const categoryIcons: Record<string, React.ElementType> = {
  exercise: Dumbbell,
  reading: BookOpen,
  sleep: Moon,
  hydration: Droplets,
  other: TrendingUp,
};

export interface HabitCardData {
  id: string;
  name: string;
  category: string;
  charity: string;
  currentDay: number;
  durationDays: number;
  stakeAmount: number;
  status: "done" | "pending" | "failed";
}

const HabitCard = ({ habit, index }: { habit: HabitCardData; index: number }) => {
  const navigate = useNavigate();
  const Icon = categoryIcons[habit.category] || TrendingUp;
  const progress = (habit.currentDay / habit.durationDays) * 100;

  const statusConfig = {
    done: { label: "DONE", icon: Check, className: "bg-success/10 text-success border-success/20" },
    pending: { label: "PENDING", icon: Clock, className: "bg-warning/10 text-warning border-warning/20" },
    failed: { label: "FAILED", icon: X, className: "bg-destructive/10 text-destructive border-destructive/20" },
  };

  const s = statusConfig[habit.status];

  const handleSubmitEvidence = () => {
    const params = new URLSearchParams({
      habit: habit.name,
      habitId: habit.id,
      day: habit.currentDay.toString(),
      total: habit.durationDays.toString(),
      charity: habit.charity,
      stake: (habit.stakeAmount / 100).toFixed(0),
    });
    navigate(`/submit-evidence?${params.toString()}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 + index * 0.05 }}
      className="glass-card rounded-xl p-4 space-y-3"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold font-heading text-sm">{habit.name}</p>
            <p className="text-xs text-muted-foreground">{habit.charity} · Day {habit.currentDay}/{habit.durationDays}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-primary">£{(habit.stakeAmount / 100).toFixed(0)}</span>
          <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", s.className)}>
            {s.label}
          </span>
        </div>
      </div>

      <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
        <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>

      {habit.status === "pending" && (
        <button
          onClick={handleSubmitEvidence}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors"
        >
          <Camera className="w-4 h-4" />
          Submit Evidence
        </button>
      )}
    </motion.div>
  );
};

export default HabitCard;
