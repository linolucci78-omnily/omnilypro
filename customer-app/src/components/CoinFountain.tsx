import { useRef, useEffect, forwardRef, useImperativeHandle } from 'react'

export interface CoinFountainRef {
  triggerFountain: (points?: number) => void
}

const CoinFountain = forwardRef<CoinFountainRef>((_, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const coinImageRef = useRef<HTMLImageElement | null>(null)
  const particlesRef = useRef<any[]>([])
  const animationFrameRef = useRef<number>(0)

  // Carica immagine moneta all'avvio
  useEffect(() => {
    const img = new Image()
    img.src = 'https://sjvatdnvewohvswfrdiv.supabase.co/storage/v1/object/public/IMG/moneyomily.png'
    img.onload = () => {
      coinImageRef.current = img
      console.log('✅ Customer App - Coin image loaded')
    }
    img.onerror = () => {
      console.error('❌ Customer App - Failed to load coin image')
    }
  }, [])

  // COIN FOUNTAIN ANIMATION - Gemini Style (Canvas)
  const triggerFountain = (points: number = 50) => {
    console.log('🎯 Customer App - triggerFountain called with', points, 'points')

    const canvas = canvasRef.current
    const img = coinImageRef.current

    console.log('🔍 Customer App - Canvas:', !!canvas, 'Image:', !!img, 'Image complete:', img?.complete)

    if (!canvas) {
      console.error('❌ Customer App - Canvas not available!')
      return
    }

    if (!img || !img.complete) {
      console.log('⚠️ Customer App - Coin image not ready yet, retrying in 100ms...')
      setTimeout(() => triggerFountain(points), 100)
      return
    }

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      console.log('❌ Customer App - Could not get canvas context')
      return
    }

    // Adatta il canvas a tutto lo schermo
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    console.log('✅ Customer App - Canvas setup complete', canvas.width, 'x', canvas.height)
    console.log('🚀 Customer App - Starting fountain animation!')

    let spawnDuration = 1000 // La fontana sputa monete per 1 secondo
    const startTime = Date.now()

    // Funzione che crea una SINGOLA moneta con dati fisici
    const spawnParticle = () => {
      const x = window.innerWidth / 2 // Parte dal centro orizzontale
      const y = window.innerHeight - 20 // Parte molto in basso, quasi al bordo dello schermo

      // Calcolo vettoriale per lanciare verso l'alto a ventaglio
      const angle = -Math.PI / 2 + (Math.random() * 0.5 - 0.25) // Angolo stretto verso l'alto
      const velocity = 15 + Math.random() * 10 // Velocità casuale (alcune veloci, alcune lente)

      particlesRef.current.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * velocity * 0.5, // Spostamento laterale
        vy: Math.sin(angle) * velocity,       // Spinta potente verso l'alto (negativa)
        gravity: 0.5,                         // La forza che la tira giù
        rotation: Math.random() * 360,        // Rotazione iniziale
        rotationSpeed: (Math.random() - 0.5) * 10, // Velocità di rotazione
        scale: 0.5 + Math.random() * 0.5,     // Grandezza variabile
      })
    }

    // Il Loop di Animazione (60 fotogrammi al secondo)
    let frameCount = 0
    const animate = () => {
      const now = Date.now()
      ctx.clearRect(0, 0, canvas.width, canvas.height) // Pulisce il fotogramma precedente

      // Genera nuove monete se siamo ancora nel tempo di spawn
      if (now - startTime < spawnDuration) {
        for(let i=0; i<3; i++) spawnParticle() // Ne crea 3 per ogni fotogramma (densità)
        if (frameCount % 30 === 0) { // Log ogni 30 frames
          console.log(`🪙 Customer App - Spawning coins... Total particles: ${particlesRef.current.length}`)
        }
      }
      frameCount++

      // Aggiorna e Disegna ogni moneta esistente
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i]

        // APPLICAZIONE FISICA
        p.vy += p.gravity // La gravità aumenta la velocità di caduta
        p.x += p.vx       // Sposta in orizzontale
        p.y += p.vy       // Sposta in verticale
        p.rotation += p.rotationSpeed // Ruota la moneta

        // DISEGNO ROTANTE (Il trucco del Canvas)
        ctx.save()
        ctx.translate(p.x, p.y) // Sposta il pennello al centro della moneta
        ctx.rotate((p.rotation * Math.PI) / 180) // Ruota il "foglio"
        // Disegna l'immagine Money Omily
        ctx.drawImage(img, -25 * p.scale, -25 * p.scale, 50 * p.scale, 50 * p.scale)
        ctx.restore()

        // Rimuovi moneta se cade fuori dallo schermo in basso
        if (p.y > canvas.height + 50) {
          particlesRef.current.splice(i, 1)
        }
      }

      // Continua l'animazione finché ci sono monete
      if (particlesRef.current.length > 0 || now - startTime < spawnDuration) {
        animationFrameRef.current = requestAnimationFrame(animate)
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height) // Pulizia finale
        console.log('✅ Customer App - Coin fountain animation completed')
      }
    }

    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
    animate() // Avvia il loop
  }

  // Expose methods to parent
  useImperativeHandle(ref, () => ({
    triggerFountain
  }), [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 10002 // Sopra tutto
      }}
    />
  )
})

CoinFountain.displayName = 'CoinFountain'

export default CoinFountain
