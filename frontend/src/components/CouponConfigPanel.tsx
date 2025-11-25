/**
 * Coupon Configuration Panel
 *
 * Two-panel design for creating/editing coupons with live preview
 * Left panel: Form fields for configuration
 * Right panel: Live preview matching customer app layout
 */

import React, { useState, useEffect } from 'react';
import { X, Ticket, Percent, Euro, Calendar, Zap, Clock, Copy, Sparkles, ArrowLeft } from 'lucide-react';
import type { CreateCouponRequest, CouponType, CouponDurationType } from '../types/coupon';
import './CouponConfigPanel.css';

interface CouponConfigPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateCouponRequest) => Promise<any>;
  organizationId: string;
  organizationName: string;
  primaryColor?: string;
  secondaryColor?: string;
}

const COUPON_TYPES: { value: CouponType; label: string; icon: string; badgeText: string }[] = [
  { value: 'percentage', label: 'Sconto %', icon: '%', badgeText: '-20%' },
  { value: 'fixed_amount', label: 'Sconto Fisso', icon: '€', badgeText: '-10€' },
  { value: 'free_product', label: 'Prodotto Gratis', icon: '🎁', badgeText: 'FREE' },
  { value: 'buy_x_get_y', label: 'Compra X Prendi Y', icon: '1+1', badgeText: '2x1' },
  { value: 'free_shipping', label: 'Spedizione Gratis', icon: '📦', badgeText: 'FREE' }
];

const DURATION_TYPES: { value: CouponDurationType; label: string; days: number }[] = [
  { value: 'flash', label: 'Flash (1-3 giorni)', days: 1 },
  { value: 'short', label: 'Breve (1 settimana)', days: 7 },
  { value: 'standard', label: 'Standard (1 mese)', days: 30 },
  { value: 'long', label: 'Lungo (3 mesi)', days: 90 }
];

