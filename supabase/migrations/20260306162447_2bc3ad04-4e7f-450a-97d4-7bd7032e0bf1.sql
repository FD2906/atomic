
-- 1. PROFILES
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  first_name text,
  last_name text,
  spending_limit numeric DEFAULT NULL,
  onboarding_completed boolean NOT NULL DEFAULT false,
  date_registered timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. CHARITIES
CREATE TABLE public.charities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text,
  sdg_alignment text,
  is_featured boolean NOT NULL DEFAULT false,
  total_received numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.charities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view charities" ON public.charities FOR SELECT TO authenticated USING (true);

-- 3. HABITS
CREATE TABLE public.habits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  frequency text NOT NULL DEFAULT 'daily',
  category text,
  daily_deadline time,
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date,
  status text NOT NULL DEFAULT 'active',
  verification_type text NOT NULL DEFAULT 'photo',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own habits" ON public.habits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own habits" ON public.habits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own habits" ON public.habits FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own habits" ON public.habits FOR DELETE USING (auth.uid() = user_id);

-- 4. STAKES
CREATE TABLE public.stakes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id uuid NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  charity_id uuid NOT NULL REFERENCES public.charities(id),
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'GBP',
  status text NOT NULL DEFAULT 'held',
  date_created timestamptz NOT NULL DEFAULT now(),
  date_resolved timestamptz
);
ALTER TABLE public.stakes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own stakes" ON public.stakes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own stakes" ON public.stakes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own stakes" ON public.stakes FOR UPDATE USING (auth.uid() = user_id);

-- 5. VERIFICATION_SUBMISSIONS
CREATE TABLE public.verification_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id uuid NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  evidence_type text NOT NULL DEFAULT 'photo',
  file_url text,
  notes text,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'pending',
  rejection_reason text
);
ALTER TABLE public.verification_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own submissions" ON public.verification_submissions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own submissions" ON public.verification_submissions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 6. TRANSACTIONS
CREATE TABLE public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  stake_id uuid REFERENCES public.stakes(id),
  amount numeric NOT NULL,
  type text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  timestamp timestamptz NOT NULL DEFAULT now(),
  payment_reference text
);
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 7. CHALLENGES
CREATE TABLE public.challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  is_group_challenge boolean NOT NULL DEFAULT false,
  start_date date,
  end_date date,
  status text NOT NULL DEFAULT 'active',
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view challenges" ON public.challenges FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert challenges" ON public.challenges FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update own challenges" ON public.challenges FOR UPDATE USING (auth.uid() = created_by);

-- 8. CHALLENGE_PARTICIPANTS
CREATE TABLE public.challenge_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  UNIQUE(challenge_id, user_id)
);
ALTER TABLE public.challenge_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own participations" ON public.challenge_participants FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can join challenges" ON public.challenge_participants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave challenges" ON public.challenge_participants FOR DELETE USING (auth.uid() = user_id);

-- 9. NOTIFICATIONS
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message text NOT NULL,
  type text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- Enable realtime on notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- 10. TRIGGER: auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', '')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 11. STORAGE BUCKET for evidence
INSERT INTO storage.buckets (id, name, public) VALUES ('evidence', 'evidence', true);

CREATE POLICY "Users can upload evidence" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'evidence' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Anyone can view evidence" ON storage.objects FOR SELECT USING (bucket_id = 'evidence');
CREATE POLICY "Users can delete own evidence" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'evidence' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 12. SEED CHARITIES
INSERT INTO public.charities (name, description, category, sdg_alignment, is_featured) VALUES
  ('MIND', 'Supporting those with mental health problems', 'mental_health', 'SDG 3: Good Health', true),
  ('WWF', 'Protecting wildlife and wild places', 'environment', 'SDG 15: Life on Land', true),
  ('Cancer Research UK', 'Pioneering research to beat cancer', 'health', 'SDG 3: Good Health', true),
  ('Shelter', 'Fighting homelessness and bad housing', 'housing', 'SDG 11: Sustainable Cities', true),
  ('British Heart Foundation', 'Funding research into heart and circulatory diseases', 'health', 'SDG 3: Good Health', true);
