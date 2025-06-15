import { useEffect, useState } from 'react';
import { supabase } from '../../config/supabase';

export function RoleDebug() {
  const [roleInfo, setRoleInfo] = useState<{
    userId: string | null;
    directRole: string | null;
    rpcRole: string | null;
    isAdmin: boolean | null;
    profilesTable: Record<string, unknown> | null;
    usersTable: Record<string, unknown> | null;
    error: string | null;
  }>({
    userId: null,
    directRole: null,
    rpcRole: null,
    isAdmin: null,
    profilesTable: null,
    usersTable: null,
    error: null,
  });

  useEffect(() => {
    async function checkRole() {
      try {
        // Get current user
        const { data: authData, error: authError } = await supabase.auth.getUser();
        if (authError || !authData.user) {
          setRoleInfo(prev => ({ ...prev, error: 'Not authenticated' }));
          return;
        }

        const userId = authData.user.id;
        setRoleInfo(prev => ({ ...prev, userId }));

        // Get role using different methods
        try {
          // Direct check from profiles table
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('id, role')
            .eq('id', userId)
            .single();

          if (!profileError) {
            setRoleInfo(prev => ({ 
              ...prev, 
              profilesTable: profileData,
              directRole: profileData?.role || null 
            }));
          } else {
            console.error('Profile table error:', profileError);
          }

          // We no longer check from users table as it's been deprecated
          setRoleInfo(prev => ({
            ...prev,
            usersTable: { id: userId, role: '(users table deprecated)' }
          }));

          // Try RPC function if available
          try {
            const { data: rpcData, error: rpcError } = await supabase
              .rpc('get_user_role', { user_id: userId });

            if (!rpcError) {
              setRoleInfo(prev => ({ ...prev, rpcRole: rpcData }));
            } else {
              console.error('RPC error:', rpcError);
            }
          } catch (rpcErr) {
            console.error('RPC function error:', rpcErr);
          }

          // Check admin status
          try {
            const { data: isAdminData, error: isAdminError } = await supabase
              .rpc('is_admin', { user_id: userId });

            if (!isAdminError) {
              setRoleInfo(prev => ({ ...prev, isAdmin: isAdminData }));
            } else {
              console.error('is_admin RPC error:', isAdminError);
            }
          } catch (adminErr) {
            console.error('Admin check error:', adminErr);
          }

        } catch (checkError) {
          console.error('Role check error:', checkError);
          setRoleInfo(prev => ({ ...prev, error: 'Error checking role' }));
        }
      } catch (err) {
        console.error('Error in checkRole:', err);
        setRoleInfo(prev => ({ ...prev, error: String(err) }));
      }
    }

    checkRole();
  }, []);

  return (
    <div className="p-4 m-4 border rounded bg-gray-50 dark:bg-gray-800">
      <h3 className="font-bold text-lg mb-2">User Role Debug</h3>
      <div className="text-sm space-y-1">
        <p><strong>User ID:</strong> {roleInfo.userId || 'Not found'}</p>
        <p><strong>Direct Role:</strong> {roleInfo.directRole || 'Not found'}</p>
        <p><strong>RPC Role:</strong> {roleInfo.rpcRole || 'RPC function not available'}</p>
        <p><strong>Is Admin:</strong> {roleInfo.isAdmin === null ? 'Unknown' : String(roleInfo.isAdmin)}</p>
        
        <div className="mt-2">
          <p><strong>Profiles Table:</strong></p>
          <pre className="p-2 bg-gray-100 dark:bg-gray-700 rounded overflow-auto text-xs">
            {JSON.stringify(roleInfo.profilesTable, null, 2) || 'Not found'}
          </pre>
        </div>
        
        <div className="mt-2">
          <p><strong>Users Table:</strong></p>
          <pre className="p-2 bg-gray-100 dark:bg-gray-700 rounded overflow-auto text-xs">
            {JSON.stringify(roleInfo.usersTable, null, 2) || 'Not found'}
          </pre>
        </div>
        
        {roleInfo.error && (
          <p className="text-error-500 dark:text-error-400 mt-2">
            Error: {roleInfo.error}
          </p>
        )}
      </div>
    </div>
  );
}

export default RoleDebug;
