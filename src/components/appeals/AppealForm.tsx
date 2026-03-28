import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Upload, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface AppealFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submissionId: string;
  habitId: string;
  originalFileUrl: string | null;
}

const AppealForm = ({ open, onOpenChange, submissionId, habitId, originalFileUrl }: AppealFormProps) => {
  const { user } = useAuth();
  const [explanation, setExplanation] = useState("");
  const [newFile, setNewFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [ticketNumber, setTicketNumber] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const charCount = explanation.length;
  const isValid = charCount >= 50 && charCount <= 200;

  const handleSubmit = async () => {
    if (!user || !isValid) return;
    setSubmitting(true);

    let evidenceUrl = originalFileUrl;

    // Upload new evidence if provided
    if (newFile) {
      const filePath = `${user.id}/${habitId}/appeal-${Date.now()}-${newFile.name}`;
      const { error: uploadErr } = await supabase.storage.from("evidence").upload(filePath, newFile);
      if (!uploadErr) {
        const { data: urlData } = supabase.storage.from("evidence").getPublicUrl(filePath);
        evidenceUrl = urlData.publicUrl;
      }
    }

    const { data, error } = await supabase.from("appeals" as any).insert({
      user_id: user.id,
      submission_id: submissionId,
      explanation,
      evidence_url: evidenceUrl,
    } as any).select("ticket_number").single();

    if (error) {
      console.error("Appeal error:", error);
      toast.error("Failed to submit appeal");
      setSubmitting(false);
      return;
    }

    setTicketNumber((data as any)?.ticket_number || "APL-XXXXXXXX");
    setSubmitting(false);
  };

  if (ticketNumber) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading">Appeal Submitted</DialogTitle>
            <DialogDescription className="space-y-3">
              <span className="block">Your appeal has been received. We'll review it and respond within <strong className="text-foreground">48 hours</strong>.</span>
              <span className="block text-xs">Ticket number: <strong className="text-foreground font-mono">{ticketNumber}</strong></span>
            </DialogDescription>
          </DialogHeader>
          <Button className="w-full" onClick={() => onOpenChange(false)}>Done</Button>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-heading">Appeal Rejection</DialogTitle>
          <DialogDescription>
            Explain why you believe the rejection was incorrect. Include any additional context.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs uppercase tracking-wider">Explanation (50-200 characters)</Label>
            <Textarea
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Explain why this rejection was incorrect..."
              className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
              rows={3}
            />
            <p className={`text-[10px] ${charCount < 50 ? "text-muted-foreground" : charCount > 200 ? "text-destructive" : "text-success"}`}>
              {charCount}/200 characters {charCount < 50 && `(${50 - charCount} more needed)`}
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs uppercase tracking-wider">Re-upload evidence (optional)</Label>
            {newFile ? (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary">
                <span className="text-xs text-foreground truncate flex-1">{newFile.name}</span>
                <button onClick={() => setNewFile(null)} className="text-xs text-destructive">Remove</button>
              </div>
            ) : (
              <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => fileRef.current?.click()}>
                <Upload className="w-4 h-4" /> Upload New Photo
              </Button>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => setNewFile(e.target.files?.[0] || null)} />
          </div>

          <div className="flex items-start gap-2 p-2 rounded-lg bg-warning/10">
            <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
            <p className="text-[10px] text-muted-foreground">Response within 48 hours. You'll receive a notification with the outcome.</p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button className="flex-1" disabled={!isValid || submitting} onClick={handleSubmit}>
              {submitting ? "Submitting..." : "Submit Appeal"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AppealForm;
