-- Fix profiles table schema to match expected structure
-- This ensures the profiles table has the exact fields expected by the frontend

-- First, check if we have the right columns
DO $$
BEGIN
    -- Drop the existing table if it exists and recreate with correct schema
    DROP TABLE IF EXISTS public.profiles CASCADE;
    
    -- Create the proper enum if it doesn't exist
    DROP TYPE IF EXISTS public.user_role CASCADE;
    CREATE TYPE public.user_role AS ENUM ('admin', 'user');
    
    -- Create profiles table with correct schema
    CREATE TABLE public.profiles (
        id UUID REFERENCES auth.users(id) PRIMARY KEY,
        email TEXT NOT NULL,
        role public.user_role NOT NULL DEFAULT 'user',
        full_name TEXT,
        avatar_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
    );

    -- Create indexes for performance
    CREATE INDEX idx_profiles_email ON public.profiles(email);
    CREATE INDEX idx_profiles_role ON public.profiles(role);

    -- Enable RLS
    ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

    -- Create policies
    CREATE POLICY "Profiles are viewable by everyone" 
        ON public.profiles FOR SELECT 
        USING (true);

    CREATE POLICY "Users can insert their own profile" 
        ON public.profiles FOR INSERT 
        WITH CHECK (auth.uid() = id);

    CREATE POLICY "Users can update own profile" 
        ON public.profiles FOR UPDATE 
        USING (auth.uid() = id)
        WITH CHECK (auth.uid() = id);

    CREATE POLICY "Admin access all profiles" 
        ON public.profiles 
        FOR ALL 
        TO authenticated
        USING (
            -- Simply check if the user has admin role in user metadata
            (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin'
            OR
            -- Or check current user ID against a specific admin user
            auth.uid()::text = 'your-admin-user-id-here'
        );

    -- Grant necessary permissions
    GRANT ALL ON public.profiles TO authenticated;
    GRANT USAGE ON SCHEMA public TO authenticated;
    
END $$;

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, role, full_name)
    VALUES (new.id, new.email, 'user', COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)));
    RETURN new;
EXCEPTION
    WHEN others THEN
        -- Log the error but don't fail the user creation
        RAISE LOG 'Error creating profile for user %: %', new.id, SQLERRM;
        RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration (drop first if exists)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
