import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
// import { useAuth } from '../../contexts/AuthContext' // Temporary disabled
import { organizationService } from '../../services/organizationService'
import { omnilyProPlansService, type OmnilyProPlan } from '../../services/omnilyProPlansService'
import { getMockUser } from '../../services/mockAuth'
import { useToast } from '../../contexts/ToastContext'
import { Zap, Award, CheckCircle2, Building2, Users, User, BarChart3, Shield, Gift, Palette, UserPlus, Bell, Star, Settings, Globe, Smartphone, Phone, Mail, Globe2, MessageSquare, Upload, X, CreditCard, Printer, ArrowRight, ArrowLeft, Package, AlertCircle } from 'lucide-react'
import styles from './EnterpriseWizard.module.css'
import './icon-styles.css'
import { INDUSTRY_TEMPLATES } from '../../config/industryTemplates'
import './EnterpriseWizardAdmin.css'
import './EnterpriseWizardContent.css'
// import POSTestPanel from '../POS/POSTestPanel'

interface EnterpriseWizardProps {
  mode?: 'admin' | 'client'
  onComplete?: (organizationData: any) => void
}

const EnterpriseWizard: React.FC<EnterpriseWizardProps> = ({ mode = 'client', onComplete }) => {
  const navigate = useNavigate()
  const { showSuccess } = useToast()
  // const { user } = useAuth() // TODO: Enable when auth is ready
  const user = getMockUser() // Temporary mock for development

  // Carica step salvato da localStorage
  const [currentStep, setCurrentStep] = useState(() => {
    const saved = localStorage.getItem('omnily-wizard-step')
    return saved ? parseInt(saved) : 0
  })

  const [loading, setLoading] = useState(false)
  const [validatingVAT, setValidatingVAT] = useState(false)
  const [vatValidated, setVatValidated] = useState(false)
  const [createdOrganization, setCreatedOrganization] = useState<any>(null)

  // Dynamic plans from database
  const [availablePlans, setAvailablePlans] = useState<OmnilyProPlan[]>([])
  const [plansLoading, setPlansLoading] = useState(true)

  // Carica dati salvati da localStorage  
  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem('omnily-wizard-data')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch (e) {
        console.warn('Errore caricamento dati salvati:', e)
      }
    }

    // Dati di default se non ci sono salvataggi
    return {
      // Plan Selection (admin mode only)
      planId: null, // Will be set when plans are loaded

      // Step 1: Organization Basics
      organizationName: '',
      partitaIVA: '',
      codiceFiscale: '',
      industry: 'retail',
      teamSize: '1-10',
      phoneNumber: '',
      businessEmail: '',
      website: '',
      tagline: '',
      logoUrl: '',
      address: '',
      city: '',
      province: '',
      cap: '',

      // Owner Information
      ownerFirstName: '',
      ownerLastName: '',
      ownerEmail: '',
      ownerPhone: '',
      ownerAvatarUrl: '',

      // Step 2: Loyalty System Setup
      pointsName: 'Punti',
      pointsPerEuro: '1',
      rewardThreshold: '100',
      welcomeBonus: '50',
      pointsExpiry: '12', // mesi
      enableTierSystem: true,
      loyaltyTiers: [
        { name: 'Iniziale', threshold: '0', multiplier: '1', color: '#94a3b8', gradient: false, gradientEnd: '#94a3b8' },
        { name: 'Affezionato', threshold: '300', multiplier: '1.5', color: '#3b82f6', gradient: false, gradientEnd: '#3b82f6' },
        { name: 'VIP', threshold: '800', multiplier: '2', color: '#f59e0b', gradient: true, gradientEnd: '#dc2626' }
      ],

      // Step 3: Products & Categories  
      importProducts: true,
      productCategories: ['Alimentari', 'Bevande', 'Accessori'],
      bonusCategories: [
        { category: 'Alimentari', multiplier: '1' },
        { category: 'Bevande', multiplier: '1.2' },
        { category: 'Accessori', multiplier: '1.5' }
      ],

      // Step 4: Rewards Configuration
      rewardTypes: ['discount', 'freeProduct', 'cashback'],
      defaultRewards: [
        { points: '100', requiredTier: 'Iniziale', type: 'discount', value: '5', description: '5€ di sconto' },
        { points: '200', requiredTier: 'Affezionato', type: 'discount', value: '10', description: '10€ di sconto' },
        { points: '300', requiredTier: 'VIP', type: 'freeProduct', value: 'caffè', description: 'Caffè gratuito' }
      ],

      // Step 5: Branding Setup
      primaryColor: '#ef4444',
      secondaryColor: '#dc2626',
      appName: '',

      // Social Media Links
      facebookUrl: '',
      instagramUrl: '',
      linkedinUrl: '',
      twitterUrl: '',

      // Step 6: Channels Integration
      enablePOS: true,
      enableEcommerce: false,
      enableApp: true,
      posDevices: '1',

      // Step 7: Marketing Campaigns
      welcomeCampaign: true,
      birthdayRewards: true,
      inactiveCampaign: true,
      seasonalCampaigns: false,

      // Step 8: Team Setup
      inviteEmails: [''],
      adminName: '',
      adminEmail: '',

      // Step 9: POS Integration
      posEnabled: true,
      posModel: 'Z108', // Z90, Z91, Z92, Z100, Z108, Z70, Z45
      posConnection: 'usb', // usb, bluetooth
      enableReceiptPrint: true,
      enableNFC: true,
      enableEMV: true,
      enablePinPad: true,
      posTestResults: null,

      // Step 10: Notifications & Communication
      enableEmailNotifications: true,
      enableSMS: false,
      enablePushNotifications: true,
      welcomeEmailEnabled: true,

      // Step 10: Analytics & Reports
      enableAdvancedAnalytics: true,
      reportFrequency: 'weekly',
      kpiTracking: ['customer_retention', 'average_transaction', 'loyalty_roi']
    }
  })

  // Load available plans from database
  useEffect(() => {
    const loadPlans = async () => {
      try {
        setPlansLoading(true)
        const plans = await omnilyProPlansService.getWizardPlans()
        setAvailablePlans(plans)

        // Set default plan to "Basic" if no plan is selected
        if (!formData.planId && plans.length > 0) {
          const basicPlan = plans.find(p => p.slug === 'basic')
          if (basicPlan) {
            setFormData(prev => ({ ...prev, planId: basicPlan.id }))
          }
        }
      } catch (error) {
        console.error('Error loading plans:', error)
      } finally {
        setPlansLoading(false)
      }
    }
    loadPlans()
  }, [])

  const steps = [
    {
      title: 'Benvenuto in OMNILY PRO',
      subtitle: 'Setup enterprise completo in 11 step',
      icon: Award
    },
    {
      title: 'Dettagli Organizzazione',
      subtitle: 'Informazioni aziendali e P.IVA',
      icon: Building2
    },
    {
      title: 'Sistema Loyalty',
      subtitle: 'Punti, livelli e moltiplicatori',
      icon: Gift
    },
    {
      title: 'Prodotti e Categorie',
      subtitle: 'Import catalogo e bonus categorie',
      icon: Settings
    },
    {
      title: 'Configurazione Rewards',
      subtitle: 'Premi predefiniti e tipologie',
      icon: Star
    },
    {
      title: 'Branding Aziendale',
      subtitle: 'Logo, colori e identità app',
      icon: Palette
    },
    {
      title: 'Canali e Integrazione',
      subtitle: 'POS, E-commerce, App mobile',
      icon: Zap
    },
    {
      title: 'Campagne Marketing',
      subtitle: 'Automazioni welcome e retention',
      icon: Bell
    },
    {
      title: 'Team e Permessi',
      subtitle: 'Invita staff e gestisci ruoli',
      icon: UserPlus
    },
    {
      title: 'Integrazione POS',
      subtitle: 'Terminale ZCS per NFC e pagamenti',
      icon: CreditCard
    },
    {
      title: 'Notifiche e Comunicazioni',
      subtitle: 'Email, SMS e push notifications',
      icon: Bell
    },
    {
      title: 'Sistema Operativo',
      subtitle: 'Il tuo loyalty è pronto per il lancio!',
      icon: CheckCircle2
    }
  ]

  const industries = [
    { value: 'retail', label: 'Retail e Fashion' },
    { value: 'restaurant', label: 'Ristorazione e Pizzeria' },
    { value: 'beauty', label: 'Beauty e Wellness' },
    { value: 'gym', label: 'Palestra e Fitness' },
    { value: 'grocery', label: 'Supermercato e Alimentari' },
    { value: 'automotive', label: 'Automotive e Motori' },
    { value: 'other', label: 'Altro / Generico' }
  ]

  const teamSizes = [
    { value: '1-10', label: '1-10 dipendenti' },
    { value: '11-50', label: '11-50 dipendenti' },
    { value: '51-200', label: '51-200 dipendenti' },
    { value: '200+', label: 'Oltre 200 dipendenti' }
  ]

  const handleInputChange = (field: string, value: string | boolean | string[] | any[]) => {
    const newData = { ...formData, [field]: value }
    setFormData(newData)

    // Salva automaticamente in localStorage
    localStorage.setItem('omnily-wizard-data', JSON.stringify(newData))
  }

  // 🪄 SMART TEMPLATE APPLICATION
  const applyIndustryTemplate = (industry: string) => {
    const template = INDUSTRY_TEMPLATES[industry] || INDUSTRY_TEMPLATES['retail'] // Fallback

    console.log('🪄 Applying Industry Template:', template.name)

    setFormData((prev: any) => ({
      ...prev,
      industry: industry,

      // Branding
      primaryColor: template.colors.primary,
      secondaryColor: template.colors.secondary,

      // Loyalty Config
      pointsName: template.pointsName,
      pointsPerEuro: template.pointsPerEuro,
      rewardThreshold: template.rewardThreshold,
      welcomeBonus: template.welcomeBonus,

      // Tiers
      loyaltyTiers: template.loyaltyTiers,

      // Catalog
      productCategories: template.productCategories,
      bonusCategories: template.bonusCategories,

      // Rewards
      defaultRewards: template.defaultRewards,

      // Note: We could also set specific toggle defaults here if needed
    }))

    // Toast notification would be nice here
    // showSuccess(`Template ${template.name} applicato!`)
  }

  // 🇮🇹 RICONOSCIMENTO AUTOMATICO PARTITA IVA - FEATURE ENTERPRISE ITALIANA
  const validatePartitaIVA = async (piva: string) => {
    if (!piva || piva.length !== 11) return false;

    setValidatingVAT(true);
    setVatValidated(false);

    try {
      // Usa API proxy CORS-friendly per VIES
      const response = await fetch(`https://corsproxy.io/?https://ec.europa.eu/taxation_customs/vies/rest-api/ms/IT/vat/${piva}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('VIES API non disponibile');
      }

      const data = await response.json();
      console.log('📋 Risposta VIES:', data);

      if (data.isValid || data.valid) {
        const companyName = data.name || data.traderName || '';
        const addressString = data.address || data.traderAddress || '';

        let parsedAddress = {
          address: addressString,
          city: '',
          province: '',
          cap: '',
        };

        // Best-effort parsing for Italian addresses (e.g., "VIA CONFALONIERI FEDERICO 4 , 20124 MILANO MI, ")
        const match = addressString.match(/^(.+?),\s*(\d{5})\s(.+?)\s([A-Z]{2}),?\s*$/);
        if (match) {
          parsedAddress.address = match[1].trim();
          parsedAddress.cap = match[2];
          parsedAddress.city = match[3].trim();
          parsedAddress.province = match[4];
        }

        setFormData((prev: any) => ({
          ...prev,
          organizationName: companyName || prev.organizationName,
          address: parsedAddress.address,
          city: parsedAddress.city,
          province: parsedAddress.province,
          cap: parsedAddress.cap,
        }));

        setVatValidated(true);
        console.log('✅ Partita IVA validata con successo!');
        console.log('📝 Nome azienda:', companyName);
        console.log('📍 Indirizzo:', addressString);
        setValidatingVAT(false);
        return true;
      }

      console.log('❌ P.IVA non valida o non trovata');
      setValidatingVAT(false);
      return false;
    } catch (error: any) {
      console.log('⚠️ Errore validazione P.IVA:', error.message);
      setValidatingVAT(false);
      // Non mostrare errore all'utente, semplicemente non auto-compilare
      return false;
    }
  };

  const handlePartitaIVAChange = async (piva: string) => {
    setFormData((prev: any) => ({ ...prev, partitaIVA: piva }))

    if (piva.length === 11) {
      console.log('🔍 Validazione Partita IVA in corso...')
      await validatePartitaIVA(piva)
    }
  }

  // Helper functions for navigation
  const isStepDisabled = (step: number): boolean => {
    switch (step) {
      case 1: // Organization step
        return !formData.organizationName || !formData.partitaIVA || !formData.industry
      case 2: // Loyalty step
        return !formData.pointsName || !formData.pointsPerEuro || !formData.rewardThreshold
      case 3: // Products step
        return formData.productCategories.length === 0
      case 4: // Rewards step
        return formData.defaultRewards.length === 0
      case 5: // Branding step
        return !formData.primaryColor || !formData.secondaryColor
      case 6: // Channels step
        return false // Optional
      case 7: // Marketing step
        return false // Optional
      case 8: // Team step
        return !formData.adminName || !formData.adminEmail
      case 9: // POS step
        return false // Optional - POS configuration is optional
      case 10: // Notifications step
        return false // Optional
      default:
        return false
    }
  }

  const getNextButtonText = (): string => {
    switch (currentStep) {
      case 0: return mode === 'admin' ? 'Continua con Dati Azienda' : 'Inizia Configurazione'
      case 1: return 'Configura Loyalty System'
      case 2: return 'Setup Prodotti e Categorie'
      case 3: return 'Configura Rewards'
      case 4: return 'Setup Branding'
      case 5: return 'Integra Canali'
      case 6: return 'Setup Marketing'
      case 7: return 'Gestione Team'
      case 8: return 'Integra POS'
      case 9: return 'Configure Notifiche'
      case 10: return 'Deploy Sistema'
      case 11: return 'Lancia Dashboard'
      default: return 'Continua'
    }
  }

  const handleNext = async () => {
    if (currentStep < steps.length - 2) {
      // Navigate to next step
      const nextStep = currentStep + 1
      setCurrentStep(nextStep)
      localStorage.setItem('omnily-wizard-step', nextStep.toString())
    } else if (currentStep === steps.length - 2) {
      // Last config step - deploy
      setLoading(true)
      setCurrentStep(steps.length - 1)

      try {
        // Create organization with full configuration
        await createOrganization()

        // Redirect after success
        setTimeout(() => {
          window.location.href = '/dashboard'
        }, 4000)
      } catch (error: any) {
        console.error('Setup failed:', error)
        setLoading(false)
      }
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1
      setCurrentStep(prevStep)
      localStorage.setItem('omnily-wizard-step', prevStep.toString())
    }
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      processLogoFile(file)
    }
  }

  const processLogoFile = (file: File) => {
    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('Il file è troppo grande. Massimo 2MB.')
      return
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Seleziona un file immagine valido.')
      return
    }

    // Create preview URL
    const reader = new FileReader()
    reader.onload = (event) => {
      const imageUrl = event.target?.result as string
      handleInputChange('logoUrl', imageUrl)
    }
    reader.readAsDataURL(file)
  }


  const createOrganization = async () => {
    try {
      console.log('🚀 Creating organization with wizard data...')
      console.log('Mode:', mode)

      // Call organization service with complete wizard data
      const result = await organizationService.createOrganization(formData, user, mode)

      if (result.success) {
        console.log('Organization created successfully:', result.organization.name)
        console.log('🌐 Subdomain:', result.subdomain)
        console.log('Dashboard URL:', result.dashboardUrl)

        // Store organization data for redirect
        localStorage.setItem('newOrganization', JSON.stringify(result))

        // Pulisci i dati del wizard completato
        localStorage.removeItem('omnily-wizard-data')
        localStorage.removeItem('omnily-wizard-step')

        // If in admin mode and callback provided, call it
        if (mode === 'admin' && onComplete) {
          onComplete(result)
        }

        return result
      } else {
        throw new Error(result.error || 'Failed to create organization')
      }

    } catch (error: any) {
      console.error('❌ Organization creation failed:', error)
      // Show error to user
      alert('Errore nella creazione dell\'organizzazione: ' + (error as Error).message)
      throw error
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      // Step 0: Welcome (or Plan Selection in admin mode)
      case 0:
        // ADMIN MODE: Plan Selection
        if (mode === 'admin') {
          return (
            <div className="wizard-content-wrapper">
              <div className="wizard-page-header">
                <h2>
                  <CreditCard size={32} color="#3b82f6" />
                  Selezione Piano Abbonamento
                </h2>
                <p>Seleziona il piano di abbonamento per la nuova organizzazione</p>
              </div>

              <div className="wizard-info-box">
                <div className="wizard-info-box-icon">
                  <AlertCircle size={20} />
                </div>
                <div className="wizard-info-box-content">
                  <p>Il piano selezionato determinerà le funzionalità disponibili e il prezzo mensile dell'abbonamento.</p>
                </div>
              </div>

              {/* Plans Grid - Dynamic from database */}
              {plansLoading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  Caricamento piani...
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginTop: '24px' }}>
                  {availablePlans.map((plan) => {
                    const isSelected = formData.planId === plan.id

                    // Build features list
                    const featuresCount = Object.values(plan.features).filter(Boolean).length

                    return (
                      <div
                        key={plan.id}
                        onClick={() => setFormData({ ...formData, planId: plan.id })}
                        style={{
                          background: isSelected ? `linear-gradient(135deg, ${plan.color} 0%, ${plan.color}dd 100%)` : 'white',
                          border: isSelected ? `3px solid ${plan.color}` : '2px solid #e2e8f0',
                          borderRadius: '16px',
                          padding: '24px',
                          cursor: 'pointer',
                          transition: 'all 0.3s',
                          boxShadow: isSelected ? `0 8px 24px ${plan.color}40` : '0 2px 8px rgba(0,0,0,0.05)',
                          color: isSelected ? 'white' : '#1e293b',
                          position: 'relative',
                          transform: plan.is_popular ? 'scale(1.05)' : 'scale(1)'
                        }}
                      >
                        {plan.badge_text && (
                          <div style={{
                            position: 'absolute',
                            top: '-12px',
                            right: '20px',
                            background: '#10b981',
                            color: 'white',
                            padding: '4px 12px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '700'
                          }}>
                            {plan.badge_text}
                          </div>
                        )}
                        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                          <div style={{ fontSize: '14px', fontWeight: '600', textTransform: 'uppercase', marginBottom: '8px', opacity: 0.9 }}>
                            {plan.name}
                          </div>
                          <div style={{ fontSize: '36px', fontWeight: '800', marginBottom: '4px' }}>
                            €{plan.price_monthly}
                          </div>
                          <div style={{ fontSize: '14px', opacity: 0.8 }}>
                            al mese
                          </div>
                        </div>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '14px', lineHeight: '1.8' }}>
                          <li>✓ {plan.limits.maxCustomers ? `Fino a ${plan.limits.maxCustomers} clienti` : 'Clienti illimitati'}</li>
                          {plan.features.loyaltyPrograms && <li>✓ Programmi fedeltà</li>}
                          {plan.features.emailMarketing && <li>✓ Email Marketing</li>}
                          {plan.features.smsMarketing && <li>✓ SMS Marketing</li>}
                          {plan.features.posEnabled && <li>✓ Sistema POS</li>}
                          {plan.features.advancedAnalytics && <li>✓ Analytics avanzati</li>}
                          {plan.features.customBranding && <li>✓ Branding personalizzato</li>}
                          {plan.features.prioritySupport && <li>✓ Supporto prioritario</li>}
                          <li style={{ opacity: 0.7, marginTop: '8px' }}>+ {featuresCount} funzionalità totali</li>
                        </ul>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Selected Plan Summary */}
              {formData.planId && (() => {
                const selectedPlan = availablePlans.find(p => p.id === formData.planId)
                if (!selectedPlan) return null

                return (
                  <div style={{
                    marginTop: '24px',
                    padding: '20px',
                    background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                    borderRadius: '12px',
                    border: '2px solid #86efac'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <CheckCircle2 size={24} color="#22c55e" />
                      <div>
                        <div style={{ fontSize: '16px', fontWeight: '600', color: '#166534' }}>
                          Piano selezionato: {selectedPlan.name} - €{selectedPlan.price_monthly}/mese
                        </div>
                        <div style={{ fontSize: '14px', color: '#15803d', marginTop: '4px' }}>
                          Il business owner riceverà un link per completare il pagamento e attivare l'account.
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })()}

            </div>
          )
        }

        // CLIENT MODE: Command Center - Dynamic Overview Dashboard
        const calculateProgress = (step: number) => {
          // Calculate completion % for each section based on formData
          switch (step) {
            case 1: return formData.organizationName && formData.partitaIVA ? 100 : 0
            case 2: return formData.pointsName && formData.pointsPerEuro ? 80 : 0
            case 3: return formData.productCategories?.length > 0 ? 60 : 0
            case 4: return formData.defaultRewards?.length > 0 ? 70 : 0
            case 5: return formData.primaryColor ? 90 : 0
            case 6: return 40 // Channels
            case 7: return 30 // Marketing
            case 8: return formData.teamMembers?.length > 0 ? 50 : 0
            case 9: return 20 // POS
            case 10: return 10 // Notifications
            case 11: return 0 // Final
            default: return 0
          }
        }

        const sectionGroups = [
          {
            title: 'Setup Base',
            sections: [
              { step: 1, icon: Building2, label: 'Organizzazione', progress: calculateProgress(1) },
              { step: 2, icon: Award, label: 'Loyalty System', progress: calculateProgress(2) },
              { step: 3, icon: Package, label: 'Prodotti', progress: calculateProgress(3) },
            ]
          },
          {
            title: 'Configurazione',
            sections: [
              { step: 4, icon: Gift, label: 'Rewards', progress: calculateProgress(4) },
              { step: 5, icon: Palette, label: 'Branding', progress: calculateProgress(5) },
              { step: 6, icon: Globe, label: 'Canali', progress: calculateProgress(6) },
            ]
          },
          {
            title: 'Operazioni',
            sections: [
              { step: 7, icon: BarChart3, label: 'Marketing', progress: calculateProgress(7) },
              { step: 8, icon: Users, label: 'Team', progress: calculateProgress(8) },
              { step: 9, icon: CreditCard, label: 'POS', progress: calculateProgress(9) },
            ]
          }
        ]

        return (
          <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              <div style={{ display: 'inline-block', padding: '12px 24px', background: 'linear-gradient(135deg, #60a5fa, #3b82f6)', borderRadius: '12px', marginBottom: '16px' }}>
                <Award size={32} color="white" />
              </div>
              <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '12px', color: '#1e293b' }}>
                Command Center
              </h1>
              <p style={{ fontSize: '16px', color: '#64748b', maxWidth: '600px', margin: '0 auto' }}>
                Dashboard di controllo per la creazione della nuova azienda enterprise
              </p>
            </div>

            {/* Live Organization Preview */}
            {formData.organizationName && (
              <div style={{
                background: 'white',
                borderRadius: '16px',
                padding: '24px',
                marginBottom: '32px',
                border: '2px solid #e2e8f0',
                boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
              }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#1e293b' }}>
                  📋 Anteprima Organizzazione
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Nome Azienda</div>
                    <div style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>{formData.organizationName || '-'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>P.IVA</div>
                    <div style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>{formData.partitaIVA || '-'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Settore</div>
                    <div style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>{formData.industry || '-'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Colore Brand</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: formData.primaryColor || '#60a5fa', border: '2px solid #e2e8f0' }} />
                      <span style={{ fontSize: '14px', color: '#64748b' }}>{formData.primaryColor || 'Non impostato'}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Sections Grid with Progress */}
            <div style={{ display: 'grid', gap: '24px' }}>
              {sectionGroups.map((group, idx) => (
                <div key={idx}>
                  <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#64748b', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {group.title}
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                    {group.sections.map((section) => {
                      const IconComponent = section.icon
                      return (
                        <div
                          key={section.step}
                          onClick={() => setCurrentStep(section.step)}
                          style={{
                            background: 'white',
                            borderRadius: '12px',
                            padding: '20px',
                            border: '2px solid #e2e8f0',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = '#60a5fa'
                            e.currentTarget.style.transform = 'translateY(-2px)'
                            e.currentTarget.style.boxShadow = '0 8px 16px rgba(96,165,250,0.15)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = '#e2e8f0'
                            e.currentTarget.style.transform = 'translateY(0)'
                            e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                            <div style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '10px',
                              background: `linear-gradient(135deg, ${section.progress > 0 ? '#10b981' : '#60a5fa'}, ${section.progress > 0 ? '#059669' : '#3b82f6'})`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              <IconComponent size={20} color="white" />
                            </div>
                            <div style={{
                              fontSize: '12px',
                              fontWeight: '600',
                              color: section.progress === 100 ? '#10b981' : section.progress > 0 ? '#f59e0b' : '#94a3b8',
                              background: section.progress === 100 ? '#d1fae5' : section.progress > 0 ? '#fef3c7' : '#f1f5f9',
                              padding: '4px 8px',
                              borderRadius: '6px'
                            }}>
                              {section.progress === 100 ? '✓ Completo' : section.progress > 0 ? `${section.progress}%` : 'Da fare'}
                            </div>
                          </div>
                          <div style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', marginBottom: '4px' }}>
                            {section.label}
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>
                            Step {section.step} / {steps.length - 1}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )

      // Step 1: Organization Details + P.IVA
      case 1:
        return (
          <div className="wizard-content-wrapper">
            <div className="wizard-page-header">
              <h2>
                <Building2 size={32} color="#3b82f6" />
                Dettagli Organizzazione
              </h2>
              <p>Configura i dati aziendali principali con validazione automatica P.IVA</p>
            </div>

            {/* Info Box */}
            <div className="wizard-info-box">
              <div className="wizard-info-box-icon">
                <AlertCircle size={20} />
              </div>
              <div className="wizard-info-box-content">
                <p>Inizia inserendo i tuoi dati personali come proprietario dell'azienda</p>
              </div>
            </div>

            {/* Owner Data Card - PRIMO! */}
            <div className="wizard-form-card">
              <h3><User size={20} /> Dati Proprietario</h3>

              {/* Avatar Upload Section */}
              <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '120px',
                    height: '120px',
                    borderRadius: '50%',
                    border: '3px solid #e5e7eb',
                    background: formData.ownerAvatarUrl ? `url(${formData.ownerAvatarUrl})` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '48px',
                    fontWeight: 'bold',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}>
                    {!formData.ownerAvatarUrl && (formData.ownerFirstName?.[0] || 'U')}
                  </div>
                  <input
                    type="file"
                    id="ownerAvatar"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        const reader = new FileReader()
                        reader.onload = (e) => {
                          handleInputChange('ownerAvatarUrl', e.target?.result as string)
                        }
                        reader.readAsDataURL(file)
                      }
                    }}
                  />
                  <label
                    htmlFor="ownerAvatar"
                    style={{
                      padding: '8px 16px',
                      background: 'linear-gradient(to right, #60a5fa, #3b82f6)',
                      color: 'white',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: '500',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Upload size={16} />
                    Carica Foto
                  </label>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>
                    Foto Profilo Proprietario
                  </p>
                  <p style={{ margin: 0, fontSize: '13px', color: '#64748b', lineHeight: '1.5' }}>
                    Carica una foto professionale del proprietario. Questa sarà utilizzata nel profilo admin e nelle comunicazioni ufficiali.
                  </p>
                </div>
              </div>

              <div className="wizard-form-row">
                <div className="wizard-form-group">
                  <label>Nome Proprietario *</label>
                  <input
                    type="text"
                    placeholder="Mario"
                    value={formData.ownerFirstName || ''}
                    onChange={(e) => handleInputChange('ownerFirstName', e.target.value)}
                    required
                  />
                </div>
                <div className="wizard-form-group">
                  <label>Cognome Proprietario *</label>
                  <input
                    type="text"
                    placeholder="Rossi"
                    value={formData.ownerLastName || ''}
                    onChange={(e) => handleInputChange('ownerLastName', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="wizard-form-row">
                <div className="wizard-form-group">
                  <label><Mail size={16} /> Email Proprietario *</label>
                  <input
                    type="email"
                    placeholder="mario.rossi@example.com"
                    value={formData.ownerEmail || ''}
                    onChange={(e) => handleInputChange('ownerEmail', e.target.value)}
                    required
                  />
                </div>
                <div className="wizard-form-group">
                  <label><Phone size={16} /> Telefono Proprietario *</label>
                  <input
                    type="tel"
                    placeholder="+39 333 1234567"
                    value={formData.ownerPhone || ''}
                    onChange={(e) => handleInputChange('ownerPhone', e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Dati Fiscali Card */}
            <div className="wizard-form-card">
              <h3><Shield size={20} /> Dati Fiscali Azienda</h3>

              <div className="wizard-form-row">
                <div className="wizard-form-group">
                  <label>Partita IVA 🇮🇹</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      placeholder="12345678901"
                      value={formData.partitaIVA}
                      onChange={(e) => handlePartitaIVAChange(e.target.value)}
                      maxLength={11}
                      style={{
                        paddingRight: validatingVAT || vatValidated ? '40px' : '16px'
                      }}
                    />
                    {validatingVAT && (
                      <div style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#3b82f6'
                      }}>
                        <div className="wizard-spinner" style={{ width: '20px', height: '20px', border: '2px solid #f3f4f6', borderTop: '2px solid #3b82f6' }}></div>
                      </div>
                    )}
                    {vatValidated && !validatingVAT && (
                      <div style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#10b981'
                      }}>
                        <CheckCircle2 size={20} />
                      </div>
                    )}
                  </div>
                  <small className="wizard-form-hint">
                    {vatValidated ? '✅ Dati azienda caricati automaticamente' : 'Auto-compilazione dati azienda dal registro'}
                  </small>
                </div>
                <div className="wizard-form-group">
                  <label>Codice Fiscale</label>
                  <input
                    type="text"
                    placeholder="RSSMRA80A01H501Z"
                    value={formData.codiceFiscale}
                    onChange={(e) => handleInputChange('codiceFiscale', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Company Data Card */}
            <div className="wizard-form-card">
              <h3><Building2 size={20} /> Informazioni Azienda</h3>

              <div className="wizard-form-group">
                <label>Nome Organizzazione</label>
                <input
                  type="text"
                  placeholder="La Mia Pizzeria S.r.l."
                  value={formData.organizationName}
                  onChange={(e) => handleInputChange('organizationName', e.target.value)}
                />
              </div>

              <div className="wizard-form-row">
                <div className="wizard-form-group">
                  <label>Settore</label>
                  <select
                    value={formData.industry}
                    onChange={(e) => handleInputChange('industry', e.target.value)}
                  >
                    {industries.map(industry => (
                      <option key={industry.value} value={industry.value}>
                        {industry.label}
                      </option>
                    ))}
                  </select>
                  {/* Template Applicator Badge - Only visible in Admin Mode or if user clicks magic wand */}
                  <div style={{ marginTop: '8px' }}>
                    <button
                      type="button"
                      onClick={() => applyIndustryTemplate(formData.industry)}
                      style={{
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '6px 12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <Zap size={12} fill="white" />
                      Applica Template {formData.industry === 'retail' ? 'Retail' :
                        formData.industry === 'restaurant' ? 'Ristorazione' :
                          formData.industry === 'beauty' ? 'Beauty' :
                            formData.industry === 'gym' ? 'Palestra' :
                              formData.industry === 'grocery' ? 'Market' : 'Standard'}
                    </button>
                    <small style={{ display: 'block', marginTop: '4px', color: '#64748b', fontSize: '11px' }}>
                      Sovrascrive rewards, colori e impostazioni con i valori consigliati per il settore.
                    </small>
                  </div>
                </div>
                <div className="wizard-form-group">
                  <label>Dimensione Team</label>
                  <select
                    value={formData.teamSize}
                    onChange={(e) => handleInputChange('teamSize', e.target.value)}
                  >
                    {teamSizes.map(size => (
                      <option key={size.value} value={size.value}>
                        {size.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="wizard-form-group">
                <label>Indirizzo Completo</label>
                <input
                  type="text"
                  placeholder="Via Roma 123"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                />
              </div>

              <div className="wizard-form-row">
                <div className="wizard-form-group">
                  <label>Città</label>
                  <input
                    type="text"
                    placeholder="Milano"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                  />
                </div>
                <div className="wizard-form-group">
                  <label>Provincia</label>
                  <input
                    type="text"
                    placeholder="MI"
                    value={formData.province}
                    onChange={(e) => handleInputChange('province', e.target.value)}
                    maxLength={2}
                    style={{ textTransform: 'uppercase' }}
                  />
                </div>
                <div className="wizard-form-group">
                  <label>CAP</label>
                  <input
                    type="text"
                    placeholder="20100"
                    value={formData.cap}
                    onChange={(e) => handleInputChange('cap', e.target.value)}
                    maxLength={5}
                  />
                </div>
              </div>
            </div>

            {/* Contacts Card */}
            <div className="wizard-form-card">
              <h3><Phone size={20} /> Informazioni di Contatto</h3>

              <div className="wizard-form-row">
                <div className="wizard-form-group">
                  <label><Phone size={16} /> Telefono Aziendale</label>
                  <input
                    type="tel"
                    placeholder="+39 02 1234567"
                    value={formData.phoneNumber}
                    onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                  />
                </div>
                <div className="wizard-form-group">
                  <label><Mail size={16} /> Email Aziendale</label>
                  <input
                    type="email"
                    placeholder="info@miazienda.it"
                    value={formData.businessEmail}
                    onChange={(e) => handleInputChange('businessEmail', e.target.value)}
                  />
                </div>
              </div>

              <div className="wizard-form-row">
                <div className="wizard-form-group">
                  <label><Globe2 size={16} /> Sito Web</label>
                  <input
                    type="url"
                    placeholder="https://www.miazienda.it"
                    value={formData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                  />
                </div>
                <div className="wizard-form-group">
                  <label><MessageSquare size={16} /> Tagline/Slogan</label>
                  <input
                    type="text"
                    placeholder="La migliore pizza della città"
                    value={formData.tagline}
                    onChange={(e) => handleInputChange('tagline', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Logo Upload - remains in Contacts card */}
            <div className="wizard-form-card">
              <h3><Upload size={20} /> Logo Aziendale</h3>

              {/* Upload logo */}
              <div className={styles.formGroup}>
                <label className={styles.label}><Building2 size={16} className={styles.labelIcon} /> Logo Aziendale</label>

                <div className={styles.logoUploadZone}>
                  {/* Layout sempre uguale: Pulsante + Anteprima affiancati */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>

                    {/* Pulsante upload sempre visibile */}
                    <div>
                      <input
                        type="file"
                        id="logoUpload"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => handleLogoUpload(e)}
                      />

                      <label
                        htmlFor="logoUpload"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '12px 24px',
                          backgroundColor: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontWeight: '600',
                          fontSize: '16px',
                          cursor: 'pointer',
                          textDecoration: 'none'
                        }}
                      >
                        <Upload size={18} />
                        {formData.logoUrl ? 'Sostituisci Logo' : 'Carica Logo'}
                      </label>

                      <div style={{ marginTop: '8px' }}>
                        <small style={{ color: '#9ca3af', fontSize: '12px' }}>
                          JPG, PNG, SVG • Max 2MB
                        </small>
                      </div>
                    </div>

                    {/* Anteprima logo */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      flex: '1'
                    }}>
                      <div style={{
                        width: '80px',
                        height: '80px',
                        border: '2px solid #e5e7eb',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#f9fafb',
                        overflow: 'hidden'
                      }}>
                        {formData.logoUrl ? (
                          <img
                            src={formData.logoUrl}
                            alt="Logo preview"
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'contain'
                            }}
                          />
                        ) : (
                          <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            color: '#9ca3af'
                          }}>
                            <Building2 size={24} />
                            <small style={{ fontSize: '10px', marginTop: '4px' }}>Preview</small>
                          </div>
                        )}
                      </div>

                      {/* Pulsante rimuovi quando c'è il logo */}
                      {formData.logoUrl && (
                        <button
                          type="button"
                          onClick={() => handleInputChange('logoUrl', '')}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '8px 12px',
                            backgroundColor: '#fef2f2',
                            border: '1px solid #fecaca',
                            borderRadius: '6px',
                            fontSize: '14px',
                            cursor: 'pointer',
                            color: '#dc2626'
                          }}
                        >
                          <X size={14} />
                          Rimuovi
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="wizard-nav-buttons">
              <button className="wizard-btn wizard-btn-back" onClick={() => setCurrentStep(0)}>
                <ArrowLeft size={18} />
                Indietro
              </button>
              <button className="wizard-btn wizard-btn-next" onClick={() => setCurrentStep(2)}>
                Continua
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )

      // Step 2: Loyalty System Setup
      case 2:
        return (
          <div className="wizard-content-wrapper">
            <div className="wizard-page-header">
              <h2>
                <Gift size={32} color="#3b82f6" />
                Sistema Loyalty
              </h2>
              <p>Configura punti, rewards e meccaniche di fidelizzazione</p>
            </div>

            <div className="wizard-info-box">
              <div className="wizard-info-box-icon">
                <Star size={20} />
              </div>
              <div className="wizard-info-box-content">
                <p>Crea un sistema personalizzato per premiare i tuoi clienti fedeli</p>
              </div>
            </div>

            {/* Card 1: Configurazione Base */}
            <div className="wizard-form-card">
              <h3><Award size={20} /> Configurazione Base</h3>

              <div className="wizard-form-row">
                <div className="wizard-form-group">
                  <label>Nome Punti</label>
                  <input
                    type="text"
                    placeholder="Gemme, Stelline, Punti..."
                    value={formData.pointsName}
                    onChange={(e) => handleInputChange('pointsName', e.target.value)}
                  />
                </div>
                <div className="wizard-form-group">
                  <label>Punti per Euro</label>
                  <input
                    type="number"
                    placeholder="1"
                    value={formData.pointsPerEuro}
                    onChange={(e) => handleInputChange('pointsPerEuro', e.target.value)}
                  />
                </div>
              </div>

              <div className="wizard-form-row">
                <div className="wizard-form-group">
                  <label>Soglia Reward</label>
                  <input
                    type="number"
                    placeholder="100"
                    value={formData.rewardThreshold}
                    onChange={(e) => handleInputChange('rewardThreshold', e.target.value)}
                  />
                  <small className="wizard-form-hint">Punti necessari per un reward</small>
                </div>
                <div className="wizard-form-group">
                  <label>Bonus Benvenuto</label>
                  <input
                    type="number"
                    placeholder="50"
                    value={formData.welcomeBonus}
                    onChange={(e) => handleInputChange('welcomeBonus', e.target.value)}
                  />
                  <small className="wizard-form-hint">Punti regalo per nuovi clienti</small>
                </div>
              </div>

              <div className="wizard-form-row">
                <div className="wizard-form-group">
                  <label>Scadenza Punti (mesi)</label>
                  <input
                    type="number"
                    placeholder="12"
                    value={formData.pointsExpiry}
                    onChange={(e) => handleInputChange('pointsExpiry', e.target.value)}
                  />
                  <small className="wizard-form-hint">0 = mai scadono</small>
                </div>
                <div className="wizard-form-group">
                  <label>Sistema Livelli Clienti</label>
                  <div className="wizard-toggle-group">
                    <div className="wizard-toggle-info">
                      <h4>Abilita livelli personalizzati</h4>
                      <p>I clienti salgono di livello accumulando punti</p>
                    </div>
                    <div
                      className={`wizard-toggle-switch ${formData.enableTierSystem ? 'active' : ''}`}
                      onClick={() => handleInputChange('enableTierSystem', !formData.enableTierSystem)}
                    >
                      <div className="wizard-toggle-slider"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Livelli Loyalty (conditional) */}
            {formData.enableTierSystem && (
              <div className="wizard-form-card">
                <h3><Award size={20} /> I Tuoi Livelli Loyalty</h3>
                <p style={{ color: '#6b7280', marginBottom: '20px', fontSize: '14px' }}>
                  Crea livelli personalizzati per la tua attività. Esempio: "Pizza Lover → Pizza Master → Pizza Legend"
                </p>

                {formData.loyaltyTiers.map((tier: any, index: any) => (
                  <div key={index} style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '20px',
                    marginBottom: '16px',
                    backgroundColor: '#fafafa'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      marginBottom: '16px'
                    }}>
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '6px',
                          background: tier.gradient
                            ? `linear-gradient(135deg, ${tier.color}, ${tier.gradientEnd})`
                            : tier.color
                        }}
                      ></div>
                      <span style={{ fontWeight: '600', fontSize: '15px' }}>Livello {index + 1}</span>
                      {formData.loyaltyTiers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const newTiers = formData.loyaltyTiers.filter((_: any, i: any) => i !== index)
                            handleInputChange('loyaltyTiers', newTiers)
                          }}
                          style={{
                            marginLeft: 'auto',
                            padding: '6px 12px',
                            backgroundColor: '#fef2f2',
                            border: '1px solid #fecaca',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            color: '#dc2626',
                            fontSize: '14px'
                          }}
                        >
                          ✕ Rimuovi
                        </button>
                      )}
                    </div>

                    <div className="wizard-form-row">
                      <div className="wizard-form-group">
                        <label>Nome Livello</label>
                        <input
                          type="text"
                          value={tier.name}
                          onChange={(e) => {
                            const newTiers = [...formData.loyaltyTiers]
                            newTiers[index].name = e.target.value
                            handleInputChange('loyaltyTiers', newTiers)
                          }}
                          placeholder="Es: Pizza Lover, Beauty Expert, Coffee Master..."
                        />
                      </div>

                      <div className="wizard-form-group">
                        <label>Soglia Punti</label>
                        <input
                          type="number"
                          value={tier.threshold}
                          onChange={(e) => {
                            const newTiers = [...formData.loyaltyTiers]
                            newTiers[index].threshold = e.target.value
                            handleInputChange('loyaltyTiers', newTiers)
                          }}
                          placeholder="0"
                        />
                        <small className="wizard-form-hint">Punti necessari per raggiungere questo livello</small>
                      </div>

                      <div className="wizard-form-group">
                        <label>Moltiplicatore</label>
                        <input
                          type="text"
                          value={`x${tier.multiplier}`}
                          onChange={(e) => {
                            const newTiers = [...formData.loyaltyTiers]
                            newTiers[index].multiplier = e.target.value.replace('x', '')
                            handleInputChange('loyaltyTiers', newTiers)
                          }}
                          placeholder="x1.5"
                        />
                        <small className="wizard-form-hint">Punti extra per gli acquisti a questo livello</small>
                      </div>
                    </div>

                    <div style={{ marginTop: '16px' }}>
                      <div className="wizard-form-group">
                        <label>Personalizzazione Colore</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                          <input
                            type="color"
                            value={tier.color}
                            onChange={(e) => {
                              const newTiers = [...formData.loyaltyTiers]
                              newTiers[index].color = e.target.value
                              handleInputChange('loyaltyTiers', newTiers)
                            }}
                            title="Colore principale"
                            style={{
                              width: '50px',
                              height: '40px',
                              border: '1px solid #e5e7eb',
                              borderRadius: '6px',
                              cursor: 'pointer'
                            }}
                          />
                          <div className="wizard-toggle-group" style={{ margin: 0 }}>
                            <div className="wizard-toggle-info">
                              <h4>Abilita Gradiente</h4>
                              <p>Usa due colori per creare un effetto gradiente</p>
                            </div>
                            <div
                              className={`wizard-toggle-switch ${tier.gradient ? 'active' : ''}`}
                              onClick={() => {
                                const newTiers = [...formData.loyaltyTiers]
                                newTiers[index].gradient = !tier.gradient
                                handleInputChange('loyaltyTiers', newTiers)
                              }}
                            >
                              <div className="wizard-toggle-slider"></div>
                            </div>
                          </div>
                          {tier.gradient && (
                            <input
                              type="color"
                              value={tier.gradientEnd}
                              onChange={(e) => {
                                const newTiers = [...formData.loyaltyTiers]
                                newTiers[index].gradientEnd = e.target.value
                                handleInputChange('loyaltyTiers', newTiers)
                              }}
                              title="Colore finale gradiente"
                              style={{
                                width: '50px',
                                height: '40px',
                                border: '1px solid #e5e7eb',
                                borderRadius: '6px',
                                cursor: 'pointer'
                              }}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => {
                    const newTiers = [...formData.loyaltyTiers, {
                      name: 'Nuovo Livello',
                      threshold: String(Math.max(...formData.loyaltyTiers.map((t: any) => parseInt(t.threshold) || 0)) + 200),
                      multiplier: '1.2',
                      color: '#10b981',
                      gradient: false,
                      gradientEnd: '#10b981'
                    }]
                    handleInputChange('loyaltyTiers', newTiers)
                  }}
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: '#f0f9ff',
                    border: '2px dashed #3b82f6',
                    borderRadius: '8px',
                    color: '#3b82f6',
                    fontSize: '15px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  + Aggiungi Livello
                </button>
              </div>
            )}

            {/* Card 3: Anteprima Sistema */}
            <div className="wizard-form-card">
              <h3><Star size={20} /> Anteprima Sistema</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '6px' }}>
                  <Star size={16} color="#3b82f6" />
                  <span style={{ fontSize: '14px' }}>1€ di spesa = {formData.pointsPerEuro} {formData.pointsName}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '6px' }}>
                  <Gift size={16} color="#3b82f6" />
                  <span style={{ fontSize: '14px' }}>{formData.rewardThreshold} {formData.pointsName} = 1 Reward</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '6px' }}>
                  <Award size={16} color="#3b82f6" />
                  <span style={{ fontSize: '14px' }}>Bonus registrazione: {formData.welcomeBonus} {formData.pointsName}</span>
                </div>
                {formData.enableTierSystem && formData.loyaltyTiers.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '6px' }}>
                    <Shield size={16} color="#3b82f6" />
                    <span style={{ fontSize: '14px' }}>Livelli: {formData.loyaltyTiers.map((tier: any) => `${tier.name} x${tier.multiplier}`).join(', ')}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="wizard-nav-buttons">
              <button className="wizard-btn wizard-btn-back" onClick={() => setCurrentStep(1)}>
                <ArrowLeft size={18} />
                Indietro
              </button>
              <button className="wizard-btn wizard-btn-next" onClick={() => setCurrentStep(3)}>
                Continua
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )

      // Step 3: Products & Categories
      case 3:
        return (
          <div className="wizard-content-wrapper">
            <div className="wizard-page-header">
              <h2>
                <Package size={32} color="#3b82f6" />
                Prodotti e Categorie
              </h2>
              <p>Configura catalogo prodotti e moltiplicatori per categoria</p>
            </div>

            <div className="wizard-info-box">
              <div className="wizard-info-box-icon">
                <AlertCircle size={20} />
              </div>
              <div className="wizard-info-box-content">
                <p>Organizza il tuo catalogo prodotti e applica moltiplicatori punti per categoria</p>
              </div>
            </div>

            {/* Card 1: Import Catalogo */}
            <div className="wizard-form-card">
              <h3><Settings size={20} /> Import Catalogo Prodotti</h3>

              <div className="wizard-form-row">
                <div className="wizard-form-group">
                  <label>Sincronizzazione Automatica</label>
                  <div className="wizard-toggle-group">
                    <div className="wizard-toggle-info">
                      <h4>Importa automaticamente dal POS/E-commerce</h4>
                      <p>Sincronizza prodotti e prezzi in tempo reale</p>
                    </div>
                    <div
                      className={`wizard-toggle-switch ${formData.importProducts ? 'active' : ''}`}
                      onClick={() => handleInputChange('importProducts', !formData.importProducts)}
                    >
                      <div className="wizard-toggle-slider"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Categorie Prodotti */}
            <div className="wizard-form-card">
              <h3><Package size={20} /> Categorie Prodotti</h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {formData.productCategories.map((category: any, index: any) => (
                  <div key={index} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb'
                  }}>
                    <input
                      type="text"
                      value={category}
                      onChange={(e) => {
                        const newCategories = [...formData.productCategories]
                        newCategories[index] = e.target.value
                        handleInputChange('productCategories', newCategories)
                      }}
                      placeholder="Nome categoria"
                      style={{ flex: 1 }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newCategories = formData.productCategories.filter((_: any, i: any) => i !== index)
                        handleInputChange('productCategories', newCategories)
                      }}
                      style={{
                        padding: '8px 12px',
                        backgroundColor: '#fef2f2',
                        border: '1px solid #fecaca',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        color: '#dc2626',
                        fontSize: '14px'
                      }}
                    >
                      ✕ Rimuovi
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => {
                    const newCategories = [...formData.productCategories, '']
                    handleInputChange('productCategories', newCategories)
                  }}
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: '#f0f9ff',
                    border: '2px dashed #3b82f6',
                    borderRadius: '8px',
                    color: '#3b82f6',
                    fontSize: '15px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  + Aggiungi Categoria
                </button>
              </div>
            </div>

            {/* Card 3: Moltiplicatori per Categoria */}
            <div className="wizard-form-card">
              <h3><Zap size={20} /> Moltiplicatori per Categoria</h3>
              <p style={{ color: '#6b7280', marginBottom: '20px', fontSize: '14px' }}>
                Imposta moltiplicatori punti per incentivare l'acquisto di determinate categorie
              </p>

              {formData.bonusCategories.map((bonus: any, index: any) => (
                <div key={index} className="wizard-form-row">
                  <div className="wizard-form-group">
                    <label>{bonus.category}</label>
                    <input
                      type="text"
                      value={`x${bonus.multiplier}`}
                      onChange={(e) => {
                        const newBonuses = [...formData.bonusCategories]
                        newBonuses[index].multiplier = e.target.value.replace('x', '')
                        handleInputChange('bonusCategories', newBonuses)
                      }}
                      placeholder="x1.2"
                    />
                    <small className="wizard-form-hint">Moltiplicatore punti per questa categoria</small>
                  </div>
                </div>
              ))}
            </div>

            {/* Card 4: Anteprima Moltiplicatori */}
            <div className="wizard-form-card">
              <h3><BarChart3 size={20} /> Anteprima Moltiplicatori</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {formData.bonusCategories.map((bonus: any, index: any) => (
                  <div key={index} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '6px'
                  }}>
                    <Star size={16} color="#3b82f6" />
                    <span style={{ fontSize: '14px' }}>{bonus.category}: {bonus.multiplier}x punti</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="wizard-nav-buttons">
              <button className="wizard-btn wizard-btn-back" onClick={() => setCurrentStep(2)}>
                <ArrowLeft size={18} />
                Indietro
              </button>
              <button className="wizard-btn wizard-btn-next" onClick={() => setCurrentStep(4)}>
                Continua
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )

      // Step 4: Rewards Configuration
      case 4:
        return (
          <div className="wizard-content-wrapper">
            <div className="wizard-page-header">
              <h2>
                <Star size={32} color="#3b82f6" />
                Configurazione Rewards
              </h2>
              <p>Configura premi predefiniti e tipologie di rewards</p>
            </div>

            <div className="wizard-info-box">
              <div className="wizard-info-box-icon">
                <AlertCircle size={20} />
              </div>
              <div className="wizard-info-box-content">
                <p>Crea premi accattivanti per incentivare la fedeltà dei tuoi clienti</p>
              </div>
            </div>

            {/* Card 1: Tipologie Reward */}
            <div className="wizard-form-card">
              <h3><Gift size={20} /> Tipologie Reward Abilitate</h3>

              <div className="wizard-form-row">
                <div className="wizard-form-group">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {[
                      { value: 'discount', label: 'Sconto in Euro', description: 'Offri sconti diretti sul totale acquisto' },
                      { value: 'freeProduct', label: 'Prodotto Gratuito', description: 'Regala prodotti specifici ai clienti fedeli' },
                      { value: 'cashback', label: 'Cashback', description: 'Restituisci una percentuale dell\'importo speso' }
                    ].map(type => (
                      <div key={type.value} className="wizard-toggle-group">
                        <div className="wizard-toggle-info">
                          <h4>{type.label}</h4>
                          <p>{type.description}</p>
                        </div>
                        <div
                          className={`wizard-toggle-switch ${formData.rewardTypes.includes(type.value) ? 'active' : ''}`}
                          onClick={() => {
                            let newTypes = [...formData.rewardTypes]
                            if (formData.rewardTypes.includes(type.value)) {
                              newTypes = newTypes.filter((t: any) => t !== type.value)
                            } else {
                              newTypes.push(type.value)
                            }
                            handleInputChange('rewardTypes', newTypes)
                          }}
                        >
                          <div className="wizard-toggle-slider"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Rewards Predefiniti */}
            <div className="wizard-form-card">
              <h3><Star size={20} /> Rewards Predefiniti</h3>
              <p style={{ color: '#6b7280', marginBottom: '20px', fontSize: '14px' }}>
                Crea rewards disponibili per i tuoi clienti in base al livello di fedeltà
              </p>

              {formData.defaultRewards.map((reward: any, index: any) => (
                <div key={index} style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '20px',
                  marginBottom: '16px',
                  backgroundColor: '#fafafa'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '16px'
                  }}>
                    <span style={{ fontWeight: '600', fontSize: '15px' }}>Reward {index + 1}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const newRewards = formData.defaultRewards.filter((_: any, i: any) => i !== index)
                        handleInputChange('defaultRewards', newRewards)
                      }}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#fef2f2',
                        border: '1px solid #fecaca',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        color: '#dc2626',
                        fontSize: '14px'
                      }}
                    >
                      ✕ Rimuovi
                    </button>
                  </div>

                  <div className="wizard-form-row">
                    <div className="wizard-form-group">
                      <label>Punti Richiesti</label>
                      <input
                        type="number"
                        value={reward.points}
                        onChange={(e) => {
                          const newRewards = [...formData.defaultRewards]
                          newRewards[index].points = e.target.value
                          handleInputChange('defaultRewards', newRewards)
                        }}
                        placeholder="100"
                      />
                    </div>

                    <div className="wizard-form-group">
                      <label>Livello Richiesto</label>
                      <select
                        value={reward.requiredTier || 'Iniziale'}
                        onChange={(e) => {
                          const newRewards = [...formData.defaultRewards]
                          newRewards[index].requiredTier = e.target.value
                          handleInputChange('defaultRewards', newRewards)
                        }}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px',
                          fontSize: '14px',
                          backgroundColor: 'white'
                        }}
                      >
                        {formData.loyaltyTiers.map((tier: any) => (
                          <option key={tier.name} value={tier.name}>
                            {tier.name} ({tier.threshold}+ punti)
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="wizard-form-row">
                    <div className="wizard-form-group">
                      <label>Valore</label>
                      <input
                        type="text"
                        value={reward.value}
                        onChange={(e) => {
                          const newRewards = [...formData.defaultRewards]
                          newRewards[index].value = e.target.value
                          handleInputChange('defaultRewards', newRewards)
                        }}
                        placeholder="5"
                      />
                    </div>

                    <div className="wizard-form-group">
                      <label>Descrizione</label>
                      <input
                        type="text"
                        value={reward.description}
                        onChange={(e) => {
                          const newRewards = [...formData.defaultRewards]
                          newRewards[index].description = e.target.value
                          handleInputChange('defaultRewards', newRewards)
                        }}
                        placeholder="5€ di sconto"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={() => {
                  const newRewards = [...formData.defaultRewards, { points: '100', requiredTier: 'Iniziale', type: 'discount', value: '5', description: '5€ di sconto' }]
                  handleInputChange('defaultRewards', newRewards)
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#f0f9ff',
                  border: '2px dashed #3b82f6',
                  borderRadius: '8px',
                  color: '#3b82f6',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                + Aggiungi Reward
              </button>
            </div>

            {/* Navigation Buttons */}
            <div className="wizard-nav-buttons">
              <button className="wizard-btn wizard-btn-back" onClick={() => setCurrentStep(3)}>
                <ArrowLeft size={18} />
                Indietro
              </button>
              <button className="wizard-btn wizard-btn-next" onClick={() => setCurrentStep(5)}>
                Continua
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )

      // Step 5: Branding
      case 5:
        return (
          <div className="wizard-content-wrapper">
            <div className="wizard-page-header">
              <h2>
                <Palette size={32} color="#3b82f6" />
                Branding Aziendale
              </h2>
              <p>Personalizza colori e identità visiva della tua piattaforma</p>
            </div>

            <div className="wizard-info-box">
              <div className="wizard-info-box-icon">
                <AlertCircle size={20} />
              </div>
              <div className="wizard-info-box-content">
                <p>Definisci l'identità visiva del tuo programma loyalty</p>
              </div>
            </div>

            {/* Card 1: Colori Brand */}
            <div className="wizard-form-card">
              <h3><Palette size={20} /> Colori Brand</h3>

              <div className="wizard-form-row">
                <div className="wizard-form-group">
                  <label>Colore Primario</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <input
                      type="color"
                      value={formData.primaryColor}
                      onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                      style={{
                        width: '60px',
                        height: '40px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}
                    />
                    <input
                      type="text"
                      value={formData.primaryColor}
                      onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                      placeholder="#ef4444"
                      style={{ flex: 1 }}
                    />
                  </div>
                </div>

                <div className="wizard-form-group">
                  <label>Colore Secondario</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <input
                      type="color"
                      value={formData.secondaryColor}
                      onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
                      style={{
                        width: '60px',
                        height: '40px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}
                    />
                    <input
                      type="text"
                      value={formData.secondaryColor}
                      onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
                      placeholder="#dc2626"
                      style={{ flex: 1 }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Collegamenti Social */}
            <div className="wizard-form-card">
              <h3><Globe size={20} /> Collegamenti Social</h3>

              <div className="wizard-form-row">
                <div className="wizard-form-group">
                  <label><Globe size={16} /> Facebook</label>
                  <input
                    type="url"
                    placeholder="https://www.facebook.com/miazienda"
                    value={formData.facebookUrl}
                    onChange={(e) => handleInputChange('facebookUrl', e.target.value)}
                  />
                </div>
                <div className="wizard-form-group">
                  <label><Globe size={16} /> Instagram</label>
                  <input
                    type="url"
                    placeholder="https://www.instagram.com/miazienda"
                    value={formData.instagramUrl}
                    onChange={(e) => handleInputChange('instagramUrl', e.target.value)}
                  />
                </div>
              </div>

              <div className="wizard-form-row">
                <div className="wizard-form-group">
                  <label><Users size={16} /> LinkedIn</label>
                  <input
                    type="url"
                    placeholder="https://www.linkedin.com/company/miazienda"
                    value={formData.linkedinUrl}
                    onChange={(e) => handleInputChange('linkedinUrl', e.target.value)}
                  />
                </div>
                <div className="wizard-form-group">
                  <label><MessageSquare size={16} /> Twitter/X</label>
                  <input
                    type="url"
                    placeholder="https://twitter.com/miazienda"
                    value={formData.twitterUrl}
                    onChange={(e) => handleInputChange('twitterUrl', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Card 3: Anteprima Brand */}
            <div className="wizard-form-card">
              <h3><Palette size={20} /> Anteprima Brand</h3>
              <div style={{
                background: `linear-gradient(135deg, ${formData.primaryColor}, ${formData.secondaryColor})`,
                borderRadius: '12px',
                padding: '40px',
                textAlign: 'center',
                color: 'white'
              }}>
                <h3 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
                  {formData.organizationName || 'La Tua Azienda'}
                </h3>
                <p style={{ fontSize: '14px', opacity: 0.9, marginBottom: '20px' }}>
                  {formData.tagline || 'Sistema Loyalty Personalizzato'}
                </p>
                <div style={{
                  display: 'inline-block',
                  padding: '12px 24px',
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  fontWeight: '600',
                  backdropFilter: 'blur(10px)'
                }}>
                  Guadagna {formData.pointsName || 'Punti'}
                </div>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="wizard-nav-buttons">
              <button className="wizard-btn wizard-btn-back" onClick={() => setCurrentStep(4)}>
                <ArrowLeft size={18} />
                Indietro
              </button>
              <button className="wizard-btn wizard-btn-next" onClick={() => setCurrentStep(6)}>
                Continua
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )

      // Step 6: Channels Integration
      case 6:
        return (
          <div className="wizard-content-wrapper">
            <div className="wizard-page-header">
              <h2>
                <Globe size={32} color="#3b82f6" />
                Canali e Integrazione
              </h2>
              <p>Configura POS, E-commerce e canali di vendita</p>
            </div>

            <div className="wizard-info-box">
              <div className="wizard-info-box-icon">
                <AlertCircle size={20} />
              </div>
              <div className="wizard-info-box-content">
                <p>Seleziona i canali di vendita da integrare con il tuo programma loyalty</p>
              </div>
            </div>

            {/* Card 1: POS Fisico */}
            <div className="wizard-form-card">
              <h3><Settings size={20} /> POS Fisico</h3>

              <div className="wizard-form-row">
                <div className="wizard-form-group">
                  <div className="wizard-toggle-group">
                    <div className="wizard-toggle-info">
                      <h4>Abilita integrazione POS</h4>
                      <p>Integra il sistema loyalty con il tuo punto vendita</p>
                    </div>
                    <div
                      className={`wizard-toggle-switch ${formData.enablePOS ? 'active' : ''}`}
                      onClick={() => handleInputChange('enablePOS', !formData.enablePOS)}
                    >
                      <div className="wizard-toggle-slider"></div>
                    </div>
                  </div>
                </div>
              </div>

              {formData.enablePOS && (
                <div className="wizard-form-row">
                  <div className="wizard-form-group">
                    <label>Numero Dispositivi POS</label>
                    <input
                      type="number"
                      value={formData.posDevices}
                      onChange={(e) => handleInputChange('posDevices', e.target.value)}
                      min="1"
                      placeholder="1"
                    />
                    <small className="wizard-form-hint">Quanti terminali POS vuoi configurare?</small>
                  </div>
                </div>
              )}
            </div>

            {/* Card 2: E-commerce */}
            <div className="wizard-form-card">
              <h3><Globe size={20} /> E-commerce</h3>

              <div className="wizard-form-row">
                <div className="wizard-form-group">
                  <div className="wizard-toggle-group">
                    <div className="wizard-toggle-info">
                      <h4>Integra sito e-commerce</h4>
                      <p>Permetti ai clienti di guadagnare punti anche online</p>
                    </div>
                    <div
                      className={`wizard-toggle-switch ${formData.enableEcommerce ? 'active' : ''}`}
                      onClick={() => handleInputChange('enableEcommerce', !formData.enableEcommerce)}
                    >
                      <div className="wizard-toggle-slider"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: App Mobile */}
            <div className="wizard-form-card">
              <h3><Smartphone size={20} /> App Mobile</h3>

              <div className="wizard-form-row">
                <div className="wizard-form-group">
                  <div className="wizard-toggle-group">
                    <div className="wizard-toggle-info">
                      <h4>App loyalty dedicata</h4>
                      <p>App mobile brandizzata per i tuoi clienti</p>
                    </div>
                    <div
                      className={`wizard-toggle-switch ${formData.enableApp ? 'active' : ''}`}
                      onClick={() => handleInputChange('enableApp', !formData.enableApp)}
                    >
                      <div className="wizard-toggle-slider"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 4: Riepilogo Canali Attivi */}
            <div className="wizard-form-card">
              <h3><Zap size={20} /> Canali Attivi</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {formData.enablePOS && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '6px'
                  }}>
                    <Settings size={16} color="#3b82f6" />
                    <span style={{ fontSize: '14px' }}>POS: {formData.posDevices} dispositivi</span>
                  </div>
                )}
                {formData.enableEcommerce && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '6px'
                  }}>
                    <Globe size={16} color="#3b82f6" />
                    <span style={{ fontSize: '14px' }}>E-commerce integrato</span>
                  </div>
                )}
                {formData.enableApp && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '6px'
                  }}>
                    <Smartphone size={16} color="#3b82f6" />
                    <span style={{ fontSize: '14px' }}>App mobile attiva</span>
                  </div>
                )}
                {!formData.enablePOS && !formData.enableEcommerce && !formData.enableApp && (
                  <div style={{
                    padding: '20px',
                    textAlign: 'center',
                    color: '#9ca3af',
                    fontSize: '14px'
                  }}>
                    Nessun canale selezionato
                  </div>
                )}
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="wizard-nav-buttons">
              <button className="wizard-btn wizard-btn-back" onClick={() => setCurrentStep(5)}>
                <ArrowLeft size={18} />
                Indietro
              </button>
              <button className="wizard-btn wizard-btn-next" onClick={() => setCurrentStep(7)}>
                Continua
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )

      // Step 7: Marketing Campaigns
      case 7:
        return (
          <div className="wizard-content-wrapper">
            <div className="wizard-page-header">
              <h2>
                <BarChart3 size={32} color="#3b82f6" />
                Campagne Marketing
              </h2>
              <p>Configura automazioni e campagne di retention</p>
            </div>

            <div className="wizard-info-box">
              <div className="wizard-info-box-icon">
                <AlertCircle size={20} />
              </div>
              <div className="wizard-info-box-content">
                <p>Attiva campagne automatiche per fidelizzare i clienti e aumentare le visite</p>
              </div>
            </div>

            {/* Card 1: Benvenuto Clienti */}
            <div className="wizard-form-card">
              <h3><Users size={20} /> Benvenuto Clienti</h3>

              <div className="wizard-form-row">
                <div className="wizard-form-group">
                  <div className="wizard-toggle-group">
                    <div className="wizard-toggle-info">
                      <h4>Attiva campagna benvenuto automatica</h4>
                      <p>Email + SMS + bonus points per nuovi iscritti</p>
                    </div>
                    <div
                      className={`wizard-toggle-switch ${formData.welcomeCampaign ? 'active' : ''}`}
                      onClick={() => handleInputChange('welcomeCampaign', !formData.welcomeCampaign)}
                    >
                      <div className="wizard-toggle-slider"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Compleanno Cliente */}
            <div className="wizard-form-card">
              <h3><Gift size={20} /> Compleanno Cliente</h3>

              <div className="wizard-form-row">
                <div className="wizard-form-group">
                  <div className="wizard-toggle-group">
                    <div className="wizard-toggle-info">
                      <h4>Regalo automatico compleanno</h4>
                      <p>Reward speciale il giorno del compleanno</p>
                    </div>
                    <div
                      className={`wizard-toggle-switch ${formData.birthdayRewards ? 'active' : ''}`}
                      onClick={() => handleInputChange('birthdayRewards', !formData.birthdayRewards)}
                    >
                      <div className="wizard-toggle-slider"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Riattivazione Clienti */}
            <div className="wizard-form-card">
              <h3><Bell size={20} /> Riattivazione Clienti</h3>

              <div className="wizard-form-row">
                <div className="wizard-form-group">
                  <div className="wizard-toggle-group">
                    <div className="wizard-toggle-info">
                      <h4>Win-back per clienti inattivi</h4>
                      <p>Campagna automatica dopo 30 giorni di inattività</p>
                    </div>
                    <div
                      className={`wizard-toggle-switch ${formData.inactiveCampaign ? 'active' : ''}`}
                      onClick={() => handleInputChange('inactiveCampaign', !formData.inactiveCampaign)}
                    >
                      <div className="wizard-toggle-slider"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 4: Campagne Stagionali */}
            <div className="wizard-form-card">
              <h3><Star size={20} /> Campagne Stagionali</h3>

              <div className="wizard-form-row">
                <div className="wizard-form-group">
                  <div className="wizard-toggle-group">
                    <div className="wizard-toggle-info">
                      <h4>Promozioni Natale/Pasqua/Estate</h4>
                      <p>Campagne automatiche per festività principali</p>
                    </div>
                    <div
                      className={`wizard-toggle-switch ${formData.seasonalCampaigns ? 'active' : ''}`}
                      onClick={() => handleInputChange('seasonalCampaigns', !formData.seasonalCampaigns)}
                    >
                      <div className="wizard-toggle-slider"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 5: Automazioni Attive */}
            <div className="wizard-form-card">
              <h3><BarChart3 size={20} /> Automazioni Attive</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {formData.welcomeCampaign && (
                  <span style={{
                    padding: '8px 16px',
                    backgroundColor: '#dbeafe',
                    color: '#1e40af',
                    borderRadius: '20px',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}>
                    Benvenuto
                  </span>
                )}
                {formData.birthdayRewards && (
                  <span style={{
                    padding: '8px 16px',
                    backgroundColor: '#dbeafe',
                    color: '#1e40af',
                    borderRadius: '20px',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}>
                    Compleanno
                  </span>
                )}
                {formData.inactiveCampaign && (
                  <span style={{
                    padding: '8px 16px',
                    backgroundColor: '#dbeafe',
                    color: '#1e40af',
                    borderRadius: '20px',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}>
                    Win-back
                  </span>
                )}
                {formData.seasonalCampaigns && (
                  <span style={{
                    padding: '8px 16px',
                    backgroundColor: '#dbeafe',
                    color: '#1e40af',
                    borderRadius: '20px',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}>
                    Stagionali
                  </span>
                )}
                {!formData.welcomeCampaign && !formData.birthdayRewards && !formData.inactiveCampaign && !formData.seasonalCampaigns && (
                  <span style={{
                    padding: '20px',
                    color: '#9ca3af',
                    fontSize: '14px'
                  }}>
                    Nessuna automazione attiva
                  </span>
                )}
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="wizard-nav-buttons">
              <button className="wizard-btn wizard-btn-back" onClick={() => setCurrentStep(6)}>
                <ArrowLeft size={18} />
                Indietro
              </button>
              <button className="wizard-btn wizard-btn-next" onClick={() => setCurrentStep(8)}>
                Continua
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )

      // Step 8: Team Setup
      case 8:
        return (
          <div className="wizard-content-wrapper">
            <div className="wizard-page-header">
              <h2>
                <UserPlus size={32} color="#3b82f6" />
                Team e Permessi
              </h2>
              <p>Invita i membri del tuo team e configura i ruoli</p>
            </div>

            <div className="wizard-info-box">
              <div className="wizard-info-box-icon">
                <AlertCircle size={20} />
              </div>
              <div className="wizard-info-box-content">
                <p>Configura il team che gestirà il programma loyalty</p>
              </div>
            </div>

            {/* Card 1: Amministratore Principale */}
            <div className="wizard-form-card">
              <h3><Shield size={20} /> Amministratore Principale</h3>

              <div className="wizard-form-row">
                <div className="wizard-form-group">
                  <label>Nome Admin</label>
                  <input
                    type="text"
                    placeholder="Mario Rossi"
                    value={formData.adminName}
                    onChange={(e) => handleInputChange('adminName', e.target.value)}
                  />
                </div>
                <div className="wizard-form-group">
                  <label>Email Admin</label>
                  <input
                    type="email"
                    placeholder="admin@tuaazienda.it"
                    value={formData.adminEmail}
                    onChange={(e) => handleInputChange('adminEmail', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Card 2: Ruoli Disponibili */}
            <div className="wizard-form-card">
              <h3><Users size={20} /> Ruoli Disponibili</h3>
              <p style={{ color: '#6b7280', marginBottom: '20px', fontSize: '14px' }}>
                Sistema di ruoli e permessi per il tuo team
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '16px',
                  padding: '16px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    backgroundColor: '#dbeafe',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Shield size={20} color="#3b82f6" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <strong style={{ fontSize: '15px', display: 'block', marginBottom: '4px' }}>Admin</strong>
                    <small style={{ color: '#6b7280', fontSize: '14px' }}>Accesso completo, gestione utenti e configurazioni</small>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '16px',
                  padding: '16px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    backgroundColor: '#dbeafe',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Users size={20} color="#3b82f6" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <strong style={{ fontSize: '15px', display: 'block', marginBottom: '4px' }}>Manager</strong>
                    <small style={{ color: '#6b7280', fontSize: '14px' }}>Gestione clienti, campagne e rewards</small>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '16px',
                  padding: '16px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    backgroundColor: '#dbeafe',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <BarChart3 size={20} color="#3b82f6" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <strong style={{ fontSize: '15px', display: 'block', marginBottom: '4px' }}>Operatore</strong>
                    <small style={{ color: '#6b7280', fontSize: '14px' }}>Visualizzazione dati e reports, sola lettura</small>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="wizard-nav-buttons">
              <button className="wizard-btn wizard-btn-back" onClick={() => setCurrentStep(7)}>
                <ArrowLeft size={18} />
                Indietro
              </button>
              <button className="wizard-btn wizard-btn-next" onClick={() => setCurrentStep(9)}>
                Continua
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )

      // Step 9: POS Integration
      case 9:
        return (
          <div className="wizard-content-wrapper">
            <div className="wizard-page-header">
              <h2>
                <CreditCard size={32} color="#3b82f6" />
                Integrazione POS
              </h2>
              <p>Configura terminale POS per tessere loyalty NFC e transazioni</p>
            </div>

            <div className="wizard-info-box">
              <div className="wizard-info-box-icon">
                <AlertCircle size={20} />
              </div>
              <div className="wizard-info-box-content">
                <p>Configura il terminale POS ZCS per lettura NFC e pagamenti</p>
              </div>
            </div>

            {/* Card 1: Modello POS */}
            <div className="wizard-form-card">
              <h3><CreditCard size={20} /> Modello POS ZCS</h3>

              <div className="wizard-form-row">
                <div className="wizard-form-group">
                  <label>Seleziona Modello</label>
                  <select
                    value={formData.posModel}
                    onChange={(e) => handleInputChange('posModel', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      fontSize: '14px',
                      backgroundColor: 'white'
                    }}
                  >
                    <option value="Z108">Z108 - Android POS (Consigliato)</option>
                    <option value="Z100">Z100 - Smart POS</option>
                    <option value="Z92">Z92 - Smart POS</option>
                    <option value="Z91">Z91 - Smart POS</option>
                    <option value="Z90">Z90 - Smart POS</option>
                    <option value="Z70">Z70 - MPOS Bluetooth</option>
                    <option value="Z45">Z45 - Card Reader USB</option>
                  </select>
                </div>
              </div>

              <div className="wizard-form-row">
                <div className="wizard-form-group">
                  <label>Tipo Connessione</label>
                  <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 16px',
                      border: formData.posConnection === 'usb' ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      backgroundColor: formData.posConnection === 'usb' ? '#f0f9ff' : 'white',
                      flex: 1
                    }}>
                      <input
                        type="radio"
                        name="posConnection"
                        value="usb"
                        checked={formData.posConnection === 'usb'}
                        onChange={(e) => handleInputChange('posConnection', e.target.value)}
                      />
                      <span style={{ fontWeight: '500' }}>USB</span>
                    </label>
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 16px',
                      border: formData.posConnection === 'bluetooth' ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      backgroundColor: formData.posConnection === 'bluetooth' ? '#f0f9ff' : 'white',
                      flex: 1
                    }}>
                      <input
                        type="radio"
                        name="posConnection"
                        value="bluetooth"
                        checked={formData.posConnection === 'bluetooth'}
                        onChange={(e) => handleInputChange('posConnection', e.target.value)}
                      />
                      <span style={{ fontWeight: '500' }}>Bluetooth</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Funzionalità POS */}
            <div className="wizard-form-card">
              <h3><Settings size={20} /> Funzionalità POS</h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Stampa Ricevute */}
                <div className="wizard-toggle-group">
                  <div className="wizard-toggle-info">
                    <h4>Stampa Ricevute</h4>
                    <p>Stampa automatica ricevute con QR code loyalty</p>
                  </div>
                  <div
                    className={`wizard-toggle-switch ${formData.enableReceiptPrint ? 'active' : ''}`}
                    onClick={() => handleInputChange('enableReceiptPrint', !formData.enableReceiptPrint)}
                  >
                    <div className="wizard-toggle-slider"></div>
                  </div>
                </div>

                {/* Lettore NFC */}
                <div className="wizard-toggle-group">
                  <div className="wizard-toggle-info">
                    <h4>Lettore NFC</h4>
                    <p>Lettura tessere loyalty contactless</p>
                  </div>
                  <div
                    className={`wizard-toggle-switch ${formData.enableNFC ? 'active' : ''}`}
                    onClick={() => handleInputChange('enableNFC', !formData.enableNFC)}
                  >
                    <div className="wizard-toggle-slider"></div>
                  </div>
                </div>

                {/* EMV Chip & PIN */}
                <div className="wizard-toggle-group">
                  <div className="wizard-toggle-info">
                    <h4>EMV Chip & PIN</h4>
                    <p>Pagamenti sicuri con chip e PIN</p>
                  </div>
                  <div
                    className={`wizard-toggle-switch ${formData.enableEMV ? 'active' : ''}`}
                    onClick={() => handleInputChange('enableEMV', !formData.enableEMV)}
                  >
                    <div className="wizard-toggle-slider"></div>
                  </div>
                </div>

                {/* PinPad Sicuro */}
                <div className="wizard-toggle-group">
                  <div className="wizard-toggle-info">
                    <h4>PinPad Sicuro</h4>
                    <p>Crittografia PIN avanzata DUKPT</p>
                  </div>
                  <div
                    className={`wizard-toggle-switch ${formData.enablePinPad ? 'active' : ''}`}
                    onClick={() => handleInputChange('enablePinPad', !formData.enablePinPad)}
                  >
                    <div className="wizard-toggle-slider"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Status POS */}
            <div className="wizard-form-card">
              <h3><Settings size={20} /> Configurazione POS</h3>
              <div style={{
                padding: '20px',
                backgroundColor: '#f0f9ff',
                borderRadius: '8px',
                border: '1px solid #bfdbfe',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#3b82f6',
                  animation: 'pulse 2s infinite'
                }}></div>
                <span style={{ fontSize: '14px', color: '#1e40af', fontWeight: '500' }}>
                  POS {formData.posModel} Configurato ({formData.posConnection.toUpperCase()})
                </span>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="wizard-nav-buttons">
              <button className="wizard-btn wizard-btn-back" onClick={() => setCurrentStep(8)}>
                <ArrowLeft size={18} />
                Indietro
              </button>
              <button className="wizard-btn wizard-btn-next" onClick={() => setCurrentStep(10)}>
                Continua
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )

      // Step 10: Notifications
      case 10:
        return (
          <div className="wizard-content-wrapper">
            <div className="wizard-page-header">
              <h2>
                <Bell size={32} color="#3b82f6" />
                Notifiche e Comunicazioni
              </h2>
              <p>Configura comunicazioni e alerts per clienti e team</p>
            </div>

            <div className="wizard-info-box">
              <div className="wizard-info-box-icon">
                <AlertCircle size={20} />
              </div>
              <div className="wizard-info-box-content">
                <p>Attiva i canali di comunicazione per interagire con i tuoi clienti</p>
              </div>
            </div>

            {/* Card 1: Email Notifications */}
            <div className="wizard-form-card">
              <h3><Mail size={20} /> Email Notifications</h3>

              <div className="wizard-form-row">
                <div className="wizard-form-group">
                  <div className="wizard-toggle-group">
                    <div className="wizard-toggle-info">
                      <h4>Email Notifications</h4>
                      <p>Notifiche via email per eventi importanti</p>
                    </div>
                    <div
                      className={`wizard-toggle-switch ${formData.enableEmailNotifications ? 'active' : ''}`}
                      onClick={() => handleInputChange('enableEmailNotifications', !formData.enableEmailNotifications)}
                    >
                      <div className="wizard-toggle-slider"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Push Notifications */}
            <div className="wizard-form-card">
              <h3><Smartphone size={20} /> Push Notifications</h3>

              <div className="wizard-form-row">
                <div className="wizard-form-group">
                  <div className="wizard-toggle-group">
                    <div className="wizard-toggle-info">
                      <h4>Push Notifications</h4>
                      <p>Notifiche push per app mobile</p>
                    </div>
                    <div
                      className={`wizard-toggle-switch ${formData.enablePushNotifications ? 'active' : ''}`}
                      onClick={() => handleInputChange('enablePushNotifications', !formData.enablePushNotifications)}
                    >
                      <div className="wizard-toggle-slider"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Email di Benvenuto */}
            <div className="wizard-form-card">
              <h3><Mail size={20} /> Email di Benvenuto</h3>

              <div className="wizard-form-row">
                <div className="wizard-form-group">
                  <div className="wizard-toggle-group">
                    <div className="wizard-toggle-info">
                      <h4>Email di Benvenuto</h4>
                      <p>Email automatica per nuovi clienti</p>
                    </div>
                    <div
                      className={`wizard-toggle-switch ${formData.welcomeEmailEnabled ? 'active' : ''}`}
                      onClick={() => handleInputChange('welcomeEmailEnabled', !formData.welcomeEmailEnabled)}
                    >
                      <div className="wizard-toggle-slider"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="wizard-nav-buttons">
              <button className="wizard-btn wizard-btn-back" onClick={() => setCurrentStep(9)}>
                <ArrowLeft size={18} />
                Indietro
              </button>
              <button className="wizard-btn wizard-btn-next" onClick={() => setCurrentStep(11)}>
                Review & Deploy
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )

      // Step 11: Deploy Complete
      case 11:
        return (
          <div className="wizard-content-wrapper">
            <div className="wizard-page-header">
              <h2>
                <CheckCircle2 size={32} color="#22c55e" />
                Review & Launch
              </h2>
              <p><strong>{formData.organizationName}</strong> è configurata e pronta per il lancio</p>
            </div>

            <div className="wizard-info-box" style={{ backgroundColor: '#f0fdf4', borderColor: '#86efac' }}>
              <div className="wizard-info-box-icon" style={{ backgroundColor: '#dcfce7' }}>
                <CheckCircle2 size={20} color="#22c55e" />
              </div>
              <div className="wizard-info-box-content">
                <p style={{ color: '#166534' }}>Tutte le configurazioni sono state salvate. Rivedi il riepilogo e lancia la tua azienda!</p>
              </div>
            </div>

            {/* Card: Riepilogo Configurazione */}
            <div className="wizard-form-card">
              <h3><Settings size={20} /> Riepilogo Configurazione</h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '16px',
                  backgroundColor: '#f0fdf4',
                  borderRadius: '8px',
                  border: '1px solid #86efac'
                }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '6px',
                    backgroundColor: '#dcfce7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Building2 size={16} color="#22c55e" />
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: '500', color: '#166534' }}>Organizzazione creata</span>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '16px',
                  backgroundColor: '#f0fdf4',
                  borderRadius: '8px',
                  border: '1px solid #86efac'
                }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '6px',
                    backgroundColor: '#dcfce7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Gift size={16} color="#22c55e" />
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: '500', color: '#166534' }}>Sistema loyalty configurato</span>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '16px',
                  backgroundColor: '#f0fdf4',
                  borderRadius: '8px',
                  border: '1px solid #86efac'
                }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '6px',
                    backgroundColor: '#dcfce7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Palette size={16} color="#22c55e" />
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: '500', color: '#166534' }}>Branding personalizzato</span>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '16px',
                  backgroundColor: '#f0fdf4',
                  borderRadius: '8px',
                  border: '1px solid #86efac'
                }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '6px',
                    backgroundColor: '#dcfce7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Users size={16} color="#22c55e" />
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: '500', color: '#166534' }}>Team setup completato</span>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '16px',
                  backgroundColor: '#f0fdf4',
                  borderRadius: '8px',
                  border: '1px solid #86efac'
                }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '6px',
                    backgroundColor: '#dcfce7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <CreditCard size={16} color="#22c55e" />
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: '500', color: '#166534' }}>POS ZCS integrato</span>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '16px',
                  backgroundColor: '#f0fdf4',
                  borderRadius: '8px',
                  border: '1px solid #86efac'
                }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '6px',
                    backgroundColor: '#dcfce7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Bell size={16} color="#22c55e" />
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: '500', color: '#166534' }}>Notifiche attivate</span>
                </div>
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="wizard-form-card">
                <div style={{
                  padding: '20px',
                  textAlign: 'center'
                }}>
                  <div style={{
                    width: '100%',
                    height: '8px',
                    backgroundColor: '#e5e7eb',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    marginBottom: '12px'
                  }}>
                    <div style={{
                      width: '100%',
                      height: '100%',
                      background: 'linear-gradient(90deg, #3b82f6, #60a5fa)',
                      animation: 'loading 2s infinite'
                    }}></div>
                  </div>
                  <p style={{ fontSize: '14px', color: '#6b7280' }}>
                    Reindirizzamento alla dashboard in corso...
                  </p>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="wizard-nav-buttons">
              <button className="wizard-btn wizard-btn-back" onClick={() => setCurrentStep(10)}>
                <ArrowLeft size={18} />
                Indietro
              </button>
              <button
                className="wizard-btn wizard-btn-next"
                onClick={async () => {
                  setLoading(true)
                  try {
                    const result = await createOrganization()

                    if (mode === 'admin') {
                      // In admin mode, save result and go to confirmation step
                      setCreatedOrganization(result)
                      setCurrentStep(12) // Step 12 = Confirmation
                      setLoading(false)
                    } else {
                      // In client mode, redirect to dashboard
                      setTimeout(() => {
                        window.location.href = '/dashboard'
                      }, 2000)
                    }
                  } catch (error) {
                    console.error('Setup failed:', error)
                    setLoading(false)
                  }
                }}
                disabled={loading}
                style={{
                  backgroundColor: loading ? '#9ca3af' : (mode === 'admin' ? '#3b82f6' : '#22c55e'),
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading
                  ? (mode === 'admin' ? 'Invio in corso...' : 'Creazione in corso...')
                  : (mode === 'admin' ? 'Crea e Invia Invito' : 'Crea Azienda')
                }
                <CheckCircle2 size={18} />
              </button>
            </div>
          </div>
        )

      // Step 12: Confirmation (Admin Mode Only)
      case 12:
        if (mode !== 'admin' || !createdOrganization) return null

        const activationUrl = `${window.location.origin}${createdOrganization.activationUrl}`

        return (
          <div className="wizard-step-content">
            <div style={{ maxWidth: '700px', margin: '0 auto' }}>
              <div className="wizard-step-header" style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.5rem',
                  boxShadow: '0 10px 30px rgba(34, 197, 94, 0.3)'
                }}>
                  <CheckCircle2 size={48} color="white" />
                </div>
                <h2 className="step-title" style={{ fontSize: '32px', marginBottom: '0.5rem' }}>
                  ✅ Azienda Creata con Successo!
                </h2>
                <p className="step-description" style={{ fontSize: '16px', color: '#6b7280' }}>
                  L'azienda <strong>{createdOrganization.organization.name}</strong> è stata creata e attende il pagamento
                </p>
              </div>

              <div style={{
                background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                border: '2px solid #3b82f6',
                borderRadius: '16px',
                padding: '2rem',
                marginBottom: '2rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
                  <div style={{
                    background: '#3b82f6',
                    borderRadius: '8px',
                    padding: '8px',
                    display: 'flex'
                  }}>
                    <Mail size={24} color="white" />
                  </div>
                  <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#1e40af', margin: 0 }}>
                    Link di Attivazione
                  </h3>
                </div>

                <p style={{ fontSize: '14px', color: '#1e40af', marginBottom: '1rem' }}>
                  Invia questo link al proprietario dell'azienda per completare l'attivazione e il pagamento:
                </p>

                <div style={{
                  background: 'white',
                  border: '2px dashed #3b82f6',
                  borderRadius: '12px',
                  padding: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '1rem'
                }}>
                  <input
                    type="text"
                    value={activationUrl}
                    readOnly
                    style={{
                      flex: 1,
                      border: 'none',
                      outline: 'none',
                      fontSize: '14px',
                      fontFamily: 'monospace',
                      color: '#1e40af',
                      background: 'transparent'
                    }}
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(activationUrl)
                      showSuccess('Link copiato!', 'Il link di attivazione è stato copiato negli appunti')
                    }}
                    style={{
                      background: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px 16px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#2563eb'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#3b82f6'}
                  >
                    📋 Copia Link
                  </button>
                </div>

                <div style={{
                  background: '#fef3c7',
                  border: '1px solid #fbbf24',
                  borderRadius: '8px',
                  padding: '12px',
                  display: 'flex',
                  alignItems: 'start',
                  gap: '8px'
                }}>
                  <AlertCircle size={20} color="#d97706" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <p style={{ fontSize: '13px', color: '#92400e', margin: 0 }}>
                    <strong>Importante:</strong> L'azienda sarà attiva solo dopo che il proprietario completerà il pagamento tramite questo link.
                  </p>
                </div>
              </div>

              <div className="wizard-nav-buttons">
                <button
                  className="wizard-btn wizard-btn-next"
                  onClick={() => navigate('/admin/business-owners')}
                  style={{
                    background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                    width: '100%'
                  }}
                >
                  Torna a Gestione Aziende
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="enterprise-wizard-admin min-h-screen bg-gray-50" style={{ background: '#f8fafc' }}>

      <div className="min-h-screen flex relative">
        {/* Sidebar with Steps */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="wizard-sidebar w-[300px] min-h-screen border-r bg-white border-gray-200 shadow-lg"
          style={{ height: '100vh', overflowY: 'auto', background: '#1e293b' }}
        >
          <div className="p-6">
            {/* Logo Header with Close Button */}
            <div className="mb-8">
              <div className="flex items-start justify-between mb-2">
                <h1 className="text-2xl font-black mb-1" style={{
                  background: 'linear-gradient(to right, #60a5fa, #3b82f6)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  OMNILY PRO
                </h1>
                <button
                  onClick={() => navigate('/admin/organizations')}
                  className="transition-all duration-200"
                  style={{
                    color: '#94a3b8',
                    background: 'none',
                    border: 'none',
                    padding: '4px',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#60a5fa'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
                  title="Chiudi e torna alle aziende"
                >
                  <X size={20} />
                </button>
              </div>
              <p className="text-xs font-semibold" style={{ color: '#94a3b8' }}>
                Enterprise Wizard
              </p>
            </div>

            {/* Auto-save Indicator */}
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg mb-6 ${false ? 'bg-green-500/10 border border-green-500/20' : 'bg-green-50 border border-green-200'
              }`}>
              <CheckCircle2 size={14} className="text-green-500" />
              <span className={`text-xs font-semibold ${false ? 'text-green-400' : 'text-green-700'}`}>
                Auto-salvataggio attivo
              </span>
            </div>

            {/* Steps Navigation */}
            <div className="space-y-2">
              {steps.map((step, index) => {
                const IconComponent = step.icon
                const isActive = index === currentStep
                const isCompleted = index < currentStep

                return (
                  <motion.div
                    key={step.title}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`relative group cursor-pointer rounded-xl p-3 transition-all duration-300 ${isActive
                      ? false
                        ? 'bg-gradient-to-r from-blue-400/20 to-blue-500/20 border border-blue-500/30 shadow-lg shadow-blue-500/10'
                        : 'bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 shadow-lg'
                      : isCompleted
                        ? false
                          ? 'bg-white/5 border border-white/10 hover:bg-white/10'
                          : 'bg-white/60 border border-gray-200 hover:bg-white/80'
                        : false
                          ? 'bg-white/5 border border-white/10 hover:bg-white/10 opacity-60'
                          : 'bg-white/40 border border-gray-200 hover:bg-white/60 opacity-60'
                      }`}
                  >
                    {/* Progress line connector */}
                    {index < steps.length - 1 && (
                      <div className={`absolute left-[22px] top-full w-0.5 h-2 ${isCompleted
                        ? 'bg-gradient-to-b from-green-500 to-green-400'
                        : false ? 'bg-white/10' : 'bg-gray-200'
                        }`} />
                    )}

                    <div className="flex items-center gap-3">
                      {/* Step Number/Check */}
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${isCompleted
                        ? 'bg-green-500 text-white shadow-lg shadow-green-500/30'
                        : isActive
                          ? 'bg-gradient-to-r from-blue-400 to-blue-500 text-white shadow-lg shadow-blue-500/30'
                          : false
                            ? 'bg-white/10 text-gray-400'
                            : 'bg-gray-200 text-gray-600'
                        }`}>
                        {isCompleted ? <CheckCircle2 size={16} /> : index + 1}
                      </div>

                      {/* Step Info */}
                      <div className="flex-1 min-w-0">
                        <div className={`font-bold text-xs mb-0.5 truncate ${isActive
                          ? false ? 'text-blue-400' : 'text-blue-500'
                          : false ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                          {step.title}
                        </div>
                        <div className={`text-[10px] truncate ${false ? 'text-gray-500' : 'text-gray-500'
                          }`}>
                          {step.subtitle}
                        </div>
                      </div>

                      {/* Icon */}
                      <div className={`flex-shrink-0 ${isActive
                        ? false ? 'text-blue-400' : 'text-blue-500'
                        : false ? 'text-gray-600' : 'text-gray-400'
                        }`}>
                        <IconComponent size={16} />
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </motion.div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-h-screen">
          {/* Header with Progress */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`border-b backdrop-blur-xl sticky top-0 z-40 ${false
              ? 'bg-white/5 border-white/10'
              : 'bg-white/80 border-gray-200 shadow-lg'
              }`}
          >
            <div className="px-8 py-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className={`text-2xl font-black mb-1 ${false ? 'text-white' : 'text-gray-900'}`}>
                    {steps[currentStep]?.title}
                  </h2>
                  <p className={`text-sm ${false ? 'text-gray-400' : 'text-gray-600'}`}>
                    {steps[currentStep]?.subtitle}
                  </p>
                </div>
                <div className={`px-4 py-2 rounded-xl font-bold text-sm ${false
                  ? 'bg-white/10 text-gray-300 border border-white/20'
                  : 'bg-gray-100 text-gray-700 border border-gray-200'
                  }`}>
                  Step {currentStep + 1} / {steps.length}
                </div>
              </div>

              {/* Progress Bar */}
              <div className={`w-full h-2 rounded-full overflow-hidden ${false ? 'bg-white/10' : 'bg-gray-200'
                }`}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                  transition={{ duration: 0.5 }}
                  className="h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-full shadow-lg shadow-blue-500/50"
                />
              </div>
            </div>
          </motion.div>

          {/* Content Area with AnimatePresence */}
          <div
            className="flex-1"
            style={{
              position: 'relative',
              height: '100vh'
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                overflowY: 'scroll',
                overflowX: 'hidden'
              }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {renderStep()}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Footer Navigation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`border-t backdrop-blur-xl sticky bottom-0 ${false
              ? 'bg-white/5 border-white/10'
              : 'bg-white/80 border-gray-200 shadow-2xl'
              }`}
          >
            <div className="px-8 py-6">
              <div className="flex items-center justify-between gap-4">
                {/* Back Button */}
                {currentStep > 0 && (
                  <motion.button
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={handlePrevious}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold border-2 transition-all duration-300 hover:scale-105 ${false
                      ? 'bg-white/5 border-white/20 text-white hover:bg-white/10'
                      : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400 shadow-lg hover:shadow-xl'
                      }`}
                  >
                    <ArrowLeft size={20} />
                    Indietro
                  </motion.button>
                )}

                {/* Spacer */}
                <div className="flex-1" />

                {/* Next Button */}
                {currentStep < steps.length - 1 && (
                  <motion.button
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={handleNext}
                    disabled={isStepDisabled(currentStep)}
                    className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-400 to-blue-500 text-white rounded-xl font-bold shadow-xl shadow-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/80 hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {getNextButtonText()}
                    <ArrowRight size={20} />
                  </motion.button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default EnterpriseWizard
