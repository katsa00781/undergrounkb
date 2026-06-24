-- Debug script to check goals table structure

-- Check if the goals table exists
SELECT table_name, table_schema 
FROM information_schema.tables 
WHERE table_name = 'goals';

-- Check the columns of the goals table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'goals' 
ORDER BY ordinal_position;

-- Check if custom types exist
SELECT typname, typtype
FROM pg_type 
WHERE typname IN ('goal_type', 'goal_category', 'goal_status');

-- Test if we can select from goals table
SELECT COUNT(*) as goal_count FROM public.goals;
