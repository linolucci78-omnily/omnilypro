import React, { useState, useEffect } from 'react'
import { organizationsApi } from '../lib/supabase'
import type { Organization } from '../lib/supabase'
import { BarChart3, Users, Gift, Target, TrendingUp, Calendar, Settings, HelpCircle, LogOut } from 'lucide-react'
import './OrganizationsDashboard.css'

const OrganizationsDashboard: React.FC = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState('dashboard')

  // Mock data for demo - replace with real data
  const metrics = {
    totalStamps: 17568,
    totalOffers: 1790, 
    totalJoins: 845,
    totalCustomers: 862
  }

  const chartData = [
    { month: 'Jan', stamps: 1200, redemptions: 800 },
    { month: 'Feb', stamps: 1350, redemptions: 950 },
    { month: 'Mar', stamps: 1400, redemptions: 1000 },
    { month: 'Apr', stamps: 1250, redemptions: 850 },
    { month: 'May', stamps: 1500, redemptions: 1100 },
    { month: 'Jun', stamps: 1380, redemptions: 980 },
    { month: 'Jul', stamps: 1420, redemptions: 1020 },
    { month: 'Aug', stamps: 1480, redemptions: 1080 },
    { month: 'Sep', stamps: 1520, redemptions: 1120 },
    { month: 'Oct', stamps: 1600, redemptions: 1200 },
    { month: 'Nov', stamps: 1450, redemptions: 1050 },
    { month: 'Dec', stamps: 1300, redemptions: 900 }
  ]

  useEffect(() => {
    fetchOrganizations()
  }, [])

  const fetchOrganizations = async () => {
    try {
      setLoading(true)
      const data = await organizationsApi.getAll()
      setOrganizations(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nel caricamento')
    } finally {
      setLoading(false)
    }
  }

  const sidebarItems = [
    { id: 'dashboard', icon: BarChart3, label: 'Dashboard' },
    { id: 'stamps', icon: Target, label: 'Stamp Cards' },
    { id: 'members', icon: Users, label: 'Members' },
    { id: 'communications', icon: Gift, label: 'Communications' },
    { id: 'campaigns', icon: TrendingUp, label: 'Campaigns' },
    { id: 'support', icon: HelpCircle, label: 'Help & Support' }
  ]

  if (loading) return <div className="loading">🔄 Caricamento...</div>
  if (error) return <div className="error">❌ Errore: {error}</div>

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <div className="logo">
            <div className="logo-icon">O</div>
            <span className="logo-text">OMNILY PRO</span>
          </div>
          <div className="merchant-console">MERCHANT CONSOLE</div>
        </div>

        <nav className="sidebar-nav">
          {sidebarItems.map(item => {
            const IconComponent = item.icon
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`nav-item ${activeSection === item.id ? 'active' : ''}`}
              >
                <IconComponent size={20} />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="version">Version 0.1.0 (48)</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <header className="main-header">
          <div className="header-title">
            <BarChart3 size={24} />
            <span>OMNILY PRO - Dashboard</span>
          </div>
          <div className="header-actions">
            <button className="btn-logout">
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </header>

        <div className="dashboard-filters">
          <select className="filter-select">
            <option>All Venues</option>
          </select>
          <select className="filter-select">
            <option>All Offers</option>
          </select>
          <select className="filter-select">
            <option>All Time</option>
          </select>
        </div>

        {/* Metrics Cards */}
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-icon stamps">
              <Target size={24} />
            </div>
            <div className="metric-content">
              <div className="metric-value">{metrics.totalStamps.toLocaleString()}</div>
              <div className="metric-label">Stamps all time</div>
            </div>
          </div>
          
          <div className="metric-card">
            <div className="metric-icon offers">
              <Gift size={24} />
            </div>
            <div className="metric-content">
              <div className="metric-value">{metrics.totalOffers.toLocaleString()}</div>
              <div className="metric-label">Offers all time</div>
            </div>
          </div>
          
          <div className="metric-card">
            <div className="metric-icon joins">
              <TrendingUp size={24} />
            </div>
            <div className="metric-content">
              <div className="metric-value">{metrics.totalJoins}</div>
              <div className="metric-label">Joins all time</div>
            </div>
          </div>
          
          <div className="metric-card">
            <div className="metric-icon customers">
              <Users size={24} />
            </div>
            <div className="metric-content">
              <div className="metric-value">{metrics.totalCustomers}</div>
              <div className="metric-label">Total customers</div>
            </div>
          </div>
        </div>

        {/* Activity Section */}
        <div className="activity-section">
          <h2 className="section-title">Activity <span className="subtitle">all time</span></h2>
          
          <div className="activity-tabs">
            <button className="tab-btn active">Stamps</button>
            <button className="tab-btn">Redemptions</button>
          </div>
          
          <div className="chart-container">
            <div className="chart-y-axis">
              <div>1800</div>
              <div>1400</div>
              <div>1000</div>
              <div>600</div>
              <div>200</div>
              <div>0</div>
            </div>
            <div className="chart-bars">
              {chartData.map((data, index) => (
                <div key={data.month} className="chart-bar-group">
                  <div 
                    className="chart-bar stamps-bar"
                    style={{ height: `${(data.stamps / 1800) * 100}%` }}
                    title={`${data.month}: ${data.stamps} stamps`}
                  />
                  <div className="chart-month">{data.month}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Organizations Section */}
        {organizations.length > 0 && (
          <div className="organizations-section">
            <h2 className="section-title">Organizations</h2>
            <div className="organizations-grid">
              {organizations.map(org => (
                <div key={org.id} className="org-card">
                  <div className="org-header">
                    <div className="org-name">{org.name}</div>
                    <div className="org-slug">{org.slug}</div>
                  </div>
                  <div className={`org-plan plan-${org.plan_type}`}>
                    {org.plan_type.toUpperCase()}
                  </div>
                  <div className="org-details">
                    <div className="detail-item">
                      <div className="detail-value">{org.max_customers}</div>
                      <div className="detail-label">Max Clienti</div>
                    </div>
                    <div className="detail-item">
                      <div className="detail-value">{org.max_workflows}</div>
                      <div className="detail-label">Max Workflows</div>
                    </div>
                  </div>
                  <div className="color-preview">
                    <div 
                      className="color-box" 
                      style={{ backgroundColor: org.primary_color }}
                      title={`Primary: ${org.primary_color}`}
                    />
                    <div 
                      className="color-box" 
                      style={{ backgroundColor: org.secondary_color }}
                      title={`Secondary: ${org.secondary_color}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default OrganizationsDashboard