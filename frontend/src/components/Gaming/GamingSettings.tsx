/**
 * OMNILYPRO GAMING MODULE - Settings Panel
 * Admin panel to configure gaming features (Card-based UI like LoyaltyTiersHub)
 */

import React, { useState, useEffect } from 'react'
import {
  Settings,
  Sparkles,
  Target,
  Trophy,
  Save,
  Plus,
  Trash2,
  Edit3,
  ArrowLeft,
  BarChart3,
  Users,
  Gift,
  Palette,
  Clock,
  Star,
  X
} from 'lucide-react'
import { spinService } from '../../services/gaming/spinService'
import { challengeService } from '../../services/gaming/challengeService'
import { badgeService } from '../../services/gaming/badgeService'
import type {
  WheelConfig,
  WheelSector,
  Challenge,
  Badge,
  ChallengeType,
  BadgeCategory,
  BadgeRarity
} from '../../services/gaming/types'
import './GamingSettings.css'

interface GamingSettingsProps {
  organizationId: string
  primaryColor?: string
  onClose?: () => void
}

type ViewMode = 'hub' | 'wheel' | 'challenges' | 'badges' | 'general'

const GamingSettings: React.FC<GamingSettingsProps> = ({
  organizationId,
  primaryColor = '#dc2626',
  onClose
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('hub')
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Wheel settings
  const [wheelConfig, setWheelConfig] = useState<WheelConfig | null>(null)

  // Challenge settings
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [showCreateChallenge, setShowCreateChallenge] = useState(false)
  const [newChallenge, setNewChallenge] = useState({
    title: '',
    description: '',
    icon_emoji: '🎯',
    type: 'daily' as 'daily' | 'weekly',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    requirementType: 'make_purchases',
    requirementValue: 1,
    rewardPoints: 50,
    rewardSpins: 0,
    durationHours: 24
  })

  // Badge settings
  const [badges, setBadges] = useState<Badge[]>([])
  const [showCreateBadge, setShowCreateBadge] = useState(false)
  const [newBadge, setNewBadge] = useState({
    name: '',
    description: '',
    icon_emoji: '🏆',
    category: 'firstSteps' as BadgeCategory,
    rarity: 'common' as BadgeRarity,
    rewardPoints: 0,
    rewardSpins: 0,
    rewardDiscount: 0,
    autoUnlockEnabled: false,
    unlockRuleType: 'registration' as any,
    unlockThreshold: 1
  })

  // Wheel sector editing modal
  const [editingSector, setEditingSector] = useState<WheelSector | null>(null)
  const [showPrizePreview, setShowPrizePreview] = useState(false)

  // General settings
  const [generalSettings, setGeneralSettings] = useState({
    wheelEnabled: true,
    challengesEnabled: true,
    badgesEnabled: true,
    primaryColor: primaryColor
  })

  useEffect(() => {
    loadAllSettings()
  }, [organizationId])

  const loadAllSettings = async () => {
    try {
      // Load wheel config
      const wheel = await spinService.getWheelConfig(organizationId)
      setWheelConfig(wheel)

      // Load challenges
      const challengesList = await challengeService.getAllChallenges(organizationId)
      setChallenges(challengesList)

      // Load badges
      const badgesList = await badgeService.getAllBadges(organizationId)
      setBadges(badgesList)

      console.log('✅ Settings loaded')
    } catch (error) {
      console.error('❌ Error loading settings:', error)
    }
  }

  const handleSaveWheelConfig = async () => {
    if (!wheelConfig) return

    try {
      setSaving(true)
      setSaveSuccess(false)
      console.log('💾 Salvando configurazione ruota...')
      console.log('   - max_spins_per_day:', wheelConfig.max_spins_per_day)
      console.log('   - organization_id:', organizationId)
      await spinService.updateWheelConfig(organizationId, wheelConfig)
      console.log('✅ Configurazione ruota salvata con successo!')
      setSaveSuccess(true)
      // Hide success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (error) {
      console.error('❌ Error saving wheel config:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleAddSector = () => {
    if (!wheelConfig) return

    const newSector: WheelSector = {
      id: `sector-${Date.now()}`,
      label: 'Nuovo Settore',
      color: '#3b82f6',
      probability: 10,
      prize_type: 'points',
      prize_value: 10
    }

    setWheelConfig({
      ...wheelConfig,
      sectors: [...wheelConfig.sectors, newSector]
    })
  }

  const handleDeleteSector = (sectorId: string) => {
    if (!wheelConfig) return

    setWheelConfig({
      ...wheelConfig,
      sectors: wheelConfig.sectors.filter(s => s.id !== sectorId)
    })
  }

  const handleCreateChallenge = async () => {
    try {
      setSaving(true)

      const requirements: any = {
        type: newChallenge.requirementType
      }

      if (newChallenge.requirementType === 'make_purchases' || newChallenge.requirementType === 'redeem_rewards' || newChallenge.requirementType === 'visit_count' || newChallenge.requirementType === 'referrals') {
        requirements.count = newChallenge.requirementValue
      } else if (newChallenge.requirementType === 'spend_amount') {
        requirements.amount = newChallenge.requirementValue
      } else if (newChallenge.requirementType === 'earn_points') {
        requirements.points = newChallenge.requirementValue
      }

      const rewards: any = {}
      if (newChallenge.rewardPoints > 0) rewards.points = newChallenge.rewardPoints
      if (newChallenge.rewardSpins > 0) rewards.free_spins = newChallenge.rewardSpins

      await challengeService.createChallenge({
        organization_id: organizationId,
        title: newChallenge.title,
        description: newChallenge.description,
        icon_emoji: newChallenge.icon_emoji,
        type: newChallenge.type,
        difficulty: newChallenge.difficulty,
        requirements,
        rewards,
        duration_hours: newChallenge.durationHours,
        is_recurring: true,
        is_active: true
      })

      // Reload challenges
      await loadAllSettings()

      // Reset form
      setNewChallenge({
        title: '',
        description: '',
        icon_emoji: '🎯',
        type: 'daily',
        difficulty: 'medium',
        requirementType: 'make_purchases',
        requirementValue: 1,
        rewardPoints: 50,
        rewardSpins: 0,
        durationHours: 24
      })

      setShowCreateChallenge(false)
      console.log('✅ Challenge creata con successo!')
    } catch (error) {
      console.error('❌ Errore creazione challenge:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleCreateBadge = async () => {
    try {
      setSaving(true)

      const unlock_rewards: any = {}
      if (newBadge.rewardPoints > 0) unlock_rewards.points = newBadge.rewardPoints
      if (newBadge.rewardSpins > 0) unlock_rewards.free_spins = newBadge.rewardSpins
      if (newBadge.rewardDiscount > 0) unlock_rewards.discount = newBadge.rewardDiscount

      const auto_unlock_rule = newBadge.autoUnlockEnabled ? {
        type: newBadge.unlockRuleType,
        threshold: newBadge.unlockThreshold
      } : undefined

      await badgeService.createBadge({
        organization_id: organizationId,
        name: newBadge.name,
        description: newBadge.description,
        icon_emoji: newBadge.icon_emoji,
        category: newBadge.category,
        rarity: newBadge.rarity,
        auto_unlock_rule,
        unlock_rewards: Object.keys(unlock_rewards).length > 0 ? unlock_rewards : undefined,
        is_active: true
      })

      // Reload badges
      await loadAllSettings()

      // Reset form
      setNewBadge({
        name: '',
        description: '',
        icon_emoji: '🏆',
        category: 'firstSteps',
        rarity: 'common',
        rewardPoints: 0,
        rewardSpins: 0,
        rewardDiscount: 0,
        autoUnlockEnabled: false,
        unlockRuleType: 'registration',
        unlockThreshold: 1
      })

      setShowCreateBadge(false)
      console.log('✅ Badge creato con successo!')
    } catch (error) {
      console.error('❌ Errore creazione badge:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateSector = (sectorId: string, updates: Partial<WheelSector>) => {
    if (!wheelConfig) return

    setWheelConfig({
      ...wheelConfig,
      sectors: wheelConfig.sectors.map(s =>
        s.id === sectorId ? { ...s, ...updates } : s
      )
    })
  }

  // HUB VIEW - Main cards like LoyaltyTiersHub
  const renderHub = () => {
    const sectorCount = wheelConfig?.sectors?.length || 0
    const challengeCount = challenges.length
    const badgeCount = badges.length

    return (
      <div className="gaming-settings-hub-view">
        <div className="gaming-settings-hub-header-content">
          <div className="gaming-settings-hub-icon" style={{ background: primaryColor }}>
            <Settings size={48} />
          </div>
          <div>
            <h1>Impostazioni Gaming</h1>
            <p>Gestisci ruota della fortuna, challenge, badge e impostazioni del modulo gaming</p>
          </div>
        </div>

        <div className="gaming-settings-hub-cards">
          {/* Card 1: Ruota della Fortuna */}
          <div
            className="gaming-hub-card gaming-hub-card-primary"
            onClick={() => setViewMode('wheel')}
            style={{ borderColor: '#8b5cf6' }}
          >
            <div className="gaming-hub-card-icon" style={{ background: '#8b5cf6' }}>
              <Sparkles size={32} />
            </div>
            <div className="gaming-hub-card-content">
              <h3>Ruota della Fortuna</h3>
              <p>Configura settori, premi, probabilità e limiti giornalieri</p>
              <ul className="gaming-hub-card-features">
                <li><Edit3 size={16} /> Gestisci settori ({sectorCount})</li>
                <li><Gift size={16} /> Configura premi</li>
                <li><Palette size={16} /> Personalizza colori</li>
                <li><BarChart3 size={16} /> Imposta probabilità</li>
              </ul>
            </div>
            <div className="gaming-hub-card-arrow">→</div>
          </div>

          {/* Card 2: Challenge */}
          <div
            className="gaming-hub-card gaming-hub-card-primary"
            onClick={() => setViewMode('challenges')}
            style={{ borderColor: '#f59e0b' }}
          >
            <div className="gaming-hub-card-icon" style={{ background: '#f59e0b' }}>
              <Target size={32} />
            </div>
            <div className="gaming-hub-card-content">
              <h3>Challenge</h3>
              <p>Crea e gestisci challenge giornaliere e settimanali per i clienti</p>
              <ul className="gaming-hub-card-features">
                <li><Plus size={16} /> Crea nuove challenge</li>
                <li><Edit3 size={16} /> Modifica challenge ({challengeCount})</li>
                <li><Gift size={16} /> Imposta ricompense</li>
                <li><Clock size={16} /> Gestisci scadenze</li>
              </ul>
            </div>
            <div className="gaming-hub-card-arrow">→</div>
          </div>

          {/* Card 3: Badge */}
          <div
            className="gaming-hub-card gaming-hub-card-primary"
            onClick={() => setViewMode('badges')}
            style={{ borderColor: '#10b981' }}
          >
            <div className="gaming-hub-card-icon" style={{ background: '#10b981' }}>
              <Trophy size={32} />
            </div>
            <div className="gaming-hub-card-content">
              <h3>Badge & Achievement</h3>
              <p>Configura badge, rarità e regole di sblocco automatiche</p>
              <ul className="gaming-hub-card-features">
                <li><Plus size={16} /> Crea nuovi badge</li>
                <li><Edit3 size={16} /> Modifica badge ({badgeCount})</li>
                <li><Star size={16} /> Imposta rarità</li>
                <li><Settings size={16} /> Regole auto-unlock</li>
              </ul>
            </div>
            <div className="gaming-hub-card-arrow">→</div>
          </div>

          {/* Card 4: Impostazioni Generali */}
          <div
            className="gaming-hub-card gaming-hub-card-primary"
            onClick={() => setViewMode('general')}
            style={{ borderColor: '#6b7280' }}
          >
            <div className="gaming-hub-card-icon" style={{ background: '#6b7280' }}>
              <Settings size={32} />
            </div>
            <div className="gaming-hub-card-content">
              <h3>Impostazioni Generali</h3>
              <p>Abilita/disabilita moduli e configura impostazioni globali</p>
              <ul className="gaming-hub-card-features">
                <li><Settings size={16} /> Abilita/disabilita moduli</li>
                <li><Clock size={16} /> Limiti giornalieri</li>
                <li><Palette size={16} /> Colore principale</li>
                <li><BarChart3 size={16} /> Statistiche globali</li>
              </ul>
            </div>
            <div className="gaming-hub-card-arrow">→</div>
          </div>
        </div>
      </div>
    )
  }

  // WHEEL MANAGEMENT VIEW
  const renderWheelManagement = () => {
    if (!wheelConfig) return null

    return (
      <div className="gaming-settings-detail-view">
        <button className="gaming-settings-back-btn" onClick={() => setViewMode('hub')}>
          <ArrowLeft size={20} />
          Torna alla Dashboard
        </button>

        <div className="gaming-settings-detail-header">
          <div className="gaming-settings-detail-icon" style={{ background: '#8b5cf6' }}>
            <Sparkles size={32} />
          </div>
          <div>
            <h2>Ruota della Fortuna</h2>
            <p>Configura settori, premi e probabilità della ruota</p>
          </div>
        </div>

        <div className="gaming-settings-section">
          <div className="gaming-settings-section-header">
            <h3>Configurazione Ruota</h3>
            <button className="btn-primary" onClick={handleAddSector}>
              <Plus size={18} />
              Aggiungi Settore
            </button>
          </div>

          {/* Wheel name */}
          <div className="form-group">
            <label>Nome della Ruota</label>
            <input
              type="text"
              value={wheelConfig.name}
              onChange={(e) => setWheelConfig({ ...wheelConfig, name: e.target.value })}
              placeholder="Ruota della Fortuna"
            />
          </div>

          {/* Wheel spin settings */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '16px',
            padding: '20px',
            background: '#f9fafb',
            borderRadius: '12px',
            marginBottom: '24px'
          }}>
            <div className="form-group">
              <label>Spin massimi al giorno</label>
              <input
                type="number"
                min="1"
                max="20"
                value={wheelConfig.max_spins_per_day}
                onChange={(e) => setWheelConfig({
                  ...wheelConfig,
                  max_spins_per_day: parseInt(e.target.value) || 1
                })}
              />
            </div>

            <div className="form-group">
              <label>Cooldown tra spin (ore)</label>
              <input
                type="number"
                min="0"
                max="168"
                value={wheelConfig.cooldown_hours}
                onChange={(e) => setWheelConfig({
                  ...wheelConfig,
                  cooldown_hours: parseInt(e.target.value) || 0
                })}
              />
            </div>

            <div className="form-group">
              <label>Numero di giri completi</label>
              <input
                type="number"
                min="3"
                max="10"
                value={(wheelConfig as any).spin_rotations || 5}
                onChange={(e) => setWheelConfig({
                  ...wheelConfig,
                  spin_rotations: parseInt(e.target.value) || 5
                } as any)}
              />
              <small style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px', display: 'block' }}>
                Giri che fa la ruota prima di fermarsi
              </small>
            </div>
          </div>

          {/* WHEEL PREVIEW */}
          <div style={{
            margin: '24px 0',
            padding: '32px',
            background: 'white',
            borderRadius: '16px',
            border: '2px solid #e5e7eb',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <h4 style={{ margin: 0, color: '#1f2937', fontSize: '18px', fontWeight: '700' }}>
                🎡 Anteprima Ruota
              </h4>
              <button
                className="btn-primary"
                onClick={() => setShowPrizePreview(true)}
                style={{ background: '#8b5cf6', padding: '8px 16px', fontSize: '14px' }}
              >
                <Gift size={16} />
                Vedi Premi
              </button>
            </div>

            <svg width="450" height="450" viewBox="0 0 450 450" style={{
              filter: 'drop-shadow(0 15px 40px rgba(139, 92, 246, 0.4))'
            }}>
              <defs>
                {/* Gradient for border */}
                <linearGradient id="wheelBorder" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#8b5cf6', stopOpacity: 1 }} />
                  <stop offset="100%" style={{ stopColor: '#7c3aed', stopOpacity: 1 }} />
                </linearGradient>
                {/* Shadow for sectors */}
                <filter id="sectorShadow">
                  <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.3"/>
                </filter>
              </defs>

              {/* Sectors */}
              {wheelConfig.sectors.map((sector, index) => {
                const totalSectors = wheelConfig.sectors.length
                const anglePerSector = 360 / totalSectors
                const startAngle = (anglePerSector * index - 90) * (Math.PI / 180)
                const endAngle = (anglePerSector * (index + 1) - 90) * (Math.PI / 180)

                const centerX = 225
                const centerY = 225
                const radius = 210

                const x1 = centerX + radius * Math.cos(startAngle)
                const y1 = centerY + radius * Math.sin(startAngle)
                const x2 = centerX + radius * Math.cos(endAngle)
                const y2 = centerY + radius * Math.sin(endAngle)

                const largeArcFlag = anglePerSector > 180 ? 1 : 0

                const pathData = [
                  `M ${centerX} ${centerY}`,
                  `L ${x1} ${y1}`,
                  `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                  'Z'
                ].join(' ')

                // Text position (middle of the arc)
                const midAngle = (startAngle + endAngle) / 2
                const textRotation = (midAngle * 180 / Math.PI) + 90

                // Render text vertically (letter by letter)
                const letters = sector.label.split('')
                const letterSpacing = 14
                const totalHeight = (letters.length - 1) * letterSpacing
                const startOffset = -totalHeight / 2

                return (
                  <g key={sector.id}>
                    <path
                      d={pathData}
                      fill={sector.color}
                      stroke="rgba(255,255,255,0.4)"
                      strokeWidth="2"
                      filter="url(#sectorShadow)"
                    />
                    {letters.map((letter, letterIndex) => {
                      const textRadius = radius * 0.68
                      const textX = centerX + textRadius * Math.cos(midAngle)
                      const textY = centerY + textRadius * Math.sin(midAngle)
                      const letterOffset = startOffset + (letterIndex * letterSpacing)

                      return (
                        <text
                          key={letterIndex}
                          x={textX}
                          y={textY + letterOffset}
                          fill="white"
                          fontSize="13"
                          fontWeight="800"
                          textAnchor="middle"
                          dominantBaseline="middle"
                          transform={`rotate(${textRotation}, ${textX}, ${textY})`}
                          style={{
                            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
                            letterSpacing: '0.5px'
                          }}
                        >
                          {letter}
                        </text>
                      )
                    })}
                  </g>
                )
              })}

              {/* Outer border circle with gradient */}
              <circle
                cx="225"
                cy="225"
                r="217"
                fill="none"
                stroke="url(#wheelBorder)"
                strokeWidth="10"
              />

              {/* Inner decorative circle */}
              <circle
                cx="225"
                cy="225"
                r="202"
                fill="none"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="1"
              />

              {/* Center circle with gradient */}
              <circle
                cx="225"
                cy="225"
                r="35"
                fill="#8b5cf6"
                stroke="white"
                strokeWidth="6"
                filter="url(#sectorShadow)"
              />

              {/* Center circle inner shine */}
              <circle
                cx="225"
                cy="225"
                r="26"
                fill="rgba(255,255,255,0.15)"
              />
            </svg>

            <p style={{ margin: 0, color: '#6b7280', fontSize: '13px' }}>
              Questa è l'anteprima della ruota. I settori sono distribuiti uniformemente.
            </p>
          </div>

          {/* Sectors list */}
          <div className="sectors-list">
            <h4>Settori ({wheelConfig.sectors.length})</h4>
            {wheelConfig.sectors.map((sector) => (
              <div key={sector.id} className="sector-item" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px',
                background: 'white',
                border: '2px solid #e5e7eb',
                borderRadius: '12px',
                marginBottom: '12px'
              }}>
                <div className="sector-color" style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  background: sector.color,
                  flexShrink: 0,
                  border: '2px solid rgba(0,0,0,0.1)'
                }}></div>

                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '700', color: '#1f2937', marginBottom: '4px' }}>
                    {sector.label}
                  </div>
                  <div style={{ fontSize: '13px', color: '#6b7280' }}>
                    {sector.prize_type === 'points' && `${sector.prize_value} punti`}
                    {sector.prize_type === 'discount' && `${sector.prize_value}% sconto`}
                    {sector.prize_type === 'free_spin' && `${sector.prize_value} spin gratis`}
                    {sector.prize_type === 'free_product' && 'Prodotto gratis'}
                    {sector.prize_type === 'nothing' && 'Nessun premio'}
                    {' • Prob: '}{sector.probability}%
                  </div>
                </div>

                <button
                  className="btn-icon"
                  onClick={() => setEditingSector(sector)}
                  style={{
                    padding: '8px 16px',
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontWeight: '600'
                  }}
                >
                  <Edit3 size={16} />
                  Modifica
                </button>

                <button
                  className="btn-icon-danger"
                  onClick={() => handleDeleteSector(sector.id)}
                  style={{
                    padding: '8px 16px',
                    background: '#dc2626',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontWeight: '600'
                  }}
                >
                  <Trash2 size={16} />
                  Elimina
                </button>
              </div>
            ))}
          </div>

          {/* Save button */}
          <button
            className="btn-save"
            onClick={handleSaveWheelConfig}
            disabled={saving}
          >
            <Save size={20} />
            {saving ? 'Salvataggio...' : 'Salva Configurazione Ruota'}
          </button>

          {/* Success message */}
          {saveSuccess && (
            <div style={{
              marginTop: '16px',
              padding: '16px 20px',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: 'white',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              fontSize: '15px',
              fontWeight: '600',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
              animation: 'slideInUp 0.3s ease-out'
            }}>
              <span style={{ fontSize: '20px' }}>✅</span>
              Configurazione salvata con successo!
            </div>
          )}
        </div>

        {/* SECTOR EDIT MODAL */}
        {editingSector && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(8px)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '32px',
              maxWidth: '500px',
              width: '90%',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}>
              <h3 style={{ margin: '0 0 24px 0', color: '#1f2937', fontSize: '24px', fontWeight: '700' }}>
                ✏️ Modifica Settore
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Etichetta */}
                <div className="form-group">
                  <label>Etichetta Settore</label>
                  <input
                    type="text"
                    value={editingSector.label}
                    onChange={(e) => setEditingSector({ ...editingSector, label: e.target.value })}
                    placeholder="Es: 100 Punti"
                  />
                </div>

                {/* Tipo Premio */}
                <div className="form-group">
                  <label>Tipo Premio</label>
                  <select
                    value={editingSector.prize_type}
                    onChange={(e) => setEditingSector({
                      ...editingSector,
                      prize_type: e.target.value as any
                    })}
                  >
                    <option value="points">Punti</option>
                    <option value="discount">Sconto %</option>
                    <option value="free_product">Prodotto Gratis</option>
                    <option value="free_spin">Spin Gratis</option>
                    <option value="nothing">Nessun Premio</option>
                  </select>
                </div>

                {/* Valore Premio */}
                {editingSector.prize_type !== 'nothing' && editingSector.prize_type !== 'free_product' && (
                  <div className="form-group">
                    <label>
                      {editingSector.prize_type === 'points' && 'Punti'}
                      {editingSector.prize_type === 'discount' && 'Percentuale Sconto'}
                      {editingSector.prize_type === 'free_spin' && 'N° Spin Gratis'}
                    </label>
                    <input
                      type="number"
                      value={editingSector.prize_value || 0}
                      onChange={(e) => setEditingSector({
                        ...editingSector,
                        prize_value: parseInt(e.target.value) || 0
                      })}
                      min="0"
                    />
                  </div>
                )}

                {/* Probabilità */}
                <div className="form-group">
                  <label>Probabilità: {editingSector.probability}%</label>
                  <input
                    type="range"
                    min="1"
                    max="50"
                    value={editingSector.probability}
                    onChange={(e) => setEditingSector({
                      ...editingSector,
                      probability: parseInt(e.target.value)
                    })}
                    style={{ width: '100%' }}
                  />
                </div>

                {/* Colore */}
                <div className="form-group">
                  <label>Colore Settore</label>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <input
                      type="color"
                      value={editingSector.color}
                      onChange={(e) => setEditingSector({ ...editingSector, color: e.target.value })}
                      style={{ width: '60px', height: '40px', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                    />
                    <input
                      type="text"
                      value={editingSector.color}
                      onChange={(e) => setEditingSector({ ...editingSector, color: e.target.value })}
                      style={{ flex: 1 }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button
                  className="btn-primary"
                  onClick={() => {
                    handleUpdateSector(editingSector.id, editingSector)
                    setEditingSector(null)
                  }}
                  style={{ flex: 1 }}
                >
                  <Save size={18} />
                  Salva Modifiche
                </button>
                <button
                  className="btn-primary"
                  onClick={() => setEditingSector(null)}
                  style={{ background: '#6b7280', flex: 1 }}
                >
                  Annulla
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PRIZE PREVIEW MODAL */}
        {showPrizePreview && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(8px)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '32px',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ margin: 0, color: '#1f2937', fontSize: '24px', fontWeight: '700' }}>
                  🎁 Anteprima Premi Ruota
                </h3>
                <button
                  onClick={() => setShowPrizePreview(false)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    fontSize: '24px',
                    cursor: 'pointer',
                    color: '#dc2626',
                    fontWeight: '700',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  ×
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {wheelConfig.sectors.map((sector) => (
                  <div key={sector.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '16px',
                    background: '#f9fafb',
                    borderRadius: '12px',
                    border: '2px solid #e5e7eb'
                  }}>
                    <div style={{
                      width: '50px',
                      height: '50px',
                      borderRadius: '8px',
                      background: sector.color,
                      flexShrink: 0,
                      border: '2px solid rgba(0,0,0,0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {sector.prize_type === 'points' && '💰'}
                      {sector.prize_type === 'discount' && '💸'}
                      {sector.prize_type === 'free_spin' && '🎰'}
                      {sector.prize_type === 'free_product' && '🎁'}
                      {sector.prize_type === 'nothing' && '😢'}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '700', color: '#1f2937', fontSize: '16px', marginBottom: '4px' }}>
                        {sector.label}
                      </div>
                      <div style={{ fontSize: '14px', color: '#6b7280' }}>
                        {sector.prize_type === 'points' && `Premio: ${sector.prize_value} punti`}
                        {sector.prize_type === 'discount' && `Premio: ${sector.prize_value}% di sconto`}
                        {sector.prize_type === 'free_spin' && `Premio: ${sector.prize_value} spin gratis`}
                        {sector.prize_type === 'free_product' && 'Premio: Prodotto gratis'}
                        {sector.prize_type === 'nothing' && 'Nessun premio'}
                      </div>
                    </div>

                    <div style={{
                      padding: '6px 12px',
                      background: '#8b5cf6',
                      color: 'white',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '700'
                    }}>
                      {sector.probability}%
                    </div>
                  </div>
                ))}
              </div>

              <div style={{
                marginTop: '24px',
                padding: '16px',
                background: '#fef3c7',
                borderRadius: '12px',
                border: '2px solid #f59e0b'
              }}>
                <div style={{ fontWeight: '700', color: '#92400e', marginBottom: '8px', fontSize: '14px' }}>
                  📊 Statistiche Probabilità
                </div>
                <div style={{ fontSize: '13px', color: '#78350f' }}>
                  Totale probabilità: {wheelConfig.sectors.reduce((sum, s) => sum + s.probability, 0)}%
                  {wheelConfig.sectors.reduce((sum, s) => sum + s.probability, 0) !== 100 && (
                    <span style={{ color: '#dc2626', fontWeight: '700', marginLeft: '8px' }}>
                      ⚠️ Attenzione: dovrebbe essere 100%
                    </span>
                  )}
                </div>
              </div>

              <button
                className="btn-primary"
                onClick={() => setShowPrizePreview(false)}
                style={{ width: '100%', marginTop: '20px', background: '#8b5cf6' }}
              >
                Chiudi
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  // CHALLENGES MANAGEMENT VIEW
  const renderChallengesManagement = () => {
    return (
      <div className="gaming-settings-detail-view">
        <button className="gaming-settings-back-btn" onClick={() => setViewMode('hub')}>
          <ArrowLeft size={20} />
          Torna alla Dashboard
        </button>

        <div className="gaming-settings-detail-header">
          <div className="gaming-settings-detail-icon" style={{ background: '#f59e0b' }}>
            <Target size={32} />
          </div>
          <div>
            <h2>Gestione Challenge</h2>
            <p>Crea e modifica challenge giornaliere e settimanali</p>
          </div>
        </div>

        <div className="gaming-settings-section">
          <div className="gaming-settings-section-header">
            <h3>Challenge Disponibili ({challenges.length})</h3>
            <button className="btn-primary" onClick={() => setShowCreateChallenge(true)}>
              <Plus size={18} />
              Nuova Challenge
            </button>
          </div>

          {/* Form creazione challenge */}
          {showCreateChallenge && (
            <div style={{
              padding: '24px',
              background: 'white',
              border: '2px solid #10b981',
              borderRadius: '12px',
              marginBottom: '24px'
            }}>
              <h4 style={{ margin: '0 0 20px 0', color: '#1f2937', fontSize: '20px', fontWeight: '700' }}>
                ➕ Crea Nuova Challenge
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {/* Titolo */}
                <div className="form-group">
                  <label>Titolo Challenge</label>
                  <input
                    type="text"
                    value={newChallenge.title}
                    onChange={(e) => setNewChallenge({ ...newChallenge, title: e.target.value })}
                    placeholder="Es: Shopping Veloce"
                  />
                </div>

                {/* Emoji */}
                <div className="form-group">
                  <label>Emoji</label>
                  <input
                    type="text"
                    value={newChallenge.icon_emoji}
                    onChange={(e) => setNewChallenge({ ...newChallenge, icon_emoji: e.target.value })}
                    placeholder="🎯"
                  />
                </div>

                {/* Descrizione */}
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Descrizione</label>
                  <input
                    type="text"
                    value={newChallenge.description}
                    onChange={(e) => setNewChallenge({ ...newChallenge, description: e.target.value })}
                    placeholder="Es: Fai 3 acquisti oggi"
                  />
                </div>

                {/* Tipo */}
                <div className="form-group">
                  <label>Tipo Challenge</label>
                  <select
                    value={newChallenge.type}
                    onChange={(e) => setNewChallenge({
                      ...newChallenge,
                      type: e.target.value as 'daily' | 'weekly',
                      durationHours: e.target.value === 'daily' ? 24 : 168
                    })}
                  >
                    <option value="daily">Giornaliera (24h)</option>
                    <option value="weekly">Settimanale (7 giorni)</option>
                  </select>
                </div>

                {/* Difficoltà */}
                <div className="form-group">
                  <label>Difficoltà</label>
                  <select
                    value={newChallenge.difficulty}
                    onChange={(e) => setNewChallenge({ ...newChallenge, difficulty: e.target.value as any })}
                  >
                    <option value="easy">Facile</option>
                    <option value="medium">Media</option>
                    <option value="hard">Difficile</option>
                  </select>
                </div>

                {/* Tipo Requisito */}
                <div className="form-group">
                  <label>Requisito</label>
                  <select
                    value={newChallenge.requirementType}
                    onChange={(e) => setNewChallenge({ ...newChallenge, requirementType: e.target.value })}
                  >
                    <option value="make_purchases">Fai X acquisti</option>
                    <option value="spend_amount">Spendi €X</option>
                    <option value="earn_points">Guadagna X punti</option>
                    <option value="redeem_rewards">Riscatta X premi</option>
                    <option value="visit_count">Fai X visite</option>
                    <option value="referrals">Invita X amici</option>
                  </select>
                </div>

                {/* Valore Requisito */}
                <div className="form-group">
                  <label>Valore Requisito</label>
                  <input
                    type="number"
                    value={newChallenge.requirementValue}
                    onChange={(e) => setNewChallenge({ ...newChallenge, requirementValue: parseInt(e.target.value) || 0 })}
                    min="1"
                  />
                </div>

                {/* Ricompensa Punti */}
                <div className="form-group">
                  <label>Punti Ricompensa</label>
                  <input
                    type="number"
                    value={newChallenge.rewardPoints}
                    onChange={(e) => setNewChallenge({ ...newChallenge, rewardPoints: parseInt(e.target.value) || 0 })}
                    min="0"
                  />
                </div>

                {/* Ricompensa Spin */}
                <div className="form-group">
                  <label>Spin Gratis Ricompensa</label>
                  <input
                    type="number"
                    value={newChallenge.rewardSpins}
                    onChange={(e) => setNewChallenge({ ...newChallenge, rewardSpins: parseInt(e.target.value) || 0 })}
                    min="0"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button
                  className="btn-primary"
                  onClick={handleCreateChallenge}
                  disabled={!newChallenge.title || !newChallenge.description || saving}
                  style={{ flex: 1 }}
                >
                  <Plus size={18} />
                  {saving ? 'Creazione...' : 'Crea Challenge'}
                </button>
                <button
                  className="btn-primary"
                  onClick={() => setShowCreateChallenge(false)}
                  style={{ background: '#6b7280', flex: 1 }}
                >
                  Annulla
                </button>
              </div>
            </div>
          )}

          <div className="challenges-list">
            {challenges.map(challenge => (
              <div key={challenge.id} className="challenge-item">
                <div className="challenge-icon">{challenge.icon_emoji || '🎯'}</div>
                <div className="challenge-info">
                  <h4>{challenge.title}</h4>
                  <p>{challenge.description}</p>
                  <span className="challenge-type">{challenge.type}</span>
                </div>
                <div className="challenge-rewards">
                  {challenge.rewards.points && <span>+{challenge.rewards.points} punti</span>}
                  {challenge.rewards.free_spins && <span>{challenge.rewards.free_spins} spin</span>}
                </div>
                <div className="challenge-actions">
                  <button className="btn-icon">
                    <Edit3 size={18} />
                  </button>
                  <button className="btn-icon-danger">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // BADGES MANAGEMENT VIEW
  const renderBadgesManagement = () => {
    return (
      <div className="gaming-settings-detail-view">
        <button className="gaming-settings-back-btn" onClick={() => setViewMode('hub')}>
          <ArrowLeft size={20} />
          Torna alla Dashboard
        </button>

        <div className="gaming-settings-detail-header">
          <div className="gaming-settings-detail-icon" style={{ background: '#10b981' }}>
            <Trophy size={32} />
          </div>
          <div>
            <h2>Gestione Badge</h2>
            <p>Crea badge, imposta rarità e regole di sblocco</p>
          </div>
        </div>

        <div className="gaming-settings-section">
          <div className="gaming-settings-section-header">
            <h3>Badge Disponibili ({badges.length})</h3>
            <button className="btn-primary" onClick={() => setShowCreateBadge(true)}>
              <Plus size={18} />
              Nuovo Badge
            </button>
          </div>

          {/* Form creazione badge */}
          {showCreateBadge && (
            <div style={{
              padding: '24px',
              background: 'white',
              border: '2px solid #10b981',
              borderRadius: '12px',
              marginBottom: '24px'
            }}>
              <h4 style={{ margin: '0 0 20px 0', color: '#1f2937', fontSize: '20px', fontWeight: '700' }}>
                ➕ Crea Nuovo Badge
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {/* Nome */}
                <div className="form-group">
                  <label>Nome Badge</label>
                  <input
                    type="text"
                    value={newBadge.name}
                    onChange={(e) => setNewBadge({ ...newBadge, name: e.target.value })}
                    placeholder="Es: Primo Acquisto"
                  />
                </div>

                {/* Emoji */}
                <div className="form-group">
                  <label>Emoji</label>
                  <input
                    type="text"
                    value={newBadge.icon_emoji}
                    onChange={(e) => setNewBadge({ ...newBadge, icon_emoji: e.target.value })}
                    placeholder="🏆"
                  />
                </div>

                {/* Descrizione */}
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Descrizione</label>
                  <input
                    type="text"
                    value={newBadge.description}
                    onChange={(e) => setNewBadge({ ...newBadge, description: e.target.value })}
                    placeholder="Es: Hai effettuato il tuo primo acquisto!"
                  />
                </div>

                {/* Categoria */}
                <div className="form-group">
                  <label>Categoria</label>
                  <select
                    value={newBadge.category}
                    onChange={(e) => setNewBadge({ ...newBadge, category: e.target.value as BadgeCategory })}
                  >
                    <option value="firstSteps">Primi Passi</option>
                    <option value="loyalty">Fedeltà</option>
                    <option value="spending">Spesa</option>
                    <option value="frequency">Frequenza</option>
                    <option value="social">Social</option>
                    <option value="seasonal">Stagionale</option>
                    <option value="special">Speciale</option>
                  </select>
                </div>

                {/* Rarità */}
                <div className="form-group">
                  <label>Rarità</label>
                  <select
                    value={newBadge.rarity}
                    onChange={(e) => setNewBadge({ ...newBadge, rarity: e.target.value as BadgeRarity })}
                  >
                    <option value="common">Comune</option>
                    <option value="rare">Raro</option>
                    <option value="epic">Epico</option>
                    <option value="legendary">Leggendario</option>
                  </select>
                </div>

                {/* Ricompensa Punti */}
                <div className="form-group">
                  <label>Punti Ricompensa</label>
                  <input
                    type="number"
                    value={newBadge.rewardPoints}
                    onChange={(e) => setNewBadge({ ...newBadge, rewardPoints: parseInt(e.target.value) || 0 })}
                    min="0"
                  />
                </div>

                {/* Ricompensa Spin */}
                <div className="form-group">
                  <label>Spin Gratis Ricompensa</label>
                  <input
                    type="number"
                    value={newBadge.rewardSpins}
                    onChange={(e) => setNewBadge({ ...newBadge, rewardSpins: parseInt(e.target.value) || 0 })}
                    min="0"
                  />
                </div>

                {/* Ricompensa Sconto */}
                <div className="form-group">
                  <label>Sconto % Ricompensa</label>
                  <input
                    type="number"
                    value={newBadge.rewardDiscount}
                    onChange={(e) => setNewBadge({ ...newBadge, rewardDiscount: parseInt(e.target.value) || 0 })}
                    min="0"
                    max="100"
                  />
                </div>

                {/* Abilita auto-unlock */}
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="toggle-label">
                    <input
                      type="checkbox"
                      checked={newBadge.autoUnlockEnabled}
                      onChange={(e) => setNewBadge({ ...newBadge, autoUnlockEnabled: e.target.checked })}
                    />
                    <span>Abilita sblocco automatico</span>
                  </label>
                </div>

                {/* Regole sblocco automatico (solo se abilitato) */}
                {newBadge.autoUnlockEnabled && (
                  <>
                    <div className="form-group">
                      <label>Tipo Regola Sblocco</label>
                      <select
                        value={newBadge.unlockRuleType}
                        onChange={(e) => setNewBadge({ ...newBadge, unlockRuleType: e.target.value })}
                      >
                        <option value="registration">Registrazione</option>
                        <option value="purchase_count">N° Acquisti</option>
                        <option value="total_spent">Spesa Totale</option>
                        <option value="visit_count">N° Visite</option>
                        <option value="points_reached">Punti Raggiunti</option>
                        <option value="days_since_registration">Giorni dalla Registrazione</option>
                        <option value="reward_redeemed">Premi Riscattati</option>
                        <option value="referrals">Referral</option>
                        <option value="challenges_completed">Challenge Completate</option>
                        <option value="streak_days">Giorni Consecutivi</option>
                      </select>
                    </div>

                    {newBadge.unlockRuleType !== 'registration' && (
                      <div className="form-group">
                        <label>Soglia Sblocco</label>
                        <input
                          type="number"
                          value={newBadge.unlockThreshold}
                          onChange={(e) => setNewBadge({ ...newBadge, unlockThreshold: parseInt(e.target.value) || 1 })}
                          min="1"
                        />
                      </div>
                    )}
                  </>
                )}
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button
                  className="btn-primary"
                  onClick={handleCreateBadge}
                  disabled={!newBadge.name || !newBadge.description || saving}
                  style={{ flex: 1 }}
                >
                  <Plus size={18} />
                  {saving ? 'Creazione...' : 'Crea Badge'}
                </button>
                <button
                  className="btn-primary"
                  onClick={() => setShowCreateBadge(false)}
                  style={{ background: '#6b7280', flex: 1 }}
                >
                  Annulla
                </button>
              </div>
            </div>
          )}

          <div className="badges-list">
            {badges.map(badge => (
              <div key={badge.id} className={`badge-item rarity-${badge.rarity}`}>
                <div className="badge-icon">{badge.icon_emoji || '🏆'}</div>
                <div className="badge-info">
                  <h4>{badge.name}</h4>
                  <p>{badge.description}</p>
                  <span className={`badge-rarity ${badge.rarity}`}>{badge.rarity}</span>
                </div>
                <div className="badge-actions">
                  <button className="btn-icon">
                    <Edit3 size={18} />
                  </button>
                  <button className="btn-icon-danger">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // GENERAL SETTINGS VIEW
  const renderGeneralSettings = () => {
    return (
      <div className="gaming-settings-detail-view">
        <button className="gaming-settings-back-btn" onClick={() => setViewMode('hub')}>
          <ArrowLeft size={20} />
          Torna alla Dashboard
        </button>

        <div className="gaming-settings-detail-header">
          <div className="gaming-settings-detail-icon" style={{ background: '#6b7280' }}>
            <Settings size={32} />
          </div>
          <div>
            <h2>Impostazioni Generali</h2>
            <p>Configura le impostazioni globali del modulo gaming</p>
          </div>
        </div>

        <div className="gaming-settings-section">
          <h3>Abilitazione Moduli</h3>

          <div className="form-group">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={generalSettings.wheelEnabled}
                onChange={(e) => setGeneralSettings({
                  ...generalSettings,
                  wheelEnabled: e.target.checked
                })}
              />
              <span>Abilita Ruota della Fortuna</span>
            </label>
          </div>

          <div className="form-group">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={generalSettings.challengesEnabled}
                onChange={(e) => setGeneralSettings({
                  ...generalSettings,
                  challengesEnabled: e.target.checked
                })}
              />
              <span>Abilita Challenge</span>
            </label>
          </div>

          <div className="form-group">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={generalSettings.badgesEnabled}
                onChange={(e) => setGeneralSettings({
                  ...generalSettings,
                  badgesEnabled: e.target.checked
                })}
              />
              <span>Abilita Badge</span>
            </label>
          </div>

          <h3 style={{ marginTop: '32px' }}>Personalizzazione</h3>

          <div className="form-group">
            <label>Colore Primario</label>
            <div className="color-picker">
              <input
                type="color"
                value={generalSettings.primaryColor}
                onChange={(e) => setGeneralSettings({
                  ...generalSettings,
                  primaryColor: e.target.value
                })}
              />
              <span>{generalSettings.primaryColor}</span>
            </div>
          </div>

          <button className="btn-save">
            <Save size={20} />
            Salva Impostazioni Generali
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="gaming-settings-container" style={{ '--primary-color': primaryColor } as React.CSSProperties}>
      {/* Close Button */}
      {onClose && (
        <button
          className="gaming-settings-close-btn"
          onClick={onClose}
          aria-label="Chiudi"
        >
          <X size={24} strokeWidth={3} />
        </button>
      )}

      {viewMode === 'hub' && renderHub()}
      {viewMode === 'wheel' && renderWheelManagement()}
      {viewMode === 'challenges' && renderChallengesManagement()}
      {viewMode === 'badges' && renderBadgesManagement()}
      {viewMode === 'general' && renderGeneralSettings()}
    </div>
  )
}

export default GamingSettings
