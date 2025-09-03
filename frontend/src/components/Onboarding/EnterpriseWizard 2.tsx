import React, { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { organizationsApi } from '../../lib/supabase'
import styles from './EnterpriseWizard.module.css'

const EnterpriseWizard: React.FC = () => {
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    organizationName: '',
    industry: 'retail',
    teamSize: '1-10',
    phoneNumber: '',
    website: ''
  })

  const steps = [
    {
      title: 'Benvenuto in OMNILY PRO',
      subtitle: 'Configura la tua organizzazione in 60 secondi'
    },
    {
      title: 'Dettagli Organizzazione',
      subtitle: 'Raccontaci della tua attività'
    },
    {
      title: 'Piattaforma Pronta',
      subtitle: 'Il tuo sistema è in configurazione'
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

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleNext = async () => {
    if (currentStep === 0) {
      setCurrentStep(1)
    } else if (currentStep === 1) {
      setLoading(true)
      setCurrentStep(2)
      
      try {
        // Create organization
        await createOrganization()
        
        // Redirect after success
        setTimeout(() => {
          window.location.href = '/dashboard'
        }, 3000)
      } catch (error) {
        console.error('Setup failed:', error)
        setLoading(false)
      }
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
      case 0:
        return (
          <div className={styles.stepContent}>
            <div className={styles.welcomeIcon}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </div>
            <h1 className={styles.title}>Benvenuto in OMNILY PRO</h1>
            <p className={styles.description}>
              Unisciti a migliaia di aziende italiane che utilizzano la nostra piattaforma loyalty enterprise.
              La configurazione richiede meno di 60 secondi.
            </p>
            <div className={styles.stats}>
              <div className={styles.stat}>
                <span className={styles.statNumber}>10.000+</span>
                <span className={styles.statLabel}>Aziende Attive</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statNumber}>99.9%</span>
                <span className={styles.statLabel}>Uptime</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statNumber}>24/7</span>
                <span className={styles.statLabel}>Supporto</span>
              </div>
            </div>
          </div>
        )

      case 1:
        return (
          <div className={styles.stepContent}>
            <h2 className={styles.stepTitle}>Dettagli Organizzazione</h2>
            <p className={styles.stepDescription}>
              Fornisci alcune informazioni di base per personalizzare la tua esperienza
            </p>
            
            <div className={styles.form}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Nome Organizzazione</label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="Inserisci il nome della tua organizzazione"
                  value={formData.organizationName}
                  onChange={(e) => handleInputChange('organizationName', e.target.value)}
                />
              </div>

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

              <div className={styles.formGroup}>
                <label className={styles.label}>Sito Web (Opzionale)</label>
                <input
                  type="url"
                  className={styles.input}
                  placeholder="https://tuosito.it"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                />
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className={styles.stepContent}>
            <div className={styles.successIcon}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
              </svg>
            </div>
            <h2 className={styles.stepTitle}>La tua piattaforma è pronta!</h2>
            <p className={styles.stepDescription}>
              <strong>{formData.organizationName}</strong> è stata configurata con successo
            </p>
            
            <div className={styles.deployFeatures}>
              <div className={styles.feature}>
                <div className={styles.featureIcon}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
                  </svg>
                </div>
                <span>Dashboard configurata</span>
              </div>
              <div className={styles.feature}>
                <div className={styles.featureIcon}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
                  </svg>
                </div>
                <span>Dati demo popolati</span>
              </div>
              <div className={styles.feature}>
                <div className={styles.featureIcon}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
                  </svg>
                </div>
                <span>Workflow attivati</span>
              </div>
            </div>

            {loading && (
              <div className={styles.loadingBar}>
                <div className={styles.loadingProgress}></div>
              </div>
            )}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className={styles.wizard}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.logo}>
            <svg className={styles.logoIcon} width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
            <span className={styles.logoText}>OMNILY PRO</span>
          </div>
          <div className={styles.progress}>
            <span className={styles.progressText}>
              Passaggio {currentStep + 1} di {steps.length}
            </span>
            <div className={styles.progressBar}>
              <div 
                className={styles.progressFill}
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div className={styles.content}>
          {renderStep()}
          
          {currentStep < 2 && (
            <div className={styles.actions}>
              <button
                onClick={handleNext}
                disabled={currentStep === 1 && !formData.organizationName}
                className={styles.nextButton}
              >
                {currentStep === 0 ? 'Inizia' : 'Crea Organizzazione'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default EnterpriseWizard