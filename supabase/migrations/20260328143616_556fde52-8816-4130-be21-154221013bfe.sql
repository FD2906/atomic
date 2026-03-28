-- Backfill verification submissions with sample images for past days
-- For habit: Read 30 Pages (3073f7f4) - user 51cf6490 - started 2026-03-23, already has days 23-27

-- For habit: exercise (2ff7029c) - user 5ab01d11 - started 2026-03-27
INSERT INTO verification_submissions (habit_id, user_id, submitted_at, status, evidence_type, file_url, notes)
VALUES 
  ('2ff7029c-741a-4d78-831a-80ab564d8ed7', '5ab01d11-881a-4484-ba92-1b2e27590aad', '2026-03-27T08:30:00Z', 'approved', 'photo', 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600', 'Morning gym session')
ON CONFLICT DO NOTHING;

-- For habit: drink more water (bf1fcb54) - user 9c03e55c - started 2026-03-27
INSERT INTO verification_submissions (habit_id, user_id, submitted_at, status, evidence_type, file_url, notes)
VALUES 
  ('bf1fcb54-f5d6-4b34-8639-6ef84b84a101', '9c03e55c-3312-4593-a791-ac27034c3083', '2026-03-27T12:00:00Z', 'approved', 'photo', 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=600', 'Finished 2L by noon')
ON CONFLICT DO NOTHING;

-- For habit: Finish Crime and Punishment (7ec67a5c) - user 9c03e55c - started 2026-03-27
INSERT INTO verification_submissions (habit_id, user_id, submitted_at, status, evidence_type, file_url, notes)
VALUES 
  ('7ec67a5c-0416-4b2d-89d3-953fb8cfaca6', '9c03e55c-3312-4593-a791-ac27034c3083', '2026-03-27T21:00:00Z', 'approved', 'photo', 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600', 'Read chapters 4-6')
ON CONFLICT DO NOTHING;

-- For habit: run 4x a week (4ba769a9) - user 9c03e55c - started 2026-03-27 (already has one pending)
-- No backfill needed, already has a submission

-- For habit: dddd (f0b8822d) - user c7f1a6f9 - started 2026-03-23
INSERT INTO verification_submissions (habit_id, user_id, submitted_at, status, evidence_type, file_url, notes)
VALUES 
  ('f0b8822d-3c62-494e-8671-ca889740f806', 'c7f1a6f9-3ce9-480c-af7e-0103e4b22417', '2026-03-23T09:00:00Z', 'approved', 'photo', 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600', 'Gym workout'),
  ('f0b8822d-3c62-494e-8671-ca889740f806', 'c7f1a6f9-3ce9-480c-af7e-0103e4b22417', '2026-03-24T09:00:00Z', 'approved', 'photo', 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600', 'Morning run'),
  ('f0b8822d-3c62-494e-8671-ca889740f806', 'c7f1a6f9-3ce9-480c-af7e-0103e4b22417', '2026-03-25T09:00:00Z', 'approved', 'photo', 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=600', 'Outdoor run'),
  ('f0b8822d-3c62-494e-8671-ca889740f806', 'c7f1a6f9-3ce9-480c-af7e-0103e4b22417', '2026-03-26T09:00:00Z', 'approved', 'photo', 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600', 'Weight training'),
  ('f0b8822d-3c62-494e-8671-ca889740f806', 'c7f1a6f9-3ce9-480c-af7e-0103e4b22417', '2026-03-27T09:00:00Z', 'approved', 'photo', 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=600', 'Hill sprints')
ON CONFLICT DO NOTHING;

-- Backfill Read 30 Pages with images (already has approved rows but no file_urls)
UPDATE verification_submissions 
SET file_url = 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600', notes = 'Reading session - 30 pages completed'
WHERE habit_id = '3073f7f4-2899-41bb-b5ba-6542393c7eaf' 
  AND file_url IS NULL 
  AND submitted_at::date = '2026-03-23';

UPDATE verification_submissions 
SET file_url = 'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?w=600', notes = 'Afternoon reading at the park'
WHERE habit_id = '3073f7f4-2899-41bb-b5ba-6542393c7eaf' 
  AND file_url IS NULL 
  AND submitted_at::date = '2026-03-24';

UPDATE verification_submissions 
SET file_url = 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600', notes = 'Page 90 - getting into it'
WHERE habit_id = '3073f7f4-2899-41bb-b5ba-6542393c7eaf' 
  AND file_url IS NULL 
  AND submitted_at::date = '2026-03-25';

UPDATE verification_submissions 
SET file_url = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600', notes = 'Late night reading'
WHERE habit_id = '3073f7f4-2899-41bb-b5ba-6542393c7eaf' 
  AND file_url IS NULL 
  AND submitted_at::date = '2026-03-26';

UPDATE verification_submissions 
SET file_url = 'https://images.unsplash.com/photo-1524578271613-d550eacf6090?w=600', notes = 'Morning pages before work'
WHERE habit_id = '3073f7f4-2899-41bb-b5ba-6542393c7eaf' 
  AND file_url IS NULL 
  AND submitted_at::date = '2026-03-27';
