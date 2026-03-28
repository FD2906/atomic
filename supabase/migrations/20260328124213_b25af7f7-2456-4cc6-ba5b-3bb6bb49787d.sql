
CREATE OR REPLACE FUNCTION public.notify_opponent_on_verification()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  submitter_name text;
  challenge_rec record;
  opponent_rec record;
  day_number int;
  opp_profile record;
  current_time_str text;
BEGIN
  IF NEW.status <> 'approved' OR (OLD.status IS NOT NULL AND OLD.status = 'approved') THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(first_name, 'Someone') INTO submitter_name
  FROM public.profiles WHERE id = NEW.user_id;

  FOR challenge_rec IN
    SELECT c.id AS challenge_id, c.title, c.start_date
    FROM public.challenges c
    JOIN public.challenge_participants cp ON cp.challenge_id = c.id
    WHERE cp.user_id = NEW.user_id
      AND cp.status = 'accepted'
      AND c.status = 'active'
  LOOP
    day_number := GREATEST(1, (CURRENT_DATE - challenge_rec.start_date) + 1);

    FOR opponent_rec IN
      SELECT cp2.user_id
      FROM public.challenge_participants cp2
      WHERE cp2.challenge_id = challenge_rec.challenge_id
        AND cp2.user_id <> NEW.user_id
        AND cp2.status = 'accepted'
    LOOP
      SELECT * INTO opp_profile FROM public.profiles WHERE id = opponent_rec.user_id;

      -- Check master toggle AND per-type toggle
      IF opp_profile.notifications_enabled = true AND opp_profile.notify_opponent_activity = true THEN
        -- Check quiet hours
        current_time_str := to_char(now(), 'HH24:MI');
        IF opp_profile.quiet_hours_start IS NOT NULL AND opp_profile.quiet_hours_end IS NOT NULL THEN
          IF opp_profile.quiet_hours_start <= opp_profile.quiet_hours_end THEN
            IF current_time_str >= to_char(opp_profile.quiet_hours_start, 'HH24:MI')
               AND current_time_str < to_char(opp_profile.quiet_hours_end, 'HH24:MI') THEN
              CONTINUE;
            END IF;
          ELSE
            IF current_time_str >= to_char(opp_profile.quiet_hours_start, 'HH24:MI')
               OR current_time_str < to_char(opp_profile.quiet_hours_end, 'HH24:MI') THEN
              CONTINUE;
            END IF;
          END IF;
        END IF;

        INSERT INTO public.notifications (user_id, message, type, metadata)
        VALUES (
          opponent_rec.user_id,
          submitter_name || ' completed Day ' || day_number || ' of "' || challenge_rec.title || '"! 🔥',
          'opponent_activity',
          jsonb_build_object('challenge_id', challenge_rec.challenge_id)
        );
      END IF;
    END LOOP;
  END LOOP;

  RETURN NEW;
END;
$$;

-- Also update verification notification trigger to respect preferences
CREATE OR REPLACE FUNCTION public.create_verification_notification()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  user_profile record;
  current_time_str text;
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status <> 'approved') THEN
    SELECT * INTO user_profile FROM profiles WHERE id = NEW.user_id;

    IF user_profile.notifications_enabled = true AND user_profile.notify_verifications = true THEN
      -- Check quiet hours
      current_time_str := to_char(now(), 'HH24:MI');
      IF user_profile.quiet_hours_start IS NOT NULL AND user_profile.quiet_hours_end IS NOT NULL THEN
        IF user_profile.quiet_hours_start <= user_profile.quiet_hours_end THEN
          IF current_time_str >= to_char(user_profile.quiet_hours_start, 'HH24:MI')
             AND current_time_str < to_char(user_profile.quiet_hours_end, 'HH24:MI') THEN
            RETURN NEW;
          END IF;
        ELSE
          IF current_time_str >= to_char(user_profile.quiet_hours_start, 'HH24:MI')
             OR current_time_str < to_char(user_profile.quiet_hours_end, 'HH24:MI') THEN
            RETURN NEW;
          END IF;
        END IF;
      END IF;

      INSERT INTO public.notifications (user_id, message, type)
      VALUES (
        NEW.user_id,
        'Your evidence submission has been verified and approved! ✅',
        'verification_approved'
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
