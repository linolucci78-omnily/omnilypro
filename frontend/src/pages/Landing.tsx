import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Rocket, Building2, Shield, BarChart3, Zap, Users, TrendingUp, Award,
  CheckCircle, ArrowRight, Play, Star, ChevronDown, Sparkles, Target,
  Globe, Lock, Smartphone, RefreshCw, MessageSquare, Clock, Check,
  TrendingDown, Percent, DollarSign, ShoppingCart, Mail, Phone, Menu, X, Moon, Sun,
  Video, Gauge, Calculator, Code, Database, Wallet
} from 'lucide-react'
import { SparklesCore } from '@/components/UI/sparkles'

const Landing: React.FC = () => {
  // Dark mode state - default light, saved in localStorage
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('omnily_landing_theme')
      return saved === 'dark'
    }
    return false
  })

  const [activeTab, setActiveTab] = useState('retail')
  const [faqOpen, setFaqOpen] = useState<number | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [counters, setCounters] = useState({ companies: 0, transactions: 0, retention: 0 })

  // Save theme preference
  useEffect(() => {
    localStorage.setItem('omnily_landing_theme', darkMode ? 'dark' : 'light')
  }, [darkMode])

  // Animated counters
  useEffect(() => {
    const interval = setInterval(() => {
      setCounters(prev => ({
        companies: prev.companies < 200 ? prev.companies + 5 : 200,
        transactions: prev.transactions < 1000000 ? prev.transactions + 25000 : 1000000,
        retention: prev.retention < 45 ? prev.retention + 1 : 45
      }))
    }, 30)
    return () => clearInterval(interval)
  }, [])

  const industries = [
    { id: 'retail', name: 'Retail', icon: ShoppingCart, revenue: '+42%', customers: '15.000+' },
    { id: 'restaurant', name: 'Ristorazione', icon: Users, revenue: '+38%', customers: '8.500+' },
    { id: 'beauty', name: 'Beauty & Wellness', icon: Sparkles, revenue: '+51%', customers: '12.000+' },
    { id: 'services', name: 'Servizi', icon: Globe, revenue: '+35%', customers: '6.200+' }
  ]

  const faqs = [
    {
      q: 'Quanto tempo serve per essere operativi?',
      a: 'Con il nostro wizard guidato, puoi configurare completamente il tuo programma loyalty in meno di 15 minuti. Il nostro team ti supporta nell\'onboarding completo entro 24 ore.'
    },
    {
      q: 'Come funziona la prova gratuita?',
      a: 'Offriamo 30 giorni di prova completa senza carta di credito. Hai accesso a tutte le funzionalità Professional per testare la piattaforma con i tuoi clienti reali.'
    },
    {
      q: 'I dati sono sicuri e GDPR compliant?',
      a: 'Assolutamente sì. Utilizziamo crittografia end-to-end, server in EU, backup giornalieri e siamo completamente conformi al GDPR. Forniamo anche DPA personalizzati per Enterprise.'
    },
    {
      q: 'Posso integrare OMNILY con i miei sistemi esistenti?',
      a: 'Sì! Offriamo API REST complete, webhook real-time e integrazioni native con sistemi e-commerce (Shopify, WooCommerce), CRM e email marketing tools.'
    },
    {
      q: 'Cosa succede se supero il limite di clienti?',
      a: 'Nessun problema! Il sistema ti avvisa in anticipo e puoi facilmente upgradare il piano. Non blocchiamo mai il servizio e non ci sono costi nascosti.'
    }
  ]

  const toggleDarkMode = () => setDarkMode(!darkMode)

  return (
    <div className={`min-h-screen transition-colors duration-500 ${
      darkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-black' : 'bg-gradient-to-br from-orange-50 via-white to-pink-50'
    }`}>
      {/* Animated Background Particles */}
      {darkMode && (
        <div className="fixed inset-0 pointer-events-none">
          <SparklesCore
            background="transparent"
            minSize={0.6}
            maxSize={1.4}
            particleDensity={50}
            className="w-full h-full"
            particleColor="#ef4444"
          />
        </div>
      )}

      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-lg border-b transition-colors duration-500 ${
        darkMode
          ? 'bg-gray-900/80 border-white/10'
          : 'bg-white/80 border-gray-200'
      }`}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <img
                src="https://sjvatdnvewohvswfrdiv.supabase.co/storage/v1/object/public/IMG/OMNILYPRO.png"
                alt="OMNILY PRO"
                className="h-16 w-auto object-contain"
              />
            </div>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className={`font-semibold transition-colors ${
                darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-red-600'
              }`}>
                Funzionalità
              </a>
              <a href="#pricing" className={`font-semibold transition-colors ${
                darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-red-600'
              }`}>
                Prezzi
              </a>
              <a href="#testimonials" className={`font-semibold transition-colors ${
                darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-red-600'
              }`}>
                Clienti
              </a>
              <a href="#faq" className={`font-semibold transition-colors ${
                darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-red-600'
              }`}>
                FAQ
              </a>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4">
              {/* Dark Mode Toggle */}
              <button
                onClick={toggleDarkMode}
                className={`p-2 rounded-xl transition-all duration-300 ${
                  darkMode
                    ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                aria-label="Toggle dark mode"
              >
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>

              <Link
                to="/request-demo"
                className={`hidden md:block font-semibold transition-colors ${
                  darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-red-600'
                }`}
              >
                Accedi
              </Link>

              <Link
                to="/request-demo"
                className="hidden md:flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-xl font-bold shadow-lg shadow-red-500/50 hover:shadow-xl hover:shadow-red-500/80 hover:scale-105 transition-all duration-300"
              >
                Richiedi Demo
                <ArrowRight size={16} />
              </Link>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={`md:hidden p-2 rounded-xl transition-colors ${
                  darkMode ? 'text-white hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`md:hidden mt-4 pb-4 border-t ${darkMode ? 'border-white/10' : 'border-gray-200'}`}
            >
              <div className="flex flex-col gap-3 mt-4">
                <a href="#features" onClick={() => setMobileMenuOpen(false)} className={`py-2 font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Funzionalità
                </a>
                <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className={`py-2 font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Prezzi
                </a>
                <a href="#testimonials" onClick={() => setMobileMenuOpen(false)} className={`py-2 font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Clienti
                </a>
                <a href="#faq" onClick={() => setMobileMenuOpen(false)} className={`py-2 font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  FAQ
                </a>
                <Link to="/request-demo" onClick={() => setMobileMenuOpen(false)} className={`py-2 font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Accedi
                </Link>
                <Link
                  to="/request-demo"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-xl font-bold shadow-lg shadow-red-500/50"
                >
                  Richiedi Demo
                  <ArrowRight size={16} />
                </Link>
              </div>
            </motion.div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* Background gradients */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {darkMode ? (
            <>
              <div className="absolute top-20 left-20 w-72 h-72 bg-red-500/20 rounded-full blur-3xl animate-pulse"></div>
              <div className="absolute bottom-20 right-20 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse"></div>
            </>
          ) : (
            <>
              <div className="absolute top-20 right-20 w-96 h-96 bg-gradient-to-br from-red-200/40 to-pink-200/40 rounded-full blur-3xl"></div>
              <div className="absolute bottom-20 left-20 w-80 h-80 bg-gradient-to-br from-orange-200/40 to-yellow-200/40 rounded-full blur-3xl"></div>
            </>
          )}
        </div>

        <div className="relative max-w-7xl mx-auto">
          {/* Hero Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center mb-8"
          >
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border shadow-lg ${
              darkMode
                ? 'bg-white/5 backdrop-blur-xl border-white/10 shadow-red-500/20'
                : 'bg-gradient-to-r from-red-100 to-pink-100 border-red-200'
            }`}>
              <Sparkles size={14} className={`${darkMode ? 'text-red-400' : 'text-red-600'} animate-pulse`} />
              <span className={`text-sm font-semibold bg-gradient-to-r ${
                darkMode ? 'from-red-400 to-pink-400' : 'from-red-600 to-pink-600'
              } bg-clip-text text-transparent`}>
                Piattaforma #1 in Italia per Customer Loyalty
              </span>
            </div>
          </motion.div>

          {/* Hero Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`text-5xl md:text-6xl lg:text-7xl font-black text-center mb-6 ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}
          >
            La Loyalty che
            <br />
            <span className="bg-gradient-to-r from-red-500 via-pink-500 to-orange-500 bg-clip-text text-transparent">
              Aumenta i Ricavi
            </span>
            <br />
            del 40% in 30 Giorni
          </motion.h1>

          {/* Hero Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`text-xl text-center max-w-3xl mx-auto mb-12 ${
              darkMode ? 'text-gray-300' : 'text-gray-600'
            }`}
          >
            OMNILY PRO è l'ecosistema completo Hardware + Software + AI che trasforma i tuoi clienti in fan fedeli.
            Lettore NFC, stampante termica, loyalty integrato. ROI garantito, setup in 24 ore.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap gap-4 justify-center mb-12"
          >
            <Link
              to="/request-demo"
              className="group flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-red-500/50 hover:shadow-2xl hover:shadow-red-500/80 hover:scale-105 transition-all duration-300"
            >
              <Rocket size={24} className="group-hover:rotate-12 transition-transform" />
              Richiedi Demo 30 Giorni
              <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/request-demo"
              className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-lg border-2 hover:scale-105 transition-all duration-300 shadow-lg ${
                darkMode
                  ? 'bg-white/5 backdrop-blur-xl text-white border-white/10 hover:bg-white/10'
                  : 'bg-white text-gray-900 border-gray-200 hover:border-gray-300'
              }`}
            >
              <BarChart3 size={20} />
              Vedi Dashboard
            </Link>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex flex-wrap gap-6 justify-center text-sm"
          >
            <div className={`flex items-center gap-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              <CheckCircle size={18} className="text-green-500" />
              <span>Nessuna carta di credito</span>
            </div>
            <div className={`flex items-center gap-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              <CheckCircle size={18} className="text-green-500" />
              <span>Setup in 24 ore</span>
            </div>
            <div className={`flex items-center gap-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              <CheckCircle size={18} className="text-green-500" />
              <span>Support 24/7</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Scroll Indicator */}
      <div className="flex justify-center pb-12">
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className={`w-6 h-10 rounded-full border-2 flex items-start justify-center p-2 ${
            darkMode ? 'border-white/20' : 'border-gray-300'
          }`}
        >
          <div className={`w-1.5 h-1.5 rounded-full ${darkMode ? 'bg-white' : 'bg-gray-600'}`}></div>
        </motion.div>
      </div>

      {/* Video Demo Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left - Video */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative group"
            >
              <div className={`relative rounded-3xl overflow-hidden border-2 ${
                darkMode ? 'border-white/10' : 'border-gray-200'
              } shadow-2xl`}>
                {/* Video Placeholder with Play Button */}
                <div className={`aspect-video relative ${
                  darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900' : 'bg-gradient-to-br from-gray-100 to-gray-200'
                }`}>
                  {/* Mockup Dashboard Screenshot */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className={`text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      <BarChart3 size={80} className="mx-auto mb-4 opacity-50" />
                      <p className="text-sm font-medium">Dashboard Demo Preview</p>
                    </div>
                  </div>

                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors cursor-pointer">
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      className="w-20 h-20 rounded-full bg-gradient-to-r from-red-600 to-pink-600 flex items-center justify-center shadow-2xl shadow-red-500/50"
                    >
                      <Play size={32} className="text-white ml-1" fill="white" />
                    </motion.div>
                  </div>
                </div>

                {/* Decorative Elements */}
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-red-500/20 to-pink-500/20 rounded-full blur-2xl"></div>
                <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-br from-orange-500/20 to-yellow-500/20 rounded-full blur-2xl"></div>
              </div>

              {/* Stats Badges */}
              <div className="flex gap-4 mt-6">
                <div className={`flex-1 p-4 rounded-xl border ${
                  darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-lg'
                }`}>
                  <div className="text-2xl font-black bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">
                    2 min
                  </div>
                  <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Setup Time</div>
                </div>
                <div className={`flex-1 p-4 rounded-xl border ${
                  darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-lg'
                }`}>
                  <div className="text-2xl font-black bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
                    0 code
                  </div>
                  <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Required</div>
                </div>
              </div>
            </motion.div>

            {/* Right - Content */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border mb-6 ${
                darkMode
                  ? 'bg-white/5 border-white/10'
                  : 'bg-gradient-to-r from-red-100 to-pink-100 border-red-200'
              }`}>
                <Video size={16} className={darkMode ? 'text-red-400' : 'text-red-600'} />
                <span className={`text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Vedi in Azione
                </span>
              </div>

              <h2 className={`text-4xl md:text-5xl font-black mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Potenza Enterprise,
                <br />
                <span className="bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent">
                  Semplicità No-Code
                </span>
              </h2>

              <p className={`text-xl mb-8 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Dashboard intuitiva, hardware plug & play, AI che lavora per te. Nessuna competenza tecnica richiesta.
              </p>

              {/* Feature List */}
              <div className="space-y-4 mb-8">
                {[
                  { icon: Zap, text: 'Setup guidato in 15 minuti con wizard intelligente' },
                  { icon: Smartphone, text: 'App clienti white-label generata automaticamente' },
                  { icon: BarChart3, text: 'Analytics real-time con AI predittiva integrata' },
                  { icon: Shield, text: 'GDPR compliant e sicurezza enterprise-grade' }
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-start gap-3"
                  >
                    <div className={`p-2 rounded-lg ${
                      darkMode ? 'bg-red-500/10' : 'bg-red-50'
                    }`}>
                      <item.icon size={20} className={darkMode ? 'text-red-400' : 'text-red-600'} />
                    </div>
                    <p className={`flex-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {item.text}
                    </p>
                  </motion.div>
                ))}
              </div>

              {/* CTA */}
              <Link
                to="/request-demo"
                className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-2xl font-bold shadow-xl shadow-red-500/50 hover:shadow-2xl hover:shadow-red-500/80 hover:scale-105 transition-all duration-300"
              >
                <Play size={20} />
                Guarda la Demo Completa
                <ArrowRight size={20} />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-6" id="stats">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className={`text-center p-8 rounded-3xl border backdrop-blur-xl ${
                darkMode
                  ? 'bg-white/5 border-white/10'
                  : 'bg-white border-gray-200 shadow-lg'
              }`}
            >
              <div className="text-4xl md:text-5xl font-black bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent mb-2">
                {counters.companies}+
              </div>
              <div className={`font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Partner
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className={`text-center p-8 rounded-3xl border backdrop-blur-xl ${
                darkMode
                  ? 'bg-white/5 border-white/10'
                  : 'bg-white border-gray-200 shadow-lg'
              }`}
            >
              <div className="text-4xl md:text-5xl font-black bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent mb-2">
                {(counters.transactions / 1000).toFixed(0)}K+
              </div>
              <div className={`font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Transazioni
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className={`text-center p-8 rounded-3xl border backdrop-blur-xl ${
                darkMode
                  ? 'bg-white/5 border-white/10'
                  : 'bg-white border-gray-200 shadow-lg'
              }`}
            >
              <div className="text-4xl md:text-5xl font-black bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent mb-2">
                {counters.retention}%
              </div>
              <div className={`font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Retention
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className={`text-center p-8 rounded-3xl border backdrop-blur-xl ${
                darkMode
                  ? 'bg-white/5 border-white/10'
                  : 'bg-white border-gray-200 shadow-lg'
              }`}
            >
              <div className="text-4xl md:text-5xl font-black bg-gradient-to-r from-orange-500 to-yellow-500 bg-clip-text text-transparent mb-2">
                99.9%
              </div>
              <div className={`font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Uptime
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Logos Section - Social Proof */}
      <section className="py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <p className={`text-center text-sm font-semibold mb-8 ${
            darkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Si fidano di noi
          </p>
          <div className="flex flex-wrap justify-center gap-8 items-center opacity-60">
            {['RetailMax', 'Fashion Group', 'BeautyChain', 'TechService', 'GourmetItalia', 'WellnessPro'].map((name, i) => (
              <div
                key={i}
                className={`text-lg font-bold ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}
              >
                {name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border mb-4 ${
              darkMode
                ? 'bg-white/5 border-white/10'
                : 'bg-gradient-to-r from-red-100 to-pink-100 border-red-200'
            }`}>
              <Rocket size={16} className={darkMode ? 'text-red-400' : 'text-red-600'} />
              <span className={`text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Semplice e Veloce
              </span>
            </div>
            <h2 className={`text-4xl md:text-5xl font-black mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Come Funziona OMNILY PRO
            </h2>
            <p className={`text-xl ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Dalla registrazione al primo cliente fidelizzato in meno di 24 ore
            </p>
          </div>

          {/* Steps Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { num: 1, icon: Rocket, title: 'Registrati in 2 Minuti', desc: 'Crea il tuo account gratuito, nessuna carta di credito richiesta. Accesso immediato a tutte le funzionalità PRO per 30 giorni.', time: '2 minuti' },
              { num: 2, icon: Building2, title: 'Configura il Tuo Brand', desc: 'Wizard guidato per impostare logo, colori, programma punti e livelli fedeltà. Il nostro team ti supporta nell\'onboarding completo.', time: '15 minuti' },
              { num: 3, icon: Zap, title: 'Lancia e Inizia', desc: 'Attiva il sistema, integra con il tuo e-commerce, stampa le prime tessere NFC e inizia a raccogliere dati clienti subito.', time: '1 ora' },
              { num: 4, icon: BarChart3, title: 'Analizza e Ottimizza', desc: 'Dashboard real-time con AI per segmentazione automatica, campagne personalizzate e analytics predittive. ROI visibile dalla prima settimana.', time: 'Continuo' }
            ].map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`relative p-8 rounded-3xl border ${
                  darkMode
                    ? 'bg-white/5 border-white/10 hover:bg-white/10'
                    : 'bg-white border-gray-200 hover:shadow-xl'
                } transition-all duration-300`}
              >
                <div className={`absolute -top-4 -left-4 w-12 h-12 rounded-full flex items-center justify-center font-black text-xl ${
                  darkMode ? 'bg-red-500 text-white' : 'bg-gradient-to-r from-red-500 to-pink-500 text-white'
                } shadow-lg`}>
                  {step.num}
                </div>
                <step.icon size={48} className={`mb-4 ${darkMode ? 'text-red-400' : 'text-red-600'}`} />
                <h3 className={`text-xl font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {step.title}
                </h3>
                <p className={`mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {step.desc}
                </p>
                <div className={`flex items-center gap-2 text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                  <Clock size={16} />
                  <span>{step.time}</span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center mt-12">
            <Link
              to="/request-demo"
              className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-red-500/50 hover:shadow-2xl hover:shadow-red-500/80 hover:scale-105 transition-all duration-300"
            >
              <Rocket size={20} />
              Inizia Ora Gratis
              <ArrowRight size={20} />
            </Link>
            <p className={`mt-4 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Setup completo in meno di 24 ore • Nessun rischio
            </p>
          </div>
        </div>
      </section>

      {/* Industry Tabs */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className={`text-4xl md:text-5xl font-black mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Risultati Reali per Ogni Settore
            </h2>
            <p className={`text-xl ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Casi d'uso e ROI dimostrati per la tua industry
            </p>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {industries.map(industry => (
              <button
                key={industry.id}
                onClick={() => setActiveTab(industry.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  activeTab === industry.id
                    ? 'bg-gradient-to-r from-red-600 to-pink-600 text-white shadow-lg shadow-red-500/50 scale-105'
                    : darkMode
                    ? 'bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10'
                    : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300'
                }`}
              >
                <industry.icon size={20} />
                {industry.name}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {industries.filter(i => i.id === activeTab).map(industry => (
              <>
                <motion.div
                  key="revenue"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`p-8 rounded-3xl border text-center ${
                    darkMode
                      ? 'bg-white/5 border-white/10'
                      : 'bg-white border-gray-200 shadow-lg'
                  }`}
                >
                  <TrendingUp size={48} className="mx-auto mb-4 text-green-500" />
                  <div className="text-5xl font-black bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent mb-2">
                    {industry.revenue}
                  </div>
                  <div className={`font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Revenue Growth
                  </div>
                </motion.div>

                <motion.div
                  key="customers"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 }}
                  className={`p-8 rounded-3xl border text-center ${
                    darkMode
                      ? 'bg-white/5 border-white/10'
                      : 'bg-white border-gray-200 shadow-lg'
                  }`}
                >
                  <Users size={48} className="mx-auto mb-4 text-blue-500" />
                  <div className="text-5xl font-black bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent mb-2">
                    {industry.customers}
                  </div>
                  <div className={`font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Clienti Gestiti
                  </div>
                </motion.div>

                <motion.div
                  key="satisfaction"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className={`p-8 rounded-3xl border text-center ${
                    darkMode
                      ? 'bg-white/5 border-white/10'
                      : 'bg-white border-gray-200 shadow-lg'
                  }`}
                >
                  <Award size={48} className="mx-auto mb-4 text-purple-500" />
                  <div className="text-5xl font-black bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent mb-2">
                    87%
                  </div>
                  <div className={`font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Customer Satisfaction
                  </div>
                </motion.div>
              </>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border mb-4 ${
              darkMode
                ? 'bg-white/5 border-white/10'
                : 'bg-gradient-to-r from-red-100 to-pink-100 border-red-200'
            }`}>
              <Award size={16} className={darkMode ? 'text-red-400' : 'text-red-600'} />
              <span className={`text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Confronta
              </span>
            </div>
            <h2 className={`text-4xl md:text-5xl font-black mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Perché Scegliere <span className="bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent">OMNILY PRO</span>
            </h2>
            <p className={`text-xl ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              L'unica piattaforma completa Hardware + Software + AI sul mercato italiano
            </p>
          </div>

          {/* Comparison Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="overflow-x-auto"
          >
            <table className={`w-full border-collapse rounded-3xl overflow-hidden ${
              darkMode ? 'bg-white/5' : 'bg-white'
            }`}>
              <thead>
                <tr className={darkMode ? 'bg-white/10' : 'bg-gray-50'}>
                  <th className={`p-6 text-left font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Caratteristica
                  </th>
                  <th className={`p-6 text-center ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    <div className="flex flex-col items-center">
                      <div className="text-2xl font-black bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent mb-2">
                        OMNILY PRO
                      </div>
                      <div className={`text-xs font-normal ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Soluzione Completa
                      </div>
                    </div>
                  </th>
                  <th className={`p-6 text-center font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Altri Software
                    <div className="text-xs font-normal mt-1">(Solo digitale)</div>
                  </th>
                  <th className={`p-6 text-center font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Soluz. Tradizionali
                    <div className="text-xs font-normal mt-1">(Cartacee)</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: 'Hardware NFC Incluso', omnily: true, software: false, traditional: false },
                  { feature: 'Stampante Termica 80mm', omnily: true, software: false, traditional: false },
                  { feature: 'App Cliente White-Label', omnily: true, software: true, traditional: false },
                  { feature: 'Dashboard Analytics AI', omnily: true, software: 'Limitato', traditional: false },
                  { feature: 'Email + SMS + WhatsApp Automation', omnily: true, software: 'Parziale', traditional: false },
                  { feature: 'Multi-Location Support', omnily: true, software: true, traditional: false },
                  { feature: 'Setup in 24 ore', omnily: true, software: false, traditional: false },
                  { feature: 'GDPR Compliant Automatico', omnily: true, software: true, traditional: false },
                  { feature: 'API REST Complete', omnily: true, software: 'Limitato', traditional: false },
                  { feature: 'Support 24/7 (Pro/Enterprise)', omnily: true, software: 'Email', traditional: false },
                  { feature: 'Costo Setup One-Time', omnily: '€299', software: '€800+', traditional: '€0' },
                  { feature: 'Costo Mensile (da)', omnily: '€49', software: '€79', traditional: '€20' }
                ].map((row, i) => (
                  <tr
                    key={i}
                    className={`border-t ${darkMode ? 'border-white/10' : 'border-gray-200'}`}
                  >
                    <td className={`p-6 font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {row.feature}
                    </td>
                    <td className="p-6 text-center">
                      {typeof row.omnily === 'boolean' ? (
                        row.omnily ? (
                          <Check size={24} className="mx-auto text-green-500" />
                        ) : (
                          <X size={24} className="mx-auto text-red-500" />
                        )
                      ) : (
                        <span className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {row.omnily}
                        </span>
                      )}
                    </td>
                    <td className="p-6 text-center">
                      {typeof row.software === 'boolean' ? (
                        row.software ? (
                          <Check size={24} className="mx-auto text-green-500" />
                        ) : (
                          <X size={24} className="mx-auto text-red-500" />
                        )
                      ) : (
                        <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {row.software}
                        </span>
                      )}
                    </td>
                    <td className="p-6 text-center">
                      {typeof row.traditional === 'boolean' ? (
                        row.traditional ? (
                          <Check size={24} className="mx-auto text-green-500" />
                        ) : (
                          <X size={24} className="mx-auto text-red-500" />
                        )
                      ) : (
                        <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {row.traditional}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>

          {/* CTA */}
          <div className="text-center mt-12">
            <Link
              to="/request-demo"
              className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-red-500/50 hover:shadow-2xl hover:shadow-red-500/80 hover:scale-105 transition-all duration-300"
            >
              <Award size={20} />
              Prova Gratis 30 Giorni
              <ArrowRight size={20} />
            </Link>
            <p className={`mt-4 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Accesso completo a tutte le funzionalità • Nessuna carta richiesta
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6" id="features">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border mb-4 ${
              darkMode
                ? 'bg-white/5 border-white/10'
                : 'bg-gradient-to-r from-red-100 to-pink-100 border-red-200'
            }`}>
              <Target size={16} className={darkMode ? 'text-red-400' : 'text-red-600'} />
              <span className={`text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Tutto quello che serve
              </span>
            </div>
            <h2 className={`text-4xl md:text-5xl font-black mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Funzionalità <span className="bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent">Enterprise</span>
            </h2>
            <p className={`text-xl ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Piattaforma completa per gestire ogni aspetto della customer loyalty
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: Building2, title: 'Multi-Tenant Architecture', desc: 'Gestisci infinite organizzazioni da un\'unica dashboard. Perfetto per franchising, catene retail e gruppi aziendali.', color: 'red' },
              { icon: BarChart3, title: 'AI-Powered Predictive Analytics', desc: 'Machine learning per prevedere comportamenti, ottimizzare campagne e aumentare il lifetime value dei clienti.', color: 'blue' },
              { icon: MessageSquare, title: 'Marketing Automations', desc: 'Email, SMS, WhatsApp e push notifications automatiche basate su trigger comportamentali e segmentazione avanzata.', color: 'purple' },
              { icon: Smartphone, title: 'Integrated Hardware Ecosystem (Z108)', desc: 'Lettore NFC professionale, stampante termica 80mm, display cliente. Hardware certificato e plug & play.', color: 'green' },
              { icon: Shield, title: 'Enterprise Security (GDPR, ISO 27001)', desc: 'Crittografia end-to-end, server EU, backup automatici, audit log completo e conformità totale normative privacy.', color: 'orange' },
              { icon: RefreshCw, title: 'Native Integrations', desc: 'API REST, webhook real-time, integrazioni Shopify, WooCommerce, Stripe, Mailchimp e 50+ servizi enterprise.', color: 'pink' }
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`group p-8 rounded-3xl border hover:scale-105 transition-all duration-500 ${
                  darkMode
                    ? 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                    : 'bg-white border-gray-200 hover:shadow-2xl'
                }`}
              >
                <feature.icon size={48} className={`mb-4 text-${feature.color}-500 group-hover:scale-110 group-hover:rotate-12 transition-transform`} />
                <h3 className={`text-xl font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {feature.title}
                </h3>
                <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Integration Partners Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border mb-4 ${
              darkMode
                ? 'bg-white/5 border-white/10'
                : 'bg-gradient-to-r from-red-100 to-pink-100 border-red-200'
            }`}>
              <RefreshCw size={16} className={darkMode ? 'text-red-400' : 'text-red-600'} />
              <span className={`text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Ecosystem Completo
              </span>
            </div>
            <h2 className={`text-4xl md:text-5xl font-black mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Integrazioni <span className="bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent">Native</span>
            </h2>
            <p className={`text-xl ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Connettiti con gli strumenti che già usi. API REST complete e webhook real-time.
            </p>
          </div>

          {/* Integration Categories */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {[
              {
                category: 'E-Commerce',
                icon: ShoppingCart,
                color: 'blue',
                integrations: ['Shopify', 'WooCommerce', 'Magento', 'PrestaShop']
              },
              {
                category: 'Payments',
                icon: Wallet,
                color: 'green',
                integrations: ['Stripe', 'PayPal', 'Square', 'SumUp']
              },
              {
                category: 'Marketing',
                icon: MessageSquare,
                color: 'purple',
                integrations: ['Mailchimp', 'SendGrid', 'Twilio', 'WhatsApp']
              }
            ].map((cat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`p-8 rounded-3xl border ${
                  darkMode
                    ? 'bg-white/5 border-white/10 hover:bg-white/10'
                    : 'bg-white border-gray-200 hover:shadow-xl'
                } transition-all duration-300`}
              >
                <cat.icon size={40} className={`mb-4 text-${cat.color}-500`} />
                <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {cat.category}
                </h3>
                <div className="space-y-2">
                  {cat.integrations.map((name, j) => (
                    <div
                      key={j}
                      className={`flex items-center gap-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}
                    >
                      <CheckCircle size={16} className="text-green-500" />
                      <span>{name}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>

          {/* API Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className={`p-8 md:p-12 rounded-3xl border ${
              darkMode
                ? 'bg-gradient-to-br from-white/5 to-white/10 border-white/10'
                : 'bg-gradient-to-br from-gray-50 to-white border-gray-200'
            }`}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-3 rounded-xl ${darkMode ? 'bg-red-500/10' : 'bg-red-50'}`}>
                    <Code size={32} className={darkMode ? 'text-red-400' : 'text-red-600'} />
                  </div>
                  <h3 className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    API REST Completa
                  </h3>
                </div>
                <p className={`text-lg mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Costruisci integrazioni personalizzate con la nostra API RESTful documentata.
                  Webhook real-time, autenticazione OAuth 2.0, rate limiting enterprise.
                </p>
                <div className="space-y-3">
                  {[
                    'Documentazione completa con esempi',
                    'SDK ufficiali (JavaScript, Python, PHP)',
                    'Sandbox per testing gratuito',
                    'Support dedicato per sviluppatori'
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Check size={20} className="text-green-500" />
                      <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Code Example */}
              <div className={`p-6 rounded-2xl font-mono text-sm ${
                darkMode ? 'bg-gray-900 border border-white/10' : 'bg-gray-900'
              }`}>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="ml-auto text-gray-500 text-xs">API Example</span>
                </div>
                <div className="text-gray-300 space-y-1">
                  <div><span className="text-purple-400">POST</span> <span className="text-cyan-400">/api/v1/customers</span></div>
                  <div className="text-gray-500">{`{`}</div>
                  <div className="pl-4">
                    <span className="text-blue-400">"email"</span>: <span className="text-green-400">"customer@example.com"</span>,
                  </div>
                  <div className="pl-4">
                    <span className="text-blue-400">"points"</span>: <span className="text-orange-400">100</span>,
                  </div>
                  <div className="pl-4">
                    <span className="text-blue-400">"tier"</span>: <span className="text-green-400">"gold"</span>
                  </div>
                  <div className="text-gray-500">{`}`}</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ROI Calculator Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border mb-4 ${
              darkMode
                ? 'bg-white/5 border-white/10'
                : 'bg-gradient-to-r from-red-100 to-pink-100 border-red-200'
            }`}>
              <Calculator size={16} className={darkMode ? 'text-red-400' : 'text-red-600'} />
              <span className={`text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Calcola il Tuo ROI
              </span>
            </div>
            <h2 className={`text-4xl md:text-5xl font-black mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Quanto Potresti <span className="bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent">Guadagnare?</span>
            </h2>
            <p className={`text-xl ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Scopri il potenziale di crescita con OMNILY PRO per la tua azienda
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className={`p-8 md:p-12 rounded-3xl border ${
              darkMode
                ? 'bg-white/5 border-white/10'
                : 'bg-white border-gray-200 shadow-2xl'
            }`}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {/* Left - Input */}
              <div>
                <h3 className={`text-xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  I Tuoi Dati
                </h3>
                <div className="space-y-6">
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Clienti Mensili
                    </label>
                    <input
                      type="number"
                      defaultValue="500"
                      className={`w-full px-4 py-3 rounded-xl border text-lg ${
                        darkMode
                          ? 'bg-white/5 border-white/10 text-white'
                          : 'bg-white border-gray-200 text-gray-900'
                      } outline-none focus:border-red-500`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Scontrino Medio (€)
                    </label>
                    <input
                      type="number"
                      defaultValue="35"
                      className={`w-full px-4 py-3 rounded-xl border text-lg ${
                        darkMode
                          ? 'bg-white/5 border-white/10 text-white'
                          : 'bg-white border-gray-200 text-gray-900'
                      } outline-none focus:border-red-500`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Frequenza Acquisto/Anno
                    </label>
                    <input
                      type="number"
                      defaultValue="4"
                      className={`w-full px-4 py-3 rounded-xl border text-lg ${
                        darkMode
                          ? 'bg-white/5 border-white/10 text-white'
                          : 'bg-white border-gray-200 text-gray-900'
                      } outline-none focus:border-red-500`}
                    />
                  </div>
                </div>
              </div>

              {/* Right - Results */}
              <div>
                <h3 className={`text-xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Con OMNILY PRO
                </h3>
                <div className="space-y-4">
                  <div className={`p-6 rounded-2xl ${
                    darkMode ? 'bg-green-500/10 border border-green-500/20' : 'bg-green-50 border border-green-200'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Revenue Annuale Aggiuntivo
                      </span>
                      <TrendingUp size={20} className="text-green-500" />
                    </div>
                    <div className="text-4xl font-black text-green-500">
                      €29.400
                    </div>
                    <div className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      +42% vs baseline
                    </div>
                  </div>

                  <div className={`p-6 rounded-2xl ${
                    darkMode ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-blue-50 border border-blue-200'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Clienti Fedeli in Più
                      </span>
                      <Users size={20} className="text-blue-500" />
                    </div>
                    <div className="text-4xl font-black text-blue-500">
                      +225
                    </div>
                    <div className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Retention rate 45%
                    </div>
                  </div>

                  <div className={`p-6 rounded-2xl ${
                    darkMode ? 'bg-purple-500/10 border border-purple-500/20' : 'bg-purple-50 border border-purple-200'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        ROI Primo Anno
                      </span>
                      <Gauge size={20} className="text-purple-500" />
                    </div>
                    <div className="text-4xl font-black text-purple-500">
                      2.450%
                    </div>
                    <div className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Payback in 2 settimane
                    </div>
                  </div>
                </div>

                <Link
                  to="/request-demo"
                  className="mt-6 w-full flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-2xl font-bold shadow-xl shadow-red-500/50 hover:shadow-2xl hover:shadow-red-500/80 hover:scale-105 transition-all duration-300"
                >
                  <Rocket size={20} />
                  Richiedi Demo Oggi
                  <ArrowRight size={20} />
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-6" id="pricing">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className={`text-4xl md:text-5xl font-black mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Prezzi <span className="bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent">Semplici e Chiari</span>
            </h2>
            <p className={`text-xl ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Nessun costo nascosto. Cancella quando vuoi.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: 'Basic', price: '€49', period: '/mese', customers: '500', features: ['Dashboard completa', 'App Clienti branded', 'Email automations', 'Hardware Z108 incluso', 'Support via email'], popular: false },
              { name: 'Pro', price: '€99', period: '/mese', customers: '2.000', features: ['Tutto di Basic +', 'AI Analytics', 'SMS + WhatsApp', 'Multi-location', 'Priority support 24/7', 'Integrazioni avanzate'], popular: true },
              { name: 'Enterprise', price: '€199', period: '/mese', customers: 'Illimitati', features: ['Tutto di Pro +', 'White-label completo', 'API personalizzate', 'Dedicated account manager', 'SLA 99.9%', 'Custom onboarding'], popular: false }
            ].map((plan, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`relative p-8 rounded-3xl border ${
                  plan.popular
                    ? 'border-red-500 scale-105 shadow-2xl shadow-red-500/30'
                    : darkMode
                    ? 'border-white/10'
                    : 'border-gray-200'
                } ${
                  darkMode ? 'bg-white/5' : 'bg-white'
                } hover:scale-110 transition-all duration-500`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-red-600 to-pink-600 text-white text-sm font-bold rounded-full">
                    Più Popolare
                  </div>
                )}
                <h3 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {plan.name}
                </h3>
                <div className="mb-6">
                  <span className={`text-5xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {plan.price}
                  </span>
                  <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                    {plan.period}
                  </span>
                </div>
                <div className={`text-sm mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Fino a {plan.customers} clienti
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, j) => (
                    <li key={j} className={`flex items-start gap-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      <Check size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/request-demo"
                  className={`block text-center px-6 py-3 rounded-xl font-bold transition-all duration-300 ${
                    plan.popular
                      ? 'bg-gradient-to-r from-red-600 to-pink-600 text-white shadow-lg shadow-red-500/50 hover:shadow-xl hover:scale-105'
                      : darkMode
                      ? 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  Richiedi Demo
                </Link>
                <p className={`text-xs text-center mt-4 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                  + €299 setup one-time
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-6" id="testimonials">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className={`text-4xl md:text-5xl font-black mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Cosa Dicono i Nostri Clienti
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: 'Marco Rossi', role: 'CEO, RetailMax', text: 'OMNILY PRO ha triplicato il nostro tasso di retention in soli 3 mesi. ROI incredibile!', rating: 5, metric: '+187% revenue' },
              { name: 'Laura Bianchi', role: 'Owner, BeautyChain', text: 'Setup velocissimo, supporto fantastico. I nostri clienti adorano l\'app personalizzata!', rating: 5, metric: '92% satisfaction' },
              { name: 'Giuseppe Verdi', role: 'Director, GourmetItalia', text: 'Finalmente una piattaforma che fa tutto. Hardware + software perfettamente integrati.', rating: 5, metric: '+€45K/mese' }
            ].map((testimonial, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`p-8 rounded-3xl border ${
                  darkMode
                    ? 'bg-white/5 border-white/10'
                    : 'bg-white border-gray-200 shadow-lg'
                }`}
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, j) => (
                    <Star key={j} size={20} className="text-yellow-500 fill-yellow-500" />
                  ))}
                </div>
                <p className={`mb-6 text-lg italic ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  "{testimonial.text}"
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <div className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {testimonial.name}
                    </div>
                    <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {testimonial.role}
                    </div>
                  </div>
                  <div className="px-3 py-1 bg-green-500/20 text-green-500 rounded-full text-sm font-bold">
                    {testimonial.metric}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-6" id="faq">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className={`text-4xl md:text-5xl font-black mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Domande Frequenti
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className={`rounded-2xl border overflow-hidden ${
                  darkMode
                    ? 'bg-white/5 border-white/10'
                    : 'bg-white border-gray-200'
                }`}
              >
                <button
                  onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                  className={`w-full px-6 py-4 flex items-center justify-between text-left ${
                    darkMode ? 'hover:bg-white/5' : 'hover:bg-gray-50'
                  } transition-colors`}
                >
                  <span className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {faq.q}
                  </span>
                  <ChevronDown
                    size={24}
                    className={`transition-transform ${faqOpen === i ? 'rotate-180' : ''} ${
                      darkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}
                  />
                </button>
                {faqOpen === i && (
                  <div className={`px-6 pb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {faq.a}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-20 px-6" id="contact">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Left Side - Info */}
            <div>
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border mb-6 ${
                darkMode
                  ? 'bg-white/5 border-white/10'
                  : 'bg-gradient-to-r from-red-100 to-pink-100 border-red-200'
              }`}>
                <Mail size={16} className={darkMode ? 'text-red-400' : 'text-red-600'} />
                <span className={`text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Contattaci
                </span>
              </div>
              <h2 className={`text-4xl md:text-5xl font-black mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Hai Domande?
                <br />
                <span className="bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent">
                  Parliamone!
                </span>
              </h2>
              <p className={`text-xl mb-8 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Il nostro team è pronto ad aiutarti a scegliere il piano migliore per la tua azienda e rispondere a tutte le tue domande.
              </p>

              {/* Contact Info */}
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl ${
                    darkMode ? 'bg-white/5' : 'bg-red-50'
                  }`}>
                    <Mail size={24} className={darkMode ? 'text-red-400' : 'text-red-600'} />
                  </div>
                  <div>
                    <div className={`font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      Email
                    </div>
                    <a href="mailto:info@omnilypro.com" className={`${darkMode ? 'text-gray-400 hover:text-red-400' : 'text-gray-600 hover:text-red-600'} transition-colors`}>
                      info@omnilypro.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl ${
                    darkMode ? 'bg-white/5' : 'bg-red-50'
                  }`}>
                    <Phone size={24} className={darkMode ? 'text-red-400' : 'text-red-600'} />
                  </div>
                  <div>
                    <div className={`font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      Telefono
                    </div>
                    <a href="tel:+390123456789" className={`${darkMode ? 'text-gray-400 hover:text-red-400' : 'text-gray-600 hover:text-red-600'} transition-colors`}>
                      +39 012 345 6789
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl ${
                    darkMode ? 'bg-white/5' : 'bg-red-50'
                  }`}>
                    <Clock size={24} className={darkMode ? 'text-red-400' : 'text-red-600'} />
                  </div>
                  <div>
                    <div className={`font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      Orari
                    </div>
                    <div className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                      Lun-Ven: 9:00 - 18:00
                      <br />
                      Support 24/7 per clienti Pro/Enterprise
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Form */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className={`p-8 rounded-3xl border ${
                darkMode
                  ? 'bg-white/5 border-white/10'
                  : 'bg-white border-gray-200 shadow-xl'
              }`}
            >
              <form className="space-y-6">
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Mario Rossi"
                    className={`w-full px-4 py-3 rounded-xl border transition-all ${
                      darkMode
                        ? 'bg-white/5 border-white/10 text-white placeholder-gray-500 focus:border-red-500 focus:bg-white/10'
                        : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                    } outline-none`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Email Aziendale *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="mario.rossi@azienda.it"
                    className={`w-full px-4 py-3 rounded-xl border transition-all ${
                      darkMode
                        ? 'bg-white/5 border-white/10 text-white placeholder-gray-500 focus:border-red-500 focus:bg-white/10'
                        : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                    } outline-none`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Telefono
                  </label>
                  <input
                    type="tel"
                    placeholder="+39 012 345 6789"
                    className={`w-full px-4 py-3 rounded-xl border transition-all ${
                      darkMode
                        ? 'bg-white/5 border-white/10 text-white placeholder-gray-500 focus:border-red-500 focus:bg-white/10'
                        : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                    } outline-none`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Azienda
                  </label>
                  <input
                    type="text"
                    placeholder="Nome della tua azienda"
                    className={`w-full px-4 py-3 rounded-xl border transition-all ${
                      darkMode
                        ? 'bg-white/5 border-white/10 text-white placeholder-gray-500 focus:border-red-500 focus:bg-white/10'
                        : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                    } outline-none`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Messaggio *
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Raccontaci di cosa hai bisogno..."
                    className={`w-full px-4 py-3 rounded-xl border transition-all resize-none ${
                      darkMode
                        ? 'bg-white/5 border-white/10 text-white placeholder-gray-500 focus:border-red-500 focus:bg-white/10'
                        : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                    } outline-none`}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-xl font-bold shadow-xl shadow-red-500/50 hover:shadow-2xl hover:shadow-red-500/80 hover:scale-105 transition-all duration-300"
                >
                  <Mail size={20} />
                  Invia Messaggio
                  <ArrowRight size={20} />
                </button>

                <p className={`text-xs text-center ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                  Rispondiamo entro 24 ore lavorative
                </p>
              </form>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className={`relative overflow-hidden p-12 rounded-3xl text-center ${
              darkMode
                ? 'bg-gradient-to-br from-red-600/20 to-pink-600/20 border border-red-500/30'
                : 'bg-gradient-to-br from-red-50 to-pink-50 border border-red-200'
            }`}
          >
            <div className="relative z-10">
              <h2 className={`text-4xl md:text-5xl font-black mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Pronto a Trasformare la Tua Customer Loyalty?
              </h2>
              <p className={`text-xl mb-8 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Unisciti a 200+ aziende che hanno scelto OMNILY PRO
              </p>
              <Link
                to="/request-demo"
                className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-red-500/50 hover:shadow-2xl hover:shadow-red-500/80 hover:scale-105 transition-all duration-300"
              >
                <Rocket size={24} />
                Richiedi Demo 30 Giorni
                <ArrowRight size={24} />
              </Link>
              <p className={`mt-4 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Nessuna carta di credito richiesta • Setup in 24 ore
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`py-12 px-6 border-t ${
        darkMode ? 'border-white/10 bg-gray-900/50' : 'border-gray-200 bg-gray-50'
      }`}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className={`font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Prodotto
              </h3>
              <ul className="space-y-2">
                {['Funzionalità', 'Pricing', 'Integrazioni', 'API'].map(item => (
                  <li key={item}>
                    <a href="#" className={`${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-red-600'} transition-colors`}>
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className={`font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Supporto
              </h3>
              <ul className="space-y-2">
                {['Documentazione', 'Guide', 'FAQ', 'Contattaci'].map(item => (
                  <li key={item}>
                    <a href="#" className={`${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-red-600'} transition-colors`}>
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className={`font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Azienda
              </h3>
              <ul className="space-y-2">
                {['Chi siamo', 'Blog', 'Carriere', 'Partner'].map(item => (
                  <li key={item}>
                    <a href="#" className={`${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-red-600'} transition-colors`}>
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className={`font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Legale
              </h3>
              <ul className="space-y-2">
                {['Privacy', 'Termini', 'Cookie', 'GDPR'].map(item => (
                  <li key={item}>
                    <a href="#" className={`${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-red-600'} transition-colors`}>
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className={`pt-8 border-t ${darkMode ? 'border-white/10' : 'border-gray-200'}`}>
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                © 2025 OMNILY PRO. Tutti i diritti riservati.
              </p>
              <div className="flex gap-4">
                {[Mail, Phone, Globe].map((Icon, i) => (
                  <a
                    key={i}
                    href="#"
                    className={`p-2 rounded-lg ${
                      darkMode
                        ? 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                    } transition-all`}
                  >
                    <Icon size={20} />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Landing
