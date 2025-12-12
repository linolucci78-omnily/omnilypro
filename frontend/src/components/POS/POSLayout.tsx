import React, { useState, useEffect } from 'react';
import POSHeader from './POSHeader';
import POSSidebar from './POSSidebar';
import './POSLayout.css';

interface POSLayoutProps {
  children: React.ReactNode;
  activeSection?: string;
  onSectionChange?: (section: string) => void;
  currentOrganization?: { id?: string; plan_type?: string; primary_color?: string; secondary_color?: string; logo_url?: string; name?: string } | null;
  previewColors?: { primary: string | null; secondary: string | null };
}

const POSLayout: React.FC<POSLayoutProps> = ({ children, activeSection = 'dashboard', onSectionChange = () => {}, currentOrganization, previewColors }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    console.log('📱 SIDEBAR STATE CHANGED:', sidebarOpen);
  }, [sidebarOpen]);

  useEffect(() => {
    console.log('🎨 POSLayout - Colori organizzazione:', {
      primary: currentOrganization?.primary_color,
      secondary: currentOrganization?.secondary_color
    });
  }, [currentOrganization?.primary_color, currentOrganization?.secondary_color]);

  useEffect(() => {
    console.log('🎨 POSLayout - Preview colors:', previewColors);
  }, [previewColors]);

  // Ottiene i colori attivi (preview o salvati)
  const getActiveColors = () => {
    return {
      primary: previewColors?.primary || currentOrganization?.primary_color || '#dc2626',
      secondary: previewColors?.secondary || currentOrganization?.secondary_color || '#ef4444'
    };
  };

  // IMPORTANTE: Imposta CSS variables GLOBALMENTE per tutti i componenti POS (anche modali)
  useEffect(() => {
    const colors = getActiveColors();
    console.log('🎨 POSLayout - Impostazione CSS variables globali:', colors);
    document.documentElement.style.setProperty('--primary-color', colors.primary);
    document.documentElement.style.setProperty('--secondary-color', colors.secondary);
  }, [previewColors?.primary, previewColors?.secondary, currentOrganization?.primary_color, currentOrganization?.secondary_color]);

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

  const activeColors = getActiveColors();

  return (
    <div
      className="pos-layout"
      style={{
        '--primary-color': activeColors.primary,
        '--secondary-color': activeColors.secondary
      } as React.CSSProperties}
    >
      {/* Header fisso */}
      <POSHeader
        onMenuToggle={toggleSidebar}
        organizationId={currentOrganization?.id}
      />

      {/* Sidebar a scomparsa */}
      <POSSidebar
        isOpen={sidebarOpen}
        onClose={closeSidebar}
        activeSection={activeSection}
        onSectionChange={onSectionChange}
        currentOrganization={currentOrganization}
      />

      {/* Contenuto principale */}
      <main className="pos-main-content">
        {children}
      </main>
    </div>
  );
};

export default POSLayout;