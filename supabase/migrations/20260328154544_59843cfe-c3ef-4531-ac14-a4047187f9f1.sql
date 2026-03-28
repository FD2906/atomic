
-- Allow participants to see other participants in the same challenge
CREATE POLICY "Participants can view co-participants"
ON public.challenge_participants
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.challenge_participants cp2
    WHERE cp2.challenge_id = challenge_participants.challenge_id
      AND cp2.user_id = auth.uid()
  )
);
