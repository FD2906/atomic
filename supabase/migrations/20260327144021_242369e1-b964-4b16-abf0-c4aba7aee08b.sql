
-- Remove the security_barrier that was set (clean up)
ALTER VIEW public.profiles_public RESET (security_barrier);

-- Revoke access from anon role, only allow authenticated
REVOKE ALL ON public.profiles_public FROM anon;
GRANT SELECT ON public.profiles_public TO authenticated;
