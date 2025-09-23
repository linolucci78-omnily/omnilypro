import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  MdDashboard,
  MdLoyalty,
  MdPeople,
  MdCampaign,
  MdTrendingUp,
  MdSettings,
  MdHelp,
  MdLogout,
  MdStar,
  MdCardGiftcard,
  MdCategory,
  MdGroup,
  MdIntegrationInstructions,
  MdNotifications,
  MdAnalytics,
  MdBrush,
  MdChannel
} from 'react-icons/md';
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
  const [backdropActive, setBackdropActive] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Delay backdrop attivation per evitare click immediato
      const timer = setTimeout(() => {
        setBackdropActive(true);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setBackdropActive(false);
    }
  }, [isOpen]);

  const handleSignOut = async () => {
    console.log('🚪 LOGOUT SIDEBAR CLICKED!');
    try {
      console.log('🚪 Setting POS mode flag from sidebar...');
      localStorage.setItem('pos-mode', 'true');
      console.log('🚪 Calling signOut from sidebar...');
      await signOut();
      console.log('🚪 SignOut success from sidebar');
    } catch (error) {
      console.error('❌ Errore logout sidebar:', error);
    }
  };

  const menuItems = [
    {
      id: 'dashboard',
      icon: MdDashboard,
      label: 'Dashboard',
      color: '#ef4444'
    },
    {
      id: 'stamps',
      icon: MdLoyalty,
      label: 'Tessere Punti',
      color: '#10b981'
    },
    {
      id: 'loyalty-tiers',
      icon: MdStar,
      label: 'Livelli Fedeltà',
      color: '#f59e0b'
    },
    {
      id: 'rewards',
      icon: MdCardGiftcard,
      label: 'Premi',
      color: '#10b981'
    },
    {
      id: 'members',
      icon: MdPeople,
      label: 'Clienti',
      color: '#3b82f6'
    },
    {
      id: 'categories',
      icon: MdCategory,
      label: 'Categorie',
      color: '#8b5cf6'
    },
    {
      id: 'marketing-campaigns',
      icon: MdCampaign,
      label: 'Marketing',
      color: '#f59e0b'
    },
    {
      id: 'communications',
      icon: MdChannel,
      label: 'Comunicazioni',
      color: '#f59e0b'
    },
    {
      id: 'campaigns',
      icon: MdTrendingUp,
      label: 'Campagne',
      color: '#8b5cf6'
    },
    {
      id: 'team-management',
      icon: MdGroup,
      label: 'Team',
      color: '#3b82f6'
    },
    {
      id: 'pos-integration',
      icon: MdIntegrationInstructions,
      label: 'Integrazione POS',
      color: '#10b981'
    },
    {
      id: 'notifications',
      icon: MdNotifications,
      label: 'Notifiche',
      color: '#f59e0b'
    },
    {
      id: 'analytics-reports',
      icon: MdAnalytics,
      label: 'Analytics',
      color: '#8b5cf6'
    },
    {
      id: 'branding-social',
      icon: MdBrush,
      label: 'Branding',
      color: '#ef4444'
    },
    {
      id: 'channels',
      icon: MdChannel,
      label: 'Canali',
      color: '#6b7280'
    },
    {
      id: 'settings',
      icon: MdSettings,
      label: 'Impostazioni',
      color: '#6b7280'
    },
    {
      id: 'support',
      icon: MdHelp,
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
      {/* Backdrop TEMPORANEAMENTE DISATTIVATO per debug */}
      {false && isOpen && (
        <div
          className="pos-sidebar-backdrop"
          onClick={() => {
            if (backdropActive) {
              console.log('🎭 BACKDROP CLICKED!');
              onClose();
            } else {
              console.log('🎭 BACKDROP IGNORED (too early)');
            }
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
              <span className="pos-menu-icon">
                <item.icon size={24} />
              </span>
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
            <span className="pos-menu-icon">
              <MdLogout size={24} />
            </span>
            <span className="pos-menu-label">Logout</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default POSSidebar;