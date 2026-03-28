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

  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
    apiVersion: "2025-08-27.basil",
  });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const body = await req.text();
    const sig = req.headers.get("stripe-signature");

    let event: Stripe.Event;

    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (webhookSecret && sig) {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } else {
      event = JSON.parse(body);
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const stakeId = session.metadata?.stake_id;
      const userId = session.metadata?.user_id;
      const habitId = session.metadata?.habit_id;

      if (stakeId) {
        // Update stake status to 'held' (confirmed payment)
        await supabase
          .from("stakes")
          .update({ status: "held" })
          .eq("id", stakeId);

        // Update challenge_participant payment_status
        if (userId) {
          await supabase
            .from("challenge_participants")
            .update({ payment_status: "paid" })
            .eq("stake_id", stakeId);
        }

        // Activate habit if this stake is for a habit (pending_payment → active)
        if (habitId) {
          // Check if this is a habit (not a challenge) by looking up the stake
          const { data: stakeData } = await supabase
            .from("stakes")
            .select("habit_id, challenge_id")
            .eq("id", stakeId)
            .single();

          if (stakeData?.habit_id) {
            await supabase
              .from("habits")
              .update({ status: "active" })
              .eq("id", stakeData.habit_id)
              .eq("status", "pending_payment");
            console.log(`Habit ${stakeData.habit_id} activated after payment`);
          }
        }

        // Create a transaction record
        await supabase.from("transactions").insert({
          user_id: userId,
          stake_id: stakeId,
          amount: session.amount_total || 0,
          type: "deposit",
          status: "completed",
          payment_reference: session.payment_intent as string,
        });

        console.log(`Payment confirmed for stake ${stakeId}`);
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Webhook error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
