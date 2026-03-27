import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Shield, Trophy, HeartHandshake, DoorOpen, Scale } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface ChallengeRulesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccept: () => void;
  stakeAmount: number;
  duration: number;
  charityName: string;
  loading?: boolean;
}

const rules = [
  { icon: Trophy, label: "Win", description: "Complete more days than your opponent. Your stake is returned." },
  { icon: HeartHandshake, label: "Tie", description: "Both complete equal days. Both stakes are returned." },
  { icon: Scale, label: "Lose", description: "Complete fewer days. Your stake is donated to the selected charity." },
  { icon: DoorOpen, label: "Quit", description: "If you quit early, your entire stake goes to charity immediately." },
];

const ChallengeRulesDialog = ({
  open,
  onOpenChange,
  onAccept,
  stakeAmount,
  duration,
  charityName,
  loading,
}: ChallengeRulesDialogProps) => {
  const [accepted, setAccepted] = useState(false);

  const handleAccept = () => {
    onAccept();
    setAccepted(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setAccepted(false); }}>
      <DialogContent className="bg-card border-border max-w-sm max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Challenge Rules
          </DialogTitle>
          <DialogDescription>
            Both players stake £{(stakeAmount / 100).toFixed(0)} each for {duration} days. Losing stake goes to {charityName}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {rules.map((rule) => (
            <div key={rule.label} className="flex items-start gap-3 p-3 rounded-xl bg-secondary/50">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <rule.icon className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold font-heading">{rule.label}</p>
                <p className="text-xs text-muted-foreground">{rule.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-start gap-3 p-3 rounded-xl border border-primary/20 bg-primary/5">
          <Checkbox
            id="rules-accept"
            checked={accepted}
            onCheckedChange={(v) => setAccepted(v === true)}
            className="mt-0.5"
          />
          <label htmlFor="rules-accept" className="text-xs text-foreground cursor-pointer leading-relaxed">
            I understand these rules and agree to stake £{(stakeAmount / 100).toFixed(0)} on this challenge
          </label>
        </div>

        <div className="flex gap-2 pt-1">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button className="flex-1" disabled={!accepted || loading} onClick={handleAccept}>
            {loading ? "Processing..." : "Accept & Start"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChallengeRulesDialog;
