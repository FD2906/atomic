
-- Fix placeholder images in verification_examples with real category-appropriate images

-- Exercise good examples
UPDATE verification_examples SET image_url = 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400' WHERE id = 'a117ba7e-e873-4204-87fd-a69bc26ce182';
UPDATE verification_examples SET image_url = 'https://images.unsplash.com/photo-1461896836934-bd45ba0c1020?w=400' WHERE id = 'a509736f-c7e5-4234-ba7a-989762d72d81';
-- Exercise bad examples
UPDATE verification_examples SET image_url = 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400' WHERE id = '886d8b3e-0409-4f9b-95a9-af4ff79f183e';
UPDATE verification_examples SET image_url = 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=400' WHERE id = 'b544fb47-3c18-429e-b4a0-30e1071f327f';

-- Hydration good examples
UPDATE verification_examples SET image_url = 'https://images.unsplash.com/photo-1523362628745-0c100150b504?w=400' WHERE id = '96b7047a-a402-497b-a4be-d2fa381b0ae3';
UPDATE verification_examples SET image_url = 'https://images.unsplash.com/photo-1559839914-17aae19cec71?w=400' WHERE id = 'edc980a5-d2e2-441a-92aa-7791b06f7dd1';
-- Hydration bad examples
UPDATE verification_examples SET image_url = 'https://images.unsplash.com/photo-1513558161293-cdaf765ed514?w=400' WHERE id = '1cff44ae-7fb9-4911-86da-c513b006d239';
UPDATE verification_examples SET image_url = 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=400' WHERE id = '4aa7537b-763b-4fd9-94ac-be936a122eaf';

-- Reading good examples
UPDATE verification_examples SET image_url = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400' WHERE id = '489e2f9d-bde9-4715-868d-5ac541e0ecd5';
UPDATE verification_examples SET image_url = 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400' WHERE id = 'add9694b-3d4b-4799-acc6-13fa2be4a836';
-- Reading bad examples
UPDATE verification_examples SET image_url = 'https://images.unsplash.com/photo-1524578271613-d550eacf6090?w=400' WHERE id = 'ba873834-5bf8-4516-b263-e1c4ce99ecd9';
UPDATE verification_examples SET image_url = 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400' WHERE id = 'e302a3ae-ad02-4e43-bb40-abaf4770be29';
UPDATE verification_examples SET image_url = 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=400' WHERE id = 'ba873834-5bf8-4516-b263-e1c4ce99ecd1' OR (id = 'ba873834-5bf8-4516-b263-e1c4ce99ecd9' AND image_url = '/placeholder.svg');

-- Other good examples
UPDATE verification_examples SET image_url = 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=400' WHERE id = 'e47a1174-718b-4cf9-b551-4a5550bc2ad8';
UPDATE verification_examples SET image_url = 'https://images.unsplash.com/photo-1504805572947-34fad45aed93?w=400' WHERE id = 'ac35be0e-9c9b-40ca-8702-da47d64441d9';
-- Other bad examples
UPDATE verification_examples SET image_url = 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=400' WHERE id = 'cda88a95-61d1-4ec0-be45-fa3a0f7aadd1';
UPDATE verification_examples SET image_url = 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=400' WHERE id = '6e22bfda-7176-4aed-96f0-191d5ad6954a';
