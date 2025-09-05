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
    { month: 'Gen', stamps: 1200, redemptions: 800 },
    { month: 'Feb', stamps: 1350, redemptions: 950 },
    { month: 'Mar', stamps: 1400, redemptions: 1000 },
    { month: 'Apr', stamps: 1250, redemptions: 850 },
    { month: 'Mag', stamps: 1500, redemptions: 1100 },
    { month: 'Giu', stamps: 1380, redemptions: 980 },
    { month: 'Lug', stamps: 1420, redemptions: 1020 },
    { month: 'Ago', stamps: 1480, redemptions: 1080 },
    { month: 'Set', stamps: 1520, redemptions: 1120 },
    { month: 'Ott', stamps: 1600, redemptions: 1200 },
    { month: 'Nov', stamps: 1450, redemptions: 1050 },
    { month: 'Dic', stamps: 1300, redemptions: 900 }
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
    { id: 'stamps', icon: Target, label: 'Tessere Punti' },
    { id: 'members', icon: Users, label: 'Clienti' },
    { id: 'communications', icon: Gift, label: 'Comunicazioni' },
    { id: 'campaigns', icon: TrendingUp, label: 'Campagne' },
    { id: 'settings', icon: Settings, label: 'Impostazioni' },
    { id: 'support', icon: HelpCircle, label: 'Aiuto & Supporto' }
  ]

  const renderContent = () => {
    switch (activeSection) {
      case 'stamps':
        return (
          <div className="section-content">
            <h2>Gestione Tessere Punti</h2>
            <div className="cards-grid">
              <div className="feature-card">
                <h3>Configura Tessere</h3>
                <p>Crea e personalizza le tessere punti per i tuoi clienti</p>
                <button className="btn-primary">Configura</button>
              </div>
              <div className="feature-card">
                <h3>Statistiche Punti</h3>
                <p>Visualizza le performance delle tessere punti</p>
                <button className="btn-primary">Visualizza</button>
              </div>
            </div>
          </div>
        )
      
      case 'members':
        return (
          <div className="section-content">
            <h2>Gestione Clienti</h2>
            <div className="cards-grid">
              <div className="feature-card">
                <h3>Lista Clienti</h3>
                <p>Visualizza e gestisci tutti i tuoi clienti iscritti</p>
                <button className="btn-primary">Vai alla Lista</button>
              </div>
              <div className="feature-card">
                <h3>Segmentazione</h3>
                <p>Crea segmenti di clienti per campagne mirate</p>
                <button className="btn-primary">Crea Segmenti</button>
              </div>
            </div>
          </div>
        )
      
      case 'communications':
        return (
          <div className="section-content">
            <h2>Comunicazioni</h2>
            <div className="cards-grid">
              <div className="feature-card">
                <h3>Email Marketing</h3>
                <p>Invia email personalizzate ai tuoi clienti</p>
                <button className="btn-primary">Crea Email</button>
              </div>
              <div className="feature-card">
                <h3>Notifiche Push</h3>
                <p>Gestisci le notifiche push dell'app</p>
                <button className="btn-primary">Configura</button>
              </div>
            </div>
          </div>
        )
      
      case 'campaigns':
        return (
          <div className="section-content">
            <h2>Campagne Marketing</h2>
            <div className="cards-grid">
              <div className="feature-card">
                <h3>Campagne Attive</h3>
                <p>Monitora le tue campagne marketing in corso</p>
                <button className="btn-primary">Visualizza</button>
              </div>
              <div className="feature-card">
                <h3>Nuova Campagna</h3>
                <p>Crea una nuova campagna promozionale</p>
                <button className="btn-primary">Crea</button>
              </div>
            </div>
          </div>
        )
      
      case 'settings':
        return (
          <div className="section-content">
            <h2>Impostazioni</h2>
            
            <div className="cards-grid">
              <div className="feature-card">
                <h3>Configurazione Account</h3>
                <p>Gestisci le impostazioni del tuo account e profilo</p>
                <button className="btn-primary">Configura</button>
              </div>
              <div className="feature-card">
                <h3>Fatturazione</h3>
                <p>Visualizza e gestisci i tuoi piani di abbonamento</p>
                <button className="btn-primary">Gestisci</button>
              </div>
              <div className="feature-card">
                <h3>Sicurezza</h3>
                <p>Configura autenticazione e permessi di accesso</p>
                <button className="btn-primary">Sicurezza</button>
              </div>
              <div className="feature-card">
                <h3>API & Integrazioni</h3>
                <p>Gestisci chiavi API e integrazioni esterne</p>
                <button className="btn-primary">API</button>
              </div>
            </div>
          </div>
        )
      
      case 'support':
        return (
          <div className="section-content">
            <h2>Aiuto & Supporto</h2>
            <div className="cards-grid">
              <div className="feature-card">
                <h3>Centro Assistenza</h3>
                <p>Trova risposte alle domande più frequenti</p>
                <button className="btn-primary">Esplora</button>
              </div>
              <div className="feature-card">
                <h3>Contatta il Supporto</h3>
                <p>Richiedi assistenza tecnica personalizzata</p>
                <button className="btn-primary">Contatta</button>
              </div>
            </div>
          </div>
        )
      
      default:
        return (
          <div className="dashboard-content">
            {/* Organizations Section */}
            {organizations.length > 0 && (
              <div className="organizations-section">
                <h3 className="section-subtitle">Le Tue Organizzazioni</h3>
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

            <div className="dashboard-filters">
              <select className="filter-select">
                <option>Tutte le Sedi</option>
              </select>
              <select className="filter-select">
                <option>Tutte le Offerte</option>
              </select>
              <select className="filter-select">
                <option>Sempre</option>
              </select>
            </div>

            <div className="dashboard-grid">
              {/* Left Column - Metrics */}
              <div className="dashboard-left">
                <div className="metrics-section">
                  <h2 className="section-title">Panoramica</h2>
                  <div className="metrics-grid">
                    <div className="metric-card">
                      <div className="metric-icon stamps">
                        <Target size={24} />
                      </div>
                      <div className="metric-content">
                        <div className="metric-value">{metrics.totalStamps.toLocaleString()}</div>
                        <div className="metric-label">Punti totali</div>
                      </div>
                    </div>
                    
                    <div className="metric-card">
                      <div className="metric-icon offers">
                        <Gift size={24} />
                      </div>
                      <div className="metric-content">
                        <div className="metric-value">{metrics.totalOffers.toLocaleString()}</div>
                        <div className="metric-label">Offerte totali</div>
                      </div>
                    </div>
                    
                    <div className="metric-card">
                      <div className="metric-icon joins">
                        <TrendingUp size={24} />
                      </div>
                      <div className="metric-content">
                        <div className="metric-value">{metrics.totalJoins}</div>
                        <div className="metric-label">Iscrizioni totali</div>
                      </div>
                    </div>
                    
                    <div className="metric-card">
                      <div className="metric-icon customers">
                        <Users size={24} />
                      </div>
                      <div className="metric-content">
                        <div className="metric-value">{metrics.totalCustomers}</div>
                        <div className="metric-label">Clienti totali</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Activity Chart */}
              <div className="dashboard-right">
                <div className="activity-section">
                  <h2 className="section-title">Attività <span className="subtitle">sempre</span></h2>
                  
                  <div className="activity-tabs">
                    <button className="tab-btn active">Punti</button>
                    <button className="tab-btn">Riscatti</button>
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
                            title={`${data.month}: ${data.stamps} punti`}
                          />
                          <div className="chart-month">{data.month}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
    }
  }

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
              Esci
            </button>
          </div>
        </header>

        {renderContent()}
      </div>
    </div>
  )
}

export default OrganizationsDashboard