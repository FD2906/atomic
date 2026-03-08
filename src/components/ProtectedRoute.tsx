import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const ProtectedRoute = () => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const checkOnboarding = async () => {
      if (!user) {
        if (!cancelled) {
          setNeedsOnboarding(false);
          setOnboardingChecked(true);
        }
        return;
      }

      // Always allow onboarding route itself without redirect checks.
      if (location.pathname === "/onboarding") {
        if (!cancelled) setOnboardingChecked(true);
        return;
      }

      if (!cancelled) setOnboardingChecked(false);

      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("id", user.id)
        .single();

      if (cancelled) return;

      setNeedsOnboarding(!profile?.onboarding_completed);
      setOnboardingChecked(true);
    };

    checkOnboarding();

    return () => {
      cancelled = true;
    };
  }, [user, location.pathname]);

  if (loading || !onboardingChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (needsOnboarding && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
