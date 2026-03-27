
CREATE TABLE public.verification_examples (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_category text NOT NULL,
  image_url text NOT NULL,
  is_good boolean NOT NULL DEFAULT true,
  explanation text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.verification_examples ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view verification examples"
  ON public.verification_examples
  FOR SELECT
  TO public
  USING (true);
