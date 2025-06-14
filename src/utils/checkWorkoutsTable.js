// Simple script to check if the workouts table exists
import { createClient } from '@supabase/supabase-js';

// ANSI color codes
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const RESET = '\x1b[0m';

async function checkWorkoutsTable() {
  // Get Supabase URL and key from environment
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error(`${RED}Error: Supabase URL or key not found in environment variables${RESET}`);
    return false;
  }

  // Create Supabase client
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    console.log('Checking if workouts table exists...');
    
    // Try to query the workouts table
    const { data, error } = await supabase
      .from('workouts')
      .select('count')
      .limit(1);
      
    if (error) {
      console.error(`${RED}❌ Workouts table check failed:${RESET}`, error);
      return false;
    }
    
    console.log(`${GREEN}✅ Workouts table exists${RESET}`);
    return true;
  } catch (err) {
    console.error(`${RED}❌ Error checking workouts table:${RESET}`, err);
    return false;
  }
}

checkWorkoutsTable().then(result => {
  if (!result) {
    console.log('\nIt looks like the workouts table might not exist in your database.');
    console.log('You need to create this table in your Supabase project.');
    console.log('\nTable structure based on the Workout interface:');
    console.log(`
CREATE TABLE workouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  date DATE NOT NULL,
  duration INTEGER NOT NULL,
  notes TEXT,
  sections JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Add RLS policies
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;

-- Policy for users to see only their own workouts
CREATE POLICY "Users can view their own workouts" 
  ON workouts FOR SELECT 
  USING (auth.uid() = user_id);

-- Policy for users to insert their own workouts
CREATE POLICY "Users can insert their own workouts" 
  ON workouts FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Policy for users to update their own workouts
CREATE POLICY "Users can update their own workouts" 
  ON workouts FOR UPDATE 
  USING (auth.uid() = user_id);

-- Policy for users to delete their own workouts
CREATE POLICY "Users can delete their own workouts" 
  ON workouts FOR DELETE 
  USING (auth.uid() = user_id);
`);
  }
});
