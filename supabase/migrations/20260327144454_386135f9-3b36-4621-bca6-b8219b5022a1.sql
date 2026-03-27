
REVOKE ALL ON public.profiles_public FROM anon, public;
GRANT SELECT ON public.profiles_public TO authenticated;
