// More detailed profile check
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Setup supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
  try {
    // Get column information from database
    console.log('Querying database schema information...');
    
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'profiles'
        ORDER BY ordinal_position
      `
    });
    
    if (error) {
      console.error('Error querying database schema:', error);
      return;
    }
    
    console.log('Profiles table columns:');
    console.log(data);
    
    // Try directly adding columns if they don't exist
    console.log('\nAttempting to add missing columns directly...');
    
    const migrationSQL = `
      ALTER TABLE IF EXISTS public.profiles
      ADD COLUMN IF NOT EXISTS first_name text,
      ADD COLUMN IF NOT EXISTS last_name text,
      ADD COLUMN IF NOT EXISTS height numeric,
      ADD COLUMN IF NOT EXISTS weight numeric,
      ADD COLUMN IF NOT EXISTS birthdate date,
      ADD COLUMN IF NOT EXISTS gender text,
      ADD COLUMN IF NOT EXISTS fitness_goals text[],
      ADD COLUMN IF NOT EXISTS experience_level text;
    `;
    
    const { data: migrationResult, error: migrationError } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    });
    
    if (migrationError) {
      console.error('Error running migration:', migrationError);
    } else {
      console.log('Migration executed:', migrationResult);
      
      // Check if columns were added
      const { data: newColumns, error: checkError } = await supabase.rpc('exec_sql', {
        sql: `
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns
          WHERE table_schema = 'public'
          AND table_name = 'profiles'
          ORDER BY ordinal_position
        `
      });
      
      if (checkError) {
        console.error('Error checking new columns:', checkError);
      } else {
        console.log('\nUpdated profiles table columns:');
        console.log(newColumns);
      }
    }
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

checkColumns();
