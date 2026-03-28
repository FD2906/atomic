DROP FUNCTION IF EXISTS public.get_challenge_participants(uuid);

CREATE OR REPLACE FUNCTION public.get_challenge_participants(_challenge_id uuid)
RETURNS TABLE (
  user_id uuid,
  status text,
  display_name text,
  username text,
  result text,
  stake_id uuid
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH viewer_can_access AS (
    SELECT 1
    FROM public.challenge_participants viewer
    WHERE viewer.challenge_id = _challenge_id
      AND viewer.user_id = auth.uid()
  ),
  actual_participants AS (
    SELECT
      cp.user_id,
      cp.status,
      COALESCE(NULLIF(pp.first_name, ''), pp.username, 'Player') AS display_name,
      pp.username,
      cp.result,
      cp.stake_id,
      cp.joined_at
    FROM public.challenge_participants cp
    LEFT JOIN public.profiles_public pp ON pp.id = cp.user_id
    WHERE cp.challenge_id = _challenge_id
  ),
  fallback_invited_opponent AS (
    SELECT
      n.user_id,
      'invited'::text AS status,
      COALESCE(NULLIF(pp.first_name, ''), pp.username, 'Player') AS display_name,
      pp.username,
      NULL::text AS result,
      NULL::uuid AS stake_id,
      NULL::timestamp with time zone AS joined_at
    FROM public.notifications n
    LEFT JOIN public.profiles_public pp ON pp.id = n.user_id
    WHERE n.type = 'challenge_invite'
      AND n.metadata->>'challenge_id' = _challenge_id::text
      AND n.user_id <> auth.uid()
      AND NOT EXISTS (
        SELECT 1
        FROM actual_participants ap
        WHERE ap.user_id = n.user_id
      )
    ORDER BY n.created_at DESC
    LIMIT 1
  )
  SELECT combined.user_id,
         combined.status,
         combined.display_name,
         combined.username,
         combined.result,
         combined.stake_id
  FROM (
    SELECT * FROM actual_participants
    UNION ALL
    SELECT * FROM fallback_invited_opponent
  ) AS combined
  WHERE EXISTS (SELECT 1 FROM viewer_can_access)
  ORDER BY combined.joined_at ASC NULLS LAST, combined.user_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_challenge_participants(uuid) TO authenticated;