-- Drop and recreate all policies to ensure consistency

-- Profiles table policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;

CREATE POLICY "Public profiles are viewable by everyone"
    ON public.profiles FOR SELECT
    USING (true);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can manage all profiles"
    ON public.profiles
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.uid() = id AND
                  id IN (SELECT id FROM public.profiles WHERE role = 'admin')
        )
    );

-- Appointments table policies
DROP POLICY IF EXISTS "Appointments are viewable by everyone" ON public.appointments;
DROP POLICY IF EXISTS "Users can create appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can update their own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can delete their own appointments" ON public.appointments;

CREATE POLICY "Appointments are viewable by everyone"
    ON public.appointments FOR SELECT
    USING (true);

CREATE POLICY "Users can create appointments"
    ON public.appointments FOR INSERT
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own appointments"
    ON public.appointments FOR UPDATE
    USING (auth.uid() = created_by)
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can delete their own appointments"
    ON public.appointments FOR DELETE
    USING (auth.uid() = created_by);

-- Appointments participants table policies
DROP POLICY IF EXISTS "Participants are viewable by everyone" ON public.appointments_participants;
DROP POLICY IF EXISTS "Users can join appointments" ON public.appointments_participants;
DROP POLICY IF EXISTS "Users can leave appointments" ON public.appointments_participants;

CREATE POLICY "Participants are viewable by everyone"
    ON public.appointments_participants FOR SELECT
    USING (true);

CREATE POLICY "Users can join appointments"
    ON public.appointments_participants FOR INSERT
    WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM public.appointments
            WHERE id = appointment_id
            AND NOT is_cancelled
            AND current_participants < max_participants
        )
    );

CREATE POLICY "Users can leave appointments"
    ON public.appointments_participants FOR DELETE
    USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.appointments TO authenticated;
GRANT ALL ON public.appointments_participants TO authenticated;
