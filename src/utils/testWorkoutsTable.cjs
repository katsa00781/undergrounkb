// A CommonJS script to check if the workouts table exists
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env file
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
    const { data, error: sessionError } = await supabase.auth.getSession();
    
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
CREATE TABLE public.workouts (
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
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;

-- Policy for users to see only their own workouts
CREATE POLICY "Users can view their own workouts" 
  ON public.workouts FOR SELECT 
  USING (auth.uid() = user_id);

-- Policy for users to insert their own workouts
CREATE POLICY "Users can insert their own workouts" 
  ON public.workouts FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Policy for users to update their own workouts
CREATE POLICY "Users can update their own workouts" 
  ON public.workouts FOR UPDATE 
  USING (auth.uid() = user_id);

-- Policy for users to delete their own workouts
CREATE POLICY "Users can delete their own workouts" 
  ON public.workouts FOR DELETE 
  USING (auth.uid() = user_id);
`);
      
      // Create a migration file for the workouts table
      const migrationContent = `-- Create workouts table
CREATE TABLE public.workouts (
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
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;

-- Policy for users to see only their own workouts
CREATE POLICY "Users can view their own workouts" 
  ON public.workouts FOR SELECT 
  USING (auth.uid() = user_id);

-- Policy for users to insert their own workouts
CREATE POLICY "Users can insert their own workouts" 
  ON public.workouts FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Policy for users to update their own workouts
CREATE POLICY "Users can update their own workouts" 
  ON public.workouts FOR UPDATE 
  USING (auth.uid() = user_id);

-- Policy for users to delete their own workouts
CREATE POLICY "Users can delete their own workouts" 
  ON public.workouts FOR DELETE 
  USING (auth.uid() = user_id);
`;

      const today = new Date();
      const timestamp = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}${String(today.getHours()).padStart(2, '0')}${String(today.getMinutes()).padStart(2, '0')}00`;
      const migrationFileName = `${timestamp}_create_workouts_table.sql`;
      const migrationPath = path.join(__dirname, '../../supabase/migrations', migrationFileName);
      const allMigrationsPath = path.join(__dirname, '../../backup/all_migrations', migrationFileName);
      
      try {
        // Ensure directories exist
        if (!fs.existsSync(path.dirname(migrationPath))) {
          fs.mkdirSync(path.dirname(migrationPath), { recursive: true });
        }
        if (!fs.existsSync(path.dirname(allMigrationsPath))) {
          fs.mkdirSync(path.dirname(allMigrationsPath), { recursive: true });
        }
        
        // Write migration files
        fs.writeFileSync(migrationPath, migrationContent);
        fs.writeFileSync(allMigrationsPath, migrationContent);
        
        console.log(`\n✅ Migration file created: ${migrationPath}`);
        console.log(`✅ Backup migration file created: ${allMigrationsPath}`);
        console.log("\nYou can now run this migration against your Supabase project using the Supabase CLI:");
        console.log("\nsupabase db push");
        console.log("\nOr apply it manually through the Supabase dashboard SQL editor.");
      } catch (err) {
        console.error('❌ Error creating migration file:', err);
      }
      
      return;
    }
    
    console.log('✅ Workouts table exists!');
    
    // Check if there are any workouts
    const { data: workoutsList, error: listError } = await supabase
      .from('workouts')
      .select('*')
      .limit(5);
    
    if (listError) {
      console.error('❌ Error getting workouts list:', listError);
    } else {
      console.log(`Found ${workoutsList ? workoutsList.length : 0} workouts in the database.`);
      if (workoutsList && workoutsList.length > 0) {
        console.log('Example workout:');
        console.log(JSON.stringify(workoutsList[0], null, 2));
      } else {
        console.log('No workouts found. This is expected if you haven\'t created any workouts yet.');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testWorkoutsTable();
