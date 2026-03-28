import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Camera, Image, Upload, X, Check, AlertTriangle, Clock, Eye, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface VerificationExample {
  id: string;
  image_url: string;
  is_good: boolean;
  explanation: string;
}

const SubmitEvidence = () => {
  const navigate = useNavigate();
  const { user } = useAuth("/login");
  const [searchParams] = useSearchParams();
  const habitName = searchParams.get("habit") || "Habit";
  const habitId = searchParams.get("habitId") || "";
  const day = searchParams.get("day") || "1";
  const total = searchParams.get("total") || "14";
  const charity = searchParams.get("charity") || "Charity";
  const stake = searchParams.get("stake") || "5";
  const category = searchParams.get("category") || "other";

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [examples, setExamples] = useState<VerificationExample[]>([]);
  const [showExamples, setShowExamples] = useState(true);
  const [timestampWarning, setTimestampWarning] = useState<string | null>(null);
  const [lastRejection, setLastRejection] = useState<{ reason: string; howToFix: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchExamples = async () => {
      const { data } = await supabase
        .from("verification_examples")
        .select("id, image_url, is_good, explanation")
        .eq("habit_category", category);
      const exs = (data as VerificationExample[]) || [];
      setExamples(exs);
      // If no examples for this category, skip the examples screen
      if (exs.length === 0) setShowExamples(false);
    };
    fetchExamples();
  }, [category]);

  // Check for last rejection for this habit (24hr resubmission grace period)
  useEffect(() => {
    if (!user || !habitId) return;
    const checkRejection = async () => {
      const twentyFourHrsAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data } = await supabase
        .from("verification_submissions")
        .select("rejection_reason, submitted_at")
        .eq("habit_id", habitId)
        .eq("user_id", user.id)
        .eq("status", "rejected")
        .gte("submitted_at", twentyFourHrsAgo)
        .order("submitted_at", { ascending: false })
        .limit(1);
      if (data && data.length > 0 && data[0].rejection_reason) {
        const raw = data[0].rejection_reason;
        const categoryMatch = raw.match(/^\[(\w+)\]\s*/);
        const reason = categoryMatch ? raw.replace(categoryMatch[0], "") : raw;
        const howToFix: Record<string, string> = {
          no_evidence: "Take a clear photo during or right after your activity and upload it.",
          wrong_content: "Ensure you upload an original photo (not a screenshot) that shows you completing the activity.",
          blur: "Use good lighting and hold your phone steady. Avoid blurry or dark images.",
          timestamp_missing: "Enable date/time stamps in your camera settings, or take the photo in a well-lit area showing a clock.",
        };
        const cat = categoryMatch?.[1] || "";
        setLastRejection({ reason, howToFix: howToFix[cat] || "Please try again with a clearer photo." });
      }
    };
    checkRejection();
  }, [user, habitId]);

  const extractExifTimestamp = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const view = new DataView(e.target?.result as ArrayBuffer);
        // Check for JPEG SOI marker
        if (view.getUint16(0) !== 0xFFD8) { resolve(false); return; }
        let offset = 2;
        while (offset < view.byteLength - 2) {
          const marker = view.getUint16(offset);
          if (marker === 0xFFE1) {
            // EXIF data found — has metadata
            resolve(true);
            return;
          }
          if ((marker & 0xFF00) !== 0xFF00) break;
          const segLen = view.getUint16(offset + 2);
          offset += 2 + segLen;
        }
        resolve(false);
      };
      reader.onerror = () => resolve(false);
      reader.readAsArrayBuffer(file.slice(0, 128 * 1024)); // Read first 128KB
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large. Maximum 10MB.");
      return;
    }
    setPhotoFile(file);
    setTimestampWarning(null);

    // EXIF timestamp check
    const hasExif = await extractExifTimestamp(file);
    if (!hasExif) {
      setTimestampWarning("⚠️ Timestamp not detected. Photos without metadata are more likely to be rejected.");
    }

    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!photoFile || !user || !habitId) {
      toast.error("Please upload a photo first");
      return;
    }
    setSubmitting(true);

    // Upload to storage
    const filePath = `${user.id}/${habitId}/${Date.now()}-${photoFile.name}`;
    const { error: uploadError } = await supabase.storage
      .from("evidence")
      .upload(filePath, photoFile);

    if (uploadError) {
      toast.error("Failed to upload photo");
      setSubmitting(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("evidence").getPublicUrl(filePath);

    // Insert submission
    const { data: submissionData, error } = await supabase.from("verification_submissions").insert({
      habit_id: habitId,
      user_id: user.id,
      evidence_type: "photo",
      file_url: urlData.publicUrl,
      notes: notes || null,
      status: "pending",
    }).select("id").single();

    if (error) {
      toast.error("Failed to submit evidence");
      setSubmitting(false);
      return;
    }

    // Trigger auto-verification
    if (submissionData?.id) {
      supabase.functions.invoke("auto-verify", {
        body: { submissionId: submissionData.id },
      }).catch((err) => console.error("Auto-verify call failed:", err));
    }

    setSubmitted(true);
    setSubmitting(false);
    toast.success("Evidence submitted! Verification in progress...");
  };

  // Examples gallery shown BEFORE the upload screen
  if (showExamples && examples.length > 0) {
    const goodExamples = examples.filter(e => e.is_good);
    const badExamples = examples.filter(e => !e.is_good);

    return (
      <div className="min-h-screen bg-background max-w-md mx-auto px-4 pt-6 pb-8 space-y-5">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-lg bg-secondary hover:bg-secondary/80">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold font-heading">Evidence Guidelines</h1>
        </div>

        <div className="glass-card rounded-xl p-4 space-y-2">
          <p className="font-semibold font-heading">{habitName}</p>
          <p className="text-xs text-muted-foreground">Day {day} of {total} · Review these examples before submitting</p>
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          {goodExamples.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-success flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Accepted Evidence
              </p>
              <div className="space-y-2">
                {goodExamples.map(ex => (
                  <div key={ex.id} className="glass-card rounded-xl overflow-hidden">
                    {ex.image_url && (
                      <img src={ex.image_url} alt="Good example" className="w-full h-40 object-cover" />
                    )}
                    <div className="p-3 flex items-start gap-2">
                      <Check className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-foreground">{ex.explanation}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {badExamples.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-destructive flex items-center gap-1">
                <X className="w-3.5 h-3.5" /> Rejected Evidence
              </p>
              <div className="space-y-2">
                {badExamples.map(ex => (
                  <div key={ex.id} className="glass-card rounded-xl overflow-hidden">
                    {ex.image_url && (
                      <img src={ex.image_url} alt="Bad example" className="w-full h-40 object-cover opacity-75" />
                    )}
                    <div className="p-3 flex items-start gap-2">
                      <X className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-muted-foreground">{ex.explanation}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        <Button variant="hero" size="lg" className="w-full gap-2" onClick={() => setShowExamples(false)}>
          I Understand, Continue <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background max-w-md mx-auto px-4 pt-6 pb-8 space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg bg-secondary hover:bg-secondary/80">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold font-heading">Submit Evidence</h1>
      </div>

      <div className="glass-card rounded-xl p-4 space-y-2">
        <p className="font-semibold font-heading">{habitName}</p>
        <p className="text-xs text-muted-foreground">Day {day} of {total} · {charity}</p>
      </div>

      <div className="flex items-center gap-3 p-3 rounded-xl bg-warning/10 border border-warning/20">
        <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0" />
        <div>
          <p className="text-xs font-semibold text-warning">Submit before midnight</p>
          <p className="text-[10px] text-muted-foreground">£{stake} → {charity} if missed</p>
        </div>
      </div>

      {/* Rejection banner with how-to-fix guidance */}
      {lastRejection && (
        <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 space-y-1">
          <p className="text-xs font-semibold text-destructive">Previous submission rejected</p>
          <p className="text-xs text-foreground">{lastRejection.reason}</p>
          <p className="text-xs text-muted-foreground">💡 How to fix: {lastRejection.howToFix}</p>
          <p className="text-[10px] text-muted-foreground">You can resubmit within 24 hours.</p>
        </div>
      )}

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Evidence Guidelines</p>
        <div className="glass-card rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-success flex-shrink-0" />
            <p className="text-xs text-foreground">Photo showing activity with visible timestamp</p>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-success flex-shrink-0" />
            <p className="text-xs text-foreground">Clear, well-lit image (not blurry)</p>
          </div>
          <div className="flex items-center gap-2">
            <X className="w-4 h-4 text-destructive flex-shrink-0" />
            <p className="text-xs text-muted-foreground">Screenshots not accepted</p>
          </div>
          <div className="flex items-center gap-2">
            <X className="w-4 h-4 text-destructive flex-shrink-0" />
            <p className="text-xs text-muted-foreground">Stock or reused photos not accepted</p>
          </div>
          {examples.length > 0 && (
            <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => setShowExamples(true)}>
              <Eye className="w-4 h-4" /> View example submissions
            </Button>
          )}
        </div>
      </div>

      {submitted ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card rounded-xl p-6 text-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center mx-auto">
            <Check className="w-7 h-7 text-success" />
          </div>
          <p className="font-semibold font-heading">Evidence Submitted!</p>
          <p className="text-xs text-muted-foreground">Auto-verification in progress · You'll be notified shortly</p>
          <Button variant="hero" size="lg" className="w-full mt-4" onClick={() => navigate("/dashboard")}>
            Back to Dashboard
          </Button>
        </motion.div>
      ) : (
        <>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Upload</p>
            {photoPreview ? (
              <div className="relative rounded-xl overflow-hidden">
                <img src={photoPreview} alt="Evidence preview" className="w-full h-56 object-cover rounded-xl" />
                <button onClick={() => { setPhotoFile(null); setPhotoPreview(null); }} className="absolute top-2 right-2 p-1.5 rounded-full bg-background/80 hover:bg-background">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button onClick={() => fileInputRef.current?.click()} className="w-full h-40 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 hover:bg-secondary/50 transition-colors">
                <Upload className="w-8 h-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Tap to take photo or upload</p>
              </button>
            )}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => cameraInputRef.current?.click()}>
                <Camera className="w-4 h-4" /> Camera
              </Button>
              <Button variant="outline" size="sm" className="flex-1" onClick={() => fileInputRef.current?.click()}>
                <Image className="w-4 h-4" /> Gallery
              </Button>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileSelect} />
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Notes (optional)</p>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any context for the reviewer..." className="bg-secondary border-border text-foreground placeholder:text-muted-foreground resize-none" rows={3} />
          </div>

          <div className="space-y-3 pt-2">
            <Button variant="hero" size="lg" className="w-full" onClick={handleSubmit} disabled={!photoFile || submitting}>
              {submitting ? "Uploading..." : "Submit Evidence"}
            </Button>
            <Button variant="outline" size="lg" className="w-full" onClick={() => navigate(-1)}>
              Save Draft
            </Button>
          </div>

          <p className="text-[10px] text-muted-foreground text-center flex items-center justify-center gap-1">
            <Clock className="w-3 h-3" /> Auto-verified within seconds · Push notification sent
          </p>
        </>
      )}
    </div>
  );
};

export default SubmitEvidence;
