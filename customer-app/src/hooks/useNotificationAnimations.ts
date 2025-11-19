import { useRef, useEffect } from 'react'
import type { NotificationAnimationsRef } from '../components/NotificationAnimations'

/**
 * Hook per usare le animazioni di notifica
 *
 * @example
 * const animations = useNotificationAnimations()
 *
 * // Quando l'utente guadagna punti
 * animations.coinFountain(50)
 *
 * // Quando fa tier upgrade
 * animations.trophy('Gold')
 */
export function useNotificationAnimations() {
  const animationsRef = useRef<NotificationAnimationsRef | null>(null)

  // Ascolta eventi OneSignal personalizzati
  useEffect(() => {
    const handleAnimation = (event: CustomEvent) => {
      const { type, data } = event.detail

      switch (type) {
        case 'points':
          animationsRef.current?.triggerCoinFountain(data.points)
          break
        case 'confetti':
          animationsRef.current?.triggerConfetti()
          break
        case 'trophy':
          animationsRef.current?.triggerTrophy(data.tier)
          break
        case 'sparkles':
          animationsRef.current?.triggerSparkles()
          break
      }
    }

    window.addEventListener('onesignal-animation', handleAnimation as EventListener)

    return () => {
      window.removeEventListener('onesignal-animation', handleAnimation as EventListener)
    }
  }, [])

  return {
    // Riferimento al componente (da passare con ref)
    animationsRef,

    // Metodi diretti
    coinFountain: (points?: number) => animationsRef.current?.triggerCoinFountain(points),
    confetti: () => animationsRef.current?.triggerConfetti(),
    trophy: (tier?: string) => animationsRef.current?.triggerTrophy(tier),
    sparkles: () => animationsRef.current?.triggerSparkles()
  }
}
