CREATE OR REPLACE FUNCTION public.get_challenge_participants(_challenge_id uuid)
RETURNS TABLE (
  user_id uuid,
  status text,
  display_name text,
  username text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    cp.user_id,
    cp.status,
    COALESCE(NULLIF(p.first_name, ''), p.username, 'Player') AS display_name,
    p.username
  FROM public.challenge_participants cp
  LEFT JOIN public.profiles p ON p.id = cp.user_id
  WHERE cp.challenge_id = _challenge_id
    AND EXISTS (
      SELECT 1
      FROM public.challenge_participants viewer
      WHERE viewer.challenge_id = _challenge_id
        AND viewer.user_id = auth.uid()
    )
  ORDER BY cp.joined_at ASC NULLS LAST, cp.user_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_challenge_participants(uuid) TO authenticated;