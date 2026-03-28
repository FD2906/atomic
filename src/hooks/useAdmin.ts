import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const useAdmin = () => {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isVerifier, setIsVerifier] = useState(false);
  const [rolesLoading, setRolesLoading] = useState(true);

  useEffect(() => {
    // Wait for auth to finish loading before checking roles
    if (authLoading) return;

    if (!user) {
      setIsAdmin(false);
      setIsVerifier(false);
      setRolesLoading(false);
      return;
    }

    const checkRoles = async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      const roles = ((data as any[]) || []).map((r: any) => r.role);
      setIsAdmin(roles.includes("admin"));
      setIsVerifier(roles.includes("verifier") || roles.includes("admin"));
      setRolesLoading(false);
    };

    checkRoles();
  }, [user, authLoading]);

  return { isAdmin, isVerifier, loading: authLoading || rolesLoading, user };
};
