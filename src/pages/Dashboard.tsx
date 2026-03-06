import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Bell, Flame, PoundSterling, TrendingUp, Heart, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import StatCard from "@/components/dashboard/StatCard";
import HabitCard, { type HabitCardData } from "@/components/dashboard/HabitCard";
import { differenceInDays, parseISO } from "date-fns";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth("/login");
  const [greeting, setGreeting] = useState("");
  const [displayName, setDisplayName] = useState("there");
  const [habits, setHabits] = useState<HabitCardData[]>([]);
  const [stats, setStats] = useState({ streak: 0, atStake: 0, successRate: 0, donated: 0 });
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      // Fetch profile name
      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name")
        .eq("id", user.id)
        .single();
      setDisplayName(profile?.first_name || user.user_metadata?.display_name || "there");

      // Fetch active habits with stakes
      const { data: habitsData } = await supabase
        .from("habits")
        .select("*, stakes(amount, charity_id, status, charities(name))")
        .eq("user_id", user.id)
        .eq("status", "active");

      // Fetch today's submissions to determine done/pending
      const today = new Date().toISOString().split("T")[0];
      const { data: todaySubmissions } = await supabase
        .from("verification_submissions")
        .select("habit_id")
        .eq("user_id", user.id)
        .gte("submitted_at", today);

      const submittedHabitIds = new Set((todaySubmissions || []).map((s: any) => s.habit_id));

      const mappedHabits: HabitCardData[] = (habitsData || []).map((h: any) => {
        const stake = h.stakes?.[0];
        const currentDay = Math.max(1, differenceInDays(new Date(), parseISO(h.start_date)) + 1);
        const durationDays = h.end_date ? differenceInDays(parseISO(h.end_date), parseISO(h.start_date)) + 1 : 14;
        return {
          id: h.id,
          name: h.title,
          category: h.category || "other",
          charity: stake?.charities?.name || "Charity",
          currentDay: Math.min(currentDay, durationDays),
          durationDays,
          stakeAmount: stake?.amount || 0,
          status: submittedHabitIds.has(h.id) ? "done" as const : "pending" as const,
        };
      });
      setHabits(mappedHabits);

      // Compute stats
      const { data: allStakes } = await supabase
        .from("stakes")
        .select("amount, status")
        .eq("user_id", user.id);

      const held = (allStakes || []).filter((s: any) => s.status === "held").reduce((sum: number, s: any) => sum + Number(s.amount), 0);
      const donated = (allStakes || []).filter((s: any) => s.status === "donated").reduce((sum: number, s: any) => sum + Number(s.amount), 0);
      const totalHabits = (allStakes || []).length;
      const returned = (allStakes || []).filter((s: any) => s.status === "returned").length;
      const rate = totalHabits > 0 ? Math.round((returned / totalHabits) * 100) : 0;

      setStats({
        streak: mappedHabits.filter((h) => h.status === "done").length,
        atStake: Math.round(held / 100),
        successRate: rate,
        donated: Math.round(donated / 100),
      });

      // Unread notifications
      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_read", false);
      setUnreadCount(count || 0);
    };

    fetchData();
  }, [user]);

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
          {unreadCount > 0 && (
            <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-destructive rounded-full text-[10px] font-bold flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Greeting */}
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <p className="text-muted-foreground text-sm">{greeting}</p>
        <h2 className="text-2xl font-bold font-heading">{displayName} 👋</h2>
      </motion.div>

      {/* Stats Row */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-4 gap-2">
        <StatCard icon={Flame} value={stats.streak.toString()} label="Streak" accent />
        <StatCard icon={PoundSterling} value={`£${stats.atStake}`} label="At Stake" />
        <StatCard icon={TrendingUp} value={`${stats.successRate}%`} label="Success" />
        <StatCard icon={Heart} value={`£${stats.donated}`} label="Donated" />
      </motion.div>

      {/* Active Habits */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Active Habits</h3>
          <button onClick={() => navigate("/history")} className="text-xs text-primary flex items-center gap-1">
            See all <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        {habits.length === 0 ? (
          <div className="glass-card rounded-xl p-6 text-center space-y-2">
            <p className="text-sm text-muted-foreground">No active habits yet</p>
            <button onClick={() => navigate("/create")} className="text-sm text-primary font-semibold hover:underline">
              Create your first habit →
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {habits.map((habit, i) => (
              <HabitCard key={habit.id} habit={habit} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
