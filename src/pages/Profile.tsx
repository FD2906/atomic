import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { User, Settings, LogOut, Shield, HelpCircle, PoundSterling, Bell } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
    toast.success("Logged out");
  };

  const menuItems = [
    { icon: PoundSterling, label: "Spending Limit", desc: "Set monthly stake limit" },
    { icon: Bell, label: "Notifications", desc: "Manage push notifications" },
    { icon: HelpCircle, label: "How It Works", desc: "Learn about ATOMIC" },
    { icon: Shield, label: "Privacy & Security", desc: "Manage your data" },
  ];

  return (
    <div className="px-4 pt-6 space-y-6">
      <h1 className="text-xl font-bold font-heading">Profile</h1>

      {/* User Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-xl p-5 flex items-center gap-4"
      >
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
          <User className="w-7 h-7 text-primary" />
        </div>
        <div>
          <p className="font-bold font-heading">{user?.user_metadata?.display_name || "User"}</p>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
        </div>
      </motion.div>

      {/* Menu */}
      <div className="space-y-2">
        {menuItems.map((item, i) => (
          <motion.button
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="w-full flex items-center gap-3 p-4 glass-card rounded-xl hover:bg-secondary/80 transition-colors text-left"
          >
            <item.icon className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-semibold">{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </div>
          </motion.button>
        ))}
      </div>

      <Button variant="destructive" size="lg" className="w-full" onClick={handleLogout}>
        <LogOut className="w-4 h-4" /> Sign Out
      </Button>
    </div>
  );
};

export default Profile;
