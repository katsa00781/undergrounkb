-- Add additional columns to profiles table for user profile data
-- This handles both the profile page form fields and also FMS assessment needs
-- Some columns may already exist, so we use IF NOT EXISTS

-- First verify that the profiles table exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename = 'profiles'
    ) THEN
        CREATE TABLE public.profiles (
            id UUID PRIMARY KEY,
            email TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
END $$;

-- Add basic name fields if they don't exist (these are used by FMS assessment)
ALTER TABLE IF EXISTS public.profiles
ADD COLUMN IF NOT EXISTS first_name text,
ADD COLUMN IF NOT EXISTS last_name text;

-- Add other fields needed for profile form
ALTER TABLE IF EXISTS public.profiles
ADD COLUMN IF NOT EXISTS height numeric,
ADD COLUMN IF NOT EXISTS weight numeric,
ADD COLUMN IF NOT EXISTS birthdate date,
ADD COLUMN IF NOT EXISTS gender text,
ADD COLUMN IF NOT EXISTS fitness_goals text[],
ADD COLUMN IF NOT EXISTS experience_level text;

-- Ensure the role column exists
ALTER TABLE IF EXISTS public.profiles
ADD COLUMN IF NOT EXISTS role text DEFAULT 'user';

-- Ensure RLS is enabled
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;

-- Set up policies if they don't exist
DO $$
BEGIN
    -- Check if the policy exists
    IF NOT EXISTS (
        SELECT FROM pg_policies
        WHERE tablename = 'profiles' AND policyname = 'Public profiles are viewable by everyone.'
    ) THEN
        CREATE POLICY "Public profiles are viewable by everyone."
        ON public.profiles FOR SELECT
        USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT FROM pg_policies
        WHERE tablename = 'profiles' AND policyname = 'Users can insert their own profile.'
    ) THEN
        CREATE POLICY "Users can insert their own profile."
        ON public.profiles FOR INSERT
        WITH CHECK (auth.uid() = id);
    END IF;

    IF NOT EXISTS (
        SELECT FROM pg_policies
        WHERE tablename = 'profiles' AND policyname = 'Users can update own profile.'
    ) THEN
        CREATE POLICY "Users can update own profile."
        ON public.profiles FOR UPDATE
        USING (auth.uid() = id);
    END IF;
END $$;
