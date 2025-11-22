import React, { useState, useRef, useEffect } from 'react'
import { X, Crown, Trophy, Sparkles } from 'lucide-react'
import { LotteryTicket, LotteryEvent } from '../services/lotteryService'
import './LotteryExtractionDisplay.css'

type ExtractionPhase = 'idle' | 'countdown' | 'spinning' | 'slowing' | 'tease' | 'locked' | 'celebrating'

interface LotteryExtractionDisplayProps {
  event: LotteryEvent
  tickets: LotteryTicket[]
  onComplete?: (winner: LotteryTicket) => void
}

/**
 * Giant Screen Extraction Display Component
 * Cinematic full-screen lottery extraction with animations
 * Designed to be displayed on a large screen and controlled from POS
 */
export const LotteryExtractionDisplay: React.FC<LotteryExtractionDisplayProps> = ({
  event,
  tickets,
  onComplete
}) => {
  const [extractionPhase, setExtractionPhase] = useState<ExtractionPhase>('idle')
  const [currentWinner, setCurrentWinner] = useState<LotteryTicket | null>(null)
  const [extractionDisplay, setExtractionDisplay] = useState('000-000')
  const [countdownValue, setCountdownValue] = useState(3)

  const animationRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const heartbeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Get brand colors from event
  const colors = event.brand_colors || {
    primary: '#e74c3c',
    secondary: '#c0392b',
    accent: '#f39c12'
  }

  // Initialize Web Audio
  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    return () => {
      audioContextRef.current?.close()
    }
  }, [])

  // Heartbeat sound effect using Web Audio API
  const playHeartbeat = (intensity: number = 1) => {
    if (!audioContextRef.current) return

    const ctx = audioContextRef.current
    const now = ctx.currentTime

    // First beat (BOOM)
    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    osc1.connect(gain1)
    gain1.connect(ctx.destination)

    osc1.frequency.setValueAtTime(80, now)
    osc1.frequency.exponentialRampToValueAtTime(40, now + 0.1)

    gain1.gain.setValueAtTime(0.3 * intensity, now)
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.1)

    osc1.start(now)
    osc1.stop(now + 0.1)

    // Second beat (boom)
    setTimeout(() => {
      const osc2 = ctx.createOscillator()
      const gain2 = ctx.createGain()
      osc2.connect(gain2)
      gain2.connect(ctx.destination)

      osc2.frequency.setValueAtTime(70, now + 0.15)
      osc2.frequency.exponentialRampToValueAtTime(35, now + 0.25)

      gain2.gain.setValueAtTime(0.2 * intensity, now + 0.15)
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.25)

      osc2.start(now + 0.15)
      osc2.stop(now + 0.25)
    }, 150)
  }

  // Celebration sound effect
  const playCelebration = () => {
    if (!audioContextRef.current) return

    const ctx = audioContextRef.current
    const now = ctx.currentTime

    // Triumphant chord
    const frequencies = [523.25, 659.25, 783.99, 1046.50] // C major chord

    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.frequency.setValueAtTime(freq, now)
      gain.gain.setValueAtTime(0, now)
      gain.gain.linearRampToValueAtTime(0.15, now + 0.1)
      gain.gain.exponentialRampToValueAtTime(0.01, now + 1.5)

      osc.start(now + i * 0.05)
      osc.stop(now + 1.5)
    })
  }

  // Start heartbeat sound during tense phases
  useEffect(() => {
    if (extractionPhase === 'slowing' || extractionPhase === 'locked') {
      // Faster heartbeat as tension builds
      const interval = extractionPhase === 'locked' ? 350 : 800 // Heartbeat più veloce nella fase locked!
      const intensity = extractionPhase === 'locked' ? 2.0 : 1 // Intensità massima nella fase locked!

      heartbeatIntervalRef.current = setInterval(() => {
        playHeartbeat(intensity)
      }, interval)

      return () => {
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current)
        }
      }
    }
  }, [extractionPhase])

  // Play celebration when winner is announced
  useEffect(() => {
    if (extractionPhase === 'celebrating') {
      playCelebration()
    }
  }, [extractionPhase])

  // --- CINEMATIC EXTRACTION LOGIC ---
  const runLotterySequence = () => {
    // Filter out tickets that have already won
    const availableTickets = tickets.filter(t => !t.is_winner)

    if (availableTickets.length === 0) {
      if (tickets.length === 0) {
        alert('Nessun biglietto generato! Crea prima dei biglietti.')
      } else {
        alert('Tutti i biglietti sono stati estratti!')
      }
      return
    }

    // 0. COUNTDOWN PHASE - 10 secondi di attesa!
    setExtractionPhase('countdown')
    setCountdownValue(10)

    const countdownInterval = setInterval(() => {
      setCountdownValue(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval)
          startSpinning(availableTickets) // Start actual spin
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const startSpinning = (availableTickets: LotteryTicket[]) => {
    // 1. Setup
    setExtractionPhase('spinning')
    setCurrentWinner(null)

    // Select winner
    const randomIndex = Math.floor(Math.random() * availableTickets.length)
    const winner = availableTickets[randomIndex]

    // Find a "fake" loser to stop on briefly (The Tease)
    let teaseTicket = availableTickets[(randomIndex + 1) % availableTickets.length]
    const teaseNumber = availableTickets.length === 1 ? '999-999' : teaseTicket.ticket_number

    // SEQUENTIAL SPIN - mostra tutti i biglietti in sequenza come una ruota
    let currentIndex = 0
    let speed = 80 // Velocità iniziale (ms tra un biglietto e l'altro)
    let rotations = 0 // Quanti giri completi abbiamo fatto
    const minRotations = 3 // Almeno 3 giri completi di tutti i biglietti
    const totalDuration = 20000 // 20 secondi totali di spin
    const startTime = Date.now()

    const spinLoop = () => {
      const elapsed = Date.now() - startTime

      // Mostra il biglietto corrente nella sequenza
      setExtractionDisplay(availableTickets[currentIndex].ticket_number)

      // Avanza al prossimo biglietto
      currentIndex++

      // Se abbiamo mostrato tutti i biglietti, ricomincia (giro completo)
      if (currentIndex >= availableTickets.length) {
        currentIndex = 0
        rotations++
        console.log(`🎰 Giro completo #${rotations}`)
      }

      // FASE 1: Spin veloce per i primi 15 secondi
      if (elapsed < 15000) {
        setExtractionPhase('spinning')
        speed = 80 // Veloce e costante
      }
      // FASE 2: Rallentamento graduale (15-20 secondi)
      else if (elapsed < totalDuration) {
        if (extractionPhase !== 'slowing') {
          console.log('🐌 Iniziando a rallentare...')
          setExtractionPhase('slowing')
        }
        // Rallenta esponenzialmente
        const slowingProgress = (elapsed - 15000) / 5000 // 0 -> 1 negli ultimi 5 secondi
        speed = 80 + (slowingProgress * 400) // Da 80ms a 480ms
      }
      // FASE 3: SUSPENSE FINALE - stop e attesa drammatica
      else if (rotations >= minRotations) {
        // STOP! Suspense massima - nessun numero visibile!
        setExtractionDisplay('') // Schermo nero
        setExtractionPhase('locked')
        setCurrentWinner(null) // NON mostrare ancora il vincitore!
        console.log('🎯 LOCKED! Suspense massima... vincitore nascosto:', winner.ticket_number)

        // SUSPENSE MASSIMA - aspetta 8 secondi prima di RIVELARE TUTTO
        setTimeout(() => {
          // BOOM! ORA rivela TUTTO insieme: numero + nome + premio!
          setExtractionDisplay(winner.ticket_number)
          setCurrentWinner(winner)
          setExtractionPhase('celebrating')
          console.log('🎉 CELEBRATING! Rivelando vincitore:', winner.customer_name, winner.ticket_number)

          // Notify parent component
          if (onComplete) {
            onComplete(winner)
          }
        }, 8000) // 8 secondi di suspense TOTALE prima di rivelare tutto

        return // Fine del loop
      }

      // Continua lo spin
      animationRef.current = setTimeout(spinLoop, speed)
    }

    console.log(`🎰 Iniziando spin con ${availableTickets.length} biglietti, vincitore: ${winner.ticket_number}`)
    spinLoop()
  }

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) clearTimeout(animationRef.current)
    }
  }, [])

  // Helper to close overlay
  const closeOverlay = () => {
    setExtractionPhase('idle')
    setExtractionDisplay('000-000')
    setCurrentWinner(null)
  }

  // Listen for remote control commands via Supabase Realtime + Polling Fallback
  useEffect(() => {
    let channel: any = null
    let pollingInterval: NodeJS.Timeout | null = null
    let isRealtimeActive = false

    const setupRealtimeListener = async () => {
      const { supabase } = await import('../lib/supabase')

      console.log('🔌 Setting up Realtime subscription for event:', event.id)

      channel = supabase
        .channel(`lottery_commands_${event.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'lottery_extraction_commands',
            filter: `event_id=eq.${event.id}`
          },
          (payload) => {
            console.log('🎮 Remote command received via REALTIME:', payload)
            handleCommand(payload.new as any)
          }
        )
        .subscribe((status) => {
          console.log('📡 Realtime subscription status:', status)
          if (status === 'SUBSCRIBED') {
            console.log('✅ Successfully subscribed to lottery commands via Realtime!')
            isRealtimeActive = true
            // Stop polling if Realtime is working
            if (pollingInterval) {
              clearInterval(pollingInterval)
              pollingInterval = null
              console.log('⏹️ Stopped polling (Realtime active)')
            }
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.error('❌ Realtime error - falling back to polling!')
            isRealtimeActive = false
            startPolling()
          }
        })
    }

    const handleCommand = async (command: any) => {
      const { supabase } = await import('../lib/supabase')

      if (command.status === 'pending') {
        switch (command.command) {
          case 'START_EXTRACTION':
            if (extractionPhase === 'idle') {
              console.log('🚀 Starting extraction via remote command')
              runLotterySequence()
            }
            break
          case 'RESET':
            console.log('🔄 Resetting extraction via remote command')
            setExtractionPhase('idle')
            setCurrentWinner(null)
            setExtractionDisplay('000-000')
            break
        }

        // Mark command as completed
        supabase
          .from('lottery_extraction_commands')
          .update({ status: 'completed', executed_at: new Date().toISOString() })
          .eq('id', command.id)
          .then(() => console.log('✅ Command marked as completed'))
          .catch(err => console.error('❌ Error marking command as completed:', err))
      }
    }

    const checkForCommands = async () => {
      const { supabase } = await import('../lib/supabase')

      const { data, error } = await supabase
        .from('lottery_extraction_commands')
        .select('*')
        .eq('event_id', event.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(1)

      if (!error && data && data.length > 0) {
        console.log('🎮 Remote command received via POLLING:', data[0])
        handleCommand(data[0])
      }
    }

    const startPolling = () => {
      if (pollingInterval) return // Already polling

      console.log('🔄 Starting polling for commands (every 2 seconds)')
      pollingInterval = setInterval(checkForCommands, 2000)

      // Check immediately
      checkForCommands()
    }

    // Try Realtime first
    setupRealtimeListener()

    // Start polling after 5 seconds if Realtime hasn't connected
    const fallbackTimer = setTimeout(() => {
      if (!isRealtimeActive) {
        console.log('⚠️ Realtime not active after 5s, starting polling')
        startPolling()
      }
    }, 5000)

    return () => {
      console.log('🔌 Cleaning up Realtime subscription and polling')
      if (channel) {
        import('../lib/supabase').then(({ supabase }) => {
          supabase.removeChannel(channel)
        })
      }
      if (pollingInterval) {
        clearInterval(pollingInterval)
      }
      clearTimeout(fallbackTimer)
    }
  }, [event.id, extractionPhase])

  return (
    <div className="lottery-extraction-display">
      {/* --- CINEMATIC FULL SCREEN OVERLAY --- */}
      {extractionPhase !== 'idle' && (
        <div className="extraction-overlay" style={{
          backgroundColor: '#000000'
        }}>
          {/* Background Effects */}
          <div className="bg-gradient-radial" style={{
            background: `radial-gradient(circle at center, ${colors.primary}22 0%, #000000 70%)`
          }} />
          <div className="bg-texture" />

          {/* Spotlight Effect */}
          <div
            className={`spotlight-effect ${extractionPhase}`}
            style={{
              backgroundColor: extractionPhase === 'locked'
                ? `${colors.secondary}33`
                : extractionPhase === 'celebrating'
                ? `${colors.accent}4D`
                : `${colors.primary}1A`
            }}
          />

          {/* CONTENT CONTAINER */}
          <div className="extraction-content">

            {/* Event Title - Always Visible */}
            <div className="event-title" style={{ color: colors.accent }}>
              {event.name}
            </div>

            {/* PHASE: COUNTDOWN */}
            {extractionPhase === 'countdown' && (
              <div className="countdown-number">
                {countdownValue}
              </div>
            )}

            {/* PHASE: SPINNING / SLOWING */}
            {(extractionPhase === 'spinning' || extractionPhase === 'slowing') && (
              <div className="spinning-container">
                <div
                  className="extraction-label"
                  style={{ color: colors.accent }}
                >
                  Estrazione in corso
                </div>

                <div className={`ticket-number-display phase-${extractionPhase}`}>
                  {extractionDisplay}
                </div>
              </div>
            )}

            {/* PHASE: LOCKED - Suspense massima! */}
            {extractionPhase === 'locked' && (
              <div className="locked-container">
                <div
                  className="locked-label"
                  style={{ color: colors.accent }}
                >
                  E il vincitore è...
                </div>
                <div className="suspense-dots">
                  <span>•</span>
                  <span>•</span>
                  <span>•</span>
                </div>
                <div
                  className="motivational-quote"
                  style={{ color: colors.secondary }}
                >
                  {[
                    '"La fortuna aiuta gli audaci"',
                    '"Ogni biglietto è una speranza"',
                    '"Il destino sta per essere rivelato"',
                    '"Un sogno sta per diventare realtà"',
                    '"Chi la dura la vince"',
                    '"La dea bendata sta per sorridere"',
                    '"Qualcuno sta per cambiare la propria giornata"',
                    '"Il momento della verità è arrivato"'
                  ][Math.floor(Math.random() * 8)]}
                </div>
              </div>
            )}

            {/* PHASE: CELEBRATING */}
            {extractionPhase === 'celebrating' && currentWinner && (
              <div className="celebration-container">
                <div className="trophy-icon" style={{ color: colors.accent }}>
                  <Trophy className="w-24 h-24" />
                </div>

                <div
                  className="winner-label"
                  style={{ color: colors.accent }}
                >
                  Vincitore Confermato
                </div>

                <h1
                  className="winner-name"
                  style={{
                    background: `linear-gradient(to bottom, ${colors.accent}DD, ${colors.primary})`
                  }}
                >
                  {currentWinner.customer_name}
                </h1>

                <div className="winning-ticket-card">
                  <span className="ticket-label">Biglietto Vincente</span>
                  <span className="ticket-number">{currentWinner.ticket_number}</span>
                </div>

                {currentWinner.fortune_message && (
                  <div
                    className="fortune-message"
                    style={{ borderColor: colors.accent }}
                  >
                    <Sparkles className="w-5 h-5" style={{ color: colors.accent }} />
                    <span>{currentWinner.fortune_message}</span>
                    <Sparkles className="w-5 h-5" style={{ color: colors.accent }} />
                  </div>
                )}

                {event.prize_name && (
                  <div className="prize-info">
                    <Crown className="w-6 h-6" style={{ color: colors.accent }} />
                    <div>
                      <div className="prize-label">Premio</div>
                      <div className="prize-name" style={{ color: colors.accent }}>
                        {event.prize_name}
                      </div>
                      {event.prize_value && (
                        <div className="prize-value">
                          Valore: €{event.prize_value.toFixed(2)}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <button
                  onClick={closeOverlay}
                  className="close-button"
                  style={{
                    backgroundColor: colors.primary,
                    boxShadow: `0 0 20px ${colors.primary}66`
                  }}
                >
                  <X className="w-5 h-5" /> Chiudi Show
                </button>

                {/* Confetti Particles */}
                <div className="confetti-container">
                  {[...Array(30)].map((_, i) => (
                    <div
                      key={i}
                      className="confetti-particle"
                      style={{
                        backgroundColor: i % 3 === 0 ? colors.primary : i % 3 === 1 ? colors.secondary : colors.accent,
                        top: `${Math.random() * 100}%`,
                        left: `${Math.random() * 100}%`,
                        animationDelay: `${Math.random() * 2}s`,
                        animationDuration: `${3 + Math.random() * 2}s`
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Stats Footer - Always Visible */}
            <div className="stats-footer">
              <div className="stat-item">
                <span className="stat-label">Partecipanti:</span>
                <span className="stat-value">{tickets.length}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Biglietti in gioco:</span>
                <span className="stat-value">{tickets.filter(t => !t.is_winner).length}</span>
              </div>
              {event.extraction_date && (
                <div className="stat-item">
                  <span className="stat-label">Estrazione:</span>
                  <span className="stat-value">
                    {new Date(event.extraction_date).toLocaleDateString('it-IT')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Idle State - Waiting Screen */}
      {extractionPhase === 'idle' && (
        <div className="idle-screen" style={{ backgroundColor: colors.primary }}>
          <div className="idle-content">
            <Trophy className="w-32 h-32 mb-8 opacity-50" />
            <h1 className="text-6xl font-bold text-white mb-4">{event.name}</h1>
            <p className="text-2xl text-white/80 mb-8">Preparazione all'estrazione...</p>
            <div className="pulse-indicator" />
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Standalone Full Page Component
 * For dedicated extraction display screen
 */
export const LotteryExtractionFullPage: React.FC<{
  eventId: string
}> = ({ eventId }) => {
  const [event, setEvent] = useState<LotteryEvent | null>(null)
  const [tickets, setTickets] = useState<LotteryTicket[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const { lotteryService } = await import('../services/lotteryService')

        // Load event
        const eventData = await lotteryService.getEvent(eventId)
        setEvent(eventData)

        // Load tickets
        const ticketsData = await lotteryService.getEventTickets(eventId)
        setTickets(ticketsData)
      } catch (error) {
        console.error('Failed to load lottery data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [eventId])

  if (loading) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-black">
        <div className="text-white text-2xl">Caricamento...</div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-black">
        <div className="text-white text-2xl">Evento non trovato</div>
      </div>
    )
  }

  return (
    <LotteryExtractionDisplay
      event={event}
      tickets={tickets}
      onComplete={(winner) => {
        console.log('Winner:', winner)
      }}
    />
  )
}
