// Test script for profile display functionality
import { supabase } from '../src/config/supabase';


// Log with colors for clarity
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const BLUE = '\x1b[34m';
const RESET = '\x1b[0m';

async function testProfileDisplay() {
  console.log(`${BLUE}Testing profile display functionality...${RESET}`);
  
  try {
    // Create a test user profile
    const testUserId = 'test-' + Math.random().toString(36).substring(2, 15);
    
    console.log(`${BLUE}Creating test profile with ID: ${testUserId}...${RESET}`);
    
    // Insert a test profile
    const { data: testProfile, error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: testUserId,
        email: 'test-profile-display@example.com',
        first_name: 'Test',
        last_name: 'User',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select();
      
    if (insertError) {
      console.error(`${RED}Error creating test profile:${RESET}`, insertError.message);
      return;
    }
    
    console.log(`${GREEN}Test profile created successfully${RESET}`, testProfile[0]);
    
    // Simulate userProfile transformation as in useProfileProvider
    const profile = testProfile[0];
    
    // First implementation (before fix - using email fallback)
    const oldUserProfile = {
      displayName: 
        profile.first_name && profile.last_name 
          ? `${profile.first_name} ${profile.last_name}` 
          : ((profile.first_name as string | null) || (profile.email as string | null) || ''),
    };
    
    // New implementation (after fix - not using email fallback)
    const newUserProfile = {
      displayName: 
        profile.first_name && profile.last_name 
          ? `${profile.first_name} ${profile.last_name}` 
          : ((profile.first_name as string | null) || ''),
    };
    
    console.log(`${BLUE}Before fix (with email fallback):${RESET}`, oldUserProfile);
    console.log(`${BLUE}After fix (without email fallback):${RESET}`, newUserProfile);
    
    // Delete the test profile
    const { error: deleteError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', testUserId);
      
    if (deleteError) {
      console.error(`${RED}Error deleting test profile:${RESET}`, deleteError.message);
      return;
    }
    
    console.log(`${GREEN}Test profile deleted successfully${RESET}`);
    console.log(`${GREEN}Test completed successfully!${RESET}`);
  } catch (error) {
    console.error(`${RED}Test failed with error:${RESET}`, error);
  }
}

// Run the test
testProfileDisplay();
