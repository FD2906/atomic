import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useProfile } from "@/hooks/useProfile";

const limitOptions = [
  { value: 1000, label: "£10" },
  { value: 2500, label: "£25" },
  { value: 5000, label: "£50" },
  { value: 10000, label: "£100" },
  { value: null, label: "No limit" },
];

const SpendingLimit = () => {
  const navigate = useNavigate();
  const { profile, updateProfile } = useProfile();
  const [selected, setSelected] = useState<number | null>(2500);

  useEffect(() => {
    if (profile?.spending_limit !== undefined) {
      setSelected(profile.spending_limit);
    }
  }, [profile]);

  const handleSave = async () => {
    const result = await updateProfile({ spending_limit: selected });
    if (result?.error) {
      toast.error("Failed to update spending limit");
    } else {
      toast.success("Spending limit updated");
      navigate(-1);
    }
  };

  return (
    <div className="min-h-screen bg-background max-w-md mx-auto px-4 pt-6 pb-8 space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg bg-secondary hover:bg-secondary/80">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold font-heading">Spending Limit</h1>
      </div>

      <p className="text-sm text-muted-foreground">
        Set a monthly cap on how much you can stake. This helps you stay in control.
      </p>

      <div className="space-y-2">
        {limitOptions.map((opt) => (
          <button
            key={opt.label}
            onClick={() => setSelected(opt.value)}
            className={cn(
              "w-full flex items-center justify-between p-4 rounded-xl transition-all text-left",
              selected === opt.value ? "bg-primary/10 border-2 border-primary" : "glass-card hover:bg-secondary/80"
            )}
          >
            <span className="font-semibold font-heading">{opt.label}</span>
            {selected === opt.value && <span className="w-3 h-3 rounded-full bg-primary" />}
          </button>
        ))}
      </div>

      <Button variant="hero" size="lg" className="w-full" onClick={handleSave}>
        Save
      </Button>
    </div>
  );
};

export default SpendingLimit;
