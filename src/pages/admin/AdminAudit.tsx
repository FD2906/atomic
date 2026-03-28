import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/useAdmin";
import { ArrowLeft, ClipboardList, Loader2 } from "lucide-react";

interface AuditEntry {
  id: string;
  admin_id: string;
  action: string;
  target_type: string;
  target_id: string | null;
  details: any;
  created_at: string;
}

const AdminAudit = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAdmin();
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) return;
    supabase
      .from("audit_log" as any)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200)
      .then(({ data }: any) => {
        setEntries((data as AuditEntry[]) || []);
        setLoading(false);
      });
  }, [isAdmin]);

  return (
    <div className="min-h-screen bg-background px-4 pt-6 pb-8 space-y-6 max-w-md mx-auto">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/admin")} className="p-2 rounded-lg bg-secondary hover:bg-secondary/80">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-bold font-heading">Audit Log</h1>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : entries.length === 0 ? (
        <div className="glass-card rounded-xl p-6 text-center">
          <p className="text-sm text-muted-foreground">No audit entries yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((e) => (
            <div key={e.id} className="glass-card rounded-xl p-4 space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold font-heading">{e.action.replace(/_/g, " ")}</p>
                <p className="text-[10px] text-muted-foreground">{new Date(e.created_at).toLocaleString()}</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Admin: {e.admin_id.slice(0, 8)}... | Target: {e.target_type} {e.target_id?.slice(0, 8)}...
              </p>
              {e.details && Object.keys(e.details).length > 0 && (
                <p className="text-xs text-muted-foreground font-mono bg-secondary/50 rounded p-2 mt-1">
                  {JSON.stringify(e.details, null, 0)}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminAudit;
