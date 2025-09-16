import React, { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { organizationsApi } from '../../lib/supabase'
import styles from './MagicWizard.module.css'

interface OnboardingStep {
  id: string
  title: string
  subtitle: string
  icon: string
  completed: boolean
}

const MagicWizard: React.FC = () => {
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState(0)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [businessData, setBusinessData] = useState({
    name: '',
    domain: '',
    logo: '',
    colors: { primary: '#8B4513', secondary: '#D4AF37' },
    industry: '',
    location: '',
    organizationId: '',
    created: false
  })

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: '🎉 Benvenuto su OMNILY PRO!',
      subtitle: 'Creiamo la tua organizzazione in modo intelligente',
      icon: '🚀',
      completed: false
    },
    {
      id: 'analyze',
      title: '🔍 Analisi Intelligente',
      subtitle: 'Rilevamento automatico del tuo business',
      icon: '🧠',
      completed: false
    },
    {
      id: 'brand',
      title: '🎨 Brand Recognition',
      subtitle: 'Estrazione logo e colori automatici',
      icon: '✨',
      completed: false
    },
    {
      id: 'deploy',
      title: '🚀 Deploy Istantaneo',
      subtitle: 'La tua piattaforma è pronta!',
      icon: '⚡',
      completed: false
    }
  ]

  // Smart business detection from email
  const detectBusinessFromEmail = (email: string) => {
    const domain = email.split('@')[1]
    const name = email.split('@')[0]
    
    // Smart name extraction
    const businessName = name
      .replace(/[0-9]/g, '')
      .replace(/[._-]/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')

    // Industry detection based on domain/name
    let industry = 'retail'
    if (domain.includes('forno') || name.includes('forno') || name.includes('bakery')) {
      industry = 'bakery'
    } else if (domain.includes('pizzeria') || name.includes('pizza')) {
      industry = 'restaurant'
    } else if (domain.includes('bar') || domain.includes('cafe')) {
      industry = 'cafe'
    }

    return {
      name: businessName || 'La Mia Azienda',
      domain: domain,
      industry: industry
    }
  }

  // Simulate brand color extraction
  const extractBrandColors = async (_domain: string) => {
    // Simulate API call to extract colors from website
    setIsAnalyzing(true)
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const industryColors = {
      bakery: { primary: '#D2691E', secondary: '#F4A460' },
      restaurant: { primary: '#DC143C', secondary: '#FFD700' },
      cafe: { primary: '#8B4513', secondary: '#DEB887' },
      retail: { primary: '#4169E1', secondary: '#87CEEB' }
    }
    
    setIsAnalyzing(false)
    return industryColors[businessData.industry as keyof typeof industryColors] || industryColors.retail
  }

  const startMagicSetup = async () => {
    if (!user?.email) return

    setCurrentStep(1)
    
    // Step 1: Analyze business
    const detected = detectBusinessFromEmail(user.email)
    setBusinessData(prev => ({ ...prev, ...detected }))
    
    await new Promise(resolve => setTimeout(resolve, 1500))
    setCurrentStep(2)
    
    // Step 2: Extract brand colors
    const colors = await extractBrandColors(detected.domain)
    setBusinessData(prev => ({ ...prev, colors }))
    
    setCurrentStep(3)
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Step 3: Create organization
    await createOrganization()
    setCurrentStep(4)
  }

  const createOrganization = async () => {
    try {
      console.log('🏢 Creating REAL organization in Supabase:', businessData)
      
      // Generate unique slug
      const baseSlug = businessData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
      
      const slug = `${baseSlug}-${Date.now()}`
      
      // CREATE REAL ORGANIZATION IN DATABASE
      const newOrg = await organizationsApi.create({
        name: businessData.name,
        slug: slug,
        domain: businessData.domain,
        industry: businessData.industry,
        primary_color: businessData.colors.primary,
        secondary_color: businessData.colors.secondary,
        plan_type: 'free' // New users start with free plan
      })
      
      console.log('✅ Organization created successfully:', newOrg)
      
      // Generate demo data
      await generateDemoData(newOrg.id)
      
      // Store created organization
      setBusinessData(prev => ({ 
        ...prev, 
        organizationId: newOrg.id,
        created: true 
      }))
      
    } catch (error) {
      console.error('❌ Error creating organization:', error)
      throw error
    }
  }

  const generateDemoData = async (organizationId: string) => {
    try {
      console.log('📊 Generating REAL demo data for organization:', organizationId)
      
      const demoStats = await organizationsApi.generateDemoData(organizationId)
      
      console.log('✅ Demo data generated:', demoStats)
      return demoStats
    } catch (error) {
      console.error('❌ Error generating demo data:', error)
    }
  }

  const renderWelcomeStep = () => (
    <div className={`${styles.wizardStep} ${styles.welcomeStep}`}>
      <div className={styles.welcomeAnimation}>
        <div className={styles.floatingIcons}>
          <span className={`${styles.icon} ${styles.icon1}`}>🏢</span>
          <span className={`${styles.icon} ${styles.icon2}`}>⚡</span>
          <span className={`${styles.icon} ${styles.icon3}`}>🎯</span>
          <span className={`${styles.icon} ${styles.icon4}`}>📊</span>
        </div>
      </div>
      
      <h1 className={styles.wizardTitle}>
        Benvenuto su OMNILY PRO!
      </h1>
      
      <p className={styles.wizardSubtitle}>
        Ciao <strong>{user?.email?.split('@')[0]}</strong>! 👋<br/>
        Creiamo la tua organizzazione enterprise in meno di 60 secondi
      </p>
      
      <div className={styles.featuresPreview}>
        <div className={styles.featureItem}>
          <span className={styles.featureIcon}>🧠</span>
          <span>Setup Intelligente</span>
        </div>
        <div className={styles.featureItem}>
          <span className={styles.featureIcon}>🎨</span>
          <span>Brand Automatico</span>
        </div>
        <div className={styles.featureItem}>
          <span className={styles.featureIcon}>📱</span>
          <span>Deploy Istantaneo</span>
        </div>
      </div>
      
      <button 
        onClick={startMagicSetup}
        className={styles.btnMagic}
      >
        ✨ Inizia la Magia
      </button>
    </div>
  )

  const renderAnalysisStep = () => (
    <div className={`${styles.wizardStep} ${styles.analysisStep}`}>
      <div className={styles.analysisAnimation}>
        <div className={styles.scannerLine}></div>
        <div className={styles.dataPoints}>
          <div className={`${styles.dataPoint} ${styles.active}`}>📧 Email Domain</div>
          <div className={`${styles.dataPoint} ${styles.active}`}>🌐 Business Type</div>
          <div className={`${styles.dataPoint} ${styles.active}`}>📍 Location</div>
          <div className={`${styles.dataPoint} ${styles.loading}`}>🏷️ Industry</div>
        </div>
      </div>
      
      <h2 className={styles.stepTitle}>🔍 Analisi Intelligente in Corso...</h2>
      <p className={styles.stepDescription}>
        Stiamo analizzando il tuo profilo per creare l'esperienza perfetta
      </p>
      
      <div className={styles.detectedInfo}>
        <div className={styles.infoItem}>
          <strong>Business Name:</strong> {businessData.name}
        </div>
        <div className={styles.infoItem}>
          <strong>Domain:</strong> {businessData.domain}
        </div>
        <div className={styles.infoItem}>
          <strong>Industry:</strong> {businessData.industry}
        </div>
      </div>
    </div>
  )

  const renderBrandStep = () => (
    <div className={`${styles.wizardStep} ${styles.brandStep}`}>
      <div className={styles.brandExtraction}>
        {isAnalyzing ? (
          <div className={styles.colorAnalyzer}>
            <div className={styles.analyzingSpinner}></div>
            <p>Estraendo colori brand dal web...</p>
          </div>
        ) : (
          <div className={styles.brandResult}>
            <div className={styles.colorPalette}>
              <div 
                className={styles.colorSwatch}
                style={{ backgroundColor: businessData.colors.primary }}
              >
                <span>Primary</span>
              </div>
              <div 
                className={styles.colorSwatch}
                style={{ backgroundColor: businessData.colors.secondary }}
              >
                <span>Secondary</span>
              </div>
            </div>
            <p className={styles.brandSuccess}>✨ Palette perfetta rilevata!</p>
          </div>
        )}
      </div>
      
      <h2 className={styles.stepTitle}>🎨 Brand Recognition Completato</h2>
      <p className={styles.stepDescription}>
        Abbiamo estratto i colori perfetti per {businessData.name}
      </p>
    </div>
  )

  const renderDeployStep = () => (
    <div className={`${styles.wizardStep} ${styles.deployStep}`}>
      <div className={styles.deployAnimation}>
        <div className={styles.rocket}>🚀</div>
        <div className={styles.deployEffects}>
          <span className={styles.effect}>✨</span>
          <span className={styles.effect}>⚡</span>
          <span className={styles.effect}>🎉</span>
        </div>
      </div>
      
      <h2 className={styles.stepTitle}>🎉 La tua piattaforma è LIVE!</h2>
      <p className={styles.stepDescription}>
        <strong>{businessData.name}</strong> è ora pronto per conquistare il mercato
      </p>
      
      <div className={styles.deployFeatures}>
        <div className={styles.deployItem}>
          <span className={styles.deployIcon}>📊</span>
          <div>
            <strong>Dashboard Enterprise</strong>
            <small>Analytics in tempo reale</small>
          </div>
        </div>
        <div className={styles.deployItem}>
          <span className={styles.deployIcon}>👥</span>
          <div>
            <strong>10 Clienti Demo</strong>
            <small>Dati realistici pre-caricati</small>
          </div>
        </div>
        <div className={styles.deployItem}>
          <span className={styles.deployIcon}>🔄</span>
          <div>
            <strong>3 Workflow Automatici</strong>
            <small>Loyalty system attivo</small>
          </div>
        </div>
      </div>
      
      <button 
        onClick={() => window.location.href = '/dashboard'}
        className={styles.btnLaunch}
      >
        🚀 Lancia la Dashboard!
      </button>
    </div>
  )

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0: return renderWelcomeStep()
      case 1: return renderAnalysisStep()
      case 2: return renderBrandStep()
      case 3: return renderDeployStep()
      default: return renderWelcomeStep()
    }
  }

  return (
    <div className={styles.magicWizard}>
      <div className={styles.wizardContainer}>
        <div className={styles.progressBar}>
          <div 
            className={styles.progressFill}
            style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
          ></div>
        </div>
        
        <div className={styles.wizardContent}>
          {renderCurrentStep()}
        </div>
        
        <div className={styles.wizardFooter}>
          <div className={styles.stepIndicator}>
            {steps.map((step, index) => (
              <div 
                key={step.id}
                className={`${styles.stepDot} ${index <= currentStep ? styles.active : ''}`}
              >
                <span className={styles.stepIcon}>{step.icon}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default MagicWizard