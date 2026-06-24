-- Add a note that this SQL is running
DO $$
BEGIN
  RAISE NOTICE 'Setting admin role for user with email: katsa007@gmail.com';
END $$;

-- First check if the user exists
DO $$
DECLARE
  user_exists BOOLEAN;
BEGIN
  SELECT EXISTS(SELECT 1 FROM profiles WHERE email = 'katsa007@gmail.com') INTO user_exists;
  
  IF NOT user_exists THEN
    RAISE EXCEPTION 'User with email % does not exist in the profiles table', 'katsa007@gmail.com';
  END IF;
END $$;

-- Set admin role in profiles table
UPDATE profiles
SET role = 'admin'
WHERE email = 'katsa007@gmail.com'
RETURNING id, email, role;

-- Set admin role in users table if it exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
    RAISE NOTICE 'Updating users table as well';
    
    UPDATE users
    SET role = 'admin'
    WHERE email = 'katsa007@gmail.com';
    
    -- Check if the update affected any rows
    IF NOT FOUND THEN
      RAISE NOTICE 'User not found in users table. Creating entry...';
      
      -- If user doesn't exist in users table, add them
      INSERT INTO users (id, email, role)
      SELECT id, email, 'admin'
      FROM profiles
      WHERE email = 'katsa007@gmail.com';
    END IF;
  ELSE
    RAISE NOTICE 'Users table does not exist, skipping users table update';
  END IF;
END $$;
