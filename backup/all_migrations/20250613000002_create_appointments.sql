-- Create appointments table
CREATE TABLE public.appointments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    max_participants INTEGER NOT NULL DEFAULT 1,
    current_participants INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    created_by UUID REFERENCES auth.users(id) NOT NULL,
    is_cancelled BOOLEAN DEFAULT false NOT NULL,
    CONSTRAINT participants_check CHECK (current_participants >= 0 AND current_participants <= max_participants)
);

-- Create appointments_participants junction table
CREATE TABLE public.appointments_participants (
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    PRIMARY KEY (appointment_id, user_id)
);

-- Create indexes for performance
CREATE INDEX idx_appointments_start_time ON public.appointments(start_time);
CREATE INDEX idx_appointments_end_time ON public.appointments(end_time);
CREATE INDEX idx_appointments_created_by ON public.appointments(created_by);
CREATE INDEX idx_appointments_participants_user ON public.appointments_participants(user_id);

-- Enable RLS
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments_participants ENABLE ROW LEVEL SECURITY;

-- Create appointment policies
CREATE POLICY "Appointments are viewable by everyone"
    ON public.appointments FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can create appointments"
    ON public.appointments FOR INSERT
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can manage their own appointments"
    ON public.appointments FOR ALL
    USING (auth.uid() = created_by);

-- Create participant policies
CREATE POLICY "Participants are viewable by everyone"
    ON public.appointments_participants FOR SELECT
    USING (true);

CREATE POLICY "Users can join available appointments"
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

CREATE POLICY "Users can leave their appointments"
    ON public.appointments_participants FOR DELETE
    USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON public.appointments TO authenticated;
GRANT ALL ON public.appointments_participants TO authenticated;
