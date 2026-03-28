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
    // Authenticate user
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated");

    const { amount, accountHolderName, sortCode, accountNumber } = await req.json();

    if (!amount || !accountHolderName || !sortCode || !accountNumber) {
      throw new Error("Missing required fields: amount, accountHolderName, sortCode, accountNumber");
    }

    const amountInPence = Math.round(Number(amount));
    if (amountInPence < 100) {
      throw new Error("Minimum withdrawal is £1");
    }

    // Validate sort code and account number format
    const cleanSortCode = sortCode.replace(/[-\s]/g, "");
    const cleanAccountNumber = accountNumber.replace(/\s/g, "");

    if (!/^\d{6}$/.test(cleanSortCode)) {
      throw new Error("Sort code must be 6 digits");
    }
    if (!/^\d{6,8}$/.test(cleanAccountNumber)) {
      throw new Error("Account number must be 6-8 digits");
    }

    // Check user's available balance (returned stakes)
    const { data: returnedStakes } = await supabaseAdmin
      .from("stakes")
      .select("amount")
      .eq("user_id", user.id)
      .eq("status", "returned");

    const { data: existingWithdrawals } = await supabaseAdmin
      .from("transactions")
      .select("amount")
      .eq("user_id", user.id)
      .eq("type", "withdrawal")
      .in("status", ["pending", "completed"]);

    const totalReturned = (returnedStakes || []).reduce((sum: number, s: any) => sum + Number(s.amount), 0);
    const totalWithdrawn = (existingWithdrawals || []).reduce((sum: number, t: any) => sum + Number(t.amount), 0);
    const availableBalance = totalReturned - totalWithdrawn;

    if (amountInPence > availableBalance) {
      throw new Error(`Insufficient balance. Available: £${(availableBalance / 100).toFixed(2)}`);
    }

    // Create a pending withdrawal transaction
    const { data: txn, error: txnError } = await supabaseAdmin.from("transactions").insert({
      user_id: user.id,
      amount: amountInPence,
      type: "withdrawal",
      status: "pending",
      payment_reference: `WD-${cleanSortCode}-${cleanAccountNumber.slice(-4)}-${Date.now()}`,
    }).select("id").single();

    if (txnError) {
      console.error("Transaction insert error:", txnError);
      throw new Error("Failed to create withdrawal request");
    }

    // In production, this would initiate a Stripe payout via Stripe Connect
    // For MVP, we record the withdrawal request for manual processing
    console.log(`Withdrawal request created: ${txn.id} for £${(amountInPence / 100).toFixed(2)} to ${accountHolderName}`);

    return new Response(
      JSON.stringify({
        success: true,
        transactionId: txn.id,
        amount: amountInPence,
        estimatedDays: "1-3 business days",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("Withdrawal error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
