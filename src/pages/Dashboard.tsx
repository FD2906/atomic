import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useMonthlyStakes } from "@/hooks/useMonthlyStakes";
import { Bell, Flame, PoundSterling, TrendingUp, Heart, ChevronRight, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import StatCard from "@/components/dashboard/StatCard";
import HabitCard, { type HabitCardData } from "@/components/dashboard/HabitCard";
import HabitCalendar from "@/components/dashboard/HabitCalendar";
import NotificationOptIn from "@/components/dashboard/NotificationOptIn";
import { differenceInDays, parseISO, startOfMonth, format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth("/login");
  const { profile } = useProfile();
  const { monthlyTotal } = useMonthlyStakes(user?.id);
  const [greeting, setGreeting] = useState("");
  const [displayName, setDisplayName] = useState("there");
  const [habits, setHabits] = useState<(HabitCardData & { startDate: string; endDate: string })[]>([]);
  const [stats, setStats] = useState({ streak: 0, atStake: 0, successRate: 0, donated: 0 });
  const [unreadCount, setUnreadCount] = useState(0);
  const [showStakeWarning, setShowStakeWarning] = useState(false);

  const isOverLimit = profile?.spending_limit != null && monthlyTotal > profile.spending_limit;
  const overByAmount = isOverLimit ? Math.round((monthlyTotal - (profile?.spending_limit ?? 0)) / 100) : 0;

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
      const { data: profileData } = await supabase
        .from("profiles")
        .select("first_name")
        .eq("id", user.id)
        .single();
      setDisplayName(profileData?.first_name || user.user_metadata?.given_name || user.user_metadata?.full_name || user.user_metadata?.name || "there");

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

      const mappedHabits = (habitsData || []).map((h: any) => {
        const stake = h.stakes?.[0];
        const currentDay = Math.max(1, differenceInDays(new Date(), parseISO(h.start_date)) + 1);
        const endDate = h.end_date || format(new Date(new Date(h.start_date).getTime() + 13 * 86400000), "yyyy-MM-dd");
        const durationDays = differenceInDays(parseISO(endDate), parseISO(h.start_date)) + 1;
        const daysRemaining = Math.max(0, differenceInDays(parseISO(endDate), new Date()));
        return {
          id: h.id,
          name: h.title,
          category: h.category || "other",
          charity: stake?.charities?.name || "Charity",
          currentDay: Math.min(currentDay, durationDays),
          durationDays,
          stakeAmount: stake?.amount || 0,
          status: submittedHabitIds.has(h.id) ? "done" as const : "pending" as const,
          startDate: h.start_date,
          endDate,
          daysRemaining,
        };
      });
      // Sort by soonest deadline
      mappedHabits.sort((a, b) => a.daysRemaining - b.daysRemaining);
      setHabits(mappedHabits);

      // Compute monthly stats
      const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
      const { data: monthlyStakes } = await supabase
        .from("stakes")
        .select("amount, status")
        .eq("user_id", user.id)
        .gte("date_created", monthStart);

      const held = (monthlyStakes || []).filter((s: any) => s.status === "held").reduce((sum: number, s: any) => sum + Number(s.amount), 0);
      const donated = (monthlyStakes || []).filter((s: any) => s.status === "donated").reduce((sum: number, s: any) => sum + Number(s.amount), 0);
      const totalMonthly = (monthlyStakes || []).length;
      const returned = (monthlyStakes || []).filter((s: any) => s.status === "returned").length;
      const rate = totalMonthly > 0 ? Math.round((returned / totalMonthly) * 100) : 0;

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

    // Realtime: auto-refresh when verification submissions change
    const channel = supabase
      .channel("dashboard-verifications")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "verification_submissions", filter: `user_id=eq.${user.id}` },
        () => fetchData()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  return (
    <div className="px-4 pt-6 space-y-6">
      {/* Notification Opt-In Dialog */}
      {user && profile && (
        <NotificationOptIn
          userId={user.id}
          notificationsEnabled={(profile as any).notifications_enabled ?? null}
          onComplete={() => {}}
        />
      )}
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

      {/* Stats Row — This Month */}
      <div className="space-y-1.5">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">This Month</p>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-4 gap-2">
          <StatCard icon={Flame} value={stats.streak.toString()} label="Streak" accent />
          <StatCard
            icon={PoundSterling}
            value={`£${stats.atStake}`}
            label="At Stake"
            danger={isOverLimit}
            onClick={isOverLimit ? () => setShowStakeWarning(true) : undefined}
          />
          <StatCard icon={TrendingUp} value={`${stats.successRate}%`} label="Success" />
          <StatCard icon={Heart} value={`£${stats.donated}`} label="Donated" />
        </motion.div>
      </div>

      {/* Active Habits */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Active Habits
            {habits.length > 0 && (
              <span className="ml-2 text-primary font-normal normal-case">
                £{Math.round(habits.reduce((sum, h) => sum + h.stakeAmount, 0) / 100)} at stake across {habits.length} habit{habits.length !== 1 ? "s" : ""}
              </span>
            )}
          </h3>
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
              <div key={habit.id} className="space-y-2">
                <HabitCard habit={habit} index={i} />
                {user && (
                  <div className="glass-card rounded-xl p-3">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-2">Verification Calendar</p>
                    <HabitCalendar
                      habitId={habit.id}
                      userId={user.id}
                      startDate={habit.startDate}
                      endDate={habit.endDate}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Spending Limit Warning Dialog */}
      <AlertDialog open={showStakeWarning} onOpenChange={setShowStakeWarning}>
        <AlertDialogContent className="bg-background border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 font-heading">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Monthly Spending Limit Exceeded
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span className="block">
                You've staked <strong className="text-foreground">£{Math.round(monthlyTotal / 100)}</strong> this month, which is{" "}
                <strong className="text-destructive">£{overByAmount} over</strong> your{" "}
                <strong className="text-foreground">£{Math.round((profile?.spending_limit ?? 0) / 100)}</strong> monthly limit.
              </span>
              <span className="block text-xs">
                You can adjust your spending limit in your profile settings.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
            <AlertDialogAction onClick={() => navigate("/spending-limit")} className="bg-primary text-primary-foreground">
              Adjust Limit
            </AlertDialogAction>
            <AlertDialogAction onClick={() => setShowStakeWarning(false)}>
              Understood
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Dashboard;
