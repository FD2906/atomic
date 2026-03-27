-- Allow users to update their own challenge participation status (needed for accept/decline flow)
CREATE POLICY "Users can update own participations"
ON public.challenge_participants
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);