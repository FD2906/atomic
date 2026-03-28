import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Clock, X, Camera, TrendingUp, Dumbbell, BookOpen, Moon, Droplets, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import HabitCalendar from "@/components/dashboard/HabitCalendar";

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
  status: "done" | "submit_today" | "under_review" | "failed";
  daysRemaining?: number;
  dailyDeadline?: string | null;
  startDate?: string;
  endDate?: string;
}

const HabitCard = ({ habit, index, userId }: { habit: HabitCardData; index: number; userId?: string }) => {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const Icon = categoryIcons[habit.category] || TrendingUp;
  const progress = (habit.currentDay / habit.durationDays) * 100;

  const statusConfig = {
    done: { label: "DONE", icon: Check, className: "bg-success/10 text-success border-success/20" },
    submit_today: { label: "SUBMIT TODAY", icon: Camera, className: "bg-success/10 text-success border-success/20" },
    under_review: { label: "UNDER REVIEW", icon: Clock, className: "bg-warning/10 text-warning border-warning/20" },
    failed: { label: "FAILED", icon: X, className: "bg-destructive/10 text-destructive border-destructive/20" },
  };

  const s = statusConfig[habit.status];

  const formattedDeadline = habit.dailyDeadline
    ? (() => {
        const [h, m] = habit.dailyDeadline.split(":");
        const hour = parseInt(h);
        const ampm = hour >= 12 ? "PM" : "AM";
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${m} ${ampm}`;
      })()
    : null;

  const handleSubmitEvidence = (e: React.MouseEvent) => {
    e.stopPropagation();
    const params = new URLSearchParams({
      habit: habit.name,
      habitId: habit.id,
      day: habit.currentDay.toString(),
      total: habit.durationDays.toString(),
      charity: habit.charity,
      stake: (habit.stakeAmount / 100).toFixed(0),
      category: habit.category,
    });
    navigate(`/submit-evidence?${params.toString()}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 + index * 0.05 }}
      className="glass-card rounded-xl overflow-hidden"
    >
      {/* Clickable Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 text-left space-y-3"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Icon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold font-heading text-sm">{habit.name}</p>
              <p className="text-xs text-muted-foreground">{habit.charity}</p>
              <p className="text-xs text-muted-foreground">
                Day {habit.currentDay}/{habit.durationDays}
                {habit.daysRemaining != null && <span> · {habit.daysRemaining}d left</span>}
                {formattedDeadline && <span> · ⏰ {formattedDeadline}</span>}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-primary">£{(habit.stakeAmount / 100).toFixed(0)}</span>
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap", s.className)}>
              {s.label}
            </span>
            <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", expanded && "rotate-180")} />
          </div>
        </div>

        <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </button>

      {/* Expandable Content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              {habit.status === "submit_today" && (
                <button
                  onClick={handleSubmitEvidence}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors"
                >
                  <Camera className="w-4 h-4" />
                  Submit Evidence
                </button>
              )}

              {userId && habit.startDate && habit.endDate && (
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-2">
                    Verification Calendar <span className="normal-case text-primary/70">(tap a day to view)</span>
                  </p>
                  <HabitCalendar
                    habitId={habit.id}
                    userId={userId}
                    startDate={habit.startDate}
                    endDate={habit.endDate}
                  />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default HabitCard;
