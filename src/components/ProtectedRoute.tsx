import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const ProtectedRoute = () => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [isOnboardingComplete, setIsOnboardingComplete] = useState<boolean | null>(null);
  const [ready, setReady] = useState(false);
  const checkingRef = useRef(false);
  const prevPathRef = useRef(location.pathname);

  useEffect(() => {
    let cancelled = false;
    checkingRef.current = true;

    const check = async () => {
      if (!user) {
        if (!cancelled) {
          setIsOnboardingComplete(null);
          setReady(true);
          checkingRef.current = false;
        }
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("id", user.id)
        .single();

      if (!cancelled) {
        setIsOnboardingComplete(data?.onboarding_completed ?? false);
        setReady(true);
        checkingRef.current = false;
      }
    };

    check();
    prevPathRef.current = location.pathname;

    return () => { cancelled = true; };
  }, [user, location.pathname]);

  if (loading || !ready) {
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
  // BUT: if we just left /onboarding (user completed it), don't redirect back while re-checking
  if (location.pathname !== "/onboarding" && isOnboardingComplete === false) {
    // If user just came from /onboarding, the DB check is in-flight — wait for it
    if (prevPathRef.current === "/onboarding" || checkingRef.current) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
