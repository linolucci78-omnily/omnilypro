import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, ArrowRight, Mail, Shield } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { SparklesCore } from '@/components/UI/sparkles'
import styles from './Login.module.css'

const ActivateAccount: React.FC = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [validatingToken, setValidatingToken] = useState(true)
  const [tokenValid, setTokenValid] = useState(false)

  // Get token from URL
  const token = searchParams.get('token')
  const type = searchParams.get('type')

  useEffect(() => {
    // Validate token on mount
    const validateToken = async () => {
      if (!token || type !== 'recovery') {
        setError('Link di attivazione non valido o scaduto')
        setValidatingToken(false)
        setTokenValid(false)
        return
      }

      try {
        // Verify the token by attempting to get the session
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: 'recovery'
        })

        if (error) {
          setError('Link di attivazione scaduto o non valido')
          setTokenValid(false)
        } else {
          setTokenValid(true)
        }
      } catch (err) {
        console.error('Token validation error:', err)
        setError('Errore durante la validazione del link')
        setTokenValid(false)
      } finally {
        setValidatingToken(false)
      }
    }

    validateToken()
  }, [token, type])

  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 8) {
      return 'La password deve essere di almeno 8 caratteri'
    }
    if (!/[A-Z]/.test(pwd)) {
      return 'La password deve contenere almeno una lettera maiuscola'
    }
    if (!/[a-z]/.test(pwd)) {
      return 'La password deve contenere almeno una lettera minuscola'
    }
    if (!/[0-9]/.test(pwd)) {
      return 'La password deve contenere almeno un numero'
    }
    return null
  }

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate password
    const passwordError = validatePassword(password)
    if (passwordError) {
      setError(passwordError)
      return
    }

    // Check passwords match
    if (password !== confirmPassword) {
      setError('Le password non corrispondono')
      return
    }

    setLoading(true)

    try {
      // Update password using the recovery session
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      })

      if (updateError) {
        throw updateError
      }

      setSuccess(true)

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        navigate('/dashboard')
      }, 2000)
    } catch (err: any) {
      console.error('Activation error:', err)
      setError(err.message || 'Errore durante l\'attivazione dell\'account')
    } finally {
      setLoading(false)
    }
  }

  if (validatingToken) {
    return (
      <div className={styles.loginContainer}>
        <div className={styles.loginContent}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={styles.loginCard}
          >
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Shield className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-pulse" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Validazione in corso...</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Verifica del link di attivazione
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  if (!tokenValid) {
    return (
      <div className={styles.loginContainer}>
        <div className={styles.loginContent}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={styles.loginCard}
          >
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <h2 className="text-2xl font-bold mb-2 text-red-600 dark:text-red-400">
                Link non valido
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {error || 'Il link di attivazione è scaduto o non valido'}
              </p>
              <button
                onClick={() => navigate('/login')}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Torna al Login
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className={styles.loginContainer}>
        <div className={styles.loginContent}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={styles.loginCard}
          >
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center"
              >
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </motion.div>
              <h2 className="text-2xl font-bold mb-2 text-green-600 dark:text-green-400">
                Account Attivato!
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Il tuo account è stato attivato con successo.
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Verrai reindirizzato alla dashboard...
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.loginContainer}>
      {/* Sparkles Background */}
      <div className="absolute inset-0 w-full h-full">
        <SparklesCore
          id="activate-sparkles"
          background="transparent"
          minSize={0.6}
          maxSize={1.4}
          particleDensity={50}
          className="w-full h-full"
          particleColor="#3b82f6"
        />
      </div>

      <div className={styles.loginContent}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={styles.loginCard}
        >
          {/* Logo and Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent mb-2">
              Attiva il tuo Account
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Benvenuto in <strong>OMNILY PRO</strong>! Imposta la tua password per iniziare.
            </p>
          </div>

          {/* Activation Form */}
          <form onSubmit={handleActivate} className="space-y-6">
            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  placeholder="Crea una password sicura"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Minimo 8 caratteri, con maiuscole, minuscole e numeri
              </p>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Conferma Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  placeholder="Ripeti la password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-600 dark:text-red-400"
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </motion.div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-cyan-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Attivazione in corso...
                </>
              ) : (
                <>
                  Attiva Account
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center text-sm text-gray-500">
            Hai problemi?{' '}
            <a href="mailto:support@omnilypro.com" className="text-blue-600 hover:underline">
              Contatta il supporto
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default ActivateAccount
