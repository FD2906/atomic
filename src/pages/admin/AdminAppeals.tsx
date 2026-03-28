import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/useAdmin";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Scale, CheckCircle, XCircle, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

interface Appeal {
  id: string;
  user_id: string;
  submission_id: string;
  ticket_number: string;
  explanation: string;
  evidence_url: string | null;
  status: string;
  created_at: string;
}

const AdminAppeals = () => {
  const navigate = useNavigate();
  const { isAdmin, user } = useAdmin();
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolveDialog, setResolveDialog] = useState<Appeal | null>(null);
  const [notes, setNotes] = useState("");
  const [processing, setProcessing] = useState(false);

  const fetchAppeals = async () => {
    const { data } = await supabase.from("appeals").select("*").order("created_at", { ascending: false });
    setAppeals((data as Appeal[]) || []);
    setLoading(false);
  };

  useEffect(() => { if (isAdmin) fetchAppeals(); }, [isAdmin]);

  const logAction = async (action: string, targetId: string, details: any = {}) => {
    if (!user) return;
    await supabase.from("audit_log" as any).insert({
      admin_id: user.id, action, target_type: "appeal", target_id: targetId, details,
    });
  };

  const handleResolve = async (approved: boolean) => {
    if (!resolveDialog) return;
    setProcessing(true);
    const status = approved ? "approved" : "rejected";

    await supabase.from("appeals").update({
      status,
      resolved_at: new Date().toISOString(),
    } as any).eq("id", resolveDialog.id);

    // If approved, also approve the original submission
    if (approved) {
      await supabase.from("verification_submissions").update({ status: "approved", rejection_reason: null }).eq("id", resolveDialog.submission_id);
    }

    await logAction(`resolve_appeal_${status}`, resolveDialog.id, { notes, user_id: resolveDialog.user_id });
    toast.success(`Appeal ${status}`);
    setResolveDialog(null);
    setNotes("");
    setProcessing(false);
    fetchAppeals();
  };

  return (
    <div className="min-h-screen bg-background px-4 pt-6 pb-8 space-y-6 max-w-md mx-auto">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/admin")} className="p-2 rounded-lg bg-secondary hover:bg-secondary/80">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <Scale className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-bold font-heading">Appeals</h1>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : appeals.length === 0 ? (
        <div className="glass-card rounded-xl p-6 text-center">
          <p className="text-sm text-muted-foreground">No appeals</p>
        </div>
      ) : (
        <div className="space-y-3">
          {appeals.map((a) => (
            <div key={a.id} className="glass-card rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-mono text-primary">{a.ticket_number}</p>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                  a.status === "pending" ? "bg-warning/10 text-warning" :
                  a.status === "approved" ? "bg-success/10 text-success" :
                  "bg-destructive/10 text-destructive"
                }`}>{a.status}</span>
              </div>
              <p className="text-sm">{a.explanation}</p>
              <p className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString()}</p>
              {a.evidence_url && (
                <a href={a.evidence_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-primary hover:underline">
                  <ExternalLink className="w-3 h-3" /> View Evidence
                </a>
              )}
              {a.status === "pending" && (
                <Button size="sm" variant="outline" onClick={() => setResolveDialog(a)}>Review</Button>
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!resolveDialog} onOpenChange={() => setResolveDialog(null)}>
        <DialogContent className="bg-background border-border">
          <DialogHeader><DialogTitle className="font-heading">Resolve Appeal</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm"><strong>Ticket:</strong> {resolveDialog?.ticket_number}</p>
            <p className="text-sm">{resolveDialog?.explanation}</p>
            <Textarea placeholder="Admin notes (optional)..." value={notes} onChange={(e) => setNotes(e.target.value)} className="bg-secondary" />
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button className="gap-1 bg-success hover:bg-success/90 text-white" onClick={() => handleResolve(true)} disabled={processing}>
              <CheckCircle className="w-3 h-3" /> Approve Appeal
            </Button>
            <Button variant="destructive" className="gap-1" onClick={() => handleResolve(false)} disabled={processing}>
              <XCircle className="w-3 h-3" /> Deny Appeal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminAppeals;
