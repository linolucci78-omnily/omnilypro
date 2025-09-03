import React, { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { organizationsApi } from '../../lib/supabase'
import { Zap, Award, CheckCircle2, Building2, Users, BarChart3, Shield, Clock, Gift, Palette, UserPlus, Bell, Star, Euro, Settings, Globe, Smartphone } from 'lucide-react'
import styles from './EnterpriseWizard.module.css'

const EnterpriseWizard: React.FC = () => {
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    // Step 1: Organization Basics
    organizationName: '',
    partitaIVA: '',
    codiceFiscale: '',
    industry: 'retail',
    teamSize: '1-10',
    phoneNumber: '',
    website: '',
    address: '',
    city: '',
    province: '',
    cap: '',
    
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
      { points: '100', type: 'discount', value: '5', description: '5€ di sconto' },
      { points: '200', type: 'discount', value: '10', description: '10€ di sconto' },
      { points: '300', type: 'freeProduct', value: 'caffè', description: 'Caffè gratuito' }
    ],
    
    // Step 5: Branding Setup
    primaryColor: '#ef4444',
    secondaryColor: '#dc2626',
    logoUrl: '',
    appName: '',
    
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
    
    // Step 9: Notifications & Communication
    enableEmailNotifications: true,
    enableSMS: false,
    enablePushNotifications: true,
    welcomeEmailEnabled: true,
    
    // Step 10: Analytics & Reports
    enableAdvancedAnalytics: true,
    reportFrequency: 'weekly',
    kpiTracking: ['customer_retention', 'average_transaction', 'loyalty_roi']
  })

  const steps = [
    {
      title: 'Benvenuto in OMNILY PRO',
      subtitle: 'Setup enterprise completo in 10 step',
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
      title: 'Analytics e Reports',
      subtitle: 'KPI tracking e frequenza report',
      icon: BarChart3
    },
    {
      title: 'Sistema Operativo',
      subtitle: 'Il tuo loyalty è pronto per il lancio!',
      icon: CheckCircle2
    }
  ]

  const industries = [
    { value: 'retail', label: 'Retail e Commercio' },
    { value: 'restaurant', label: 'Ristorazione e Food' },
    { value: 'healthcare', label: 'Sanità e Benessere' },
    { value: 'beauty', label: 'Beauty e Wellness' },
    { value: 'automotive', label: 'Automotive' },
    { value: 'other', label: 'Altro' }
  ]

  const teamSizes = [
    { value: '1-10', label: '1-10 dipendenti' },
    { value: '11-50', label: '11-50 dipendenti' },
    { value: '51-200', label: '51-200 dipendenti' },
    { value: '200+', label: 'Oltre 200 dipendenti' }
  ]

  const handleInputChange = (field: string, value: string | boolean | string[] | any[]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // 🇮🇹 RICONOSCIMENTO AUTOMATICO PARTITA IVA - FEATURE ENTERPRISE ITALIANA
  const validatePartitaIVA = async (piva: string) => {
    if (!piva || piva.length !== 11) return false;

    // TODO: Replace with your actual Supabase project URL in production
    const supabaseFunctionUrl = process.env.NODE_ENV === 'development'
      ? 'http://localhost:54321/functions/v1/validate-vat'
      : 'https://sjvatdnvewohvswfrdiv.supabase.co/functions/v1/validate-vat';

    try {
      const response = await fetch(supabaseFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
        },
        body: JSON.stringify({ vatNumber: `IT${piva}` }),
      });

      const data = await response.json();

      if (data.valid) {
        const addressString = data.traderAddress || '';
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

        setFormData(prev => ({
          ...prev,
          organizationName: data.traderName || prev.organizationName,
          address: parsedAddress.address,
          city: parsedAddress.city,
          province: parsedAddress.province,
          cap: parsedAddress.cap,
        }));
        
        console.log('✅ Partita IVA validata:', data);
        return true;
      }
      return false;
    } catch (error) {
      console.log('⚠️ Errore validazione P.IVA:', error);
      return false;
    }
  };

  const handlePartitaIVAChange = async (piva: string) => {
    setFormData(prev => ({ ...prev, partitaIVA: piva }))
    
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
      case 9: // Analytics step
        return false // Optional
      default:
        return false
    }
  }

  const getNextButtonText = (): string => {
    switch (currentStep) {
      case 0: return 'Inizia Configurazione'
      case 1: return 'Configura Loyalty System'
      case 2: return 'Setup Prodotti e Categorie'
      case 3: return 'Configura Rewards'
      case 4: return 'Setup Branding'
      case 5: return 'Integra Canali'
      case 6: return 'Setup Marketing'
      case 7: return 'Gestione Team'
      case 8: return 'Configure Analytics'
      case 9: return 'Deploy Sistema'
      case 10: return 'Lancia Dashboard'
      default: return 'Continua'
    }
  }

  const handleNext = async () => {
    if (currentStep < steps.length - 2) {
      // Navigate to next step
      setCurrentStep(currentStep + 1)
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
      } catch (error) {
        console.error('Setup failed:', error)
        setLoading(false)
      }
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const createOrganization = async () => {
    const slug = formData.organizationName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    const newOrg = await organizationsApi.create({
      name: formData.organizationName,
      slug: `${slug}-${Date.now()}`,
      domain: formData.website.replace(/https?:\/\//, ''),
      industry: formData.industry,
      primary_color: '#2563eb',
      secondary_color: '#1d4ed8',
      plan_type: 'free'
    })

    console.log('Organization created:', newOrg)
    return newOrg
  }

  const renderStep = () => {
    switch (currentStep) {
      // Step 0: Welcome
      case 0:
        return (
          <div className={styles.stepContent}>
            <div className={styles.welcomeIcon}>
              <Award size={48} />
            </div>
            <h1 className={styles.title}>Benvenuto in OMNILY PRO</h1>
            <p className={styles.description}>
              Configurazione completa della tua piattaforma loyalty enterprise italiana.
              Setup avanzato in 7 step per risultati professionali.
            </p>
            <div className={styles.stats}>
              <div className={styles.stat}>
                <span className={styles.statNumber}>10.000+</span>
                <span className={styles.statLabel}>Aziende Italiane</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statNumber}>7 Step</span>
                <span className={styles.statLabel}>Setup Completo</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statNumber}>P.IVA</span>
                <span className={styles.statLabel}>Riconoscimento</span>
              </div>
            </div>
          </div>
        )

      // Step 1: Organization Details + P.IVA
      case 1:
        return (
          <div className={styles.stepContent}>
            <div className={`${styles.stepIcon} ${styles.mainStepIcon}`}>
              <Building2 size={32} />
            </div>
            <h2 className={styles.stepTitle}>Dettagli Organizzazione</h2>
            <p className={styles.stepDescription}>
              Dati aziendali con validazione automatica Partita IVA
            </p>
            
            <div className={styles.form}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Partita IVA 🇮🇹</label>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="12345678901"
                    value={formData.partitaIVA}
                    onChange={(e) => handlePartitaIVAChange(e.target.value)}
                    maxLength={11}
                  />
                  <small className={styles.hint}>Auto-compilazione dati azienda</small>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Codice Fiscale</label>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="RSSMRA80A01H501Z"
                    value={formData.codiceFiscale}
                    onChange={(e) => handleInputChange('codiceFiscale', e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Nome Organizzazione</label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="La Mia Pizzeria S.r.l."
                  value={formData.organizationName}
                  onChange={(e) => handleInputChange('organizationName', e.target.value)}
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Settore</label>
                  <select
                    className={styles.select}
                    value={formData.industry}
                    onChange={(e) => handleInputChange('industry', e.target.value)}
                  >
                    {industries.map(industry => (
                      <option key={industry.value} value={industry.value}>
                        {industry.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Dimensione Team</label>
                  <select
                    className={styles.select}
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

              <div className={styles.formGroup}>
                <label className={styles.label}>Indirizzo Completo</label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="Via Roma 123"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                />
              </div>

              <div className={styles.formRow}>
                <div className={`${styles.formGroup} ${styles.formGroupCity}`}>
                  <label className={styles.label}>Città</label>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="Milano"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                  />
                </div>
                <div className={`${styles.formGroup} ${styles.formGroupProvince}`}>
                  <label className={styles.label}>Provincia</label>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="MI"
                    value={formData.province}
                    onChange={(e) => handleInputChange('province', e.target.value)}
                    maxLength={2}
                  />
                </div>
                <div className={`${styles.formGroup} ${styles.formGroupCap}`}>
                  <label className={styles.label}>CAP</label>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="20100"
                    value={formData.cap}
                    onChange={(e) => handleInputChange('cap', e.target.value)}
                    maxLength={5}
                  />
                </div>
              </div>
            </div>
          </div>
        )

      // Step 2: Loyalty System Setup
      case 2:
        return (
          <div className={styles.stepContent}>
            <div className={`${styles.stepIcon} ${styles.mainStepIcon}`}>
              <Gift size={32} />
            </div>
            <h2 className={styles.stepTitle}>Sistema Loyalty</h2>
            <p className={styles.stepDescription}>
              Configura punti, rewards e meccaniche di fidelizzazione
            </p>
            
            <div className={styles.form}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Nome Punti</label>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="Gemme, Stelline, Punti..."
                    value={formData.pointsName}
                    onChange={(e) => handleInputChange('pointsName', e.target.value)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Punti per Euro</label>
                  <input
                    type="number"
                    className={styles.input}
                    placeholder="1"
                    value={formData.pointsPerEuro}
                    onChange={(e) => handleInputChange('pointsPerEuro', e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Soglia Reward</label>
                  <input
                    type="number"
                    className={styles.input}
                    placeholder="100"
                    value={formData.rewardThreshold}
                    onChange={(e) => handleInputChange('rewardThreshold', e.target.value)}
                  />
                  <small className={styles.hint}>Punti necessari per un reward</small>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Bonus Benvenuto</label>
                  <input
                    type="number"
                    className={styles.input}
                    placeholder="50"
                    value={formData.welcomeBonus}
                    onChange={(e) => handleInputChange('welcomeBonus', e.target.value)}
                  />
                  <small className={styles.hint}>Punti regalo per nuovi clienti</small>
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Scadenza Punti (mesi)</label>
                  <input
                    type="number"
                    className={styles.input}
                    placeholder="12"
                    value={formData.pointsExpiry}
                    onChange={(e) => handleInputChange('pointsExpiry', e.target.value)}
                  />
                  <small className={styles.hint}>0 = mai scadono</small>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Sistema Livelli Clienti</label>
                  <div className={styles.toggleSwitch}>
                    <input
                      type="checkbox"
                      id="enableTierSystem"
                      checked={formData.enableTierSystem}
                      onChange={(e) => handleInputChange('enableTierSystem', e.target.checked)}
                    />
                    <label htmlFor="enableTierSystem" className={styles.toggleLabel}>
                      Abilita livelli personalizzati
                    </label>
                  </div>
                  <small className={styles.hint}>I clienti salgono di livello accumulando punti</small>
                </div>
              </div>

              {formData.enableTierSystem && (
                <div className={styles.tiersSection}>
                  <h4>🏆 I Tuoi Livelli Loyalty</h4>
                  <p className={styles.sectionDescription}>Crea livelli personalizzati per la tua attività. Esempio: "Pizza Lover → Pizza Master → Pizza Legend"</p>
                  
                  {formData.loyaltyTiers.map((tier, index) => (
                    <div key={index} className={styles.tierItem}>
                      <div className={styles.tierHeader}>
                        <div 
                          className={styles.tierColor} 
                          style={{ 
                            background: tier.gradient 
                              ? `linear-gradient(135deg, ${tier.color}, ${tier.gradientEnd})` 
                              : tier.color 
                          }}
                        ></div>
                        <span className={styles.tierNumber}>Livello {index + 1}</span>
                        {formData.loyaltyTiers.length > 1 && (
                          <button 
                            type="button"
                            className={styles.removeBtn}
                            onClick={() => {
                              const newTiers = formData.loyaltyTiers.filter((_, i) => i !== index)
                              handleInputChange('loyaltyTiers', newTiers)
                            }}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                      
                      <div className={styles.tierForm}>
                        <div className={styles.tierFormRow}>
                          <div className={styles.formGroup}>
                            <label className={styles.label}>Nome Livello</label>
                            <input
                              type="text"
                              className={styles.input}
                              value={tier.name}
                              onChange={(e) => {
                                const newTiers = [...formData.loyaltyTiers]
                                newTiers[index].name = e.target.value
                                handleInputChange('loyaltyTiers', newTiers)
                              }}
                              placeholder="Es: Pizza Lover, Beauty Expert, Coffee Master..."
                            />
                          </div>
                          
                          <div className={styles.formGroup}>
                            <label className={styles.label}>Soglia Punti</label>
                            <input
                              type="number"
                              className={styles.input}
                              value={tier.threshold}
                              onChange={(e) => {
                                const newTiers = [...formData.loyaltyTiers]
                                newTiers[index].threshold = e.target.value
                                handleInputChange('loyaltyTiers', newTiers)
                              }}
                              placeholder="0"
                            />
                            <small className={styles.hint}>Punti necessari per raggiungere questo livello</small>
                          </div>
                          
                          <div className={styles.formGroup}>
                            <label className={styles.label}>Moltiplicatore</label>
                            <input
                              type="text"
                              className={styles.input}
                              value={`x${tier.multiplier}`}
                              onChange={(e) => {
                                const newTiers = [...formData.loyaltyTiers]
                                newTiers[index].multiplier = e.target.value.replace('x', '')
                                handleInputChange('loyaltyTiers', newTiers)
                              }}
                              placeholder="x1.5"
                            />
                            <small className={styles.hint}>Punti extra per gli acquisti a questo livello</small>
                          </div>
                        </div>
                        
                        <div className={styles.tierColorSection}>
                          <div className={styles.formGroup}>
                            <label className={styles.label}>Personalizzazione Colore</label>
                            <div className={styles.colorSection}>
                              <div className={styles.colorControls}>
                                <input
                                  type="color"
                                  className={styles.colorInput}
                                  value={tier.color}
                                  onChange={(e) => {
                                    const newTiers = [...formData.loyaltyTiers]
                                    newTiers[index].color = e.target.value
                                    handleInputChange('loyaltyTiers', newTiers)
                                  }}
                                  title="Colore principale"
                                />
                                <div className={styles.gradientToggle}>
                                  <input
                                    type="checkbox"
                                    id={`gradient-${index}`}
                                    checked={tier.gradient}
                                    onChange={(e) => {
                                      const newTiers = [...formData.loyaltyTiers]
                                      newTiers[index].gradient = e.target.checked
                                      handleInputChange('loyaltyTiers', newTiers)
                                    }}
                                  />
                                  <label htmlFor={`gradient-${index}`} className={styles.gradientLabel}>
                                    Abilita Gradiente
                                  </label>
                                </div>
                                {tier.gradient && (
                                  <input
                                    type="color"
                                    className={styles.colorInput}
                                    value={tier.gradientEnd}
                                    onChange={(e) => {
                                      const newTiers = [...formData.loyaltyTiers]
                                      newTiers[index].gradientEnd = e.target.value
                                      handleInputChange('loyaltyTiers', newTiers)
                                    }}
                                    title="Colore finale gradiente"
                                  />
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <button
                    type="button"
                    className={styles.addBtn}
                    onClick={() => {
                      const newTiers = [...formData.loyaltyTiers, {
                        name: 'Nuovo Livello',
                        threshold: String(Math.max(...formData.loyaltyTiers.map(t => parseInt(t.threshold) || 0)) + 200),
                        multiplier: '1.2',
                        color: '#10b981',
                        gradient: false,
                        gradientEnd: '#10b981'
                      }]
                      handleInputChange('loyaltyTiers', newTiers)
                    }}
                  >
                    + Aggiungi Livello
                  </button>
                </div>
              )}

              <div className={styles.previewCard}>
                <h4>🎯 Anteprima Sistema</h4>
                <div className={styles.loyaltyPreview}>
                  <div className={styles.previewItem}>
                    <Star size={16} />
                    <span>1€ di spesa = {formData.pointsPerEuro} {formData.pointsName}</span>
                  </div>
                  <div className={styles.previewItem}>
                    <Gift size={16} />
                    <span>{formData.rewardThreshold} {formData.pointsName} = 1 Reward</span>
                  </div>
                  <div className={styles.previewItem}>
                    <Award size={16} />
                    <span>Bonus registrazione: {formData.welcomeBonus} {formData.pointsName}</span>
                  </div>
                  {formData.enableTierSystem && formData.loyaltyTiers.length > 0 && (
                    <div className={styles.previewItem}>
                      <Shield size={16} />
                      <span>Livelli: {formData.loyaltyTiers.map(tier => `${tier.name} x${tier.multiplier}`).join(', ')}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )

      // Step 3: Products & Categories
      case 3:
        return (
          <div className={styles.stepContent}>
            <div className={`${styles.stepIcon} ${styles.mainStepIcon}`}>
              <Settings size={32} />
            </div>
            <h2 className={styles.stepTitle}>Prodotti e Categorie</h2>
            <p className={styles.stepDescription}>
              Configura catalogo prodotti e moltiplicatori per categoria
            </p>
            
            <div className={styles.form}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Import Catalogo Prodotti</label>
                <div className={styles.toggleSwitch}>
                  <input
                    type="checkbox"
                    id="importProducts"
                    checked={formData.importProducts}
                    onChange={(e) => handleInputChange('importProducts', e.target.checked)}
                  />
                  <label htmlFor="importProducts" className={styles.toggleLabel}>
                    Importa automaticamente dal POS/E-commerce
                  </label>
                </div>
                <small className={styles.hint}>Sincronizza prodotti e prezzi in tempo reale</small>
              </div>

              <div className={styles.categoriesSection}>
                <h4>📦 Categorie Prodotti</h4>
                <div className={styles.categoryList}>
                  {formData.productCategories.map((category, index) => (
                    <div key={index} className={styles.categoryItem}>
                      <input
                        type="text"
                        className={styles.input}
                        value={category}
                        onChange={(e) => {
                          const newCategories = [...formData.productCategories]
                          newCategories[index] = e.target.value
                          handleInputChange('productCategories', newCategories)
                        }}
                        placeholder="Nome categoria"
                      />
                      <button 
                        type="button"
                        className={styles.removeBtn}
                        onClick={() => {
                          const newCategories = formData.productCategories.filter((_, i) => i !== index)
                          handleInputChange('productCategories', newCategories)
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className={styles.addBtn}
                    onClick={() => {
                      const newCategories = [...formData.productCategories, '']
                      handleInputChange('productCategories', newCategories)
                    }}
                  >
                    + Aggiungi Categoria
                  </button>
                </div>
              </div>

              <div className={styles.bonusSection}>
                <h4>⚡ Moltiplicatori per Categoria</h4>
                {formData.bonusCategories.map((bonus, index) => (
                  <div key={index} className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>{bonus.category}</label>
                      <input
                        type="text"
                        className={styles.input}
                        value={`x${bonus.multiplier}`}
                        onChange={(e) => {
                          const newBonuses = [...formData.bonusCategories]
                          newBonuses[index].multiplier = e.target.value.replace('x', '')
                          handleInputChange('bonusCategories', newBonuses)
                        }}
                        placeholder="x1.2"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className={styles.previewCard}>
                <h4>📊 Anteprima Moltiplicatori</h4>
                <div className={styles.multiplierPreview}>
                  {formData.bonusCategories.map((bonus, index) => (
                    <div key={index} className={styles.previewItem}>
                      <Star size={16} />
                      <span>{bonus.category}: {bonus.multiplier}x punti</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )

      // Step 4: Rewards Configuration  
      case 4:
        return (
          <div className={styles.stepContent}>
            <div className={`${styles.stepIcon} ${styles.mainStepIcon}`}>
              <Star size={32} />
            </div>
            <h2 className={styles.stepTitle}>Configurazione Rewards</h2>
            <p className={styles.stepDescription}>
              Configura premi predefiniti e tipologie di rewards
            </p>
            
            <div className={styles.form}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Tipologie Reward Abilitate</label>
                <div className={styles.checkboxGroup}>
                  {[
                    { value: 'discount', label: 'Sconto in Euro' },
                    { value: 'freeProduct', label: 'Prodotto Gratuito' },
                    { value: 'cashback', label: 'Cashback' }
                  ].map(type => (
                    <div key={type.value} className={styles.checkboxItem}>
                      <input
                        type="checkbox"
                        id={type.value}
                        checked={formData.rewardTypes.includes(type.value)}
                        onChange={(e) => {
                          let newTypes = [...formData.rewardTypes]
                          if (e.target.checked) {
                            newTypes.push(type.value)
                          } else {
                            newTypes = newTypes.filter(t => t !== type.value)
                          }
                          handleInputChange('rewardTypes', newTypes)
                        }}
                      />
                      <label htmlFor={type.value}>{type.label}</label>
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.rewardsSection}>
                <h4>🎁 Rewards Predefiniti</h4>
                {formData.defaultRewards.map((reward, index) => (
                  <div key={index} className={styles.rewardItem}>
                    <div className={styles.formRow}>
                      <div className={styles.formGroup}>
                        <label className={styles.label}>Punti Richiesti</label>
                        <input
                          type="number"
                          className={styles.input}
                          value={reward.points}
                          onChange={(e) => {
                            const newRewards = [...formData.defaultRewards]
                            newRewards[index].points = e.target.value
                            handleInputChange('defaultRewards', newRewards)
                          }}
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.label}>Valore</label>
                        <input
                          type="text"
                          className={styles.input}
                          value={reward.value}
                          onChange={(e) => {
                            const newRewards = [...formData.defaultRewards]
                            newRewards[index].value = e.target.value
                            handleInputChange('defaultRewards', newRewards)
                          }}
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.label}>Descrizione</label>
                        <input
                          type="text"
                          className={styles.input}
                          value={reward.description}
                          onChange={(e) => {
                            const newRewards = [...formData.defaultRewards]
                            newRewards[index].description = e.target.value
                            handleInputChange('defaultRewards', newRewards)
                          }}
                        />
                      </div>
                      <button 
                        type="button"
                        className={styles.removeBtn}
                        onClick={() => {
                          const newRewards = formData.defaultRewards.filter((_, i) => i !== index)
                          handleInputChange('defaultRewards', newRewards)
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  className={styles.addBtn}
                  onClick={() => {
                    const newRewards = [...formData.defaultRewards, { points: '100', type: 'discount', value: '5', description: '5€ di sconto' }]
                    handleInputChange('defaultRewards', newRewards)
                  }}
                >
                  + Aggiungi Reward
                </button>
              </div>
            </div>
          </div>
        )

      // Step 5: Branding
      case 5:
        return (
          <div className={styles.stepContent}>
            <div className={`${styles.stepIcon} ${styles.mainStepIcon}`}>
              <Palette size={32} />
            </div>
            <h2 className={styles.stepTitle}>Branding</h2>
            <p className={styles.stepDescription}>
              Personalizza colori e identità visiva della tua piattaforma
            </p>
            
            <div className={styles.form}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Colore Primario</label>
                  <div className={styles.colorInputGroup}>
                    <input
                      type="color"
                      className={styles.colorInput}
                      value={formData.primaryColor}
                      onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                    />
                    <input
                      type="text"
                      className={styles.input}
                      value={formData.primaryColor}
                      onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                    />
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Colore Secondario</label>
                  <div className={styles.colorInputGroup}>
                    <input
                      type="color"
                      className={styles.colorInput}
                      value={formData.secondaryColor}
                      onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
                    />
                    <input
                      type="text"
                      className={styles.input}
                      value={formData.secondaryColor}
                      onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className={styles.brandPreview}>
                <h4>🎨 Anteprima Brand</h4>
                <div className={styles.mockupCard} style={{
                  background: `linear-gradient(135deg, ${formData.primaryColor}, ${formData.secondaryColor})`
                }}>
                  <div className={styles.mockupContent}>
                    <h3>{formData.organizationName || 'La Tua Azienda'}</h3>
                    <p>Sistema Loyalty Personalizzato</p>
                    <div className={styles.mockupButton}>
                      Guadagna {formData.pointsName}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      // Step 6: Channels Integration
      case 6:
        return (
          <div className={styles.stepContent}>
            <div className={`${styles.stepIcon} ${styles.mainStepIcon}`}>
              <Zap size={32} />
            </div>
            <h2 className={styles.stepTitle}>Canali e Integrazione</h2>
            <p className={styles.stepDescription}>
              Configura POS, E-commerce e canali di vendita
            </p>
            
            <div className={styles.form}>
              <div className={styles.channelsGrid}>
                <div className={styles.channelCard}>
                  <div className={styles.channelHeader}>
                    <Settings size={24} />
                    <h4>POS Fisico</h4>
                  </div>
                  <div className={styles.toggleSwitch}>
                    <input
                      type="checkbox"
                      id="enablePOS"
                      checked={formData.enablePOS}
                      onChange={(e) => handleInputChange('enablePOS', e.target.checked)}
                    />
                    <label htmlFor="enablePOS" className={styles.toggleLabel}>
                      Abilita integrazione POS
                    </label>
                  </div>
                  {formData.enablePOS && (
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Numero Dispositivi POS</label>
                      <input
                        type="number"
                        className={styles.input}
                        value={formData.posDevices}
                        onChange={(e) => handleInputChange('posDevices', e.target.value)}
                        min="1"
                      />
                    </div>
                  )}
                </div>

                <div className={styles.channelCard}>
                  <div className={styles.channelHeader}>
                    <Globe size={24} />
                    <h4>E-commerce</h4>
                  </div>
                  <div className={styles.toggleSwitch}>
                    <input
                      type="checkbox"
                      id="enableEcommerce"
                      checked={formData.enableEcommerce}
                      onChange={(e) => handleInputChange('enableEcommerce', e.target.checked)}
                    />
                    <label htmlFor="enableEcommerce" className={styles.toggleLabel}>
                      Integra sito e-commerce
                    </label>
                  </div>
                </div>

                <div className={styles.channelCard}>
                  <div className={styles.channelHeader}>
                    <Smartphone size={24} />
                    <h4>App Mobile</h4>
                  </div>
                  <div className={styles.toggleSwitch}>
                    <input
                      type="checkbox"
                      id="enableApp"
                      checked={formData.enableApp}
                      onChange={(e) => handleInputChange('enableApp', e.target.checked)}
                    />
                    <label htmlFor="enableApp" className={styles.toggleLabel}>
                      App loyalty dedicata
                    </label>
                  </div>
                </div>
              </div>

              <div className={styles.integrationPreview}>
                <h4>🔗 Canali Attivi</h4>
                <div className={styles.activeChannels}>
                  {formData.enablePOS && (
                    <div className={styles.previewItem}>
                      <Settings size={16} />
                      <span>POS: {formData.posDevices} dispositivi</span>
                    </div>
                  )}
                  {formData.enableEcommerce && (
                    <div className={styles.previewItem}>
                      <Globe size={16} />
                      <span>E-commerce integrato</span>
                    </div>
                  )}
                  {formData.enableApp && (
                    <div className={styles.previewItem}>
                      <Smartphone size={16} />
                      <span>App mobile attiva</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )

      // Step 7: Marketing Campaigns
      case 7:
        return (
          <div className={styles.stepContent}>
            <div className={`${styles.stepIcon} ${styles.mainStepIcon}`}>
              <Bell size={32} />
            </div>
            <h2 className={styles.stepTitle}>Campagne Marketing</h2>
            <p className={styles.stepDescription}>
              Configura automazioni e campagne di retention
            </p>
            
            <div className={styles.form}>
              <div className={styles.campaignsGrid}>
                <div className={styles.campaignCard}>
                  <h4>👋 Benvenuto Clienti</h4>
                  <div className={styles.toggleSwitch}>
                    <input
                      type="checkbox"
                      id="welcomeCampaign"
                      checked={formData.welcomeCampaign}
                      onChange={(e) => handleInputChange('welcomeCampaign', e.target.checked)}
                    />
                    <label htmlFor="welcomeCampaign" className={styles.toggleLabel}>
                      Attiva campagna benvenuto automatica
                    </label>
                  </div>
                  <small className={styles.hint}>Email + SMS + bonus points per nuovi iscritti</small>
                </div>

                <div className={styles.campaignCard}>
                  <h4>🎂 Compleanno Cliente</h4>
                  <div className={styles.toggleSwitch}>
                    <input
                      type="checkbox"
                      id="birthdayRewards"
                      checked={formData.birthdayRewards}
                      onChange={(e) => handleInputChange('birthdayRewards', e.target.checked)}
                    />
                    <label htmlFor="birthdayRewards" className={styles.toggleLabel}>
                      Regalo automatico compleanno
                    </label>
                  </div>
                  <small className={styles.hint}>Reward speciale il giorno del compleanno</small>
                </div>

                <div className={styles.campaignCard}>
                  <h4>⏰ Riattivazione Clienti</h4>
                  <div className={styles.toggleSwitch}>
                    <input
                      type="checkbox"
                      id="inactiveCampaign"
                      checked={formData.inactiveCampaign}
                      onChange={(e) => handleInputChange('inactiveCampaign', e.target.checked)}
                    />
                    <label htmlFor="inactiveCampaign" className={styles.toggleLabel}>
                      Win-back per clienti inattivi
                    </label>
                  </div>
                  <small className={styles.hint}>Campagna automatica dopo 30 giorni di inattività</small>
                </div>

                <div className={styles.campaignCard}>
                  <h4>🎄 Campagne Stagionali</h4>
                  <div className={styles.toggleSwitch}>
                    <input
                      type="checkbox"
                      id="seasonalCampaigns"
                      checked={formData.seasonalCampaigns}
                      onChange={(e) => handleInputChange('seasonalCampaigns', e.target.checked)}
                    />
                    <label htmlFor="seasonalCampaigns" className={styles.toggleLabel}>
                      Promozioni Natale/Pasqua/Estate
                    </label>
                  </div>
                  <small className={styles.hint}>Campagne automatiche per festivitÃ  principali</small>
                </div>
              </div>

              <div className={styles.campaignPreview}>
                <h4>📈 Automazioni Attive</h4>
                <div className={styles.activeCampaigns}>
                  {formData.welcomeCampaign && <span className={styles.campaignTag}>Benvenuto</span>}
                  {formData.birthdayRewards && <span className={styles.campaignTag}>Compleanno</span>}
                  {formData.inactiveCampaign && <span className={styles.campaignTag}>Win-back</span>}
                  {formData.seasonalCampaigns && <span className={styles.campaignTag}>Stagionali</span>}
                </div>
              </div>
            </div>
          </div>
        )

      // Step 8: Team Setup
      case 8:
        return (
          <div className={styles.stepContent}>
            <div className={`${styles.stepIcon} ${styles.mainStepIcon}`}>
              <UserPlus size={32} />
            </div>
            <h2 className={styles.stepTitle}>Setup Team</h2>
            <p className={styles.stepDescription}>
              Invita i membri del tuo team e configura i ruoli
            </p>
            
            <div className={styles.form}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Nome Admin</label>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="Mario Rossi"
                    value={formData.adminName}
                    onChange={(e) => handleInputChange('adminName', e.target.value)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Email Admin</label>
                  <input
                    type="email"
                    className={styles.input}
                    placeholder="admin@tuaazienda.it"
                    value={formData.adminEmail}
                    onChange={(e) => handleInputChange('adminEmail', e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.teamRoles}>
                <h4>👑 Ruoli Disponibili</h4>
                <div className={styles.rolesList}>
                  <div className={styles.roleItem}>
                    <Shield size={20} />
                    <div>
                      <strong>Admin</strong>
                      <small>Accesso completo, gestione utenti</small>
                    </div>
                  </div>
                  <div className={styles.roleItem}>
                    <Users size={20} />
                    <div>
                      <strong>Manager</strong>
                      <small>Gestione clienti e campagne</small>
                    </div>
                  </div>
                  <div className={styles.roleItem}>
                    <BarChart3 size={20} />
                    <div>
                      <strong>Operatore</strong>
                      <small>Visualizzazione dati e reports</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      // Step 5: Notifications
      case 5:
        return (
          <div className={styles.stepContent}>
            <div className={`${styles.stepIcon} ${styles.mainStepIcon}`}>
              <Bell size={32} />
            </div>
            <h2 className={styles.stepTitle}>Notifiche</h2>
            <p className={styles.stepDescription}>
              Configura comunicazioni e alerts per clienti e team
            </p>
            
            <div className={styles.form}>
              <div className={styles.notificationSettings}>
                <div className={styles.settingItem}>
                  <div className={styles.settingInfo}>
                    <strong>Email Notifications</strong>
                    <small>Notifiche via email per eventi importanti</small>
                  </div>
                  <input
                    type="checkbox"
                    className={styles.toggle}
                    checked={formData.enableEmailNotifications}
                    onChange={(e) => handleInputChange('enableEmailNotifications', e.target.checked.toString())}
                  />
                </div>

                <div className={styles.settingItem}>
                  <div className={styles.settingInfo}>
                    <strong>Push Notifications</strong>
                    <small>Notifiche push per app mobile</small>
                  </div>
                  <input
                    type="checkbox"
                    className={styles.toggle}
                    checked={formData.enablePushNotifications}
                    onChange={(e) => handleInputChange('enablePushNotifications', e.target.checked.toString())}
                  />
                </div>

                <div className={styles.settingItem}>
                  <div className={styles.settingInfo}>
                    <strong>Email di Benvenuto</strong>
                    <small>Email automatica per nuovi clienti</small>
                  </div>
                  <input
                    type="checkbox"
                    className={styles.toggle}
                    checked={formData.welcomeEmailEnabled}
                    onChange={(e) => handleInputChange('welcomeEmailEnabled', e.target.checked.toString())}
                  />
                </div>
              </div>
            </div>
          </div>
        )

      // Step 6: Deploy Complete
      case 6:
        return (
          <div className={styles.stepContent}>
            <div className={styles.successIcon}>
              <CheckCircle2 size={48} />
            </div>
            <h2 className={styles.stepTitle}>Deploy Completato!</h2>
            <p className={styles.stepDescription}>
              <strong>{formData.organizationName}</strong> è configurata e pronta per il lancio
            </p>
            
            <div className={styles.deployFeatures}>
              <div className={styles.feature}>
                <div className={styles.featureIcon}>
                  <Building2 size={16} />
                </div>
                <span>Organizzazione creata</span>
              </div>
              <div className={styles.feature}>
                <div className={styles.featureIcon}>
                  <Gift size={16} />
                </div>
                <span>Sistema loyalty configurato</span>
              </div>
              <div className={styles.feature}>
                <div className={styles.featureIcon}>
                  <Palette size={16} />
                </div>
                <span>Branding personalizzato</span>
              </div>
              <div className={styles.feature}>
                <div className={styles.featureIcon}>
                  <Users size={16} />
                </div>
                <span>Team setup completato</span>
              </div>
              <div className={styles.feature}>
                <div className={styles.featureIcon}>
                  <Bell size={16} />
                </div>
                <span>Notifiche attivate</span>
              </div>
            </div>

            {loading && (
              <div className={styles.loadingBar}>
                <div className={styles.loadingProgress}></div>
              </div>
            )}

            <div className={styles.successActions}>
              <p className={styles.successMessage}>
                🎉 Reindirizzamento alla dashboard in corso...
              </p>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className={styles.wizard}>
      <div className={styles.container}>
        {/* Sidebar with Steps */}
        <div className={styles.wizardSidebar}>
          <div className={styles.sidebarHeader}>
            <div className={styles.sidebarLogo}>
              <div className={styles.sidebarLogoIcon}>O</div>
              <span className={styles.sidebarLogoText}>OMNILY PRO</span>
            </div>
          </div>
          
          <div className={styles.stepsNav}>
            {steps.map((step, index) => {
              const IconComponent = step.icon
              const isActive = index === currentStep
              const isCompleted = index < currentStep
              
              return (
                <div 
                  key={step.title}
                  className={`${styles.stepItem} ${isActive ? styles.active : ''} ${isCompleted ? styles.completed : ''}`}
                >
                  <div className={styles.stepNumber}>
                    {isCompleted ? <CheckCircle2 size={16} /> : index + 1}
                  </div>
                  <div className={styles.stepContent}>
                    <div className={styles.stepTitle}>{step.title}</div>
                    <div className={styles.stepDescription}>{step.subtitle}</div>
                  </div>
                  <div className={styles.stepIcon}>
                    <IconComponent size={20} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Main Content */}
        <div className={styles.wizardMain}>
          <div className={styles.mainHeader}>
            <div className={styles.mainHeaderTitle}>
              {steps[currentStep]?.title}
            </div>
            <div className={styles.mainHeaderSubtitle}>
              Passaggio {currentStep + 1} di {steps.length} • {steps[currentStep]?.subtitle}
            </div>
          </div>

          <div className={styles.mainContent}>
            <div className={styles.contentInner}>
              <div className={styles.stepContentMain}>
                {renderStep()}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className={styles.wizardFooter}>
            <div className={styles.footerActions}>
              <div className={styles.footerLeft}>
                {currentStep > 0 && (
                  <button
                    onClick={handlePrevious}
                    className={styles.backButton}
                  >
                    Indietro
                  </button>
                )}
              </div>
              
              <div className={styles.footerRight}>
                {currentStep < steps.length - 1 && (
                  <button
                    onClick={handleNext}
                    disabled={isStepDisabled(currentStep)}
                    className={styles.nextButton}
                  >
                    {getNextButtonText()}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EnterpriseWizard