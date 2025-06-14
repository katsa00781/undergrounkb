-- Appointments schema
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

CREATE TABLE public.appointments_participants (
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    PRIMARY KEY (appointment_id, user_id)
);

-- Enable RLS
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments_participants ENABLE ROW LEVEL SECURITY;

-- Simple policies for appointments
CREATE POLICY "Anyone can view appointments"
    ON public.appointments FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can create appointments"
    ON public.appointments FOR INSERT
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can manage their own appointments"
    ON public.appointments FOR ALL
    USING (auth.uid() = created_by);

-- Simple policies for participants
CREATE POLICY "Anyone can view participants"
    ON public.appointments_participants FOR SELECT
    USING (true);

CREATE POLICY "Users can manage their own participation"
    ON public.appointments_participants FOR ALL
    USING (auth.uid() = user_id);
