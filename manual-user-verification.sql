-- Manual user verification script for development
-- Use this in Supabase SQL Editor to verify test users without sending emails

-- Verify a specific user by email
UPDATE auth.users 
SET email_confirmed_at = NOW(),
    updated_at = NOW()
WHERE email = 'your-test-email@gmail.com'
  AND email_confirmed_at IS NULL;

-- Check verification status
SELECT 
    id,
    email,
    email_confirmed_at,
    created_at
FROM auth.users 
WHERE email = 'your-test-email@gmail.com';

-- Verify all unverified users (use with caution!)
-- UPDATE auth.users 
-- SET email_confirmed_at = NOW(),
--     updated_at = NOW()
-- WHERE email_confirmed_at IS NULL;
