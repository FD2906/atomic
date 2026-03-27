
-- Add a metadata column to notifications for deep-linking (e.g. challenge_id)
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

-- Create trigger function: when a verification_submission is approved,
-- notify opponents in any active challenge the submitter is part of
CREATE OR REPLACE FUNCTION public.notify_opponent_on_verification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  submitter_name text;
  challenge_rec record;
  opponent_rec record;
  day_number int;
BEGIN
  -- Only fire when status changes to 'approved'
  IF NEW.status <> 'approved' OR (OLD.status IS NOT NULL AND OLD.status = 'approved') THEN
    RETURN NEW;
  END IF;

  -- Get submitter's first name
  SELECT COALESCE(first_name, 'Someone') INTO submitter_name
  FROM public.profiles WHERE id = NEW.user_id;

  -- Find all active challenges the submitter participates in
  FOR challenge_rec IN
    SELECT c.id AS challenge_id, c.title, c.start_date
    FROM public.challenges c
    JOIN public.challenge_participants cp ON cp.challenge_id = c.id
    WHERE cp.user_id = NEW.user_id
      AND cp.status = 'accepted'
      AND c.status = 'active'
  LOOP
    -- Calculate day number
    day_number := GREATEST(1, (CURRENT_DATE - challenge_rec.start_date) + 1);

    -- Find opponents in this challenge
    FOR opponent_rec IN
      SELECT cp2.user_id
      FROM public.challenge_participants cp2
      WHERE cp2.challenge_id = challenge_rec.challenge_id
        AND cp2.user_id <> NEW.user_id
        AND cp2.status = 'accepted'
    LOOP
      -- Check opponent has notifications enabled
      IF EXISTS (SELECT 1 FROM public.profiles WHERE id = opponent_rec.user_id AND notifications_enabled = true) THEN
        INSERT INTO public.notifications (user_id, message, type, metadata)
        VALUES (
          opponent_rec.user_id,
          submitter_name || ' completed Day ' || day_number || ' of "' || challenge_rec.title || '"! 🔥',
          'opponent_activity',
          jsonb_build_object('challenge_id', challenge_rec.challenge_id)
        );
      END IF;
    END LOOP;
  END LOOP;

  RETURN NEW;
END;
$$;

-- Create the trigger on verification_submissions
DROP TRIGGER IF EXISTS trg_notify_opponent_on_verification ON public.verification_submissions;
CREATE TRIGGER trg_notify_opponent_on_verification
  AFTER UPDATE ON public.verification_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_opponent_on_verification();
