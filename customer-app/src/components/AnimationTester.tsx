import { Coins, PartyPopper, Trophy, Sparkles } from 'lucide-react'

interface AnimationTesterProps {
  onTriggerAnimation: (type: 'points' | 'confetti' | 'trophy' | 'sparkles', data?: any) => void
}

/**
 * Componente per testare le animazioni notifiche
 * Da usare solo in development
 */
export default function AnimationTester({ onTriggerAnimation }: AnimationTesterProps) {
  // Solo in development
  if (import.meta.env.PROD) return null

  return (
    <div className="fixed bottom-24 right-4 z-50 bg-white rounded-2xl shadow-2xl p-4 border-2 border-gray-200">
      <p className="text-xs font-bold text-gray-500 uppercase mb-3">🧪 Animation Test</p>

      <div className="flex flex-col gap-2">
        <button
          onClick={() => onTriggerAnimation('points', { points: 50 })}
          className="flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-sm font-semibold transition-colors"
        >
          <Coins className="w-4 h-4" />
          Coin Fountain
        </button>

        <button
          onClick={() => onTriggerAnimation('confetti')}
          className="flex items-center gap-2 px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg text-sm font-semibold transition-colors"
        >
          <PartyPopper className="w-4 h-4" />
          Confetti
        </button>

        <button
          onClick={() => onTriggerAnimation('trophy', { tier: 'Gold' })}
          className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-semibold transition-colors"
        >
          <Trophy className="w-4 h-4" />
          Trophy
        </button>

        <button
          onClick={() => onTriggerAnimation('sparkles')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-semibold transition-colors"
        >
          <Sparkles className="w-4 h-4" />
          Sparkles
        </button>
      </div>
    </div>
  )
}
