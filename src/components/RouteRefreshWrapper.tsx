import React from 'react';
import useRouteRefresh from '../hooks/useRouteRefresh';

/**
 * Component wrapper that ensures proper refresh on navigation
 */
const RouteRefreshWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useRouteRefresh();
  
  return (
    <div key={`route-${location.pathname}-${location.search}`}>
      {children}
    </div>
  );
};

export default RouteRefreshWrapper;
