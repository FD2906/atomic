import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, ArrowRight, Target, DollarSign, CheckCircle, Heart } from "lucide-react";

const steps = [
  {
    title: "Welcome to ATOMIC",
    subtitle: "Build habits with real accountability",
    description: "Stake money on the habits you want to build. Complete them and get it back. Fail, and it goes to a charity you believe in.",
    icon: Zap,
  },
  {
    title: "How It Works",
    subtitle: "Simple. Powerful. Rewarding.",
    steps: [
      { icon: Target, label: "Create a habit", desc: "Choose what you want to build" },
      { icon: DollarSign, label: "Stake money", desc: "Put skin in the game" },
      { icon: CheckCircle, label: "Complete daily", desc: "Submit photo evidence" },
      { icon: Heart, label: "Win or give", desc: "Get your stake back or it goes to charity" },
    ],
  },
  {
    title: "Ready to Start?",
    subtitle: "Create your first habit or explore the app",
    description: "You can create a habit now or skip and explore the dashboard first.",
  },
];

const Onboarding = () => {
  const navigate = useNavigate();
  const { updateProfile } = useProfile();
  const [step, setStep] = useState(0);

  const handleNext = () => {
    if (step < steps.length - 1) setStep(step + 1);
  };

  const completeOnboarding = async () => {
    await updateProfile({ onboarding_completed: true });
  };

  const handleSkip = async () => {
    await completeOnboarding();
    navigate("/dashboard");
  };

  const handleCreateHabit = async () => {
    await completeOnboarding();
    navigate("/create");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <div className="flex gap-2 mb-8">
        {steps.map((_, i) => (
          <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? "w-8 bg-primary" : "w-1.5 bg-secondary"}`} />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.3 }} className="w-full max-w-sm text-center space-y-6">
          {step === 0 && (
            <>
              <div className="w-20 h-20 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center glow-primary">
                <Zap className="w-10 h-10 text-primary" />
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-bold font-heading">{steps[0].title}</h1>
                <p className="text-primary font-medium">{steps[0].subtitle}</p>
                <p className="text-muted-foreground text-sm leading-relaxed">{steps[0].description}</p>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <h2 className="text-2xl font-bold font-heading">{steps[1].title}</h2>
              <p className="text-primary font-medium text-sm">{steps[1].subtitle}</p>
              <div className="space-y-4 mt-4">
                {steps[1].steps!.map((s, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="flex items-center gap-4 glass-card rounded-xl p-4 text-left">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <s.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold font-heading text-sm">{s.label}</p>
                      <p className="text-xs text-muted-foreground">{s.desc}</p>
                    </div>
                    
                  </motion.div>
                ))}
              </div>
              <div className="glass-card rounded-xl p-4 mt-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Stake Flow</p>
                <div className="flex items-center justify-between text-xs">
                  <div className="text-center">
                    <div className="w-8 h-8 rounded-full bg-warning/20 flex items-center justify-center mx-auto mb-1"><DollarSign className="w-4 h-4 text-warning" /></div>
                    <span className="text-muted-foreground">Held</span>
                  </div>
                  <div className="flex-1 h-0.5 bg-border mx-2" />
                  <div className="text-center">
                    <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-1"><CheckCircle className="w-4 h-4 text-success" /></div>
                    <span className="text-success">Returned</span>
                  </div>
                  <span className="text-muted-foreground mx-1">/</span>
                  <div className="text-center">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-1"><Heart className="w-4 h-4 text-primary" /></div>
                    <span className="text-primary">Donated</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="w-20 h-20 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
                <Target className="w-10 h-10 text-primary" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold font-heading">{steps[2].title}</h2>
                <p className="text-muted-foreground text-sm">{steps[2].description}</p>
              </div>
              <div className="space-y-3 pt-4">
                <Button variant="hero" size="lg" className="w-full" onClick={handleCreateHabit}>Create Your First Habit</Button>
                <Button variant="outline" size="lg" className="w-full" onClick={handleSkip}>Skip & Explore</Button>
              </div>
            </>
          )}
        </motion.div>
      </AnimatePresence>

      {step < 2 && (
        <div className="mt-8 w-full max-w-sm flex justify-between">
          <Button variant="ghost" onClick={handleSkip}>Skip</Button>
          <Button variant="default" onClick={handleNext}>Next <ArrowRight className="w-4 h-4" /></Button>
        </div>
      )}
    </div>
  );
};

export default Onboarding;
