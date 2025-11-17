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
  Award,
  Plus
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import LoyaltyTiersConfigPanel from './LoyaltyTiersConfigPanel'
import LoyaltyTierFullPage from './LoyaltyTierFullPage'
import './LoyaltyTiersHub.css'

interface LoyaltyTier {
  name: string
  threshold: string
  maxThreshold?: string
  multiplier: string
  color: string
  benefits: string[]
}

interface LoyaltyTiersHubProps {
  organizationId: string
  organization: any
  primaryColor: string
  secondaryColor: string
  onUpdate: () => void
}

type ViewMode = 'hub' | 'manage' | 'stats' | 'tier-edit'

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
  const [editingTier, setEditingTier] = useState<LoyaltyTier | null>(null)
  const [editingTierIndex, setEditingTierIndex] = useState<number | null>(null)

  // Load tier statistics
  useEffect(() => {
    if (organization?.loyalty_tiers && organization.loyalty_tiers.length > 0) {
      loadTierStats()
    }
  }, [organization, organizationId])

  const loadTierStats = async () => {
    if (!organization) return

    setLoadingStats(true)
    try {
      // Get all customers for this organization with their points
      const { data: customers, error } = await supabase
        .from('customers')
        .select('points')
        .eq('organization_id', organizationId)

      if (error) throw error

      // Calculate stats for each tier
      const tiers = organization.loyalty_tiers || []
      const stats = tiers.map((tier: any) => {
        const minPoints = parseInt(tier.threshold) || 0
        const maxPoints = tier.maxThreshold ? parseInt(tier.maxThreshold) : Infinity

        const customersInTier = customers?.filter((c: any) => {
          const points = c.points || 0
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
          {/* Card 1: Gestisci Livelli */}
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

          {/* Card 2: Statistiche */}
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

  // Handle Save Tier
  const handleSaveTier = async (tierData: LoyaltyTier) => {
    try {
      const currentTiers = organization?.loyalty_tiers || []
      let updatedTiers: LoyaltyTier[]

      if (editingTierIndex !== null) {
        // Update existing tier
        updatedTiers = [...currentTiers]
        updatedTiers[editingTierIndex] = tierData
      } else {
        // Add new tier
        updatedTiers = [...currentTiers, tierData]
      }

      // Save to database
      const { error } = await supabase
        .from('organizations')
        .update({ loyalty_tiers: updatedTiers })
        .eq('id', organizationId)

      if (error) throw error

      // Reload and navigate back
      await onUpdate()
      await loadTierStats()
      setEditingTier(null)
      setEditingTierIndex(null)
      setViewMode('manage')
    } catch (error) {
      console.error('Error saving tier:', error)
      alert('Errore nel salvataggio del livello')
    }
  }

  // Render Manage View
  const renderManageView = () => {
    const tiers = organization?.loyalty_tiers || []

    return (
      <div className="loyalty-tiers-section-view">
        <div className="loyalty-tiers-section-header">
          <h2>Gestione Livelli</h2>
          <p>Crea e modifica i livelli del tuo programma fedeltà</p>
        </div>
        <div className="loyalty-tiers-section-content">
          {/* Add New Tier Button */}
          <div style={{ marginBottom: '2rem' }}>
            <button
              className="btn-create-tier"
              onClick={() => {
                setEditingTier(null)
                setEditingTierIndex(null)
                setViewMode('tier-edit')
              }}
              style={{ background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)` }}
            >
              <Plus size={20} />
              Aggiungi Nuovo Livello
            </button>
          </div>

          {/* Tiers Grid */}
          {tiers.length > 0 ? (
            <div className="tiers-manage-grid">
              {tiers.map((tier: LoyaltyTier, index: number) => (
                <div key={index} className="tier-manage-card" style={{ borderLeftColor: tier.color }}>
                  <div className="tier-manage-header">
                    <div className="tier-manage-icon" style={{ background: tier.color }}>
                      <Star size={24} />
                    </div>
                    <h3>{tier.name}</h3>
                  </div>
                  <div className="tier-manage-body">
                    <div className="tier-manage-info">
                      <span>Range: {tier.threshold} - {tier.maxThreshold || '∞'} punti</span>
                      <span>Moltiplicatore: {tier.multiplier}x</span>
                      {tier.benefits && tier.benefits.length > 0 && (
                        <span>{tier.benefits.length} vantaggio/i</span>
                      )}
                    </div>
                    <button
                      className="btn-edit-tier"
                      onClick={() => {
                        setEditingTier(tier)
                        setEditingTierIndex(index)
                        setViewMode('tier-edit')
                      }}
                      style={{ color: primaryColor }}
                    >
                      <Edit3 size={18} />
                      Modifica
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state-section">
              <Star size={64} style={{ color: '#cbd5e1' }} />
              <h3>Nessun livello configurato</h3>
              <p>Crea il tuo primo livello di fedeltà!</p>
            </div>
          )}
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

  // Render Full-Page Tier Editor
  if (viewMode === 'tier-edit') {
    return (
      <LoyaltyTierFullPage
        tier={editingTier}
        organizationId={organizationId}
        primaryColor={primaryColor}
        secondaryColor={secondaryColor}
        onBack={() => setViewMode('manage')}
        onSave={handleSaveTier}
      />
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
