
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  base_username text;
  first text;
  last_initial text;
  random_suffix text;
  final_username text;
  username_exists boolean;
BEGIN
  -- Check if username was provided via metadata
  IF NEW.raw_user_meta_data->>'username' IS NOT NULL AND length(trim(NEW.raw_user_meta_data->>'username')) >= 3 THEN
    final_username := trim(NEW.raw_user_meta_data->>'username');
  ELSE
    -- Build friendly username from name metadata
    first := lower(regexp_replace(
      COALESCE(
        NEW.raw_user_meta_data->>'first_name',
        NEW.raw_user_meta_data->>'given_name',
        split_part(COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''), ' ', 1),
        ''
      ),
      '[^a-z0-9]', '', 'gi'
    ));
    
    last_initial := lower(left(regexp_replace(
      COALESCE(
        NEW.raw_user_meta_data->>'last_name',
        NEW.raw_user_meta_data->>'family_name',
        CASE 
          WHEN COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '') LIKE '% %' 
          THEN split_part(COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'), ' ', 2)
          ELSE ''
        END,
        ''
      ),
      '[^a-z0-9]', '', 'gi'
    ), 1));
    
    -- Generate 6-char alphanumeric suffix
    random_suffix := lower(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
    
    IF length(first) > 0 AND length(last_initial) > 0 THEN
      base_username := first || last_initial || '_' || random_suffix;
    ELSIF length(first) > 0 THEN
      base_username := first || '_' || random_suffix;
    ELSE
      base_username := 'user_' || random_suffix;
    END IF;
    
    final_username := base_username;
  END IF;
  
  -- Ensure uniqueness
  LOOP
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE username = final_username) INTO username_exists;
    EXIT WHEN NOT username_exists;
    final_username := base_username || lower(substr(md5(random()::text), 1, 2));
  END LOOP;

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
    final_username,
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;
