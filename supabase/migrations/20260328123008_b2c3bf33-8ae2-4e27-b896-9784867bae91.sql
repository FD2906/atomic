CREATE TABLE public.appeals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  submission_id uuid NOT NULL REFERENCES public.verification_submissions(id) ON DELETE CASCADE,
  ticket_number text NOT NULL DEFAULT ('APL-' || substr(gen_random_uuid()::text, 1, 8)),
  explanation text NOT NULL CHECK (char_length(explanation) BETWEEN 50 AND 200),
  evidence_url text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

ALTER TABLE public.appeals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own appeals" ON public.appeals FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own appeals" ON public.appeals FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Service role can update appeals" ON public.appeals FOR UPDATE TO service_role USING (true) WITH CHECK (true);