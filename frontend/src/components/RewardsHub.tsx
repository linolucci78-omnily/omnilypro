import React, { useState, useEffect } from 'react'
import { Gift, TrendingUp, Award, Package, ArrowLeft, Plus, Edit2, Trash2, Image as ImageIcon, Star, Trophy, Upload, Tag, ToggleRight, Eye, Palette, Smartphone } from 'lucide-react'
import { rewardsService, type Reward } from '../services/rewardsService'
import RewardsManagement from './RewardsManagement'
import './RewardsHub.css'

interface RewardsHubProps {
  organizationId: string
  primaryColor: string
  secondaryColor: string
}

type ViewType = 'hub' | 'manage'

const RewardsHub: React.FC<RewardsHubProps> = ({
  organizationId,
  primaryColor,
  secondaryColor
}) => {
  const [activeView, setActiveView] = useState<ViewType>('hub')
  const [rewards, setRewards] = useState<Reward[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalActive: 0,
    totalRedeemed: 0,
    pointsRedeemed: 0,
    topRewards: [] as Reward[]
  })

  useEffect(() => {
    fetchRewards()
  }, [organizationId])

  const fetchRewards = async () => {
    try {
      setLoading(true)
      const allRewards = await rewardsService.getRewards(organizationId)
      setRewards(allRewards)

      // Calcola statistiche
      const active = allRewards.filter(r => r.is_active).length
      const totalRedeemed = allRewards.reduce((sum, r) => sum + (r.redemption_count || 0), 0)
      const pointsRedeemed = allRewards.reduce((sum, r) => sum + ((r.redemption_count || 0) * r.points_required), 0)

      // Top 3 premi più riscattati
      const topRewards = [...allRewards]
        .sort((a, b) => (b.redemption_count || 0) - (a.redemption_count || 0))
        .slice(0, 3)

      setStats({
        totalActive: active,
        totalRedeemed,
        pointsRedeemed,
        topRewards
      })
    } catch (error) {
      console.error('Error fetching rewards:', error)
    } finally {
      setLoading(false)
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
            fetchRewards() // Ricarica stats quando torni indietro
          }}
          style={{ color: primaryColor }}
        >
          <ArrowLeft size={20} />
          <span>Torna a Premi</span>
        </button>
        <RewardsManagement
          organizationId={organizationId}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
        />
      </div>
    )
  }

  // Vista principale Hub
  return (
    <div
      className="rewards-hub"
      style={{
        '--primary-color': primaryColor,
        '--secondary-color': secondaryColor
      } as React.CSSProperties}
    >
      <div className="rewards-hub-header">
        <div className="rewards-hub-header-content">
          <div className="rewards-hub-icon">
            <Gift size={48} />
          </div>
          <div>
            <h1>Centro Premi</h1>
            <p>Gestisci i premi del tuo programma fedeltà e monitora le performance</p>
          </div>
        </div>
      </div>

      {/* Statistiche Overview */}
      <div className="rewards-stats-grid">
        <div className="rewards-stat-card">
          <div className="rewards-stat-icon" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
            <Gift size={24} />
          </div>
          <div className="rewards-stat-content">
            <div className="rewards-stat-value">{stats.totalActive}</div>
            <div className="rewards-stat-label">Premi Attivi</div>
          </div>
        </div>

        <div className="rewards-stat-card">
          <div className="rewards-stat-icon" style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}>
            <Award size={24} />
          </div>
          <div className="rewards-stat-content">
            <div className="rewards-stat-value">{stats.totalRedeemed}</div>
            <div className="rewards-stat-label">Totale Riscattati</div>
          </div>
        </div>

        <div className="rewards-stat-card">
          <div className="rewards-stat-icon" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
            <TrendingUp size={24} />
          </div>
          <div className="rewards-stat-content">
            <div className="rewards-stat-value">{stats.pointsRedeemed}</div>
            <div className="rewards-stat-label">Punti Riscattati</div>
          </div>
        </div>

        <div className="rewards-stat-card">
          <div className="rewards-stat-icon" style={{ background: 'linear-gradient(135deg, #ec4899, #db2777)' }}>
            <Star size={24} />
          </div>
          <div className="rewards-stat-content">
            <div className="rewards-stat-value">{rewards.length}</div>
            <div className="rewards-stat-label">Premi Totali</div>
          </div>
        </div>
      </div>

      {/* Top 3 Premi Più Riscattati */}
      {stats.topRewards.length > 0 && (
        <div className="rewards-top-section">
          <h2><Trophy size={28} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} /> Top 3 Premi Più Riscattati</h2>
          <div className="rewards-top-grid">
            {stats.topRewards.map((reward, index) => (
              <div key={reward.id} className="rewards-top-card">
                <div className="rewards-top-badge">#{index + 1}</div>
                {reward.image_url ? (
                  <img src={reward.image_url} alt={reward.name} className="rewards-top-image" />
                ) : (
                  <div className="rewards-top-placeholder">
                    <Package size={48} />
                  </div>
                )}
                <div className="rewards-top-info">
                  <h3>{reward.name}</h3>
                  <div className="rewards-top-meta">
                    <span className="rewards-top-points">{reward.points_required} punti</span>
                    <span className="rewards-top-count">{reward.redemption_count || 0} riscatti</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Card Azioni Principali */}
      <div className="rewards-hub-cards">
        {/* Card: Gestione Completa */}
        <div
          className="rewards-hub-card rewards-hub-card-primary"
          onClick={() => setActiveView('manage')}
        >
          <div className="rewards-hub-card-icon">
            <Package size={32} />
          </div>
          <div className="rewards-hub-card-content">
            <h3>Gestione Premi</h3>
            <p>Crea, modifica ed elimina i premi del tuo catalogo</p>
            <ul className="rewards-hub-card-features">
              <li><Upload size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />Upload immagini premi</li>
              <li><Tag size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />Categorie e organizzazione</li>
              <li><Package size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />Gestione stock e disponibilità</li>
              <li><ToggleRight size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />Attiva/Disattiva premi</li>
            </ul>
          </div>
          <div className="rewards-hub-card-arrow">→</div>
        </div>

        {/* Card: Anteprima Clienti */}
        <div className="rewards-hub-card rewards-hub-card-secondary">
          <div className="rewards-hub-card-icon">
            <Gift size={32} />
          </div>
          <div className="rewards-hub-card-content">
            <h3>Vista Cliente</h3>
            <p>Vedi come i tuoi clienti vedono il catalogo premi</p>
            <ul className="rewards-hub-card-features">
              <li><Eye size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />Preview interfaccia cliente</li>
              <li><Palette size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />Personalizzazione colori</li>
              <li><Smartphone size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />Responsive design</li>
            </ul>
          </div>
          <div className="rewards-hub-card-badge">Presto</div>
        </div>
      </div>
    </div>
  )
}

export default RewardsHub
