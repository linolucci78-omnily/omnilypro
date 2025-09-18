import React, { useState, useEffect } from 'react';
import POSHeader from './POSHeader';
import POSSidebar from './POSSidebar';
import './POSLayout.css';

interface POSLayoutProps {
  children: React.ReactNode;
  activeSection?: string;
  onSectionChange?: (section: string) => void;
}

const POSLayout: React.FC<POSLayoutProps> = ({ children, activeSection = 'dashboard', onSectionChange = () => {} }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    console.log('📱 SIDEBAR STATE CHANGED:', sidebarOpen);
  }, [sidebarOpen]);

  const toggleSidebar = () => {
    console.log('🔄 TOGGLE SIDEBAR CALLED, current:', sidebarOpen);
    setSidebarOpen(prev => {
      console.log('🔄 SETTING STATE FROM', prev, 'TO', !prev);
      return !prev;
    });
  };

  const closeSidebar = () => {
    console.log('❌ CLOSE SIDEBAR CALLED!');
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