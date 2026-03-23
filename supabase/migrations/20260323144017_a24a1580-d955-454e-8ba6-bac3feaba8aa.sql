
-- Add username and avatar_url columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username text UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;

-- Allow authenticated users to search other users by username (for challenge invites)
CREATE POLICY "Users can search profiles by username"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Drop the old restrictive select policy first
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- Update handle_new_user to generate a default username
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, username, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'first_name',
      NEW.raw_user_meta_data->>'given_name',
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      ''
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'last_name',
      NEW.raw_user_meta_data->>'family_name',
      ''
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'username',
      'user_' || substr(NEW.id::text, 1, 8)
    ),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$function$;

-- Backfill existing profiles that don't have usernames
UPDATE public.profiles SET username = 'user_' || substr(id::text, 1, 8) WHERE username IS NULL;
