import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const useAdmin = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isVerifier, setIsVerifier] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      setIsVerifier(false);
      setLoading(false);
      return;
    }

    const checkRoles = async () => {
      const { data } = await supabase
        .from("user_roles" as any)
        .select("role")
        .eq("user_id", user.id);

      const roles = ((data as any[]) || []).map((r: any) => r.role);
      setIsAdmin(roles.includes("admin"));
      setIsVerifier(roles.includes("verifier") || roles.includes("admin"));
      setLoading(false);
    };

    checkRoles();
  }, [user]);

  return { isAdmin, isVerifier, loading, user };
};
