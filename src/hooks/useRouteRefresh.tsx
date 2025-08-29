import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Hook to force component re-render on route changes
 * Helps with development HMR issues
 */
const useRouteRefresh = () => {
  const location = useLocation();

  useEffect(() => {
    // Force a gentle refresh of the page state
    if (import.meta.env.DEV) {
      // Only in development mode
      const timeoutId = setTimeout(() => {
        // Trigger a small DOM update to ensure React picks up changes
        const event = new CustomEvent('routechange', { 
          detail: { pathname: location.pathname } 
        });
        window.dispatchEvent(event);
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [location.pathname]);

  return location;
};

export default useRouteRefresh;
