import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, TrendingUp, Heart, Target } from "lucide-react";
import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

const COLORS = ["hsl(var(--primary))", "hsl(var(--destructive))", "hsl(var(--warning))", "hsl(var(--success))", "hsl(var(--accent))"];

const Analytics = () => {
  const navigate = useNavigate();
  const { user } = useAuth("/login");
  const [completionData, setCompletionData] = useState<{ label: string; completed: number; total: number }[]>([]);
  const [donationData, setDonationData] = useState<{ name: string; value: number }[]>([]);
  const [totals, setTotals] = useState({ completed: 0, total: 0, donated: 0, recovered: 0 });

  useEffect(() => {
    if (!user) return;

    const fetch = async () => {
      // Habits with stakes
      const { data: habits } = await supabase
        .from("habits")
        .select("id, title, category, start_date, end_date, status, stakes(amount, status, charities(name))")
        .eq("user_id", user.id);

      // All approved submissions
      const { data: subs } = await supabase
        .from("verification_submissions")
        .select("habit_id")
        .eq("user_id", user.id)
        .eq("status", "approved");

      const subCounts: Record<string, number> = {};
      (subs || []).forEach((s: any) => {
        subCounts[s.habit_id] = (subCounts[s.habit_id] || 0) + 1;
      });

      let totalDays = 0, completedDays = 0, totalDonated = 0, totalRecovered = 0;
      const charityMap: Record<string, number> = {};
      const categoryMap: Record<string, { completed: number; total: number }> = {};

      (habits || []).forEach((h: any) => {
        const start = new Date(h.start_date);
        const end = h.end_date ? new Date(h.end_date) : start;
        const days = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1);
        const done = subCounts[h.id] || 0;
        totalDays += days;
        completedDays += done;

        const cat = h.category ? h.category.charAt(0).toUpperCase() + h.category.slice(1) : "Other";
        if (!categoryMap[cat]) categoryMap[cat] = { completed: 0, total: 0 };
        categoryMap[cat].completed += done;
        categoryMap[cat].total += days;

        (h.stakes || []).forEach((s: any) => {
          const amt = Number(s.amount) / 100;
          if (s.status === "donated") {
            totalDonated += amt;
            const charity = s.charities?.name || "Other";
            charityMap[charity] = (charityMap[charity] || 0) + amt;
          } else if (s.status === "returned") {
            totalRecovered += amt;
          }
        });
      });

      const perCategory = Object.entries(categoryMap).map(([label, data]) => ({
        label,
        completed: data.completed,
        total: data.total,
      }));

      setCompletionData(perCategory.slice(0, 8));
      setDonationData(Object.entries(charityMap).map(([name, value]) => ({ name, value: Math.round(value) })));
      setTotals({ completed: completedDays, total: totalDays, donated: Math.round(totalDonated), recovered: Math.round(totalRecovered) });
    };

    fetch();

    // Realtime: re-fetch when verification submissions or stakes change
    const channel = supabase
      .channel("analytics-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "verification_submissions", filter: `user_id=eq.${user.id}` }, () => fetch())
      .on("postgres_changes", { event: "*", schema: "public", table: "stakes", filter: `user_id=eq.${user.id}` }, () => fetch())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const rate = totals.total > 0 ? Math.round((totals.completed / totals.total) * 100) : 0;

  return (
    <div className="min-h-screen bg-background px-4 pt-6 pb-8 space-y-6 max-w-md mx-auto">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg bg-secondary hover:bg-secondary/80">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold font-heading">Analytics</h1>
      </div>

      {/* Summary Cards */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-3 gap-2">
        <div className="glass-card rounded-xl p-3 text-center">
          <Target className="w-5 h-5 mx-auto text-primary mb-1" />
          <p className="text-lg font-bold font-heading">{rate}%</p>
          <p className="text-[10px] text-muted-foreground">{totals.completed}/{totals.total} days</p>
        </div>
        <div className="glass-card rounded-xl p-3 text-center">
          <Heart className="w-5 h-5 mx-auto text-destructive mb-1" />
          <p className="text-lg font-bold font-heading">£{totals.donated}</p>
          <p className="text-[10px] text-muted-foreground">Donated</p>
        </div>
        <div className="glass-card rounded-xl p-3 text-center">
          <TrendingUp className="w-5 h-5 mx-auto text-success mb-1" />
          <p className="text-lg font-bold font-heading">£{totals.recovered}</p>
          <p className="text-[10px] text-muted-foreground">Recovered</p>
        </div>
      </motion.div>

      {/* Completion Rate Chart */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-xl p-4 space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Completion by Category</h2>
        {completionData.length > 0 ? (
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={completionData} barGap={2}>
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                  formatter={(value: number, name: string) => [value, name === "completed" ? "Completed" : "Total"]}
                />
                <Bar dataKey="total" fill="hsl(var(--muted))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="completed" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">No habit data yet</p>
        )}
      </motion.div>

      {/* Donations by Charity */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card rounded-xl p-4 space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Donations by Charity</h2>
        {donationData.length > 0 ? (
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={donationData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, value }) => `£${value}`}>
                  {donationData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Tooltip formatter={(value: number) => [`£${value}`, "Donated"]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">No donations yet</p>
        )}
      </motion.div>
    </div>
  );
};

export default Analytics;
