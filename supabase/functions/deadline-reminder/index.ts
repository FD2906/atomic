import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get current time in HH:MM format and the time 2 hours from now
    const now = new Date();
    const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    // We look for habits whose daily_deadline is between now+1h45m and now+2h15m (30-min window)
    const windowStart = new Date(now.getTime() + 105 * 60 * 1000); // 1h45m
    const windowEnd = new Date(now.getTime() + 135 * 60 * 1000);   // 2h15m

    const formatTime = (d: Date) =>
      d.toTimeString().slice(0, 5); // HH:MM

    const startTime = formatTime(windowStart);
    const endTime = formatTime(windowEnd);

    // Fetch active habits with daily_deadline in the 2-hour-ahead window
    const { data: habits, error: habitsError } = await supabase
      .from("habits")
      .select("id, user_id, title, daily_deadline")
      .eq("status", "active")
      .not("daily_deadline", "is", null)
      .gte("daily_deadline", startTime)
      .lte("daily_deadline", endTime);

    if (habitsError) {
      console.error("Error fetching habits:", habitsError);
      return new Response(JSON.stringify({ error: habitsError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!habits || habits.length === 0) {
      return new Response(JSON.stringify({ message: "No reminders needed", count: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const today = now.toISOString().split("T")[0];

    // Check which users have already submitted evidence today
    const habitIds = habits.map((h: any) => h.id);
    const { data: submissions } = await supabase
      .from("verification_submissions")
      .select("habit_id, user_id")
      .in("habit_id", habitIds)
      .gte("submitted_at", today);

    const submittedSet = new Set(
      (submissions || []).map((s: any) => `${s.user_id}_${s.habit_id}`)
    );

    // Check which users have notifications enabled
    const userIds = [...new Set(habits.map((h: any) => h.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, notifications_enabled")
      .in("id", userIds);

    const enabledUsers = new Set(
      (profiles || [])
        .filter((p: any) => p.notifications_enabled === true)
        .map((p: any) => p.id)
    );

    // Check for already-sent reminders today to avoid duplicates
    const { data: existingNotifs } = await supabase
      .from("notifications")
      .select("user_id, message")
      .eq("type", "deadline_reminder")
      .gte("created_at", today)
      .in("user_id", userIds);

    const alreadyNotified = new Set(
      (existingNotifs || []).map((n: any) => `${n.user_id}_${n.message}`)
    );

    // Build notifications to insert
    const notifications: any[] = [];
    for (const habit of habits) {
      const key = `${habit.user_id}_${habit.id}`;
      if (submittedSet.has(key)) continue; // already submitted
      if (!enabledUsers.has(habit.user_id)) continue; // notifications off

      const message = `⏰ Reminder: "${habit.title}" deadline is in ~2 hours. Submit your evidence now!`;
      const dedupKey = `${habit.user_id}_${message}`;
      if (alreadyNotified.has(dedupKey)) continue; // already sent today

      notifications.push({
        user_id: habit.user_id,
        message,
        type: "deadline_reminder",
      });
    }

    if (notifications.length > 0) {
      const { error: insertError } = await supabase
        .from("notifications")
        .insert(notifications);

      if (insertError) {
        console.error("Error inserting notifications:", insertError);
        return new Response(JSON.stringify({ error: insertError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(
      JSON.stringify({ message: "Reminders sent", count: notifications.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
