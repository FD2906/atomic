import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Check, X as XIcon, Clock, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, eachDayOfInterval, parseISO, isToday, isBefore } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface SubmissionData {
  submitted_at: string;
  status: string;
  file_url: string | null;
  notes: string | null;
}

interface HabitCalendarProps {
  habitId: string;
  userId: string;
  startDate: string;
  endDate: string;
}

const HabitCalendar = ({ habitId, userId, startDate, endDate }: HabitCalendarProps) => {
  const [submissions, setSubmissions] = useState<Record<string, SubmissionData>>({}); 
  const [selectedDay, setSelectedDay] = useState<{ date: string; submission: SubmissionData } | null>(null);

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
      .select("submitted_at, status, file_url, notes")
      .eq("habit_id", habitId)
      .eq("user_id", userId);

    const map: Record<string, SubmissionData> = {};
    (data || []).forEach((s) => {
      const key = format(new Date(s.submitted_at), "yyyy-MM-dd");
      // Keep best status per day: approved > pending > rejected
      const existing = map[key];
      if (!existing || s.status === "approved" || (s.status === "pending" && existing.status === "rejected")) {
        map[key] = s;
      }
    });
    setSubmissions(map);
  };

  const days = eachDayOfInterval({
    start: parseISO(startDate),
    end: parseISO(endDate),
  });

  const handleDayClick = (key: string) => {
    const sub = submissions[key];
    if (sub) {
      setSelectedDay({ date: key, submission: sub });
    }
  };

  return (
    <>
      <div className="flex flex-wrap gap-1">
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const sub = submissions[key];
          const verified = sub?.status === "approved";
          const pending = sub?.status === "pending";
          const rejected = sub?.status === "rejected";
          const today = isToday(day);
          const past = isBefore(day, new Date()) && !today;
          const hasSubmission = !!sub;

          return (
            <button
              key={key}
              title={format(day, "MMM d")}
              onClick={() => hasSubmission && handleDayClick(key)}
              className={cn(
                "w-6 h-6 rounded-md flex items-center justify-center text-[9px] font-bold transition-all",
                hasSubmission && "cursor-pointer hover:ring-1 hover:ring-primary/50",
                !hasSubmission && "cursor-default",
                verified
                  ? "bg-success/20 text-success border border-success/30"
                  : pending
                  ? "bg-warning/20 text-warning border border-warning/30"
                  : rejected
                  ? "bg-destructive/20 text-destructive border border-destructive/30"
                  : today
                  ? "bg-primary/10 text-primary border border-primary/30"
                  : past
                  ? "bg-destructive/10 text-destructive/50 border border-destructive/10"
                  : "bg-secondary text-muted-foreground border border-border"
              )}
            >
              {verified ? (
                <Check className="w-3.5 h-3.5" />
              ) : pending ? (
                <Clock className="w-3 h-3" />
              ) : rejected ? (
                <XIcon className="w-3 h-3" />
              ) : (
                format(day, "d")
              )}
            </button>
          );
        })}
      </div>

      {/* Day Submission Viewer */}
      <Dialog open={!!selectedDay} onOpenChange={() => setSelectedDay(null)}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading">
              {selectedDay ? format(parseISO(selectedDay.date), "EEEE, MMM d") : ""}
            </DialogTitle>
            <DialogDescription>
              <span className={cn(
                "inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border mt-1",
                selectedDay?.submission.status === "approved" && "bg-success/10 text-success border-success/20",
                selectedDay?.submission.status === "pending" && "bg-warning/10 text-warning border-warning/20",
                selectedDay?.submission.status === "rejected" && "bg-destructive/10 text-destructive border-destructive/20",
              )}>
                {selectedDay?.submission.status?.toUpperCase()}
              </span>
            </DialogDescription>
          </DialogHeader>

          {selectedDay?.submission.file_url ? (
            <div className="rounded-lg overflow-hidden border border-border">
              <img
                src={selectedDay.submission.file_url}
                alt={`Evidence for ${selectedDay.date}`}
                className="w-full h-auto max-h-[400px] object-contain bg-secondary"
              />
            </div>
          ) : (
            <div className="rounded-lg border border-border bg-secondary flex items-center justify-center h-40">
              <div className="text-center text-muted-foreground">
                <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs">No image uploaded</p>
              </div>
            </div>
          )}

          {selectedDay?.submission.notes && (
            <p className="text-xs text-muted-foreground bg-secondary rounded-lg p-3">
              {selectedDay.submission.notes}
            </p>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default HabitCalendar;
