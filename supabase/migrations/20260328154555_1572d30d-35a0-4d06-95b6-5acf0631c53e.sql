
-- Drop the potentially recursive policy
DROP POLICY IF EXISTS "Participants can view co-participants" ON public.challenge_participants;

-- Create a security definer function to check co-participation
CREATE OR REPLACE FUNCTION public.is_challenge_participant(_user_id uuid, _challenge_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.challenge_participants
    WHERE user_id = _user_id AND challenge_id = _challenge_id
  );
$$;

-- Re-create policy using the function
CREATE POLICY "Participants can view co-participants"
ON public.challenge_participants
FOR SELECT
TO authenticated
USING (
  public.is_challenge_participant(auth.uid(), challenge_id)
);
