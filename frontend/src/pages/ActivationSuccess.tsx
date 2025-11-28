import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle2, Loader, Mail, Key, Sparkles as SparklesIcon, ArrowRight, Shield } from 'lucide-react'
import { SparklesCore } from '@/components/UI/sparkles'

const ActivationSuccess: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setLoading(false)
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  const sessionId = searchParams.get('session_id')

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center relative overflow-hidden">
        {/* Animated Background Particles */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <SparklesCore
            background="transparent"
            minSize={1}
            maxSize={3}
            particleDensity={100}
            className="w-full h-full"
            particleColor="#ef4444"
            speed={3}
          />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 text-center"
        >
          <Loader size={64} className="text-red-500 animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Verifica pagamento in corso...</h2>
          <p className="text-gray-300">Attendere prego, stiamo attivando il tuo account</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black relative overflow-hidden flex items-center">
      {/* Animated Background Particles */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <SparklesCore
          background="transparent"
          minSize={1}
          maxSize={3}
          particleDensity={100}
          className="w-full h-full"
          particleColor="#ef4444"
          speed={3}
        />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-20 w-full">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          {/* Logo */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
            className="mb-8"
          >
            <img
              src="https://sjvatdnvewohvswfrdiv.supabase.co/storage/v1/object/public/IMG/OMNILYPRO.png"
              alt="OMNILY PRO"
              className="h-20 w-auto mx-auto object-contain"
            />
          </motion.div>

          {/* Success Icon with Animation */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="relative mb-8"
          >
            <div className="w-32 h-32 bg-gradient-to-br from-green-600 to-green-500 rounded-full flex items-center justify-center mx-auto shadow-2xl">
              <CheckCircle2 size={80} className="text-white" />
            </div>
            {/* Animated rings */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1.5, opacity: 0 }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="absolute inset-0 rounded-full border-4 border-green-400"
            />
          </motion.div>

          {/* Success Message */}
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-5xl font-bold text-white mb-4"
          >
            Pagamento Completato! <span className="inline-block">🎉</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-2xl text-gray-300 mb-8"
          >
            Il tuo account <span className="bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent font-bold">OmnilyPro</span> è stato attivato con successo
          </motion.p>

          {/* Session ID (optional) */}
          {sessionId && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mb-8"
            >
              <code className="px-4 py-2 bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg text-gray-300 text-sm">
                Sessione: {sessionId}
              </code>
            </motion.div>
          )}

          {/* Next Steps Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl mb-8 text-left max-w-2xl mx-auto"
          >
            <div className="flex items-center gap-3 mb-6">
              <SparklesIcon className="text-yellow-400" size={28} />
              <h3 className="text-2xl font-bold text-white">Prossimi Passi</h3>
            </div>

            {/* Step 1 */}
            <div className="flex items-start gap-4 mb-6 p-4 bg-blue-500/10 border border-blue-400/20 rounded-2xl">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <Mail size={24} className="text-white" />
              </div>
              <div className="flex-1">
                <h4 className="text-xl font-semibold text-white mb-2">Controlla la tua email</h4>
                <p className="text-gray-300">
                  Riceverai a breve un'email con le credenziali di accesso e le istruzioni per iniziare.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start gap-4 p-4 bg-green-500/10 border border-green-400/20 rounded-2xl">
              <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-green-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <Key size={24} className="text-white" />
              </div>
              <div className="flex-1">
                <h4 className="text-xl font-semibold text-white mb-2">Accedi alla dashboard</h4>
                <p className="text-gray-300">
                  Usa le credenziali ricevute per accedere e iniziare a configurare il tuo sistema di loyalty.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-8"
          >
            <button
              onClick={() => navigate('/login')}
              className="group px-10 py-5 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-2xl font-bold text-lg hover:from-red-700 hover:to-red-600 transition-all transform hover:scale-105 shadow-2xl flex items-center justify-center gap-3"
            >
              Vai al Login
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => navigate('/')}
              className="px-10 py-5 bg-white/10 backdrop-blur-lg border border-white/20 text-white rounded-2xl font-semibold text-lg hover:bg-white/20 transition-all shadow-xl"
            >
              Torna alla Home
            </button>
          </motion.div>

          {/* Support Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="flex items-center justify-center gap-2 text-gray-400"
          >
            <Shield size={18} className="text-green-400" />
            <p className="text-sm">
              Hai domande? Contattaci a{' '}
              <a
                href="mailto:support@omnilypro.com"
                className="text-red-400 hover:text-red-300 underline"
              >
                support@omnilypro.com
              </a>
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

export default ActivationSuccess
