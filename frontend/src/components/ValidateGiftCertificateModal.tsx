/**
 * Validate Gift Certificate Modal
 *
 * Modal for validating gift certificates by code or QR scan
 * Shows validation result with balance and redemption option
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  QrCode,
  Search,
  CheckCircle,
  XCircle,
  AlertTriangle,
  CreditCard,
  DollarSign,
  Calendar,
  User,
  TrendingUp,
  Printer
} from 'lucide-react';
import './ValidateGiftCertificateModal.css';
import type {
  GiftCertificate,
  ValidateGiftCertificateResponse
} from '../types/giftCertificate';

interface ValidateGiftCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onValidate: (code: string) => Promise<ValidateGiftCertificateResponse>;
  onRedeem?: (certificate: GiftCertificate) => void;
  organizationId: string;
  organizationName: string;
  printService?: any; // ZCSPrintService instance
}

const ValidateGiftCertificateModal: React.FC<ValidateGiftCertificateModalProps> = ({
  isOpen,
  onClose,
  onValidate,
  onRedeem,
  organizationId,
  organizationName,
  printService
}) => {
  const [code, setCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidateGiftCertificateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    if (isOpen) {
      resetForm();

      // Setup QR callback for Android bridge
      (window as any).validateGiftCertQRCallback = (result: any) => {
        console.log('📱 QR Gift Certificate callback:', result);
        setIsScanning(false);

        try {
          const parsedResult = typeof result === 'string' ? JSON.parse(result) : result;

          if (parsedResult.cancelled) {
            console.log('📱 QR scan cancelled');
            return;
          }

          const qrContent = parsedResult.content || parsedResult.qrCode || parsedResult.data;
          console.log('✅ QR Code read:', qrContent);

          // Check if it's a gift certificate QR code
          if (qrContent && (qrContent.startsWith('GIFTCERT:') || qrContent.includes('GIFT-'))) {
            // Extract code from QR format: GIFTCERT:CODE:AMOUNT or just CODE
            const extractedCode = qrContent.includes(':')
              ? qrContent.split(':')[1]
              : qrContent;

            console.log('📝 Extracted code from QR:', extractedCode);
            handleCodeChange(extractedCode);

            // Auto-validate after scanning - pass the code directly to avoid state sync issues
            setTimeout(() => {
              console.log('🔄 Auto-validating extracted code...');
              handleValidate(extractedCode);
            }, 300);
          } else {
            setError('QR Code non valido per Gift Certificate');
          }
        } catch (err) {
          console.error('Error parsing QR result:', err);
          setError('Errore nella lettura del QR code');
        }
      };
    }

    // Cleanup
    return () => {
      delete (window as any).validateGiftCertQRCallback;
    };
  }, [isOpen]);

  const resetForm = () => {
    setCode('');
    setValidationResult(null);
    setError(null);
    setIsValidating(false);
  };

  const handleCodeChange = (value: string) => {
    // Auto-format code with dashes
    const cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    let formatted = '';

    // Increased limit to 24 to accommodate all code lengths (GIFT + up to 20 chars)
    for (let i = 0; i < cleaned.length && i < 24; i++) {
      if (i > 0 && i % 4 === 0) {
        formatted += '-';
      }
      formatted += cleaned[i];
    }

    console.log('🔤 Code formatting:', { input: value, cleaned, formatted });
    setCode(formatted);
    setError(null);
    setValidationResult(null);
  };

  const handleValidate = async (codeToValidate?: string) => {
    const targetCode = codeToValidate || code;

    if (!targetCode.trim()) {
      setError('Inserisci un codice gift certificate');
      return;
    }

    setIsValidating(true);
    setError(null);

    try {
      // Remove dashes and trim spaces before validation
      const cleanCode = targetCode.replace(/-/g, '').trim();
      console.log('🔍 Validating gift certificate:', { original: targetCode, clean: cleanCode });
      const result = await onValidate(cleanCode);
      console.log('✅ Validation result:', result);
      setValidationResult(result);

      if (!result.valid) {
        setError(result.error_message || 'Gift certificate non valido');
      } else if (result.gift_certificate) {
        // Invia messaggio al Customer Display
        console.log('📤 Invio messaggio al Customer Display...');
        try {
          const customerDisplayWindow = window.open('', 'customer_display');
          if (customerDisplayWindow) {
            customerDisplayWindow.postMessage({
              type: 'GIFT_CERTIFICATE_VALIDATED',
              giftCertificate: {
                code: result.gift_certificate.code,
                balance: result.gift_certificate.current_balance,
                recipientName: result.gift_certificate.recipient_name
              }
            }, '*');
            console.log('✅ Messaggio inviato al Customer Display');
          } else {
            console.log('⚠️ Customer Display non trovato');
          }
        } catch (error) {
          console.error('❌ Errore invio messaggio:', error);
        }
      }
    } catch (err: any) {
      console.error('❌ Validation error:', err);
      setError(err.message || 'Errore durante la validazione');
      setValidationResult(null);
    } finally {
      setIsValidating(false);
    }
  };

  const handleRedeemClick = () => {
    if (validationResult?.gift_certificate && onRedeem) {
      onRedeem(validationResult.gift_certificate);
      onClose();
    }
  };

  const handlePrintVoucher = async () => {
    if (!validationResult?.gift_certificate || !printService) return;

    try {
      const cert = validationResult.gift_certificate;
      await printService.printGiftCertificate({
        code: cert.code,
        amount: cert.original_amount,
        recipientName: cert.recipient_name,
        recipientEmail: cert.recipient_email,
        validUntil: cert.valid_until,
        personalMessage: cert.personal_message,
        issuedAt: cert.issued_at,
        organizationName
      });
    } catch (error) {
      console.error('Print error:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && code.trim() && !isValidating) {
      handleValidate();
    }
  };

  const handleQRScan = () => {
    console.log('📱 Starting QR scan for gift certificate');

    if (typeof window !== 'undefined' && (window as any).OmnilyPOS) {
      const bridge = (window as any).OmnilyPOS;

      // If already scanning, cancel
      if (isScanning) {
        console.log('📱 Cancelling QR scanner...');
        if (bridge.cancelQRScanner) {
          bridge.cancelQRScanner();
        }
        setIsScanning(false);
        return;
      }

      // Start scanner
      if (bridge.readQRCode) {
        setIsScanning(true);
        setError(null);
        console.log('📱 Calling bridge.readQRCode with callback: validateGiftCertQRCallback');
        bridge.readQRCode('validateGiftCertQRCallback');
      } else {
        console.log('❌ readQRCode not available in bridge');
        setError('Scanner QR non disponibile su questo dispositivo');
      }
    } else {
      console.log('❌ OmnilyPOS bridge not available');
      setError('Scanner QR disponibile solo su app Android POS');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getStatusIcon = () => {
    if (!validationResult) return null;

    if (validationResult.valid && validationResult.can_redeem) {
      return <CheckCircle size={48} className="status-icon success" />;
    } else if (validationResult.valid && !validationResult.can_redeem) {
      return <AlertTriangle size={48} className="status-icon warning" />;
    } else {
      return <XCircle size={48} className="status-icon error" />;
    }
  };

  const getStatusMessage = () => {
    if (!validationResult) return null;

    if (validationResult.valid && validationResult.can_redeem) {
      return (
        <div className="status-message success">
          <h3>✅ Gift Certificate Valido!</h3>
          <p>Pronto per essere riscattato</p>
        </div>
      );
    } else if (validationResult.valid && !validationResult.can_redeem) {
      return (
        <div className="status-message warning">
          <h3>⚠️ Gift Certificate Non Riscattabile</h3>
          <p>{validationResult.error_message}</p>
        </div>
      );
    } else {
      return (
        <div className="status-message error">
          <h3>❌ Gift Certificate Non Valido</h3>
          <p>{validationResult.error_message}</p>
        </div>
      );
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="modal-overlay" onClick={onClose} />

      <div className="validate-gc-modal">
        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-content">
            <QrCode size={24} />
            <h2>Valida Gift Certificate</h2>
          </div>
          <button onClick={onClose} className="modal-close-btn" disabled={isValidating}>
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">

          {/* Input Section */}
          <div className="input-section">
            <label className="form-label">
              <CreditCard size={18} />
              Codice Gift Certificate
            </label>

            <div className="code-input-wrapper">
              <input
                type="text"
                placeholder="GIFT-XXXX-XXXX-XXXX"
                value={code}
                onChange={(e) => handleCodeChange(e.target.value)}
                onKeyPress={handleKeyPress}
                className="code-input"
                disabled={isValidating}
                autoFocus
              />
              <button
                onClick={handleValidate}
                className="validate-btn"
                disabled={!code.trim() || isValidating}
              >
                {isValidating ? (
                  <div className="spinner" />
                ) : (
                  <>
                    <Search size={20} />
                    Valida
                  </>
                )}
              </button>
            </div>

            {error && !validationResult && (
              <div className="error-message">
                <AlertTriangle size={16} />
                {error}
              </div>
            )}
          </div>

          {/* QR Scan Button */}
          <div className="qr-scan-section">
            <button
              className={`qr-scan-btn ${isScanning ? 'scanning' : ''}`}
              onClick={handleQRScan}
              disabled={isValidating}
            >
              <QrCode size={24} />
              {isScanning ? 'Annulla Scansione' : 'Scansiona QR Code'}
            </button>
            <p className="qr-hint">
              {isScanning
                ? 'Inquadra il QR code del gift certificate...'
                : 'Usa la fotocamera per scansionare il QR code'}
            </p>
          </div>

          {/* Validation Result */}
          {validationResult && (
            <div className="validation-result">
              {getStatusIcon()}
              {getStatusMessage()}

              {/* Certificate Details */}
              {validationResult.gift_certificate && (
                <div className="certificate-details">
                  <div className="detail-row">
                    <div className="detail-label">
                      <CreditCard size={18} />
                      Codice
                    </div>
                    <div className="detail-value code">
                      {validationResult.gift_certificate.code}
                    </div>
                  </div>

                  <div className="detail-row highlight">
                    <div className="detail-label">
                      <DollarSign size={18} />
                      Saldo Disponibile
                    </div>
                    <div className="detail-value amount">
                      {formatCurrency(validationResult.gift_certificate.current_balance)}
                    </div>
                  </div>

                  <div className="detail-row">
                    <div className="detail-label">
                      <TrendingUp size={18} />
                      Importo Originale
                    </div>
                    <div className="detail-value">
                      {formatCurrency(validationResult.gift_certificate.original_amount)}
                    </div>
                  </div>

                  {validationResult.gift_certificate.recipient_name && (
                    <div className="detail-row">
                      <div className="detail-label">
                        <User size={18} />
                        Beneficiario
                      </div>
                      <div className="detail-value">
                        {validationResult.gift_certificate.recipient_name}
                      </div>
                    </div>
                  )}

                  <div className="detail-row">
                    <div className="detail-label">
                      <Calendar size={18} />
                      Emesso il
                    </div>
                    <div className="detail-value">
                      {formatDate(validationResult.gift_certificate.issued_at)}
                    </div>
                  </div>

                  {validationResult.gift_certificate.valid_until && (
                    <div className="detail-row">
                      <div className="detail-label">
                        <Calendar size={18} />
                        Valido fino al
                      </div>
                      <div className="detail-value">
                        {formatDate(validationResult.gift_certificate.valid_until)}
                      </div>
                    </div>
                  )}

                  {/* Usage Progress */}
                  {validationResult.gift_certificate.original_amount > 0 && (
                    <div className="usage-progress">
                      <div className="progress-label">
                        Utilizzo: {Math.round((1 - validationResult.gift_certificate.current_balance / validationResult.gift_certificate.original_amount) * 100)}%
                      </div>
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{
                            width: `${((validationResult.gift_certificate.original_amount - validationResult.gift_certificate.current_balance) / validationResult.gift_certificate.original_amount) * 100}%`
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button
            onClick={onClose}
            className="btn-secondary"
            disabled={isValidating}
          >
            Chiudi
          </button>

          {validationResult?.gift_certificate && printService && (
            <button
              onClick={handlePrintVoucher}
              className="btn-secondary"
              disabled={isValidating}
            >
              <Printer size={18} />
              Stampa Voucher
            </button>
          )}

          {validationResult?.can_redeem && onRedeem && (
            <button
              onClick={handleRedeemClick}
              className="btn-primary"
              disabled={isValidating}
            >
              <DollarSign size={18} />
              Procedi al Riscatto
            </button>
          )}
        </div>
      </div>
    </>
  );
};

export default ValidateGiftCertificateModal;
