/**
 * Redeem Gift Certificate Modal
 *
 * Modal for redeeming gift certificates (full or partial amount)
 * Shows transaction summary and confirms redemption
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  DollarSign,
  CreditCard,
  CheckCircle,
  AlertCircle,
  TrendingDown,
  Receipt
} from 'lucide-react';
import './RedeemGiftCertificateModal.css';
import { createPrintService } from '../services/printService';
import type { GiftCertificate } from '../types/giftCertificate';

interface RedeemGiftCertificateModalProps {
  isOpen: boolean;
  certificate: GiftCertificate | null;
  onRedeem: (amount: number) => Promise<void>;
  onClose: () => void;
  organizationId: string;
  organizationName: string;
  cashierName?: string;
  printService?: any; // ZCSPrintService instance
}

const RedeemGiftCertificateModal: React.FC<RedeemGiftCertificateModalProps> = ({
  isOpen,
  certificate,
  onRedeem,
  onClose,
  organizationId,
  organizationName,
  cashierName = 'Operatore',
  printService
}) => {
  const [redeemAmount, setRedeemAmount] = useState<string>('');
  const [selectedPercentage, setSelectedPercentage] = useState<number | null>(null);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    if (isOpen && certificate) {
      resetForm();
    }
  }, [isOpen, certificate]);

  const resetForm = () => {
    setRedeemAmount('');
    setSelectedPercentage(null);
    setError(null);
    setIsRedeeming(false);
    setShowConfirmation(false);
  };

  const handlePercentageSelect = (percentage: number) => {
    if (!certificate) return;

    setSelectedPercentage(percentage);
    const amount = (certificate.current_balance * percentage) / 100;
    setRedeemAmount(amount.toFixed(2));
    setError(null);
  };

  const handleAmountChange = (value: string) => {
    setRedeemAmount(value);
    setSelectedPercentage(null);
    setError(null);
  };

  const validateAmount = (): boolean => {
    if (!certificate) return false;

    const amount = parseFloat(redeemAmount);

    if (isNaN(amount) || amount <= 0) {
      setError('Inserisci un importo valido');
      return false;
    }

    if (amount > certificate.current_balance) {
      setError(`Importo supera il saldo disponibile (${formatCurrency(certificate.current_balance)})`);
      return false;
    }

    return true;
  };

  const handleRedeemClick = () => {
    if (!validateAmount()) return;
    setShowConfirmation(true);
  };

  const handleConfirmRedeem = async () => {
    if (!validateAmount() || !certificate) return;

    setIsRedeeming(true);
    setError(null);

    try {
      const amount = parseFloat(redeemAmount);
      const balanceBefore = certificate.current_balance;
      const balanceAfter = balanceBefore - amount;

      await onRedeem(amount);

      // Auto-print redemption receipt
      try {
        console.log('🖨️ Creating printService for redemption receipt...');
        const printConfig = {
          storeName: organizationName,
          storeAddress: '',
          storePhone: '',
          storeTax: '',
          paperWidth: 384, // 58mm
          fontSizeNormal: 24,
          fontSizeLarge: 30,
          printDensity: 0
        };

        const printService = createPrintService(printConfig);
        const initialized = await printService.initialize();

        if (initialized) {
          console.log('🖨️ Printing redemption receipt...');
          const printed = await printService.printGiftCertificateRedemption({
            code: certificate.code,
            amountRedeemed: amount,
            balanceBefore,
            balanceAfter,
            cashierName,
            timestamp: new Date(),
            organizationName
          });

          if (printed) {
            console.log('✅ Redemption receipt printed successfully');
          } else {
            console.error('❌ Redemption receipt print failed');
          }
        } else {
          console.warn('⚠️ Print service initialization failed');
        }
      } catch (printError) {
        console.error('❌ Print error:', printError);
        // Don't block the flow if print fails
      }

      onClose();
    } catch (err: any) {
      console.error('Redeem error:', err);
      setError(err.message || 'Errore durante il riscatto');
      setShowConfirmation(false);
    } finally {
      setIsRedeeming(false);
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

  const getRemainingBalance = (): number => {
    if (!certificate) return 0;
    const amount = parseFloat(redeemAmount) || 0;
    return certificate.current_balance - amount;
  };

  if (!isOpen || !certificate) return null;

  return (
    <>
      <div className="modal-overlay" onClick={!isRedeeming ? onClose : undefined} />

      <div className="redeem-gc-modal">
        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-content">
            <DollarSign size={24} />
            <h2>Riscatta Gift Certificate</h2>
          </div>
          <button onClick={onClose} className="modal-close-btn" disabled={isRedeeming}>
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">

          {!showConfirmation ? (
            <>
              {/* Certificate Info */}
              <div className="certificate-info">
                <div className="info-row">
                  <span className="info-label">Codice:</span>
                  <span className="info-value code">{certificate.code}</span>
                </div>
                <div className="info-row highlight">
                  <span className="info-label">Saldo Disponibile:</span>
                  <span className="info-value amount">{formatCurrency(certificate.current_balance)}</span>
                </div>
              </div>

              {/* Percentage Selection */}
              <div className="form-group">
                <label className="form-label">
                  Riscatto Rapido
                </label>
                <div className="percentage-options">
                  {[25, 50, 75, 100].map(percentage => (
                    <button
                      key={percentage}
                      type="button"
                      onClick={() => handlePercentageSelect(percentage)}
                      className={`percentage-btn ${selectedPercentage === percentage ? 'active' : ''}`}
                      disabled={isRedeeming}
                    >
                      {percentage}%
                      <span className="percentage-amount">
                        {formatCurrency((certificate.current_balance * percentage) / 100)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Amount */}
              <div className="form-group">
                <label className="form-label">
                  <DollarSign size={18} />
                  Importo da Riscattare
                </label>
                <div className="amount-input-wrapper">
                  <span className="currency-symbol">€</span>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={redeemAmount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    className={`amount-input ${error ? 'error' : ''}`}
                    min="0"
                    max={certificate.current_balance}
                    step="0.01"
                    disabled={isRedeeming}
                    autoFocus
                  />
                </div>
                {error && (
                  <span className="error-message">
                    <AlertCircle size={16} />
                    {error}
                  </span>
                )}
              </div>

              {/* Remaining Balance Preview */}
              {parseFloat(redeemAmount) > 0 && (
                <div className="balance-preview">
                  <div className="preview-row">
                    <span>Saldo Attuale:</span>
                    <span className="preview-amount">{formatCurrency(certificate.current_balance)}</span>
                  </div>
                  <div className="preview-row deduction">
                    <span>
                      <TrendingDown size={16} />
                      Importo Riscattato:
                    </span>
                    <span className="preview-amount">-{formatCurrency(parseFloat(redeemAmount))}</span>
                  </div>
                  <div className="preview-row total">
                    <span>Nuovo Saldo:</span>
                    <span className="preview-amount new">{formatCurrency(getRemainingBalance())}</span>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Confirmation Screen */
            <div className="confirmation-screen">
              <div className="confirmation-icon">
                <Receipt size={48} />
              </div>
              <h3>Conferma Riscatto</h3>
              <p>Stai per riscattare il seguente importo dal gift certificate:</p>

              <div className="confirmation-details">
                <div className="confirmation-row">
                  <span>Codice:</span>
                  <span className="conf-code">{certificate.code}</span>
                </div>
                <div className="confirmation-row highlight">
                  <span>Importo Riscatto:</span>
                  <span className="conf-amount">{formatCurrency(parseFloat(redeemAmount))}</span>
                </div>
                <div className="confirmation-row">
                  <span>Saldo Residuo:</span>
                  <span>{formatCurrency(getRemainingBalance())}</span>
                </div>
              </div>

              <div className="confirmation-warning">
                <AlertCircle size={20} />
                <span>Questa operazione non può essere annullata</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          {!showConfirmation ? (
            <>
              <button
                onClick={onClose}
                className="btn-secondary"
                disabled={isRedeeming}
              >
                Annulla
              </button>
              <button
                onClick={handleRedeemClick}
                className="btn-primary"
                disabled={!redeemAmount || parseFloat(redeemAmount) <= 0 || isRedeeming}
              >
                <DollarSign size={18} />
                Procedi al Riscatto
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setShowConfirmation(false)}
                className="btn-secondary"
                disabled={isRedeeming}
              >
                Indietro
              </button>
              <button
                onClick={handleConfirmRedeem}
                className="btn-primary confirm"
                disabled={isRedeeming}
              >
                {isRedeeming ? (
                  <>
                    <div className="spinner" />
                    Riscatto in corso...
                  </>
                ) : (
                  <>
                    <CheckCircle size={18} />
                    Conferma Riscatto
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default RedeemGiftCertificateModal;
