// Test script to validate the profile update functionality
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import type { Database } from '../src/types/supabase';

// Load environment variables
dotenv.config();

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('\x1b[31m❌ Missing Supabase credentials! Check your .env file.\x1b[0m');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient<Database>(supabaseUrl, supabaseKey);

// ANSI color codes for formatting console output
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const RESET = '\x1b[0m';
const BLUE = '\x1b[34m';

/**
 * Test the profile update functionality by:
 * 1. Finding a test user or creating one
 * 2. Updating various profile fields
 * 3. Verifying the updates were saved correctly
 */
async function testProfileUpdates() {
  console.log(`${BLUE}Testing profile update functionality...${RESET}`);
  
  try {
    // 1. Find a test user or create one
    let testUserId = '';
    
    // First check if we have a test user
    const { data: existingUsers, error: searchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'test@example.com');
    
    if (searchError) {
      console.error(`${RED}Error searching for test user:${RESET}`, searchError.message);
      return false;
    }
    
    if (existingUsers && existingUsers.length > 0) {
      const existingUser = existingUsers[0];
      testUserId = existingUser.id;
      console.log(`${GREEN}Found existing test user:${RESET}`, testUserId);
    } else {
      // Create a test user
      testUserId = 'test-' + Math.random().toString(36).substring(2, 15);
      
      const { data: newUser, error: createError } = await supabase
        .from('profiles')
        .insert([{
          id: testUserId,
          email: 'test@example.com',
          first_name: 'Test',
          last_name: 'User',
          role: 'user',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select();
        
      if (createError) {
        console.error(`${RED}Error creating test user:${RESET}`, createError.message);
        return false;
      }
      
      if (newUser && newUser.length > 0) {
        testUserId = newUser[0].id;
      }
      console.log(`${GREEN}Created new test user:${RESET}`, testUserId);
    }
    
    // 2. Update profile with form data
    console.log(`${BLUE}Updating profile with test data...${RESET}`);
    const testData = {
      first_name: 'Updated',
      last_name: 'User',
      height: 180,
      weight: 75,
      birthdate: '1990-01-01',
      gender: 'male',
      fitness_goals: ['Strength', 'Flexibility'],
      experience_level: 'intermediate'
    };
    
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update(testData)
      .eq('id', testUserId)
      .select();
      
    if (updateError) {
      if (updateError.message.includes('column') && updateError.message.includes('does not exist')) {
        console.error(`${YELLOW}Database schema issue:${RESET}`, updateError.message);
        console.log(`${YELLOW}Please run the migration script to add missing columns.${RESET}`);
        return false;
      } else {
        console.error(`${RED}Error updating profile:${RESET}`, updateError.message);
        return false;
      }
    }
    
    // 3. Verify the updates
    if (!updatedProfile || updatedProfile.length === 0) {
      console.error(`${RED}Failed to get updated profile${RESET}`);
      return false;
    }
    
    const profile = updatedProfile[0];
    console.log(`${GREEN}Successfully updated profile:${RESET}`);
    console.log(`  ${BLUE}Name:${RESET} ${profile.first_name} ${profile.last_name}`);
    
    // Check each field - different handling for fields that might not exist in the schema
    const fieldsToCheck = [
      { name: 'height', value: profile.height, expected: testData.height },
      { name: 'weight', value: profile.weight, expected: testData.weight },
      { name: 'birthdate', value: profile.birthdate, expected: testData.birthdate },
      { name: 'gender', value: profile.gender, expected: testData.gender },
      { name: 'fitness_goals', value: profile.fitness_goals, expected: testData.fitness_goals },
      { name: 'experience_level', value: profile.experience_level, expected: testData.experience_level }
    ];
    
    const missingFields: string[] = [];
    const mismatchFields: string[] = [];
    
    fieldsToCheck.forEach(field => {
      if (field.value === undefined) {
        missingFields.push(field.name);
      } else if (JSON.stringify(field.value) !== JSON.stringify(field.expected)) {
        mismatchFields.push(`${field.name} (got: ${field.value}, expected: ${field.expected})`);
      } else {
        console.log(`  ${GREEN}✓ ${field.name}:${RESET} ${field.value}`);
      }
    });
    
    if (missingFields.length > 0) {
      console.log(`${YELLOW}Missing fields in database schema:${RESET} ${missingFields.join(', ')}`);
    }
    
    if (mismatchFields.length > 0) {
      console.log(`${RED}Field value mismatches:${RESET} ${mismatchFields.join(', ')}`);
      return false;
    }
    
    return missingFields.length === 0;
  } catch (error) {
    console.error(`${RED}Exception in testProfileUpdates:${RESET}`, error);
    return false;
  }
}

// Run the test
testProfileUpdates()
  .then(success => {
    if (success) {
      console.log(`${GREEN}✅ Profile update functionality is working correctly!${RESET}`);
      console.log(`${GREEN}The User Profile form should now be saving data to the database.${RESET}`);
    } else {
      console.log(`${YELLOW}⚠️ Profile update test completed with warnings or errors.${RESET}`);
      console.log(`${YELLOW}Check the messages above for details and fix as needed.${RESET}`);
    }
    process.exit(0);
  })
  .catch(error => {
    console.error(`${RED}Test script failed with an exception:${RESET}`, error);
    process.exit(1);
  });
