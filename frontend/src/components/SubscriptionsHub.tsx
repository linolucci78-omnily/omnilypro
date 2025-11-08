import React, { useState, useEffect } from 'react'
import { Package, TrendingUp, Euro, Clock, ArrowLeft, Plus, Settings, BarChart3, Users, Calendar, Trophy, CheckCircle } from 'lucide-react'
import { subscriptionsService } from '../services/subscriptionsService'
import type { SubscriptionTemplate, SubscriptionStats } from '../types/subscription'
import './SubscriptionsHub.css'

interface SubscriptionsHubProps {
  organizationId: string
  organizationName: string
  primaryColor: string
  secondaryColor: string
  onOpenSubscriptionsPanel: (mode?: 'manage' | 'templates') => void
  onOpenStatsModal: () => void
}

const SubscriptionsHub: React.FC<SubscriptionsHubProps> = ({
  organizationId,
  organizationName,
  primaryColor,
  secondaryColor,
  onOpenSubscriptionsPanel,
  onOpenStatsModal
}) => {
  const [templates, setTemplates] = useState<SubscriptionTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<SubscriptionStats>({
    total_active: 0,
    total_paused: 0,
    total_expired: 0,
    total_cancelled: 0,
    total_revenue: 0,
    monthly_revenue: 0,
    total_usages: 0,
    monthly_usages: 0,
    expiring_soon: 0,
    avg_subscription_value: 0,
    renewal_rate: 0
  })

  useEffect(() => {
    fetchData()
  }, [organizationId])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [templatesData, statsData] = await Promise.all([
        subscriptionsService.getTemplates(organizationId),
        subscriptionsService.getStats(organizationId)
      ])
      setTemplates(templatesData.data)
      setStats(statsData)
    } catch (error) {
      console.error('Error fetching subscriptions data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  // Top 3 template più venduti (ordinati per subscriptions attive)
  const topTemplates = [...templates]
    .filter(t => t.is_active)
    .sort((a, b) => (b.active_subscriptions || 0) - (a.active_subscriptions || 0))
    .slice(0, 3)

  // Vista principale Hub
  return (
    <div
      className="subscriptions-hub"
      style={{
        '--primary-color': primaryColor,
        '--secondary-color': secondaryColor
      } as React.CSSProperties}
    >
      <div className="subscriptions-hub-header">
        <div className="subscriptions-hub-header-content">
          <div className="subscriptions-hub-icon">
            <Package size={48} />
          </div>
          <div>
            <h1>Centro Membership</h1>
            <p>Gestisci abbonamenti, template e monitora le performance</p>
          </div>
        </div>
      </div>

      {/* Statistiche Overview */}
      <div className="subscriptions-stats-grid">
        <div className="subscriptions-stat-card">
          <div className="subscriptions-stat-icon" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
            <CheckCircle size={24} />
          </div>
          <div className="subscriptions-stat-content">
            <div className="subscriptions-stat-value">{stats.total_active}</div>
            <div className="subscriptions-stat-label">Abbonamenti Attivi</div>
          </div>
        </div>

        <div className="subscriptions-stat-card">
          <div className="subscriptions-stat-icon" style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}>
            <Euro size={24} />
          </div>
          <div className="subscriptions-stat-content">
            <div className="subscriptions-stat-value">{formatCurrency(stats.total_revenue)}</div>
            <div className="subscriptions-stat-label">Fatturato Totale</div>
          </div>
        </div>

        <div className="subscriptions-stat-card">
          <div className="subscriptions-stat-icon" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
            <TrendingUp size={24} />
          </div>
          <div className="subscriptions-stat-content">
            <div className="subscriptions-stat-value">{stats.total_usages}</div>
            <div className="subscriptions-stat-label">Utilizzi Totali</div>
          </div>
        </div>

        <div className="subscriptions-stat-card">
          <div className="subscriptions-stat-icon" style={{ background: 'linear-gradient(135deg, #ec4899, #db2777)' }}>
            <Clock size={24} />
          </div>
          <div className="subscriptions-stat-content">
            <div className="subscriptions-stat-value">{stats.expiring_soon}</div>
            <div className="subscriptions-stat-label">In Scadenza</div>
          </div>
        </div>
      </div>

      {/* Top 3 Template Più Venduti */}
      {topTemplates.length > 0 && (
        <div className="subscriptions-top-section">
          <h2>
            <Trophy size={28} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />
            Top 3 Template Più Venduti
          </h2>
          <div className="subscriptions-top-grid">
            {topTemplates.map((template, index) => (
              <div key={template.id} className="subscriptions-top-card">
                <div className="subscriptions-top-badge">#{index + 1}</div>
                <div className="subscriptions-top-info">
                  <h3>{template.name}</h3>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0.5rem 0' }}>
                    {template.description}
                  </p>
                  <div className="subscriptions-top-meta">
                    <span className="subscriptions-top-price">{formatCurrency(template.price)}</span>
                    <span className="subscriptions-top-count">{template.active_subscriptions || 0} attivi</span>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginTop: '0.75rem',
                    fontSize: '0.875rem',
                    color: '#6b7280'
                  }}>
                    <Calendar size={16} />
                    <span>{template.duration_days} giorni • {template.total_usages} utilizzi</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Card Azioni Principali */}
      <div className="subscriptions-hub-cards">
        {/* Card: Gestione Abbonamenti */}
        <div
          className="subscriptions-hub-card subscriptions-hub-card-primary"
          onClick={() => onOpenSubscriptionsPanel('manage')}
        >
          <div className="subscriptions-hub-card-icon">
            <Package size={32} />
          </div>
          <div className="subscriptions-hub-card-content">
            <h3>Gestione Abbonamenti</h3>
            <p>Vendi, valida e gestisci gli abbonamenti dei tuoi clienti</p>
            <ul className="subscriptions-hub-card-features">
              <li><Plus size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />Vendi abbonamenti</li>
              <li><CheckCircle size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />Valida utilizzi</li>
              <li><Users size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />Gestisci clienti</li>
              <li><Calendar size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />Monitora scadenze</li>
            </ul>
          </div>
          <div className="subscriptions-hub-card-arrow">→</div>
        </div>

        {/* Card: Template Personalizzati */}
        <div
          className="subscriptions-hub-card subscriptions-hub-card-secondary"
          onClick={() => onOpenSubscriptionsPanel('templates')}
        >
          <div className="subscriptions-hub-card-icon">
            <Settings size={32} />
          </div>
          <div className="subscriptions-hub-card-content">
            <h3>Template Personalizzati</h3>
            <p>Crea template abbonamenti adatti alla tua attività</p>
            <ul className="subscriptions-hub-card-features">
              <li><Plus size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />Crea nuovi template</li>
              <li><Package size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />Configura utilizzi</li>
              <li><Euro size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />Imposta prezzi</li>
              <li><Calendar size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />Definisci durata</li>
            </ul>
          </div>
          <div className="subscriptions-hub-card-arrow">→</div>
        </div>

        {/* Card: Statistiche & Report */}
        <div
          className="subscriptions-hub-card subscriptions-hub-card-tertiary"
          onClick={onOpenStatsModal}
        >
          <div className="subscriptions-hub-card-icon">
            <BarChart3 size={32} />
          </div>
          <div className="subscriptions-hub-card-content">
            <h3>Statistiche & Report</h3>
            <p>Monitora vendite, utilizzi e performance abbonamenti</p>
            <ul className="subscriptions-hub-card-features">
              <li><TrendingUp size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />Performance vendite</li>
              <li><Euro size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />Revenue analytics</li>
              <li><Users size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />Engagement clienti</li>
              <li><Clock size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />Tasso rinnovo</li>
            </ul>
          </div>
          <div className="subscriptions-hub-card-arrow">→</div>
        </div>
      </div>
    </div>
  )
}

export default SubscriptionsHub
