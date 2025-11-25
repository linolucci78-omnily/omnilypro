/**
 * Gift Certificate Configuration Panel
 *
 * Two-panel design for creating/editing gift certificates with live preview
 * Left panel: Form fields for configuration
 * Right panel: Live preview matching customer app layout
 */

import React, { useState, useEffect } from 'react';
import { X, CreditCard, Gift, ArrowLeft, User, Mail, Calendar } from 'lucide-react';
import './GiftCertificateConfigPanel.css';

interface GiftCertificateFormData {
  original_amount: number;
  recipient_name?: string;
  recipient_email?: string;
  recipient_phone?: string;
  personal_message?: string;
  valid_until?: string;
}

interface GiftCertificateConfigPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: GiftCertificateFormData) => Promise<any>;
  organizationId: string;
  organizationName: string;
  primaryColor?: string;
  secondaryColor?: string;
  presetAmounts?: number[];
}

const DEFAULT_PRESET_AMOUNTS = [25, 50, 100, 150, 200, 500];

const GRADIENT_COLORS = [
  { name: 'Purple', value: 'from-purple-500 to-purple-600', preview: 'linear-gradient(135deg, #a855f7 0%, #9333ea 100%)' },
  { name: 'Pink', value: 'from-pink-500 to-pink-600', preview: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)' },
  { name: 'Blue', value: 'from-blue-500 to-blue-600', preview: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' },
  { name: 'Green', value: 'from-green-500 to-green-600', preview: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' },
  { name: 'Orange', value: 'from-orange-500 to-orange-600', preview: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)' },
  { name: 'Red', value: 'from-red-500 to-red-600', preview: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }
];

const GiftCertificateConfigPanel: React.FC<GiftCertificateConfigPanelProps> = ({
  isOpen,
  onClose,
  onSave,
  organizationId,
  organizationName,
  primaryColor = '#dc2626',
  secondaryColor = '#ef4444',
  presetAmounts = DEFAULT_PRESET_AMOUNTS
}) => {
  const [formData, setFormData] = useState<GiftCertificateFormData>({
    original_amount: 50,
    recipient_name: '',
    recipient_email: '',
    recipient_phone: '',
    personal_message: '',
    valid_until: ''
  });

  const [selectedColor, setSelectedColor] = useState(GRADIENT_COLORS[0]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');

  useEffect(() => {
    if (isOpen) {
      resetForm();
      generatePreviewCode();
    }
  }, [isOpen]);

  const resetForm = () => {
    const validUntil = new Date();
    validUntil.setFullYear(validUntil.getFullYear() + 1); // 1 anno di validità

    setFormData({
      original_amount: 50,
      recipient_name: '',
      recipient_email: '',
      recipient_phone: '',
      personal_message: '',
      valid_until: validUntil.toISOString()
    });
    setSelectedColor(GRADIENT_COLORS[0]);
    setErrors({});
    setIsSubmitting(false);
  };

  const generatePreviewCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'GIFT-';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setGeneratedCode(code);
  };

  const handleInputChange = (field: keyof GiftCertificateFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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

    if (!formData.original_amount || formData.original_amount <= 0) {
      newErrors.original_amount = 'Importo deve essere maggiore di 0';
    }

    if (formData.recipient_email && !formData.recipient_email.includes('@')) {
      newErrors.recipient_email = 'Email non valida';
    }

    if (formData.personal_message && formData.personal_message.length > 500) {
      newErrors.personal_message = 'Messaggio troppo lungo (max 500 caratteri)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error: any) {
      setErrors({ submit: error.message || 'Errore durante la creazione del gift certificate' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  if (!isOpen) return null;

  return (
    <div className="gift-config-overlay">
      <div className="gift-config-panel">
        {/* Header */}
        <div className="gift-config-header">
          <button onClick={onClose} className="gift-config-back-btn">
            <ArrowLeft size={24} strokeWidth={2.5} />
          </button>
          <h2 className="gift-config-title">Crea Gift Certificate</h2>
          <div style={{ width: '40px' }}></div>
        </div>

        <div className="gift-config-content">
          {/* Left Panel - Form */}
          <div className="gift-config-form-panel">
            <div className="gift-config-form-scroll">
              {/* Amount Selection */}
              <div className="gift-form-group">
                <label className="gift-form-label">Importo Gift Certificate *</label>
                <div className="gift-preset-amounts">
                  {presetAmounts.map(amount => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => handleInputChange('original_amount', amount)}
                      className={`gift-preset-btn ${formData.original_amount === amount ? 'active' : ''}`}
                      disabled={isSubmitting}
                    >
                      €{amount}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  value={formData.original_amount || ''}
                  onChange={(e) => handleInputChange('original_amount', parseFloat(e.target.value))}
                  className={`gift-form-input ${errors.original_amount ? 'error' : ''}`}
                  min="1"
                  step="1"
                  disabled={isSubmitting}
                  placeholder="Oppure inserisci importo personalizzato"
                />
                {errors.original_amount && <p className="gift-form-error">{errors.original_amount}</p>}
              </div>

              {/* Color Selection */}
              <div className="gift-form-group">
                <label className="gift-form-label">Colore Card</label>
                <div className="gift-color-grid">
                  {GRADIENT_COLORS.map(color => (
                    <button
                      key={color.name}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      className={`gift-color-btn ${selectedColor.name === color.name ? 'active' : ''}`}
                      disabled={isSubmitting}
                    >
                      <div
                        className="gift-color-preview"
                        style={{ background: color.preview }}
                      />
                      <span className="gift-color-name">{color.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Recipient Info (Optional) */}
              <div className="gift-form-group">
                <label className="gift-form-label">Destinatario (Opzionale)</label>

                <div className="gift-input-with-icon">
                  <User size={18} />
                  <input
                    type="text"
                    value={formData.recipient_name || ''}
                    onChange={(e) => handleInputChange('recipient_name', e.target.value)}
                    className="gift-form-input"
                    disabled={isSubmitting}
                    placeholder="Nome destinatario"
                    maxLength={100}
                  />
                </div>

                <div className="gift-input-with-icon">
                  <Mail size={18} />
                  <input
                    type="email"
                    value={formData.recipient_email || ''}
                    onChange={(e) => handleInputChange('recipient_email', e.target.value)}
                    className={`gift-form-input ${errors.recipient_email ? 'error' : ''}`}
                    disabled={isSubmitting}
                    placeholder="email@esempio.com"
                  />
                </div>
                {errors.recipient_email && <p className="gift-form-error">{errors.recipient_email}</p>}
              </div>

              {/* Personal Message */}
              <div className="gift-form-group">
                <label className="gift-form-label">Messaggio Personale (Opzionale)</label>
                <textarea
                  value={formData.personal_message || ''}
                  onChange={(e) => handleInputChange('personal_message', e.target.value)}
                  className={`gift-form-textarea ${errors.personal_message ? 'error' : ''}`}
                  rows={4}
                  maxLength={500}
                  disabled={isSubmitting}
                  placeholder="Scrivi un messaggio speciale per il destinatario..."
                />
                <div className="gift-char-count">{(formData.personal_message || '').length}/500</div>
                {errors.personal_message && <p className="gift-form-error">{errors.personal_message}</p>}
              </div>

              {/* Validity Period */}
              <div className="gift-form-group">
                <label className="gift-form-label">Valido Fino</label>
                <div className="gift-input-with-icon">
                  <Calendar size={18} />
                  <input
                    type="date"
                    value={formData.valid_until ? formData.valid_until.split('T')[0] : ''}
                    onChange={(e) => handleInputChange('valid_until', e.target.value ? new Date(e.target.value).toISOString() : '')}
                    className="gift-form-input"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Submit Error */}
              {errors.submit && (
                <div className="gift-form-error-box">
                  {errors.submit}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="gift-config-actions">
              <button
                onClick={onClose}
                className="gift-btn gift-btn-cancel"
                disabled={isSubmitting}
              >
                Annulla
              </button>
              <button
                onClick={handleSubmit}
                className="gift-btn gift-btn-save"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creazione...' : 'Crea Gift Certificate'}
              </button>
            </div>
          </div>

          {/* Right Panel - Live Preview */}
          <div className="gift-config-preview-panel">
            <div className="gift-preview-header">
              <Gift size={20} />
              <span>Anteprima Cliente</span>
            </div>

            <div className="gift-preview-scroll">
              {/* Preview Card Grid - matches customer app */}
              <div className="gift-preview-card-container">
                <div
                  className="gift-preview-card"
                  style={{ background: selectedColor.preview }}
                >
                  {/* Gift Icon */}
                  <div className="gift-preview-icon">
                    <Gift size={40} strokeWidth={2} />
                  </div>

                  {/* Code */}
                  <p className="gift-preview-code">{generatedCode}</p>

                  {/* Balance */}
                  <p className="gift-preview-amount">{formatCurrency(formData.original_amount || 0)}</p>

                  {/* Recipient Name Badge */}
                  {formData.recipient_name && (
                    <div className="gift-preview-recipient">
                      <p>Per: {formData.recipient_name}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Personal Message Preview */}
              {formData.personal_message && (
                <div className="gift-preview-message">
                  <h4>Messaggio Personale:</h4>
                  <p>{formData.personal_message}</p>
                </div>
              )}

              {/* Preview Info */}
              <div className="gift-preview-info">
                <p><strong>Anteprima Live</strong></p>
                <p>Questo è esattamente come i clienti vedranno il gift certificate nell'app Wallet.</p>
                {formData.valid_until && (
                  <div className="gift-preview-validity">
                    <Calendar size={16} />
                    <span>Valido fino al {new Date(formData.valid_until).toLocaleDateString('it-IT')}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GiftCertificateConfigPanel;
