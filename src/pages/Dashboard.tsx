import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Bell, Flame, PoundSterling, TrendingUp, Heart, ChevronRight, Dumbbell, BookOpen, Moon, Droplets, Check, Clock, X } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const categoryIcons: Record<string, React.ElementType> = {
  exercise: Dumbbell,
  reading: BookOpen,
  sleep: Moon,
  hydration: Droplets,
  other: TrendingUp,
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");

    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  const displayName = user?.user_metadata?.display_name || "there";

  // Mock data for UI - will be replaced with real data
  const stats = {
    streak: 7,
    atStake: 25,
    successRate: 85,
    donated: 15,
  };

  const mockHabits = [
    { id: "1", name: "Morning Run", category: "exercise", charity: "MIND", currentDay: 9, durationDays: 14, stakeAmount: 1000, status: "pending" as const },
    { id: "2", name: "Read 30 Mins", category: "reading", charity: "WWF", currentDay: 5, durationDays: 14, stakeAmount: 500, status: "done" as const },
    { id: "3", name: "8 Glasses Water", category: "hydration", charity: "Shelter", currentDay: 3, durationDays: 7, stakeAmount: 200, status: "done" as const },
  ];

  return (
    <div className="px-4 pt-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold font-heading text-gradient">ATOMIC</h1>
        <button
          onClick={() => navigate("/notifications")}
          className="relative p-2 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
        >
          <Bell className="w-5 h-5 text-foreground" />
          <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-destructive rounded-full text-[10px] font-bold flex items-center justify-center">
            3
          </span>
        </button>
      </div>

      {/* Greeting */}
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <p className="text-muted-foreground text-sm">{greeting}</p>
        <h2 className="text-2xl font-bold font-heading">{displayName} 👋</h2>
      </motion.div>

      {/* Stats Row */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-4 gap-2"
      >
        <StatCard icon={Flame} value={stats.streak.toString()} label="Streak" accent />
        <StatCard icon={PoundSterling} value={`£${stats.atStake}`} label="At Stake" />
        <StatCard icon={TrendingUp} value={`${stats.successRate}%`} label="Success" />
        <StatCard icon={Heart} value={`£${stats.donated}`} label="Donated" />
      </motion.div>

      {/* Active Habits */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Active Habits</h3>
          <button className="text-xs text-primary flex items-center gap-1">
            See all <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        <div className="space-y-3">
          {mockHabits.map((habit, i) => (
            <HabitCard key={habit.id} habit={habit} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({
  icon: Icon,
  value,
  label,
  accent,
}: {
  icon: React.ElementType;
  value: string;
  label: string;
  accent?: boolean;
}) => (
  <div className={cn("rounded-xl p-3 text-center space-y-1", accent ? "bg-primary/10 border border-primary/20" : "bg-card border border-border/50")}>
    <Icon className={cn("w-4 h-4 mx-auto", accent ? "text-primary" : "text-muted-foreground")} />
    <p className={cn("text-lg font-bold font-heading", accent ? "text-primary" : "text-foreground")}>{value}</p>
    <p className="text-[10px] text-muted-foreground">{label}</p>
  </div>
);

const HabitCard = ({
  habit,
  index,
}: {
  habit: {
    id: string;
    name: string;
    category: string;
    charity: string;
    currentDay: number;
    durationDays: number;
    stakeAmount: number;
    status: "done" | "pending" | "failed";
  };
  index: number;
}) => {
  const Icon = categoryIcons[habit.category] || TrendingUp;
  const progress = (habit.currentDay / habit.durationDays) * 100;

  const statusConfig = {
    done: { label: "DONE", icon: Check, className: "bg-success/10 text-success border-success/20" },
    pending: { label: "PENDING", icon: Clock, className: "bg-warning/10 text-warning border-warning/20" },
    failed: { label: "FAILED", icon: X, className: "bg-destructive/10 text-destructive border-destructive/20" },
  };

  const s = statusConfig[habit.status];

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

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </motion.div>
  );
};

export default Dashboard;
