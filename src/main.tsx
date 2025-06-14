import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { initializeSupabase } from './lib/initSupabase';
import { connectionManager } from './config/supabase';
import LoadingScreen from './components/ui/LoadingScreen';
import './index.css';

// Create a wrapper component to initialize Supabase
function AppWithSupabase() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        // Initialize Supabase connection
        const success = await initializeSupabase();
        if (!success) {
          console.warn('Supabase initialization completed with warnings');
        }
        
        // Test connection with the unified manager
        await connectionManager.checkConnection();
      } catch (error) {
        console.error('Failed to initialize Supabase:', error);
        // Continue rendering the app even if Supabase initialization fails
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, []);

  // Show loading state while initializing
  if (isLoading) {
    return <LoadingScreen message="Alkalmazás inicializálása..." />;
  }

  return (
    <StrictMode>
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <App />
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                className: 'dark:bg-gray-800 dark:text-white',
                success: {
                  className: 'dark:bg-success-900 dark:text-white',
                  iconTheme: {
                    primary: '#10B981',
                    secondary: '#ffffff',
                  },
                },
                error: {
                  className: 'dark:bg-error-900 dark:text-white',
                  iconTheme: {
                    primary: '#EF4444',
                    secondary: '#ffffff',
                  },
                },
              }}
            />
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </StrictMode>
  );
}

createRoot(document.getElementById('root')!).render(<AppWithSupabase />);
