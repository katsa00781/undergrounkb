-- Quick fix for infinite recursion in profiles policies
-- Drop problematic policies and recreate them properly

-- Drop all existing policies
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin access all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;

-- Recreate simple, non-recursive policies
CREATE POLICY "Enable read access for all users" 
    ON public.profiles FOR SELECT 
    USING (true);

CREATE POLICY "Enable insert for authenticated users based on user_id" 
    ON public.profiles FOR INSERT 
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable update for users based on user_id" 
    ON public.profiles FOR UPDATE 
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Simple admin policy using specific admin email
CREATE POLICY "Enable all access for specific admin"
    ON public.profiles FOR ALL
    USING (
        (SELECT email FROM auth.users WHERE id = auth.uid()) = 'katsa007@gmail.com'
    );
