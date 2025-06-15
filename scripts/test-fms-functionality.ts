// Run this script to test FMS assessment functionality
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Sample FMS assessment data
const sampleAssessment = {
  user_id: '00000000-0000-0000-0000-000000000000', // You'll need to replace this with a valid user ID
  date: new Date().toISOString().split('T')[0],
  deep_squat: 2,
  hurdle_step: 2, 
  inline_lunge: 2,
  shoulder_mobility: 2,
  active_straight_leg_raise: 2,
  trunk_stability_pushup: 2,
  rotary_stability: 2,
  notes: 'Test assessment created via script'
};

async function getAllUsers() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .limit(1);
    
  if (error) {
    throw new Error(`Error fetching users: ${error.message}`);
  }
  
  if (!data || data.length === 0) {
    throw new Error('No users found in the database');
  }
  
  return data;
}

async function testFmsAssessmentCreation() {
  console.log('🧪 Testing FMS assessment creation...');
  
  try {
    // Get a valid user ID
    const users = await getAllUsers();
    console.log(`Found ${users.length} users, using first one for test`);
    
    // Use the first user's ID for our test
    const testData = { 
      ...sampleAssessment,
      user_id: users[0].id
    };
    console.log('Test data:', testData);
    
    // Create the assessment
    const { data, error } = await supabase
      .from('fms_assessments')
      .insert(testData)
      .select()
      .single();
      
    if (error) {
      throw new Error(`Error creating assessment: ${error.message}`);
    }
    
    console.log('✅ Successfully created test assessment:', data);
    return data;
  } catch (e) {
    console.error('❌ Test failed:', e);
    throw e;
  }
}

async function testFmsAssessmentRetrieval(userId) {
  console.log('🧪 Testing FMS assessment retrieval...');
  
  try {
    const { data, error } = await supabase
      .from('fms_assessments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
      
    if (error) {
      throw new Error(`Error retrieving assessments: ${error.message}`);
    }
    
    console.log(`✅ Retrieved ${data.length} assessments for user`);
    console.table(data.map(a => ({ 
      id: a.id,
      date: a.date,
      total_score: a.total_score,
      created_at: a.created_at
    })));
    
    return data;
  } catch (e) {
    console.error('❌ Test failed:', e);
    throw e;
  }
}

async function runTests() {
  try {
    const assessment = await testFmsAssessmentCreation();
    await testFmsAssessmentRetrieval(assessment.user_id);
    console.log('✅ All tests passed!');
  } catch (e) {
    console.error('❌ Tests failed:', e);
  }
}

runTests()
  .catch(console.error)
  .finally(() => {
    console.log('Testing completed');
    process.exit(0);
  });
