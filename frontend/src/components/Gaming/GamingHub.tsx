/**
 * OMNILYPRO GAMING MODULE - Gaming Hub
 * Main dashboard for all gaming features
 */

import React, { useState, useEffect, useCallback } from 'react'
import { Trophy, Target, Sparkles, Award, Zap, Gift, ChevronRight, X } from 'lucide-react'
import { badgeService } from '../../services/gaming/badgeService'
import { challengeService } from '../../services/gaming/challengeService'
import { spinService } from '../../services/gaming/spinService'
import { slotMachineService } from '../../services/gaming/slotMachineService'
import { scratchCardService } from '../../services/gaming/scratchCardService'
import { gamingSetupService } from '../../services/gaming/gamingSetupService'
import BadgeGallery from './BadgeGallery'
import ChallengesHub from './ChallengesHub'
import SpinWheel from './SpinWheel'
import SlotMachine from './SlotMachine'
import ScratchCard from './ScratchCard'
import BadgeUnlockNotification from './BadgeUnlockNotification'
import type { CustomerBadge, CustomerChallenge, BadgeUnlockResult, SlotPrize } from '../../services/gaming/types'
import type { ScratchPrize } from './ScratchCard'
import './GamingHub.css'

interface GamingHubProps {
  customerId: string
  organizationId: string
  primaryColor?: string
  onClose?: () => void
  onPointsUpdated?: () => void // Called when customer points change
}

