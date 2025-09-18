import React, { useState } from 'react';
import POSHeader from './POSHeader';
import POSSidebar from './POSSidebar';
import './POSLayout.css';

interface POSLayoutProps {
  children: React.ReactNode;
}

const POSLayout: React.FC<POSLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="pos-layout">
      {/* Header fisso */}
      <POSHeader onMenuToggle={toggleSidebar} />

      {/* Sidebar a scomparsa */}
      <POSSidebar isOpen={sidebarOpen} onClose={closeSidebar} />

      {/* Contenuto principale */}
      <main className="pos-main-content">
        {children}
      </main>
    </div>
  );
};

export default POSLayout;