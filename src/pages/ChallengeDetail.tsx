import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowLeft, Swords, Flag, DoorOpen, Trophy, Camera, Check, Clock, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { differenceInDays, parseISO } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface ParticipantData {
  user_id: string;
  status: string;
  name: string;
  submissions_count: number;
}

const ChallengeDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth("/login");
  const [challenge, setChallenge] = useState<any>(null);
  const [participants, setParticipants] = useState<ParticipantData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showQuitDialog, setShowQuitDialog] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportingUser, setReportingUser] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !id) return;
    fetchChallenge();
  }, [user, id]);

  const fetchChallenge = async () => {
    if (!id || !user) return;

    const { data: challengeData } = await supabase
      .from("challenges")
      .select("*, charities(name)")
      .eq("id", id)
      .single();

    if (!challengeData) {
      navigate("/challenges");
      return;
    }

    setChallenge(challengeData);

    // Get participants
    const { data: parts } = await supabase
      .from("challenge_participants")
      .select("user_id, status")
      .eq("challenge_id", id);

    const userIds = (parts || []).map((p) => p.user_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, first_name")
      .in("id", userIds);

    const profileMap = Object.fromEntries(
      (profiles || []).map((p) => [p.id, p.first_name || "Player"])
    );

    // Count submissions per user for this challenge's date range
    const { data: submissions } = await supabase
      .from("verification_submissions")
      .select("user_id")
      .in("user_id", userIds)
      .gte("submitted_at", challengeData.start_date || "")
      .lte("submitted_at", (challengeData.end_date || "") + "T23:59:59");

    const submissionCounts: Record<string, number> = {};
    (submissions || []).forEach((s: any) => {
      submissionCounts[s.user_id] = (submissionCounts[s.user_id] || 0) + 1;
    });

    const mapped: ParticipantData[] = (parts || []).map((p) => ({
      user_id: p.user_id,
      status: p.status,
      name: profileMap[p.user_id] || "Player",
      submissions_count: submissionCounts[p.user_id] || 0,
    }));

    setParticipants(mapped);
    setLoading(false);
  };

  const totalDays = challenge?.start_date && challenge?.end_date
    ? differenceInDays(parseISO(challenge.end_date), parseISO(challenge.start_date)) + 1
    : 14;

  const currentDay = challenge?.start_date
    ? Math.min(Math.max(1, differenceInDays(new Date(), parseISO(challenge.start_date)) + 1), totalDays)
    : 1;

  const me = participants.find((p) => p.user_id === user?.id);
  const opponent = participants.find((p) => p.user_id !== user?.id);

  const handleQuit = async () => {
    if (!user || !id) return;
    try {
      await supabase
        .from("challenge_participants")
        .update({ status: "quit" })
        .eq("challenge_id", id)
        .eq("user_id", user.id);

      await supabase
        .from("challenges")
        .update({ status: "completed" })
        .eq("id", id);

      if (opponent) {
        await supabase.from("notifications").insert({
          user_id: opponent.user_id,
          message: `Your opponent quit the challenge "${challenge?.title}"! Their stake goes to charity. 🎉`,
          type: "challenge_update",
        });
      }

      toast.success("You've quit the challenge. Your stake goes to charity.");
      setShowQuitDialog(false);
      navigate("/challenges");
    } catch (err) {
      console.error("Quit error:", err);
      toast.error("Failed to quit challenge");
    }
  };

  const handleReport = async () => {
    if (!user || !reportingUser || !reportReason.trim() || !id) return;
    try {
      const { error } = await supabase.from("fraud_reports").insert({
        challenge_id: id,
        reporter_id: user.id,
        reported_user_id: reportingUser,
        reason: reportReason.trim(),
        status: "pending",
      });

      if (error) {
        console.error("Report error:", error);
        toast.error("Failed to submit report");
        return;
      }

      toast.success("Report submitted for review");
      setShowReportDialog(false);
      setReportReason("");
    } catch (err) {
      console.error("Report error:", err);
      toast.error("Failed to submit report");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-8 space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/challenges")} className="p-2 rounded-lg bg-secondary hover:bg-secondary/80">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold font-heading">{challenge?.title}</h1>
      </div>

      {/* Status Badge */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-4 text-center space-y-1">
        <div className="flex items-center justify-center gap-2">
          <Swords className="w-5 h-5 text-primary" />
          <span className={cn(
            "text-xs font-bold uppercase px-3 py-1 rounded-full",
            challenge?.status === "active" ? "bg-success/10 text-success" :
            challenge?.status === "pending" ? "bg-warning/10 text-warning" :
            "bg-muted text-muted-foreground"
          )}>
            {challenge?.status}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Day {currentDay} of {totalDays} · £{((challenge?.stake_amount || 0) / 100).toFixed(0)} each · {(challenge as any)?.charities?.name || "Charity"}
        </p>
      </motion.div>

      {/* Head-to-Head */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Head to Head</h2>

        <div className="grid grid-cols-2 gap-3">
          {/* You */}
          <div className="glass-card rounded-xl p-4 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <span className="text-lg font-bold font-heading text-primary">
                {me?.name?.charAt(0)?.toUpperCase() || "Y"}
              </span>
            </div>
            <p className="font-semibold font-heading text-sm">{me?.name || "You"}</p>
            <div className="flex items-center justify-center gap-1">
              <Check className="w-3.5 h-3.5 text-success" />
              <span className="text-lg font-bold font-heading">{me?.submissions_count || 0}</span>
              <span className="text-xs text-muted-foreground">/ {totalDays}</span>
            </div>
            <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${((me?.submissions_count || 0) / totalDays) * 100}%` }}
              />
            </div>
            {me?.status === "quit" && (
              <span className="text-[10px] font-bold text-destructive uppercase">Quit</span>
            )}
          </div>

          {/* Opponent */}
          <div className="glass-card rounded-xl p-4 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
              <span className="text-lg font-bold font-heading text-destructive">
                {opponent?.name?.charAt(0)?.toUpperCase() || "?"}
              </span>
            </div>
            <p className="font-semibold font-heading text-sm">{opponent?.name || "Waiting..."}</p>
            <div className="flex items-center justify-center gap-1">
              <Check className="w-3.5 h-3.5 text-success" />
              <span className="text-lg font-bold font-heading">{opponent?.submissions_count || 0}</span>
              <span className="text-xs text-muted-foreground">/ {totalDays}</span>
            </div>
            <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-destructive rounded-full transition-all"
                style={{ width: `${((opponent?.submissions_count || 0) / totalDays) * 100}%` }}
              />
            </div>
            {opponent?.status === "quit" && (
              <span className="text-[10px] font-bold text-destructive uppercase">Quit</span>
            )}
            {opponent?.status === "invited" && (
              <span className="text-[10px] font-bold text-warning uppercase">Invited</span>
            )}
          </div>
        </div>
      </motion.div>

      {/* Actions */}
      {challenge?.status === "active" && me?.status === "accepted" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-3">
          <Button
            variant="hero"
            size="lg"
            className="w-full gap-2"
            onClick={() => {
              const params = new URLSearchParams({
                habit: challenge.title,
                habitId: "",
                day: currentDay.toString(),
                total: totalDays.toString(),
                charity: (challenge as any)?.charities?.name || "Charity",
                stake: ((challenge.stake_amount || 0) / 100).toFixed(0),
              });
              navigate(`/submit-evidence?${params.toString()}`);
            }}
          >
            <Camera className="w-5 h-5" />
            Submit Today's Evidence
          </Button>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-1.5 text-destructive border-destructive/20 hover:bg-destructive/10"
              onClick={() => setShowQuitDialog(true)}
            >
              <DoorOpen className="w-4 h-4" />
              Quit
            </Button>
            {opponent && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-1.5 text-warning border-warning/20 hover:bg-warning/10"
                onClick={() => {
                  setReportingUser(opponent.user_id);
                  setShowReportDialog(true);
                }}
              >
                <Flag className="w-4 h-4" />
                Report
              </Button>
            )}
          </div>
        </motion.div>
      )}

      {challenge?.status === "completed" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-6 text-center space-y-2">
          <Trophy className="w-10 h-10 text-primary mx-auto" />
          <p className="font-semibold font-heading">Challenge Complete</p>
          <p className="text-xs text-muted-foreground">
            {me && opponent
              ? me.submissions_count > opponent.submissions_count
                ? "You won! 🎉 Your stake has been returned."
                : me.submissions_count < opponent.submissions_count
                ? "You lost. Your stake goes to charity. 💚"
                : "It's a tie! Both stakes returned."
              : "Challenge has ended."}
          </p>
        </motion.div>
      )}

      {/* Quit Dialog */}
      <Dialog open={showQuitDialog} onOpenChange={setShowQuitDialog}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading">Quit Challenge?</DialogTitle>
            <DialogDescription>
              If you quit, your £{((challenge?.stake_amount || 0) / 100).toFixed(0)} stake will be donated to {(challenge as any)?.charities?.name || "charity"}. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setShowQuitDialog(false)}>Cancel</Button>
            <Button variant="destructive" className="flex-1" onClick={handleQuit}>Quit & Donate</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Report Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading">Report Suspicious Activity</DialogTitle>
            <DialogDescription>
              Flag your opponent's submission for admin review (e.g., reused photos, timestamp manipulation).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs uppercase tracking-wider">Reason</Label>
              <Textarea
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="Describe the suspicious activity..."
                className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowReportDialog(false)}>Cancel</Button>
              <Button className="flex-1" disabled={!reportReason.trim()} onClick={handleReport}>Submit Report</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChallengeDetail;
