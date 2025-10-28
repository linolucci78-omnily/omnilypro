import React, { useState } from 'react'
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
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
  Gift
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
  const { signOut, isSuperAdmin, userRole } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarClosed, setSidebarClosed] = useState(false)
  
  // DEBUG LOG per POS
  console.log('🏢 AdminLayout mounted:', { 
    path: location.pathname, 
    isSuperAdmin, 
    userRole,
    userAgent: navigator.userAgent
  });

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
      group: 'Dashboard',
      items: [
        { path: '/admin', icon: Home, label: 'Panoramica', exact: true },
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
        { path: '/admin/contracts', icon: FileSignature, label: 'Contratti e Firme' },
        { path: '/admin/supplier-orders', icon: Factory, label: 'Ordini Fornitori' },
        { path: '/admin/hardware-orders', icon: Truck, label: 'Ordini Hardware' },
        { path: '/admin/mdm', icon: Smartphone, label: 'Gestione Dispositivi' },
        { path: '/admin/inventory', icon: Package, label: 'Inventario' },
        { path: '/admin/subscriptions', icon: CreditCard, label: 'Abbonamenti' },
        { path: '/admin/gift-certificates', icon: Gift, label: 'Gift Certificates' }
      ]
    },
    {
      group: 'Sistema',
      items: [
        { path: '/admin/settings', icon: Settings, label: 'Impostazioni' },
        { path: '/admin/security', icon: Shield, label: 'Sicurezza' },
        { path: '/admin/notifications', icon: Bell, label: 'Notifiche' },
        { path: '/admin/database', icon: Database, label: 'Database' }
      ]
    },
    {
      group: 'Personalizzazione',
      items: [
        { path: '/admin/branding', icon: Palette, label: 'Brand & Temi' },
        { path: '/admin/websites-v2', icon: Sparkles, label: 'Gestione Siti V2 (NEW)' },
        { path: '/admin/websites', icon: Globe, label: 'Gestione Siti (OLD)' },
        { path: '/admin/domains', icon: Globe, label: 'Domini', disabled: true },
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
        <div className="admin-user-info">
          <div className="user-avatar">
            <User size={20} />
          </div>
          <div className="user-details">
            <div className="user-name">Super Admin</div>
            <div className="user-role">Amministratore Sistema</div>
          </div>
        </div>

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

            <div className="admin-profile">
              <div className="profile-avatar">
                <User size={18} />
              </div>
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