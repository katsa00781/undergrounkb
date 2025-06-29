const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createTestData() {
  try {
    console.log('Checking existing users...');
    
    // Check if we have any users
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    if (usersError) {
      console.error('Error fetching users:', usersError);
      return;
    }
    
    console.log(`Found ${users.users.length} users`);
    
    if (users.users.length === 0) {
      console.log('No users found. Creating a test user...');
      
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: 'test@example.com',
        password: 'password123',
        email_confirm: true
      });
      
      if (createError) {
        console.error('Error creating user:', createError);
        return;
      }
      
      console.log('Test user created:', newUser.user.email);
      users.users.push(newUser.user);
    }
    
    const testUser = users.users[0];
    console.log('Using test user:', testUser.email);
    
    // Check if user has weight data
    const { data: weights, error: weightsError } = await supabase
      .from('user_weights')
      .select('*')
      .eq('user_id', testUser.id);
    
    if (weightsError) {
      console.error('Error fetching weights:', weightsError);
      return;
    }
    
    console.log(`Found ${weights.length} existing weight records`);
    
    if (weights.length === 0) {
      // Create some test weight data
      const testWeights = [
        { weight: 85.5, date: '2024-06-01' },
        { weight: 86.0, date: '2024-06-15' },
        { weight: 85.8, date: '2024-06-29' },
      ];
      
      console.log('Creating test weight data...');
      for (const weightData of testWeights) {
        const { data: newWeight, error: insertError } = await supabase
          .from('user_weights')
          .insert({
            user_id: testUser.id,
            weight: weightData.weight,
            date: weightData.date,
          })
          .select()
          .single();
        
        if (insertError) {
          console.error('Error creating weight:', insertError);
        } else {
          console.log(`Created weight record: ${newWeight.weight}kg on ${newWeight.date}`);
        }
      }
    }
    
    // Final check
    const { data: finalWeights, error: finalError } = await supabase
      .from('user_weights')
      .select('*')
      .eq('user_id', testUser.id)
      .order('created_at', { ascending: false });
    
    if (finalError) {
      console.error('Error in final check:', finalError);
    } else {
      console.log('\\nFinal weight data:');
      finalWeights.forEach(w => {
        console.log(`- ${w.weight}kg on ${w.date || w.created_at}`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

createTestData();
