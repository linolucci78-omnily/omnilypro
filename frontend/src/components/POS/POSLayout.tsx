import React, { useState } from 'react';
import POSHeader from './POSHeader';
import POSSidebar from './POSSidebar';
import './POSLayout.css';

interface POSLayoutProps {
  children: React.ReactNode;
  activeSection?: string;
  onSectionChange?: (section: string) => void;
}

const POSLayout: React.FC<POSLayoutProps> = ({ children, activeSection = 'dashboard', onSectionChange = () => {} }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true); // DEBUG: Forza apertura

  const toggleSidebar = () => {
    console.log('🔄 POSLayout toggleSidebar called, current state:', sidebarOpen);
    setSidebarOpen(!sidebarOpen);
    console.log('🔄 New sidebar state will be:', !sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="pos-layout">
      {/* Header fisso */}
      <POSHeader onMenuToggle={toggleSidebar} />

      {/* Sidebar a scomparsa */}
      <POSSidebar
        isOpen={sidebarOpen}
        onClose={closeSidebar}
        activeSection={activeSection}
        onSectionChange={onSectionChange}
      />

      {/* Contenuto principale */}
      <main className="pos-main-content">
        {children}
      </main>
    </div>
  );
};

export default POSLayout;