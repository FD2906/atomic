import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/useAdmin";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, AlertTriangle, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

interface FraudReport {
  id: string;
  challenge_id: string;
  reporter_id: string;
  reported_user_id: string;
  submission_id: string | null;
  reason: string;
  evidence_notes: string | null;
  status: string;
  created_at: string;
}

const AdminFraud = () => {
  const navigate = useNavigate();
  const { isAdmin, user } = useAdmin();
  const [reports, setReports] = useState<FraudReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolveDialog, setResolveDialog] = useState<FraudReport | null>(null);
  const [resolution, setResolution] = useState("");
  const [processing, setProcessing] = useState(false);

  const fetch = async () => {
    const { data } = await supabase
      .from("fraud_reports")
      .select("*")
      .order("created_at", { ascending: false });
    setReports((data as FraudReport[]) || []);
    setLoading(false);
  };

  useEffect(() => { if (isAdmin) fetch(); }, [isAdmin]);

  const logAction = async (action: string, targetId: string, details: any = {}) => {
    if (!user) return;
    await supabase.from("audit_log" as any).insert({
      admin_id: user.id, action, target_type: "fraud_report", target_id: targetId, details,
    });
  };

  const handleResolve = async (valid: boolean) => {
    if (!resolveDialog || !resolution.trim()) { toast.error("Provide a resolution note"); return; }
    setProcessing(true);
    const status = valid ? "confirmed" : "dismissed";
    await supabase.from("fraud_reports").update({ status, resolved_at: new Date().toISOString() } as any).eq("id", resolveDialog.id);
    await logAction(`resolve_fraud_${status}`, resolveDialog.id, { resolution, reported_user: resolveDialog.reported_user_id });
    toast.success(`Report ${status}`);
    setResolveDialog(null);
    setResolution("");
    setProcessing(false);
    fetch();
  };

  return (
    <div className="px-4 pt-6 pb-8 space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/admin")} className="p-2 rounded-lg bg-secondary hover:bg-secondary/80">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-destructive" />
          <h1 className="text-lg font-bold font-heading">Fraud Reports</h1>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : reports.length === 0 ? (
        <div className="glass-card rounded-xl p-6 text-center">
          <p className="text-sm text-muted-foreground">No fraud reports</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <div key={r.id} className="glass-card rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</p>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                  r.status === "pending" ? "bg-warning/10 text-warning" :
                  r.status === "confirmed" ? "bg-destructive/10 text-destructive" :
                  "bg-success/10 text-success"
                }`}>{r.status}</span>
              </div>
              <p className="text-sm font-semibold">{r.reason}</p>
              <p className="text-xs text-muted-foreground">Reporter: {r.reporter_id.slice(0, 8)}... → Reported: {r.reported_user_id.slice(0, 8)}...</p>
              {r.evidence_notes && <p className="text-xs text-muted-foreground">Notes: {r.evidence_notes}</p>}
              {r.status === "pending" && (
                <Button size="sm" variant="outline" onClick={() => setResolveDialog(r)}>Review</Button>
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!resolveDialog} onOpenChange={() => setResolveDialog(null)}>
        <DialogContent className="bg-background border-border">
          <DialogHeader><DialogTitle className="font-heading">Resolve Fraud Report</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm"><strong>Reason:</strong> {resolveDialog?.reason}</p>
            <Textarea placeholder="Resolution notes..." value={resolution} onChange={(e) => setResolution(e.target.value)} className="bg-secondary" />
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button variant="destructive" className="gap-1" onClick={() => handleResolve(true)} disabled={processing}>
              <CheckCircle className="w-3 h-3" /> Confirm Fraud
            </Button>
            <Button variant="outline" className="gap-1" onClick={() => handleResolve(false)} disabled={processing}>
              <XCircle className="w-3 h-3" /> Dismiss
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminFraud;
