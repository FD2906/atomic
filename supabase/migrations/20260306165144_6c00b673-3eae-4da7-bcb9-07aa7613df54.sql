
-- Add fields to challenges for 1v1 functionality
ALTER TABLE public.challenges
  ADD COLUMN IF NOT EXISTS stake_amount numeric NOT NULL DEFAULT 500,
  ADD COLUMN IF NOT EXISTS habit_category text NOT NULL DEFAULT 'exercise',
  ADD COLUMN IF NOT EXISTS charity_id uuid REFERENCES public.charities(id);

-- Add status and habit tracking to challenge_participants
ALTER TABLE public.challenge_participants
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'invited',
  ADD COLUMN IF NOT EXISTS habit_id uuid REFERENCES public.habits(id),
  ADD COLUMN IF NOT EXISTS joined_at timestamptz DEFAULT now();

-- Create fraud_reports table
CREATE TABLE IF NOT EXISTS public.fraud_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  reporter_id uuid NOT NULL REFERENCES public.profiles(id),
  reported_user_id uuid NOT NULL REFERENCES public.profiles(id),
  submission_id uuid REFERENCES public.verification_submissions(id),
  reason text NOT NULL,
  evidence_notes text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

ALTER TABLE public.fraud_reports ENABLE ROW LEVEL SECURITY;

-- Fraud reports: users can view reports they filed or are about them
CREATE POLICY "Users can view own fraud reports" ON public.fraud_reports
  FOR SELECT TO authenticated
  USING (auth.uid() = reporter_id OR auth.uid() = reported_user_id);

CREATE POLICY "Users can insert fraud reports" ON public.fraud_reports
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

-- Enable realtime for challenges
ALTER PUBLICATION supabase_realtime ADD TABLE public.challenges;
ALTER PUBLICATION supabase_realtime ADD TABLE public.challenge_participants;
