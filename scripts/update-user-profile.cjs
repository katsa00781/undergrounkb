// Script to update a user profile with name information
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

// Get command line arguments
const userId = process.argv[2];
const firstName = process.argv[3];
const lastName = process.argv[4];

// Check if required arguments are provided
if (!userId) {
  console.error(`${RED}Error: User ID not provided${RESET}`);
  console.log(`Usage: node update-user-profile.cjs <userId> [firstName] [lastName]`);
  process.exit(1);
}

async function getUserProfiles() {
  try {
    console.log(`${BLUE}Fetching all user profiles...${RESET}`);
    
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, first_name, last_name')
      .order('email');
      
    if (error) {
      console.error(`${RED}Error fetching profiles:${RESET}`, error.message);
      return [];
    }
    
    console.log(`${GREEN}Found ${data.length} profiles${RESET}`);
    
    // Print the profiles
    data.forEach((profile, index) => {
      console.log(`${index + 1}. ID: ${profile.id}`);
      console.log(`   Email: ${profile.email || 'No email'}`);
      console.log(`   Name: ${profile.first_name || ''} ${profile.last_name || ''}`);
      console.log('---');
    });
    
    return data;
  } catch (error) {
    console.error(`${RED}Exception fetching profiles:${RESET}`, error);
    return [];
  }
}

async function updateUserProfile(userId, firstName, lastName) {
  try {
    console.log(`${BLUE}Updating user profile with ID: ${userId}${RESET}`);
    
    // Fetch current profile
    const { data: currentProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('id, email, first_name, last_name')
      .eq('id', userId)
      .maybeSingle();
      
    if (fetchError) {
      console.error(`${RED}Error fetching profile:${RESET}`, fetchError.message);
      return false;
    }
    
    if (!currentProfile) {
      console.error(`${RED}No profile found with ID: ${userId}${RESET}`);
      return false;
    }
    
    console.log(`${YELLOW}Current profile:${RESET}`);
    console.log(`- Email: ${currentProfile.email || 'No email'}`);
    console.log(`- First name: ${currentProfile.first_name || 'None'}`);
    console.log(`- Last name: ${currentProfile.last_name || 'None'}`);
    
    // Update profile
    const updateData = {};
    if (firstName !== undefined) updateData.first_name = firstName;
    if (lastName !== undefined) updateData.last_name = lastName;
    
    // Only update if we have new data
    if (Object.keys(updateData).length === 0) {
      console.log(`${YELLOW}No changes requested. Profile not updated.${RESET}`);
      return true;
    }
    
    const { data, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();
      
    if (error) {
      console.error(`${RED}Error updating profile:${RESET}`, error.message);
      return false;
    }
    
    console.log(`${GREEN}Profile updated successfully!${RESET}`);
    console.log(`${YELLOW}Updated profile:${RESET}`);
    console.log(`- Email: ${data.email || 'No email'}`);
    console.log(`- First name: ${data.first_name || 'None'}`);
    console.log(`- Last name: ${data.last_name || 'None'}`);
    return true;
  } catch (error) {
    console.error(`${RED}Exception updating profile:${RESET}`, error);
    return false;
  }
}

// Main function
async function main() {
  if (userId === 'list') {
    // List all profiles
    await getUserProfiles();
  } else {
    // Update specific profile
    await updateUserProfile(userId, firstName, lastName);
  }
}

main()
  .catch(error => console.error(`${RED}Error:${RESET}`, error))
  .finally(() => process.exit(0));
