import React, { useState, useEffect } from 'react'
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Search,
  User,
  Calendar,
  Trophy,
  DollarSign,
  Ticket,
  QrCode
} from 'lucide-react'
import { lotteryService, LotteryTicket } from '../services/lotteryService'

interface LotteryTicketVerifierProps {
  organizationId: string
  primaryColor: string
}

interface VerificationResult {
  valid: boolean
  ticket?: LotteryTicket
  event?: any
  message: string
  status: 'valid' | 'invalid' | 'used' | 'winner' | 'expired'
}

const LotteryTicketVerifier: React.FC<LotteryTicketVerifierProps> = ({
  organizationId,
  primaryColor
}) => {
  const [scanning, setScanning] = useState(false)
  const [manualCode, setManualCode] = useState('')
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')

  // Setup QR callback for Android bridge
  useEffect(() => {
    // Setup QR callback
    (window as any).lotteryTicketQRCallback = (result: any) => {
      console.log('📱 QR Lottery Ticket callback:', result)
      setScanning(false)

      try {
        const parsedResult = typeof result === 'string' ? JSON.parse(result) : result

        if (parsedResult.cancelled) {
          console.log('📱 QR scan cancelled')
          return
        }

        const qrContent = parsedResult.content || parsedResult.qrCode || parsedResult.data
        console.log('✅ QR Code read:', qrContent)

        if (qrContent) {
          console.log('📝 Extracted code from QR:', qrContent)

          // Auto-verify after scanning
          setTimeout(() => {
            console.log('🔄 Auto-verifying extracted code...')
            verifyTicket(qrContent)
          }, 300)
        } else {
          setError('QR Code non valido per biglietto lotteria')
        }
      } catch (err) {
        console.error('Error parsing QR result:', err)
        setError('Errore nella lettura del QR code')
      }
    }

    // Cleanup
    return () => {
      delete (window as any).lotteryTicketQRCallback
    }
  }, [])

  const handleQRScan = () => {
    console.log('📱 Starting QR scan for lottery ticket')

    if (typeof window !== 'undefined' && (window as any).OmnilyPOS) {
      const bridge = (window as any).OmnilyPOS

      // If already scanning, cancel
      if (scanning) {
        console.log('📱 Cancelling QR scanner...')
        if (bridge.cancelQRScanner) {
          bridge.cancelQRScanner()
        }
        setScanning(false)
        return
      }

      // Start scanner
      if (bridge.readQRCode) {
        setScanning(true)
        setError('')
        console.log('📱 Calling bridge.readQRCode with callback: lotteryTicketQRCallback')
        bridge.readQRCode('lotteryTicketQRCallback')
      } else {
        console.log('❌ readQRCode not available in bridge')
        setError('Scanner QR non disponibile su questo dispositivo')
      }
    } else {
      console.log('❌ OmnilyPOS bridge not available')
      setError('Scanner QR disponibile solo su app Android POS')
    }
  }

  const verifyTicket = async (qrCode: string) => {
    setLoading(true)
    setVerificationResult(null)

    try {
      // Validate ticket using lottery service
      const ticket = await lotteryService.validateTicket(qrCode)

      // Get event details
      const event = await lotteryService.getEventById(ticket.event_id)

      // Determine ticket status
      let status: VerificationResult['status'] = 'valid'
      let message = 'Biglietto valido e verificato'

      if (ticket.is_winner) {
        status = 'winner'
        message = '🎉 BIGLIETTO VINCENTE!'
      } else if (ticket.is_validated) {
        status = 'used'
        message = 'Biglietto già utilizzato/validato'
      } else if (event && event.status === 'extracted') {
        status = 'expired'
        message = 'Estrazione già avvenuta'
      }

      setVerificationResult({
        valid: true,
        ticket,
        event,
        message,
        status
      })
    } catch (error: any) {
      console.error('Verification error:', error)
      setVerificationResult({
        valid: false,
        message: error.message || 'Biglietto non valido o non trovato',
        status: 'invalid'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleManualVerify = () => {
    if (manualCode.trim()) {
      verifyTicket(manualCode.trim())
    }
  }

  const resetVerification = () => {
    setVerificationResult(null)
    setManualCode('')
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '20px', fontSize: '24px', fontWeight: 'bold' }}>
        🔍 Verifica Biglietto Lotteria
      </h2>

      {/* Scanner or Manual Input */}
      {!verificationResult && (
        <div style={{ marginBottom: '30px' }}>
          {/* QR Scanner */}
          <div style={{
            border: '2px solid #e5e7eb',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '20px'
          }}>
            <h3 style={{ marginBottom: '15px', fontSize: '18px', fontWeight: '600' }}>
              <QrCode style={{ display: 'inline', marginRight: '8px' }} size={20} />
              Scansiona QR Code
            </h3>

            {error && (
              <div style={{
                padding: '12px',
                backgroundColor: '#fee2e2',
                color: '#991b1b',
                borderRadius: '8px',
                marginBottom: '15px',
                fontSize: '14px'
              }}>
                <AlertTriangle size={16} style={{ display: 'inline', marginRight: '8px' }} />
                {error}
              </div>
            )}

            <button
              onClick={handleQRScan}
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px 20px',
                backgroundColor: scanning ? '#ef4444' : primaryColor,
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <QrCode size={20} />
              {scanning ? 'Annulla Scansione' : 'Scansiona QR Code'}
            </button>

            <p style={{
              marginTop: '10px',
              fontSize: '14px',
              color: '#6b7280',
              textAlign: 'center'
            }}>
              {scanning
                ? 'Inquadra il QR code del biglietto lotteria...'
                : 'Usa la fotocamera per scansionare il QR code'}
            </p>
          </div>

          {/* Manual Input */}
          <div style={{
            border: '2px solid #e5e7eb',
            borderRadius: '12px',
            padding: '20px'
          }}>
            <h3 style={{ marginBottom: '15px', fontSize: '18px', fontWeight: '600' }}>
              <Search style={{ display: 'inline', marginRight: '8px' }} size={20} />
              Verifica Manuale
            </h3>

            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleManualVerify()}
                placeholder="Inserisci codice biglietto o numero"
                style={{
                  flex: 1,
                  padding: '12px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '16px'
                }}
              />
              <button
                onClick={handleManualVerify}
                disabled={!manualCode.trim() || loading}
                style={{
                  padding: '12px 24px',
                  backgroundColor: primaryColor,
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: manualCode.trim() && !loading ? 'pointer' : 'not-allowed',
                  opacity: manualCode.trim() && !loading ? 1 : 0.5,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Scan size={20} />
                Verifica
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          fontSize: '18px',
          color: '#6b7280'
        }}>
          <div className="spinner" style={{
            width: '40px',
            height: '40px',
            border: '4px solid #e5e7eb',
            borderTop: `4px solid ${primaryColor}`,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 15px'
          }} />
          Verifica in corso...
        </div>
      )}

      {/* Verification Result */}
      {verificationResult && !loading && (
        <div style={{
          border: `3px solid ${
            verificationResult.status === 'valid' ? '#10b981' :
            verificationResult.status === 'winner' ? '#f59e0b' :
            verificationResult.status === 'used' ? '#6b7280' :
            '#ef4444'
          }`,
          borderRadius: '12px',
          padding: '30px',
          backgroundColor: verificationResult.valid ? '#f0fdf4' : '#fef2f2'
        }}>
          {/* Status Header */}
          <div style={{ textAlign: 'center', marginBottom: '25px' }}>
            {verificationResult.status === 'valid' && (
              <CheckCircle size={64} color="#10b981" style={{ margin: '0 auto 15px' }} />
            )}
            {verificationResult.status === 'winner' && (
              <Trophy size={64} color="#f59e0b" style={{ margin: '0 auto 15px' }} />
            )}
            {verificationResult.status === 'used' && (
              <AlertTriangle size={64} color="#6b7280" style={{ margin: '0 auto 15px' }} />
            )}
            {verificationResult.status === 'invalid' && (
              <XCircle size={64} color="#ef4444" style={{ margin: '0 auto 15px' }} />
            )}

            <h3 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              marginBottom: '10px',
              color: verificationResult.valid ? '#065f46' : '#991b1b'
            }}>
              {verificationResult.message}
            </h3>
          </div>

          {/* Ticket Details */}
          {verificationResult.ticket && verificationResult.event && (
            <div style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '20px',
              marginBottom: '20px'
            }}>
              <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '15px', borderBottom: '2px solid #e5e7eb', paddingBottom: '10px' }}>
                📋 Dettagli Biglietto
              </h4>

              <div style={{ display: 'grid', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Ticket size={20} color={primaryColor} />
                  <div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>Numero Biglietto</div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{verificationResult.ticket.ticket_number}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Trophy size={20} color={primaryColor} />
                  <div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>Evento</div>
                    <div style={{ fontSize: '16px', fontWeight: '600' }}>{verificationResult.event.name}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <User size={20} color={primaryColor} />
                  <div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>Intestatario</div>
                    <div style={{ fontSize: '16px' }}>{verificationResult.ticket.customer_name}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Calendar size={20} color={primaryColor} />
                  <div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>Data Estrazione</div>
                    <div style={{ fontSize: '16px' }}>
                      {new Date(verificationResult.event.extraction_date).toLocaleDateString('it-IT', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <DollarSign size={20} color={primaryColor} />
                  <div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>Prezzo Pagato</div>
                    <div style={{ fontSize: '16px', fontWeight: '600' }}>€ {verificationResult.ticket.price_paid.toFixed(2)}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Button */}
          <button
            onClick={resetVerification}
            style={{
              width: '100%',
              padding: '12px 20px',
              backgroundColor: primaryColor,
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Verifica Altro Biglietto
          </button>
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export default LotteryTicketVerifier
