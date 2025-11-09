/**
 * Issue Gift Certificate Modal
 *
 * Modal for issuing new gift certificates with all required fields
 * Supports Desktop and POS responsive design
 */

import React, { useState, useEffect } from 'react';
import { X, CreditCard, Mail, User, DollarSign, Calendar, FileText, AlertCircle, Printer } from 'lucide-react';
import './IssueGiftCertificateModal.css';
import { createPrintService } from '../services/printService';
import type {
  CreateGiftCertificateRequest,
  CreateGiftCertificateResponse,
  GiftCertificateIssueType,
  GiftCertificateTemplate
} from '../types/giftCertificate';

interface IssueGiftCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onIssue: (data: CreateGiftCertificateRequest) => Promise<CreateGiftCertificateResponse>;
  organizationId: string;
  organizationName: string;
  templates?: GiftCertificateTemplate[];
  presetAmounts?: number[];
  printService?: any; // ZCSPrintService instance
}

const ISSUE_TYPES: { value: GiftCertificateIssueType; label: string }[] = [
  { value: 'purchased', label: 'Acquistato' },
  { value: 'promotional', label: 'Promozionale' },
  { value: 'redeemed_points', label: 'Riscatto Punti' },
  { value: 'refund', label: 'Rimborso' },
  { value: 'gift', label: 'Regalo' }
];

