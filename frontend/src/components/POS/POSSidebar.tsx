import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './POSSidebar.css';

interface POSSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const POSSidebar: React.FC<POSSidebarProps> = ({ isOpen, onClose, activeSection, onSectionChange }) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/?posomnily=true');
    } catch (error) {
      console.error('Errore logout:', error);
    }
  };

  const menuItems = [
    {
      id: 'dashboard',
      icon: '■',
      label: 'Dashboard',
      color: '#ef4444'
    },
    {
      id: 'stamps',
      icon: '●',
      label: 'Tessere Punti',
      color: '#10b981'
    },
    {
      id: 'members',
      icon: '▲',
      label: 'Clienti',
      color: '#3b82f6'
    },
    {
      id: 'communications',
      icon: '♦',
      label: 'Comunicazioni',
      color: '#f59e0b'
    },
    {
      id: 'campaigns',
      icon: '↗',
      label: 'Campagne',
      color: '#8b5cf6'
    },
    {
      id: 'settings',
      icon: '⚡',
      label: 'Impostazioni',
      color: '#6b7280'
    },
    {
      id: 'support',
      icon: '?',
      label: 'Aiuto & Supporto',
      color: '#ef4444'
    }
  ];

  const handleMenuClick = (sectionId: string) => {
    onSectionChange(sectionId);
    onClose(); // Chiudi menu dopo click
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="pos-sidebar-backdrop"
          onClick={() => {
            console.log('🎭 BACKDROP CLICKED!');
            onClose();
          }}
        />
      )}

      {/* Sidebar */}
      <div className={`pos-sidebar ${isOpen ? 'pos-sidebar-open' : ''}`}>
        {/* Header Sidebar */}
        <div className="pos-sidebar-header">
          <img
            src="https://sjvatdnvewohvswfrdiv.supabase.co/storage/v1/object/public/IMG/OMNILYPRO.png"
            alt="OMNILY PRO"
            className="pos-sidebar-logo"
          />
          <div className="pos-sidebar-user">
            <div className="pos-user-email">{user?.email}</div>
            <div className="pos-user-role">POS Operator</div>
          </div>
        </div>

        {/* Menu Items */}
        <nav className="pos-sidebar-nav">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleMenuClick(item.id)}
              className={`pos-menu-item ${activeSection === item.id ? 'pos-menu-item-active' : ''}`}
              style={{ '--item-color': item.color } as React.CSSProperties}
            >
              <span className="pos-menu-icon">{item.icon}</span>
              <span className="pos-menu-label">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Logout Button */}
        <div className="pos-sidebar-footer">
          <button
            onClick={handleSignOut}
            className="pos-logout-btn"
          >
            <span className="pos-menu-icon">←</span>
            <span className="pos-menu-label">Logout</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default POSSidebar;