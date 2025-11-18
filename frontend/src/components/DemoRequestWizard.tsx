import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Building2, Globe, Users, Target, Calendar, DollarSign,
  User, Mail, Phone, Briefcase, ArrowRight, ArrowLeft,
  CheckCircle2, Moon, Sun, Store, BarChart3, Gift, Smartphone,
  TrendingUp, X
} from 'lucide-react'
import { SparklesCore } from '@/components/UI/sparkles'
import { demoRequestsApi } from '@/services/demoRequestService'
import { sendDemoRequestNotification, sendDemoConfirmationEmail } from '@/services/emailNotificationService'

interface DemoRequestData {
  // Step 1: Azienda
  companyName: string
  website: string
  industry: string
  employeesCount: string

  // Step 2: Punti Vendita
  locationsCount: string
  locationsCities: string
  existingPOS: string
  existingPOSName: string

  // Step 3: Programma Fedeltà
  hasLoyaltyProgram: string
  currentCustomerManagement: string
  activeCustomersCount: string

  // Step 4: Obiettivi
  goals: string[]

  // Step 5: Budget e Tempistiche
  timeline: string
  budgetRange: string

  // Step 6: Contatti
  contactName: string
  contactEmail: string
  contactPhone: string
  contactRole: string
}

const DemoRequestWizard: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<DemoRequestData>({
    companyName: '',
    website: '',
    industry: '',
    employeesCount: '',
    locationsCount: '',
    locationsCities: '',
    existingPOS: '',
    existingPOSName: '',
    hasLoyaltyProgram: '',
    currentCustomerManagement: '',
    activeCustomersCount: '',
    goals: [],
    timeline: '',
    budgetRange: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    contactRole: ''
  })
  const [isSubmitted, setIsSubmitted] = useState(false)

  // Dark mode state - sincronizzato con landing/login page
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('omnily_landing_theme')
      return saved === 'dark'
    }
    return false
  })

  useEffect(() => {
    localStorage.setItem('omnily_landing_theme', darkMode ? 'dark' : 'light')
  }, [darkMode])

  const toggleDarkMode = () => setDarkMode(!darkMode)

  const steps = [
    { number: 1, title: 'Informazioni Azienda', icon: Building2 },
    { number: 2, title: 'Punti Vendita', icon: Store },
    { number: 3, title: 'Gestione Clienti', icon: Users },
    { number: 4, title: 'Obiettivi', icon: Target },
    { number: 5, title: 'Timeline & Budget', icon: Calendar },
    { number: 6, title: 'Contatti', icon: User },
    { number: 7, title: 'Conferma', icon: CheckCircle2 }
  ]

  const industries = [
    'Ristorazione & Bar',
    'Retail & Negozi',
    'Beauty & Wellness',
    'Fitness & Sport',
    'Hotel & Hospitality',
    'Automotive',
    'Servizi Professionali',
    'Altro'
  ]

  const goalOptions = [
    { value: 'retention', label: 'Aumentare clienti ricorrenti', icon: TrendingUp },
    { value: 'gamification', label: 'Gamification e sfide', icon: Gift },
    { value: 'branded-app', label: 'App branded personalizzata', icon: Smartphone },
    { value: 'multi-location', label: 'Gestione multi-sede', icon: Store },
    { value: 'analytics', label: 'Analytics avanzate', icon: BarChart3 },
    { value: 'automation', label: 'Automazione marketing', icon: Target }
  ]

  const handleInputChange = (field: keyof DemoRequestData, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const toggleGoal = (goal: string) => {
    setFormData(prev => ({
      ...prev,
      goals: prev.goals.includes(goal)
        ? prev.goals.filter(g => g !== goal)
        : [...prev.goals, goal]
    }))
  }

  const handleNext = () => {
    if (currentStep < 7) {
      setCurrentStep(currentStep + 1)
    } else {
      handleSubmit()
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    try {
      // Invia dati al backend
      await demoRequestsApi.create({
        company_name: formData.companyName,
        website: formData.website,
        industry: formData.industry,
        employees_count: formData.employeesCount,
        locations_count: formData.locationsCount,
        locations_cities: formData.locationsCities,
        existing_pos: formData.existingPOS,
        existing_pos_name: formData.existingPOSName,
        has_loyalty_program: formData.hasLoyaltyProgram,
        current_customer_management: formData.currentCustomerManagement,
        active_customers_count: formData.activeCustomersCount,
        goals: formData.goals,
        timeline: formData.timeline,
        budget_range: formData.budgetRange,
        contact_name: formData.contactName,
        contact_email: formData.contactEmail,
        contact_phone: formData.contactPhone,
        contact_role: formData.contactRole
      })

      console.log('✅ Demo request submitted successfully!')

      // Send email notifications (non-blocking)
      Promise.all([
        sendDemoRequestNotification({
          companyName: formData.companyName,
          contactName: formData.contactName,
          contactEmail: formData.contactEmail,
          contactPhone: formData.contactPhone,
          industry: formData.industry,
          timeline: formData.timeline,
          budgetRange: formData.budgetRange
        }),
        sendDemoConfirmationEmail({
          companyName: formData.companyName,
          contactName: formData.contactName,
          contactEmail: formData.contactEmail,
          contactPhone: formData.contactPhone,
          industry: formData.industry
        })
      ]).catch(err => {
        console.error('Email notifications failed (non-critical):', err)
      })

      setIsSubmitted(true)
    } catch (error) {
      console.error('❌ Error submitting demo request:', error)
      alert('Si è verificato un errore. Riprova più tardi.')
    }
  }

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.companyName && formData.website && formData.industry
      case 2:
        return formData.locationsCount && formData.existingPOS
      case 3:
        return formData.hasLoyaltyProgram && formData.currentCustomerManagement
      case 4:
        return formData.goals.length > 0
      case 5:
        return formData.timeline && formData.budgetRange
      case 6:
        return formData.contactName && formData.contactEmail && formData.contactPhone
      default:
        return true
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            {/* Intro description */}
            <div className={`p-4 rounded-xl ${darkMode ? 'bg-red-500/10 border border-red-500/20' : 'bg-red-50 border border-red-100'}`}>
              <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                👋 Benvenuto! Siamo entusiasti di conoscerti. Raccontaci della tua azienda così potremo preparare una demo perfetta per le tue esigenze.
              </p>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Nome Azienda *
              </label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => handleInputChange('companyName', e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border ${
                  darkMode
                    ? 'bg-white/5 border-white/10 text-white placeholder-gray-400'
                    : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                } focus:outline-none focus:ring-2 focus:ring-red-500`}
                placeholder="Es: Caffè Centrale"
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Sito Web Aziendale *
              </label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => handleInputChange('website', e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border ${
                  darkMode
                    ? 'bg-white/5 border-white/10 text-white placeholder-gray-400'
                    : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                } focus:outline-none focus:ring-2 focus:ring-red-500`}
                placeholder="https://www.tuodominio.it"
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Settore *
              </label>
              <select
                value={formData.industry}
                onChange={(e) => handleInputChange('industry', e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border ${
                  darkMode
                    ? 'bg-white/5 border-white/10 text-white'
                    : 'bg-white border-gray-200 text-gray-900'
                } focus:outline-none focus:ring-2 focus:ring-red-500`}
              >
                <option value="">Seleziona settore</option>
                {industries.map(industry => (
                  <option key={industry} value={industry}>{industry}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Numero Dipendenti
              </label>
              <select
                value={formData.employeesCount}
                onChange={(e) => handleInputChange('employeesCount', e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border ${
                  darkMode
                    ? 'bg-white/5 border-white/10 text-white'
                    : 'bg-white border-gray-200 text-gray-900'
                } focus:outline-none focus:ring-2 focus:ring-red-500`}
              >
                <option value="">Seleziona</option>
                <option value="1-5">1-5</option>
                <option value="6-10">6-10</option>
                <option value="11-50">11-50</option>
                <option value="51-200">51-200</option>
                <option value="200+">200+</option>
              </select>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            {/* Intro description */}
            <div className={`p-4 rounded-xl ${darkMode ? 'bg-red-500/10 border border-red-500/20' : 'bg-red-50 border border-red-100'}`}>
              <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                🏪 Che tu abbia una sede o una catena, OmnilyPro si adatta perfettamente. Raccontaci come sei organizzato.
              </p>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Quanti punti vendita hai? *
              </label>
              <select
                value={formData.locationsCount}
                onChange={(e) => handleInputChange('locationsCount', e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border ${
                  darkMode
                    ? 'bg-white/5 border-white/10 text-white'
                    : 'bg-white border-gray-200 text-gray-900'
                } focus:outline-none focus:ring-2 focus:ring-red-500`}
              >
                <option value="">Seleziona</option>
                <option value="1">1 sede</option>
                <option value="2-5">2-5 sedi</option>
                <option value="6-10">6-10 sedi</option>
                <option value="11-50">11-50 sedi</option>
                <option value="50+">Oltre 50 sedi</option>
              </select>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Dove si trovano i tuoi punti vendita?
              </label>
              <input
                type="text"
                value={formData.locationsCities}
                onChange={(e) => handleInputChange('locationsCities', e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border ${
                  darkMode
                    ? 'bg-white/5 border-white/10 text-white placeholder-gray-400'
                    : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                } focus:outline-none focus:ring-2 focus:ring-red-500`}
                placeholder="Es: Milano, Roma, Torino"
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Hai già un sistema POS? *
              </label>
              <div className="space-y-2">
                {['Sì', 'No', 'In valutazione'].map(option => (
                  <label key={option} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="existingPOS"
                      value={option}
                      checked={formData.existingPOS === option}
                      onChange={(e) => handleInputChange('existingPOS', e.target.value)}
                      className="w-4 h-4 text-red-600"
                    />
                    <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>{option}</span>
                  </label>
                ))}
              </div>
            </div>

            {formData.existingPOS === 'Sì' && (
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Quale sistema POS usi attualmente?
                </label>
                <input
                  type="text"
                  value={formData.existingPOSName}
                  onChange={(e) => handleInputChange('existingPOSName', e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border ${
                    darkMode
                      ? 'bg-white/5 border-white/10 text-white placeholder-gray-400'
                      : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                  } focus:outline-none focus:ring-2 focus:ring-red-500`}
                  placeholder="Es: Square, Toast, altro"
                />
              </div>
            )}
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            {/* Intro description */}
            <div className={`p-4 rounded-xl ${darkMode ? 'bg-red-500/10 border border-red-500/20' : 'bg-red-50 border border-red-100'}`}>
              <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                💝 I tuoi clienti sono il cuore del tuo business. Vogliamo capire come li gestisci oggi per aiutarti a fare ancora meglio domani.
              </p>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Hai già un programma fedeltà? *
              </label>
              <div className="space-y-2">
                {['Sì, digitale', 'Sì, cartaceo', 'No, voglio crearlo', 'In valutazione'].map(option => (
                  <label key={option} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="hasLoyaltyProgram"
                      value={option}
                      checked={formData.hasLoyaltyProgram === option}
                      onChange={(e) => handleInputChange('hasLoyaltyProgram', e.target.value)}
                      className="w-4 h-4 text-red-600"
                    />
                    <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>{option}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Come gestisci i dati clienti oggi? *
              </label>
              <textarea
                value={formData.currentCustomerManagement}
                onChange={(e) => handleInputChange('currentCustomerManagement', e.target.value)}
                rows={3}
                className={`w-full px-4 py-3 rounded-xl border ${
                  darkMode
                    ? 'bg-white/5 border-white/10 text-white placeholder-gray-400'
                    : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                } focus:outline-none focus:ring-2 focus:ring-red-500`}
                placeholder="Es: Excel, CRM specifico, carta e penna..."
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Quanti clienti attivi hai circa?
              </label>
              <select
                value={formData.activeCustomersCount}
                onChange={(e) => handleInputChange('activeCustomersCount', e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border ${
                  darkMode
                    ? 'bg-white/5 border-white/10 text-white'
                    : 'bg-white border-gray-200 text-gray-900'
                } focus:outline-none focus:ring-2 focus:ring-red-500`}
              >
                <option value="">Seleziona</option>
                <option value="<100">Meno di 100</option>
                <option value="100-500">100-500</option>
                <option value="500-1000">500-1.000</option>
                <option value="1000-5000">1.000-5.000</option>
                <option value="5000+">Oltre 5.000</option>
              </select>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            {/* Intro description */}
            <div className={`p-4 rounded-xl ${darkMode ? 'bg-red-500/10 border border-red-500/20' : 'bg-red-50 border border-red-100'}`}>
              <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                🎯 Ogni attività ha obiettivi unici. Raccontaci i tuoi sogni: ti mostreremo come OmnilyPro può aiutarti a realizzarli.
              </p>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Cosa vuoi ottenere con OmnilyPro? (seleziona uno o più obiettivi) *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {goalOptions.map(goal => {
                  const Icon = goal.icon
                  const isSelected = formData.goals.includes(goal.value)
                  return (
                    <button
                      key={goal.value}
                      type="button"
                      onClick={() => toggleGoal(goal.value)}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                        isSelected
                          ? darkMode
                            ? 'border-red-500 bg-red-500/10'
                            : 'border-red-500 bg-red-50'
                          : darkMode
                          ? 'border-white/10 bg-white/5 hover:border-white/20'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Icon className={`w-5 h-5 mt-0.5 ${isSelected ? 'text-red-500' : darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                        <span className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                          {goal.label}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )

      case 5:
        return (
          <div className="space-y-6">
            {/* Intro description */}
            <div className={`p-4 rounded-xl ${darkMode ? 'bg-red-500/10 border border-red-500/20' : 'bg-red-50 border border-red-100'}`}>
              <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                ⏱️ Lavoriamo al tuo ritmo. Che tu sia pronto a partire subito o voglia solo esplorare, siamo qui per supportarti.
              </p>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Quando vorresti partire? *
              </label>
              <div className="space-y-2">
                {[
                  { value: 'immediately', label: 'Subito (entro 2 settimane)' },
                  { value: '1-month', label: 'Entro 1 mese' },
                  { value: '1-3-months', label: 'Entro 3 mesi' },
                  { value: 'exploring', label: 'Solo esplorando per ora' }
                ].map(option => (
                  <label key={option.value} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="timeline"
                      value={option.value}
                      checked={formData.timeline === option.value}
                      onChange={(e) => handleInputChange('timeline', e.target.value)}
                      className="w-4 h-4 text-red-600"
                    />
                    <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Budget mensile stimato? *
              </label>
              <div className="space-y-2">
                {[
                  { value: '<100', label: 'Sotto €100/mese' },
                  { value: '100-200', label: '€100-200/mese' },
                  { value: '>200', label: 'Oltre €200/mese' },
                  { value: 'flexible', label: 'Flessibile / Da definire' }
                ].map(option => (
                  <label key={option.value} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="budgetRange"
                      value={option.value}
                      checked={formData.budgetRange === option.value}
                      onChange={(e) => handleInputChange('budgetRange', e.target.value)}
                      className="w-4 h-4 text-red-600"
                    />
                    <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )

      case 6:
        return (
          <div className="space-y-6">
            {/* Intro description */}
            <div className={`p-4 rounded-xl ${darkMode ? 'bg-red-500/10 border border-red-500/20' : 'bg-red-50 border border-red-100'}`}>
              <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                🤝 Quasi fatto! Lasciaci i tuoi contatti così il nostro team potrà preparare una demo su misura e chiamarti entro 24 ore.
              </p>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Nome e Cognome *
              </label>
              <input
                type="text"
                value={formData.contactName}
                onChange={(e) => handleInputChange('contactName', e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border ${
                  darkMode
                    ? 'bg-white/5 border-white/10 text-white placeholder-gray-400'
                    : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                } focus:outline-none focus:ring-2 focus:ring-red-500`}
                placeholder="Mario Rossi"
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Email Aziendale *
              </label>
              <input
                type="email"
                value={formData.contactEmail}
                onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border ${
                  darkMode
                    ? 'bg-white/5 border-white/10 text-white placeholder-gray-400'
                    : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                } focus:outline-none focus:ring-2 focus:ring-red-500`}
                placeholder="mario@tuaazienda.it"
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Telefono *
              </label>
              <input
                type="tel"
                value={formData.contactPhone}
                onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border ${
                  darkMode
                    ? 'bg-white/5 border-white/10 text-white placeholder-gray-400'
                    : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                } focus:outline-none focus:ring-2 focus:ring-red-500`}
                placeholder="+39 XXX XXX XXXX"
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Ruolo in Azienda
              </label>
              <input
                type="text"
                value={formData.contactRole}
                onChange={(e) => handleInputChange('contactRole', e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border ${
                  darkMode
                    ? 'bg-white/5 border-white/10 text-white placeholder-gray-400'
                    : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                } focus:outline-none focus:ring-2 focus:ring-red-500`}
                placeholder="Es: Proprietario, Manager, Responsabile Marketing"
              />
            </div>
          </div>
        )

      case 7:
        return (
          <div className="text-center py-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, type: 'spring' }}
            >
              <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-6" />
            </motion.div>

            <h2 className={`text-3xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Richiesta Inviata!
            </h2>

            <p className={`text-lg mb-6 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Grazie <strong>{formData.contactName}</strong>!
            </p>

            <div className={`max-w-2xl mx-auto p-6 rounded-2xl ${
              darkMode ? 'bg-white/5 border border-white/10' : 'bg-gray-50 border border-gray-200'
            }`}>
              <p className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Abbiamo ricevuto la tua richiesta per <strong>{formData.companyName}</strong>.
              </p>

              <p className={`mb-6 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Il nostro team analizzerà le tue esigenze e ti contatterà entro <strong>24 ore</strong> per:
              </p>

              <div className={`space-y-3 text-left mb-6 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Attivare il tuo account OmnilyPro personalizzato</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Programmare una demo live su misura per te</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Discutere il piano più adatto alle tue esigenze</span>
                </div>
              </div>

              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Ti invieremo una email a <strong>{formData.contactEmail}</strong> con i prossimi passi.
              </p>
            </div>

            <button
              onClick={onClose}
              className={`mt-8 px-8 py-3 rounded-xl font-semibold transition-all duration-200 ${
                darkMode
                  ? 'bg-gradient-to-r from-red-600 to-red-500 text-white hover:shadow-lg hover:shadow-red-500/50'
                  : 'bg-gradient-to-r from-red-600 to-red-500 text-white hover:shadow-lg hover:shadow-red-500/30'
              }`}
            >
              Torna alla Home
            </button>
          </div>
        )

      default:
        return null
    }
  }

  if (isSubmitted) {
    return (
      <div className={`min-h-screen h-screen relative overflow-hidden ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        {/* Background */}
        {darkMode ? (
          <div className="absolute inset-0 w-full h-full">
            <SparklesCore
              id="tsparticlesfullpage"
              background="transparent"
              minSize={0.6}
              maxSize={1.4}
              particleDensity={100}
              className="w-full h-full"
              particleColor="#ef4444"
            />
          </div>
        ) : (
          <div className="fixed inset-0 pointer-events-none overflow-hidden">
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-0 -left-4 w-96 h-96 bg-gradient-to-br from-red-200 to-pink-200 rounded-full mix-blend-normal filter blur-3xl animate-blob" />
              <div className="absolute top-0 -right-4 w-96 h-96 bg-gradient-to-br from-pink-200 to-red-100 rounded-full mix-blend-normal filter blur-3xl animate-blob animation-delay-2000" />
              <div className="absolute -bottom-8 left-20 w-96 h-96 bg-gradient-to-br from-red-100 to-pink-100 rounded-full mix-blend-normal filter blur-3xl animate-blob animation-delay-4000" />
            </div>
          </div>
        )}

        {/* Dark mode toggle */}
        <button
          onClick={toggleDarkMode}
          className={`fixed top-6 right-6 z-50 p-3 rounded-xl backdrop-blur-xl transition-all duration-200 ${
            darkMode
              ? 'bg-white/10 hover:bg-white/20 border border-white/10'
              : 'bg-white/80 hover:bg-white border border-gray-200 shadow-lg'
          }`}
        >
          {darkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-gray-700" />}
        </button>

        {/* Content */}
        <div className="relative z-10 flex items-center justify-center min-h-screen p-6">
          <div className={`w-full max-w-4xl p-8 rounded-2xl backdrop-blur-xl ${
            darkMode ? 'bg-white/10 border border-white/10' : 'bg-white/80 border border-gray-200 shadow-2xl'
          }`}>
            {renderStep()}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen h-screen relative overflow-hidden ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Background */}
      {darkMode ? (
        <div className="absolute inset-0 w-full h-full">
          <SparklesCore
            id="tsparticlesfullpage"
            background="transparent"
            minSize={0.6}
            maxSize={1.4}
            particleDensity={100}
            className="w-full h-full"
            particleColor="#ef4444"
          />
        </div>
      ) : (
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 -left-4 w-96 h-96 bg-gradient-to-br from-red-200 to-pink-200 rounded-full mix-blend-normal filter blur-3xl animate-blob" />
            <div className="absolute top-0 -right-4 w-96 h-96 bg-gradient-to-br from-pink-200 to-red-100 rounded-full mix-blend-normal filter blur-3xl animate-blob animation-delay-2000" />
            <div className="absolute -bottom-8 left-20 w-96 h-96 bg-gradient-to-br from-red-100 to-pink-100 rounded-full mix-blend-normal filter blur-3xl animate-blob animation-delay-4000" />
          </div>
        </div>
      )}

      {/* Dark mode toggle */}
      <button
        onClick={toggleDarkMode}
        className={`fixed top-6 right-6 z-50 p-3 rounded-xl backdrop-blur-xl transition-all duration-200 ${
          darkMode
            ? 'bg-white/10 hover:bg-white/20 border border-white/10'
            : 'bg-white/80 hover:bg-white border border-gray-200 shadow-lg'
        }`}
      >
        {darkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-gray-700" />}
      </button>

      {/* Close button (optional) */}
      {onClose && (
        <button
          onClick={onClose}
          className={`fixed top-6 left-6 z-50 p-3 rounded-xl backdrop-blur-xl transition-all duration-200 ${
            darkMode
              ? 'bg-white/10 hover:bg-white/20 border border-white/10'
              : 'bg-white/80 hover:bg-white border border-gray-200 shadow-lg'
          }`}
        >
          <X className={`w-5 h-5 ${darkMode ? 'text-white' : 'text-gray-700'}`} />
        </button>
      )}

      {/* Main Content */}
      <div className="relative z-10 flex min-h-screen">
        {/* Sidebar */}
        <div className={`w-[300px] p-8 backdrop-blur-xl border-r ${
          darkMode ? 'bg-white/10 border-white/10' : 'bg-white/80 border-gray-200'
        }`}>
          {/* Logo */}
          <div className="mb-8">
            <img
              src="https://sjvatdnvewohvswfrdiv.supabase.co/storage/v1/object/public/IMG/OMNILYPRO.png"
              alt="OMNILY PRO"
              className="h-12 w-auto object-contain mb-6"
            />
            <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Richiedi Demo
            </h1>
            <p className={`text-sm mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Compila il form per ricevere una demo personalizzata
            </p>
          </div>

          <div className="space-y-4">
            {steps.map((step, index) => {
              const Icon = step.icon
              const isCompleted = currentStep > step.number
              const isCurrent = currentStep === step.number

              return (
                <div key={step.number} className="relative">
                  <div className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
                    isCurrent
                      ? darkMode
                        ? 'bg-gradient-to-r from-red-600 to-red-500'
                        : 'bg-gradient-to-r from-red-600 to-red-500'
                      : isCompleted
                      ? darkMode
                        ? 'bg-green-500/20'
                        : 'bg-green-50'
                      : darkMode
                      ? 'bg-white/5'
                      : 'bg-gray-50'
                  }`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isCompleted
                        ? 'bg-green-500'
                        : isCurrent
                        ? 'bg-white text-red-600'
                        : darkMode
                        ? 'bg-white/10 text-gray-400'
                        : 'bg-white text-gray-400'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-white" />
                      ) : (
                        <span className="text-sm font-bold">{step.number}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${
                        isCurrent ? 'text-white' : darkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        {step.title}
                      </p>
                    </div>
                  </div>

                  {index < steps.length - 1 && (
                    <div className={`ml-7 h-6 w-0.5 ${
                      isCompleted
                        ? 'bg-green-500'
                        : darkMode
                        ? 'bg-white/10'
                        : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Progress Bar */}
          <div className={`h-2 ${darkMode ? 'bg-white/5' : 'bg-gray-200'}`}>
            <motion.div
              className="h-full bg-gradient-to-r from-red-600 to-red-500"
              initial={{ width: 0 }}
              animate={{ width: `${(currentStep / 7) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          {/* Content */}
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="w-full max-w-2xl">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className={`p-8 rounded-2xl backdrop-blur-xl ${
                    darkMode ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-200 shadow-xl'
                  }`}>
                    <h2 className={`text-2xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {steps[currentStep - 1].title}
                    </h2>

                    {renderStep()}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Footer Navigation */}
          {currentStep < 7 && (
            <div className={`p-6 backdrop-blur-xl border-t ${
              darkMode ? 'bg-white/5 border-white/10' : 'bg-white/80 border-gray-200'
            }`}>
              <div className="max-w-2xl mx-auto flex justify-between gap-4">
                <button
                  onClick={handleBack}
                  disabled={currentStep === 1}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 ${
                    currentStep === 1
                      ? darkMode
                        ? 'bg-white/5 text-gray-500 cursor-not-allowed'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : darkMode
                      ? 'bg-white/10 text-white hover:bg-white/20'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  <ArrowLeft className="w-5 h-5" />
                  Indietro
                </button>

                <button
                  onClick={handleNext}
                  disabled={!isStepValid()}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 ${
                    !isStepValid()
                      ? darkMode
                        ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-red-600 to-red-500 text-white hover:shadow-lg hover:shadow-red-500/50'
                  }`}
                >
                  {currentStep === 6 ? 'Invia Richiesta' : 'Avanti'}
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default DemoRequestWizard
