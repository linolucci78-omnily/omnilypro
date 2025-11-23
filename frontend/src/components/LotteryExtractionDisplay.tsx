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

  const animationRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const heartbeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const musicIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const countdownMusicRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Get brand colors from event
  const colors = event.brand_colors || {
    primary: '#e74c3c',
    secondary: '#c0392b',
    accent: '#f39c12'
  }

  // Initialize Web Audio
  useEffect(() => {
    const initAudio = async () => {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
        console.log('🔊 AudioContext created, state:', audioContextRef.current.state)

        // Try to resume immediately (might need user interaction)
        if (audioContextRef.current.state === 'suspended') {
          await audioContextRef.current.resume()
          console.log('✅ AudioContext resumed on init')
        }
      } catch (err) {
        console.error('❌ Failed to initialize AudioContext:', err)
      }
    }

    initAudio()

    // Also try to resume on first user interaction
    const resumeOnInteraction = async () => {
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        console.log('🔊 User interaction detected, resuming audio...')
        try {
          await audioContextRef.current.resume()
          console.log('✅ AudioContext resumed')
        } catch (err) {
          console.error('❌ Failed to resume AudioContext:', err)
        }
      }
    }

    // Try aggressive resume strategies
    document.addEventListener('click', resumeOnInteraction, { once: true })
    document.addEventListener('touchstart', resumeOnInteraction, { once: true })
    document.addEventListener('keydown', resumeOnInteraction, { once: true })
    document.addEventListener('mousemove', resumeOnInteraction, { once: true })

    // Try to auto-resume after a short delay (in case window opens with focus)
    const autoResumeTimeout = setTimeout(async () => {
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        console.log('🔊 Attempting auto-resume after delay...')
        try {
          await audioContextRef.current.resume()
          console.log('✅ AudioContext auto-resumed')
        } catch (err) {
          console.log('⚠️ Auto-resume failed, waiting for user interaction')
        }
      }
    }, 500)

    return () => {
      document.removeEventListener('click', resumeOnInteraction)
      document.removeEventListener('touchstart', resumeOnInteraction)
      document.removeEventListener('keydown', resumeOnInteraction)
      document.removeEventListener('mousemove', resumeOnInteraction)
      clearTimeout(autoResumeTimeout)
      audioContextRef.current?.close()
    }
  }, [])

  // Heartbeat sound effect using Web Audio API
  const playHeartbeat = async (intensity: number = 1) => {
    if (!audioContextRef.current) return

    const ctx = audioContextRef.current

    // Ensure audio is running
    if (ctx.state === 'suspended') {
      try {
        await ctx.resume()
      } catch (err) {
        return // Silently fail if can't resume
      }
    }

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

  // Victory music - musica trionfale di vittoria
  const playCelebration = async () => {
    if (!audioContextRef.current) return

    const ctx = audioContextRef.current

    // Ensure audio is running
    if (ctx.state === 'suspended') {
      try {
        await ctx.resume()
      } catch (err) {
        return
      }
    }

    const now = ctx.currentTime

    // FANFARE INIZIALE - Accordo trionfale C major
    const chord1 = [523.25, 659.25, 783.99, 1046.50] // C major
    chord1.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'triangle'

      osc.frequency.setValueAtTime(freq, now)
      gain.gain.setValueAtTime(0, now)
      gain.gain.linearRampToValueAtTime(0.2, now + 0.1)
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8)

      osc.start(now + i * 0.03)
      osc.stop(now + 0.8)
    })

    // SECONDO ACCORDO - G major (dopo 0.4s)
    const chord2 = [392.00, 493.88, 587.33, 783.99] // G major
    chord2.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'triangle'

      osc.frequency.setValueAtTime(freq, now + 0.4)
      gain.gain.setValueAtTime(0, now + 0.4)
      gain.gain.linearRampToValueAtTime(0.18, now + 0.5)
      gain.gain.exponentialRampToValueAtTime(0.01, now + 1.2)

      osc.start(now + 0.4 + i * 0.03)
      osc.stop(now + 1.2)
    })

    // TERZO ACCORDO FINALE - C major ottava alta (dopo 0.8s)
    const chord3 = [1046.50, 1318.51, 1567.98, 2093.00] // C major high
    chord3.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'triangle'

      osc.frequency.setValueAtTime(freq, now + 0.8)
      gain.gain.setValueAtTime(0, now + 0.8)
      gain.gain.linearRampToValueAtTime(0.25, now + 0.9)
      gain.gain.exponentialRampToValueAtTime(0.01, now + 2.5)

      osc.start(now + 0.8 + i * 0.03)
      osc.stop(now + 2.5)
    })

    // MELODIA VITTORIOSA - note ascendenti (inizia dopo 1.2s)
    const victoryMelody = [
      { freq: 523.25, time: 1.2, duration: 0.2 }, // C
      { freq: 587.33, time: 1.4, duration: 0.2 }, // D
      { freq: 659.25, time: 1.6, duration: 0.2 }, // E
      { freq: 783.99, time: 1.8, duration: 0.3 }, // G
      { freq: 1046.50, time: 2.1, duration: 0.5 } // C high - finale!
    ]

    victoryMelody.forEach(note => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'

      osc.frequency.setValueAtTime(note.freq, now + note.time)
      gain.gain.setValueAtTime(0.15, now + note.time)
      gain.gain.exponentialRampToValueAtTime(0.01, now + note.time + note.duration)

      osc.start(now + note.time)
      osc.stop(now + note.time + note.duration)
    })
  }

  // Countdown buildup music - tensione crescente
  const playCountdownMusic = async (intensity: number) => {
    if (!audioContextRef.current) return

    const ctx = audioContextRef.current

    // Ensure audio is running
    if (ctx.state === 'suspended') {
      try {
        await ctx.resume()
      } catch (err) {
        return
      }
    }

    const now = ctx.currentTime

    // Suono di tensione crescente (frequenze basse che crescono)
    const baseFreq = 80 + (intensity * 30) // Da 80Hz a 380Hz

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(baseFreq, now)
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.2, now + 0.5)

    gain.gain.setValueAtTime(0.1 * intensity, now)
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5)

    osc.start(now)
    osc.stop(now + 0.5)
  }

  // Spinning music - ritmo pulsante
  const playSpinningBeat = async () => {
    if (!audioContextRef.current) return

    const ctx = audioContextRef.current

    // Ensure audio is running
    if (ctx.state === 'suspended') {
      try {
        await ctx.resume()
      } catch (err) {
        return
      }
    }

    const now = ctx.currentTime

    // Beat ritmico con frequenze medie
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.type = 'square'
    osc.frequency.setValueAtTime(220, now) // A3

    gain.gain.setValueAtTime(0.08, now)
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15)

    osc.start(now)
    osc.stop(now + 0.15)

    // Secondo beat armonico
    setTimeout(() => {
      const osc2 = ctx.createOscillator()
      const gain2 = ctx.createGain()
      osc2.connect(gain2)
      gain2.connect(ctx.destination)

      osc2.type = 'sine'
      osc2.frequency.setValueAtTime(330, now + 0.1) // E4

      gain2.gain.setValueAtTime(0.05, now + 0.1)
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.2)

      osc2.start(now + 0.1)
      osc2.stop(now + 0.2)
    }, 100)
  }

  // Notification sound - suono di notifica elegante per messaggi
  const playNotificationSound = async () => {
    if (!audioContextRef.current) {
      console.warn('❌ AudioContext not initialized')
      return
    }

    const ctx = audioContextRef.current

    // Resume AudioContext if suspended (browser policy)
    if (ctx.state === 'suspended') {
      console.log('🔊 Resuming suspended AudioContext...')
      try {
        await ctx.resume()
        console.log('✅ AudioContext resumed')
      } catch (err) {
        console.error('❌ Failed to resume AudioContext:', err)
        return
      }
    }

    console.log('🔔 Playing notification sound, AudioContext state:', ctx.state)
    const now = ctx.currentTime

    // Prima nota - C5 (523 Hz)
    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    osc1.connect(gain1)
    gain1.connect(ctx.destination)
    osc1.type = 'sine'

    osc1.frequency.setValueAtTime(523.25, now)
    gain1.gain.setValueAtTime(0.3, now)
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.15)

    osc1.start(now)
    osc1.stop(now + 0.15)

    // Seconda nota - E5 (659 Hz) - dopo 0.1s
    setTimeout(() => {
      const osc2 = ctx.createOscillator()
      const gain2 = ctx.createGain()
      osc2.connect(gain2)
      gain2.connect(ctx.destination)
      osc2.type = 'sine'

      osc2.frequency.setValueAtTime(659.25, now + 0.1)
      gain2.gain.setValueAtTime(0.25, now + 0.1)
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.25)

      osc2.start(now + 0.1)
      osc2.stop(now + 0.25)
    }, 100)

    // Terza nota - G5 (784 Hz) - dopo 0.2s
    setTimeout(() => {
      const osc3 = ctx.createOscillator()
      const gain3 = ctx.createGain()
      osc3.connect(gain3)
      gain3.connect(ctx.destination)
      osc3.type = 'sine'

      osc3.frequency.setValueAtTime(783.99, now + 0.2)
      gain3.gain.setValueAtTime(0.3, now + 0.2)
      gain3.gain.exponentialRampToValueAtTime(0.01, now + 0.4)

      osc3.start(now + 0.2)
      osc3.stop(now + 0.4)
    }, 200)
  }

  // Countdown music - tensione crescente
  useEffect(() => {
    if (extractionPhase === 'countdown') {
      let intensity = 0

      countdownMusicRef.current = setInterval(() => {
        intensity += 0.1 // Intensità crescente
        playCountdownMusic(Math.min(intensity, 1))
      }, 500) // Ogni 0.5 secondi

      return () => {
        if (countdownMusicRef.current) {
          clearInterval(countdownMusicRef.current)
        }
      }
    }
  }, [extractionPhase])

  // Spinning music - beat ritmico
  useEffect(() => {
    if (extractionPhase === 'spinning') {
      musicIntervalRef.current = setInterval(() => {
        playSpinningBeat()
      }, 300) // Beat ogni 300ms

      return () => {
        if (musicIntervalRef.current) {
          clearInterval(musicIntervalRef.current)
        }
      }
    }
  }, [extractionPhase])

  // Start heartbeat sound during tense phases
  useEffect(() => {
    const startHeartbeat = async () => {
      if (extractionPhase === 'slowing' || extractionPhase === 'locked') {
        // Stop spinning music
        if (musicIntervalRef.current) {
          clearInterval(musicIntervalRef.current)
        }

        // Ensure audio is running before starting interval
        if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
          try {
            await audioContextRef.current.resume()
            console.log('✅ AudioContext resumed for heartbeat')
          } catch (err) {
            console.error('❌ Failed to resume AudioContext for heartbeat:', err)
          }
        }

        // Faster heartbeat as tension builds
        const interval = extractionPhase === 'locked' ? 350 : 800 // Heartbeat più veloce nella fase locked!
        const intensity = extractionPhase === 'locked' ? 2.0 : 1 // Intensità massima nella fase locked!

        heartbeatIntervalRef.current = setInterval(() => {
          playHeartbeat(intensity)
        }, interval)

        // Play first heartbeat immediately
        playHeartbeat(intensity)
      }
    }

    startHeartbeat()

    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current)
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
            {currentPrize && (
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

                {/* Show currentPrize if available, otherwise fallback to event.prize_name */}
                {(currentPrize || event.prize_name) && (
                  <div className="prize-info">
                    <Crown className="w-6 h-6" style={{ color: colors.accent }} />
                    <div>
                      <div className="prize-label">
                        {currentPrize ? (
                          currentPrize.rank === 1 ? '1° PREMIO' :
                          currentPrize.rank === 2 ? '2° PREMIO' :
                          currentPrize.rank === 3 ? '3° PREMIO' :
                          `${currentPrize.rank}° PREMIO`
                        ) : 'Premio'}
                      </div>
                      <div className="prize-name" style={{ color: colors.accent }}>
                        {currentPrize ? currentPrize.name : event.prize_name}
                      </div>
                      {(currentPrize?.value || event.prize_value) && (
                        <div className="prize-value">
                          Valore: €{(currentPrize?.value || event.prize_value)?.toFixed(2)}
                        </div>
                      )}
                    </div>
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
        <LotteryThemeRenderer
          theme={event.theme || 'casino'}
          colors={colors}
          eventName={event.name}
        />
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
    // Create broadcast channel to notify remote control
    const channel = new BroadcastChannel(`lottery-display-${eventId}`)

    const loadData = async () => {
      try {
        const { lotteryService } = await import('../services/lotteryService')

        console.log('🎰 Loading lottery event:', eventId)

        // Load event
        const eventData = await lotteryService.getEvent(eventId)
        console.log('✅ Event loaded:', eventData)
        setEvent(eventData)

        // Load tickets
        const ticketsData = await lotteryService.getEventTickets(eventId)
        console.log('🎫 Tickets loaded:', ticketsData.length)
        setTickets(ticketsData)

        // Notify that display is online
        channel.postMessage({ type: 'display-online', eventId })
      } catch (error) {
        console.error('❌ Failed to load lottery data:', error)
        console.error('Event ID:', eventId)
      } finally {
        setLoading(false)
      }
    }

    loadData()

    // Send heartbeat every 5 seconds
    const heartbeat = setInterval(() => {
      channel.postMessage({ type: 'display-heartbeat', eventId })
    }, 5000)

    // Cleanup
    return () => {
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
