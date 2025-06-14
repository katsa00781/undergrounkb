// Test script to directly run SQL on the profiles table
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// ANSI color codes for formatting console output
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const RESET = '\x1b[0m';
const BLUE = '\x1b[34m';

// Get Supabase URL and key from environment
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(`${RED}Error: Supabase URL or key not found in environment variables${RESET}`);
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function runProfileTest() {
  try {
    console.log(`${BLUE}Testing profile table structure...${RESET}`);
    
    // Try to create a test profile with all the fields we need
    const testUserId = 'test-' + Math.random().toString(36).substring(2, 15);
    
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: testUserId,
        email: 'test-profile-check@example.com',
        first_name: 'Test',
        last_name: 'User',
        height: 175,
        weight: 70,
        birthdate: new Date().toISOString().split('T')[0],
        gender: 'other',
        fitness_goals: ['Strength', 'Flexibility'],
        experience_level: 'intermediate'
      })
      .select();
      
    if (error) {
      if (error.message.includes('column "height" of relation "profiles" does not exist')) {
        console.error(`${RED}Column 'height' does not exist. Profile table needs updating.${RESET}`);
        console.log(`${YELLOW}Please run the SQL migration to add missing columns.${RESET}`);
        return false;
      } else if (error.message.includes('column "weight" of relation "profiles" does not exist')) {
        console.error(`${RED}Column 'weight' does not exist. Profile table needs updating.${RESET}`);
        console.log(`${YELLOW}Please run the SQL migration to add missing columns.${RESET}`);
        return false;
      } else {
        console.error(`${RED}Error creating test profile:${RESET}`, error.message);
        return false;
      }
    }
    
    console.log(`${GREEN}Successfully created test profile with all required fields!${RESET}`);
    console.log(`${BLUE}Profile data:${RESET}`, data);
    
    // Clean up the test profile
    const { error: deleteError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', testUserId);
      
    if (deleteError) {
      console.error(`${YELLOW}Warning: Could not delete test profile:${RESET}`, deleteError.message);
    } else {
      console.log(`${GREEN}Successfully cleaned up test profile${RESET}`);
    }
    
    return true;
  } catch (error) {
    console.error(`${RED}Exception in runProfileTest:${RESET}`, error);
    return false;
  }
}

// Run the test
runProfileTest()
  .then(success => {
    if (success) {
      console.log(`${GREEN}✅ Profile table has all required fields for the profile page!${RESET}`);
    } else {
      console.log(`${RED}❌ Profile table is missing required fields!${RESET}`);
      console.log(`${YELLOW}To fix, run the following SQL:${RESET}`);
      console.log(`
ALTER TABLE IF EXISTS public.profiles
ADD COLUMN IF NOT EXISTS height numeric,
ADD COLUMN IF NOT EXISTS weight numeric,
ADD COLUMN IF NOT EXISTS birthdate date,
ADD COLUMN IF NOT EXISTS gender text,
ADD COLUMN IF NOT EXISTS fitness_goals text[],
ADD COLUMN IF NOT EXISTS experience_level text;
      `);
    }
    process.exit(success ? 0 : 1);
  });
