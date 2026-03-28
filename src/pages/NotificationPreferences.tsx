import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Bell, Clock, Check, Flame, Camera } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { toast } from "sonner";

const NotificationPreferences = () => {
  const navigate = useNavigate();
  const { user } = useAuth("/login");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [masterEnabled, setMasterEnabled] = useState(true);
  const [reminders, setReminders] = useState(true);
  const [verifications, setVerifications] = useState(true);
  const [opponentActivity, setOpponentActivity] = useState(true);
  const [quietEnabled, setQuietEnabled] = useState(false);
  const [quietStart, setQuietStart] = useState("22:00");
  const [quietEnd, setQuietEnd] = useState("08:00");

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("notifications_enabled, notify_reminders, notify_verifications, notify_opponent_activity, quiet_hours_start, quiet_hours_end")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          const d = data as any;
          setMasterEnabled(d.notifications_enabled ?? true);
          setReminders(d.notify_reminders ?? true);
          setVerifications(d.notify_verifications ?? true);
          setOpponentActivity(d.notify_opponent_activity ?? true);
          if (d.quiet_hours_start && d.quiet_hours_end) {
            setQuietEnabled(true);
            setQuietStart(d.quiet_hours_start.slice(0, 5));
            setQuietEnd(d.quiet_hours_end.slice(0, 5));
          }
        }
        setLoading(false);
      });
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        notifications_enabled: masterEnabled,
        notify_reminders: reminders,
        notify_verifications: verifications,
        notify_opponent_activity: opponentActivity,
        quiet_hours_start: quietEnabled ? quietStart : null,
        quiet_hours_end: quietEnabled ? quietEnd : null,
      } as any)
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      toast.error("Failed to save preferences");
    } else {
      toast.success("Notification preferences saved");
      navigate(-1);
    }
  };

  const toggleItems = [
    { label: "Deadline Reminders", desc: "2-hour warnings before submission deadlines", icon: Clock, value: reminders, set: setReminders },
    { label: "Verification Updates", desc: "When evidence is approved or rejected", icon: Camera, value: verifications, set: setVerifications },
    { label: "Opponent Activity", desc: "When your opponent completes a day", icon: Flame, value: opponentActivity, set: setOpponentActivity },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 pt-6 pb-8 space-y-6 max-w-md mx-auto">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-secondary hover:bg-secondary/80">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-lg font-bold font-heading">Notification Preferences</h1>
      </div>

      {/* Master toggle */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Bell className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">All Notifications</p>
              <p className="text-xs text-muted-foreground">Master toggle for all alerts</p>
            </div>
          </div>
          <Switch checked={masterEnabled} onCheckedChange={setMasterEnabled} />
        </div>
      </motion.div>

      {/* Per-type toggles */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card rounded-xl divide-y divide-border">
        {toggleItems.map((item) => (
          <div key={item.label} className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center">
                <item.icon className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold">{item.label}</p>
                <p className="text-[11px] text-muted-foreground">{item.desc}</p>
              </div>
            </div>
            <Switch
              checked={item.value && masterEnabled}
              onCheckedChange={item.set}
              disabled={!masterEnabled}
            />
          </div>
        ))}
      </motion.div>

      {/* Quiet hours */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-xl p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
              <Clock className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold">Quiet Hours</p>
              <p className="text-[11px] text-muted-foreground">Block notifications during set times</p>
            </div>
          </div>
          <Switch checked={quietEnabled} onCheckedChange={setQuietEnabled} disabled={!masterEnabled} />
        </div>

        {quietEnabled && masterEnabled && (
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Start</Label>
              <Input type="time" value={quietStart} onChange={(e) => setQuietStart(e.target.value)} className="bg-secondary border-border" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">End</Label>
              <Input type="time" value={quietEnd} onChange={(e) => setQuietEnd(e.target.value)} className="bg-secondary border-border" />
            </div>
          </div>
        )}
      </motion.div>

      <Button className="w-full" onClick={handleSave} disabled={saving}>
        {saving ? "Saving..." : "Save Preferences"}
      </Button>
    </div>
  );
};

export default NotificationPreferences;
