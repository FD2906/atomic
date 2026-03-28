import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/useAdmin";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, FileCheck, CheckCircle, XCircle, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";

interface Submission {
  id: string;
  habit_id: string;
  user_id: string;
  submitted_at: string;
  evidence_type: string;
  file_url: string | null;
  notes: string | null;
  status: string;
  rejection_reason: string | null;
}

const rejectionReasons = [
  "Timestamp missing or invalid",
  "Photo is too blurry / unreadable",
  "Wrong activity shown",
  "Reused or duplicate photo",
  "Evidence does not match habit category",
  "Other",
];

const AdminVerifications = () => {
  const navigate = useNavigate();
  const { isAdmin, user } = useAdmin();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [rejectDialog, setRejectDialog] = useState<Submission | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchSubmissions = async () => {
    let query = supabase.from("verification_submissions").select("*").order("submitted_at", { ascending: false }).limit(100);
    if (filter !== "all") query = query.eq("status", filter);
    const { data } = await query;
    setSubmissions((data as Submission[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) fetchSubmissions();
  }, [isAdmin, filter]);

  const logAction = async (action: string, targetType: string, targetId: string, details: any = {}) => {
    if (!user) return;
    await supabase.from("audit_log" as any).insert({
      admin_id: user.id,
      action,
      target_type: targetType,
      target_id: targetId,
      details,
    });
  };

  const handleApprove = async (sub: Submission) => {
    setProcessing(sub.id);
    const { error } = await supabase.from("verification_submissions").update({ status: "approved" }).eq("id", sub.id);
    if (error) {
      toast.error("Failed to approve");
    } else {
      toast.success("Submission approved ✅");
      await logAction("approve_submission", "verification_submission", sub.id, { user_id: sub.user_id });
      fetchSubmissions();
    }
    setProcessing(null);
  };

  const handleReject = async () => {
    if (!rejectDialog) return;
    const reason = rejectReason === "Other" ? customReason : rejectReason;
    if (!reason) { toast.error("Please select a reason"); return; }

    setProcessing(rejectDialog.id);
    const { error } = await supabase.from("verification_submissions").update({
      status: "rejected",
      rejection_reason: reason,
    }).eq("id", rejectDialog.id);

    if (error) {
      toast.error("Failed to reject");
    } else {
      toast.success("Submission rejected");
      await logAction("reject_submission", "verification_submission", rejectDialog.id, { reason, user_id: rejectDialog.user_id });
      setRejectDialog(null);
      setRejectReason("");
      setCustomReason("");
      fetchSubmissions();
    }
    setProcessing(null);
  };

  return (
    <div className="px-4 pt-6 pb-8 space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/admin")} className="p-2 rounded-lg bg-secondary hover:bg-secondary/80">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <FileCheck className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-bold font-heading">Verification Queue</h1>
        </div>
      </div>

      <div className="flex gap-2">
        {(["pending", "approved", "rejected", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => { setFilter(f); setLoading(true); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filter === f ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground hover:bg-secondary/80"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : submissions.length === 0 ? (
        <div className="glass-card rounded-xl p-6 text-center">
          <p className="text-sm text-muted-foreground">No {filter} submissions</p>
        </div>
      ) : (
        <div className="space-y-3">
          {submissions.map((sub) => (
            <div key={sub.id} className="glass-card rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">User: {sub.user_id.slice(0, 8)}...</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(sub.submitted_at).toLocaleString()}
                  </p>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                  sub.status === "approved" ? "bg-success/10 text-success" :
                  sub.status === "rejected" ? "bg-destructive/10 text-destructive" :
                  "bg-warning/10 text-warning"
                }`}>
                  {sub.status}
                </span>
              </div>

              {sub.file_url && (
                <a href={sub.file_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-primary hover:underline">
                  <ExternalLink className="w-3 h-3" /> View Evidence
                </a>
              )}

              {sub.notes && <p className="text-xs text-muted-foreground">Notes: {sub.notes}</p>}
              {sub.rejection_reason && <p className="text-xs text-destructive">Reason: {sub.rejection_reason}</p>}

              {sub.status === "pending" && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="gap-1 bg-success hover:bg-success/90 text-white"
                    disabled={processing === sub.id}
                    onClick={() => handleApprove(sub)}
                  >
                    <CheckCircle className="w-3 h-3" /> Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="gap-1"
                    disabled={processing === sub.id}
                    onClick={() => setRejectDialog(sub)}
                  >
                    <XCircle className="w-3 h-3" /> Reject
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Reject Dialog */}
      <Dialog open={!!rejectDialog} onOpenChange={() => setRejectDialog(null)}>
        <DialogContent className="bg-background border-border">
          <DialogHeader>
            <DialogTitle className="font-heading">Rejection Reason</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Select value={rejectReason} onValueChange={setRejectReason}>
              <SelectTrigger><SelectValue placeholder="Select reason..." /></SelectTrigger>
              <SelectContent>
                {rejectionReasons.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {rejectReason === "Other" && (
              <Textarea
                placeholder="Provide specific reason..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                className="bg-secondary"
              />
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject} disabled={!!processing}>Reject</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminVerifications;
