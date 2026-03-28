
-- Fix 4 broken Unsplash URLs (404 errors)
UPDATE verification_examples SET image_url = 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=400' WHERE id = 'a509736f-c7e5-4234-ba7a-989762d72d81';
UPDATE verification_examples SET image_url = 'https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=400' WHERE id = 'ca725ef6-a277-4d19-8f06-d3af0ca8d88d';
UPDATE verification_examples SET image_url = 'https://images.unsplash.com/photo-1548455247-48f2db10e351?w=400' WHERE id = 'a6f8a235-cf8c-4c06-a571-57534a8645b0';
UPDATE verification_examples SET image_url = 'https://images.unsplash.com/photo-1495774856032-8b90bbb32b32?w=400' WHERE id = '1cff44ae-7fb9-4911-86da-c513b006d239';

-- Fix 4 placeholder.svg images for sleep category with real relevant URLs
UPDATE verification_examples SET image_url = 'https://images.unsplash.com/photo-1550534791-2677533605ab?w=400' WHERE id = '255690b2-3203-4bfe-92e1-f0c444454ff9';
UPDATE verification_examples SET image_url = 'https://images.unsplash.com/photo-1531353826977-0941b4779a1c?w=400' WHERE id = '6169edad-b9db-4f2d-95d8-fcfbb68af468';
UPDATE verification_examples SET image_url = 'https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?w=400' WHERE id = 'b19dbbb8-53d5-41bc-89af-9da9089ebe6a';
UPDATE verification_examples SET image_url = 'https://images.unsplash.com/photo-1541480601022-2308c0f02487?w=400' WHERE id = 'cb343615-60ab-4d92-9b41-a9ccbf2e71f4';
