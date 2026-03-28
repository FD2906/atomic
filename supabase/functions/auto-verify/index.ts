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

    // Auto-verification logic with specific rejection categories
    let newStatus = "rejected";
    let rejectionReason: string | null = null;
    let rejectionCategory: string | null = null;

    if (!submission.file_url || submission.file_url.length <= 10) {
      rejectionCategory = "no_evidence";
      rejectionReason = "No evidence photo was provided. Please upload a photo showing your completed activity.";
    } else {
      const url = submission.file_url.toLowerCase();
      const isImage = url.includes(".jpg") || url.includes(".jpeg") || url.includes(".png") || 
                      url.includes(".webp") || url.includes(".heic") || url.includes(".gif") ||
                      url.includes("/evidence/");

      if (!isImage) {
        rejectionCategory = "wrong_content";
        rejectionReason = "Uploaded file does not appear to be a valid photo. Please upload a clear photo of your activity.";
      } else {
        // Check for blur indicators in filename (heuristic)
        const filenameLower = url.split("/").pop() || "";
        if (filenameLower.includes("screenshot") || filenameLower.includes("screen_shot")) {
          rejectionCategory = "wrong_content";
          rejectionReason = "Screenshots are not accepted as evidence. Please upload an original photo taken during your activity.";
        } else {
          // Photo looks valid — approve
          newStatus = "approved";
        }
      }
    }

    // Build rejection_reason with category prefix for parsing
    const storedReason = rejectionCategory && rejectionReason
      ? `[${rejectionCategory}] ${rejectionReason}`
      : rejectionReason;

    // Update the submission status — this triggers the existing DB notifications
    const { error: updateError } = await supabase
      .from("verification_submissions")
      .update({ 
        status: newStatus, 
        rejection_reason: storedReason 
      })
      .eq("id", submissionId);

    if (updateError) {
      console.error("Update error:", updateError);
      return new Response(JSON.stringify({ error: "Failed to update submission" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If rejected, create a rejection notification with reason and how-to-fix
    if (newStatus === "rejected") {
      const howToFix: Record<string, string> = {
        no_evidence: "Take a clear photo during or right after your activity and upload it.",
        wrong_content: "Ensure you upload an original photo (not a screenshot) that shows you completing the activity.",
        blur: "Use good lighting and hold your phone steady. Avoid blurry or dark images.",
        timestamp_missing: "Enable date/time stamps in your camera settings, or take the photo in a well-lit area showing a clock.",
      };

      const fixGuidance = howToFix[rejectionCategory || ""] || "Please try again with a clearer photo of your activity.";

      // Check if user has notifications enabled
      const { data: profile } = await supabase
        .from("profiles")
        .select("notifications_enabled")
        .eq("id", submission.user_id)
        .single();

      if (profile?.notifications_enabled) {
        await supabase.from("notifications").insert({
          user_id: submission.user_id,
          message: `Your evidence was rejected: ${rejectionReason} 💡 How to fix: ${fixGuidance}`,
          type: "verification_rejected",
          metadata: { habit_id: submission.habit_id, rejection_category: rejectionCategory },
        });
      }
    }

    console.log(`Submission ${submissionId} auto-verified as: ${newStatus}`);

    return new Response(
      JSON.stringify({ status: newStatus, rejectionReason: storedReason, rejectionCategory }),
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
