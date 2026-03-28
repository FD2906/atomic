import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/useAdmin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Users, Shield, ShieldCheck, ShieldX, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog";

interface UserProfile {
  id: string;
  email: string | null;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  date_registered: string;
  onboarding_completed: boolean;
}

const AdminUsers = () => {
  const navigate = useNavigate();
  const { isAdmin, user } = useAdmin();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [roles, setRoles] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [promoteDialog, setPromoteDialog] = useState<UserProfile | null>(null);
  const [revokeDialog, setRevokeDialog] = useState<{ user: UserProfile; role: string } | null>(null);
  const [processing, setProcessing] = useState(false);

  const fetchUsers = async () => {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("id, email, username, first_name, last_name, date_registered, onboarding_completed")
      .order("date_registered", { ascending: false })
      .limit(200);

    const { data: roleData } = await supabase.from("user_roles" as any).select("user_id, role");

    const roleMap: Record<string, string[]> = {};
    ((roleData as any[]) || []).forEach((r: any) => {
      if (!roleMap[r.user_id]) roleMap[r.user_id] = [];
      roleMap[r.user_id].push(r.role);
    });

    setUsers((profileData as UserProfile[]) || []);
    setRoles(roleMap);
    setLoading(false);
  };

  useEffect(() => { if (isAdmin) fetchUsers(); }, [isAdmin]);

  const logAction = async (action: string, targetId: string, details: any = {}) => {
    if (!user) return;
    await supabase.from("audit_log" as any).insert({
      admin_id: user.id, action, target_type: "user", target_id: targetId, details,
    });
  };

  const handlePromote = async (role: "admin" | "verifier") => {
    if (!promoteDialog || !user) return;
    setProcessing(true);
    const { error } = await supabase.from("user_roles" as any).insert({
      user_id: promoteDialog.id, role, granted_by: user.id,
    });
    if (error) {
      toast.error(error.message?.includes("duplicate") ? "User already has this role" : "Failed to grant role");
    } else {
      toast.success(`${promoteDialog.username || promoteDialog.first_name} is now ${role}`);
      await logAction(`grant_role_${role}`, promoteDialog.id);
    }
    setProcessing(false);
    setPromoteDialog(null);
    fetchUsers();
  };

  const handleRevoke = async () => {
    if (!revokeDialog || !user) return;
    setProcessing(true);
    await supabase.from("user_roles" as any).delete()
      .eq("user_id", revokeDialog.user.id)
      .eq("role", revokeDialog.role);
    await logAction(`revoke_role_${revokeDialog.role}`, revokeDialog.user.id);
    toast.success("Role revoked");
    setProcessing(false);
    setRevokeDialog(null);
    fetchUsers();
  };

  const filtered = users.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (u.username?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.first_name?.toLowerCase().includes(q));
  });

  return (
    <div className="min-h-screen bg-background px-4 pt-6 pb-8 space-y-6 max-w-md mx-auto">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/admin")} className="p-2 rounded-lg bg-secondary hover:bg-secondary/80">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-bold font-heading">User Management</h1>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by username, email, or name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-secondary"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-2">
          {filtered.map((u) => {
            const userRoles = roles[u.id] || [];
            return (
              <div key={u.id} className="glass-card rounded-xl p-4 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold font-heading text-sm truncate">
                      {u.username || u.first_name || "Unknown"}
                    </p>
                    {userRoles.map((r) => (
                      <span key={r} className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary uppercase">
                        {r}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                  <p className="text-[10px] text-muted-foreground">Joined {new Date(u.date_registered).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-1">
                  {userRoles.length > 0 ? (
                    userRoles.map((r) => (
                      <Button key={r} size="sm" variant="outline" className="gap-1 text-xs"
                        onClick={() => setRevokeDialog({ user: u, role: r })}>
                        <ShieldX className="w-3 h-3" /> Revoke {r}
                      </Button>
                    ))
                  ) : (
                    <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => setPromoteDialog(u)}>
                      <ShieldCheck className="w-3 h-3" /> Grant Role
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Promote Dialog */}
      <Dialog open={!!promoteDialog} onOpenChange={() => setPromoteDialog(null)}>
        <DialogContent className="bg-background border-border">
          <DialogHeader>
            <DialogTitle className="font-heading">Grant Role</DialogTitle>
            <DialogDescription>Choose a role for {promoteDialog?.username || promoteDialog?.first_name}</DialogDescription>
          </DialogHeader>
          <div className="flex gap-3">
            <Button className="flex-1 gap-1" onClick={() => handlePromote("verifier")} disabled={processing}>
              <Shield className="w-4 h-4" /> Verifier
            </Button>
            <Button className="flex-1 gap-1 bg-destructive hover:bg-destructive/90" onClick={() => handlePromote("admin")} disabled={processing}>
              <Shield className="w-4 h-4" /> Admin
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Revoke Dialog */}
      <Dialog open={!!revokeDialog} onOpenChange={() => setRevokeDialog(null)}>
        <DialogContent className="bg-background border-border">
          <DialogHeader>
            <DialogTitle className="font-heading">Revoke Role</DialogTitle>
            <DialogDescription>
              Remove <strong>{revokeDialog?.role}</strong> from {revokeDialog?.user.username || revokeDialog?.user.first_name}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRevokeDialog(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleRevoke} disabled={processing}>Revoke</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsers;
