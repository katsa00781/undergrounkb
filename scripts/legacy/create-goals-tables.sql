-- Create goals table after types are created
CREATE TABLE IF NOT EXISTS public.goals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category goal_category NOT NULL DEFAULT 'fitness',
    type goal_type NOT NULL,
    target_value DECIMAL(10,2),
    target_unit VARCHAR(50), -- 'kg', 'reps', 'minutes', 'days', etc.
    current_value DECIMAL(10,2) DEFAULT 0,
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE NOT NULL,
    status goal_status DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create goal completions table  
CREATE TABLE IF NOT EXISTS public.goal_completions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    completion_date DATE NOT NULL DEFAULT CURRENT_DATE,
    value_achieved DECIMAL(10,2),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create unique index: one goal per day
CREATE UNIQUE INDEX IF NOT EXISTS idx_goal_completions_unique 
ON public.goal_completions(goal_id, completion_date);

SELECT 'Tables created successfully' as status;