const GamingHub: React.FC<GamingHubProps> = ({
  customerId,
  organizationId,
  primaryColor = '#dc2626',
  onClose,
  onPointsUpdated
}) => {
  // 🔍 DEBUG: Render counter
  const renderCount = React.useRef(0)
  renderCount.current++
  console.log(`🔄 GamingHub render #${renderCount.current}`)
  console.log('  customerId:', customerId)
  console.log('  organizationId:', organizationId)
  console.log('  primaryColor:', primaryColor)

  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalBadges: 0,
    unlockedBadges: 0,
    activeChallenges: 0,
    completedChallenges: 0,
    spinsAvailable: 0,
    totalSpins: 0,
    slotPlaysAvailable: 0,
    totalSlotPlays: 0,
    scratchPlaysAvailable: 0,
    totalScratchPlays: 0
  })

  const [recentBadges, setRecentBadges] = useState<CustomerBadge[]>([])
  const [activeChallenges, setActiveChallenges] = useState<CustomerChallenge[]>([])

  // Modal states
  const [showBadgeGallery, setShowBadgeGallery] = useState(false)
  const [showChallengesHub, setShowChallengesHub] = useState(false)
  const [showSpinWheel, setShowSpinWheel] = useState(false)
  const [showSlotMachine, setShowSlotMachine] = useState(false)
  const [showScratchCard, setShowScratchCard] = useState(false)

  // Badge unlock notification
  const [badgeUnlock, setBadgeUnlock] = useState<BadgeUnlockResult | null>(null)

  // 🔍 DEBUG: Track prop changes
  const prevProps = React.useRef({ customerId, organizationId, primaryColor })
  useEffect(() => {
    if (prevProps.current.customerId !== customerId) {
      console.log('⚠️ customerId CHANGED:', prevProps.current.customerId, '→', customerId)
    }
    if (prevProps.current.organizationId !== organizationId) {
      console.log('⚠️ organizationId CHANGED:', prevProps.current.organizationId, '→', organizationId)
    }
    if (prevProps.current.primaryColor !== primaryColor) {
      console.log('⚠️ primaryColor CHANGED:', prevProps.current.primaryColor, '→', primaryColor)
    }
    prevProps.current = { customerId, organizationId, primaryColor }
  }, [customerId, organizationId, primaryColor])

  // 🔍 DEBUG: Track showSpinWheel changes
  useEffect(() => {
    console.log('🔄 showSpinWheel state changed to:', showSpinWheel)
    if (showSpinWheel) {
      console.trace('📍 Stack trace for showSpinWheel = true')
    }
  }, [showSpinWheel])

  const loadGamingStats = useCallback(async () => {
    try {
      setLoading(true)

      console.log('🎮 Loading gaming stats for customer:', customerId, 'org:', organizationId)

      // 🎮 AUTO-SETUP: Ensure Gaming Module is setup for this organization
      // This runs automatically on first access - multi-tenant ready!
      console.log('🔧 Ensuring setup...')
      await gamingSetupService.ensureSetup(organizationId)
      console.log('✅ Setup ensured')

      // 👤 Ensure customer is initialized (challenges generated, badges checked)
      console.log('👤 Initializing customer...')
      await gamingSetupService.ensureCustomerInitialized(customerId, organizationId)
      console.log('✅ Customer initialized')

      // Load badge stats
      console.log('🏆 Loading badge stats...')
      const badgeStats = await badgeService.getBadgeStats(customerId, organizationId)
      console.log('Badge stats:', badgeStats)

      // Load customer badges (recent 3)
      console.log('🏆 Loading customer badges...')
      const allBadges = await badgeService.getCustomerBadges(customerId)
      const recent = allBadges
        .filter(b => b.unlocked)
        .sort((a, b) => new Date(b.unlocked_at || '').getTime() - new Date(a.unlocked_at || '').getTime())
        .slice(0, 3)
      setRecentBadges(recent)
      console.log('Recent badges:', recent.length)

      // Load challenge stats
      console.log('🎯 Loading challenges...')
      const allChallenges = await challengeService.getCustomerChallenges(customerId)
      const active = allChallenges.filter(c => c.status === 'active')
      const completed = allChallenges.filter(c => c.status === 'completed')
      setActiveChallenges(active.slice(0, 3))
      console.log('Challenges - active:', active.length, 'completed:', completed.length)

      // Load spin stats
      console.log('🎡 Loading spin stats...')
      const { canSpin, spinsToday, maxSpins } = await spinService.canSpin(customerId, organizationId)
      const spinsLeft = maxSpins - spinsToday
      console.log('🎡 Spin Stats:')
      console.log('  - spinsToday:', spinsToday)
      console.log('  - maxSpins:', maxSpins)
      console.log('  - spinsLeft:', spinsLeft)
      console.log('  - canSpin:', canSpin)

      // Load slot machine stats
      console.log('🎰 Loading slot machine stats...')
      const { canPlay, spinsToday: slotPlaysToday, maxSpins: maxSlotPlays } = await slotMachineService.canPlay(customerId, organizationId)
      const slotPlaysLeft = maxSlotPlays - slotPlaysToday
      console.log('🎰 Slot Stats:')
      console.log('  - playsToday:', slotPlaysToday)
      console.log('  - maxPlays:', maxSlotPlays)
      console.log('  - playsLeft:', slotPlaysLeft)
      console.log('  - canPlay:', canPlay)

      // Load scratch card stats
      console.log('🎫 Loading scratch card stats...')
      const { canPlay: canScratch, playsToday: scratchPlaysToday, maxPlays: maxScratchPlays } = await scratchCardService.canPlay(customerId, organizationId)
      const scratchPlaysLeft = maxScratchPlays - scratchPlaysToday
      console.log('🎫 Scratch Card Stats:')
      console.log('  - playsToday:', scratchPlaysToday)
      console.log('  - maxPlays:', maxScratchPlays)
      console.log('  - playsLeft:', scratchPlaysLeft)
      console.log('  - canScratch:', canScratch)

      setStats({
        totalBadges: badgeStats.total_badges,
        unlockedBadges: badgeStats.unlocked_count,
        activeChallenges: active.length,
        completedChallenges: completed.length,
        spinsAvailable: spinsLeft,
        totalSpins: maxSpins,
        slotPlaysAvailable: slotPlaysLeft,
        totalSlotPlays: maxSlotPlays,
        scratchPlaysAvailable: scratchPlaysLeft,
        totalScratchPlays: maxScratchPlays
      })

      console.log('✅ Gaming stats loaded successfully')
    } catch (error) {
      console.error('❌ Error loading gaming stats:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      // Even on error, stop loading to show something
      setStats({
        totalBadges: 0,
        unlockedBadges: 0,
        activeChallenges: 0,
        completedChallenges: 0,
        spinsAvailable: 0,
        totalSpins: 3,
        slotPlaysAvailable: 0,
        totalSlotPlays: 3,
        scratchPlaysAvailable: 0,
        totalScratchPlays: 1
      })
    } finally {
      console.log('🏁 Finally block - setting loading to false')
      setLoading(false)
      console.log('🏁 Loading state after setLoading:', false)
    }
  }, [customerId, organizationId])

  useEffect(() => {
    loadGamingStats()

    // Safety timeout - stop loading after 5 seconds max
    const timeout = setTimeout(() => {
      console.warn('⏰ Loading timeout - forcing stop')
      setLoading(false)
    }, 5000)

    return () => clearTimeout(timeout)
  }, [loadGamingStats])

  const handleSpinComplete = useCallback(async (prize?: SpinPrize) => {
    console.log('🎡 Spin completed, updating stats...')

    // Update ONLY spin stats (lightweight update, no full reload)
    try {
      const { canSpin, spinsToday, maxSpins } = await spinService.canSpin(customerId, organizationId)
      const spinsLeft = maxSpins - spinsToday

      setStats(prev => ({
        ...prev,
        spinsAvailable: spinsLeft
      }))

      console.log('✅ Spin stats updated - spins left:', spinsLeft)

      // If points were won, notify parent to refresh customer data
      if (prize && prize.type === 'points' && onPointsUpdated) {
        console.log('💰 Points won from wheel! Notifying parent to refresh...')
        onPointsUpdated()
      }
    } catch (error) {
      console.error('❌ Error updating spin stats:', error)
    }

    // Check for new badge unlocks (lightweight)
    if (prize) {
      try {
        const results = await badgeService.checkAndUnlockBadges(customerId, organizationId)
        if (results.length > 0 && results[0].unlocked) {
          setBadgeUnlock(results[0])
        }
      } catch (error) {
        console.error('❌ Error checking badges:', error)
      }
    }
  }, [customerId, organizationId, onPointsUpdated])

  const handleCloseSpinWheel = useCallback(() => {
    console.log('🎡 handleCloseSpinWheel called')
    setShowSpinWheel(false)
  }, [])

  const handleSlotComplete = useCallback(async (prize?: SlotPrize) => {
    console.log('🎰 Slot play completed, updating stats...')

    // Update ONLY slot stats (lightweight update)
    try {
      const { canPlay, spinsToday: slotPlaysToday, maxSpins: maxSlotPlays } = await slotMachineService.canPlay(customerId, organizationId)
      const slotPlaysLeft = maxSlotPlays - slotPlaysToday

      setStats(prev => ({
        ...prev,
        slotPlaysAvailable: slotPlaysLeft
      }))

      console.log('✅ Slot stats updated - plays left:', slotPlaysLeft)

      // If points were won, notify parent to refresh customer data
      if (prize && prize.type === 'points' && onPointsUpdated) {
        console.log('💰 Points won! Notifying parent to refresh...')
        onPointsUpdated()
      }
    } catch (error) {
      console.error('❌ Error updating slot stats:', error)
    }

    // Check for new badge unlocks if won
    if (prize) {
      try {
        const results = await badgeService.checkAndUnlockBadges(customerId, organizationId)
        if (results.length > 0 && results[0].unlocked) {
          setBadgeUnlock(results[0])
        }
      } catch (error) {
        console.error('❌ Error checking badges:', error)
      }
    }
  }, [customerId, organizationId, onPointsUpdated])

  const handleCloseSlotMachine = useCallback(() => {
    console.log('🎰 handleCloseSlotMachine called')
    setShowSlotMachine(false)
  }, [])

  const handleScratchComplete = useCallback(async (prize?: ScratchPrize) => {
    console.log('🎫 Scratch card completed, updating stats...')

    // Update ONLY scratch card stats (lightweight update)
    try {
      const { canPlay: canScratch, playsToday: scratchPlaysToday, maxPlays: maxScratchPlays } = await scratchCardService.canPlay(customerId, organizationId)
      const scratchPlaysLeft = maxScratchPlays - scratchPlaysToday

      setStats(prev => ({
        ...prev,
        scratchPlaysAvailable: scratchPlaysLeft
      }))

      console.log('✅ Scratch card stats updated - plays left:', scratchPlaysLeft)

      // If points were won, notify parent to refresh customer data
      if (prize && prize.type === 'points' && onPointsUpdated) {
        console.log('💰 Points won from scratch card! Notifying parent to refresh...')
        onPointsUpdated()
      }
    } catch (error) {
      console.error('❌ Error updating scratch card stats:', error)
    }

    // Check for new badge unlocks
    if (prize) {
      try {
        const results = await badgeService.checkAndUnlockBadges(customerId, organizationId)
        if (results.length > 0 && results[0].unlocked) {
          setBadgeUnlock(results[0])
        }
      } catch (error) {
        console.error('❌ Error checking badges:', error)
      }
    }
  }, [customerId, organizationId, onPointsUpdated])

  const handleCloseScratchCard = useCallback(() => {
    console.log('🎫 handleCloseScratchCard called')
    setShowScratchCard(false)
  }, [])

  console.log('🎮 GamingHub render - loading state:', loading)

  if (loading) {
    console.log('🔄 Showing loading text instead of spinner')
    return (
      <div className="gaming-hub">
        <div className="gaming-hub-loading">
          <p style={{ fontSize: '18px', color: '#666' }}>Caricamento Gaming Module...</p>
        </div>
      </div>
    )
  }

  console.log('✅ Showing Gaming Hub content')
  return (
    <>
      <div className="gaming-hub" style={{ '--primary-color': primaryColor } as React.CSSProperties}>
        {/* Close Button */}
        {onClose && (
          <button
            className="gaming-hub-close-button"
            onClick={onClose}
            aria-label="Chiudi"
          >
            <X size={24} strokeWidth={3} />
          </button>
        )}

        {/* Header */}
        <div className="gaming-hub-header">
          <div className="gaming-hub-title">
            <Trophy size={36} />
            <h1>Gaming Hub</h1>
          </div>
          <p className="gaming-hub-subtitle">
            Completa sfide, sblocca badge e gira la ruota per vincere premi!
          </p>
        </div>

        {/* Stats Overview */}
        <div className="gaming-stats-grid">
          <div className="stat-card badges">
            <div className="stat-icon">
              <Award size={32} />
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.unlockedBadges}/{stats.totalBadges}</div>
              <div className="stat-label">Badge Sbloccati</div>
              <div className="stat-progress">
                <div
                  className="stat-progress-fill"
                  style={{ width: `${(stats.unlockedBadges / stats.totalBadges) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="stat-card challenges">
            <div className="stat-icon">
              <Target size={32} />
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.activeChallenges}</div>
              <div className="stat-label">Challenge Attive</div>
              <div className="stat-subtext">{stats.completedChallenges} completate</div>
            </div>
          </div>

          <div className="stat-card spins">
            <div className="stat-icon">
              <Sparkles size={32} />
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.spinsAvailable}/{stats.totalSpins}</div>
              <div className="stat-label">Spin Disponibili</div>
              <div className="stat-subtext">oggi</div>
            </div>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="gaming-features-grid">
          {/* Badges Feature */}
          <div className="feature-card">
            <div className="feature-header">
              <div className="feature-icon badges">
                <Award size={28} />
              </div>
              <div className="feature-title-group">
                <h3 className="feature-title">Badge Collection</h3>
                <p className="feature-description">Sblocca badge completando obiettivi</p>
              </div>
            </div>

            {/* Recent badges */}
            {recentBadges.length > 0 && (
              <div className="recent-badges">
                <h4 className="recent-title">Ultimi Sbloccati</h4>
                <div className="badge-list">
                  {recentBadges.map(customerBadge => {
                    const badge = customerBadge.badge
                    if (!badge) return null
                    return (
                      <div key={customerBadge.id} className="mini-badge">
                        <span className="mini-badge-icon">{badge.icon_emoji}</span>
                        <span className="mini-badge-name">{badge.name}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <button
              className="feature-cta"
              onClick={() => {
                console.log('🏆 Click on "Vedi Galleria" button')
                setShowBadgeGallery(true)
              }}
            >
              Vedi Galleria
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Challenges Feature */}
          <div className="feature-card">
            <div className="feature-header">
              <div className="feature-icon challenges">
                <Target size={28} />
              </div>
              <div className="feature-title-group">
                <h3 className="feature-title">Challenge</h3>
                <p className="feature-description">Completa sfide giornaliere e settimanali</p>
              </div>
            </div>

            {/* Active challenges preview */}
            {activeChallenges.length > 0 && (
              <div className="active-challenges-preview">
                <h4 className="recent-title">In Corso</h4>
                {activeChallenges.map(customerChallenge => {
                  const challenge = customerChallenge.challenge
                  if (!challenge) return null
                  return (
                    <div key={customerChallenge.id} className="mini-challenge">
                      <span className="mini-challenge-icon">{challenge.icon_emoji || '🎯'}</span>
                      <div className="mini-challenge-info">
                        <span className="mini-challenge-name">{challenge.title}</span>
                        <div className="mini-progress-bar">
                          <div
                            className="mini-progress-fill"
                            style={{ width: `${customerChallenge.progress.percentage || 0}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {activeChallenges.length === 0 && (
              <div className="feature-empty">
                <Zap size={24} color="#9ca3af" />
                <p>Nessuna challenge attiva</p>
              </div>
            )}

            <button
              className="feature-cta"
              onClick={() => {
                console.log('🎯 Click on "Vedi Tutte" button')
                setShowChallengesHub(true)
              }}
            >
              Vedi Tutte
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Spin Wheel Feature */}
          <div className="feature-card spin">
            <div className="feature-header">
              <div className="feature-icon spins">
                <Sparkles size={28} />
              </div>
              <div className="feature-title-group">
                <h3 className="feature-title">Ruota della Fortuna</h3>
                <p className="feature-description">Gira per vincere premi e punti!</p>
              </div>
            </div>

            <div className="spin-preview">
              <div className="spin-visual">
                <div className="spin-circle">
                  <Gift size={48} color="#f59e0b" />
                </div>
              </div>
              <div className="spin-info">
                {stats.spinsAvailable > 0 ? (
                  <>
                    <p className="spin-available">
                      <strong>{stats.spinsAvailable}</strong> {stats.spinsAvailable === 1 ? 'spin disponibile' : 'spin disponibili'}
                    </p>
                    <p className="spin-hint">Clicca per girare la ruota!</p>
                  </>
                ) : (
                  <p className="spin-unavailable">Hai esaurito i tuoi spin giornalieri</p>
                )}
              </div>
            </div>

            <button
              className="feature-cta spin-cta"
              onClick={(e) => {
                if (stats.spinsAvailable === 0) return
                console.log('🎡 Click on "Gira Ora!" button')
                setShowSpinWheel(true)
              }}
              disabled={stats.spinsAvailable === 0}
            >
              {stats.spinsAvailable > 0 ? (
                <>
                  Gira Ora!
                  <Sparkles size={20} />
                </>
              ) : (
                'Torna Domani'
              )}
            </button>
          </div>

          {/* Slot Machine Feature */}
          <div className="feature-card slot">
            <div className="feature-header">
              <div className="feature-icon slots">
                <Trophy size={28} />
              </div>
              <div className="feature-title-group">
                <h3 className="feature-title">Slot Machine</h3>
                <p className="feature-description">Fai girare i rulli e vinci!</p>
              </div>
            </div>

            <div className="spin-preview">
              <div className="spin-visual">
                <div className="slot-symbols">
                  <span className="slot-emoji">🍒</span>
                  <span className="slot-emoji">💎</span>
                  <span className="slot-emoji">7️⃣</span>
                </div>
              </div>
              <div className="spin-info">
                {stats.slotPlaysAvailable > 0 ? (
                  <>
                    <p className="spin-available">
                      <strong>{stats.slotPlaysAvailable}</strong> {stats.slotPlaysAvailable === 1 ? 'tentativo disponibile' : 'tentativi disponibili'}
                    </p>
                    <p className="spin-hint">Clicca per giocare alla slot!</p>
                  </>
                ) : (
                  <p className="spin-unavailable">Hai esaurito i tuoi tentativi giornalieri</p>
                )}
              </div>
            </div>

            <button
              className="feature-cta slot-cta"
              onClick={(e) => {
                if (stats.slotPlaysAvailable === 0) return
                console.log('🎰 Click on "Gioca Ora!" button')
                setShowSlotMachine(true)
              }}
              disabled={stats.slotPlaysAvailable === 0}
            >
              {stats.slotPlaysAvailable > 0 ? (
                <>
                  Gioca Ora!
                  <Trophy size={20} />
                </>
              ) : (
                'Torna Domani'
              )}
            </button>
          </div>

          {/* Scratch Card Feature */}
          <div className="feature-card scratch">
            <div className="feature-header">
              <div className="feature-icon scratch-icon">
                <Gift size={28} />
              </div>
              <div className="feature-title-group">
                <h3 className="feature-title">Gratta e Vinci</h3>
                <p className="feature-description">Gratta la carta e scopri il premio!</p>
              </div>
            </div>

            <div className="spin-preview">
              <div className="spin-visual">
                <div className="scratch-preview">
                  <span className="scratch-emoji">🎫</span>
                  <span className="scratch-emoji">✨</span>
                  <span className="scratch-emoji">🎁</span>
                </div>
              </div>
              <div className="spin-info">
                {stats.scratchPlaysAvailable > 0 ? (
                  <>
                    <p className="spin-available">
                      <strong>{stats.scratchPlaysAvailable}</strong> {stats.scratchPlaysAvailable === 1 ? 'tentativo disponibile' : 'tentativi disponibili'}
                    </p>
                    <p className="spin-hint">Gratta per scoprire cosa vinci!</p>
                  </>
                ) : (
                  <p className="spin-unavailable">Hai esaurito i tuoi tentativi giornalieri</p>
                )}
              </div>
            </div>

            <button
              className="feature-cta scratch-cta"
              onClick={(e) => {
                if (stats.scratchPlaysAvailable === 0) return
                console.log('🎫 Click on "Gratta Ora!" button')
                setShowScratchCard(true)
              }}
              disabled={stats.scratchPlaysAvailable === 0}
            >
              {stats.scratchPlaysAvailable > 0 ? (
                <>
                  Gratta Ora!
                  <Gift size={20} />
                </>
              ) : (
                'Torna Domani'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showBadgeGallery && (
        <BadgeGallery
          customerId={customerId}
          organizationId={organizationId}
          primaryColor={primaryColor}
          onClose={() => setShowBadgeGallery(false)}
        />
      )}

      {showChallengesHub && (
        <ChallengesHub
          customerId={customerId}
          organizationId={organizationId}
          primaryColor={primaryColor}
          onClose={() => setShowChallengesHub(false)}
        />
      )}

      {console.log('🎡 Checking showSpinWheel for modal:', showSpinWheel)}
      {showSpinWheel && (
        <>
          {console.log('🎡 Rendering SpinWheel modal!')}
          <SpinWheel
            customerId={customerId}
            organizationId={organizationId}
            primaryColor={primaryColor}
            onClose={handleCloseSpinWheel}
            onSpinComplete={handleSpinComplete}
          />
        </>
      )}

      {console.log('🎰 Checking showSlotMachine for modal:', showSlotMachine)}
      {showSlotMachine && (
        <>
          {console.log('🎰 Rendering SlotMachine modal!')}
          <SlotMachine
            customerId={customerId}
            organizationId={organizationId}
            primaryColor={primaryColor}
            onClose={handleCloseSlotMachine}
            onSpinComplete={handleSlotComplete}
          />
        </>
      )}

      {/* Scratch Card Modal */}
      {console.log('🎫 Checking showScratchCard for modal:', showScratchCard)}
      {showScratchCard && (
        <>
          {console.log('🎫 Rendering ScratchCard modal!')}
          <ScratchCard
            customerId={customerId}
            organizationId={organizationId}
            primaryColor={primaryColor}
            onClose={handleCloseScratchCard}
            onScratchComplete={handleScratchComplete}
          />
        </>
      )}

      {/* Badge Unlock Notification */}
      {badgeUnlock && badgeUnlock.unlocked && (
        <BadgeUnlockNotification
          badge={badgeUnlock.badge!}
          onClose={() => setBadgeUnlock(null)}
        />
      )}
    </>
  )
}

export default GamingHub
