import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Bell, Check, Clock, X, Heart, Flame } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

const typeIcons: Record<string, React.ElementType> = {
  deadline_reminder: Clock,
  verification_approved: Check,
  verification_rejected: X,
  stake_donated: Heart,
  challenge_invite: Flame,
};

const typeColors: Record<string, string> = {
  deadline_reminder: "text-warning",
  verification_approved: "text-success",
  verification_rejected: "text-destructive",
  stake_donated: "text-primary",
  challenge_invite: "text-primary",
};

interface Notification {
  id: string;
  message: string;
  type: string | null;
  is_read: boolean;
  created_at: string;
}

const Notifications = () => {
  const navigate = useNavigate();
  const { user } = useAuth("/login");
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setNotifications((data as Notification[]) || []);

      // Mark all as read
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("is_read", false);
    };

    fetchNotifications();

    // Realtime subscription
    const channel = supabase
      .channel("notifications-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, (payload) => {
        setNotifications((prev) => [payload.new as Notification, ...prev]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  return (
    <div className="min-h-screen bg-background max-w-md mx-auto px-4 pt-6 pb-8 space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg bg-secondary hover:bg-secondary/80">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold font-heading">Notifications</h1>
      </div>

      {notifications.length === 0 ? (
        <div className="glass-card rounded-xl p-6 text-center">
          <p className="text-sm text-muted-foreground">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n, i) => {
            const Icon = typeIcons[n.type || ""] || Bell;
            const timeAgo = formatDistanceToNow(new Date(n.created_at), { addSuffix: true });
            return (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className={cn(
                  "flex items-start gap-3 p-4 rounded-xl transition-colors",
                  n.is_read ? "glass-card opacity-60" : "glass-card border-l-2 border-l-primary"
                )}
              >
                <div className={cn("mt-0.5", typeColors[n.type || ""] || "text-muted-foreground")}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{n.message}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{timeAgo}</p>
                </div>
                {!n.is_read && <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Notifications;
