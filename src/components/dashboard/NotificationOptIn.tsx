import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Bell, BellOff } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface NotificationOptInProps {
  userId: string;
  notificationsEnabled: boolean | null;
  onComplete: (enabled: boolean) => void;
}

const NotificationOptIn = ({ userId, notificationsEnabled, onComplete }: NotificationOptInProps) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Show dialog only if user hasn't made a choice yet (null)
    if (notificationsEnabled === null) {
      const timer = setTimeout(() => setOpen(true), 800);
      return () => clearTimeout(timer);
    }
  }, [notificationsEnabled]);

  const handleChoice = async (enabled: boolean) => {
    setOpen(false);
    await supabase
      .from("profiles")
      .update({ notifications_enabled: enabled } as any)
      .eq("id", userId);
    onComplete(enabled);
  };

  if (notificationsEnabled !== null) return null;

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent className="bg-background border-border max-w-sm">
        <AlertDialogHeader>
          <div className="flex justify-center mb-2">
            <div className="p-3 rounded-full bg-primary/10">
              <Bell className="w-6 h-6 text-primary" />
            </div>
          </div>
          <AlertDialogTitle className="font-heading text-center">Stay in the loop?</AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            Get notified when your evidence submissions are verified, challenges update, and more. You can change this anytime in your profile settings.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-row gap-2 sm:justify-center">
          <AlertDialogCancel
            onClick={() => handleChoice(false)}
            className="flex-1 gap-1.5"
          >
            <BellOff className="w-4 h-4" />
            No thanks
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => handleChoice(true)}
            className="flex-1 gap-1.5"
          >
            <Bell className="w-4 h-4" />
            Enable
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default NotificationOptIn;
