
-- 1. Drop the overly-permissive SELECT policy
DROP POLICY IF EXISTS "Users can search profiles by username" ON public.profiles;

-- 2. Create a restrictive SELECT policy: users can only read their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- 3. Create a public view exposing only safe fields for username search
CREATE VIEW public.profiles_public
WITH (security_invoker = on) AS
  SELECT id, username, first_name, avatar_url
  FROM public.profiles;
