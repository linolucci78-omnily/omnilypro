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
  X,
  Home,
  LogOut,
  User,
  Smartphone,
  Truck,
  Factory
} from 'lucide-react'
import './AdminLayout.css'

const AdminLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const location = useLocation()
  const navigate = useNavigate()
  const { signOut } = useAuth()

  const handleLogout = async () => {
    try {
      await signOut()
      navigate('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const menuItems = [
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
        { path: '/admin/organizations', icon: Building2, label: 'Aziende' },
        { path: '/admin/business-owners', icon: Users, label: 'Clienti Aziendali' },
        { path: '/admin/supplier-orders', icon: Factory, label: 'Ordini Fornitori' },
        { path: '/admin/hardware-orders', icon: Truck, label: 'Ordini Hardware' },
        { path: '/admin/mdm', icon: Smartphone, label: 'Gestione Dispositivi' },
        { path: '/admin/inventory', icon: Package, label: 'Inventario' },
        { path: '/admin/subscriptions', icon: CreditCard, label: 'Abbonamenti' }
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

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <div className={`admin-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        {/* Sidebar Header */}
        <div className="sidebar-header">
          <div className="admin-logo">
            <Building2 size={24} />
            <span className="logo-text">OMNILY Admin</span>
          </div>
          <button 
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
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
                    <Link 
                      to={item.path}
                      className={`nav-link ${isActive(item.path, item.exact) ? 'active' : ''}`}
                    >
                      <item.icon size={18} />
                      <span className="nav-text">{item.label}</span>
                    </Link>
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