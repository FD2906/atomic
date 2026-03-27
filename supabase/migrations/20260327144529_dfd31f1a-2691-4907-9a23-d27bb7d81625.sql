
-- Re-grant to authenticated explicitly
GRANT SELECT ON public.profiles_public TO authenticated;
-- Ensure anon cannot access
REVOKE ALL ON public.profiles_public FROM anon;
