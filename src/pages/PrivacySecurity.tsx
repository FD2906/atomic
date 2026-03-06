import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Shield, Eye, Trash2, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const items = [
  {
    icon: Shield,
    title: "Data Protection",
    desc: "Your data is handled in accordance with GDPR standards.",
    details: "We follow UK GDPR and Data Protection Act 2018 guidelines. Your personal data is encrypted at rest and in transit. We only collect data necessary for the app to function: email, display name, habit activity, and evidence photos.",
  },
  {
    icon: Eye,
    title: "What We Store",
    desc: "Email, display name, habit data, and evidence photos.",
    details: "We store your account information, habit configurations, evidence submissions, and transaction history. Card details are NEVER stored on our servers — all payment processing is handled securely by Stripe. Evidence photos are stored in encrypted cloud storage and only accessible to you and our verification team.",
  },
  {
    icon: Trash2,
    title: "Delete Account",
    desc: "Permanently delete your account and all associated data.",
    details: "Deleting your account will remove all your personal data, habit history, evidence photos, and transaction records. This action is irreversible. Any active stakes will be forfeited.",
    action: true,
  },
];

const PrivacySecurity = () => {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState<number | null>(null);

  const handleDeleteRequest = () => {
    toast.info("Account deletion request submitted. You'll receive a confirmation email.");
  };

  return (
    <div className="min-h-screen bg-background max-w-md mx-auto px-4 pt-6 pb-8 space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg bg-secondary hover:bg-secondary/80">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold font-heading">Privacy & Security</h1>
      </div>

      <div className="space-y-3">
        {items.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <button
              onClick={() => setExpanded(expanded === i ? null : i)}
              className="w-full glass-card rounded-xl p-4 flex items-start gap-4 text-left hover:bg-secondary/80 transition-colors"
            >
              <item.icon className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold">{item.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
              </div>
              <ChevronDown
                className={cn(
                  "w-4 h-4 text-muted-foreground mt-1 flex-shrink-0 transition-transform",
                  expanded === i && "rotate-180"
                )}
              />
            </button>
            <AnimatePresence>
              {expanded === i && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 pt-2 ml-9">
                    <p className="text-xs text-muted-foreground leading-relaxed">{item.details}</p>
                    {item.action && (
                      <Button
                        variant="destructive"
                        size="sm"
                        className="mt-3"
                        onClick={handleDeleteRequest}
                      >
                        <Trash2 className="w-3 h-3" /> Request Deletion
                      </Button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default PrivacySecurity;
