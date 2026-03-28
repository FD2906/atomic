
-- Make habit_id nullable so stakes can be used for challenges
ALTER TABLE public.stakes ALTER COLUMN habit_id DROP NOT NULL;

-- Add challenge_id column with FK to challenges
ALTER TABLE public.stakes ADD COLUMN challenge_id uuid REFERENCES public.challenges(id) ON DELETE CASCADE;

-- Add a check: at least one of habit_id or challenge_id must be set
-- Using a trigger instead of CHECK for flexibility
CREATE OR REPLACE FUNCTION public.validate_stake_reference()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.habit_id IS NULL AND NEW.challenge_id IS NULL THEN
    RAISE EXCEPTION 'Either habit_id or challenge_id must be provided';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER check_stake_reference
  BEFORE INSERT OR UPDATE ON public.stakes
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_stake_reference();
