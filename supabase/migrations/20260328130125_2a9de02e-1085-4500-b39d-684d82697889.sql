CREATE OR REPLACE FUNCTION public.search_profiles(_query text, _exclude_user_id uuid DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  username text,
  first_name text,
  avatar_url text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.username, p.first_name, p.avatar_url
  FROM public.profiles p
  WHERE COALESCE(trim(_query), '') <> ''
    AND p.username IS NOT NULL
    AND (_exclude_user_id IS NULL OR p.id <> _exclude_user_id)
    AND p.username ILIKE '%' || trim(_query) || '%'
  ORDER BY p.username ASC
  LIMIT 10;
$$;

GRANT EXECUTE ON FUNCTION public.search_profiles(text, uuid) TO authenticated;