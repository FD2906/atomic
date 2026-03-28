import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const { challengeId } = await req.json();
    if (!challengeId) {
      return new Response(JSON.stringify({ error: "challengeId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch challenge
    const { data: challenge, error: cErr } = await supabase
      .from("challenges")
      .select("id, title, start_date, end_date, stake_amount, charity_id, status")
      .eq("id", challengeId)
      .single();

    if (cErr || !challenge) {
      return new Response(JSON.stringify({ error: "Challenge not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (challenge.status === "completed") {
      return new Response(JSON.stringify({ message: "Already resolved" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch participants
    const { data: participants } = await supabase
      .from("challenge_participants")
      .select("user_id, status, stake_id, result")
      .eq("challenge_id", challengeId);

    if (!participants || participants.length < 2) {
      return new Response(JSON.stringify({ error: "Not enough participants" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Count approved submissions per participant in the challenge date range
    const results: { user_id: string; count: number; status: string; stake_id: string | null }[] = [];

    for (const p of participants) {
      if (p.status === "quit") {
        results.push({ user_id: p.user_id, count: -1, status: "quit", stake_id: p.stake_id });
        continue;
      }

      const { count } = await supabase
        .from("verification_submissions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", p.user_id)
        .eq("status", "approved")
        .gte("submitted_at", challenge.start_date || "")
        .lte("submitted_at", (challenge.end_date || "") + "T23:59:59");

      results.push({ user_id: p.user_id, count: count || 0, status: p.status, stake_id: p.stake_id });
    }

    // Determine outcomes
    const activeResults = results.filter((r) => r.status !== "quit");
    const quitters = results.filter((r) => r.status === "quit");

    // Mark quitters as 'lost', their stake donated
    for (const q of quitters) {
      await supabase
        .from("challenge_participants")
        .update({ result: "quit" })
        .eq("challenge_id", challengeId)
        .eq("user_id", q.user_id);

      if (q.stake_id) {
        await supabase.from("stakes").update({ status: "donated", date_resolved: new Date().toISOString() }).eq("id", q.stake_id);
      }
    }

    if (activeResults.length === 2) {
      const [a, b] = activeResults;
      if (a.count > b.count) {
        // a wins, b loses
        await resolveWinLoss(supabase, challengeId, a, b);
      } else if (b.count > a.count) {
        await resolveWinLoss(supabase, challengeId, b, a);
      } else {
        // Tie — both stakes returned
        for (const p of activeResults) {
          await supabase.from("challenge_participants").update({ result: "tie" }).eq("challenge_id", challengeId).eq("user_id", p.user_id);
          if (p.stake_id) {
            await supabase.from("stakes").update({ status: "returned", date_resolved: new Date().toISOString() }).eq("id", p.stake_id);
          }
        }
      }
    } else if (activeResults.length === 1) {
      // Only one active — they win by default
      const winner = activeResults[0];
      await supabase.from("challenge_participants").update({ result: "won" }).eq("challenge_id", challengeId).eq("user_id", winner.user_id);
      if (winner.stake_id) {
        await supabase.from("stakes").update({ status: "returned", date_resolved: new Date().toISOString() }).eq("id", winner.stake_id);
      }
    }

    // Mark challenge as completed
    await supabase.from("challenges").update({ status: "completed" }).eq("id", challengeId);

    // Send notifications
    for (const r of results) {
      const resultLabel = r.status === "quit" ? "quit" : (await supabase.from("challenge_participants").select("result").eq("challenge_id", challengeId).eq("user_id", r.user_id).single()).data?.result;
      const emoji = resultLabel === "won" ? "🏆" : resultLabel === "tie" ? "🤝" : "😞";
      const msg = resultLabel === "won"
        ? `${emoji} You won "${challenge.title}"! Your stake has been returned.`
        : resultLabel === "tie"
        ? `${emoji} "${challenge.title}" ended in a tie! Both stakes returned.`
        : resultLabel === "quit"
        ? `${emoji} You quit "${challenge.title}". Your stake was donated to charity.`
        : `${emoji} You lost "${challenge.title}". Your stake has been donated to charity.`;

      await supabase.from("notifications").insert({
        user_id: r.user_id,
        message: msg,
        type: "challenge_result",
        metadata: { challenge_id: challengeId, result: resultLabel },
      });
    }

    console.log(`Challenge ${challengeId} resolved`);
    return new Response(JSON.stringify({ status: "resolved", results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Resolve error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function resolveWinLoss(
  supabase: any,
  challengeId: string,
  winner: { user_id: string; stake_id: string | null },
  loser: { user_id: string; stake_id: string | null }
) {
  await supabase.from("challenge_participants").update({ result: "won" }).eq("challenge_id", challengeId).eq("user_id", winner.user_id);
  await supabase.from("challenge_participants").update({ result: "lost" }).eq("challenge_id", challengeId).eq("user_id", loser.user_id);

  // Winner's stake returned
  if (winner.stake_id) {
    await supabase.from("stakes").update({ status: "returned", date_resolved: new Date().toISOString() }).eq("id", winner.stake_id);
  }
  // Loser's stake donated
  if (loser.stake_id) {
    await supabase.from("stakes").update({ status: "donated", date_resolved: new Date().toISOString() }).eq("id", loser.stake_id);
  }
}
