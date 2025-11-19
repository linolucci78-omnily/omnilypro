import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react'

// =====================================================
// Types
// =====================================================
interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  gravity: number
  rotation: number
  rotationSpeed: number
  scale: number
  alpha?: number
  color?: string
}

export interface NotificationAnimationsRef {
  triggerCoinFountain: (points?: number) => void
  triggerConfetti: () => void
  triggerTrophy: (tier?: string) => void
  triggerSparkles: () => void
}

// =====================================================
// NotificationAnimations Component
// =====================================================
const NotificationAnimations = forwardRef<NotificationAnimationsRef>((props, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const coinImageRef = useRef<HTMLImageElement | null>(null)
  const particlesRef = useRef<Particle[]>([])
  const animationFrameRef = useRef<number>(0)

  // =====================================================
  // Carica immagine moneta all'avvio
  // =====================================================
  useEffect(() => {
    const img = new Image()
    // TODO: Sostituisci con il tuo URL immagine moneta
    img.src = 'https://sjvatdnvewohvswfrdiv.supabase.co/storage/v1/object/public/IMG/moneyomily.png'
    img.onload = () => {
      coinImageRef.current = img
      console.log('Coin image loaded successfully')
    }
    img.onerror = () => {
      console.error('Failed to load coin image')
    }

    return () => {
      // Cleanup animation on unmount
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  // =====================================================
  // 1. COIN FOUNTAIN ANIMATION
  // Fontana di monete che parte dal pulsante QR (BottomNav)
  // =====================================================
  const triggerCoinFountain = (points: number = 50) => {
    const canvas = canvasRef.current
    const img = coinImageRef.current

    if (!canvas || !img) {
      console.warn('Canvas or coin image not ready')
      return
    }

    // Adatta canvas a schermo intero
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Reset particles
    particlesRef.current = []

    const spawnDuration = 1000 // Spara monete per 1 secondo
    const startTime = Date.now()

    // Funzione per creare una singola moneta
    const spawnParticle = () => {
      // Punto di partenza: Centro schermo, in basso (dietro il QR button)
      const x = window.innerWidth / 2
      const y = window.innerHeight - 20 // Proprio in fondo (dietro navbar)

      // Calcolo angolo per fontana (ventaglio verso l'alto)
      const angle = -Math.PI / 2 + (Math.random() * 0.6 - 0.3) // ±30° dal centro
      const velocity = 20 + Math.random() * 12 // Velocità alta per raggiungere metà schermo

      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * velocity * 0.6, // Spread orizzontale
        vy: Math.sin(angle) * velocity,       // Spinta verso l'alto (negativa)
        gravity: 0.6,                          // Gravità realistica
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 12, // Rotazione veloce
        scale: 0.4 + Math.random() * 0.4       // Dimensione variabile
      })
    }

    // Loop di animazione
    const animate = () => {
      const now = Date.now()
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Continua a generare monete per la durata dello spawn
      if (now - startTime < spawnDuration) {
        // Spawn multiplo per densità maggiore
        for (let i = 0; i < 4; i++) {
          spawnParticle()
        }
      }

      // Aggiorna e disegna ogni particella
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i]

        // Fisica: Gravità
        p.vy += p.gravity
        p.x += p.vx
        p.y += p.vy
        p.rotation += p.rotationSpeed

        // Disegno con rotazione
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate((p.rotation * Math.PI) / 180)

        const size = 50 * p.scale
        ctx.drawImage(img, -size / 2, -size / 2, size, size)

        ctx.restore()

        // Rimuovi se fuori schermo (caduta)
        if (p.y > canvas.height + 100) {
          particlesRef.current.splice(i, 1)
        }
      }

      // Continua loop finché ci sono particelle
      if (particlesRef.current.length > 0 || now - startTime < spawnDuration) {
        animationFrameRef.current = requestAnimationFrame(animate)
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      }
    }

    // Stop previous animation se esiste
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }

    animate()

    // Vibrazione (se supportata)
    if (navigator.vibrate) {
      navigator.vibrate([50, 30, 50, 30, 50])
    }
  }

  // =====================================================
  // 2. CONFETTI ANIMATION
  // Coriandoli colorati che esplodono dal centro
  // =====================================================
  const triggerConfetti = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    particlesRef.current = []

    const colors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899']

    // Genera 150 coriandoli
    for (let i = 0; i < 150; i++) {
      const angle = Math.random() * Math.PI * 2
      const velocity = 15 + Math.random() * 10

      particlesRef.current.push({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity - 5, // Bias verso l'alto
        gravity: 0.4,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 15,
        scale: 0.3 + Math.random() * 0.5,
        alpha: 1,
        color: colors[Math.floor(Math.random() * colors.length)]
      })
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i]

        p.vy += p.gravity
        p.x += p.vx
        p.y += p.vy
        p.rotation += p.rotationSpeed
        if (p.alpha) p.alpha -= 0.01 // Fade out

        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate((p.rotation * Math.PI) / 180)
        ctx.globalAlpha = p.alpha || 1

        // Disegna rettangolo colorato (confetto)
        ctx.fillStyle = p.color || '#ef4444'
        const size = 10 * p.scale
        ctx.fillRect(-size / 2, -size / 2, size, size * 2)

        ctx.restore()

        if (p.y > canvas.height + 50 || (p.alpha && p.alpha <= 0)) {
          particlesRef.current.splice(i, 1)
        }
      }

      if (particlesRef.current.length > 0) {
        animationFrameRef.current = requestAnimationFrame(animate)
      }
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }

    animate()
  }

  // =====================================================
  // 3. TROPHY ANIMATION
  // Trofeo che appare con effetto zoom + sparkles
  // =====================================================
  const triggerTrophy = (tier: string = 'Gold') => {
    console.log(`🏆 Trophy animation for tier: ${tier}`)
    // TODO: Implementare animazione trofeo
    // Per ora triggeriamo confetti
    triggerConfetti()
  }

  // =====================================================
  // 4. SPARKLES ANIMATION
  // Brillantini che appaiono intorno al cerchio punti
  // =====================================================
  const triggerSparkles = () => {
    console.log('✨ Sparkles animation')
    // TODO: Implementare sparkles
  }

  // =====================================================
  // Esponi metodi al parent tramite ref
  // =====================================================
  useImperativeHandle(ref, () => ({
    triggerCoinFountain,
    triggerConfetti,
    triggerTrophy,
    triggerSparkles
  }))

  // =====================================================
  // Render
  // =====================================================
  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 40 }} // Dietro la navbar (z-50) ma sopra il contenuto
    />
  )
})

NotificationAnimations.displayName = 'NotificationAnimations'

export default NotificationAnimations
