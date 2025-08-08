-- Test script to create goal tables
-- First let's just test if we can connect and create simple table

-- Drop existing types if they exist
DROP TYPE IF EXISTS goal_type CASCADE;
DROP TYPE IF EXISTS goal_category CASCADE;  
DROP TYPE IF EXISTS goal_status CASCADE;

-- Create enums
CREATE TYPE goal_type AS ENUM ('daily', 'weekly', 'monthly', 'quarterly', 'yearly');
CREATE TYPE goal_category AS ENUM ('fitness', 'nutrition', 'health', 'lifestyle', 'personal');
CREATE TYPE goal_status AS ENUM ('active', 'completed', 'paused', 'cancelled');

-- Test query
SELECT 'Types created successfully' as status;
