import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Target, Flame } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface OpponentStatsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  username: string;
  firstName: string | null;
}

const OpponentStatsModal = ({ open, onOpenChange, userId, username, firstName }: OpponentStatsModalProps) => {
  const [stats, setStats] = useState({ completionRate: 0, totalHabits: 0, completedHabits: 0, totalChallenges: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open || !userId) return;
    const fetchStats = async () => {
      setLoading(true);

      // Get all habits
      const { data: habits } = await supabase
        .from("habits")
        .select("id, status, start_date, end_date")
        .eq("user_id", userId);

      const totalHabits = (habits || []).length;
      const completedHabits = (habits || []).filter((h: any) => h.status === "completed").length;

      // Get approved submissions count
      const { count: approvedCount } = await supabase
        .from("verification_submissions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("status", "approved");

      // Total possible days across all habits
      let totalDays = 0;
      (habits || []).forEach((h: any) => {
        const start = new Date(h.start_date);
        const end = h.end_date ? new Date(h.end_date) : start;
        totalDays += Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1);
      });

      const rate = totalDays > 0 ? Math.round(((approvedCount || 0) / totalDays) * 100) : 0;

      // Get challenge count
      const { count: challengeCount } = await supabase
        .from("challenge_participants")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("status", "accepted");

      setStats({
        completionRate: Math.min(rate, 100),
        totalHabits,
        completedHabits,
        totalChallenges: challengeCount || 0,
      });
      setLoading(false);
    };
    fetchStats();
  }, [open, userId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-heading flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-bold text-primary">{(firstName || username).charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <p>{firstName || username}</p>
              <p className="text-xs text-muted-foreground font-normal">@{username}</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-6">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="glass-card rounded-xl p-3 text-center">
              <Target className="w-5 h-5 mx-auto text-primary mb-1" />
              <p className="text-lg font-bold font-heading">{stats.completionRate}%</p>
              <p className="text-[10px] text-muted-foreground">Completion</p>
            </div>
            <div className="glass-card rounded-xl p-3 text-center">
              <Flame className="w-5 h-5 mx-auto text-warning mb-1" />
              <p className="text-lg font-bold font-heading">{stats.completedHabits}</p>
              <p className="text-[10px] text-muted-foreground">Completed</p>
            </div>
            <div className="glass-card rounded-xl p-3 text-center">
              <Trophy className="w-5 h-5 mx-auto text-success mb-1" />
              <p className="text-lg font-bold font-heading">{stats.totalChallenges}</p>
              <p className="text-[10px] text-muted-foreground">Challenges</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default OpponentStatsModal;
