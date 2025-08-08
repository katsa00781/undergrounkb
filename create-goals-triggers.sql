-- Create trigger functions for goals

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for goals table
CREATE TRIGGER update_goals_updated_at 
    BEFORE UPDATE ON public.goals 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Goal status auto-update function  
CREATE OR REPLACE FUNCTION update_goal_status()
RETURNS TRIGGER AS $$
BEGIN
    -- If goal expired, set to completed
    UPDATE public.goals 
    SET status = CASE 
        WHEN end_date < CURRENT_DATE AND status = 'active' THEN 'completed'
        ELSE status
    END
    WHERE id = NEW.goal_id;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for goal status updates
CREATE TRIGGER trigger_update_goal_status
    AFTER INSERT OR UPDATE ON public.goal_completions
    FOR EACH ROW EXECUTE PROCEDURE update_goal_status();

SELECT 'Triggers created successfully' as status;
