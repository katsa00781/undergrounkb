// test-workouts-table.js
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Read the .env file
dotenv.config();

async function testWorkoutsTable() {
  // Get Supabase credentials
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Supabase URL or key not found in environment variables');
    console.error('Make sure you have a .env file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
    return;
  }

  console.log('Supabase URL:', supabaseUrl);
  console.log('Testing connection to Supabase...');
  
  // Create Supabase client
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // Test connection
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Supabase connection failed:', sessionError);
      return;
    }
    
    console.log('✅ Connected to Supabase successfully');
    
    // Check if workouts table exists
    console.log('\nChecking workouts table...');
    const { data: workoutsData, error: workoutsError } = await supabase
      .from('workouts')
      .select('count')
      .limit(1);
    
    if (workoutsError) {
      console.error('❌ Workouts table check failed:', workoutsError);
      
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
      return;
    }
    
    console.log('✅ Workouts table exists');
    
    // Check if there are workouts
    const { data: workoutsCount, error: countError } = await supabase
      .from('workouts')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('❌ Error getting workouts count:', countError);
      return;
    }
    
    const count = workoutsCount.count || 0;
    console.log(`There are ${count} workouts in the database`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testWorkoutsTable();
