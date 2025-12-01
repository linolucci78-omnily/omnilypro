import React, { useState, useEffect } from 'react'
import { Gift, TrendingUp, Award, Package, ArrowLeft, Plus, Edit2, Trash2, Image as ImageIcon, Star, Trophy, Upload, Tag, ToggleRight, Eye, Palette, Smartphone, Sparkles, Zap, Brain } from 'lucide-react'
import { rewardsService, type Reward } from '../services/rewardsService'
import { aiRewardsService } from '../services/aiRewardsService'
import RewardsManagement from './RewardsManagement'
import AIRewardsGenerator from './AIRewardsGenerator'
import type { RewardData } from './RewardModal'
import './RewardsHub.css'

interface RewardsHubProps {
  organizationId: string
  primaryColor: string
  secondaryColor: string
  organization?: any
  customers?: any[]
}

type ViewType = 'hub' | 'manage' | 'customer-preview'

const RewardsHub: React.FC<RewardsHubProps> = ({
  organizationId,
  primaryColor,
  secondaryColor,
  organization,
  customers = []
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
  const [showAIGenerator, setShowAIGenerator] = useState(false)

  useEffect(() => {
    fetchRewards()
  }, [organizationId])

  const fetchRewards = async () => {
    try {
      setLoading(true)
      const allRewards = await rewardsService.getAll(organizationId)
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

  const handleAIRewardsGenerated = async (generatedRewards: RewardData[]) => {
    try {
      // Save all generated rewards to database
      for (const reward of generatedRewards) {
        await rewardsService.create(organizationId, reward)
      }

      // Refresh rewards list
      await fetchRewards()

      console.log(`✅ ${generatedRewards.length} premi AI aggiunti con successo!`)
    } catch (error) {
      console.error('Error saving AI generated rewards:', error)
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
          onRewardsChange={fetchRewards}
        />
      </div>
    )
  }

  // Vista Cliente (Preview)
  if (activeView === 'customer-preview') {
    const activeRewards = rewards.filter(r => r.is_active)

    return (
      <div
        style={{
          '--primary-color': primaryColor,
          '--secondary-color': secondaryColor
        } as React.CSSProperties}
      >
        <button
          className="back-button"
          onClick={() => setActiveView('hub')}
          style={{ color: primaryColor }}
        >
          <ArrowLeft size={20} />
          <span>Torna a Premi</span>
        </button>

        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#1f2937', margin: '0 0 0.5rem 0' }}>
              Catalogo Premi
            </h1>
            <p style={{ fontSize: '1.125rem', color: '#6b7280', margin: 0 }}>
              Scopri i premi che puoi riscattare con i tuoi punti
            </p>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#6b7280' }}>
              <Package size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
              <p>Caricamento premi...</p>
            </div>
          ) : activeRewards.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
              <Gift size={64} style={{ margin: '0 auto 1rem', color: '#9ca3af' }} />
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#4b5563', margin: '1rem 0 0.5rem 0' }}>
                Nessun premio disponibile
              </h3>
              <p style={{ fontSize: '1rem', color: '#6b7280', margin: 0 }}>
                Al momento non ci sono premi attivi nel catalogo
              </p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '2rem'
            }}>
              {activeRewards.map(reward => (
                <div
                  key={reward.id}
                  style={{
                    background: 'white',
                    border: '2px solid #e5e7eb',
                    borderRadius: '20px',
                    overflow: 'hidden',
                    transition: 'all 0.3s',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = primaryColor
                    e.currentTarget.style.boxShadow = `0 12px 32px ${primaryColor}26`
                    e.currentTarget.style.transform = 'translateY(-4px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e5e7eb'
                    e.currentTarget.style.boxShadow = 'none'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  {reward.image_url ? (
                    <img
                      src={reward.image_url}
                      alt={reward.name}
                      style={{
                        width: '100%',
                        height: '200px',
                        objectFit: 'cover'
                      }}
                    />
                  ) : (
                    <div style={{
                      width: '100%',
                      height: '200px',
                      background: 'linear-gradient(135deg, #f3f4f6, #e5e7eb)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#9ca3af'
                    }}>
                      <Package size={64} />
                    </div>
                  )}

                  <div style={{ padding: '1.5rem' }}>
                    <h3 style={{
                      fontSize: '1.25rem',
                      fontWeight: 700,
                      color: '#1f2937',
                      margin: '0 0 0.5rem 0'
                    }}>
                      {reward.name}
                    </h3>

                    <p style={{
                      fontSize: '0.875rem',
                      color: '#6b7280',
                      margin: '0 0 1rem 0',
                      lineHeight: 1.5
                    }}>
                      {reward.description}
                    </p>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      flexWrap: 'wrap',
                      marginBottom: '1rem'
                    }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.375rem',
                        padding: '0.5rem 1rem',
                        background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                        color: 'white',
                        borderRadius: '20px',
                        fontSize: '0.875rem',
                        fontWeight: 700
                      }}>
                        <Star size={16} />
                        {reward.points_required} punti
                      </span>

                      {reward.required_tier && (
                        <span style={{
                          padding: '0.5rem 0.875rem',
                          background: '#f3f4f6',
                          color: '#4b5563',
                          borderRadius: '20px',
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          border: '2px solid #e5e7eb'
                        }}>
                          {reward.required_tier}
                        </span>
                      )}
                    </div>

                    {reward.stock_quantity !== undefined && reward.stock_quantity !== null && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.375rem',
                        fontSize: '0.875rem',
                        color: reward.stock_quantity < 5 ? '#f59e0b' : '#6b7280',
                        fontWeight: 600
                      }}>
                        <Package size={16} />
                        {reward.stock_quantity} disponibili
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
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
        <div
          className="rewards-hub-card rewards-hub-card-secondary"
          onClick={() => setActiveView('customer-preview')}
        >
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
          <div className="rewards-hub-card-arrow">→</div>
        </div>

        {/* Card: AI Generator */}
        <div
          className="rewards-hub-card rewards-hub-card-ai"
          onClick={() => setShowAIGenerator(true)}
          style={{
            background: `linear-gradient(135deg, ${primaryColor}15, ${primaryColor}05)`,
            borderColor: primaryColor
          }}
        >
          <div className="rewards-hub-card-icon" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)` }}>
            <Sparkles size={32} />
          </div>
          <div className="rewards-hub-card-content">
            <h3>🤖 Assistente AI Premi</h3>
            <p>Genera premi personalizzati con intelligenza artificiale</p>
            <ul className="rewards-hub-card-features">
              <li><Brain size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />Analisi automatica business</li>
              <li><Zap size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />Suggerimenti intelligenti</li>
              <li><Sparkles size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />Powered by Claude AI</li>
            </ul>
          </div>
          <div className="rewards-hub-card-arrow">→</div>
        </div>
      </div>

      {/* AI Rewards Generator Modal */}
      {organization && (
        <AIRewardsGenerator
          isOpen={showAIGenerator}
          onClose={() => setShowAIGenerator(false)}
          businessContext={aiRewardsService.buildBusinessContext(organization, customers)}
          organizationId={organizationId}
          onRewardsGenerated={handleAIRewardsGenerated}
          primaryColor={primaryColor}
          existingRewards={rewards.map(r => ({
            name: r.name,
            description: r.description
          }))}
        />
      )}
    </div>
  )
}

export default RewardsHub
