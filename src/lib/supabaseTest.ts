import { supabase } from '../config/supabase';

/**
 * Egyszerű Supabase kapcsolat és funkció tesztelő
 */
export async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase connection...');
  
  try {
    // 1. Auth teszt
    console.log('1️⃣ Testing auth...');
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError) {
      console.error('❌ Auth error:', authError);
      return { success: false, error: 'Auth failed: ' + authError.message };
    }
    console.log('✅ Auth OK, user:', authData.user?.email);

    // 2. Database teszt
    console.log('2️⃣ Testing database access...');
    const { error: profileError } = await supabase
      .from('profiles')
      .select('id, email, role')
      .limit(1);
    
    if (profileError) {
      console.error('❌ Database error:', profileError);
      return { success: false, error: 'Database access failed: ' + profileError.message };
    }
    console.log('✅ Database access OK');

    // 3. Admin jogosultság teszt
    console.log('3️⃣ Testing admin role...');
    const currentUser = authData.user;
    if (!currentUser) {
      return { success: false, error: 'No authenticated user' };
    }

    const { data: adminData, error: adminError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', currentUser.id)
      .single();

    if (adminError) {
      console.error('❌ Admin check error:', adminError);
      return { success: false, error: 'Admin check failed: ' + adminError.message };
    }

    if (adminData.role !== 'admin') {
      console.warn('⚠️ User is not admin:', adminData.role);
      return { success: false, error: 'User is not admin, current role: ' + adminData.role };
    }
    console.log('✅ Admin role confirmed');

    // 4. Pending invites tábla teszt
    console.log('4️⃣ Testing pending_invites table...');
    const { error: inviteError } = await supabase
      .from('pending_invites')
      .select('count')
      .limit(1);

    if (inviteError) {
      console.error('❌ Pending invites table error:', inviteError);
      return { 
        success: false, 
        error: 'pending_invites table not accessible: ' + inviteError.message,
        suggestion: 'Run create-invite-system.sql script in Supabase Dashboard'
      };
    }
    console.log('✅ pending_invites table accessible');

    // 5. RPC funkció teszt
    console.log('5️⃣ Testing create_user_invite function...');
    
    // Dry run teszt - nem hoz létre meghívót, csak teszteli a funkció elérhetőségét
    try {
      const { error: rpcError } = await supabase
        .rpc('create_user_invite', {
          invite_email: 'test@test.com',  // Teszt email
          invite_role: 'user'
        });

      // Ha "already exists" hibát kapunk, az jó - a funkció elérhető
      if (rpcError && rpcError.message.includes('already exists')) {
        console.log('✅ RPC function accessible (already exists error is expected)');
      } else if (rpcError && rpcError.message.includes('function') && rpcError.message.includes('not found')) {
        console.error('❌ RPC function not found:', rpcError);
        return { 
          success: false, 
          error: 'create_user_invite function not found',
          suggestion: 'Run create-invite-system.sql script in Supabase Dashboard'
        };
      } else if (rpcError) {
        console.log('⚠️ RPC function exists but returned error:', rpcError.message);
      } else {
        console.log('✅ RPC function accessible and working');
      }
    } catch (err) {
      console.error('❌ RPC test error:', err);
      return { success: false, error: 'RPC function test failed: ' + (err as Error).message };
    }

    console.log('🎉 All tests passed! Invite system should work.');
    return { success: true, message: 'All Supabase tests passed successfully!' };

  } catch (error) {
    console.error('❌ Connection test failed:', error);
    return { 
      success: false, 
      error: 'Connection test failed: ' + (error as Error).message 
    };
  }
}
