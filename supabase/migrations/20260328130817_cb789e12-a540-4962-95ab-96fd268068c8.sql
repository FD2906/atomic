
CREATE POLICY "Challenge creators can invite participants"
ON public.challenge_participants
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.challenges c
    WHERE c.id = challenge_id
    AND c.created_by = auth.uid()
  )
);

CREATE POLICY "Authenticated users can insert notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (true);
