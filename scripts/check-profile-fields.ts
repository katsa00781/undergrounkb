// Script to check profile table columns
import { supabase } from '../src/config/supabase';

const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const BLUE = '\x1b[34m';
const RESET = '\x1b[0m';

async function checkProfileColumns() {
  console.log(`${BLUE}Checking columns in profiles table...${RESET}`);
  
  try {
    // First check if we can access the profiles table at all
    console.log(`${YELLOW}Querying profiles table structure...${RESET}`);
    
    // Query to get column information
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
      
    if (error) {
      console.error(`${RED}Error accessing profiles table:${RESET}`, error.message);
      return;
    }
    
    console.log(`${GREEN}Successfully accessed profiles table${RESET}`);
    
    // Get a sample profile to check fields
    let sampleProfile = data && data.length > 0 ? data[0] : null;
    
    if (!sampleProfile) {
      console.log(`${YELLOW}No profiles found, creating a test profile...${RESET}`);
      
      // Insert a test profile to check structure
      const testUserId = 'test-' + Math.random().toString(36).substring(2, 15);
      
      const { data: testProfile, error: insertError } = await supabase
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
        
      if (insertError) {
        console.error(`${RED}Error creating test profile:${RESET}`, insertError.message);
        return;
      }
      
      console.log(`${GREEN}Created test profile successfully${RESET}`);
      
      // Use the test profile as our sample
      sampleProfile = testProfile[0];
      
      // Clean up the test profile
      await supabase
        .from('profiles')
        .delete()
        .eq('id', testUserId);
    }
    
    // Check for the expected fields
    console.log(`${BLUE}Checking profiles table columns:${RESET}`);
    
    const requiredColumns = [
      { name: 'id', exists: 'id' in sampleProfile },
      { name: 'email', exists: 'email' in sampleProfile },
      { name: 'first_name', exists: 'first_name' in sampleProfile },
      { name: 'last_name', exists: 'last_name' in sampleProfile },
      { name: 'height', exists: 'height' in sampleProfile },
      { name: 'weight', exists: 'weight' in sampleProfile },
      { name: 'birthdate', exists: 'birthdate' in sampleProfile },
      { name: 'gender', exists: 'gender' in sampleProfile },
      { name: 'fitness_goals', exists: 'fitness_goals' in sampleProfile },
      { name: 'experience_level', exists: 'experience_level' in sampleProfile }
    ];
    
    const missingColumns = requiredColumns.filter(col => !col.exists);
    
    if (missingColumns.length === 0) {
      console.log(`${GREEN}All required columns exist in the profiles table${RESET}`);
    } else {
      console.log(`${RED}Missing columns in profiles table:${RESET}`);
      missingColumns.forEach(col => {
        console.log(`${RED}- ${col.name}${RESET}`);
      });
      console.log(`${YELLOW}Please run the apply-profile-migration.sh script to add these columns${RESET}`);
    }
    
    console.log(`${BLUE}Profile columns check completed${RESET}`);
  } catch (error) {
    console.error(`${RED}Exception in checkProfileColumns:${RESET}`, error);
  }
}

checkProfileColumns()
  .then(() => {
    console.log(`${GREEN}Script completed${RESET}`);
    process.exit(0);
  })
  .catch(error => {
    console.error(`${RED}Script failed:${RESET}`, error);
    process.exit(1);
  });
