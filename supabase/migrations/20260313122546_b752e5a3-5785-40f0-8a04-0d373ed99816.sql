-- Recreate the trigger that auto-creates profiles on user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Backfill: create profiles for any existing auth users who don't have one
INSERT INTO public.profiles (id, email, first_name, last_name)
SELECT 
  u.id,
  u.email,
  COALESCE(
    u.raw_user_meta_data->>'first_name',
    u.raw_user_meta_data->>'given_name',
    u.raw_user_meta_data->>'full_name',
    u.raw_user_meta_data->>'name',
    ''
  ),
  COALESCE(
    u.raw_user_meta_data->>'last_name',
    u.raw_user_meta_data->>'family_name',
    ''
  )
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;