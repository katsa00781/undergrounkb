-- Complete Goals Database Setup Script
-- Run this in Supabase SQL Editor

-- Step 1: Drop and recreate types
DROP TYPE IF EXISTS goal_type CASCADE;
DROP TYPE IF EXISTS goal_category CASCADE;  
DROP TYPE IF EXISTS goal_status CASCADE;

CREATE TYPE goal_type AS ENUM ('daily', 'weekly', 'monthly', 'quarterly', 'yearly');
CREATE TYPE goal_category AS ENUM ('fitness', 'nutrition', 'health', 'lifestyle', 'personal');
CREATE TYPE goal_status AS ENUM ('active', 'completed', 'paused', 'cancelled');

-- Step 2: Drop and recreate tables
DROP TABLE IF EXISTS public.goal_completions CASCADE;
DROP TABLE IF EXISTS public.goals CASCADE;

-- Create goals table
CREATE TABLE public.goals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category goal_category NOT NULL DEFAULT 'fitness',
    type goal_type NOT NULL,
    target_value DECIMAL(10,2),
    target_unit VARCHAR(50),
    current_value DECIMAL(10,2) DEFAULT 0,
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE NOT NULL,
    status goal_status DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create goal completions table  
CREATE TABLE public.goal_completions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    completion_date DATE NOT NULL DEFAULT CURRENT_DATE,
    value_achieved DECIMAL(10,2),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create unique index
CREATE UNIQUE INDEX idx_goal_completions_unique 
ON public.goal_completions(goal_id, completion_date);

-- Step 3: Enable RLS and create policies
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_completions ENABLE ROW LEVEL SECURITY;

-- Goals policies
CREATE POLICY "Users can view own goals" ON public.goals
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goals" ON public.goals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals" ON public.goals
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own goals" ON public.goals
    FOR DELETE USING (auth.uid() = user_id);

-- Goal completions policies
CREATE POLICY "Users can view own goal completions" ON public.goal_completions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goal completions" ON public.goal_completions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goal completions" ON public.goal_completions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own goal completions" ON public.goal_completions
    FOR DELETE USING (auth.uid() = user_id);

-- Step 4: Create triggers for automatic current_value update
CREATE OR REPLACE FUNCTION update_goal_current_value()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.goals 
    SET current_value = (
        SELECT COALESCE(SUM(value_achieved), 0)
        FROM public.goal_completions 
        WHERE goal_id = NEW.goal_id
    ),
    updated_at = NOW()
    WHERE id = NEW.goal_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_goal_current_value
    AFTER INSERT OR UPDATE OR DELETE ON public.goal_completions
    FOR EACH ROW
    EXECUTE FUNCTION update_goal_current_value();

-- Status update trigger
CREATE OR REPLACE FUNCTION update_goal_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if goal target is reached
    IF NEW.current_value >= NEW.target_value AND NEW.target_value > 0 THEN
        NEW.status = 'completed';
    END IF;
    
    -- Update timestamp
    NEW.updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_goal_status
    BEFORE UPDATE ON public.goals
    FOR EACH ROW
    EXECUTE FUNCTION update_goal_status();

-- Verification
SELECT 'Goals database setup completed successfully!' as status;

-- Show table structure
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('goals', 'goal_completions')
ORDER BY table_name, ordinal_position;
