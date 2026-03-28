
-- Fix 1: Create a secure RPC to insert notifications (replaces client-side inserts)
CREATE OR REPLACE FUNCTION public.send_notification(
  _user_id uuid,
  _message text,
  _type text DEFAULT NULL,
  _metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Validate inputs
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'user_id is required';
  END IF;
  IF _message IS NULL OR length(trim(_message)) = 0 THEN
    RAISE EXCEPTION 'message is required';
  END IF;
  IF length(_message) > 1000 THEN
    RAISE EXCEPTION 'message too long';
  END IF;
  -- Caller must be authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication required';
  END IF;

  INSERT INTO public.notifications (user_id, message, type, metadata)
  VALUES (_user_id, _message, _type, _metadata);
END;
$$;

-- Fix 2: Replace the overly permissive notifications INSERT policy
DROP POLICY IF EXISTS "Users can insert notifications for others" ON notifications;
CREATE POLICY "Service role only inserts notifications"
  ON notifications FOR INSERT TO service_role
  WITH CHECK (true);

-- Fix 3: Tighten verification_submissions INSERT to enforce pending status
DROP POLICY IF EXISTS "Users can insert own submissions" ON verification_submissions;
CREATE POLICY "Users can insert own submissions"
  ON verification_submissions FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND status = 'pending'
    AND rejection_reason IS NULL
  );
