import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const ProtectedRoute = () => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const checkedUserId = useRef<string | null>(null);

  useEffect(() => {
    if (!user) {
      checkedUserId.current = null;
      setOnboardingChecked(true);
      setNeedsOnboarding(false);
      return;
    }

    // Only check once per user
    if (checkedUserId.current === user.id) return;

    const checkOnboarding = async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("id", user.id)
        .single();

      checkedUserId.current = user.id;
      setNeedsOnboarding(!profile?.onboarding_completed);
      setOnboardingChecked(true);
    };

    checkOnboarding();
  }, [user]);

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
