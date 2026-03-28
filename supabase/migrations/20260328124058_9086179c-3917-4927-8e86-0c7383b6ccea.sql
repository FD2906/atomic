
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS notify_reminders boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_verifications boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_opponent_activity boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS quiet_hours_start time without time zone DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS quiet_hours_end time without time zone DEFAULT NULL;
