
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

-- Schedule deadline-reminder to run every 15 minutes
SELECT cron.schedule(
  'deadline-reminder-job',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_URL') || '/functions/v1/deadline-reminder',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY')
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Allow service role to update verification_submissions (for auto-verify)
CREATE POLICY "Service role can update submissions"
ON public.verification_submissions
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

-- Seed verification examples
INSERT INTO public.verification_examples (habit_category, is_good, image_url, explanation) VALUES
('exercise', true, 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400', 'Clear photo of workout in progress with gym equipment visible'),
('exercise', true, 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=400', 'Outdoor running photo with fitness tracker showing distance and time'),
('exercise', false, 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400', 'Screenshot of a step counter app — screenshots are not accepted as evidence'),
('exercise', false, 'https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?w=400', 'Stock photo of gym equipment — must show YOU doing the activity'),
('reading', true, 'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?w=400', 'Photo of open book with current page visible and timestamp'),
('reading', true, 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400', 'Photo showing book and reading environment with natural lighting'),
('reading', false, 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400', 'Photo of closed book cover — must show you actively reading'),
('reading', false, 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=400', 'Library stock photo — must be your own reading session'),
('sleep', true, 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=400', 'Screenshot of sleep tracking app showing 7+ hours logged (sleep exception: app screenshots OK)'),
('sleep', false, 'https://images.unsplash.com/photo-1520206183501-b80df61043c2?w=400', 'Photo of an unmade bed — doesn''t prove sleep duration'),
('hydration', true, 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400', 'Photo of water bottle with markings showing daily target reached'),
('hydration', false, 'https://images.unsplash.com/photo-1560023907-5f339617ea55?w=400', 'Stock photo of water glass — must show your actual hydration tracking')
ON CONFLICT DO NOTHING;
