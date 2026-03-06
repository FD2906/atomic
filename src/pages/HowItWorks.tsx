import { useNavigate } from "react-router-dom";
import { ArrowLeft, Target, DollarSign, CheckCircle, Heart } from "lucide-react";
import { motion } from "framer-motion";

const steps = [
  { icon: Target, title: "Create a habit", desc: "Choose what you want to build — exercise, reading, sleep, or more." },
  { icon: DollarSign, title: "Stake money", desc: "Put skin in the game. Minimum £2, recommended £5 for beginners." },
  { icon: CheckCircle, title: "Complete daily", desc: "Submit photo evidence each day. Verified by our review team." },
  { icon: Heart, title: "Win or give", desc: "Complete it? Get your stake back. Miss it? It goes to your chosen charity." },
];

const HowItWorks = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background max-w-md mx-auto px-4 pt-6 pb-8 space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg bg-secondary hover:bg-secondary/80">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold font-heading">How It Works</h1>
      </div>

      <div className="space-y-4">
        {steps.map((step, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card rounded-xl p-4 flex items-start gap-4"
          >
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <step.icon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold font-heading text-sm">{step.title}</p>
              <p className="text-xs text-muted-foreground mt-1">{step.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="glass-card rounded-xl p-4 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Stake Flow</p>
        <div className="flex items-center justify-between text-center">
          <div className="flex-1">
            <DollarSign className="w-6 h-6 text-primary mx-auto" />
            <p className="text-xs font-semibold mt-1">Held</p>
          </div>
          <div className="h-px w-8 bg-border" />
          <div className="flex-1">
            <CheckCircle className="w-6 h-6 text-success mx-auto" />
            <p className="text-xs font-semibold mt-1 text-success">Returned</p>
          </div>
          <span className="text-muted-foreground text-xs">/</span>
          <div className="flex-1">
            <Heart className="w-6 h-6 text-destructive mx-auto" />
            <p className="text-xs font-semibold mt-1 text-destructive">Donated</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HowItWorks;
