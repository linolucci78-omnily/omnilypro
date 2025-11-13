import React, { useState, useEffect } from 'react'
import {
  Star,
  Edit3,
  BarChart3,
  Users,
  RefreshCw,
  Layers,
  ArrowLeft,
  TrendingUp,
  Gift,
  Award
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import LoyaltyTiersDisplay from './LoyaltyTiersDisplay'
import LoyaltyTiersConfigPanel from './LoyaltyTiersConfigPanel'
import './LoyaltyTiersHub.css'

interface LoyaltyTiersHubProps {
  organizationId: string
  organization: any
  primaryColor: string
  secondaryColor: string
  onUpdate: () => void
}

type ViewMode = 'hub' | 'display' | 'manage' | 'stats'

const LoyaltyTiersHub: React.FC<LoyaltyTiersHubProps> = ({
  organizationId,
  organization,
  primaryColor,
  secondaryColor,
  onUpdate
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('hub')
  const [showTiersConfig, setShowTiersConfig] = useState(false)
  const [tierStats, setTierStats] = useState<any[]>([])
  const [loadingStats, setLoadingStats] = useState(false)

  // Load tier statistics
  useEffect(() => {
    if (organization?.loyalty_tiers && organization.loyalty_tiers.length > 0) {
      loadTierStats()
    }
  }, [organization, organizationId])

  const loadTierStats = async () => {
    setLoadingStats(true)
    try {
      // Get all customers for this organization with their points
      const { data: customers, error } = await supabase
        .from('customers')
        .select('loyalty_points')
        .eq('organization_id', organizationId)

      if (error) throw error

      // Calculate stats for each tier
      const tiers = organization.loyalty_tiers || []
      const stats = tiers.map((tier: any) => {
        const minPoints = parseInt(tier.threshold) || 0
        const maxPoints = tier.maxThreshold ? parseInt(tier.maxThreshold) : Infinity

        const customersInTier = customers?.filter((c: any) => {
          const points = c.loyalty_points || 0
          return points >= minPoints && points <= maxPoints
        }).length || 0

        return {
          ...tier,
          customerCount: customersInTier
        }
      })

      setTierStats(stats)
    } catch (error) {
      console.error('Error loading tier stats:', error)
    } finally {
      setLoadingStats(false)
    }
  }

  // Render Hub View with Cards
  const renderHub = () => {
    const tierCount = organization?.loyalty_tiers?.length || 0
    const totalCustomers = tierStats.reduce((acc, tier) => acc + (tier.customerCount || 0), 0)

    return (
      <div className="loyalty-tiers-hub-view">
        <div className="loyalty-tiers-hub-header-content">
          <div className="loyalty-tiers-hub-icon" style={{ background: primaryColor }}>
            <Layers size={48} />
          </div>
          <div>
            <h1>Livelli di Fedeltà</h1>
            <p>Gestisci i livelli del programma fedeltà, visualizza e monitora le statistiche</p>
          </div>
        </div>

        <div className="loyalty-tiers-hub-cards">
          {/* Card 1: Visualizza Livelli */}
          <div
            className="loyalty-hub-card loyalty-hub-card-primary"
            onClick={() => setViewMode('display')}
            style={{ borderColor: primaryColor }}
          >
            <div className="loyalty-hub-card-icon" style={{ background: primaryColor }}>
              <Star size={32} />
            </div>
            <div className="loyalty-hub-card-content">
              <h3>Visualizza Livelli</h3>
              <p>Esplora tutti i livelli di fedeltà configurati con dettagli completi</p>
              <ul className="loyalty-hub-card-features">
                <li><Star size={16} /> {tierCount} livell{tierCount === 1 ? 'o' : 'i'} configurati</li>
                <li><Award size={16} /> Range punti e moltiplicatori</li>
                <li><Gift size={16} /> Vantaggi per ogni livello</li>
                <li><Users size={16} /> Visualizzazione clienti</li>
              </ul>
            </div>
            <div className="loyalty-hub-card-arrow">→</div>
          </div>

          {/* Card 2: Gestisci Livelli */}
          <div
            className="loyalty-hub-card loyalty-hub-card-primary"
            onClick={() => setViewMode('manage')}
            style={{ borderColor: '#667eea' }}
          >
            <div className="loyalty-hub-card-icon" style={{ background: '#667eea' }}>
              <Edit3 size={32} />
            </div>
            <div className="loyalty-hub-card-content">
              <h3>Gestisci Livelli</h3>
              <p>Crea, modifica ed elimina i livelli del programma fedeltà</p>
              <ul className="loyalty-hub-card-features">
                <li><Edit3 size={16} /> Crea nuovi livelli</li>
                <li><Layers size={16} /> Modifica livelli esistenti</li>
                <li><Gift size={16} /> Configura vantaggi</li>
                <li><BarChart3 size={16} /> Imposta moltiplicatori</li>
              </ul>
            </div>
            <div className="loyalty-hub-card-arrow">→</div>
          </div>

          {/* Card 3: Statistiche */}
          <div
            className="loyalty-hub-card loyalty-hub-card-primary"
            onClick={() => setViewMode('stats')}
            style={{ borderColor: '#f59e0b' }}
          >
            <div className="loyalty-hub-card-icon" style={{ background: '#f59e0b' }}>
              <BarChart3 size={32} />
            </div>
            <div className="loyalty-hub-card-content">
              <h3>Statistiche Livelli</h3>
              <p>Monitora la distribuzione dei clienti e le performance dei livelli</p>
              <ul className="loyalty-hub-card-features">
                <li><Users size={16} /> {totalCustomers} clienti totali</li>
                <li><TrendingUp size={16} /> Distribuzione per livello</li>
                <li><BarChart3 size={16} /> Analytics dettagliati</li>
                <li><Star size={16} /> Performance tracking</li>
              </ul>
            </div>
            <div className="loyalty-hub-card-arrow">→</div>
          </div>
        </div>
      </div>
    )
  }

  // Render Display View
  const renderDisplayView = () => {
    return (
      <div className="loyalty-tiers-section-view">
        <div className="loyalty-tiers-section-header">
          <h2>Livelli Configurati</h2>
          <p>Visualizza tutti i livelli di fedeltà con i dettagli completi</p>
        </div>
        <div className="loyalty-tiers-section-content">
          {organization?.loyalty_tiers && organization.loyalty_tiers.length > 0 ? (
            <LoyaltyTiersDisplay
              tiers={organization.loyalty_tiers}
              primaryColor={primaryColor}
              onEdit={() => setShowTiersConfig(true)}
            />
          ) : (
            <div className="empty-state-section">
              <Star size={64} style={{ color: '#cbd5e1' }} />
              <h3>Nessun livello configurato</h3>
              <p>Crea i tuoi livelli di fedeltà per premiare i clienti più fedeli</p>
              <button
                className="btn-create-tiers"
                onClick={() => setShowTiersConfig(true)}
                style={{ background: primaryColor }}
              >
                <Edit3 size={20} />
                Crea Primo Livello
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Render Manage View
  const renderManageView = () => {
    return (
      <div className="loyalty-tiers-section-view">
        <div className="loyalty-tiers-section-header">
          <h2>Gestione Livelli</h2>
          <p>Crea e modifica i livelli del tuo programma fedeltà</p>
        </div>
        <div className="loyalty-tiers-section-content">
          <div className="manage-actions-card">
            <div className="manage-action-item">
              <div className="manage-action-icon" style={{ background: primaryColor }}>
                <Edit3 size={32} />
              </div>
              <div className="manage-action-content">
                <h3>{organization?.loyalty_tiers?.length > 0 ? 'Modifica Livelli' : 'Crea Livelli'}</h3>
                <p>Apri il pannello di configurazione per gestire i livelli</p>
                <button
                  className="btn-manage-action"
                  onClick={() => setShowTiersConfig(true)}
                  style={{ background: primaryColor }}
                >
                  <Edit3 size={20} />
                  {organization?.loyalty_tiers?.length > 0 ? 'Modifica Livelli' : 'Crea Livelli'}
                </button>
              </div>
            </div>

            <div className="manage-info-box">
              <h4>Informazioni</h4>
              <div className="manage-info-row">
                <span>Livelli configurati:</span>
                <strong>{organization?.loyalty_tiers?.length || 0}</strong>
              </div>
              <div className="manage-info-row">
                <span>Ultimo aggiornamento:</span>
                <strong>
                  {organization?.updated_at
                    ? new Date(organization.updated_at).toLocaleDateString('it-IT')
                    : 'Mai'}
                </strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Render Stats View
  const renderStatsView = () => {
    return (
      <div className="loyalty-tiers-section-view">
        <div className="loyalty-tiers-section-header">
          <h2>Statistiche Livelli</h2>
          <p>Distribuzione dei clienti per livello di fedeltà</p>
        </div>
        <div className="loyalty-tiers-section-content">
          {loadingStats ? (
            <div className="stats-loading">
              <RefreshCw size={48} className="spin" />
              <p>Caricamento statistiche...</p>
            </div>
          ) : tierStats.length > 0 ? (
            <div className="stats-grid">
              {tierStats.map((tier, index) => (
                <div key={index} className="stats-card">
                  <div className="stats-card-header" style={{ borderBottomColor: tier.color }}>
                    <div className="stats-card-icon" style={{ background: tier.color }}>
                      <Star size={24} />
                    </div>
                    <h3>{tier.name}</h3>
                  </div>
                  <div className="stats-card-body">
                    <div className="stats-metric">
                      <Users size={32} style={{ color: tier.color }} />
                      <div className="stats-metric-content">
                        <span className="stats-metric-value">{tier.customerCount}</span>
                        <span className="stats-metric-label">Client{tier.customerCount === 1 ? 'e' : 'i'}</span>
                      </div>
                    </div>
                    <div className="stats-details">
                      <div className="stats-detail-row">
                        <span>Range Punti:</span>
                        <strong>{tier.threshold} - {tier.maxThreshold || '∞'}</strong>
                      </div>
                      <div className="stats-detail-row">
                        <span>Moltiplicatore:</span>
                        <strong>{tier.multiplier}x</strong>
                      </div>
                      {tier.benefits && tier.benefits.length > 0 && (
                        <div className="stats-detail-row">
                          <span>Vantaggi:</span>
                          <strong>{tier.benefits.length}</strong>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state-section">
              <BarChart3 size={64} style={{ color: '#cbd5e1' }} />
              <h3>Nessuna statistica disponibile</h3>
              <p>Configura i livelli per vedere le statistiche di distribuzione</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Main render - Hub view
  if (viewMode === 'hub') {
    return (
      <div className="loyalty-tiers-hub" style={{ ['--primary-color' as any]: primaryColor, ['--secondary-color' as any]: secondaryColor }}>
        {/* Header */}
        <div className="loyalty-tiers-header" style={{ background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)` }}>
          <button className="back-button" onClick={onUpdate}>
            <ArrowLeft size={20} />
            Indietro
          </button>
          <h1>
            <Layers size={28} />
            Livelli di Fedeltà
          </h1>
          <div className="header-spacer"></div>
        </div>

        {/* Content Hub */}
        <div className="loyalty-tiers-content" style={{ ['--primary-color' as any]: primaryColor }}>
          {renderHub()}
        </div>

        {/* Tiers Configuration Panel */}
        <LoyaltyTiersConfigPanel
          isOpen={showTiersConfig}
          onClose={() => setShowTiersConfig(false)}
          organizationId={organizationId}
          organization={organization}
          primaryColor={primaryColor}
          onSaved={() => {
            setShowTiersConfig(false)
            loadTierStats()
            onUpdate()
          }}
        />
      </div>
    )
  }

  // Section views with back button and tabs
  return (
    <div className="loyalty-tiers-hub" style={{ ['--primary-color' as any]: primaryColor, ['--secondary-color' as any]: secondaryColor }}>
      {/* Header with back button */}
      <div className="loyalty-tiers-header" style={{ background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)` }}>
        <button className="back-button" onClick={() => setViewMode('hub')}>
          <ArrowLeft size={20} />
          Indietro
        </button>
        <h1>
          <Layers size={28} />
          Livelli di Fedeltà
        </h1>
        <div className="header-spacer"></div>
      </div>

      {/* Navigation Tabs */}
      <div className="loyalty-tiers-nav" style={{ ['--primary-color' as any]: primaryColor }}>
        <button
          className={`nav-tab ${viewMode === 'display' ? 'active' : ''}`}
          onClick={() => setViewMode('display')}
          style={viewMode === 'display' ? { color: primaryColor, borderBottomColor: primaryColor } : {}}
        >
          <Star size={20} />
          Visualizza
        </button>
        <button
          className={`nav-tab ${viewMode === 'manage' ? 'active' : ''}`}
          onClick={() => setViewMode('manage')}
          style={viewMode === 'manage' ? { color: primaryColor, borderBottomColor: primaryColor } : {}}
        >
          <Edit3 size={20} />
          Gestisci
        </button>
        <button
          className={`nav-tab ${viewMode === 'stats' ? 'active' : ''}`}
          onClick={() => setViewMode('stats')}
          style={viewMode === 'stats' ? { color: primaryColor, borderBottomColor: primaryColor } : {}}
        >
          <BarChart3 size={20} />
          Statistiche
        </button>
      </div>

      {/* Content */}
      <div className="loyalty-tiers-content">
        {viewMode === 'display' && renderDisplayView()}
        {viewMode === 'manage' && renderManageView()}
        {viewMode === 'stats' && renderStatsView()}
      </div>

      {/* Tiers Configuration Panel */}
      <LoyaltyTiersConfigPanel
        isOpen={showTiersConfig}
        onClose={() => setShowTiersConfig(false)}
        organizationId={organizationId}
        organization={organization}
        primaryColor={primaryColor}
        onSaved={() => {
          setShowTiersConfig(false)
          loadTierStats()
          onUpdate()
        }}
      />
    </div>
  )
}

export default LoyaltyTiersHub
