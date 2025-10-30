import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Smartphone,
  Download,
  CheckCircle,
  AlertCircle,
  Wifi,
  Settings,
  Shield,
  ChevronRight,
  ExternalLink
} from 'lucide-react'
import { validateSetupToken } from '../services/setupTokenService'
import './DeviceSetup.css'

interface SetupConfig {
  deviceName: string
  deviceId?: string
  androidId?: string
  organizationId: string
  storeLocation: string
  kioskAutoStart: boolean
  mainAppPackage: string
  setupUrl: string
  configureWifiOnSite: boolean
  timestamp: number
}

const DeviceSetup: React.FC = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [setupConfig, setSetupConfig] = useState<SetupConfig | null>(null)
  const [currentStep, setCurrentStep] = useState(1)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const validateAndSetupConfig = async () => {
      // Get token from URL (new simplified method)
      const token = searchParams.get('token')

      // Fallback: try old method with embedded data
      const qrData = searchParams.get('data')

      if (token) {
        try {
          console.log('🔐 Validating setup token...')
          const validation = await validateSetupToken(token)

          if (!validation.valid) {
            setError(validation.error || 'Token di sicurezza non valido')
            return
          }

          console.log('✅ Token validated successfully')
          console.log('📦 Setup config loaded:', validation.setupData)

          // setupData comes from database
          setSetupConfig(validation.setupData)
        } catch (err) {
          console.error('Error validating token:', err)
          setError('Token non valido. Richiedi un nuovo QR Code all\'amministratore.')
        }
      } else if (qrData) {
        // Legacy support for old QR codes with embedded data
        try {
          let config
          try {
            config = JSON.parse(qrData)
          } catch (e) {
            config = JSON.parse(decodeURIComponent(qrData))
          }

          console.log('📦 Setup config loaded (legacy):', config)

          if (config.security?.setupToken) {
            console.log('🔐 Validating setup token...')
            const validation = await validateSetupToken(config.security.setupToken)

            if (!validation.valid) {
              setError(validation.error || 'Token di sicurezza non valido')
              return
            }

            console.log('✅ Token validated successfully')
          }

          setSetupConfig(config)
        } catch (err) {
          console.error('Error parsing QR code:', err)
          setError('QR Code non valido. Richiedi un nuovo QR Code all\'amministratore.')
        }
      } else {
        setError('Nessuna configurazione trovata. Scansiona il QR Code fornito dall\'amministratore.')
      }
    }

    validateAndSetupConfig()
  }, [searchParams])

  const downloadAPK = () => {
    // Link to latest APK in public folder
    window.location.href = '/downloads/omnily-pos-latest.apk'
  }

  const copyConfig = () => {
    if (setupConfig) {
      navigator.clipboard.writeText(JSON.stringify(setupConfig, null, 2))
      alert('Configurazione copiata negli appunti!')
    }
  }

  if (error) {
    return (
      <div className="device-setup-container error-state">
        <div className="setup-card">
          <AlertCircle size={64} color="#ef4444" />
          <h1>Errore Setup</h1>
          <p>{error}</p>
          <button onClick={() => navigate('/admin/mdm')} className="btn-primary">
            Torna all'Admin Dashboard
          </button>
        </div>
      </div>
    )
  }

  if (!setupConfig) {
    return (
      <div className="device-setup-container">
        <div className="setup-card">
          <div className="loader"></div>
          <p>Caricamento configurazione...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="device-setup-container">
      <div className="setup-header">
        <div className="logo-container">
          <img
            src="https://sjvatdnvewohvswfrdiv.supabase.co/storage/v1/object/public/IMG/OMNILYPRO.png"
            alt="OMNILYPRO"
            className="omnily-logo"
          />
        </div>
        <div className="device-image-container">
          <img
            src="https://sjvatdnvewohvswfrdiv.supabase.co/storage/v1/object/public/IMG/logos/ZCS108.png"
            alt="ZCS108 POS Device"
            className="device-image"
          />
        </div>
        <h1>Setup Dispositivo POS</h1>
        <p className="subtitle">Configurazione guidata per {setupConfig.deviceName}</p>
      </div>

      <div className="setup-card">
        {/* Progress Steps */}
        <div className="setup-steps">
          <div className={`step ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
            <div className="step-number">1</div>
            <span>Preparazione</span>
          </div>
          <div className={`step ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
            <div className="step-number">2</div>
            <span>Download App</span>
          </div>
          <div className={`step ${currentStep >= 3 ? 'active' : ''} ${currentStep > 3 ? 'completed' : ''}`}>
            <div className="step-number">3</div>
            <span>Installazione</span>
          </div>
          <div className={`step ${currentStep >= 4 ? 'active' : ''}`}>
            <div className="step-number">4</div>
            <span>Completamento</span>
          </div>
        </div>

        {/* Step 1: Preparazione */}
        {currentStep === 1 && (
          <div className="step-content">
            <h2>
              <Settings size={24} />
              Preparazione Dispositivo
            </h2>

            <div className="info-box">
              <h3>Informazioni Dispositivo</h3>
              <div className="info-grid">
                <div className="info-item">
                  <span className="label">Nome:</span>
                  <span className="value">{setupConfig.deviceName}</span>
                </div>
                <div className="info-item">
                  <span className="label">Location:</span>
                  <span className="value">{setupConfig.storeLocation || 'Non specificata'}</span>
                </div>
                <div className="info-item">
                  <span className="label">Kiosk Mode:</span>
                  <span className="value">{setupConfig.kioskAutoStart ? 'Sì' : 'No'}</span>
                </div>
              </div>
            </div>

            <div className="checklist">
              <h3>✓ Checklist Pre-Setup</h3>
              <label className="checkbox-item">
                <input type="checkbox" />
                <span>Dispositivo acceso e carico</span>
              </label>
              <label className="checkbox-item">
                <input type="checkbox" />
                <span>WiFi configurato e connesso</span>
              </label>
              <label className="checkbox-item">
                <input type="checkbox" />
                <span>Abilitata installazione da fonti sconosciute</span>
              </label>
            </div>

            <div className="instructions">
              <h4>
                <Wifi size={20} />
                Abilita Fonti Sconosciute
              </h4>
              <ol>
                <li>Apri <strong>Impostazioni</strong></li>
                <li>Vai su <strong>Sicurezza</strong></li>
                <li>Attiva <strong>Sorgenti Sconosciute</strong> o <strong>Installa App Sconosciute</strong></li>
                <li>Abilita per <strong>Browser</strong> o <strong>Gestione File</strong></li>
              </ol>
            </div>

            <div className="actions">
              <button
                onClick={() => setCurrentStep(2)}
                className="btn-primary"
              >
                Continua
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Download */}
        {currentStep === 2 && (
          <div className="step-content">
            <h2>
              <Download size={24} />
              Download App OMNILY
            </h2>

            <div className="download-section">
              <div className="app-icon">
                <Smartphone size={64} color="#3b82f6" />
              </div>

              <h3>OMNILY POS</h3>
              <p className="version">Versione 4.0 • Aggiornato: 22 Ottobre 2025</p>

              <button
                onClick={downloadAPK}
                className="btn-download"
              >
                <Download size={24} />
                Scarica APK (7 MB)
              </button>

              <div className="download-info">
                <p>
                  <strong>Nota:</strong> Il download inizierà automaticamente.
                  Se non parte, controlla le impostazioni del browser.
                </p>
              </div>
            </div>

            <div className="alternative-download">
              <h4>Download Alternativo</h4>
              <p>Se il download non funziona, usa questi link:</p>
              <div className="links">
                <a
                  href="https://omnilypro.vercel.app/downloads/omnily-pos-latest.apk"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-item"
                >
                  <ExternalLink size={16} />
                  Link Diretto APK
                </a>
                <a
                  href="https://drive.google.com/drive/folders/omnily-apks"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-item"
                >
                  <ExternalLink size={16} />
                  Google Drive
                </a>
              </div>
            </div>

            <div className="actions">
              <button
                onClick={() => setCurrentStep(1)}
                className="btn-secondary"
              >
                Indietro
              </button>
              <button
                onClick={() => setCurrentStep(3)}
                className="btn-primary"
              >
                Ho scaricato l'APK
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Installazione */}
        {currentStep === 3 && (
          <div className="step-content">
            <h2>
              <Shield size={24} />
              Installazione e Configurazione
            </h2>

            <div className="instructions">
              <h4>1. Installa l'APK</h4>
              <ol>
                <li>Apri <strong>Gestione File</strong> o <strong>Download</strong></li>
                <li>Trova il file <strong>omnily-pos-latest.apk</strong></li>
                <li>Tocca il file per avviare l'installazione</li>
                <li>Conferma eventuali richieste di sicurezza</li>
                <li>Attendi il completamento dell'installazione</li>
              </ol>

              <h4>2. Primo Avvio</h4>
              <ol>
                <li>Apri l'app <strong>OMNILY</strong> dal menu</li>
                <li>Attendi qualche secondo mentre si avvia</li>
                <li>Fatto! Sei pronto per iniziare</li>
              </ol>
            </div>

            <div className="warning-box">
              <AlertCircle size={20} />
              <div>
                <strong>Nota:</strong> Al primo avvio attendi qualche secondo. Non chiudere l'app!
              </div>
            </div>

            <div className="actions">
              <button
                onClick={() => setCurrentStep(2)}
                className="btn-secondary"
              >
                Indietro
              </button>
              <button
                onClick={() => setCurrentStep(4)}
                className="btn-primary"
              >
                App installata e aperta
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Completamento */}
        {currentStep === 4 && (
          <div className="step-content">
            <div className="success-state">
              <CheckCircle size={64} color="#10b981" />
              <h2>Tutto Pronto!</h2>
              <p>Il POS è configurato e pronto all'uso.</p>
            </div>

            <div className="next-steps">
              <h3>Prossimi Passi</h3>
              <div className="steps-list">
                <div className="next-step-item">
                  <div className="step-icon">1</div>
                  <div>
                    <h4>Inizia ad Usare il POS</h4>
                    <p>Il dispositivo è pronto per processare transazioni</p>
                  </div>
                </div>
                <div className="next-step-item">
                  <div className="step-icon">2</div>
                  <div>
                    <h4>Testa la Stampante</h4>
                    <p>Verifica che gli scontrini vengano stampati correttamente</p>
                  </div>
                </div>
                <div className="next-step-item">
                  <div className="step-icon">3</div>
                  <div>
                    <h4>Contatta l'Assistenza</h4>
                    <p>Per qualsiasi problema o domanda sul funzionamento</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="actions">
              <button
                onClick={() => window.close()}
                className="btn-primary"
              >
                Chiudi e Inizia
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="setup-footer">
        <p>
          Problemi con il setup?
          <a href="/admin/mdm" style={{ marginLeft: '8px', color: '#3b82f6' }}>
            Contatta il supporto
          </a>
        </p>
      </div>
    </div>
  )
}

export default DeviceSetup
