import React, { useState, useRef, useEffect } from 'react'
import { X, Crown, Trophy, Sparkles, Power } from 'lucide-react'
import { LotteryTicket, LotteryEvent } from '../services/lotteryService'
import { LotteryThemeRenderer } from './LotteryThemes'
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
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0)
  const [customMessage, setCustomMessage] = useState<string | null>(null)
  const [currentPrize, setCurrentPrize] = useState<{ rank: number; name: string; value?: number } | null>(null)
  const [isActivated, setIsActivated] = useState(false)
  const [heartbeatPulse, setHeartbeatPulse] = useState(false)

  const animationRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const heartbeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const musicIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const countdownMusicRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Audio players for real sound files
  const idleMusicRef = useRef<HTMLAudioElement | null>(null)
  const countdownAudioRef = useRef<HTMLAudioElement | null>(null)
  const heartbeatAudioRef = useRef<HTMLAudioElement | null>(null)
  const celebrationAudioRef = useRef<HTMLAudioElement | null>(null)
  const notificationAudioRef = useRef<HTMLAudioElement | null>(null)

  // Get brand colors from event
  const colors = event.brand_colors || {
    primary: '#e74c3c',
    secondary: '#c0392b',
    accent: '#f39c12'
  }

  // Function to activate display and resume audio
  const handleActivateDisplay = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    console.log('⚡ Activating display...')

    // Resume AudioContext
    if (audioContextRef.current) {
      if (audioContextRef.current.state === 'suspended') {
        try {
          await audioContextRef.current.resume()
          console.log('✅ AudioContext resumed on activation')
        } catch (err) {
          console.error('❌ Failed to resume AudioContext:', err)
        }
      }
    } else {
      // Create if not exists
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
        console.log('🔊 AudioContext created on activation, state:', audioContextRef.current.state)
        await audioContextRef.current.resume()
      } catch (err) {
        console.error('❌ Failed to create AudioContext:', err)
      }
    }

    setIsActivated(true)
    console.log('✅ Display activated and ready!')
  }

  // Initialize Audio Players and AudioContext
  useEffect(() => {
    // Initialize audio players for real sound files
    idleMusicRef.current = new Audio('/sounds/idle-music.mp3')
    idleMusicRef.current.loop = true
    idleMusicRef.current.volume = 0.3

    countdownAudioRef.current = new Audio('/sounds/countdown.mp3')
    countdownAudioRef.current.volume = 0.6
    // Log countdown duration when loaded
    countdownAudioRef.current.addEventListener('loadedmetadata', () => {
      console.log('⏱️ Countdown duration:', countdownAudioRef.current?.duration, 'seconds')
    })

    heartbeatAudioRef.current = new Audio('/sounds/heartbeat.mp3')
    heartbeatAudioRef.current.volume = 0.7
    // Not used anymore - using cinematic Web Audio API heartbeat instead

    celebrationAudioRef.current = new Audio('/sounds/celebration.mp3')
    celebrationAudioRef.current.volume = 0.8

    notificationAudioRef.current = new Audio('/sounds/notification.mp3')
    notificationAudioRef.current.volume = 0.5

    console.log('🎵 Audio players initialized')

    // Pre-create AudioContext (will be resumed on user activation)
    try {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      console.log('🔊 AudioContext pre-created, state:', audioContextRef.current.state)
    } catch (err) {
      console.error('❌ Failed to create AudioContext:', err)
    }

    return () => {
      audioContextRef.current?.close()
      // Stop and cleanup audio players
      idleMusicRef.current?.pause()
      countdownAudioRef.current?.pause()
      heartbeatAudioRef.current?.pause()
      celebrationAudioRef.current?.pause()
      notificationAudioRef.current?.pause()
    }
  }, [])

  // Cinematic heartbeat sound with Web Audio API
  const playCinematicHeartbeat = (intensity: number = 1) => {
    if (!audioContextRef.current) return

    // Trigger visual pulse
    setHeartbeatPulse(true)
    setTimeout(() => setHeartbeatPulse(false), 300)

    const ctx = audioContextRef.current
    const now = ctx.currentTime

    // First thump (THUB)
    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    const filter1 = ctx.createBiquadFilter()

    osc1.connect(filter1)
    filter1.connect(gain1)
    gain1.connect(ctx.destination)

    // Deep bass frequency
    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(55 * intensity, now)
    osc1.frequency.exponentialRampToValueAtTime(40, now + 0.1)

    // Filter for bass punch
    filter1.type = 'lowpass'
    filter1.frequency.setValueAtTime(200, now)
    filter1.Q.setValueAtTime(1, now)

    // Volume envelope - strong attack, quick decay
    gain1.gain.setValueAtTime(0, now)
    gain1.gain.exponentialRampToValueAtTime(0.15 * intensity, now + 0.01)
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.15)

    osc1.start(now)
    osc1.stop(now + 0.15)

    // Second thump (DUB) - slightly higher and softer
    setTimeout(() => {
      const osc2 = ctx.createOscillator()
      const gain2 = ctx.createGain()
      const filter2 = ctx.createBiquadFilter()

      osc2.connect(filter2)
      filter2.connect(gain2)
      gain2.connect(ctx.destination)

      osc2.type = 'sine'
      osc2.frequency.setValueAtTime(65 * intensity, now + 0.12)
      osc2.frequency.exponentialRampToValueAtTime(45, now + 0.22)

      filter2.type = 'lowpass'
      filter2.frequency.setValueAtTime(180, now + 0.12)
      filter2.Q.setValueAtTime(1, now + 0.12)

      gain2.gain.setValueAtTime(0, now + 0.12)
      gain2.gain.exponentialRampToValueAtTime(0.1 * intensity, now + 0.13)
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.25)

      osc2.start(now + 0.12)
      osc2.stop(now + 0.25)
    }, 120)

    // Add subtle white noise for tension
    if (intensity > 1.2) {
      const bufferSize = ctx.sampleRate * 0.3
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const data = buffer.getChannelData(0)

      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.02 * (intensity - 1)
      }

      const noise = ctx.createBufferSource()
      const noiseGain = ctx.createGain()
      const noiseFilter = ctx.createBiquadFilter()

      noise.buffer = buffer
      noise.connect(noiseFilter)
      noiseFilter.connect(noiseGain)
      noiseGain.connect(ctx.destination)

      noiseFilter.type = 'bandpass'
      noiseFilter.frequency.setValueAtTime(1000, now)

      noiseGain.gain.setValueAtTime(0, now)
      noiseGain.gain.linearRampToValueAtTime(0.03, now + 0.1)
      noiseGain.gain.linearRampToValueAtTime(0, now + 0.3)

      noise.start(now)
    }
  }

  // Play celebration sound from audio file
  const playCelebration = async () => {
    if (!celebrationAudioRef.current) return

    try {
      // Pause first if already playing
      celebrationAudioRef.current.pause()
      celebrationAudioRef.current.currentTime = 0
      await celebrationAudioRef.current.play()
      console.log('🎉 Playing celebration sound')
    } catch (err) {
      console.error('Failed to play celebration:', err)
    }
  }

  // Notification sound - suono di notifica elegante per messaggi
  // Play notification sound from audio file
  const playNotificationSound = async () => {
    if (!notificationAudioRef.current) return

    try {
      // Pause first if already playing
      notificationAudioRef.current.pause()
      notificationAudioRef.current.currentTime = 0
      await notificationAudioRef.current.play()
      console.log('🔔 Playing notification sound')
    } catch (err) {
      console.error('Failed to play notification:', err)
    }
  }

  // Play countdown sound from audio file
  const playCountdownMusic = async () => {
    if (!countdownAudioRef.current) return

    try {
      // Pause first if already playing
      countdownAudioRef.current.pause()
      countdownAudioRef.current.currentTime = 0
      await countdownAudioRef.current.play()
      console.log('⏳ Playing countdown sound')
    } catch (err) {
      console.error('Failed to play countdown:', err)
    }
  }

  // Spinning music - beat ritmico (SYNTH - kept as requested)
  const playSpinningBeat = async () => {
    if (!audioContextRef.current) {
      console.error('❌ AudioContext is null for spinning beat!')
      return
    }

    const ctx = audioContextRef.current

    if (ctx.state === 'suspended') {
      console.log('🔊 Resuming AudioContext for spinning beat...')
      try {
        await ctx.resume()
        console.log('✅ AudioContext resumed, state:', ctx.state)
      } catch (err) {
        console.error('❌ Failed to resume AudioContext:', err)
        return
      }
    }

    const now = ctx.currentTime

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.type = 'square'
    osc.frequency.setValueAtTime(220, now)

    gain.gain.setValueAtTime(0.08, now)
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15)

    osc.start(now)
    osc.stop(now + 0.15)

    setTimeout(() => {
      const osc2 = ctx.createOscillator()
      const gain2 = ctx.createGain()
      osc2.connect(gain2)
      gain2.connect(ctx.destination)

      osc2.type = 'sine'
      osc2.frequency.setValueAtTime(330, now + 0.1)

      gain2.gain.setValueAtTime(0.05, now + 0.1)
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.2)

      osc2.start(now + 0.1)
      osc2.stop(now + 0.2)
    }, 100)
  }

  // Countdown music - play once when countdown starts
  useEffect(() => {
    if (extractionPhase === 'countdown') {
      playCountdownMusic()
    }
  }, [extractionPhase])

  // Idle background music - plays when display is in idle state AND activated
  useEffect(() => {
    if (extractionPhase === 'idle' && isActivated && idleMusicRef.current) {
      console.log('🎵 Starting idle background music')
      idleMusicRef.current.currentTime = 0
      idleMusicRef.current.play().catch(err => {
        console.error('Failed to play idle music:', err)
      })
    } else if ((extractionPhase !== 'idle' || !isActivated) && idleMusicRef.current) {
      console.log('🔇 Stopping idle background music')
      idleMusicRef.current.pause()
      idleMusicRef.current.currentTime = 0
    }
  }, [extractionPhase, isActivated])

  // Spinning music - beat ritmico
  useEffect(() => {
    if (extractionPhase === 'spinning') {
      console.log('🎵 Starting spinning beat interval...')
      musicIntervalRef.current = setInterval(() => {
        playSpinningBeat()
      }, 300)

      return () => {
        if (musicIntervalRef.current) {
          console.log('🔇 Stopping spinning beat interval')
          clearInterval(musicIntervalRef.current)
        }
      }
    }
  }, [extractionPhase])

  // Start cinematic heartbeat during tense phases
  useEffect(() => {
    const startHeartbeat = async () => {
      if (extractionPhase === 'slowing' || extractionPhase === 'locked') {
        console.log('💓 Starting cinematic heartbeat for phase:', extractionPhase)

        // Stop spinning music
        if (musicIntervalRef.current) {
          clearInterval(musicIntervalRef.current)
        }

        // Intensity based on phase
        const baseIntensity = extractionPhase === 'locked' ? 1.5 : 1.0
        const interval = extractionPhase === 'locked' ? 400 : 800 // Faster in locked phase

        // Start heartbeat loop with increasing intensity
        let beatCount = 0
        heartbeatIntervalRef.current = setInterval(() => {
          beatCount++
          // Intensity increases over time, capped at 2.0
          const intensity = Math.min(baseIntensity + (beatCount * 0.05), 2.0)
          playCinematicHeartbeat(intensity)
        }, interval)

        // Play first heartbeat immediately
        playCinematicHeartbeat(baseIntensity)
      } else {
        // Stop heartbeat when not in slowing/locked phase
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current)
          heartbeatIntervalRef.current = null
          console.log('🔇 Stopped cinematic heartbeat')
        }
      }
    }

    startHeartbeat()

    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current)
        heartbeatIntervalRef.current = null
      }
    }
  }, [extractionPhase])

  // Play celebration when winner is announced
  useEffect(() => {
    if (extractionPhase === 'celebrating') {
      playCelebration()
    }
  }, [extractionPhase])

  // Cycle through motivational quotes during locked phase
  useEffect(() => {
    if (extractionPhase === 'locked') {
      setCurrentQuoteIndex(0)

      const quoteInterval = setInterval(() => {
        setCurrentQuoteIndex(prev => (prev + 1) % 8)
      }, 1500) // Cambia scritta ogni 1.5 secondi

      return () => clearInterval(quoteInterval)
    }
  }, [extractionPhase])

  // --- CINEMATIC EXTRACTION LOGIC ---
  const runLotterySequence = async () => {
    // IMPORTANT: Resume audio context at the very beginning
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      try {
        await audioContextRef.current.resume()
        console.log('✅ AudioContext resumed before extraction')
      } catch (err) {
        console.error('❌ Failed to resume AudioContext:', err)
      }
    }

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

    // 0. COUNTDOWN PHASE - 10 secondi sincronizzati con audio!
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

    // Select winner FIRST (decided from the start, not changed later)
    const randomIndex = Math.floor(Math.random() * availableTickets.length)
    const winner = availableTickets[randomIndex]
    console.log(`🎯 Vincitore selezionato (casuale): ${winner.ticket_number} - ${winner.customer_name}`)

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
        // STOP IMMEDIATO! Cancella subito qualsiasi numero visibile
        setExtractionDisplay('***-***') // Placeholder generico senza numeri specifici
        setExtractionPhase('locked')
        setCurrentWinner(null) // NON mostrare ancora il vincitore!
        console.log('🔒 LOCKED! Suspense massima... il vincitore sarà rivelato tra poco')

        // SUSPENSE MASSIMA - aspetta 8 secondi prima di RIVELARE IL VINCITORE
        setTimeout(() => {
          // BOOM! ORA rivela TUTTO insieme: numero + nome + premio!
          setExtractionDisplay(winner.ticket_number)
          setCurrentWinner(winner)
          setExtractionPhase('celebrating')
          console.log('🎉 CELEBRATING! Vincitore rivelato:', winner.customer_name, winner.ticket_number)

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

    console.log(`🎰 Iniziando spin con ${availableTickets.length} biglietti disponibili`)
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

              // IMPORTANT: Resume AudioContext immediately when command arrives
              if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
                try {
                  await audioContextRef.current.resume()
                  console.log('✅ AudioContext resumed via remote command')
                } catch (err) {
                  console.error('❌ Failed to resume AudioContext via remote command:', err)
                }
              }

              // Load prize info if prize_id is provided
              if (command.metadata && command.metadata.prize_id) {
                const { lotteryService } = await import('../services/lotteryService')
                try {
                  const prize = await lotteryService.getPrize(command.metadata.prize_id)
                  setCurrentPrize({
                    rank: prize.rank,
                    name: prize.prize_name,
                    value: prize.prize_value
                  })
                  console.log('🏆 Prize loaded:', prize)
                } catch (error) {
                  console.error('❌ Error loading prize:', error)
                  setCurrentPrize(null)
                }
              } else {
                setCurrentPrize(null)
              }

              runLotterySequence()
            }
            break
          case 'RESET':
            console.log('🔄 Resetting extraction via remote command')
            setExtractionPhase('idle')
            setCurrentWinner(null)
            setExtractionDisplay('000-000')
            break
          case 'SHOW_MESSAGE':
            // Show custom message on screen
            if (command.metadata && command.metadata.message) {
              console.log('💬 Showing custom message:', command.metadata.message)
              setCustomMessage(command.metadata.message)
              // Play notification sound to attract attention
              playNotificationSound()
              // Auto-hide message after 10 seconds
              setTimeout(() => setCustomMessage(null), 10000)
            }
            break
          case 'CLEAR_SCREEN':
            console.log('🧹 Clearing screen')
            setExtractionPhase('idle')
            setCurrentWinner(null)
            setExtractionDisplay('000-000')
            setCustomMessage(null)
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
      {/* Custom Message Overlay - ALWAYS ON TOP */}
      {customMessage && (
        <div className="custom-message-overlay">
          <div
            className="custom-message-box"
            style={{
              background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
              borderColor: colors.accent
            }}
          >
            <div className="custom-message-icon">📢</div>
            <div className="custom-message-text">{customMessage}</div>
          </div>
        </div>
      )}

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

            {/* Prize Info - Show if prize is selected */}
            {currentPrize && extractionPhase !== 'celebrating' && (
              <div className="prize-info-banner">
                <div className="prize-rank-emoji">
                  {currentPrize.rank === 1 ? '🥇' : currentPrize.rank === 2 ? '🥈' : currentPrize.rank === 3 ? '🥉' : '🎁'}
                </div>
                <div className="prize-info-content">
                  <div className="prize-rank-label">
                    {currentPrize.rank === 1 ? '1° PREMIO' : currentPrize.rank === 2 ? '2° PREMIO' : currentPrize.rank === 3 ? '3° PREMIO' : `${currentPrize.rank}° PREMIO`}
                  </div>
                  <div className="prize-name-label" style={{ color: colors.accent }}>
                    {currentPrize.name}
                  </div>
                  {currentPrize.value && (
                    <div className="prize-value-label">
                      €{currentPrize.value.toFixed(2)}
                    </div>
                  )}
                </div>
              </div>
            )}

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
            {extractionPhase === 'locked' && (() => {
              const motivationalQuotes = [
                '"La fortuna aiuta gli audaci"',
                '"Ogni biglietto è una speranza"',
                '"Il destino sta per essere rivelato"',
                '"Un sogno sta per diventare realtà"',
                '"Chi la dura la vince"',
                '"La dea bendata sta per sorridere"',
                '"Qualcuno sta per cambiare la propria giornata"',
                '"Il momento della verità è arrivato"'
              ]

              return (
                <div className="locked-container">
                  {/* SVG Battito Cardiaco Animato */}
                  {(extractionPhase === 'slowing' || extractionPhase === 'locked') && (
                    <div className={`heartbeat-overlay ${heartbeatPulse ? 'pulse' : ''}`}>
                      <svg viewBox="0 0 200 200" className="heartbeat-svg">
                        <defs>
                          <linearGradient id="heartGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" style={{ stopColor: colors.primary, stopOpacity: 0.3 }} />
                            <stop offset="50%" style={{ stopColor: colors.accent, stopOpacity: 0.2 }} />
                            <stop offset="100%" style={{ stopColor: colors.secondary, stopOpacity: 0.3 }} />
                          </linearGradient>
                        </defs>
                        {/* Cuore anatomico stilizzato */}
                        <path
                          d="M100,170 C75,160 20,130 20,85 C20,60 40,45 60,45 C75,45 90,55 100,70 C110,55 125,45 140,45 C160,45 180,60 180,85 C180,130 125,160 100,170 Z"
                          fill="url(#heartGradient)"
                          stroke={colors.accent}
                          strokeWidth="2"
                          className="heart-shape"
                        />
                        {/* Linea ECG dentro il cuore */}
                        <path
                          d="M 40,100 L 60,100 L 65,85 L 70,115 L 75,95 L 80,105 L 160,105"
                          fill="none"
                          stroke={colors.accent}
                          strokeWidth="2.5"
                          className="ecg-line"
                          opacity="0.6"
                        />
                      </svg>
                    </div>
                  )}

                  {/* Particelle luminose animate */}
                  <div className="light-particles">
                    {[...Array(20)].map((_, i) => (
                      <div
                        key={i}
                        className="particle"
                        style={{
                          left: `${Math.random() * 100}%`,
                          top: `${Math.random() * 100}%`,
                          animationDelay: `${Math.random() * 3}s`,
                          animationDuration: `${3 + Math.random() * 4}s`,
                          backgroundColor: i % 3 === 0 ? colors.primary : i % 3 === 1 ? colors.secondary : colors.accent
                        }}
                      />
                    ))}
                  </div>

                  {/* Raggi di luce pulsanti */}
                  <div className="light-beams">
                    {[...Array(8)].map((_, i) => (
                      <div
                        key={i}
                        className="light-beam"
                        style={{
                          transform: `rotate(${i * 45}deg)`,
                          animationDelay: `${i * 0.2}s`,
                          background: `linear-gradient(180deg, ${colors.primary}66 0%, transparent 100%)`
                        }}
                      />
                    ))}
                  </div>

                  {/* Anelli pulsanti */}
                  <div className="pulse-rings">
                    <div className="pulse-ring" style={{ borderColor: colors.primary }} />
                    <div className="pulse-ring" style={{ borderColor: colors.secondary, animationDelay: '0.5s' }} />
                    <div className="pulse-ring" style={{ borderColor: colors.accent, animationDelay: '1s' }} />
                  </div>

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

                  {/* Scritte motivazionali con zoom spettacolare */}
                  <div
                    key={currentQuoteIndex}
                    className="motivational-quote-spectacular"
                  >
                    {motivationalQuotes[currentQuoteIndex]}
                  </div>
                </div>
              )
            })()}

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

                <h1 className="winner-name">
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

                <button
                  onClick={closeOverlay}
                  className="close-button"
                  aria-label="Chiudi"
                >
                  <Power size={32} />
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
                  <span className="stat-value stat-date">
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
        <>
          <LotteryThemeRenderer
            theme={event.theme || 'casino'}
            colors={colors}
            eventName={event.name}
          />

          {/* Power-On Button Overlay */}
          {!isActivated && (
            <div
              className="power-on-overlay"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="power-on-container">
                <button
                  className="power-on-button"
                  onClick={handleActivateDisplay}
                  style={{
                    background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                    boxShadow: `0 0 40px ${colors.primary}66, 0 0 80px ${colors.primary}33`
                  }}
                >
                  <Power size={64} strokeWidth={2.5} />
                </button>
                <div className="power-on-text" style={{ color: colors.accent }}>
                  Tocca per attivare il display
                </div>
                <div className="power-on-subtext">
                  Premi il pulsante per abilitare audio e controllo remoto
                </div>
              </div>
            </div>
          )}
        </>
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
    // Create broadcast channel to notify remote control (same browser)
    const channel = new BroadcastChannel(`lottery-display-${eventId}`)

    // Generate unique session ID for this display instance
    const sessionId = `display-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    const loadData = async () => {
      try {
        const { lotteryService } = await import('../services/lotteryService')
        const { supabase } = await import('../lib/supabase')

        console.log('🎰 Loading lottery event:', eventId)

        // Load event
        const eventData = await lotteryService.getEvent(eventId)
        console.log('✅ Event loaded:', eventData)
        setEvent(eventData)

        // Load tickets
        const ticketsData = await lotteryService.getEventTickets(eventId)
        console.log('🎫 Tickets loaded:', ticketsData.length)
        setTickets(ticketsData)

        // Register display in database for cross-device detection
        await supabase
          .from('lottery_display_status')
          .upsert({
            event_id: eventId,
            session_id: sessionId,
            is_online: true,
            last_heartbeat: new Date().toISOString()
          })

        console.log('📺 Display registered with session:', sessionId)

        // Notify that display is online (same browser)
        channel.postMessage({ type: 'display-online', eventId })
      } catch (error) {
        console.error('❌ Failed to load lottery data:', error)
        console.error('Event ID:', eventId)
      } finally {
        setLoading(false)
      }
    }

    loadData()

    // Send heartbeat every 5 seconds (both broadcast and database)
    const heartbeat = setInterval(async () => {
      channel.postMessage({ type: 'display-heartbeat', eventId })

      // Update database heartbeat
      try {
        const { supabase } = await import('../lib/supabase')
        await supabase
          .from('lottery_display_status')
          .update({
            last_heartbeat: new Date().toISOString(),
            is_online: true
          })
          .eq('session_id', sessionId)
      } catch (error) {
        console.error('Failed to update heartbeat:', error)
      }
    }, 5000)

    // Cleanup
    return () => {
      const cleanup = async () => {
        try {
          const { supabase } = await import('../lib/supabase')

          // Mark as offline in database
          await supabase
            .from('lottery_display_status')
            .update({ is_online: false })
            .eq('session_id', sessionId)

          console.log('📺 Display marked offline')
        } catch (error) {
          console.error('Cleanup error:', error)
        }
      }

      cleanup()
      channel.postMessage({ type: 'display-offline', eventId })
      channel.close()
      clearInterval(heartbeat)
    }
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
