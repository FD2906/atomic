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
    const { submissionId } = await req.json();

    if (!submissionId) {
      return new Response(JSON.stringify({ error: "submissionId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch the submission
    const { data: submission, error: fetchError } = await supabase
      .from("verification_submissions")
      .select("id, file_url, habit_id, user_id, status, notes")
      .eq("id", submissionId)
      .single();

    if (fetchError || !submission) {
      return new Response(JSON.stringify({ error: "Submission not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (submission.status !== "pending") {
      return new Response(JSON.stringify({ message: "Already processed", status: submission.status }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Auto-verification logic:
    // For MVP, we auto-approve if a photo URL exists (real image was uploaded)
    // In production, this would call an AI vision model to verify the evidence
    let newStatus = "rejected";
    let rejectionReason: string | null = null;

    if (submission.file_url && submission.file_url.length > 10) {
      // Basic checks: file_url exists and looks valid
      const url = submission.file_url.toLowerCase();
      const isImage = url.includes(".jpg") || url.includes(".jpeg") || url.includes(".png") || 
                      url.includes(".webp") || url.includes(".heic") || url.includes(".gif") ||
                      url.includes("/evidence/");
      
      if (isImage) {
        newStatus = "approved";
      } else {
        rejectionReason = "Uploaded file does not appear to be a valid photo. Please upload a clear photo of your activity.";
      }
    } else {
      rejectionReason = "No evidence photo was provided. Please upload a photo showing your completed activity.";
    }

    // Update the submission status — this triggers the existing DB notifications
    const { error: updateError } = await supabase
      .from("verification_submissions")
      .update({ 
        status: newStatus, 
        rejection_reason: rejectionReason 
      })
      .eq("id", submissionId);

    if (updateError) {
      console.error("Update error:", updateError);
      return new Response(JSON.stringify({ error: "Failed to update submission" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Submission ${submissionId} auto-verified as: ${newStatus}`);

    return new Response(
      JSON.stringify({ status: newStatus, rejectionReason }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Auto-verify error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
