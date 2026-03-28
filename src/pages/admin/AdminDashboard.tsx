import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/useAdmin";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  ArrowLeft, Shield, Users, FileCheck, AlertTriangle, Scale, BarChart3,
  ClipboardList, ChevronRight, Loader2
} from "lucide-react";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { isAdmin, loading: authLoading, user } = useAdmin();
  const [stats, setStats] = useState({
    pendingSubmissions: 0,
    pendingFraud: 0,
    pendingAppeals: 0,
    totalUsers: 0,
    totalDonated: 0,
    activeHabits: 0,
    activeChallenges: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin || !user) return;

    const fetchStats = async () => {
      const [submissions, fraud, appeals, users, stakes, habits, challenges] = await Promise.all([
        supabase.from("verification_submissions").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("fraud_reports").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("appeals").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("stakes").select("amount").eq("status", "donated"),
        supabase.from("habits").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("challenges" as any).select("id", { count: "exact", head: true }).eq("status", "active"),
      ]);

      const totalDonated = (stakes.data || []).reduce((sum: number, s: any) => sum + Number(s.amount), 0);

      setStats({
        pendingSubmissions: submissions.count || 0,
        pendingFraud: fraud.count || 0,
        pendingAppeals: appeals.count || 0,
        totalUsers: users.count || 0,
        totalDonated: Math.round(totalDonated / 100),
        activeHabits: habits.count || 0,
        activeChallenges: challenges.count || 0,
      });
      setLoading(false);
    };

    fetchStats();
  }, [isAdmin, user]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const cards = [
    {
      title: "Verification Queue",
      description: `${stats.pendingSubmissions} pending review`,
      icon: FileCheck,
      path: "/admin/verifications",
      urgent: stats.pendingSubmissions > 0,
    },
    {
      title: "Fraud Reports",
      description: `${stats.pendingFraud} unresolved`,
      icon: AlertTriangle,
      path: "/admin/fraud",
      urgent: stats.pendingFraud > 0,
    },
    {
      title: "Appeals",
      description: `${stats.pendingAppeals} pending`,
      icon: Scale,
      path: "/admin/appeals",
      urgent: stats.pendingAppeals > 0,
    },
    {
      title: "User Management",
      description: `${stats.totalUsers} users`,
      icon: Users,
      path: "/admin/users",
    },
    {
      title: "Audit Log",
      description: "View admin actions",
      icon: ClipboardList,
      path: "/admin/audit",
    },
  ];

  return (
    <div className="min-h-screen bg-background px-4 pt-6 pb-8 space-y-6 max-w-md mx-auto">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/dashboard")} className="p-2 rounded-lg bg-secondary hover:bg-secondary/80">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-bold font-heading">Admin Dashboard</h1>
        </div>
      </div>

      {/* Platform Stats */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="glass-card rounded-xl p-4 text-center">
          <p className="text-2xl font-bold font-heading text-primary">{stats.totalUsers}</p>
          <p className="text-xs text-muted-foreground">Total Users</p>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <p className="text-2xl font-bold font-heading text-success">£{stats.totalDonated}</p>
          <p className="text-xs text-muted-foreground">Total Donated</p>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <p className="text-2xl font-bold font-heading">{stats.activeHabits}</p>
          <p className="text-xs text-muted-foreground">Active Habits</p>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <p className="text-2xl font-bold font-heading">{stats.activeChallenges}</p>
          <p className="text-xs text-muted-foreground">Active Challenges</p>
        </div>
      </motion.div>

      {/* Action Cards */}
      <div className="space-y-2">
        {cards.map((card, i) => (
          <motion.button
            key={card.path}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => navigate(card.path)}
            className="w-full flex items-center gap-4 p-4 rounded-xl glass-card hover:ring-1 hover:ring-primary/30 transition-all text-left"
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${card.urgent ? "bg-destructive/10" : "bg-primary/10"}`}>
              <card.icon className={`w-5 h-5 ${card.urgent ? "text-destructive" : "text-primary"}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold font-heading text-sm">{card.title}</p>
              <p className={`text-xs ${card.urgent ? "text-destructive font-semibold" : "text-muted-foreground"}`}>
                {card.description}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
