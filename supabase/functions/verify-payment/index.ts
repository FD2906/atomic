import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
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

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user) throw new Error("Not authenticated");

    const { sessionId, stakeId } = await req.json();
    if (!sessionId || !stakeId) throw new Error("Missing sessionId or stakeId");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === "paid" && session.metadata?.stake_id === stakeId) {
      // Update stake to held
      await supabaseAdmin
        .from("stakes")
        .update({ status: "held" })
        .eq("id", stakeId);

      // Update challenge participant payment status
      await supabaseAdmin
        .from("challenge_participants")
        .update({ payment_status: "paid" })
        .eq("stake_id", stakeId);

      // Activate habit if applicable
      const { data: stakeData } = await supabaseAdmin
        .from("stakes")
        .select("habit_id")
        .eq("id", stakeId)
        .single();

      if (stakeData?.habit_id) {
        await supabaseAdmin
          .from("habits")
          .update({ status: "active" })
          .eq("id", stakeData.habit_id)
          .eq("status", "pending_payment");
      }

      // Create transaction if not exists
      const { data: existingTx } = await supabaseAdmin
        .from("transactions")
        .select("id")
        .eq("stake_id", stakeId)
        .eq("status", "completed")
        .maybeSingle();

      if (!existingTx) {
        await supabaseAdmin.from("transactions").insert({
          user_id: user.id,
          stake_id: stakeId,
          amount: session.amount_total || 0,
          type: "deposit",
          status: "completed",
          payment_reference: session.payment_intent as string,
        });
      }

      return new Response(JSON.stringify({ verified: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ verified: false, status: session.payment_status }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Verify payment error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
