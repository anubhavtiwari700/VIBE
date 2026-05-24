import React, { createContext, useContext, useState } from 'react';

const SidebarContext = createContext();

export const SidebarProvider = ({ children }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [activeAdminTab, setActiveAdminTab] = useState('users');

  const toggleSidebar = () => setIsVisible(!isVisible);

  return (
    <SidebarContext.Provider value={{ isVisible, toggleSidebar, activeAdminTab, setActiveAdminTab }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) throw new Error('useSidebar must be used within a SidebarProvider');
  return context;
};
