import { Outlet, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import Header from './Header';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import RouteRefreshWrapper from '../RouteRefreshWrapper';

const Layout = () => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Close sidebar on route change (mobile)
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [location.pathname, isMobile]);

  return (
    <div className="flex h-screen flex-col bg-gray-50 dark:bg-gray-900">
      <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          open={sidebarOpen} 
          onClose={() => setSidebarOpen(false)} 
          isMobile={isMobile}
        />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="mx-auto max-w-7xl animate-fade-in">
            <RouteRefreshWrapper>
              <Outlet />
            </RouteRefreshWrapper>
          </div>
        </main>
      </div>
      
      {isMobile && <MobileNav />}
    </div>
  );
};

export default Layout;