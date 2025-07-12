import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Users, UserPlus, Edit2, Trash2, Mail, User as UserIcon } from 'lucide-react';
import { User, getUsers, updateUser, deleteUser, getAllUsers, restoreUser } from '../lib/users';
import { createInvite } from '../lib/invites';
import { testSupabaseConnection } from '../lib/supabaseTest';
import { InviteManagement } from '../components/InviteManagement';
import toast from 'react-hot-toast';

const userSchema = z.object({
  email: z.string().email('Invalid email address'),
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.enum(['admin', 'user']), // Removed 'disabled' since we use invites now
});

type UserFormData = z.infer<typeof userSchema>;

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [showDisabled, setShowDisabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [testing, setTesting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      role: 'user',
    },
  });

  const loadUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = showDisabled ? await getAllUsers() : await getUsers();
      setUsers(data);
    } catch (error) {
      console.error('Failed to load users:', error);
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  }, [showDisabled]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    if (editingUser) {
      setValue('email', editingUser.email);
      setValue('full_name', editingUser.full_name || '');
      // Ha a user disabled, akkor user role-t állítunk be alapértelmezettként
      setValue('role', editingUser.role === 'disabled' ? 'user' : editingUser.role);
      setShowForm(true);
    }
  }, [editingUser, setValue]);

  const onSubmit = async (data: UserFormData) => {
    console.log('🚀 Form submitted:', data);
    
    try {
      if (editingUser) {
        console.log('🔄 Updating existing user:', editingUser.id);
        await updateUser(editingUser.id, data);
        toast.success('User updated successfully');
      } else {
        console.log('📧 Creating new invite for:', data.email);
        
        // Timeout protection
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout after 30 seconds')), 30000)
        );
        
        const invitePromise = createInvite({
          email: data.email,
          role: data.role
        });
        
        // Race between invite creation and timeout
        await Promise.race([invitePromise, timeoutPromise]);
        
        toast.success('Invite sent successfully! User will receive an invitation link.');
      }
      
      await loadUsers();
      setShowForm(false);
      setEditingUser(null);
      reset();
    } catch (error) {
      console.error('❌ Failed to save user:', error);
      
      // Jobb hibaüzenetek
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          toast.error('A kérés túl sokáig tartott. Ellenőrizd a hálózati kapcsolatot és próbáld újra.');
        } else if (error.message.includes('function') && error.message.includes('not found')) {
          toast.error('Database hiba: A meghívó funkció nincs telepítve. Futtasd le az SQL scripteket!');
        } else if (error.message.includes('permission') || error.message.includes('Unauthorized')) {
          toast.error('Jogosultság hiba: Nincs admin jogosultságod meghívó küldésére.');
        } else if (error.message.includes('already exists')) {
          toast.error('Ez az email cím már használatban van.');
        } else {
          toast.error(`Hiba: ${error.message}`);
        }
      } else {
        toast.error('Ismeretlen hiba történt. Próbáld újra.');
      }
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to disable this user? They will no longer be able to access the system.')) return;

    try {
      await deleteUser(id);
      await loadUsers();
      toast.success('User disabled successfully');
    } catch (error) {
      console.error('Failed to disable user:', error);
      toast.error('Failed to disable user');
    }
  };

  const handleRestoreUser = async (id: string) => {
    if (!confirm('Are you sure you want to restore this user?')) return;

    try {
      await restoreUser(id, 'user');
      await loadUsers();
      toast.success('User restored successfully');
    } catch (error) {
      console.error('Failed to restore user:', error);
      toast.error('Failed to restore user');
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    console.log('🧪 Starting Supabase connection test...');
    
    try {
      const result = await testSupabaseConnection();
      
      if (result.success) {
        toast.success('✅ Supabase connection test passed! Invite system should work.');
        console.log('✅ Test result:', result.message);
      } else {
        toast.error(`❌ Test failed: ${result.error}`);
        console.error('❌ Test failed:', result);
        
        if (result.suggestion) {
          toast.error(`💡 Suggestion: ${result.suggestion}`, { duration: 8000 });
        }
      }
    } catch (error) {
      console.error('❌ Test error:', error);
      toast.error('Test failed: ' + (error as Error).message);
    } finally {
      setTesting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">User Management</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">Manage users and their roles</p>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showDisabled}
              onChange={(e) => setShowDisabled(e.target.checked)}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Show disabled users</span>
          </label>
          <button
            onClick={() => {
              setEditingUser(null);
              setShowForm(!showForm);
              reset();
            }}
            className="btn btn-primary inline-flex items-center gap-2"
          >
            <UserPlus size={20} />
            <span>Invite User</span>
          </button>
          <button
            onClick={handleTestConnection}
            disabled={testing}
            className="btn btn-outline inline-flex items-center gap-2"
          >
            {testing ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <span>🧪</span>
            )}
            <span>Test Connection</span>
          </button>
        </div>
      </div>

      {showForm && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-6 text-xl font-semibold text-gray-900 dark:text-white">
            {editingUser ? 'Edit User' : 'Invite New User'}
          </h2>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email
                </label>
                <div className="relative mt-1">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    {...register('email')}
                    className="input pl-10"
                    placeholder="user@example.com"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-error-600 dark:text-error-400">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Name
                </label>
                <div className="relative mt-1">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <UserIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    {...register('full_name')}
                    className="input pl-10"
                    placeholder="John Doe"
                  />
                </div>
                {errors.full_name && (
                  <p className="mt-1 text-sm text-error-600 dark:text-error-400">{errors.full_name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Role
                </label>
                <select
                  {...register('role')}
                  className="input mt-1"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                  {editingUser && editingUser.role === 'disabled' && (
                    <option value="disabled">Disabled</option>
                  )}
                </select>
                {errors.role && (
                  <p className="mt-1 text-sm text-error-600 dark:text-error-400">{errors.role.message}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingUser(null);
                  reset();
                }}
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Saving...</span>
                  </div>
                ) : (
                  <span>{editingUser ? 'Update User' : 'Send Invite'}</span>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="p-6">
          <div className="relative overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-700/50 dark:text-gray-400">
                <tr>
                  <th scope="col" className="px-6 py-3">Name</th>
                  <th scope="col" className="px-6 py-3">Email</th>
                  <th scope="col" className="px-6 py-3">Role</th>
                  <th scope="col" className="px-6 py-3">Created</th>
                  <th scope="col" className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className={`border-b border-gray-200 ${
                      user.role === 'disabled' 
                        ? 'bg-gray-50 dark:bg-gray-900/50 opacity-75' 
                        : 'bg-white dark:bg-gray-800'
                    }`}
                  >
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                      {user.full_name || '—'}
                    </td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                      {user.email}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        user.role === 'admin'
                          ? 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-400'
                          : user.role === 'disabled'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                      {new Date(user.created_at!).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {user.role !== 'disabled' ? (
                          <>
                            <button
                              onClick={() => setEditingUser(user)}
                              className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 dark:text-gray-500 dark:hover:bg-gray-700 dark:hover:text-gray-400"
                              title="Edit user"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-error-500 dark:text-gray-500 dark:hover:bg-gray-700 dark:hover:text-error-400"
                              title="Disable user"
                            >
                              <Trash2 size={18} />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleRestoreUser(user.id)}
                            className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-green-500 dark:text-gray-500 dark:hover:bg-gray-700 dark:hover:text-green-400"
                            title="Restore user"
                          >
                            <UserIcon size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {users.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  No users found
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Meghívó kezelő komponens */}
      <InviteManagement />
    </div>
  );
};

export default UserManagement;