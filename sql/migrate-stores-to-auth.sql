-- ============================================
-- MIGRATION HELPER: Link Existing Stores to Auth
-- Run this in Supabase SQL Editor AFTER creating Auth users
-- ============================================

-- Step 1: Add email column if not exists
ALTER TABLE lojas ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;

-- Step 2: Show stores without user_id (to know which need linking)
SELECT id, nome, slug, 
       CASE WHEN user_id IS NULL THEN 'NEEDS LINKING' ELSE 'LINKED' END as status
FROM lojas
ORDER BY id;

-- Step 3: Generate UPDATE statements for each store
-- Copy the output and run each line after creating Auth users
SELECT 
  'UPDATE lojas SET user_id = ''' || au.id || ''', email = ''' || lojas.slug || '@' || lojas.slug || '.com'' WHERE slug = ''' || lojas.slug || ''';' as sql_to_run
FROM lojas
LEFT JOIN auth.users au ON au.email LIKE '%' || lojas.slug || '%'
WHERE lojas.user_id IS NULL;

-- ============================================
-- INSTRUCTIONS:
-- 1. For EACH store, go to Dashboard > Auth > Users > "Add user"
-- 2. Use email format: SLUG@SLUG.com (ex: thalita-presentes@thalita-presentes.com)
-- 3. Copy the UUID generated
-- 4. Run: UPDATE lojas SET user_id = 'UUID_HERE' WHERE slug = 'SLUG';
-- ============================================
