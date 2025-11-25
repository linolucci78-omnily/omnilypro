/**
 * Issue Coupon Modal - Full Page
 *
 * Full-page modal for creating new coupons with all required fields
 * Follows same full-page style as other modals in the app
 */

import React, { useState, useEffect } from 'react';
import { X, Ticket, Percent, Euro, Calendar, FileText, AlertCircle, Zap, Tag, ArrowLeft } from 'lucide-react';
import type {
  CreateCouponRequest,
  CouponType,
  CouponDurationType
} from '../types/coupon';

interface IssueCouponModalProps {
  isOpen: boolean;
  onClose: () => void;
  onIssue: (data: CreateCouponRequest) => Promise<any>;
  organizationId: string;
  organizationName: string;
}

const COUPON_TYPES: { value: CouponType; label: string; icon: string }[] = [
  { value: 'percentage', label: 'Sconto %', icon: '%' },
  { value: 'fixed_amount', label: 'Sconto Fisso', icon: '€' },
  { value: 'free_product', label: 'Prodotto Gratis', icon: '🎁' },
  { value: 'buy_x_get_y', label: 'Compra X Prendi Y', icon: '1+1' },
  { value: 'free_shipping', label: 'Spedizione Gratis', icon: '📦' }
];

const DURATION_TYPES: { value: CouponDurationType; label: string; days: number }[] = [
  { value: 'flash', label: 'Flash (1-3 giorni)', days: 1 },
  { value: 'short', label: 'Breve (1 settimana)', days: 7 },
  { value: 'standard', label: 'Standard (1 mese)', days: 30 },
  { value: 'long', label: 'Lungo (3 mesi)', days: 90 }
];

const IssueCouponModal: React.FC<IssueCouponModalProps> = ({
  isOpen,
  onClose,
  onIssue,
  organizationId,
  organizationName
}) => {
  const [formData, setFormData] = useState<CreateCouponRequest>({
    code: '',
    type: 'percentage',
    value: 0,
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
      value: 0,
      duration_type: 'standard',
      valid_from: now.toISOString(),
      valid_until: validUntil.toISOString(),
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await onIssue(formData);
      onClose();
    } catch (error: any) {
      setErrors({ submit: error.message || 'Errore durante la creazione del coupon' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white flex items-center justify-center z-[9999] overflow-y-auto" onClick={onClose}>
      <div className="w-full max-w-2xl p-6 max-h-screen overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6 text-gray-900" strokeWidth={2.5} />
          </button>
          <h2 className="text-xl font-black text-gray-900">Crea Coupon</h2>
          <div className="w-10"></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Code */}
          <div>
            <label className="block text-gray-600 text-xs font-bold mb-2 uppercase tracking-wide">Codice *</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.code}
                onChange={(e) => handleInputChange('code', e.target.value.toUpperCase())}
                className={`flex-1 px-4 py-3 border-2 rounded-xl font-mono font-bold ${errors.code ? 'border-red-500' : 'border-gray-200'}`}
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => handleInputChange('code', generateCouponCode())}
                className="px-4 py-3 bg-gray-100 rounded-xl font-bold hover:bg-gray-200"
                disabled={isSubmitting}
              >
                Genera
              </button>
            </div>
            {errors.code && <p className="text-red-500 text-xs mt-1">{errors.code}</p>}
          </div>

          {/* Type */}
          <div>
            <label className="block text-gray-600 text-xs font-bold mb-2 uppercase tracking-wide">Tipo *</label>
            <div className="grid grid-cols-2 gap-2">
              {COUPON_TYPES.map(type => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => handleInputChange('type', type.value)}
                  className={`px-4 py-3 rounded-xl font-bold transition-colors ${formData.type === type.value ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  disabled={isSubmitting}
                >
                  {type.icon} {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Value */}
          {(formData.type === 'percentage' || formData.type === 'fixed_amount') && (
            <div>
              <label className="block text-gray-600 text-xs font-bold mb-2 uppercase tracking-wide">
                {formData.type === 'percentage' ? 'Percentuale *' : 'Importo *'}
              </label>
              <input
                type="number"
                value={formData.value || ''}
                onChange={(e) => handleInputChange('value', parseFloat(e.target.value))}
                className={`w-full px-4 py-3 border-2 rounded-xl ${errors.value ? 'border-red-500' : 'border-gray-200'}`}
                min="0"
                max={formData.type === 'percentage' ? 100 : undefined}
                step={formData.type === 'percentage' ? 1 : 0.01}
                disabled={isSubmitting}
              />
              {errors.value && <p className="text-red-500 text-xs mt-1">{errors.value}</p>}
            </div>
          )}

          {/* Duration */}
          <div>
            <label className="block text-gray-600 text-xs font-bold mb-2 uppercase tracking-wide">Durata *</label>
            <div className="grid grid-cols-2 gap-2">
              {DURATION_TYPES.map(duration => (
                <button
                  key={duration.value}
                  type="button"
                  onClick={() => handleDurationChange(duration.value)}
                  className={`px-4 py-3 rounded-xl font-bold transition-colors ${formData.duration_type === duration.value ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  disabled={isSubmitting}
                >
                  {duration.value === 'flash' && <Zap size={14} className="inline mr-1" />}
                  {duration.label}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-gray-600 text-xs font-bold mb-2 uppercase tracking-wide">Titolo *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className={`w-full px-4 py-3 border-2 rounded-xl ${errors.title ? 'border-red-500' : 'border-gray-200'}`}
              disabled={isSubmitting}
            />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-gray-600 text-xs font-bold mb-2 uppercase tracking-wide">Descrizione *</label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className={`w-full px-4 py-3 border-2 rounded-xl ${errors.description ? 'border-red-500' : 'border-gray-200'}`}
              rows={3}
              maxLength={200}
              disabled={isSubmitting}
            />
            <div className="text-xs text-gray-500 mt-1">{formData.description.length}/200</div>
            {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="p-4 bg-red-50 border-2 border-red-500 rounded-xl text-red-700 text-sm">
              {errors.submit}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 bg-gray-100 text-gray-700 rounded-2xl font-bold hover:bg-gray-200"
              disabled={isSubmitting}
            >
              Annulla
            </button>
            <button
              type="submit"
              className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creazione...' : 'Crea Coupon'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default IssueCouponModal;
