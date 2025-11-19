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
    if (currentStep < 6) {
      setCurrentStep(currentStep + 1)
    } else if (currentStep === 6) {
      // Step 6 is the last step - submit the form
      handleSubmit()
    } else {
      // Step 7 is the confirmation screen, should not happen
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    try {
      console.log('📋 Submitting demo request...', {
        company_name: formData.companyName,
        contact_email: formData.contactEmail
      })

      // Invia dati al backend
      const result = await demoRequestsApi.create({
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

      console.log('✅ Demo request submitted successfully!', result)

      // Send email notifications (non-blocking)
      console.log('📧 Sending email notifications...')

      // Send notification to sales team
      sendDemoRequestNotification({
        companyName: formData.companyName,
        contactName: formData.contactName,
        contactEmail: formData.contactEmail,
        contactPhone: formData.contactPhone,
        industry: formData.industry,
        timeline: formData.timeline,
        budgetRange: formData.budgetRange
      }).then(() => {
        console.log('✅ Sales notification email sent')
      }).catch(err => {
        console.error('❌ Sales notification email failed:', err)
      })

      // Send confirmation to customer
      sendDemoConfirmationEmail({
        companyName: formData.companyName,
        contactName: formData.contactName,
        contactEmail: formData.contactEmail,
        contactPhone: formData.contactPhone,
        industry: formData.industry
      }).then(() => {
        console.log('✅ Customer confirmation email sent')
      }).catch(err => {
        console.error('❌ Customer confirmation email failed:', err)
      })

      setIsSubmitted(true)
      setCurrentStep(7) // Go to step 7 to show the new success screen
    } catch (error: any) {
      console.error('❌ Error submitting demo request:', error)
      console.error('❌ Error details:', {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint
      })
      alert(`Si è verificato un errore: ${error?.message || 'Riprova più tardi.'}`)
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
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Building2 className={`w-5 h-5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                </div>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => handleInputChange('companyName', e.target.value)}
                  className={`w-full pl-12 pr-4 py-3 rounded-xl border ${
                    darkMode
                      ? 'bg-white/5 border-white/10 text-white placeholder-gray-400'
                      : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                  } focus:outline-none focus:ring-2 focus:ring-red-500 transition-all`}
                  placeholder="Es: Caffè Centrale"
                />
              </div>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Sito Web Aziendale *
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Globe className={`w-5 h-5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                </div>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  className={`w-full pl-12 pr-4 py-3 rounded-xl border ${
                    darkMode
                      ? 'bg-white/5 border-white/10 text-white placeholder-gray-400'
                      : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                  } focus:outline-none focus:ring-2 focus:ring-red-500 transition-all`}
                  placeholder="https://www.tuodominio.it"
                />
              </div>
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
                🏪 OmnilyPro funziona ovunque: negozi fisici, e-commerce, o entrambi. Raccontaci come vendi oggi.
              </p>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Dove vendi principalmente? *
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
                <option value="Solo e-commerce">Solo e-commerce</option>
                <option value="1">1 negozio fisico</option>
                <option value="2-5">2-5 negozi fisici</option>
                <option value="6-10">6-10 negozi fisici</option>
                <option value="11-50">11-50 negozi fisici</option>
                <option value="50+">Oltre 50 negozi</option>
                <option value="Negozi + E-commerce">Negozi fisici + E-commerce</option>
              </select>
            </div>

            {formData.locationsCount && formData.locationsCount !== 'Solo e-commerce' && (
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  In quali città/zone si trovano? (opzionale)
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
            )}

            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Come gestisci le vendite attualmente? *
              </label>
              <div className="space-y-2">
                {['Piattaforma e-commerce', 'Sistema cassa/gestionale', 'Registro manuale', 'Altro'].map(option => (
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

            {(formData.existingPOS === 'Sistema cassa/gestionale' || formData.existingPOS === 'Piattaforma e-commerce') && (
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Quale sistema/piattaforma usi? (opzionale)
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
                  placeholder={formData.existingPOS === 'Piattaforma e-commerce'
                    ? "Es: Shopify, WooCommerce, PrestaShop, Magento..."
                    : "Es: Zucchetti, TeamSystem, Vend, altro gestionale..."}
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
                className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-red-500 transition-all ${
                  darkMode
                    ? 'bg-gray-800 border-white/10 placeholder-gray-500 textarea-dark-fix'
                    : 'bg-white border-gray-200 placeholder-gray-500 textarea-light-fix'
                }`}
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
              <div className="grid grid-cols-1 gap-3">
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
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <User className={`w-5 h-5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                </div>
                <input
                  type="text"
                  value={formData.contactName}
                  onChange={(e) => handleInputChange('contactName', e.target.value)}
                  className={`w-full pl-12 pr-4 py-3 rounded-xl border ${
                    darkMode
                      ? 'bg-white/5 border-white/10 text-white placeholder-gray-400'
                      : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                  } focus:outline-none focus:ring-2 focus:ring-red-500 transition-all`}
                  placeholder="Mario Rossi"
                />
              </div>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Email Aziendale *
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Mail className={`w-5 h-5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                </div>
                <input
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                  className={`w-full pl-12 pr-4 py-3 rounded-xl border ${
                    darkMode
                      ? 'bg-white/5 border-white/10 text-white placeholder-gray-400'
                      : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                  } focus:outline-none focus:ring-2 focus:ring-red-500 transition-all`}
                  placeholder="mario@tuaazienda.it"
                />
              </div>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Telefono *
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Phone className={`w-5 h-5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                </div>
                <input
                  type="tel"
                  value={formData.contactPhone}
                  onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                  className={`w-full pl-12 pr-4 py-3 rounded-xl border ${
                    darkMode
                      ? 'bg-white/5 border-white/10 text-white placeholder-gray-400'
                      : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                  } focus:outline-none focus:ring-2 focus:ring-red-500 transition-all`}
                  placeholder="+39 XXX XXX XXXX"
                />
              </div>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Ruolo in Azienda
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Briefcase className={`w-5 h-5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                </div>
                <input
                  type="text"
                  value={formData.contactRole}
                  onChange={(e) => handleInputChange('contactRole', e.target.value)}
                  className={`w-full pl-12 pr-4 py-3 rounded-xl border ${
                    darkMode
                      ? 'bg-white/5 border-white/10 text-white placeholder-gray-400'
                      : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                  } focus:outline-none focus:ring-2 focus:ring-red-500 transition-all`}
                  placeholder="Es: Proprietario, Manager, Responsabile Marketing"
                />
              </div>
            </div>
          </div>
        )

      case 7:
        return (
          <div className="py-8 max-h-[70vh] overflow-y-auto scroll-smooth scrollbar-thin scrollbar-thumb-red-500 scrollbar-track-transparent">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, type: 'spring' }}
              className="text-center mb-6"
            >
              <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-4" />
              <h2 className={`text-3xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                ✅ Richiesta Inviata con Successo! [v2.0]
              </h2>
              <p className={`text-lg ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Grazie <strong>{formData.contactName}</strong>! Abbiamo ricevuto tutti i dati.
              </p>
            </motion.div>

            {/* Summary of submitted data */}
            <div className="space-y-4 mb-8">
              {/* Company Info */}
              <div className={`p-5 rounded-xl border ${
                darkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-start gap-3 mb-3">
                  <Building2 className={`w-5 h-5 mt-0.5 ${darkMode ? 'text-red-400' : 'text-red-600'}`} />
                  <div>
                    <h3 className={`font-semibold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      Informazioni Azienda
                    </h3>
                    <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      <strong>{formData.companyName}</strong>
                      {formData.industry && ` · ${formData.industry}`}
                      {formData.employeesCount && ` · ${formData.employeesCount} dipendenti`}
                    </p>
                    {formData.website && (
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {formData.website}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className={`p-5 rounded-xl border ${
                darkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-start gap-3 mb-3">
                  <Mail className={`w-5 h-5 mt-0.5 ${darkMode ? 'text-red-400' : 'text-red-600'}`} />
                  <div>
                    <h3 className={`font-semibold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      I Tuoi Contatti
                    </h3>
                    <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      <strong>{formData.contactName}</strong>
                      {formData.contactRole && ` · ${formData.contactRole}`}
                    </p>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      📧 {formData.contactEmail}
                    </p>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      📞 {formData.contactPhone}
                    </p>
                  </div>
                </div>
              </div>

              {/* Goals & Timeline */}
              <div className={`p-5 rounded-xl border ${
                darkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-start gap-3 mb-3">
                  <Target className={`w-5 h-5 mt-0.5 ${darkMode ? 'text-red-400' : 'text-red-600'}`} />
                  <div className="flex-1">
                    <h3 className={`font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      Obiettivi & Tempistiche
                    </h3>
                    {formData.goals.length > 0 && (
                      <div className="mb-3">
                        <p className={`text-sm mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          Obiettivi selezionati:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {formData.goals.map(goal => {
                            const goalObj = goalOptions.find(g => g.value === goal)
                            return (
                              <span key={goal} className={`text-xs px-2 py-1 rounded-full ${
                                darkMode ? 'bg-red-500/20 text-red-300' : 'bg-red-100 text-red-700'
                              }`}>
                                {goalObj?.label || goal}
                              </span>
                            )
                          })}
                        </div>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      {formData.timeline && (
                        <div>
                          <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>Timeline</p>
                          <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {formData.timeline === 'immediately' && '⚡ Subito'}
                            {formData.timeline === '1-month' && '📅 Entro 1 mese'}
                            {formData.timeline === '1-3-months' && '📅 Entro 3 mesi'}
                            {formData.timeline === 'exploring' && '🔍 Esplorando'}
                          </p>
                        </div>
                      )}
                      {formData.budgetRange && (
                        <div>
                          <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>Budget</p>
                          <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            💰 {formData.budgetRange === 'flexible' ? 'Flessibile' : formData.budgetRange}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* What happens next */}
            <div className={`p-6 rounded-2xl border-2 mb-8 ${
              darkMode ? 'bg-red-500/10 border-red-500/30' : 'bg-red-50 border-red-200'
            }`}>
              <h3 className={`font-bold text-lg mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                🎯 Cosa Succede Adesso?
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold ${
                    darkMode ? 'bg-red-500 text-white' : 'bg-red-600 text-white'
                  }`}>1</div>
                  <div>
                    <p className={`font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                      📧 Conferma Email (tra pochi minuti)
                    </p>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Riceverai una email di conferma a <strong>{formData.contactEmail}</strong>
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold ${
                    darkMode ? 'bg-red-500 text-white' : 'bg-red-600 text-white'
                  }`}>2</div>
                  <div>
                    <p className={`font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                      🤝 Contatto dal Team (entro 24 ore)
                    </p>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Il nostro team analizzerà le tue esigenze e ti chiamerà per programmare la demo
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold ${
                    darkMode ? 'bg-red-500 text-white' : 'bg-red-600 text-white'
                  }`}>3</div>
                  <div>
                    <p className={`font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                      🚀 Demo Personalizzata
                    </p>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Ti mostreremo OmnilyPro in azione, focalizzandoci sui tuoi obiettivi specifici
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={onClose}
                className={`px-8 py-3 rounded-xl font-semibold transition-all duration-200 ${
                  darkMode
                    ? 'bg-gradient-to-r from-red-600 to-red-500 text-white hover:shadow-lg hover:shadow-red-500/50'
                    : 'bg-gradient-to-r from-red-600 to-red-500 text-white hover:shadow-lg hover:shadow-red-500/30'
                }`}
              >
                🏠 Torna alla Home
              </button>
              <a
                href="https://omnilypro.com"
                target="_blank"
                rel="noopener noreferrer"
                className={`px-8 py-3 rounded-xl font-semibold transition-all duration-200 text-center ${
                  darkMode
                    ? 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                📚 Scopri di Più
              </a>
            </div>

            {/* Emergency contact */}
            <div className={`mt-8 text-center text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              <p>Domande urgenti? Contattaci a <strong>sales@omnilypro.com</strong></p>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  // Tech keywords for animated background
  const techKeywords = [
    'Loyalty', 'CRM', 'E-commerce', 'API', 'Analytics', 'Rewards',
    'Shopify', 'WooCommerce', 'Integration', 'Customers', 'Marketing',
    'Engagement', 'Points', 'Tiers', 'Cashback', 'Gamification',
    'Mobile', 'Cloud', 'Real-time', 'Automation', 'AI'
  ]

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

        {/* Floating Tech Keywords */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {techKeywords.map((keyword, index) => {
            const randomTop = Math.random() * 100
            const randomLeft = Math.random() * 100
            const randomDuration = 15 + Math.random() * 20
            const randomDelay = Math.random() * 5
            const randomSize = 1 + Math.random() * 1.5

            return (
              <motion.div
                key={keyword}
                className={`absolute whitespace-nowrap font-bold ${
                  darkMode ? 'text-white/5' : 'text-gray-900/5'
                }`}
                style={{
                  top: `${randomTop}%`,
                  left: `${randomLeft}%`,
                  fontSize: `${randomSize}rem`,
                }}
                animate={{
                  y: [0, -30, 0],
                  x: [0, Math.random() > 0.5 ? 20 : -20, 0],
                  opacity: [0.3, 0.6, 0.3],
                }}
                transition={{
                  duration: randomDuration,
                  repeat: Infinity,
                  delay: randomDelay,
                  ease: "easeInOut"
                }}
              >
                {keyword}
              </motion.div>
            )
          })}
        </div>

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

      {/* Floating Tech Keywords */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {techKeywords.map((keyword, index) => {
          const randomTop = Math.random() * 100
          const randomLeft = Math.random() * 100
          const randomDuration = 15 + Math.random() * 20
          const randomDelay = Math.random() * 5
          const randomSize = 1 + Math.random() * 1.5

          return (
            <motion.div
              key={keyword}
              className={`absolute whitespace-nowrap font-bold ${
                darkMode ? 'text-white/5' : 'text-gray-900/5'
              }`}
              style={{
                top: `${randomTop}%`,
                left: `${randomLeft}%`,
                fontSize: `${randomSize}rem`,
              }}
              animate={{
                y: [0, -30, 0],
                x: [0, Math.random() > 0.5 ? 20 : -20, 0],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: randomDuration,
                repeat: Infinity,
                delay: randomDelay,
                ease: "easeInOut"
              }}
            >
              {keyword}
            </motion.div>
          )
        })}
      </div>

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

      {/* Close button (optional) - moved to top right on mobile, top left on desktop after logo */}
      {onClose && (
        <button
          onClick={onClose}
          className={`fixed top-6 right-20 z-50 p-3 rounded-xl backdrop-blur-xl transition-all duration-200 md:hidden ${
            darkMode
              ? 'bg-white/10 hover:bg-white/20 border border-white/10'
              : 'bg-white/80 hover:bg-white border border-gray-200 shadow-lg'
          }`}
        >
          <X className={`w-5 h-5 ${darkMode ? 'text-white' : 'text-gray-700'}`} />
        </button>
      )}

      {/* Main Content */}
      <div className="relative z-10 flex flex-col md:flex-row min-h-screen">
        {/* Sidebar */}
        <div className={`w-full md:w-[300px] p-6 md:p-8 backdrop-blur-xl md:border-r ${
          darkMode ? 'bg-white/10 border-white/10' : 'bg-white/80 border-gray-200'
        }`}>
          {/* Logo */}
          <div className="mb-6 md:mb-8">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <img
                src="https://sjvatdnvewohvswfrdiv.supabase.co/storage/v1/object/public/IMG/OMNILYPRO.png"
                alt="OMNILY PRO"
                className="h-10 md:h-12 w-auto object-contain"
              />
              {/* Close button for desktop - placed next to logo */}
              {onClose && (
                <button
                  onClick={onClose}
                  className={`hidden md:block p-2 rounded-lg backdrop-blur-xl transition-all duration-200 ${
                    darkMode
                      ? 'bg-white/10 hover:bg-white/20 border border-white/10'
                      : 'bg-white/80 hover:bg-white border border-gray-200'
                  }`}
                >
                  <X className={`w-4 h-4 ${darkMode ? 'text-white' : 'text-gray-700'}`} />
                </button>
              )}
            </div>
            <div>
              <h1 className={`text-xl md:text-2xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                🚀 Richiedi Demo
              </h1>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Solo 2 minuti per una demo su misura
              </p>
            </div>

            {/* Progress bar */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Progresso
                </span>
                <span className={`text-xs font-bold ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
                  {Math.round((currentStep / 7) * 100)}%
                </span>
              </div>
              <div className={`h-2 rounded-full overflow-hidden ${darkMode ? 'bg-white/10' : 'bg-gray-200'}`}>
                <motion.div
                  className="h-full bg-gradient-to-r from-red-600 to-red-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${(currentStep / 7) * 100}%` }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                />
              </div>
              <p className={`text-xs mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                {7 - currentStep === 0 ? '✅ Completato!' : `${7 - currentStep} step rimanenti`}
              </p>
            </div>
          </div>

          {/* Steps - hidden on mobile, shown on desktop */}
          <div className="hidden md:block space-y-4">
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

          {/* Mobile step indicator */}
          <div className="md:hidden">
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Passo {currentStep} di 7
            </p>
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
          <div className="flex-1 flex items-center justify-center p-4 md:p-6 overflow-y-auto">
            <div className="w-full max-w-3xl">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="h-full"
                >
                  <div className={`p-6 md:p-10 rounded-2xl backdrop-blur-xl h-full ${
                    darkMode ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-200 shadow-xl'
                  }`}>
                    <h2 className={`text-2xl md:text-3xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
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
              {/* Motivational message */}
              {currentStep < 6 && (
                <div className="max-w-2xl mx-auto mb-4">
                  <p className={`text-center text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {currentStep === 1 && "🎯 Ottimo inizio! Raccontaci di più sulla tua attività"}
                    {currentStep === 2 && "📍 Perfetto! Aiutaci a capire dove operi"}
                    {currentStep === 3 && "💝 Quasi a metà! Come gestisci i tuoi clienti oggi?"}
                    {currentStep === 4 && "🎁 Fantastico! Quali sono i tuoi obiettivi?"}
                    {currentStep === 5 && "⚡ Ci siamo quasi! Budget e tempistiche"}
                  </p>
                </div>
              )}

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
                  className={`group px-8 py-4 rounded-xl font-bold transition-all duration-200 flex items-center gap-2 ${
                    !isStepValid()
                      ? darkMode
                        ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-red-600 to-red-500 text-white hover:shadow-xl hover:shadow-red-500/50 hover:scale-105'
                  }`}
                >
                  {currentStep === 6 ? (
                    <>
                      🚀 Invia Richiesta
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  ) : (
                    <>
                      Continua
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
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
