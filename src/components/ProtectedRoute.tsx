import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const ProtectedRoute = () => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [isOnboardingComplete, setIsOnboardingComplete] = useState<boolean | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const checkOnboardingStatus = async () => {
      if (!user) {
        if (!cancelled) {
          setIsOnboardingComplete(null);
          setChecked(true);
        }
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("id", user.id)
        .maybeSingle();

      if (!cancelled) {
        // If no profile row exists, treat as not completed
        setIsOnboardingComplete(data?.onboarding_completed ?? false);
        setChecked(true);
      }
    };

    // Reset and re-check whenever user or route changes
    setChecked(false);
    checkOnboardingStatus();

    return () => { cancelled = true; };
  }, [user, location.pathname]);

  if (loading || !checked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Already completed onboarding but on /onboarding → redirect to dashboard
  if (location.pathname === "/onboarding" && isOnboardingComplete === true) {
    return <Navigate to="/dashboard" replace />;
  }

  // Haven't completed onboarding and not on /onboarding → redirect to onboarding
  if (location.pathname !== "/onboarding" && isOnboardingComplete === false) {
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
