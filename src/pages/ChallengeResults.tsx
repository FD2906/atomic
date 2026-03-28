import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Share2, Download, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const ChallengeResults = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth("/login");
  const cardRef = useRef<HTMLDivElement>(null);
  const [challenge, setChallenge] = useState<any>(null);
  const [me, setMe] = useState<{ name: string; count: number; result: string | null; status: string }>({ name: "You", count: 0, result: null, status: "accepted" });
  const [opponent, setOpponent] = useState<{ name: string; count: number; result: string | null; status: string }>({ name: "Opponent", count: 0, result: null, status: "accepted" });
  const [totalDays, setTotalDays] = useState(14);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !id) return;
    const fetch = async () => {
      const { data: c } = await supabase.from("challenges").select("*, charities(name)").eq("id", id).single();
      if (!c) { navigate("/challenges"); return; }
      setChallenge(c);

      const start = new Date(c.start_date);
      const end = new Date(c.end_date);
      const days = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1);
      setTotalDays(days);

      const { data: parts } = await supabase.from("challenge_participants").select("user_id, status, result").eq("challenge_id", id);
      const userIds = (parts || []).map(p => p.user_id);
      const partsMap = Object.fromEntries((parts || []).map(p => [p.user_id, p]));
      const { data: profiles } = await supabase.from("profiles").select("id, first_name").in("id", userIds);
      const pMap = Object.fromEntries((profiles || []).map(p => [p.id, p.first_name || "Player"]));

      const { data: subs } = await supabase
        .from("verification_submissions").select("user_id")
        .eq("status", "approved").in("user_id", userIds)
        .gte("submitted_at", c.start_date || "").lte("submitted_at", (c.end_date || "") + "T23:59:59");

      const counts: Record<string, number> = {};
      (subs || []).forEach((s: any) => { counts[s.user_id] = (counts[s.user_id] || 0) + 1; });

      const oppId = userIds.find(uid => uid !== user.id) || "";
      const myPart = partsMap[user.id] || { status: "accepted", result: null };
      const oppPart = partsMap[oppId] || { status: "accepted", result: null };
      setMe({ name: pMap[user.id] || "You", count: counts[user.id] || 0, result: myPart.result, status: myPart.status });
      setOpponent({ name: pMap[oppId] || "Opponent", count: counts[oppId] || 0, result: oppPart.result, status: oppPart.status });
      setLoading(false);
    };
    fetch();
  }, [user, id]);

  // Determine outcome using stored results first, then fallback to submission counts
  const iQuit = me.result === "quit" || me.status === "quit";
  const theyQuit = opponent.result === "quit" || opponent.status === "quit";
  const iWon = me.result === "won" || theyQuit || (!iQuit && me.count > opponent.count);
  const iLost = me.result === "lost" || iQuit || (!theyQuit && me.count < opponent.count);

  const winner = iWon ? me.name : iLost ? opponent.name : "Tie";
  const outcome = iQuit
    ? "🚪 You quit"
    : theyQuit
    ? "🏆 Victory! Opponent quit"
    : iWon
    ? "🏆 Victory!"
    : iLost
    ? "💚 Donated to charity"
    : "🤝 It's a tie!";

  const handleShare = async () => {
          const shareOutcome = winner === "Tie" ? "It's a tie!" : iQuit ? `${me.name} quit. ${opponent.name} wins!` : `Winner: ${winner}`;
          const text = `ATOMIC Challenge Results 🔥\n${challenge?.title}\n${shareOutcome}\n${me.name}: ${me.count}/${totalDays} days\n${opponent.name}: ${opponent.count}/${totalDays} days`;
    if (navigator.share) {
      try { await navigator.share({ title: "ATOMIC Challenge Results", text }); } catch {}
    } else {
      await navigator.clipboard.writeText(text);
      toast.success("Results copied to clipboard!");
    }
  };

  const handleSaveImage = async () => {
    if (!cardRef.current) return;
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      canvas.width = 600;
      canvas.height = 400;

      // Draw card
      ctx.fillStyle = "#0f0f0f";
      ctx.roundRect(0, 0, 600, 400, 16);
      ctx.fill();

      ctx.fillStyle = "#a855f7";
      ctx.font = "bold 28px system-ui";
      ctx.textAlign = "center";
      ctx.fillText("ATOMIC", 300, 50);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 22px system-ui";
      ctx.fillText(challenge?.title || "Challenge", 300, 90);

      ctx.font = "bold 36px system-ui";
      ctx.fillText(outcome, 300, 150);

      ctx.font = "18px system-ui";
      ctx.fillStyle = "#a3a3a3";
      ctx.fillText(`${me.name}: ${me.count}/${totalDays} days`, 300, 210);
      ctx.fillText(`${opponent.name}: ${opponent.count}/${totalDays} days`, 300, 240);

      ctx.fillStyle = "#6b7280";
      ctx.font = "14px system-ui";
      ctx.fillText(`Stake: £${((challenge?.stake_amount || 0) / 100).toFixed(0)} each · ${(challenge as any)?.charities?.name || "Charity"}`, 300, 300);

      ctx.fillText("at0mic.lovable.app", 300, 370);

      const link = document.createElement("a");
      link.download = "atomic-challenge-results.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success("Image saved!");
    } catch {
      toast.error("Failed to generate image");
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
    <div className="min-h-screen bg-background max-w-md mx-auto px-4 pt-6 pb-8 space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg bg-secondary hover:bg-secondary/80">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold font-heading">Challenge Results</h1>
      </div>

      {/* Result Card */}
      <div ref={cardRef} className="glass-card rounded-2xl p-6 space-y-4 text-center">
        <Trophy className="w-12 h-12 text-primary mx-auto" />
        <h2 className="text-xl font-bold font-heading">{challenge?.title}</h2>
        <p className="text-2xl font-bold font-heading">{outcome}</p>

        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className={`rounded-xl p-4 ${iWon ? "bg-primary/10 border border-primary/30" : iQuit ? "bg-destructive/10 border border-destructive/30" : "bg-secondary"}`}>
            <p className="font-semibold font-heading text-sm">{me.name}</p>
            <p className="text-2xl font-bold font-heading">{me.count}<span className="text-sm text-muted-foreground">/{totalDays}</span></p>
            <p className="text-[10px] text-muted-foreground">{iQuit ? "quit" : "days completed"}</p>
          </div>
          <div className={`rounded-xl p-4 ${iLost && !iQuit ? "bg-destructive/10 border border-destructive/30" : theyQuit ? "bg-destructive/10 border border-destructive/30" : "bg-secondary"}`}>
            <p className="font-semibold font-heading text-sm">{opponent.name}</p>
            <p className="text-2xl font-bold font-heading">{opponent.count}<span className="text-sm text-muted-foreground">/{totalDays}</span></p>
            <p className="text-[10px] text-muted-foreground">{theyQuit ? "quit" : "days completed"}</p>
          </div>
        </div>

        <div className="pt-2 text-xs text-muted-foreground">
          <p>Stake: £{((challenge?.stake_amount || 0) / 100).toFixed(0)} each · {(challenge as any)?.charities?.name || "Charity"}</p>
          <p className="mt-1">
            {iQuit
              ? `Your stake was donated to ${(challenge as any)?.charities?.name || "charity"}. 💚`
              : theyQuit
              ? "Your stake has been returned! 🎉"
              : iWon
              ? "Your stake has been returned! 🎉"
              : iLost
              ? `Your stake was donated to ${(challenge as any)?.charities?.name || "charity"}. 💚`
              : "Both stakes returned. 🤝"}
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant="hero" size="lg" className="flex-1 gap-2" onClick={handleShare}>
          <Share2 className="w-4 h-4" /> Share Results
        </Button>
        <Button variant="outline" size="lg" className="flex-1 gap-2" onClick={handleSaveImage}>
          <Download className="w-4 h-4" /> Save Image
        </Button>
      </div>

      <Button variant="outline" size="lg" className="w-full" onClick={() => navigate("/challenges")}>
        Back to Challenges
      </Button>
    </div>
  );
};

export default ChallengeResults;
