import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, eachDayOfInterval, parseISO, isSameDay, isToday, isBefore } from "date-fns";

interface HabitCalendarProps {
  habitId: string;
  userId: string;
  startDate: string;
  endDate: string;
}

const HabitCalendar = ({ habitId, userId, startDate, endDate }: HabitCalendarProps) => {
  const [verifiedDates, setVerifiedDates] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchSubmissions();

    const channel = supabase
      .channel(`calendar-${habitId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "verification_submissions", filter: `habit_id=eq.${habitId}` },
        () => fetchSubmissions()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [habitId, userId]);

  const fetchSubmissions = async () => {
    const { data } = await supabase
      .from("verification_submissions")
      .select("submitted_at, status")
      .eq("habit_id", habitId)
      .eq("user_id", userId);

    const dates = new Set(
      (data || [])
        .filter((s) => s.status === "approved")
        .map((s) => format(new Date(s.submitted_at), "yyyy-MM-dd"))
    );
    setVerifiedDates(dates);
  };

  const days = eachDayOfInterval({
    start: parseISO(startDate),
    end: parseISO(endDate),
  });

  return (
    <div className="flex flex-wrap gap-1">
      {days.map((day) => {
        const key = format(day, "yyyy-MM-dd");
        const verified = verifiedDates.has(key);
        const today = isToday(day);
        const past = isBefore(day, new Date()) && !today;

        return (
          <div
            key={key}
            title={format(day, "MMM d")}
            className={cn(
              "w-6 h-6 rounded-md flex items-center justify-center text-[9px] font-bold transition-all",
              verified
                ? "bg-success/20 text-success border border-success/30"
                : today
                ? "bg-primary/10 text-primary border border-primary/30"
                : past
                ? "bg-destructive/10 text-destructive/50 border border-destructive/10"
                : "bg-secondary text-muted-foreground border border-border"
            )}
          >
            {verified ? (
              <Check className="w-3.5 h-3.5" />
            ) : (
              format(day, "d")
            )}
          </div>
        );
      })}
    </div>
  );
};

export default HabitCalendar;
