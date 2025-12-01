/**
 * AI Rewards Generator Component
 * Beautiful UI for generating rewards with Anthropic Claude AI
 */

import React, { useState } from 'react'
import { Sparkles, X, Check, RefreshCw, AlertCircle, Zap, TrendingUp, Gift, Loader, Image as ImageIcon } from 'lucide-react'
import { aiRewardsService, type AIGeneratedReward, type BusinessContext } from '../services/aiRewardsService'
import { searchRewardImage } from '../services/imageSearchService'
import type { RewardData } from './RewardModal'
import './AIRewardsGenerator.css'

interface AIRewardsGeneratorProps {
  isOpen: boolean
  onClose: () => void
  businessContext: BusinessContext
  organizationId: string
  onRewardsGenerated: (rewards: RewardData[]) => void
  primaryColor: string
  existingRewards?: Array<{ name: string; description: string }>  // Rewards già esistenti da evitare
}

const AIRewardsGenerator: React.FC<AIRewardsGeneratorProps> = ({
  isOpen,
  onClose,
  businessContext,
  organizationId,
  onRewardsGenerated,
  primaryColor,
  existingRewards = []
}) => {
  const [generating, setGenerating] = useState(false)
  const [generatedRewards, setGeneratedRewards] = useState<AIGeneratedReward[]>([])
  const [reasoning, setReasoning] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [selectedRewards, setSelectedRewards] = useState<Set<number>>(new Set())
  const [customInstructions, setCustomInstructions] = useState<string>('')
  const [rewardsCount, setRewardsCount] = useState<number>(8)

  const handleGenerate = async () => {
    try {
      setGenerating(true)
      setError(null)
      setGeneratedRewards([])
      setSelectedRewards(new Set())

      console.log('🤖 Step 1: Generating rewards with AI...')
      console.log(`📋 Existing rewards to avoid: ${existingRewards.length}`)

      const response = await aiRewardsService.generateRewards(
        businessContext,
        organizationId,
        customInstructions.trim() || undefined,
        rewardsCount,
        existingRewards  // Passa rewards esistenti
      )

      if (!response.success || !response.rewards) {
        throw new Error(response.error || 'Errore durante la generazione')
      }

      console.log(`✅ Generated ${response.rewards.length} rewards`)

      // Step 2: Cerca immagini per rewards che hanno imageSearchQuery
      console.log('🖼️  Step 2: Searching images for rewards...')
      const rewardsWithImages = await Promise.all(
        response.rewards.map(async (reward) => {
          // Se l'AI ha fornito una query di ricerca, cerca l'immagine
          if (reward.imageSearchQuery && reward.imageSearchQuery.trim()) {
            console.log(`  🔍 Searching image for: "${reward.name}" (query: "${reward.imageSearchQuery}")`)

            const imageResult = await searchRewardImage(reward.imageSearchQuery)

            if (imageResult) {
              console.log(`  ✅ Found image for "${reward.name}"`)
              return {
                ...reward,
                image_url: imageResult.url,
                image_credit: {
                  author: imageResult.author,
                  source: imageResult.source,
                  authorUrl: imageResult.authorUrl
                }
              }
            } else {
              console.log(`  ⚠️  No image found for "${reward.name}"`)
            }
          }

          // Nessuna query o immagine non trovata
          return reward
        })
      )

      const foundImagesCount = rewardsWithImages.filter(r => r.image_url).length
      console.log(`✅ Found ${foundImagesCount}/${rewardsWithImages.length} images`)

      setGeneratedRewards(rewardsWithImages)
      setReasoning(response.reasoning || '')

      // Select all rewards by default
      setSelectedRewards(new Set(rewardsWithImages.map((_, i) => i)))
    } catch (err: any) {
      console.error('Error generating rewards:', err)
      setError(err.message || 'Errore durante la generazione dei premi')
    } finally {
      setGenerating(false)
    }
  }

  const handleReset = () => {
    setGeneratedRewards([])
    setReasoning('')
    setError(null)
    setSelectedRewards(new Set())
  }

  const toggleReward = (index: number) => {
    const newSelected = new Set(selectedRewards)
    if (newSelected.has(index)) {
      newSelected.delete(index)
    } else {
      newSelected.add(index)
    }
    setSelectedRewards(newSelected)
  }

  const handleAddSelected = () => {
    const rewardsToAdd: RewardData[] = generatedRewards
      .filter((_, i) => selectedRewards.has(i))
      .map(reward => ({
        name: reward.name,
        type: reward.type,
        value: reward.value,
        points_required: reward.points_required,
        required_tier: reward.required_tier,
        description: reward.description,
        is_active: true,
        image_url: reward.image_url || undefined  // Includi immagine se trovata
      }))

    onRewardsGenerated(rewardsToAdd)
    onClose()
  }

  if (!isOpen) return null

  const REWARD_TYPE_LABELS: Record<string, string> = {
    discount: 'Sconto',
    freeProduct: 'Prodotto Gratis',
    cashback: 'Cashback',
    giftCard: 'Gift Card'
  }

  return (
    <>
      {/* Overlay */}
      <div className="ai-modal-overlay" onClick={onClose} />

      {/* Modal */}
      <div
        className="ai-modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{
          '--primary-color': primaryColor
        } as React.CSSProperties}
      >
        {/* Header */}
        <div className="ai-modal-header">
          <div className="ai-modal-header-content">
            <div className="ai-modal-title-section">
              <div className="ai-modal-icon">
                <Sparkles size={28} />
              </div>
              <div>
                <h2 className="ai-modal-title">
                  Assistente AI Premi
                </h2>
                <p className="ai-modal-subtitle">
                  Powered by Anthropic Claude
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={generating}
              className="ai-modal-close-btn"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="ai-modal-content">
          {/* Business Context Summary */}
          <div className="ai-business-context">
            <h3>📊 Analisi Attività</h3>
            <div className="ai-business-grid">
              <div className="ai-business-item">
                <div className="ai-business-label">Tipo Business</div>
                <div className="ai-business-value">
                  {businessContext.organization.business_type || businessContext.organization.name}
                </div>
              </div>
              <div className="ai-business-item">
                <div className="ai-business-label">Livelli Fedeltà</div>
                <div className="ai-business-value">
                  {businessContext.loyalty_tiers.map(t => t.name).join(', ')}
                </div>
              </div>
              <div className="ai-business-item">
                <div className="ai-business-label">Sistema Punti</div>
                <div className="ai-business-value">
                  {businessContext.points_config.name}
                </div>
              </div>
              {businessContext.customer_stats && (
                <div className="ai-business-item">
                  <div className="ai-business-label">Clienti Attivi</div>
                  <div className="ai-business-value">
                    {businessContext.customer_stats.total}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Generate Button */}
          {generatedRewards.length === 0 && (
            <div className="ai-generate-section">
              <div className="ai-generate-icon-wrapper">
                <Zap size={48} style={{ color: primaryColor }} />
              </div>
              <h3 className="ai-generate-title">
                Pronto a generare premi perfetti?
              </h3>
              <p className="ai-generate-description">
                L'AI analizzerà la tua attività e creerà premi personalizzati ottimizzati per il tuo business e i tuoi livelli fedeltà.
              </p>

              {/* Rewards Count Selector */}
              <div style={{ marginBottom: '24px', width: '100%', maxWidth: '300px', margin: '0 auto 24px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#374151',
                  marginBottom: '12px',
                  textAlign: 'left'
                }}>
                  🎯 Numero di Premi da Generare
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <input
                    type="range"
                    min="5"
                    max="50"
                    value={rewardsCount}
                    onChange={(e) => setRewardsCount(Number(e.target.value))}
                    disabled={generating}
                    style={{
                      flex: 1,
                      accentColor: primaryColor
                    }}
                  />
                  <span style={{
                    fontSize: '20px',
                    fontWeight: 700,
                    color: primaryColor,
                    minWidth: '40px',
                    textAlign: 'center'
                  }}>
                    {rewardsCount}
                  </span>
                </div>
                <p style={{
                  fontSize: '12px',
                  color: '#6b7280',
                  marginTop: '8px',
                  fontStyle: 'italic',
                  textAlign: 'left'
                }}>
                  Scegli tra 5 e 50 premi
                </p>
              </div>

              {/* Custom Instructions */}
              <div style={{ marginBottom: '24px', width: '100%' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  📝 Istruzioni Personalizzate (opzionale)
                </label>
                <textarea
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  placeholder="Es: Voglio rewards per famiglie con bambini, focus su pizze gourmet e dolci fatti in casa. Evita premi troppo costosi."
                  disabled={generating}
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                    lineHeight: '1.5',
                    resize: 'vertical',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    fontFamily: 'inherit',
                    backgroundColor: generating ? '#f9fafb' : 'white'
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = primaryColor}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
                />
                <p style={{
                  fontSize: '12px',
                  color: '#6b7280',
                  marginTop: '6px',
                  fontStyle: 'italic'
                }}>
                  Guida l'AI specificando: tipo di clienti target, prodotti/servizi da premiare, budget, o altre preferenze
                </p>
              </div>

              <button
                onClick={handleGenerate}
                disabled={generating}
                className="ai-generate-btn"
              >
                {generating ? (
                  <>
                    <Loader size={20} className="spin" />
                    Generazione in corso...
                  </>
                ) : (
                  <>
                    <Sparkles size={20} />
                    Genera Premi con AI
                  </>
                )}
              </button>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="ai-error-message">
              <AlertCircle size={20} className="ai-error-icon" />
              <div>
                <div className="ai-error-title">Errore</div>
                <div className="ai-error-text">{error}</div>
              </div>
            </div>
          )}

          {/* AI Reasoning */}
          {reasoning && (
            <div className="ai-reasoning-card">
              <TrendingUp size={20} className="ai-reasoning-icon" />
              <div>
                <div className="ai-reasoning-title">Strategia AI</div>
                <div className="ai-reasoning-text">{reasoning}</div>
              </div>
            </div>
          )}

          {/* Generated Rewards */}
          {generatedRewards.length > 0 && (
            <div>
              <div className="ai-rewards-header">
                <h3 className="ai-rewards-title">
                  Premi Generati ({selectedRewards.size} selezionati)
                </h3>
                <button
                  onClick={handleReset}
                  disabled={generating}
                  className="ai-regenerate-btn"
                >
                  <RefreshCw size={16} />
                  Nuova Generazione
                </button>
              </div>

              <div className="ai-rewards-grid">
                {generatedRewards.map((reward, index) => (
                  <div
                    key={index}
                    onClick={() => toggleReward(index)}
                    className={`ai-reward-card ${selectedRewards.has(index) ? 'selected' : ''}`}
                  >
                    {/* Image Preview */}
                    {reward.image_url && (
                      <div className="ai-reward-image-container">
                        <img
                          src={reward.image_url}
                          alt={reward.name}
                          className="ai-reward-image"
                          loading="lazy"
                        />
                        {reward.image_credit && (
                          <div className="ai-reward-image-credit">
                            <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.8)' }}>
                              Photo by {reward.image_credit.author} on{' '}
                              {reward.image_credit.source === 'unsplash' ? 'Unsplash' : 'Pexels'}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="ai-reward-content">
                      {/* Checkbox */}
                      <div className="ai-reward-checkbox">
                        {selectedRewards.has(index) && <Check size={16} style={{ color: 'white' }} />}
                      </div>

                      {/* Details */}
                      <div className="ai-reward-details">
                        <div className="ai-reward-header">
                          <span className="ai-reward-emoji">{reward.emoji}</span>
                          <div className="ai-reward-info">
                            <h4 className="ai-reward-name">
                              {reward.name}
                            </h4>
                            <p className="ai-reward-description">
                              {reward.description}
                            </p>
                          </div>
                        </div>

                        <div className="ai-reward-tags">
                          <span className="ai-reward-tag ai-reward-tag-points">
                            {reward.points_required} {businessContext.points_config.name}
                          </span>
                          <span className="ai-reward-tag ai-reward-tag-type">
                            {REWARD_TYPE_LABELS[reward.type]}
                          </span>
                          {reward.required_tier && (
                            <span className="ai-reward-tag ai-reward-tag-tier">
                              {reward.required_tier}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {generatedRewards.length > 0 && (
          <div className="ai-modal-footer">
            <button
              onClick={onClose}
              className="ai-footer-btn ai-footer-btn-cancel"
            >
              Annulla
            </button>
            <button
              onClick={handleAddSelected}
              disabled={selectedRewards.size === 0}
              className="ai-footer-btn ai-footer-btn-add"
            >
              <Gift size={16} />
              Aggiungi {selectedRewards.size > 0 ? `(${selectedRewards.size})` : 'Premi'}
            </button>
          </div>
        )}
      </div>
    </>
  )
}

export default AIRewardsGenerator
