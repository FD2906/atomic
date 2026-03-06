import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { ArrowLeft, Swords, Dumbbell, BookOpen, Moon, Droplets, Plus, Check, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { addDays, format } from "date-fns";

const categories = [
  { id: "exercise", label: "Exercise", icon: Dumbbell },
  { id: "reading", label: "Reading", icon: BookOpen },
  { id: "sleep", label: "Sleep", icon: Moon },
  { id: "hydration", label: "Hydration", icon: Droplets },
  { id: "other", label: "+ More", icon: Plus },
];

const stakeOptions = [200, 500, 1000, 2000];

interface Charity {
  id: string;
  name: string;
  description: string | null;
}

const CreateChallenge = () => {
  const navigate = useNavigate();
  const { user } = useAuth("/login");
  const [title, setTitle] = useState("");
  const [opponentEmail, setOpponentEmail] = useState("");
  const [category, setCategory] = useState("exercise");
  const [duration, setDuration] = useState(14);
  const [stake, setStake] = useState(500);
  const [selectedCharity, setSelectedCharity] = useState("");
  const [charities, setCharities] = useState<Charity[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase.from("charities").select("id, name, description").then(({ data }) => {
      setCharities(data || []);
    });
  }, []);

  const canSubmit = title && opponentEmail && category && selectedCharity && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit || !user) return;
    setSubmitting(true);

    try {
      const startDate = format(new Date(), "yyyy-MM-dd");
      const endDate = format(addDays(new Date(), duration - 1), "yyyy-MM-dd");

      // Find opponent by email
      const { data: opponentProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", opponentEmail.trim().toLowerCase())
        .single();

      if (!opponentProfile) {
        toast.error("No user found with that email. They need to sign up first.");
        setSubmitting(false);
        return;
      }

      if (opponentProfile.id === user.id) {
        toast.error("You can't challenge yourself!");
        setSubmitting(false);
        return;
      }

      // Create challenge
      const { data: challenge, error: challengeError } = await supabase
        .from("challenges")
        .insert({
          title,
          description: `${category} challenge - ${duration} days`,
          is_group_challenge: false,
          start_date: startDate,
          end_date: endDate,
          status: "pending",
          created_by: user.id,
          stake_amount: stake,
          habit_category: category,
          charity_id: selectedCharity,
        })
        .select("id")
        .single();

      if (challengeError || !challenge) {
        console.error("Challenge creation error:", challengeError);
        toast.error(challengeError?.message || "Failed to create challenge");
        setSubmitting(false);
        return;
      }

      // Add creator as accepted participant
      const { error: creatorError } = await supabase.from("challenge_participants").insert({
        challenge_id: challenge.id,
        user_id: user.id,
        status: "accepted",
      });

      if (creatorError) {
        console.error("Creator participant error:", creatorError);
      }

      // Invite opponent
      const { error: inviteError } = await supabase.from("challenge_participants").insert({
        challenge_id: challenge.id,
        user_id: opponentProfile.id,
        status: "invited",
      });

      if (inviteError) {
        console.error("Invite error:", inviteError);
        toast.error("Failed to invite opponent");
        setSubmitting(false);
        return;
      }

      // Create notification for opponent
      await supabase.from("notifications").insert({
        user_id: opponentProfile.id,
        message: `You've been challenged to a 1v1: "${title}"! Accept or decline in Challenges.`,
        type: "challenge_invite",
      });

      toast.success("Challenge sent! ⚔️");
      navigate("/challenges");
    } catch (err) {
      console.error("Unexpected error:", err);
      toast.error("An unexpected error occurred.");
      setSubmitting(false);
    }
  };

  return (
    <div className="px-4 pt-6 pb-8 space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg bg-secondary hover:bg-secondary/80">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <Swords className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-bold font-heading">New 1v1 Challenge</h1>
        </div>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        <div className="space-y-2">
          <Label className="text-muted-foreground text-xs uppercase tracking-wider">Challenge Name</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Who runs more?"
            className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-muted-foreground text-xs uppercase tracking-wider">Opponent's Email</Label>
          <Input
            type="email"
            value={opponentEmail}
            onChange={(e) => setOpponentEmail(e.target.value)}
            placeholder="friend@example.com"
            className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
          />
          <p className="text-xs text-muted-foreground">They must have an ATOMIC account</p>
        </div>

        <div className="space-y-2">
          <Label className="text-muted-foreground text-xs uppercase tracking-wider">Category</Label>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all",
                  category === cat.id ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground hover:bg-secondary/80"
                )}
              >
                <cat.icon className="w-4 h-4" />
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-muted-foreground text-xs uppercase tracking-wider">Duration (Days)</Label>
          <Input
            type="number"
            value={duration}
            onChange={(e) => setDuration(parseInt(e.target.value) || 1)}
            min={1}
            max={90}
            className="bg-secondary border-border text-foreground w-24"
          />
        </div>

        <div className="space-y-3">
          <Label className="text-muted-foreground text-xs uppercase tracking-wider">Matched Stake (Each)</Label>
          <div className="flex gap-2">
            {stakeOptions.map((amount) => (
              <button
                key={amount}
                onClick={() => setStake(amount)}
                className={cn(
                  "flex-1 py-3 rounded-xl text-sm font-bold font-heading transition-all",
                  stake === amount ? "bg-primary text-primary-foreground glow-primary" : "bg-secondary text-foreground hover:bg-secondary/80"
                )}
              >
                £{amount / 100}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">⚔️ Both players stake the same amount</p>
        </div>

        <div className="space-y-3">
          <Label className="text-muted-foreground text-xs uppercase tracking-wider">Losing Stake Goes To</Label>
          <div className="space-y-2">
            {charities.map((charity) => (
              <button
                key={charity.id}
                onClick={() => setSelectedCharity(charity.id)}
                className={cn(
                  "w-full flex items-center gap-3 p-4 rounded-xl transition-all text-left",
                  selectedCharity === charity.id ? "bg-primary/10 border-2 border-primary" : "glass-card hover:bg-secondary/80"
                )}
              >
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                  <Heart className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold font-heading text-sm">{charity.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{charity.description}</p>
                </div>
                {selectedCharity === charity.id && <Check className="w-5 h-5 text-primary flex-shrink-0" />}
              </button>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-xl p-4 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Rules</p>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Both players stake £{(stake / 100).toFixed(0)} each</li>
            <li>• Submit daily evidence for {duration} days</li>
            <li>• If you quit, your stake goes to charity</li>
            <li>• Flag suspicious submissions for review</li>
          </ul>
        </div>

        <div className="space-y-3 pt-2">
          <Button variant="hero" size="lg" className="w-full gap-2" disabled={!canSubmit} onClick={handleSubmit}>
            <Swords className="w-5 h-5" />
            {submitting ? "Sending..." : "Send Challenge"}
          </Button>
          <Button variant="outline" size="lg" className="w-full" onClick={() => navigate(-1)}>
            Back
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default CreateChallenge;
