
-- Function to activate a challenge if all participants have accepted
-- Uses SECURITY DEFINER to bypass RLS on challenge_participants
CREATE OR REPLACE FUNCTION public.activate_challenge_if_ready(_challenge_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  all_accepted boolean;
BEGIN
  SELECT bool_and(status = 'accepted')
  INTO all_accepted
  FROM challenge_participants
  WHERE challenge_id = _challenge_id;

  IF all_accepted THEN
    UPDATE challenges
    SET status = 'active', start_date = COALESCE(start_date, CURRENT_DATE)
    WHERE id = _challenge_id AND status = 'pending';
    RETURN true;
  END IF;

  RETURN false;
END;
$$;
