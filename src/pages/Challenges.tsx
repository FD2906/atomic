import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { Swords, Plus, Clock, Zap, Trophy, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ChallengeItem {
  id: string;
  title: string;
  habit_category: string;
  stake_amount: number;
  status: string;
  start_date: string | null;
  end_date: string | null;
  opponent_name: string;
  participant_status: string;
}

const Challenges = () => {
  const navigate = useNavigate();
  const { user } = useAuth("/login");
  const [challenges, setChallenges] = useState<ChallengeItem[]>([]);
  const [tab, setTab] = useState<"active" | "invites" | "completed">("active");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchChallenges();

    const channel = supabase
      .channel("challenge_updates")
      .on("postgres_changes", { event: "*", schema: "public", table: "challenge_participants" }, () => {
        fetchChallenges();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const fetchChallenges = async () => {
    if (!user) return;

    // Get all challenges the user is part of
    const { data: participations } = await supabase
      .from("challenge_participants")
      .select("challenge_id, status")
      .eq("user_id", user.id);

    if (!participations?.length) {
      setChallenges([]);
      setLoading(false);
      return;
    }

    const challengeIds = participations.map((p) => p.challenge_id);
    const participantStatusMap = Object.fromEntries(
      participations.map((p) => [p.challenge_id, p.status])
    );

    const { data: challengesData } = await supabase
      .from("challenges")
      .select("*")
      .in("id", challengeIds);

    // Get all participants to find opponent names
    const { data: allParticipants } = await supabase
      .from("challenge_participants")
      .select("challenge_id, user_id, status")
      .in("challenge_id", challengeIds);

    const opponentIds = (allParticipants || [])
      .filter((p) => p.user_id !== user.id)
      .map((p) => p.user_id);

    let profileMap: Record<string, string> = {};
    if (opponentIds.length) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, first_name")
        .in("id", opponentIds);
      profileMap = Object.fromEntries(
        (profiles || []).map((p) => [p.id, p.first_name || "Opponent"])
      );
    }

    const mapped: ChallengeItem[] = (challengesData || []).map((c: any) => {
      const opponent = (allParticipants || []).find(
        (p) => p.challenge_id === c.id && p.user_id !== user.id
      );
      return {
        id: c.id,
        title: c.title,
        habit_category: c.habit_category || "exercise",
        stake_amount: c.stake_amount || 500,
        status: c.status,
        start_date: c.start_date,
        end_date: c.end_date,
        opponent_name: opponent ? profileMap[opponent.user_id] || "Opponent" : "Waiting...",
        participant_status: participantStatusMap[c.id] || "invited",
      };
    });

    setChallenges(mapped);
    setLoading(false);
  };

  const invites = challenges.filter((c) => c.participant_status === "invited");
  const active = challenges.filter((c) => c.participant_status === "accepted" && c.status === "active");
  const completed = challenges.filter((c) => c.status === "completed" || c.status === "cancelled");

  const displayed = tab === "invites" ? invites : tab === "active" ? active : completed;

  const handleAccept = async (challengeId: string) => {
    if (!user) return;
    await supabase
      .from("challenge_participants")
      .update({ status: "accepted" })
      .eq("challenge_id", challengeId)
      .eq("user_id", user.id);
    fetchChallenges();
  };

  const handleDecline = async (challengeId: string) => {
    if (!user) return;
    await supabase
      .from("challenge_participants")
      .delete()
      .eq("challenge_id", challengeId)
      .eq("user_id", user.id);
    fetchChallenges();
  };

  const statusIcon = {
    active: Zap,
    invites: Clock,
    completed: Trophy,
  };

  return (
    <div className="px-4 pt-6 pb-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold font-heading">1v1 Challenges</h1>
        <Button size="sm" onClick={() => navigate("/challenges/create")} className="gap-1.5">
          <Plus className="w-4 h-4" /> Challenge
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-secondary rounded-xl p-1">
        {(["active", "invites", "completed"] as const).map((t) => {
          const Icon = statusIcon[t];
          const count = t === "active" ? active.length : t === "invites" ? invites.length : completed.length;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-semibold transition-all capitalize",
                tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {t}
              {count > 0 && (
                <span className={cn(
                  "w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold",
                  tab === t ? "bg-primary-foreground text-primary" : "bg-muted-foreground/20 text-muted-foreground"
                )}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : displayed.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-8 text-center space-y-3">
          <Swords className="w-10 h-10 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">
            {tab === "invites" ? "No pending invites" : tab === "active" ? "No active challenges" : "No completed challenges"}
          </p>
          {tab !== "invites" && (
            <button onClick={() => navigate("/challenges/create")} className="text-sm text-primary font-semibold hover:underline">
              Challenge someone →
            </button>
          )}
        </motion.div>
      ) : (
        <div className="space-y-3">
          {displayed.map((challenge, i) => (
            <motion.div
              key={challenge.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card rounded-xl p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Swords className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold font-heading text-sm">{challenge.title}</p>
                    <p className="text-xs text-muted-foreground">vs {challenge.opponent_name}</p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-primary">£{(challenge.stake_amount / 100).toFixed(0)}</span>
              </div>

              {tab === "invites" ? (
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1" onClick={() => handleAccept(challenge.id)}>Accept</Button>
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => handleDecline(challenge.id)}>Decline</Button>
                </div>
              ) : (
                <button
                  onClick={() => navigate(`/challenges/${challenge.id}`)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-secondary text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                  View Details <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Challenges;
