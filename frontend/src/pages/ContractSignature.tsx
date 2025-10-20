import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  FileText,
  Building2,
  User,
  Mail,
  Phone,
  Calendar,
  CheckCircle,
  AlertCircle,
  Loader,
  Shield,
  Send,
  Lock
} from 'lucide-react'
import {
  contractsService,
  type Contract,
  type ContractSignature
} from '../services/contractsService'
import { useToast } from '../contexts/ToastContext'
import { supabase } from '../lib/supabase'
import './ContractSignature.css'

const ContractSignature: React.FC = () => {
  const { signatureId } = useParams<{ signatureId: string }>()
  const navigate = useNavigate()
  const toast = useToast()

  const [loading, setLoading] = useState(true)
  const [signature, setSignature] = useState<ContractSignature | null>(null)
  const [contract, setContract] = useState<Contract | null>(null)
  const [step, setStep] = useState<'verify' | 'sign' | 'complete'>('verify')

  // OTP Step
  const [otpMethod, setOtpMethod] = useState<'email' | 'sms'>('email')
  const [otpSent, setOtpSent] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [otpVerified, setOtpVerified] = useState(false)
  const [sendingOtp, setSendingOtp] = useState(false)
  const [verifyingOtp, setVerifyingOtp] = useState(false)

  // Signature Step
  const [signatureType, setSignatureType] = useState<'drawn' | 'typed'>('typed')
  const [typedSignature, setTypedSignature] = useState('')
  const [legalConsent, setLegalConsent] = useState(false)
  const [signing, setSigning] = useState(false)

  useEffect(() => {
    loadSignatureData()
  }, [signatureId])

  const loadSignatureData = async () => {
    if (!signatureId) {
      toast.showError('Errore', 'Link non valido')
      navigate('/')
      return
    }

    try {
      setLoading(true)

      // Get signature details
      const { data: sigData, error: sigError } = await supabase
        .from('contract_signatures')
        .select('*')
        .eq('id', signatureId)
        .single()

      if (sigError) throw sigError

      setSignature(sigData)

      // Get contract details
      if (sigData.contract_id) {
        const contractData = await contractsService.getContractById(sigData.contract_id)
        setContract(contractData)
      }

      // Determine step based on signature status
      if (sigData.status === 'signed') {
        setStep('complete')
      } else if (sigData.status === 'otp_verified') {
        setStep('sign')
        setOtpVerified(true)
      } else {
        setStep('verify')

        // AUTO-SEND OTP when page loads for first time
        // This happens when user clicks link from email
        if (sigData.status === 'pending' && !otpSent) {
          console.log('🔐 Auto-sending OTP on page load...')
          // Use setTimeout to avoid setState conflicts
          setTimeout(() => {
            handleSendOTP()
          }, 500)
        }
      }

    } catch (error) {
      console.error('Error loading signature data:', error)
      toast.showError('Errore', 'Impossibile caricare i dati della firma')
    } finally {
      setLoading(false)
    }
  }

  const handleSendOTP = async () => {
    if (!signatureId) return

    try {
      setSendingOtp(true)
      const result = await contractsService.sendSignatureOTP(signatureId, otpMethod)

      if (result.success) {
        setOtpSent(true)
        toast.showSuccess('OTP Inviato', result.message)
      } else {
        toast.showError('Errore', result.message)
      }
    } catch (error) {
      console.error('Error sending OTP:', error)
      toast.showError('Errore', 'Impossibile inviare il codice OTP')
    } finally {
      setSendingOtp(false)
    }
  }

  const handleVerifyOTP = async () => {
    if (!signatureId || !otpCode) return

    try {
      setVerifyingOtp(true)
      const result = await contractsService.verifySignatureOTP(signatureId, otpCode)

      if (result.success) {
        setOtpVerified(true)
        setStep('sign')
        toast.showSuccess('Verifica Completata', 'OTP verificato con successo')
      } else {
        toast.showError('Errore', result.message)
        setOtpCode('')
      }
    } catch (error) {
      console.error('Error verifying OTP:', error)
      toast.showError('Errore', 'Codice OTP non valido')
      setOtpCode('')
    } finally {
      setVerifyingOtp(false)
    }
  }

  const handleCompleteSignature = async () => {
    if (!signatureId || !legalConsent) {
      toast.showError('Errore', 'Devi accettare i termini per firmare')
      return
    }

    if (signatureType === 'typed' && !typedSignature.trim()) {
      toast.showError('Errore', 'Inserisci il tuo nome completo per firmare')
      return
    }

    try {
      setSigning(true)

      // Get user's IP and user agent
      const ipResponse = await fetch('https://api.ipify.org?format=json')
      const ipData = await ipResponse.json()

      await contractsService.completeSignature(signatureId, {
        signature_type: signatureType,
        signature_data: signatureType === 'typed' ? typedSignature : '',
        ip_address: ipData.ip,
        user_agent: navigator.userAgent,
        geolocation: undefined,
        legal_consent_accepted: legalConsent
      })

      setStep('complete')
      toast.showSuccess('Firma Completata', 'Il contratto è stato firmato con successo')

    } catch (error) {
      console.error('Error completing signature:', error)
      toast.showError('Errore', 'Impossibile completare la firma')
    } finally {
      setSigning(false)
    }
  }

  if (loading) {
    return (
      <div className="signature-page-loading">
        <Loader className="spinner" size={48} />
        <p>Caricamento...</p>
      </div>
    )
  }

  if (!signature || !contract) {
    return (
      <div className="signature-page-error">
        <AlertCircle size={64} color="#ef4444" />
        <h2>Link Non Valido</h2>
        <p>Il link di firma non è valido o è scaduto</p>
      </div>
    )
  }

  return (
    <div className="signature-page">
      <div className="signature-container">
        {/* Header */}
        <div className="signature-header">
          <div className="header-icon">
            <FileText size={32} />
          </div>
          <h1>Firma Digitale Contratto</h1>
          <p className="header-subtitle">{contract.title}</p>
          <div className="contract-number">Contratto: {contract.contract_number}</div>
        </div>

        {/* Progress Steps */}
        <div className="progress-steps">
          <div className={`progress-step ${step === 'verify' || otpVerified ? 'active' : ''} ${otpVerified ? 'completed' : ''}`}>
            <div className="step-number">
              {otpVerified ? <CheckCircle size={24} /> : '1'}
            </div>
            <span>Verifica Identità</span>
          </div>
          <div className="progress-line"></div>
          <div className={`progress-step ${step === 'sign' ? 'active' : ''} ${step === 'complete' ? 'completed' : ''}`}>
            <div className="step-number">
              {step === 'complete' ? <CheckCircle size={24} /> : '2'}
            </div>
            <span>Firma</span>
          </div>
          <div className="progress-line"></div>
          <div className={`progress-step ${step === 'complete' ? 'active completed' : ''}`}>
            <div className="step-number">
              {step === 'complete' ? <CheckCircle size={24} /> : '3'}
            </div>
            <span>Completato</span>
          </div>
        </div>

        {/* Content */}
        <div className="signature-content">
          {/* STEP 1: OTP VERIFICATION */}
          {step === 'verify' && (
            <div className="step-verify">
              <div className="step-header">
                <Shield size={48} color="#3b82f6" />
                <h2>Verifica la Tua Identità</h2>
                <p>Per garantire la sicurezza del contratto, verifica la tua identità con un codice OTP</p>
              </div>

              <div className="signer-info">
                <div className="info-row">
                  <User size={20} />
                  <span>{signature.signer_name}</span>
                </div>
                <div className="info-row">
                  <Mail size={20} />
                  <span>{signature.signer_email}</span>
                </div>
                {signature.signer_phone && (
                  <div className="info-row">
                    <Phone size={20} />
                    <span>{signature.signer_phone}</span>
                  </div>
                )}
              </div>

              {!otpSent ? (
                <div className="otp-method-selection">
                  {sendingOtp && (
                    <div className="auto-otp-message">
                      <Loader className="spinner" size={24} />
                      <p>Stiamo inviando il codice OTP alla tua email...</p>
                      <small>Il codice arriverà tra pochi secondi</small>
                    </div>
                  )}
                  {!sendingOtp && (
                    <>
                      <h3>Ricevi il codice via:</h3>
                      <div className="method-buttons">
                        <button
                          className={`method-button ${otpMethod === 'email' ? 'active' : ''}`}
                          onClick={() => setOtpMethod('email')}
                        >
                          <Mail size={24} />
                          <span>Email</span>
                          <small>{signature.signer_email}</small>
                        </button>
                        {signature.signer_phone && (
                          <button
                            className={`method-button ${otpMethod === 'sms' ? 'active' : ''}`}
                            onClick={() => setOtpMethod('sms')}
                          >
                            <Phone size={24} />
                            <span>SMS</span>
                            <small>{signature.signer_phone}</small>
                          </button>
                        )}
                      </div>
                      <button
                        className="btn-primary btn-large"
                        onClick={handleSendOTP}
                        disabled={sendingOtp}
                      >
                        {sendingOtp ? (
                          <>
                            <Loader className="spinner" size={20} />
                            Invio in corso...
                          </>
                        ) : (
                          <>
                            <Send size={20} />
                            Invia Codice OTP
                          </>
                        )}
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <div className="otp-verification">
                  <h3>Inserisci il codice OTP</h3>
                  <p>
                    Abbiamo inviato un codice a 6 cifre a {otpMethod === 'email' ? 'email' : 'SMS'}: <strong>
                      {otpMethod === 'email' ? signature.signer_email : signature.signer_phone}
                    </strong>
                  </p>

                  <input
                    type="text"
                    className="otp-input"
                    placeholder="000000"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    autoFocus
                  />

                  <button
                    className="btn-primary btn-large"
                    onClick={handleVerifyOTP}
                    disabled={otpCode.length !== 6 || verifyingOtp}
                  >
                    {verifyingOtp ? (
                      <>
                        <Loader className="spinner" size={20} />
                        Verifica in corso...
                      </>
                    ) : (
                      <>
                        <CheckCircle size={20} />
                        Verifica Codice
                      </>
                    )}
                  </button>

                  <button
                    className="btn-text"
                    onClick={() => {
                      setOtpSent(false)
                      setOtpCode('')
                    }}
                  >
                    Cambia metodo di invio
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: SIGNATURE */}
          {step === 'sign' && (
            <div className="step-sign">
              <div className="step-header">
                <CheckCircle size={48} color="#10b981" />
                <h2>Firma il Contratto</h2>
                <p>Rivedi i dettagli e apponi la tua firma digitale</p>
              </div>

              {/* Contract Preview */}
              <div className="contract-preview">
                <h3>Anteprima Contratto</h3>
                <div className="contract-details-grid">
                  <div className="detail-item">
                    <label>Cliente</label>
                    <span>{contract.client_info.company}</span>
                  </div>
                  <div className="detail-item">
                    <label>Fornitore</label>
                    <span>{contract.vendor_info.company}</span>
                  </div>
                  <div className="detail-item">
                    <label>Tipo</label>
                    <span>{contract.contract_type}</span>
                  </div>
                  {contract.contract_value && (
                    <div className="detail-item">
                      <label>Valore</label>
                      <span>
                        {new Intl.NumberFormat('it-IT', {
                          style: 'currency',
                          currency: contract.currency
                        }).format(contract.contract_value)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="contract-content-box">
                  <h4>Contenuto Contratto</h4>
                  <div className="contract-text">
                    {contract.content}
                  </div>
                </div>
              </div>

              {/* Signature Input */}
              <div className="signature-input">
                <h3>Apponi la Firma</h3>

                <div className="signature-type-selection">
                  <button
                    className={`type-button ${signatureType === 'typed' ? 'active' : ''}`}
                    onClick={() => setSignatureType('typed')}
                  >
                    Firma Digitata
                  </button>
                  <button
                    className={`type-button ${signatureType === 'drawn' ? 'active' : ''}`}
                    onClick={() => setSignatureType('drawn')}
                    disabled
                  >
                    Firma Disegnata (Presto)
                  </button>
                </div>

                {signatureType === 'typed' && (
                  <div className="typed-signature">
                    <label>Nome Completo</label>
                    <input
                      type="text"
                      className="signature-text-input"
                      placeholder="Es. Mario Rossi"
                      value={typedSignature}
                      onChange={(e) => setTypedSignature(e.target.value)}
                    />
                    {typedSignature && (
                      <div className="signature-preview">
                        <span className="signature-display">{typedSignature}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Legal Consent */}
              <div className="legal-consent">
                <label className="consent-checkbox">
                  <input
                    type="checkbox"
                    checked={legalConsent}
                    onChange={(e) => setLegalConsent(e.target.checked)}
                  />
                  <span>
                    Confermo di aver letto e compreso il contratto. Appongo la mia firma digitale con piena consapevolezza
                    e accetto tutti i termini e le condizioni. La firma è legalmente vincolante ai sensi del regolamento eIDAS (EU).
                  </span>
                </label>
              </div>

              <button
                className="btn-primary btn-large"
                onClick={handleCompleteSignature}
                disabled={!legalConsent || !typedSignature.trim() || signing}
              >
                {signing ? (
                  <>
                    <Loader className="spinner" size={20} />
                    Firma in corso...
                  </>
                ) : (
                  <>
                    <Lock size={20} />
                    Firma il Contratto
                  </>
                )}
              </button>
            </div>
          )}

          {/* STEP 3: COMPLETE */}
          {step === 'complete' && (
            <div className="step-complete">
              <div className="success-icon">
                <CheckCircle size={80} color="#10b981" />
              </div>
              <h2>Firma Completata con Successo!</h2>
              <p>Il contratto è stato firmato digitalmente e registrato in modo sicuro.</p>

              <div className="completion-details">
                <div className="detail-row">
                  <Calendar size={20} />
                  <span>
                    Firmato il: {signature.signed_at ? new Date(signature.signed_at).toLocaleString('it-IT') : 'N/A'}
                  </span>
                </div>
                <div className="detail-row">
                  <FileText size={20} />
                  <span>Contratto: {contract.contract_number}</span>
                </div>
                <div className="detail-row">
                  <Building2 size={20} />
                  <span>Firmato da: {signature.signer_name}</span>
                </div>
              </div>

              <div className="completion-message">
                <AlertCircle size={20} color="#3b82f6" />
                <p>
                  Riceverai una copia del contratto firmato via email all'indirizzo <strong>{signature.signer_email}</strong>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Security Footer */}
        <div className="signature-footer">
          <Shield size={16} />
          <span>Firma digitale sicura e conforme eIDAS (EU) • Tutti i dati sono crittografati</span>
        </div>
      </div>
    </div>
  )
}

export default ContractSignature
