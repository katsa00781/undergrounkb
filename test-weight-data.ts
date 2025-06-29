import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://localhost:54321';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testWeightData() {
  console.log('Testing weight data...');
  
  try {
    // Get all users
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    if (usersError) {
      console.error('Error fetching users:', usersError);
      return;
    }
    
    console.log(`Found ${users.users.length} users`);
    
    if (users.users.length === 0) {
      console.log('No users found');
      return;
    }
    
    const firstUser = users.users[0];
    console.log('First user:', firstUser.email);
    
    // Check if user has weight data
    const { data: weights, error: weightsError } = await supabase
      .from('user_weights')
      .select('*')
      .eq('user_id', firstUser.id)
      .order('created_at', { ascending: false });
    
    if (weightsError) {
      console.error('Error fetching weights:', weightsError);
      return;
    }
    
    console.log(`Found ${weights.length} weight records for user ${firstUser.email}`);
    if (weights.length > 0) {
      console.log('Latest weight record:', weights[0]);
    }
    
    // If no weight data, create some test data
    if (weights.length === 0) {
      console.log('Creating test weight data...');
      const { data: newWeight, error: insertError } = await supabase
        .from('user_weights')
        .insert({
          user_id: firstUser.id,
          weight: 85.5,
          date: new Date().toISOString().split('T')[0],
        })
        .select()
        .single();
      
      if (insertError) {
        console.error('Error creating test weight:', insertError);
      } else {
        console.log('Created test weight:', newWeight);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testWeightData();
