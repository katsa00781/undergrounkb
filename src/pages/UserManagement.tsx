import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Users, UserPlus, Edit2, Trash2, Mail, User as UserIcon } from 'lucide-react';
import { User, getUsers, updateUser, deleteUser, getAllUsers, restoreUser } from '../lib/users';
import { createInvite, PendingInvite } from '../lib/invites';
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
      toast.error('Felhasználók betöltése sikertelen');
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
        toast.success('Felhasználó sikeresen frissítve');
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
        const inviteResult = await Promise.race([invitePromise, timeoutPromise]) as PendingInvite;
        
        // Ha sikeres volt a meghívó létrehozása, generáljuk a linket
        if (inviteResult && inviteResult.invite_token) {
          const inviteUrl = `${window.location.origin}/invite/${inviteResult.invite_token}`;
          
          // Megjelenítjük a sikeres üzenetet link másolási opcióval
          const copyToClipboard = () => {
            navigator.clipboard.writeText(inviteUrl).then(() => {
              toast.success('✅ Meghívó link vágólapra másolva!');
            }).catch(() => {
              toast.error('❌ Nem sikerült a vágólapra másolni');
            });
          };

          // Toast üzenet linkkel
          toast.success(`✅ Meghívó létrehozva: ${data.email}`, {
            duration: 8000,
          });
          
          // Egy másik toast a link másoláshoz
          toast((t) => (
            <div className="flex flex-col gap-2">
              <div className="font-medium">📋 Meghívó link készen áll</div>
              <div className="text-sm text-gray-600 break-all">{inviteUrl}</div>
              <button
                onClick={() => {
                  copyToClipboard();
                  toast.dismiss(t.id);
                }}
                className="bg-primary-500 text-white dark:text-gray-900 px-3 py-1 rounded text-sm hover:bg-primary-600"
              >
                📋 Link másolása
              </button>
            </div>
          ), {
            duration: 15000, // 15 másodpercig látható
          });
          
          console.log('🔗 Generated invite URL:', inviteUrl);
        } else {
          toast.success('Meghívó sikeresen elküldve! A felhasználó kap egy meghívó linket.');
        }
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
      toast.success('Felhasználó sikeresen letiltva');
    } catch (error) {
      console.error('Failed to disable user:', error);
      toast.error('Felhasználó letiltása sikertelen');
    }
  };

  const handleRestoreUser = async (id: string) => {
    if (!confirm('Are you sure you want to restore this user?')) return;

    try {
      await restoreUser(id, 'user');
      await loadUsers();
      toast.success('Felhasználó sikeresen visszaállítva');
    } catch (error) {
      console.error('Failed to restore user:', error);
      toast.error('Felhasználó visszaállítása sikertelen');
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
        toast.error(`❌ Teszt sikertelen: ${result.error}`);
        console.error('❌ Test failed:', result);
        
        if (result.suggestion) {
          toast.error(`💡 Javaslat: ${result.suggestion}`, { duration: 8000 });
        }
      }
    } catch (error) {
      console.error('❌ Test error:', error);
      toast.error('Teszt sikertelen: ' + (error as Error).message);
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
    <div className="space-y-6 p-4 md:p-6">
      {/* Header section - responsive */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Felhasználó kezelés</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">Felhasználók és szerepköreik kezelése</p>
        </div>
        
        {/* Controls - responsive layout */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 lg:gap-4">
          <label className="flex items-center gap-2 order-2 sm:order-1">
            <input
              type="checkbox"
              checked={showDisabled}
              onChange={(e) => setShowDisabled(e.target.checked)}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">Letiltott felhasználók megjelenítése</span>
          </label>
          
          <div className="flex flex-col xs:flex-row gap-2 w-full sm:w-auto order-1 sm:order-2">
            <button
              onClick={() => {
                setEditingUser(null);
                setShowForm(!showForm);
                reset();
              }}
              className="btn btn-primary inline-flex items-center justify-center gap-2 text-sm md:text-base"
            >
              <UserPlus size={18} className="md:w-5 md:h-5" />
              <span>Meghívó küldése</span>
            </button>
            <button
              onClick={handleTestConnection}
              disabled={testing}
              className="btn btn-outline inline-flex items-center justify-center gap-2 text-sm md:text-base"
            >
              {testing ? (
                <div className="h-4 w-4 md:h-5 md:w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <span>🧪</span>
              )}
              <span>Kapcsolat tesztelése</span>
            </button>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="rounded-lg border border-gray-200 bg-white p-4 md:p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 md:mb-6 text-lg md:text-xl font-semibold text-gray-900 dark:text-white">
            {editingUser ? 'Felhasználó szerkesztése' : 'Új felhasználó meghívása'}
          </h2>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 md:space-y-6">
            <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
              <div className="lg:col-span-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email cím
                </label>
                <div className="relative mt-1">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Mail className="h-4 w-4 md:h-5 md:w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    {...register('email')}
                    className="input pl-8 md:pl-10 text-sm md:text-base"
                    placeholder="user@example.com"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-xs md:text-sm text-error-600 dark:text-error-400">{errors.email.message}</p>
                )}
              </div>

              <div className="lg:col-span-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Teljes név
                </label>
                <div className="relative mt-1">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <UserIcon className="h-4 w-4 md:h-5 md:w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    {...register('full_name')}
                    className="input pl-8 md:pl-10 text-sm md:text-base"
                    placeholder="Kovács János"
                  />
                </div>
                {errors.full_name && (
                  <p className="mt-1 text-xs md:text-sm text-error-600 dark:text-error-400">{errors.full_name.message}</p>
                )}
              </div>

              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Szerepkör
                </label>
                <select
                  {...register('role')}
                  className="input mt-1 text-sm md:text-base"
                >
                  <option value="user">Felhasználó</option>
                  <option value="admin">Adminisztrátor</option>
                  {editingUser?.role === 'disabled' && (
                    <option value="disabled">Letiltott</option>
                  )}
                </select>
                {errors.role && (
                  <p className="mt-1 text-xs md:text-sm text-error-600 dark:text-error-400">{errors.role.message}</p>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3 md:gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingUser(null);
                  reset();
                }}
                className="btn btn-outline w-full sm:w-auto order-2 sm:order-1"
              >
                Mégse
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary w-full sm:w-auto order-1 sm:order-2"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 md:h-5 md:w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span className="text-sm md:text-base">Mentés...</span>
                  </div>
                ) : (
                  <span className="text-sm md:text-base">{editingUser ? 'Felhasználó frissítése' : 'Meghívó küldése'}</span>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="p-4 md:p-6">
          {users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                No users found
              </p>
            </div>
          ) : (
            <>
              {/* Desktop/Tablet táblázat nézet */}
              <div className="hidden lg:block relative overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-700/50 dark:text-gray-400">
                    <tr>
                      <th scope="col" className="px-6 py-3">Név</th>
                      <th scope="col" className="px-6 py-3">Email</th>
                      <th scope="col" className="px-6 py-3">Szerepkör</th>
                      <th scope="col" className="px-6 py-3">Létrehozva</th>
                      <th scope="col" className="px-6 py-3">Műveletek</th>
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
                              ? 'bg-error-100 text-error-800 dark:bg-error-900/30 dark:text-error-400'
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
                                  title="Felhasználó szerkesztése"
                                >
                                  <Edit2 size={18} />
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(user.id)}
                                  className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-error-500 dark:text-gray-500 dark:hover:bg-gray-700 dark:hover:text-error-400"
                                  title="Felhasználó letiltása"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => handleRestoreUser(user.id)}
                                className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-success-500 dark:text-gray-500 dark:hover:bg-gray-700 dark:hover:text-success-400"
                                title="Felhasználó visszaállítása"
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
              </div>

              {/* Mobile/Tablet kártya nézet */}
              <div className="lg:hidden space-y-4">
                {users.map((user) => (
                  <div 
                    key={user.id} 
                    className={`rounded-lg p-4 border ${
                      user.role === 'disabled' 
                        ? 'bg-gray-50 dark:bg-gray-900/50 opacity-75 border-gray-200 dark:border-gray-700' 
                        : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                    }`}
                  >
                    <div className="flex flex-col space-y-3">
                      {/* Felhasználó adatok */}
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {user.full_name || 'Névtelen felhasználó'}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 break-all">
                            {user.email}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.role === 'admin'
                              ? 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-400'
                              : user.role === 'disabled'
                              ? 'bg-error-100 text-error-800 dark:bg-error-900/30 dark:text-error-400'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          }`}>
                            {user.role}
                          </span>
                        </div>
                      </div>

                      {/* Meta adatok */}
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        <span className="font-medium">Regisztrált:</span> {new Date(user.created_at!).toLocaleDateString('hu-HU')}
                      </div>

                      {/* Műveletek - responsive gombok */}
                      <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                        {user.role !== 'disabled' ? (
                          <>
                            <button
                              onClick={() => setEditingUser(user)}
                              className="flex-1 flex items-center justify-center gap-2 text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 bg-primary-50 hover:bg-primary-100 dark:bg-primary-900/30 dark:hover:bg-primary-900/50 px-3 py-2 rounded-md transition-colors text-sm font-medium"
                            >
                              <Edit2 size={16} />
                              Szerkesztés
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 text-error-600 hover:text-error-900 dark:text-error-400 dark:hover:text-error-300 bg-error-50 hover:bg-error-100 dark:bg-error-900/30 dark:hover:bg-error-900/50 px-3 py-2 rounded-md transition-colors text-sm font-medium"
                            >
                              <Trash2 size={16} />
                              Letiltás
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleRestoreUser(user.id)}
                            className="flex-1 flex items-center justify-center gap-2 text-success-600 hover:text-success-900 dark:text-success-400 dark:hover:text-success-300 bg-success-50 hover:bg-success-100 dark:bg-success-900/30 dark:hover:bg-success-900/50 px-3 py-2 rounded-md transition-colors text-sm font-medium"
                          >
                            <UserIcon size={16} />
                            Visszaállítás
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Meghívó kezelő komponens */}
      <InviteManagement />
    </div>
  );
};

export default UserManagement;