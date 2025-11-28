import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { CheckCircle2, Building2, CreditCard, AlertCircle, Loader, Sparkles, Shield, Zap, ArrowRight } from 'lucide-react'
import { PLAN_PRICES, PLAN_NAMES } from '../utils/planPermissions'
import { SparklesCore } from '@/components/UI/sparkles'

const ActivateOrganization: React.FC = () => {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [organization, setOrganization] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    loadOrganization()
  }, [token])

  const loadOrganization = async () => {
    try {
      setLoading(true)

      // Fetch organization by activation token
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('activation_token', token)
        .eq('status', 'pending_payment')
        .single()

      if (error || !data) {
        setError('Link di attivazione non valido o già utilizzato')
        setLoading(false)
        return
      }

      setOrganization(data)
      setLoading(false)
    } catch (err: any) {
      console.error('Error loading organization:', err)
      setError('Errore nel caricamento dei dati')
      setLoading(false)
    }
  }

  const handleActivateAndPay = async () => {
    setProcessing(true)

    try {
      console.log('🛒 Creating Stripe Checkout Session...')

      // Call Edge Function to create Stripe Checkout Session
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const functionUrl = `${supabaseUrl}/functions/v1/create-checkout-session`

      console.log('📍 Function URL:', functionUrl)

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          activation_token: token
        })
      })

      console.log('📡 Response status:', response.status)
      console.log('📡 Response headers:', response.headers)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Response error:', errorText)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const result = await response.json()
      console.log('📦 Response data:', result)

      if (!result.success) {
        throw new Error(result.error || 'Errore durante la creazione della sessione di pagamento')
      }

      console.log('✅ Checkout session created:', result.session_id)
      console.log('🔗 Redirecting to Stripe Checkout...')

      // Redirect to Stripe Checkout
      window.location.href = result.checkout_url

    } catch (err: any) {
      console.error('Activation error:', err)
      setError('Errore durante l\'attivazione: ' + err.message)
      setProcessing(false)
    }
  }

  const planPrice = organization ? PLAN_PRICES[organization.plan_type as keyof typeof PLAN_PRICES] : null
  const planName = organization ? PLAN_NAMES[organization.plan_type as keyof typeof PLAN_NAMES] : null

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
          <p className="text-white text-xl">Caricamento...</p>
        </motion.div>
      </div>
    )
  }

  if (error || !organization) {
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
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 max-w-lg mx-auto px-6 text-center"
        >
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-12 border border-white/20 shadow-2xl">
            <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle size={48} className="text-red-500" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">Link non valido</h1>
            <p className="text-gray-300 text-lg mb-8">{error || 'Link di attivazione non trovato o già utilizzato'}</p>
            <button
              onClick={() => navigate('/')}
              className="px-8 py-4 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl font-semibold hover:from-red-700 hover:to-red-600 transition-all transform hover:scale-105 shadow-lg"
            >
              Torna alla Home
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black relative overflow-hidden">
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

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Logo & Header */}
          <div className="text-center mb-12">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mb-6"
            >
              <img
                src="https://sjvatdnvewohvswfrdiv.supabase.co/storage/v1/object/public/IMG/OMNILYPRO.png"
                alt="OMNILY PRO"
                className="h-20 w-auto mx-auto object-contain"
              />
            </motion.div>
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-5xl font-bold text-white mb-4"
            >
              Benvenuto in <span className="bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">OmnilyPro</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-xl text-gray-300 mb-3"
            >
              Il tuo account è pronto. Completa l'attivazione per iniziare! 🚀
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-base text-gray-400 max-w-2xl mx-auto"
            >
              Stai per attivare la piattaforma di fidelizzazione più avanzata d'Italia.
              Con OmnilyPro trasformerai i tuoi clienti in ambassador del tuo brand.
            </motion.p>
          </div>

          {/* Organization Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl mb-8"
          >
            <div className="flex items-center gap-6 mb-8">
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-bold text-white shadow-xl"
                style={{ background: organization.primary_color || '#dc2626' }}
              >
                {organization.logo_url ? (
                  <img src={organization.logo_url} alt={organization.name} className="w-full h-full object-cover rounded-2xl" />
                ) : (
                  <span>{organization.name.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-white mb-2">{organization.name}</h2>
                <p className="text-gray-300 text-lg">La tua nuova piattaforma di fidelizzazione intelligente</p>
              </div>
            </div>

            {/* Plan Badge */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div
                  className="px-6 py-3 rounded-xl font-bold text-white shadow-lg"
                  style={{
                    background: organization.plan_type === 'enterprise' ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)' :
                               organization.plan_type === 'pro' ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' :
                               'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                  }}
                >
                  <Sparkles size={18} className="inline mr-2" />
                  Piano {planName}
                </div>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold text-white">€{planPrice?.price}</div>
                <div className="text-gray-400 text-sm">/{planPrice?.period === 'month' ? 'mese' : 'anno'}</div>
              </div>
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              {organization.plan_type === 'basic' && (
                <>
                  <div className="flex items-start gap-3 text-white">
                    <CheckCircle2 size={20} className="text-green-400 mt-1 flex-shrink-0" />
                    <span>Fino a 100 clienti</span>
                  </div>
                  <div className="flex items-start gap-3 text-white">
                    <CheckCircle2 size={20} className="text-green-400 mt-1 flex-shrink-0" />
                    <span>Sistema punti fedeltà</span>
                  </div>
                  <div className="flex items-start gap-3 text-white">
                    <CheckCircle2 size={20} className="text-green-400 mt-1 flex-shrink-0" />
                    <span>3 livelli di loyalty</span>
                  </div>
                  <div className="flex items-start gap-3 text-white">
                    <CheckCircle2 size={20} className="text-green-400 mt-1 flex-shrink-0" />
                    <span>Coupon e premi</span>
                  </div>
                  <div className="flex items-start gap-3 text-white">
                    <CheckCircle2 size={20} className="text-green-400 mt-1 flex-shrink-0" />
                    <span>Email automations</span>
                  </div>
                </>
              )}
              {organization.plan_type === 'pro' && (
                <>
                  <div className="flex items-start gap-3 text-white">
                    <CheckCircle2 size={20} className="text-green-400 mt-1 flex-shrink-0" />
                    <span>Fino a 1000 clienti</span>
                  </div>
                  <div className="flex items-start gap-3 text-white">
                    <CheckCircle2 size={20} className="text-green-400 mt-1 flex-shrink-0" />
                    <span>Tutto di Basic +</span>
                  </div>
                  <div className="flex items-start gap-3 text-white">
                    <CheckCircle2 size={20} className="text-green-400 mt-1 flex-shrink-0" />
                    <span>Sistema lotterie</span>
                  </div>
                  <div className="flex items-start gap-3 text-white">
                    <CheckCircle2 size={20} className="text-green-400 mt-1 flex-shrink-0" />
                    <span>OMNY Wallet</span>
                  </div>
                  <div className="flex items-start gap-3 text-white">
                    <CheckCircle2 size={20} className="text-green-400 mt-1 flex-shrink-0" />
                    <span>Analytics avanzati</span>
                  </div>
                  <div className="flex items-start gap-3 text-white">
                    <CheckCircle2 size={20} className="text-green-400 mt-1 flex-shrink-0" />
                    <span>Branding personalizzato</span>
                  </div>
                </>
              )}
              {organization.plan_type === 'enterprise' && (
                <>
                  <div className="flex items-start gap-3 text-white">
                    <CheckCircle2 size={20} className="text-green-400 mt-1 flex-shrink-0" />
                    <span>Clienti illimitati</span>
                  </div>
                  <div className="flex items-start gap-3 text-white">
                    <CheckCircle2 size={20} className="text-green-400 mt-1 flex-shrink-0" />
                    <span>Tutto di Pro +</span>
                  </div>
                  <div className="flex items-start gap-3 text-white">
                    <CheckCircle2 size={20} className="text-green-400 mt-1 flex-shrink-0" />
                    <span>Canali integrazione</span>
                  </div>
                  <div className="flex items-start gap-3 text-white">
                    <CheckCircle2 size={20} className="text-green-400 mt-1 flex-shrink-0" />
                    <span>White label</span>
                  </div>
                  <div className="flex items-start gap-3 text-white">
                    <CheckCircle2 size={20} className="text-green-400 mt-1 flex-shrink-0" />
                    <span>Supporto prioritario</span>
                  </div>
                  <div className="flex items-start gap-3 text-white">
                    <CheckCircle2 size={20} className="text-green-400 mt-1 flex-shrink-0" />
                    <span>SSO e API dedicate</span>
                  </div>
                </>
              )}
            </div>

            {/* Trust Badges */}
            <div className="flex items-center justify-around py-6 border-t border-white/10">
              <div className="text-center">
                <Shield className="text-green-400 mx-auto mb-2" size={24} />
                <p className="text-xs text-gray-400">Sicuro & Certificato</p>
              </div>
              <div className="text-center">
                <Zap className="text-yellow-400 mx-auto mb-2" size={24} />
                <p className="text-xs text-gray-400">Setup in 15 min</p>
              </div>
              <div className="text-center">
                <CheckCircle2 className="text-blue-400 mx-auto mb-2" size={24} />
                <p className="text-xs text-gray-400">GDPR Compliant</p>
              </div>
            </div>
          </motion.div>

          {/* What Happens Next */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-lg border border-blue-400/30 rounded-2xl p-8 mb-8"
          >
            <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              <Sparkles className="text-yellow-400" size={28} />
              Cosa succede dopo il pagamento?
            </h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-green-500 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
                  <span className="text-white font-bold text-2xl">1</span>
                </div>
                <h4 className="text-white font-semibold mb-2">Attivazione Immediata</h4>
                <p className="text-gray-300 text-sm">
                  Il tuo account viene attivato automaticamente appena completato il pagamento
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
                  <span className="text-white font-bold text-2xl">2</span>
                </div>
                <h4 className="text-white font-semibold mb-2">Email con Credenziali</h4>
                <p className="text-gray-300 text-sm">
                  Riceverai un'email con username, password e link diretto alla dashboard
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
                  <span className="text-white font-bold text-2xl">3</span>
                </div>
                <h4 className="text-white font-semibold mb-2">Inizia Subito</h4>
                <p className="text-gray-300 text-sm">
                  Accedi e configura il tuo programma fedeltà in meno di 15 minuti
                </p>
              </div>
            </div>
          </motion.div>

          {/* Payment Info Alert */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-blue-500/20 backdrop-blur-lg border border-blue-400/30 rounded-2xl p-6 mb-8"
          >
            <div className="flex items-start gap-4">
              <Shield size={24} className="text-green-400 flex-shrink-0 mt-1" />
              <div>
                <p className="text-white font-semibold mb-1">Pagamento Sicuro e Protetto</p>
                <p className="text-gray-300 text-sm">
                  Tutti i pagamenti sono gestiti da Stripe, il sistema più sicuro al mondo.
                  I tuoi dati sono protetti con crittografia SSL a 256-bit e non vengono mai memorizzati sui nostri server.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Error Display */}
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-red-500/20 backdrop-blur-lg border border-red-400/30 rounded-2xl p-6 mb-8"
            >
              <div className="flex items-start gap-4">
                <AlertCircle size={24} className="text-red-400 flex-shrink-0 mt-1" />
                <div>
                  <p className="text-white font-semibold mb-1">Errore</p>
                  <p className="text-gray-300 text-sm">{error}</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="text-center"
          >
            <button
              onClick={handleActivateAndPay}
              disabled={processing}
              className="group relative px-12 py-6 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-2xl font-bold text-xl hover:from-red-700 hover:to-red-600 transition-all transform hover:scale-105 shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {processing ? (
                <span className="flex items-center justify-center gap-3">
                  <Loader size={24} className="animate-spin" />
                  Elaborazione in corso...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-3">
                  <CreditCard size={24} />
                  Attiva e Paga €{planPrice?.price}/{planPrice?.period === 'month' ? 'mese' : 'anno'}
                  <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
                </span>
              )}
            </button>

            {/* Security Badges */}
            <div className="mt-8 flex flex-col items-center gap-3">
              <div className="flex items-center justify-center gap-2 text-gray-400">
                <Shield size={18} className="text-green-400" />
                <span className="text-sm">Pagamento sicuro gestito da Stripe</span>
              </div>
              <div className="flex items-center gap-6 text-gray-500 text-xs">
                <div className="flex items-center gap-1">
                  <CheckCircle2 size={14} className="text-green-400" />
                  <span>SSL Certificato</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle2 size={14} className="text-green-400" />
                  <span>PCI Compliant</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle2 size={14} className="text-green-400" />
                  <span>Rimborso garantito</span>
                </div>
              </div>
            </div>

            {/* Money Back Guarantee */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="mt-8 inline-block px-6 py-3 bg-yellow-500/20 border border-yellow-400/30 rounded-xl"
            >
              <p className="text-yellow-400 font-semibold text-sm flex items-center gap-2">
                <span className="text-2xl">✨</span>
                Garanzia soddisfatti o rimborsati 30 giorni
              </p>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

export default ActivateOrganization
