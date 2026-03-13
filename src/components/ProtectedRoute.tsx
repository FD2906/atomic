import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const ProtectedRoute = () => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [isOnboardingComplete, setIsOnboardingComplete] = useState<boolean | null>(null);
  const [checkedForPath, setCheckedForPath] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const checkOnboardingStatus = async () => {
      if (!user) {
        if (!cancelled) {
          setIsOnboardingComplete(null);
          setCheckedForPath(location.pathname);
        }
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("id", user.id)
        .maybeSingle();

      if (!cancelled) {
        setIsOnboardingComplete(data?.onboarding_completed ?? false);
        setCheckedForPath(location.pathname);
      }
    };

    checkOnboardingStatus();

    return () => { cancelled = true; };
  }, [user, location.pathname]);

  // Show spinner while loading auth or while check hasn't completed for current path
  if (loading || checkedForPath !== location.pathname) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (location.pathname === "/onboarding" && isOnboardingComplete === true) {
    return <Navigate to="/dashboard" replace />;
  }

  if (location.pathname !== "/onboarding" && isOnboardingComplete === false) {
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
