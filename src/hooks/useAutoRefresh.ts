import { useEffect, useRef } from 'react';
import { DATA_REFRESH_EVENT, shouldHandleDataRefresh, type DataRefreshScope } from '../utils/dataRefresh';

interface UseAutoRefreshOptions {
  enabled?: boolean;
  scopes?: DataRefreshScope[];
  refreshOnFocus?: boolean;
  refreshOnVisibility?: boolean;
  refreshOnRouteChange?: boolean;
}

export function useAutoRefresh(
  refresh: () => void | Promise<void>,
  {
    enabled = true,
    scopes = ['all'],
    refreshOnFocus = true,
    refreshOnVisibility = true,
    refreshOnRouteChange = false,
  }: UseAutoRefreshOptions = {}
) {
  const refreshRef = useRef(refresh);
  const scopesRef = useRef(scopes);

  useEffect(() => {
    refreshRef.current = refresh;
  }, [refresh]);

  useEffect(() => {
    scopesRef.current = scopes;
  }, [scopes]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const runRefresh = () => {
      void refreshRef.current();
    };

    const handleWindowFocus = () => {
      if (refreshOnFocus) {
        runRefresh();
      }
    };

    const handleVisibilityChange = () => {
      if (refreshOnVisibility && document.visibilityState === 'visible') {
        runRefresh();
      }
    };

    const handleRouteChange = () => {
      if (refreshOnRouteChange) {
        runRefresh();
      }
    };

    const handleDataRefresh = (event: Event) => {
      const changedScope = (event as CustomEvent<{ scope?: DataRefreshScope }>).detail?.scope ?? 'all';
      if (shouldHandleDataRefresh(scopesRef.current, changedScope)) {
        runRefresh();
      }
    };

    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('routechange', handleRouteChange);
    window.addEventListener(DATA_REFRESH_EVENT, handleDataRefresh as EventListener);

    return () => {
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('routechange', handleRouteChange);
      window.removeEventListener(DATA_REFRESH_EVENT, handleDataRefresh as EventListener);
    };
  }, [enabled, refreshOnFocus, refreshOnRouteChange, refreshOnVisibility]);
}