import React from 'react';
import Sidebar from './Sidebar';
import { useSidebar } from '../context/SidebarContext';
import { useAuth } from '../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';

const MainLayout = ({ children, hideSidebar = false }) => {
  const { user, loading } = useAuth();
  const sidebarCtx = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();

  const isAdminPanel = location.pathname.startsWith('/admin');
  const isSuper = user?.role === 'superadmin';
  const isAdminView = isAdminPanel && !isSuper;
  const shouldHideSidebar = hideSidebar || location.pathname === '/settings';

  return (
    <div className="flex flex-col h-screen app-bg">
      {/* Top Bar Navigation for all views */}
      {!shouldHideSidebar && <Sidebar />}
      
      <main
        className="flex-1 min-h-0 overflow-y-auto relative outline-none scroll-smooth px-4 pt-4 pb-28 md:px-12 md:pt-8 md:pb-32"
      >
        <div className="max-w-[1400px] mx-auto w-full">
            {children}
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
