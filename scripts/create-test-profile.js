// Create a test profile with all fields populated
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Setup supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestProfile() {
  try {
    console.log('Creating test profile with all fields...');
    
    // Generate random ID and timestamp
    const randomId = 'test-' + Date.now() + '-' + Math.random().toString(36).substring(2, 10);
    const timestamp = new Date().toISOString();
    
    // Create test profile with all fields filled
    const testProfile = {
      id: randomId,
      email: 'test-profile@example.com',
      first_name: 'Test',
      last_name: 'User',
      role: 'user',
      height: 180,
      weight: 75,
      birthdate: '1990-01-01',
      gender: 'male',
      fitness_goals: ['Strength', 'Endurance'],
      experience_level: 'intermediate',
      created_at: timestamp,
      updated_at: timestamp
    };
    
    console.log('Inserting test profile with data:', testProfile);
    
    // Add the profile directly to the database
    const { data, error } = await supabase
      .from('profiles')
      .insert([testProfile])
      .select();
    
    if (error) {
      console.error('Error creating test profile:', error);
      return;
    }
    
    console.log('Test profile created successfully:', data);
    
    // Now try to fetch the profile to confirm it exists
    const { data: fetchedProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', randomId)
      .single();
    
    if (fetchError) {
      console.error('Error fetching the created profile:', fetchError);
      return;
    }
    
    console.log('Successfully fetched profile:');
    console.log(fetchedProfile);
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

createTestProfile();
