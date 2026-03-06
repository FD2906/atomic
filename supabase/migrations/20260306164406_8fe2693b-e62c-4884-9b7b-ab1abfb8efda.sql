
-- Drop all RESTRICTIVE policies and recreate as PERMISSIVE

-- profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- charities
DROP POLICY IF EXISTS "Anyone can view charities" ON public.charities;
CREATE POLICY "Anyone can view charities" ON public.charities FOR SELECT USING (true);

-- habits
DROP POLICY IF EXISTS "Users can view own habits" ON public.habits;
DROP POLICY IF EXISTS "Users can insert own habits" ON public.habits;
DROP POLICY IF EXISTS "Users can update own habits" ON public.habits;
DROP POLICY IF EXISTS "Users can delete own habits" ON public.habits;

CREATE POLICY "Users can view own habits" ON public.habits FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own habits" ON public.habits FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own habits" ON public.habits FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own habits" ON public.habits FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- stakes
DROP POLICY IF EXISTS "Users can view own stakes" ON public.stakes;
DROP POLICY IF EXISTS "Users can insert own stakes" ON public.stakes;
DROP POLICY IF EXISTS "Users can update own stakes" ON public.stakes;

CREATE POLICY "Users can view own stakes" ON public.stakes FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own stakes" ON public.stakes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own stakes" ON public.stakes FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- verification_submissions
DROP POLICY IF EXISTS "Users can view own submissions" ON public.verification_submissions;
DROP POLICY IF EXISTS "Users can insert own submissions" ON public.verification_submissions;

CREATE POLICY "Users can view own submissions" ON public.verification_submissions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own submissions" ON public.verification_submissions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- transactions
DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON public.transactions;

CREATE POLICY "Users can view own transactions" ON public.transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions" ON public.transactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- notifications
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;

CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- challenges
DROP POLICY IF EXISTS "Authenticated can view challenges" ON public.challenges;
DROP POLICY IF EXISTS "Users can insert challenges" ON public.challenges;
DROP POLICY IF EXISTS "Users can update own challenges" ON public.challenges;

CREATE POLICY "Authenticated can view challenges" ON public.challenges FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert challenges" ON public.challenges FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update own challenges" ON public.challenges FOR UPDATE TO authenticated USING (auth.uid() = created_by);

-- challenge_participants
DROP POLICY IF EXISTS "Users can view own participations" ON public.challenge_participants;
DROP POLICY IF EXISTS "Users can join challenges" ON public.challenge_participants;
DROP POLICY IF EXISTS "Users can leave challenges" ON public.challenge_participants;

CREATE POLICY "Users can view own participations" ON public.challenge_participants FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can join challenges" ON public.challenge_participants FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave challenges" ON public.challenge_participants FOR DELETE TO authenticated USING (auth.uid() = user_id);
