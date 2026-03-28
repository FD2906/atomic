
-- Add result column to track outcomes per participant
ALTER TABLE public.challenge_participants ADD COLUMN IF NOT EXISTS result text;
-- Add payment_status to track if participant has paid their stake
ALTER TABLE public.challenge_participants ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'unpaid';
-- Add stake_id to link participant to their stake record
ALTER TABLE public.challenge_participants ADD COLUMN IF NOT EXISTS stake_id uuid REFERENCES public.stakes(id);
