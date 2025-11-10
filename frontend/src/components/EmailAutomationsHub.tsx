import React, { useState, useEffect } from 'react'
import { Mail, Send, ArrowLeft, Eye, Palette, Smartphone, Trophy, Settings, TrendingUp, Users, Gift, Award, Cake, CheckCircle, Clock, BarChart3 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import EmailAutomationsPanel from './EmailAutomationsPanel'
import './EmailAutomationsHub.css'

interface EmailAutomation {
  id: string
  organization_id: string
  automation_type: 'welcome' | 'tier_upgrade' | 'birthday' | 'special_event'
  name: string
  description: string | null
  enabled: boolean
  template_id: string | null
  send_days_before: number
  send_time: string
  total_sent: number
  total_opened: number
  total_clicked: number
  total_failed: number
  last_sent_at: string | null
  created_at: string
  updated_at: string
}

interface EmailAutomationsHubProps {
  organizationId: string
  organizationName: string
  primaryColor: string
  secondaryColor: string
}

type ViewType = 'hub' | 'manage'

const EmailAutomationsHub: React.FC<EmailAutomationsHubProps> = ({
  organizationId,
  organizationName,
  primaryColor,
  secondaryColor
}) => {
  const [activeView, setActiveView] = useState<ViewType>('hub')
  const [automations, setAutomations] = useState<EmailAutomation[]>([])
  const [loading, setLoading] = useState(true)
  const [showAutomationsPanel, setShowAutomationsPanel] = useState(false)

  useEffect(() => {
    fetchAutomations()
  }, [organizationId])

  const fetchAutomations = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('email_automations')
        .select('*')
        .eq('organization_id', organizationId)
        .order('automation_type')

      if (error) throw error
      setAutomations(data || [])
    } catch (error) {
      console.error('Error fetching email automations:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calcola statistiche aggregate
  const stats = {
    totalAutomations: automations.length,
    activeAutomations: automations.filter(a => a.enabled).length,
    totalSent: automations.reduce((sum, a) => sum + a.total_sent, 0),
    totalOpened: automations.reduce((sum, a) => sum + a.total_opened, 0),
    averageOpenRate: automations.length > 0 && automations.reduce((sum, a) => sum + a.total_sent, 0) > 0
      ? ((automations.reduce((sum, a) => sum + a.total_opened, 0) / automations.reduce((sum, a) => sum + a.total_sent, 0)) * 100).toFixed(1)
      : '0'
  }

  // Top 3 automazioni più performanti (ordinati per open rate)
  const topAutomations = [...automations]
    .filter(a => a.total_sent > 0)
    .sort((a, b) => {
      const aRate = (a.total_opened / a.total_sent) * 100
      const bRate = (b.total_opened / b.total_sent) * 100
      return bRate - aRate
    })
    .slice(0, 3)

  const getAutomationIcon = (type: string) => {
    switch (type) {
      case 'welcome': return <Mail size={24} />
      case 'tier_upgrade': return <Award size={24} />
      case 'birthday': return <Cake size={24} />
      case 'special_event': return <Gift size={24} />
      default: return <Mail size={24} />
    }
  }

  const getAutomationColor = (type: string) => {
    switch (type) {
      case 'welcome': return '#3b82f6'
      case 'tier_upgrade': return '#f59e0b'
      case 'birthday': return '#ec4899'
      case 'special_event': return '#10b981'
      default: return '#6b7280'
    }
  }

  // Vista gestione completa
  if (activeView === 'manage') {
    return (
      <div>
        <button
          className="back-button"
          onClick={() => {
            setActiveView('hub')
            fetchAutomations()
          }}
          style={{ color: primaryColor }}
        >
          <ArrowLeft size={20} />
          <span>Torna a Email Automations</span>
        </button>
        <EmailAutomationsPanel
          isOpen={true}
          onClose={() => setActiveView('hub')}
          organizationId={organizationId}
          organizationName={organizationName}
          fullpage={true}
        />
      </div>
    )
  }

  // Vista principale Hub
  return (
    <div
      className="email-automations-hub"
      style={{
        '--primary-color': primaryColor,
        '--secondary-color': secondaryColor
      } as React.CSSProperties}
    >
      <div className="email-automations-hub-header">
        <div className="email-automations-hub-header-content">
          <div className="email-automations-hub-icon">
            <Mail size={48} />
          </div>
          <div>
            <h1>Centro Email Automations</h1>
            <p>Gestisci le automazioni email e monitora le performance</p>
          </div>
        </div>
      </div>

      {/* Statistiche Overview */}
      <div className="email-automations-stats-grid">
        <div className="email-automations-stat-card">
          <div className="email-automations-stat-icon" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
            <Settings size={24} />
          </div>
          <div className="email-automations-stat-content">
            <div className="email-automations-stat-value">{stats.activeAutomations}/{stats.totalAutomations}</div>
            <div className="email-automations-stat-label">Automazioni Attive</div>
          </div>
        </div>

        <div className="email-automations-stat-card">
          <div className="email-automations-stat-icon" style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}>
            <Send size={24} />
          </div>
          <div className="email-automations-stat-content">
            <div className="email-automations-stat-value">{stats.totalSent}</div>
            <div className="email-automations-stat-label">Email Inviate</div>
          </div>
        </div>

        <div className="email-automations-stat-card">
          <div className="email-automations-stat-icon" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
            <Mail size={24} />
          </div>
          <div className="email-automations-stat-content">
            <div className="email-automations-stat-value">{stats.totalOpened}</div>
            <div className="email-automations-stat-label">Email Aperte</div>
          </div>
        </div>

        <div className="email-automations-stat-card">
          <div className="email-automations-stat-icon" style={{ background: 'linear-gradient(135deg, #ec4899, #db2777)' }}>
            <TrendingUp size={24} />
          </div>
          <div className="email-automations-stat-content">
            <div className="email-automations-stat-value">{stats.averageOpenRate}%</div>
            <div className="email-automations-stat-label">Tasso Apertura</div>
          </div>
        </div>
      </div>

      {/* Top 3 Automazioni Più Performanti */}
      {topAutomations.length > 0 && (
        <div className="email-automations-top-section">
          <h2>
            <Trophy size={28} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />
            Top 3 Automazioni Più Performanti
          </h2>
          <div className="email-automations-top-grid">
            {topAutomations.map((automation, index) => {
              const openRate = ((automation.total_opened / automation.total_sent) * 100).toFixed(1)
              const color = getAutomationColor(automation.automation_type)

              return (
                <div key={automation.id} className="email-automations-top-card">
                  <div className="email-automations-top-badge">#{index + 1}</div>
                  <div className="email-automations-top-info">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        background: `${color}20`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: color
                      }}>
                        {getAutomationIcon(automation.automation_type)}
                      </div>
                      <h3>{automation.name}</h3>
                    </div>
                    <div className="email-automations-top-meta">
                      <span className="email-automations-top-sent">{automation.total_sent} inviate</span>
                      <span className="email-automations-top-rate">{openRate}% aperte</span>
                    </div>
                    {automation.enabled && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        marginTop: '0.75rem',
                        fontSize: '0.875rem',
                        color: '#10b981',
                        fontWeight: 600
                      }}>
                        <CheckCircle size={16} />
                        Attiva
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Tutte le Automazioni */}
      <div className="email-automations-list-section">
        <h2>
          <BarChart3 size={28} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />
          Tutte le Automazioni
        </h2>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
            <Clock size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
            <p>Caricamento automazioni...</p>
          </div>
        ) : automations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <Mail size={64} style={{ margin: '0 auto 1rem', color: '#9ca3af' }} />
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#4b5563', margin: '1rem 0 0.5rem 0' }}>
              Nessuna Automazione Configurata
            </h3>
            <p style={{ fontSize: '1rem', color: '#6b7280', margin: '0 0 1.5rem 0' }}>
              Configura le automazioni per inviare email automatiche ai tuoi clienti
            </p>
            <button
              className="btn-primary"
              onClick={() => setShowAutomationsPanel(true)}
              style={{
                background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '12px',
                color: 'white',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Settings size={20} />
              Configura Automazioni
            </button>
          </div>
        ) : (
          <div className="email-automations-grid">
            {automations.map(automation => {
              const openRate = automation.total_sent > 0
                ? ((automation.total_opened / automation.total_sent) * 100).toFixed(1)
                : '0'
              const color = getAutomationColor(automation.automation_type)

              return (
                <div key={automation.id} className="email-automation-card">
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '16px',
                    background: `${color}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: color,
                    marginBottom: '1rem'
                  }}>
                    {getAutomationIcon(automation.automation_type)}
                  </div>

                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1f2937', margin: '0 0 0.5rem 0' }}>
                    {automation.name}
                  </h3>

                  {automation.description && (
                    <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0 0 1rem 0', lineHeight: 1.5 }}>
                      {automation.description}
                    </p>
                  )}

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '0.75rem',
                    marginBottom: '1rem'
                  }}>
                    <div style={{
                      padding: '0.75rem',
                      background: '#f3f4f6',
                      borderRadius: '12px',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1f2937' }}>
                        {automation.total_sent}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 600, marginTop: '0.25rem' }}>
                        Inviate
                      </div>
                    </div>
                    <div style={{
                      padding: '0.75rem',
                      background: '#f3f4f6',
                      borderRadius: '12px',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10b981' }}>
                        {openRate}%
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 600, marginTop: '0.25rem' }}>
                        Apertura
                      </div>
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem',
                    background: automation.enabled ? '#f0fdf4' : '#f3f4f6',
                    borderRadius: '12px',
                    border: `2px solid ${automation.enabled ? '#bbf7d0' : '#e5e7eb'}`
                  }}>
                    {automation.enabled ? (
                      <>
                        <CheckCircle size={16} color="#10b981" />
                        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#10b981' }}>
                          Attiva
                        </span>
                      </>
                    ) : (
                      <>
                        <Clock size={16} color="#6b7280" />
                        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#6b7280' }}>
                          Non Attiva
                        </span>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Card Azioni Principali */}
      <div className="email-automations-hub-cards">
        {/* Card: Gestione Completa */}
        <div
          className="email-automations-hub-card email-automations-hub-card-primary"
          onClick={() => setActiveView('manage')}
        >
          <div className="email-automations-hub-card-icon">
            <Settings size={32} />
          </div>
          <div className="email-automations-hub-card-content">
            <h3>Gestione Automazioni</h3>
            <p>Configura e gestisci le automazioni email per i tuoi clienti</p>
            <ul className="email-automations-hub-card-features">
              <li><Mail size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />Email di benvenuto</li>
              <li><Award size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />Upgrade livello fedeltà</li>
              <li><Cake size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />Auguri di compleanno</li>
              <li><Gift size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />Eventi speciali</li>
            </ul>
          </div>
          <div className="email-automations-hub-card-arrow">→</div>
        </div>

        {/* Card: Analytics */}
        <div
          className="email-automations-hub-card email-automations-hub-card-secondary"
          onClick={() => setShowAutomationsPanel(true)}
        >
          <div className="email-automations-hub-card-icon">
            <BarChart3 size={32} />
          </div>
          <div className="email-automations-hub-card-content">
            <h3>Analytics & Performance</h3>
            <p>Monitora le performance delle tue automazioni email</p>
            <ul className="email-automations-hub-card-features">
              <li><TrendingUp size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />Tassi di apertura e click</li>
              <li><Users size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />Engagement clienti</li>
              <li><Send size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />Email inviate</li>
            </ul>
          </div>
          <div className="email-automations-hub-card-arrow">→</div>
        </div>
      </div>

      {/* Email Automations Panel Modal */}
      {showAutomationsPanel && (
        <EmailAutomationsPanel
          isOpen={showAutomationsPanel}
          onClose={() => {
            setShowAutomationsPanel(false)
            fetchAutomations()
          }}
          organizationId={organizationId}
          organizationName={organizationName}
        />
      )}
    </div>
  )
}

export default EmailAutomationsHub
