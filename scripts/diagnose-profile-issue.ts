/**
 * This script diagnoses and fixes common issues with the profile system
 * It checks for:
 * 1. Missing database columns
 * 2. Schema cache issues
 * 3. Type mismatches between the database and application
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { execSync } from 'child_process';
import type { Database } from '../src/types/supabase';
import path from 'path';

// Load environment variables
dotenv.config();

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials! Check your .env file.');
  process.exit(1);
}

// Create a fresh Supabase client (without cache)
const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
});

// The columns that should be in the profiles table
const EXPECTED_COLUMNS = [
  'id', 
  'email', 
  'first_name', 
  'last_name',
  'height',
  'weight',
  'birthdate',
  'gender',
  'fitness_goals',
  'experience_level'
];

/**
 * Applies the SQL migration to add profile fields
 */
async function applyProfileMigration() {
  console.log('🔄 Applying profile migration...');
  
  try {
    const scriptPath = path.join(process.cwd(), 'fix-profile-columns.sh');
    execSync(`bash ${scriptPath}`, { stdio: 'inherit' });
    console.log('✅ Migration script executed successfully!');
    return true;
  } catch (error) {
    console.error('❌ Failed to execute migration script:', error);
    return false;
  }
}

/**
 * Check if the fitness_goals column accepts arrays
 */
async function testArrayColumn() {
  console.log('🔍 Testing array column functionality...');
  
  try {
    const testData = ['Strength', 'Flexibility'];
    
    // Try to upsert a test profile with an array value
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: '00000000-0000-0000-0000-000000000000', // Test ID
        fitness_goals: testData
      })
      .select('fitness_goals');
    
    if (error) {
      console.error('❌ Failed to test array column:', error.message);
      return false;
    }
    
    console.log('✅ Successfully stored array data in the fitness_goals column');
    console.log('📊 Test data:', data);
    
    return true;
  } catch (err) {
    console.error('❌ Error testing array column:', err);
    return false;
  }
}

/**
 * Diagnoses common profile issues
 */
async function diagnoseProfileIssues() {
  console.log('🔎 Diagnosing profile system issues...');
  let hasIssues = false;
  
  // 1. Check if we can access the profiles table at all
  console.log('🔍 Checking if profiles table exists...');
  try {
    const { error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('❌ Cannot access profiles table:', error.message);
      hasIssues = true;
      return;
    }
    console.log('✅ Profiles table exists and is accessible');
  } catch (err) {
    console.error('❌ Error accessing profiles table:', err);
    hasIssues = true;
    return;
  }
  
  // 2. Check for each expected column
  console.log('🔍 Checking for expected columns...');
  const missingColumns: string[] = [];
  
  for (const column of EXPECTED_COLUMNS) {
    try {
      const { error } = await supabase
        .from('profiles')
        .select(column)
        .limit(1);
      
      if (error && error.message.includes('does not exist')) {
        console.error(`❌ Column '${column}' is missing`);
        missingColumns.push(column);
        hasIssues = true;
      } else if (error) {
        console.warn(`⚠️ Error checking column '${column}':`, error.message);
      } else {
        console.log(`✅ Column '${column}' exists`);
      }
    } catch (err) {
      console.error(`❌ Error checking column '${column}':`, err);
    }
  }
  
  if (missingColumns.length > 0) {
    console.error('❌ Missing columns:', missingColumns.join(', '));
    
    // Apply profile migration if needed
    console.log('🛠️ Attempting to fix missing columns...');
    if (await applyProfileMigration()) {
      console.log('✅ Migration applied successfully!');
      // Verify columns were added
      const stillMissing: string[] = [];
      for (const column of missingColumns) {
        try {
          const { error } = await supabase
            .from('profiles')
            .select(column)
            .limit(1);
          
          if (error && error.message.includes('does not exist')) {
            stillMissing.push(column);
          }
        } catch {
          stillMissing.push(column);
        }
      }
      
      if (stillMissing.length > 0) {
        console.error('❌ Still missing columns after migration:', stillMissing.join(', '));
        hasIssues = true;
      } else {
        console.log('✅ All columns fixed successfully!');
      }
    } else {
      console.error('❌ Failed to fix columns through migration');
      hasIssues = true;
    }
  } else {
    console.log('✅ All expected columns exist');
  }
  
  // 3. Check if fitness_goals column accepts arrays
  if (!await testArrayColumn()) {
    console.error('❌ The fitness_goals column has issues with array data');
    hasIssues = true;
  } else {
    console.log('✅ The fitness_goals column works correctly with arrays');
  }
  
  // Final verdict
  if (hasIssues) {
    console.error('❌ Issues were detected in the profile system');
    console.log('🛠️ Please check the errors above and fix them manually if automatic fixes failed');
  } else {
    console.log('✅ No issues detected in the profile system!');
    console.log('🎉 Your application should work correctly now');
  }
}

// Run the diagnostics
diagnoseProfileIssues()
  .catch(err => {
    console.error('❌ Uncaught error during diagnosis:', err);
    process.exit(1);
  });
