import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import LoadingScreen from './components/ui/LoadingScreen';
import { getCurrentUserRole } from './lib/users';
import { useEffect, useState } from 'react';
import { Toaster } from './components/ui/toaster';
import { supabase, connectionManager } from './config/supabase';
import { useNavigate } from 'react-router-dom';
import { AppRoutes } from './routes';

// Connection error component
function ConnectionError() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
        <div className="flex flex-col items-center text-center">
          <div className="text-error-500 dark:text-error-400 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Kapcsolódási hiba</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Nem sikerült kapcsolódni az adatbázishoz. Kérjük, ellenőrizze az internetkapcsolatot és próbálja újra.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:bg-primary-500 dark:hover:bg-primary-600"
          >
            Újrapróbálkozás
          </button>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [connectionError, setConnectionError] = useState(false);
  const [userRole, setUserRole] = useState<string>('anonymous');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check Supabase connection
    const checkConnection = async () => {
      const isConnected = await connectionManager.checkConnection();
      setConnectionError(!isConnected);
    };
    
    checkConnection();
  }, []);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          setUserRole('anonymous');
          setIsLoading(false);
          return;
        }

        const role = await getCurrentUserRole();
        console.log('User role in App:', role);
        setUserRole(role);
      } catch (error) {
        console.error('Error fetching user role:', error);
        setUserRole('anonymous');
      } finally {
        setIsLoading(false);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const role = await getCurrentUserRole();
        setUserRole(role);
      } else if (event === 'SIGNED_OUT') {
        setUserRole('anonymous');
        navigate('/');
      }
    });

    fetchUserRole();

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  // Show connection error if Supabase is not available
  if (connectionError) {
    return <ConnectionError />;
  }

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <AppRoutes userRole={userRole} />
      <Toaster />
    </>
  );
}

export default App;