const IssueGiftCertificateModal: React.FC<IssueGiftCertificateModalProps> = ({
  isOpen,
  onClose,
  onIssue,
  organizationId,
  organizationName,
  templates = [],
  presetAmounts = [25, 50, 100, 150, 200, 500],
  printService
}) => {
  const [formData, setFormData] = useState<CreateGiftCertificateRequest>({
    organization_id: organizationId,
    amount: 0,
    issue_type: 'purchased',
    recipient_name: '',
    recipient_email: '',
    recipient_phone: '',
    personal_message: '',
    template_id: undefined,
    valid_until: '',
    metadata: {}
  });

  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validityMonths, setValidityMonths] = useState<number>(12);
  const [autoPrint, setAutoPrint] = useState<boolean>(true);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      console.log('🔍 IssueGiftCertificateModal opened');
      resetForm();
    }
  }, [isOpen, organizationId]);

  const resetForm = () => {
    setFormData({
      organization_id: organizationId,
      amount: 0,
      issue_type: 'purchased',
      recipient_name: '',
      recipient_email: '',
      recipient_phone: '',
      personal_message: '',
      template_id: templates.length > 0 ? templates[0].id : undefined,
      valid_until: '',
      metadata: {}
    });
    setSelectedPreset(null);
    setCustomAmount('');
    setErrors({});
    setIsSubmitting(false);
    setValidityMonths(12);
  };

  const handlePresetSelect = (amount: number) => {
    setSelectedPreset(amount);
    setCustomAmount('');
    setFormData(prev => ({ ...prev, amount }));
    clearError('amount');
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    setSelectedPreset(null);
    const amount = parseFloat(value);
    if (!isNaN(amount) && amount > 0) {
      setFormData(prev => ({ ...prev, amount }));
      clearError('amount');
    }
  };

  const handleInputChange = (field: keyof CreateGiftCertificateRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    clearError(field);
  };

  const handleValidityMonthsChange = (months: number) => {
    setValidityMonths(months);
    const validUntil = new Date();
    validUntil.setMonth(validUntil.getMonth() + months);
    setFormData(prev => ({
      ...prev,
      valid_until: validUntil.toISOString()
    }));
  };

  const clearError = (field: string) => {
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Amount validation
    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Importo richiesto';
    } else if (formData.amount > 10000) {
      newErrors.amount = 'Importo massimo: €10,000';
    }

    // Email validation (optional but must be valid if provided)
    if (formData.recipient_email && !isValidEmail(formData.recipient_email)) {
      newErrors.recipient_email = 'Email non valida';
    }

    // Phone validation (optional but must be valid if provided)
    if (formData.recipient_phone && !isValidPhone(formData.recipient_phone)) {
      newErrors.recipient_phone = 'Telefono non valido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isValidPhone = (phone: string): boolean => {
    const phoneRegex = /^[\d\s\+\-\(\)]{8,20}$/;
    return phoneRegex.test(phone);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await onIssue(formData);

      console.log('✅ Gift certificate created:', response);
      console.log('🖨️ Print check - autoPrint:', autoPrint, 'certificate:', !!response?.gift_certificate);

      // Invia messaggio al Customer Display
      if (response?.gift_certificate) {
        try {
          console.log('📤 Invio messaggio emissione al Customer Display...');
          if (typeof window !== 'undefined' && (window as any).updateCustomerDisplay) {
            (window as any).updateCustomerDisplay({
              type: 'GIFT_CERTIFICATE_ISSUED',
              issuance: {
                code: response.gift_certificate.code,
                amount: response.gift_certificate.original_amount,
                recipientName: response.gift_certificate.recipient_name
              }
            });
            console.log('✅ Messaggio emissione inviato al Customer Display');
          }
        } catch (displayError) {
          console.error('❌ Errore invio al customer display:', displayError);
        }
      }

      // Auto-print if enabled and certificate created
      if (autoPrint && response?.gift_certificate) {
        console.log('🖨️ Attempting to print gift certificate...');
        try {
          // Create print service on-the-fly (same approach as sales printing)
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
            const printed = await printService.printGiftCertificate({
              code: response.gift_certificate.code,
              amount: response.gift_certificate.original_amount,
              recipientName: response.gift_certificate.recipient_name,
              recipientEmail: response.gift_certificate.recipient_email,
              validUntil: response.gift_certificate.valid_until,
              personalMessage: response.gift_certificate.personal_message,
              issuedAt: response.gift_certificate.issued_at,
              organizationName
            });

            if (printed) {
              console.log('✅ Gift certificate printed successfully!');
            } else {
              console.error('❌ Print failed');
            }
          } else {
            console.error('❌ Failed to initialize print service');
          }
        } catch (printError) {
          console.error('❌ Print error:', printError);
          // Don't block the flow if print fails
        }
      } else {
        console.log('⚠️ Print skipped:', {
          autoPrint,
          hasCertificate: !!response?.gift_certificate
        });
      }

      onClose();
    } catch (error: any) {
      console.error('Error issuing gift certificate:', error);
      setErrors({
        submit: error.message || 'Errore durante l\'emissione del gift certificate'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="modal-overlay" onClick={onClose} />

      <div className="issue-gc-panel open">
        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-content">
            <CreditCard size={24} />
            <h2>Emetti Gift Certificate</h2>
          </div>
          <button onClick={onClose} className="modal-close-btn" disabled={isSubmitting}>
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="modal-body">

          {/* Issue Type */}
          <div className="form-group">
            <label className="form-label">
              <FileText size={18} />
              Tipo Emissione *
            </label>
            <select
              value={formData.issue_type}
              onChange={(e) => handleInputChange('issue_type', e.target.value as GiftCertificateIssueType)}
              className="form-select"
              disabled={isSubmitting}
            >
              {ISSUE_TYPES.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Amount - Preset Buttons */}
          <div className="form-group">
            <label className="form-label">
              <DollarSign size={18} />
              Importo *
            </label>
            <div className="preset-amounts">
              {presetAmounts.map(amount => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => handlePresetSelect(amount)}
                  className={`preset-amount-btn ${selectedPreset === amount ? 'active' : ''}`}
                  disabled={isSubmitting}
                >
                  €{amount}
                </button>
              ))}
            </div>

            {/* Custom Amount */}
            <input
              type="number"
              placeholder="Importo personalizzato..."
              value={customAmount}
              onChange={(e) => handleCustomAmountChange(e.target.value)}
              className={`form-input ${errors.amount ? 'error' : ''}`}
              min="0"
              max="10000"
              step="0.01"
              disabled={isSubmitting}
            />
            {errors.amount && (
              <span className="error-message">
                <AlertCircle size={16} />
                {errors.amount}
              </span>
            )}
          </div>

          {/* Validity Period */}
          <div className="form-group">
            <label className="form-label">
              <Calendar size={18} />
              Validità
            </label>
            <div className="validity-options">
              {[6, 12, 18, 24].map(months => (
                <button
                  key={months}
                  type="button"
                  onClick={() => handleValidityMonthsChange(months)}
                  className={`validity-btn ${validityMonths === months ? 'active' : ''}`}
                  disabled={isSubmitting}
                >
                  {months} mesi
                </button>
              ))}
            </div>
          </div>

          {/* Recipient Name */}
          <div className="form-group">
            <label className="form-label">
              <User size={18} />
              Nome Beneficiario
            </label>
            <input
              type="text"
              placeholder="Mario Rossi"
              value={formData.recipient_name || ''}
              onChange={(e) => handleInputChange('recipient_name', e.target.value)}
              className="form-input"
              disabled={isSubmitting}
            />
          </div>

          {/* Recipient Email */}
          <div className="form-group">
            <label className="form-label">
              <Mail size={18} />
              Email Beneficiario
            </label>
            <input
              type="email"
              placeholder="mario.rossi@example.com"
              value={formData.recipient_email || ''}
              onChange={(e) => handleInputChange('recipient_email', e.target.value)}
              className={`form-input ${errors.recipient_email ? 'error' : ''}`}
              disabled={isSubmitting}
            />
            {errors.recipient_email && (
              <span className="error-message">
                <AlertCircle size={16} />
                {errors.recipient_email}
              </span>
            )}
          </div>

          {/* Recipient Phone */}
          <div className="form-group">
            <label className="form-label">
              <User size={18} />
              Telefono Beneficiario
            </label>
            <input
              type="tel"
              placeholder="+39 123 456 7890"
              value={formData.recipient_phone || ''}
              onChange={(e) => handleInputChange('recipient_phone', e.target.value)}
              className={`form-input ${errors.recipient_phone ? 'error' : ''}`}
              disabled={isSubmitting}
            />
            {errors.recipient_phone && (
              <span className="error-message">
                <AlertCircle size={16} />
                {errors.recipient_phone}
              </span>
            )}
          </div>

          {/* Personal Message */}
          <div className="form-group">
            <label className="form-label">
              <FileText size={18} />
              Messaggio Personale
            </label>
            <textarea
              placeholder="Auguri per il tuo compleanno!"
              value={formData.personal_message || ''}
              onChange={(e) => handleInputChange('personal_message', e.target.value)}
              className="form-textarea"
              rows={3}
              maxLength={500}
              disabled={isSubmitting}
            />
            <div className="char-count">
              {(formData.personal_message || '').length}/500
            </div>
          </div>

          {/* Template Selection (if templates available) */}
          {templates.length > 0 && (
            <div className="form-group">
              <label className="form-label">
                <FileText size={18} />
                Template
              </label>
              <select
                value={formData.template_id || ''}
                onChange={(e) => handleInputChange('template_id', e.target.value || undefined)}
                className="form-select"
                disabled={isSubmitting}
              >
                <option value="">Nessun template</option>
                {templates.map(template => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Print Option */}
          {printService && (
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={autoPrint}
                  onChange={(e) => setAutoPrint(e.target.checked)}
                  disabled={isSubmitting}
                />
                <Printer size={18} />
                <span>Stampa automaticamente voucher</span>
              </label>
            </div>
          )}

          {/* Error Message */}
          {errors.submit && (
            <div className="error-banner">
              <AlertCircle size={20} />
              <span>{errors.submit}</span>
            </div>
          )}

          {/* Footer Actions */}
          <div className="modal-footer">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={isSubmitting}
            >
              Annulla
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting || formData.amount <= 0}
            >
              {isSubmitting ? (
                <>
                  <div className="spinner" />
                  Emissione...
                </>
              ) : (
                <>
                  <CreditCard size={18} />
                  Emetti Gift Certificate
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default IssueGiftCertificateModal;