const CouponConfigPanel: React.FC<CouponConfigPanelProps> = ({
  isOpen,
  onClose,
  onSave,
  organizationId,
  organizationName,
  primaryColor = '#dc2626',
  secondaryColor = '#ef4444'
}) => {
  const [formData, setFormData] = useState<CreateCouponRequest>({
    code: '',
    type: 'percentage',
    value: 20,
    duration_type: 'standard',
    valid_from: new Date().toISOString(),
    valid_until: '',
    title: '',
    description: '',
    terms_conditions: '',
    min_purchase_amount: undefined,
    max_discount_amount: undefined,
    usage_limit: undefined,
    usage_per_customer: undefined,
    customer_tier_required: undefined,
    first_purchase_only: false,
    is_flash: false
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewExpanded, setPreviewExpanded] = useState(true);

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    const now = new Date();
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 30);

    setFormData({
      code: generateCouponCode(),
      type: 'percentage',
      value: 20,
      duration_type: 'standard',
      valid_from: now.toISOString(),
      valid_until: validUntil.toISOString(),
      title: 'Sconto Benvenuto',
      description: 'Ottieni uno sconto esclusivo sul tuo prossimo acquisto.',
      terms_conditions: '',
      min_purchase_amount: undefined,
      max_discount_amount: undefined,
      usage_limit: undefined,
      usage_per_customer: undefined,
      customer_tier_required: undefined,
      first_purchase_only: false,
      is_flash: false
    });
    setErrors({});
    setIsSubmitting(false);
  };

  const generateCouponCode = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleInputChange = (field: keyof CreateCouponRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleDurationChange = (durationType: CouponDurationType) => {
    const duration = DURATION_TYPES.find(d => d.value === durationType);
    if (duration) {
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + duration.days);

      setFormData(prev => ({
        ...prev,
        duration_type: durationType,
        valid_until: validUntil.toISOString(),
        is_flash: durationType === 'flash'
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.code || formData.code.trim().length < 4) {
      newErrors.code = 'Codice richiesto (min 4 caratteri)';
    }
    if (!formData.title || formData.title.trim().length === 0) {
      newErrors.title = 'Titolo richiesto';
    }
    if (!formData.description || formData.description.trim().length === 0) {
      newErrors.description = 'Descrizione richiesta';
    }
    if (formData.type === 'percentage' && (!formData.value || formData.value <= 0 || formData.value > 100)) {
      newErrors.value = 'Percentuale deve essere tra 1 e 100';
    } else if (formData.type === 'fixed_amount' && (!formData.value || formData.value <= 0)) {
      newErrors.value = 'Importo deve essere maggiore di 0';
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
      setErrors({ submit: error.message || 'Errore durante la creazione del coupon' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate badge text based on type and value
  const getBadgeText = (): string => {
    if (formData.type === 'percentage') {
      return `-${formData.value || 0}%`;
    } else if (formData.type === 'fixed_amount') {
      return `-${formData.value || 0}€`;
    } else if (formData.type === 'buy_x_get_y') {
      return '2x1';
    } else {
      return 'FREE';
    }
  };

  const formatExpiryDate = (): string => {
    if (!formData.valid_until) return '';
    const date = new Date(formData.valid_until);
    return date.toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatTimeLeft = (): string => {
    if (!formData.is_flash || !formData.valid_until) return '';
    const now = new Date();
    const expiry = new Date(formData.valid_until);
    const hoursLeft = Math.max(0, Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60)));
    return `${hoursLeft}h`;
  };

  if (!isOpen) return null;

  return (
    <div className="coupon-config-overlay">
      <div className="coupon-config-panel">
        {/* Header */}
        <div className="coupon-config-header">
          <button onClick={onClose} className="coupon-config-back-btn">
            <ArrowLeft size={24} strokeWidth={2.5} />
          </button>
          <h2 className="coupon-config-title">Crea Nuovo Coupon</h2>
          <div style={{ width: '40px' }}></div>
        </div>

        <div className="coupon-config-content">
          {/* Left Panel - Form */}
          <div className="coupon-config-form-panel">
            <div className="coupon-config-form-scroll">
              {/* Code */}
              <div className="coupon-form-group">
                <label className="coupon-form-label">Codice *</label>
                <div className="coupon-code-input-group">
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => handleInputChange('code', e.target.value.toUpperCase())}
                    className={`coupon-form-input coupon-code-input ${errors.code ? 'error' : ''}`}
                    disabled={isSubmitting}
                    maxLength={20}
                  />
                  <button
                    type="button"
                    onClick={() => handleInputChange('code', generateCouponCode())}
                    className="coupon-generate-btn"
                    disabled={isSubmitting}
                  >
                    Genera
                  </button>
                </div>
                {errors.code && <p className="coupon-form-error">{errors.code}</p>}
              </div>

              {/* Type */}
              <div className="coupon-form-group">
                <label className="coupon-form-label">Tipo di Coupon *</label>
                <div className="coupon-type-grid">
                  {COUPON_TYPES.map(type => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => handleInputChange('type', type.value)}
                      className={`coupon-type-btn ${formData.type === type.value ? 'active' : ''}`}
                      disabled={isSubmitting}
                    >
                      <span className="coupon-type-icon">{type.icon}</span>
                      <span className="coupon-type-label">{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Value */}
              {(formData.type === 'percentage' || formData.type === 'fixed_amount') && (
                <div className="coupon-form-group">
                  <label className="coupon-form-label">
                    {formData.type === 'percentage' ? 'Percentuale di Sconto *' : 'Importo Sconto (€) *'}
                  </label>
                  <input
                    type="number"
                    value={formData.value || ''}
                    onChange={(e) => handleInputChange('value', parseFloat(e.target.value))}
                    className={`coupon-form-input ${errors.value ? 'error' : ''}`}
                    min="0"
                    max={formData.type === 'percentage' ? 100 : undefined}
                    step={formData.type === 'percentage' ? 1 : 0.01}
                    disabled={isSubmitting}
                  />
                  {errors.value && <p className="coupon-form-error">{errors.value}</p>}
                </div>
              )}

              {/* Duration */}
              <div className="coupon-form-group">
                <label className="coupon-form-label">Durata *</label>
                <div className="coupon-duration-grid">
                  {DURATION_TYPES.map(duration => (
                    <button
                      key={duration.value}
                      type="button"
                      onClick={() => handleDurationChange(duration.value)}
                      className={`coupon-duration-btn ${formData.duration_type === duration.value ? 'active' : ''}`}
                      disabled={isSubmitting}
                    >
                      {duration.value === 'flash' && <Zap size={14} className="inline mr-1" />}
                      {duration.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div className="coupon-form-group">
                <label className="coupon-form-label">Titolo *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className={`coupon-form-input ${errors.title ? 'error' : ''}`}
                  disabled={isSubmitting}
                  maxLength={100}
                  placeholder="es. Sconto Benvenuto"
                />
                {errors.title && <p className="coupon-form-error">{errors.title}</p>}
              </div>

              {/* Description */}
              <div className="coupon-form-group">
                <label className="coupon-form-label">Descrizione *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className={`coupon-form-textarea ${errors.description ? 'error' : ''}`}
                  rows={3}
                  maxLength={200}
                  disabled={isSubmitting}
                  placeholder="Descrivi l'offerta in modo chiaro e accattivante"
                />
                <div className="coupon-char-count">{formData.description.length}/200</div>
                {errors.description && <p className="coupon-form-error">{errors.description}</p>}
              </div>

              {/* Advanced Options */}
              <div className="coupon-form-group">
                <label className="coupon-form-label">Limitazioni (Opzionale)</label>

                <div className="coupon-advanced-grid">
                  <div>
                    <label className="coupon-form-sublabel">Acquisto Minimo (€)</label>
                    <input
                      type="number"
                      value={formData.min_purchase_amount || ''}
                      onChange={(e) => handleInputChange('min_purchase_amount', e.target.value ? parseFloat(e.target.value) : undefined)}
                      className="coupon-form-input"
                      min="0"
                      step="0.01"
                      disabled={isSubmitting}
                      placeholder="es. 50"
                    />
                  </div>

                  <div>
                    <label className="coupon-form-sublabel">Sconto Massimo (€)</label>
                    <input
                      type="number"
                      value={formData.max_discount_amount || ''}
                      onChange={(e) => handleInputChange('max_discount_amount', e.target.value ? parseFloat(e.target.value) : undefined)}
                      className="coupon-form-input"
                      min="0"
                      step="0.01"
                      disabled={isSubmitting}
                      placeholder="es. 100"
                    />
                  </div>

                  <div>
                    <label className="coupon-form-sublabel">Limite Totale Utilizzi</label>
                    <input
                      type="number"
                      value={formData.usage_limit || ''}
                      onChange={(e) => handleInputChange('usage_limit', e.target.value ? parseInt(e.target.value) : undefined)}
                      className="coupon-form-input"
                      min="1"
                      disabled={isSubmitting}
                      placeholder="es. 100"
                    />
                  </div>

                  <div>
                    <label className="coupon-form-sublabel">Limite per Cliente</label>
                    <input
                      type="number"
                      value={formData.usage_per_customer || ''}
                      onChange={(e) => handleInputChange('usage_per_customer', e.target.value ? parseInt(e.target.value) : undefined)}
                      className="coupon-form-input"
                      min="1"
                      disabled={isSubmitting}
                      placeholder="es. 1"
                    />
                  </div>
                </div>

                <label className="coupon-checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.first_purchase_only}
                    onChange={(e) => handleInputChange('first_purchase_only', e.target.checked)}
                    disabled={isSubmitting}
                  />
                  <span>Solo primo acquisto</span>
                </label>
              </div>

              {/* Terms */}
              <div className="coupon-form-group">
                <label className="coupon-form-label">Termini e Condizioni (Opzionale)</label>
                <textarea
                  value={formData.terms_conditions || ''}
                  onChange={(e) => handleInputChange('terms_conditions', e.target.value)}
                  className="coupon-form-textarea"
                  rows={3}
                  maxLength={500}
                  disabled={isSubmitting}
                  placeholder="Eventuali termini e condizioni aggiuntivi"
                />
              </div>

              {/* Submit Error */}
              {errors.submit && (
                <div className="coupon-form-error-box">
                  {errors.submit}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="coupon-config-actions">
              <button
                onClick={onClose}
                className="coupon-btn coupon-btn-cancel"
                disabled={isSubmitting}
              >
                Annulla
              </button>
              <button
                onClick={handleSubmit}
                className="coupon-btn coupon-btn-save"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Salvataggio...' : 'Salva Coupon'}
              </button>
            </div>
          </div>

          {/* Right Panel - Live Preview */}
          <div className="coupon-config-preview-panel">
            <div className="coupon-preview-header">
              <Ticket size={20} />
              <span>Anteprima Cliente</span>
            </div>

            <div className="coupon-preview-scroll">
              {/* Preview Card - matches customer app exactly */}
              <div className="coupon-preview-card">
                <div className={`coupon-preview-main ${formData.is_flash ? 'flash' : ''}`}>
                  {/* Flash Badge */}
                  {formData.is_flash && (
                    <div className="coupon-preview-flash-badge">
                      <div className="flash-left">
                        <Sparkles size={16} fill="currentColor" />
                        <span>Flash Offer</span>
                      </div>
                      {formData.valid_until && (
                        <div className="flash-right">
                          <Clock size={16} />
                          <span>Scade tra {formatTimeLeft()}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="coupon-preview-body">
                    {/* Left Badge */}
                    <div className={`coupon-preview-badge ${formData.is_flash ? 'flash' : ''}`}>
                      <p>{getBadgeText()}</p>
                      <div className="coupon-preview-notch"></div>
                    </div>

                    {/* Content */}
                    <div className="coupon-preview-content">
                      <div className="coupon-preview-header-row">
                        <h3>{formData.title || 'Titolo Coupon'}</h3>
                        <span className="coupon-preview-status active">ATTIVO</span>
                      </div>

                      <p className="coupon-preview-description">
                        {formData.description || 'Descrizione del coupon apparirà qui'}
                      </p>

                      <div className="coupon-preview-footer">
                        {!formData.is_flash && (
                          <div className="coupon-preview-expiry">
                            <Clock size={16} />
                            <span>Scade: {formatExpiryDate() || 'Data'}</span>
                          </div>
                        )}
                        {formData.is_flash && <div style={{ flex: 1 }}></div>}

                        <button
                          className={`coupon-preview-btn ${formData.is_flash ? 'flash' : ''}`}
                          onClick={() => setPreviewExpanded(!previewExpanded)}
                        >
                          {previewExpanded ? 'Nascondi' : 'Usa Ora'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded QR Section */}
                  <div className={`coupon-preview-qr ${previewExpanded ? 'expanded' : ''}`}>
                    <p className="coupon-preview-qr-text">Mostra questo codice in cassa</p>

                    <div className="coupon-preview-code-box">
                      <span>{formData.code || 'CODICE123'}</span>
                      <Copy size={20} />
                    </div>

                    <div className="coupon-preview-qr-placeholder">
                      <div className="qr-mock"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Preview Info */}
              <div className="coupon-preview-info">
                <p><strong>Anteprima Live</strong></p>
                <p>Questo è esattamente come i clienti vedranno il coupon nell'app.</p>
                {formData.is_flash && (
                  <div className="coupon-preview-flash-note">
                    <Zap size={16} />
                    <span>Coupon Flash attivo - bordo arancione e countdown visibili</span>
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

export default CouponConfigPanel;
