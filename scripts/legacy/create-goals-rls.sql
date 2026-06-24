-- Enable RLS and create policies for goals tables

-- Drop existing policies if they exist (goals table)
DROP POLICY IF EXISTS "Users can view own goals" ON public.goals;
DROP POLICY IF EXISTS "Users can insert own goals" ON public.goals;
DROP POLICY IF EXISTS "Users can update own goals" ON public.goals;
DROP POLICY IF EXISTS "Users can delete own goals" ON public.goals;

-- Drop existing policies if they exist (goal_completions table)
DROP POLICY IF EXISTS "Users can view own goal completions" ON public.goal_completions;
DROP POLICY IF EXISTS "Users can insert own goal completions" ON public.goal_completions;
DROP POLICY IF EXISTS "Users can update own goal completions" ON public.goal_completions;
DROP POLICY IF EXISTS "Users can delete own goal completions" ON public.goal_completions;

-- Goals table policies
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

-- Users can only see/modify their own goals
CREATE POLICY "Users can view own goals" ON public.goals
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goals" ON public.goals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals" ON public.goals
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own goals" ON public.goals
    FOR DELETE USING (auth.uid() = user_id);

-- Goal completions table policies
ALTER TABLE public.goal_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own goal completions" ON public.goal_completions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goal completions" ON public.goal_completions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goal completions" ON public.goal_completions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own goal completions" ON public.goal_completions
    FOR DELETE USING (auth.uid() = user_id);

SELECT 'RLS policies created successfully' as status;
