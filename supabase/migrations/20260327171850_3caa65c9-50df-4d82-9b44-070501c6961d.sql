-- Add notifications_enabled column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS notifications_enabled boolean DEFAULT NULL;

-- Allow INSERT on notifications via a security definer function (for triggers)
CREATE OR REPLACE FUNCTION public.create_verification_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status <> 'approved') THEN
    IF EXISTS (SELECT 1 FROM profiles WHERE id = NEW.user_id AND notifications_enabled = true) THEN
      INSERT INTO public.notifications (user_id, message, type)
      VALUES (
        NEW.user_id,
        'Your evidence submission has been verified and approved! ✅',
        'verification_approved'
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger on verification_submissions
CREATE TRIGGER on_verification_approved
  AFTER UPDATE ON public.verification_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.create_verification_notification();