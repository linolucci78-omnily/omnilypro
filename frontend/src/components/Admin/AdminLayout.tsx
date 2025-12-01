import React, { useState, useEffect } from 'react'
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { usersService, type SystemUser } from '../../services/usersService'
import {
  Building2,
  Users,
  BarChart3,
  Settings,
  CreditCard,
  Globe,
  Shield,
  Bell,
  FileText,
  HelpCircle,
  Database,
  Activity,
  Mail,
  Palette,
  Package,
  Menu,
  ChevronLeft,
  ChevronRight,
  Home,
  LogOut,
  User,
  Smartphone,
  Truck,
  Factory,
  Target,
  Clock,
  UserCog,
  FileSignature,
  Sparkles,
  Gift,
  Ticket,
  Download,
  Crown,
  Presentation,
  ChevronDown,
  Coins
} from 'lucide-react'
import './AdminLayout.css'

interface MenuItem {
  path: string;
  icon: any;
  label: string;
  exact?: boolean;
  disabled?: boolean;
}

interface MenuGroup {
  group: string;
  items: MenuItem[];
}

const AdminLayout = () => {
  const { user, signOut, isSuperAdmin, userRole } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarClosed, setSidebarClosed] = useState(false)
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<SystemUser | null>(null)

  // DEBUG LOG per POS
  console.log('🏢 AdminLayout mounted:', {
    path: location.pathname,
    isSuperAdmin,
    userRole,
    userAgent: navigator.userAgent
  });

  // Load current user data - refresh on route change to pick up profile updates
  useEffect(() => {
    if (user) {
      loadCurrentUser()
    }
  }, [user, location.pathname])

  // Listen for profile updates and refresh user data
  useEffect(() => {
    const handleProfileUpdate = () => {
      if (user) {
        loadCurrentUser()
      }
    }

    window.addEventListener('user-profile-updated', handleProfileUpdate)
    return () => {
      window.removeEventListener('user-profile-updated', handleProfileUpdate)
    }
  }, [user])

  const loadCurrentUser = async () => {
    try {
      if (!user) return
      const userData = await usersService.getUser(user.id)
      setCurrentUser(userData)
    } catch (error) {
      console.error('Error loading current user:', error)
    }
  }

  const handleLogout = async () => {
    try {
      await signOut()
      navigate('/login')
    } catch (error) {
      console.error('❌ Logout error:', error)
    }
  }

  const menuItems: MenuGroup[] = [
    {
      group: 'Founder Dashboard',
      items: [
        { path: '/admin', icon: Home, label: 'Panoramica', exact: true },
        { path: '/admin/control-center', icon: Activity, label: 'Control Center', disabled: false },
        { path: '/admin/system-overview', icon: BarChart3, label: 'System Overview' },
        { path: '/admin/root-access', icon: Shield, label: 'Root Access Control' },
        { path: '/admin/founders', icon: Crown, label: 'Founder Management' }
      ]
    },
    {
      group: 'Analytics',
      items: [
        { path: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
        { path: '/admin/activity', icon: Activity, label: 'Log Attività' }
      ]
    },
    {
      group: 'Gestione',
      items: [
        { path: '/admin/users', icon: UserCog, label: 'Gestione Utenti' },
        { path: '/admin/organizations', icon: Building2, label: 'Aziende' },
        { path: '/admin/business-owners', icon: Users, label: 'Clienti Aziendali' },
        { path: '/admin/pending-customers', icon: Clock, label: 'Clienti da Attivare' },
        { path: '/admin/crm', icon: Target, label: 'CRM & Marketing' },
        { path: '/admin/demo-requests', icon: Presentation, label: 'Richieste Demo' },
        { path: '/admin/contracts', icon: FileSignature, label: 'Contratti e Firme' },
        { path: '/admin/supplier-orders', icon: Factory, label: 'Ordini Fornitori' },
        { path: '/admin/hardware-orders', icon: Truck, label: 'Ordini Hardware' },
        { path: '/admin/mdm', icon: Smartphone, label: 'Gestione Dispositivi' },
        { path: '/admin/inventory', icon: Package, label: 'Inventario' },
        { path: '/admin/subscriptions', icon: CreditCard, label: 'Abbonamenti' },
        { path: '/admin/memberships', icon: Ticket, label: 'Membership' },
        { path: '/admin/gift-certificates', icon: Gift, label: 'Gift Certificates' },
        { path: '/admin/omny', icon: Coins, label: 'OMNY Management' }
      ]
    },
    {
      group: 'Sistema',
      items: [
        { path: '/admin/settings', icon: Settings, label: 'Impostazioni' },
        { path: '/admin/stripe-config', icon: CreditCard, label: 'Configurazione Stripe' },
        { path: '/admin/subscription-plans', icon: Crown, label: 'Piani Organizzazioni' },
        { path: '/admin/security', icon: Shield, label: 'Sicurezza' },
        { path: '/admin/notifications', icon: Bell, label: 'Notifiche' },
        { path: '/admin/database', icon: Database, label: 'Database' },
        { path: '/admin/downloads', icon: Download, label: 'Download Tools' }
      ]
    },
    {
      group: 'Personalizzazione',
      items: [
        { path: '/admin/branding', icon: Palette, label: 'Brand & Temi' },
        { path: '/admin/websites-v2', icon: Sparkles, label: 'Gestione Siti V2 (NEW)' },
        { path: '/admin/websites', icon: Globe, label: 'Gestione Siti (OLD)' },
        { path: '/admin/domains', icon: Globe, label: 'Domini' },
        { path: '/admin/emails', icon: Mail, label: 'Email Templates' },
        { path: '/admin/reports', icon: FileText, label: 'Report' }
      ]
    },
    {
      group: 'Supporto',
      items: [
        { path: '/admin/support', icon: HelpCircle, label: 'Richieste Support' },
        { path: '/admin/docs', icon: FileText, label: 'Documentazione' }
      ]
    }
  ]

  const isActive = (path: string, exact = false) => {
    if (exact) {
      return location.pathname === path
    }
    return location.pathname.startsWith(path)
  }

  // Add admin-page class to body when in admin area
  React.useEffect(() => {
    document.body.classList.add('admin-page')
    return () => {
      document.body.classList.remove('admin-page')
    }
  }, [])

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <div className={`admin-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        {/* Sidebar Header */}
        <div className="sidebar-header">
          <div className="admin-logo">
            <img
              src="https://sjvatdnvewohvswfrdiv.supabase.co/storage/v1/object/public/IMG/OMNILYPRO.png"
              alt="OMNILY Logo"
              style={{ width: '24px', height: '24px', objectFit: 'contain' }}
            />
            <span className="logo-text">OMNILY Admin</span>
          </div>
          <button
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            title={sidebarOpen ? "Chiudi sidebar" : "Apri sidebar"}
          >
            {sidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
          </button>
        </div>

        {/* User Info */}
        <Link to="/admin/profile" className="admin-user-info">
          <div className="user-avatar">
            {currentUser?.avatar_url ? (
              <img src={currentUser.avatar_url} alt={currentUser.first_name || 'User'} />
            ) : (
              <User size={20} />
            )}
          </div>
          <div className="user-details">
            <div className="user-name">
              {currentUser?.first_name && currentUser?.last_name
                ? `${currentUser.first_name} ${currentUser.last_name}`
                : currentUser?.first_name || currentUser?.last_name || user?.email || 'Admin'}
            </div>
            <div className="user-role">
              OMNILY Admin
            </div>
          </div>
        </Link>

        {/* Navigation Menu */}
        <nav className="admin-nav">
          {menuItems.map(group => (
            <div key={group.group} className="nav-group">
              <div className="nav-group-title">{group.group}</div>
              <ul className="nav-items">
                {group.items.map(item => (
                  <li key={item.path}>
                    {item.disabled ? (
                      <div className="nav-link disabled" title="Funzionalità in arrivo">
                        <item.icon size={18} />
                        <span className="nav-text">{item.label}</span>
                        <span className="coming-soon-badge">Prossimamente</span>
                      </div>
                    ) : (
                      <Link
                        to={item.path}
                        className={`nav-link ${isActive(item.path, item.exact) ? 'active' : ''}`}
                      >
                        <item.icon size={18} />
                        <span className="nav-text">{item.label}</span>
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="sidebar-footer">
          <Link to="/" className="footer-link">
            <Home size={16} />
            <span>Torna al Sito</span>
          </Link>
          <button onClick={handleLogout} className="footer-link">
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="admin-content">
        {/* Top Bar */}
        <div className="admin-topbar">
          <div className="topbar-left">
            {!sidebarOpen && (
              <button
                className="mobile-menu-btn"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu size={20} />
              </button>
            )}
            <div className="breadcrumb">
              <span className="breadcrumb-item">Admin</span>
              <span className="breadcrumb-separator">/</span>
              <span className="breadcrumb-item current">
                {menuItems
                  .flatMap(g => g.items)
                  .find(item => isActive(item.path, item.exact))?.label || 'Dashboard'}
              </span>
            </div>
          </div>

          <div className="topbar-right">
            <div className="system-status">
              <div className="status-indicator online"></div>
              <span>Sistema Online</span>
            </div>

            <button className="notification-btn">
              <Bell size={18} />
              <span className="notification-badge">3</span>
            </button>

            <div className="admin-profile-dropdown">
              <button
                className="profile-trigger"
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              >
                <div className="profile-avatar">
                  {currentUser?.avatar_url ? (
                    <img src={currentUser.avatar_url} alt={currentUser.first_name || 'User'} />
                  ) : (
                    <User size={18} />
                  )}
                </div>
                <div className="profile-info">
                  <div className="profile-name">
                    {currentUser?.first_name && currentUser?.last_name
                      ? `${currentUser.first_name} ${currentUser.last_name}`
                      : currentUser?.first_name || currentUser?.last_name || user?.email || 'Admin'}
                  </div>
                  <div className="profile-role">
                    OMNILY Admin
                  </div>
                </div>
                <ChevronDown size={16} />
              </button>

              {profileDropdownOpen && (
                <>
                  <div
                    className="profile-dropdown-overlay"
                    onClick={() => setProfileDropdownOpen(false)}
                  />
                  <div className="profile-dropdown-menu">
                    <Link
                      to="/admin/profile"
                      className="dropdown-item"
                      onClick={() => setProfileDropdownOpen(false)}
                    >
                      <User size={16} />
                      Il Mio Profilo
                    </Link>
                    <Link
                      to="/admin/settings"
                      className="dropdown-item"
                      onClick={() => setProfileDropdownOpen(false)}
                    >
                      <Settings size={16} />
                      Impostazioni
                    </Link>
                    <div className="dropdown-divider" />
                    <button
                      className="dropdown-item danger"
                      onClick={() => {
                        setProfileDropdownOpen(false)
                        handleLogout()
                      }}
                    >
                      <LogOut size={16} />
                      Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="admin-main" style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
          <Outlet />
        </div>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}

export default AdminLayout