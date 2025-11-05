import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { hasAccess, getUpgradePlan, PlanType } from '../../utils/planPermissions';
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
  MdTv,
  MdEmail,
  MdPersonAdd,
  MdFlashOn,
  MdPublic,
  MdPalette,
  MdLanguage,
  MdLock
} from 'react-icons/md';
import './POSSidebar.css';

interface POSSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeSection: string;
  onSectionChange: (section: string) => void;
  currentOrganization?: { plan_type?: string; logo_url?: string; name?: string } | null;
}

const POSSidebar: React.FC<POSSidebarProps> = ({ isOpen, onClose, activeSection, onSectionChange, currentOrganization }) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [backdropActive, setBackdropActive] = useState(false);

  // Get user plan from current organization (following roadmap)
  const userPlan = currentOrganization?.plan_type || 'free';

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
      console.log('🚪 POS Sidebar Logout - Starting...');
      // IMPORTANTE: Navigate PRIMA del signOut per evitare flash della pagina desktop
      // L'utente vede subito la pagina login POS, poi facciamo signOut in background
      localStorage.setItem('pos-mode', 'true');
      navigate('/login?posomnily=true', { replace: true });

      // SignOut DOPO il navigate (in background, l'utente è già sulla pagina giusta)
      await signOut();
      console.log('🚪 SignOut completato');
    } catch (error) {
      console.error('❌ Errore logout sidebar:', error);
    }
  };

  // Define menu item type with locked property
  interface MenuItem {
    id: string;
    icon: any;
    label: string;
    feature: string | null;
    locked?: boolean;
    color?: string;
  }

  // Menu items identical to desktop OrganizationsDashboard
  const baseMenuItems: MenuItem[] = [
    { id: 'dashboard', icon: MdDashboard, label: 'Dashboard', feature: null },
    { id: 'stamps', icon: MdLoyalty, label: 'Tessere Punti', feature: null },
    { id: 'members', icon: MdPeople, label: 'Clienti', feature: null },
    { id: 'loyalty-tiers', icon: MdStar, label: 'Livelli Fedeltà', feature: 'loyaltyTiers' },
    { id: 'rewards', icon: MdCardGiftcard, label: 'Premi', feature: 'rewards' },
    { id: 'gift-certificates', icon: MdCardGiftcard, label: 'Gift Certificates', feature: null },
    { id: 'subscriptions', icon: MdCardGiftcard, label: 'Membership', feature: null },
    { id: 'categories', icon: MdCategory, label: 'Categorie', feature: 'categories' },
    { id: 'marketing-campaigns', icon: MdEmail, label: 'Campagne Marketing', feature: 'marketingCampaigns' },
    { id: 'team-management', icon: MdPersonAdd, label: 'Gestione Team', feature: 'teamManagement' },
    { id: 'pos-integration', icon: MdFlashOn, label: 'Integrazione POS', feature: 'posIntegration' },
    { id: 'notifications', icon: MdNotifications, label: 'Notifiche', feature: 'notifications' },
    { id: 'analytics-reports', icon: MdAnalytics, label: 'Analytics & Report', feature: 'analyticsReports' },
    { id: 'branding-social', icon: MdPalette, label: 'Branding & Social', feature: 'brandingSocial' },
    { id: 'website-editor', icon: MdLanguage, label: 'Il Mio Sito Web', feature: null },
    { id: 'channels', icon: MdPublic, label: 'Canali Integrazione', feature: 'channelsIntegration' },
    { id: 'communications', icon: MdCampaign, label: 'Comunicazioni', feature: null },
    { id: 'settings', icon: MdSettings, label: 'Impostazioni', feature: null },
    { id: 'support', icon: MdHelp, label: 'Aiuto & Supporto', feature: null }
  ];

  // Add locked status based on user plan (like desktop)
  const menuItems = baseMenuItems.map(item => ({
    ...item,
    locked: item.feature ? !hasAccess(userPlan, item.feature as any) : false,
    color: item.locked ? '#6b7280' : getItemColor(item.id)
  }));

  // Color mapping function
  function getItemColor(id: string): string {
    const colorMap: { [key: string]: string } = {
      'dashboard': '#ef4444',
      'stamps': '#10b981',
      'members': '#3b82f6',
      'loyalty-tiers': '#f59e0b',
      'rewards': '#10b981',
      'categories': '#8b5cf6',
      'marketing-campaigns': '#f59e0b',
      'team-management': '#3b82f6',
      'pos-integration': '#10b981',
      'notifications': '#f59e0b',
      'analytics-reports': '#8b5cf6',
      'branding-social': '#ef4444',
      'website-editor': '#10b981',
      'channels': '#6b7280',
      'communications': '#f59e0b',
      'settings': '#6b7280',
      'support': '#ef4444'
    };
    return colorMap[id] || '#6b7280';
  }

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
              console.log('<� BACKDROP CLICKED!');
              onClose();
            } else {
              console.log('<� BACKDROP IGNORED (too early)');
            }
          }}
        />
      )}

      {/* Sidebar */}
      <div className={`pos-sidebar ${isOpen ? 'pos-sidebar-open' : ''}`}>
        {/* Header Sidebar */}
        <div className="pos-sidebar-header">
          {currentOrganization?.logo_url ? (
            <div className="pos-org-logo">
              <img
                src={currentOrganization.logo_url}
                alt={currentOrganization.name || 'Logo'}
                className="pos-sidebar-logo"
              />
            </div>
          ) : (
            <img
              src="https://sjvatdnvewohvswfrdiv.supabase.co/storage/v1/object/public/IMG/OMNILYPRO.png"
              alt="OMNILY PRO"
              className="pos-sidebar-logo"
            />
          )}
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
              className={`pos-menu-item ${activeSection === item.id ? 'pos-menu-item-active' : ''} ${item.locked ? 'pos-menu-item-locked' : ''}`}
              style={{ '--item-color': item.color } as React.CSSProperties}
              disabled={item.locked && activeSection === item.id}
            >
              <span className="pos-menu-icon">
                <item.icon size={24} />
              </span>
              <span className="pos-menu-label">{item.label}</span>
              {item.locked && (
                <span className="pos-lock-icon">
                  <MdLock size={16} />
                </span>
              )}
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
