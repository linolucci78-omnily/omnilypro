import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './POSSidebar.css';

interface POSSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const POSSidebar: React.FC<POSSidebarProps> = ({ isOpen, onClose }) => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Errore logout:', error);
    }
  };

  const menuItems = [
    {
      path: '/dashboard',
      icon: '🏠',
      label: 'Dashboard',
      color: '#ef4444'
    },
    {
      path: '/pos',
      icon: '💳',
      label: 'POS',
      color: '#f59e0b'
    },
    {
      path: '/customers',
      icon: '👥',
      label: 'Clienti',
      color: '#10b981'
    },
    {
      path: '/analytics',
      icon: '📊',
      label: 'Analytics',
      color: '#8b5cf6'
    },
    {
      path: '/settings',
      icon: '⚙️',
      label: 'Impostazioni',
      color: '#6b7280'
    }
  ];

  const handleMenuClick = (path: string) => {
    navigate(path);
    onClose(); // Chiudi menu dopo click
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="pos-sidebar-backdrop"
          onClick={onClose}
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
              key={item.path}
              onClick={() => handleMenuClick(item.path)}
              className={`pos-menu-item ${location.pathname === item.path ? 'pos-menu-item-active' : ''}`}
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
            <span className="pos-menu-icon">🚪</span>
            <span className="pos-menu-label">Logout</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default POSSidebar;