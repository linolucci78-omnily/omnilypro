/**
 * Create Template Modal
 *
 * Modal for admin to create subscription templates.
 * Multi-step wizard: Basic Info → Duration & Limits → Restrictions → Pricing
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Package,
  Calendar,
  TrendingUp,
  Euro,
  Clock,
  Tag,
  Check,
  Loader,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { subscriptionsService } from '../services/subscriptionsService';
import type {
  SubscriptionType,
  DurationType,
  SubscriptionVisibility,
  AllowedDay,
  CreateSubscriptionTemplateRequest
} from '../types/subscription';
import './CreateTemplateModal.css';

interface CreateTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  onSuccess: () => void;
}

type Step = 'basic' | 'duration' | 'restrictions' | 'pricing';

const SUBSCRIPTION_TYPES: { value: SubscriptionType; label: string; description: string }[] = [
  { value: 'daily_item', label: '1 Articolo/Giorno', description: 'Cliente può usare 1 articolo al giorno' },
  { value: 'daily_multiple', label: 'X Articoli/Giorno', description: 'Cliente può usare X articoli al giorno' },
  { value: 'total_items', label: 'X Articoli Totali', description: 'Cliente ha X utilizzi nel periodo' },
  { value: 'unlimited_access', label: 'Accesso Illimitato', description: 'Utilizzi illimitati nel periodo' },
  { value: 'service_bundle', label: 'Pacchetto Servizi', description: 'Servizi specifici inclusi' }
];

const DURATION_TYPES: { value: DurationType; label: string }[] = [
  { value: 'days', label: 'Giorni' },
  { value: 'weeks', label: 'Settimane' },
  { value: 'months', label: 'Mesi' },
  { value: 'years', label: 'Anni' }
];

const WEEKDAYS: { value: AllowedDay; label: string }[] = [
  { value: 'monday', label: 'Lun' },
  { value: 'tuesday', label: 'Mar' },
  { value: 'wednesday', label: 'Mer' },
  { value: 'thursday', label: 'Gio' },
  { value: 'friday', label: 'Ven' },
  { value: 'saturday', label: 'Sab' },
  { value: 'sunday', label: 'Dom' }
];

const CreateTemplateModal: React.FC<CreateTemplateModalProps> = ({
  isOpen,
  onClose,
  organizationId,
  onSuccess
}) => {
  const [step, setStep] = useState<Step>('basic');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdTemplateName, setCreatedTemplateName] = useState('');

  // Form data
  const [formData, setFormData] = useState<CreateSubscriptionTemplateRequest>({
    organization_id: organizationId,
    name: '',
    description: '',
    subscription_type: 'daily_item',
    duration_type: 'weeks',
    duration_value: 1,
    price: 0,
    currency: 'EUR',
    auto_renewable: false,
    renewable_manually: true,
    is_active: true,
    visibility: 'public'
  });

  // Temporary states for arrays
  const [categoryInput, setCategoryInput] = useState('');
  const [excludedCategoryInput, setExcludedCategoryInput] = useState('');
  const [includedCategories, setIncludedCategories] = useState<string[]>([]);
  const [excludedCategories, setExcludedCategories] = useState<string[]>([]);
  const [allowedDays, setAllowedDays] = useState<AllowedDay[]>([]);
  const [timeStart, setTimeStart] = useState('');
  const [timeEnd, setTimeEnd] = useState('');

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setStep('basic');
    setLoading(false);
    setError(null);
    setShowSuccess(false);
    setCreatedTemplateName('');
    setFormData({
      organization_id: organizationId,
      name: '',
      description: '',
      subscription_type: 'daily_item',
      duration_type: 'weeks',
      duration_value: 1,
      price: 0,
      currency: 'EUR',
      auto_renewable: false,
      renewable_manually: true,
      is_active: true,
      visibility: 'public'
    });
    setIncludedCategories([]);
    setExcludedCategories([]);
    setAllowedDays([]);
    setTimeStart('');
    setTimeEnd('');
    setCategoryInput('');
    setExcludedCategoryInput('');
  };

  const handleNext = () => {
    setError(null);

    if (step === 'basic') {
      if (!formData.name.trim()) {
        setError('Nome obbligatorio');
        return;
      }
      setStep('duration');
    } else if (step === 'duration') {
      if (!formData.duration_value || formData.duration_value <= 0) {
        setError('Durata deve essere maggiore di 0');
        return;
      }
      setStep('restrictions');
    } else if (step === 'restrictions') {
      setStep('pricing');
    }
  };

  const handleBack = () => {
    setError(null);
    if (step === 'duration') setStep('basic');
    else if (step === 'restrictions') setStep('duration');
    else if (step === 'pricing') setStep('restrictions');
  };

  const handleCreate = async () => {
    if (!formData.price || formData.price <= 0) {
      setError('Prezzo deve essere maggiore di 0');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Build final request
      const request: CreateSubscriptionTemplateRequest = {
        ...formData,
        included_categories: includedCategories.length > 0 ? includedCategories : undefined,
        excluded_categories: excludedCategories.length > 0 ? excludedCategories : undefined,
        allowed_days: allowedDays.length > 0 ? allowedDays : undefined,
        allowed_hours: (timeStart && timeEnd) ? { start: timeStart, end: timeEnd } : undefined
      };

      console.log('📝 Creating template:', request);
      const response = await subscriptionsService.createTemplate(request);
      console.log('✅ Template creation response:', response);

      if (!response.success) {
        throw new Error(response.error || 'Errore durante la creazione del template');
      }

      // Show success message
      setCreatedTemplateName(formData.name);
      setShowSuccess(true);

      // Call onSuccess after showing message
      setTimeout(() => {
        onSuccess();
        setTimeout(() => {
          onClose();
        }, 300);
      }, 2000);
    } catch (err: any) {
      console.error('❌ Error creating template:', err);
      setError(err.message || 'Errore durante la creazione del template');
    } finally {
      setLoading(false);
    }
  };

  const addCategory = () => {
    if (categoryInput.trim() && !includedCategories.includes(categoryInput.trim())) {
      setIncludedCategories([...includedCategories, categoryInput.trim()]);
      setCategoryInput('');
    }
  };

  const removeCategory = (category: string) => {
    setIncludedCategories(includedCategories.filter(c => c !== category));
  };

  const addExcludedCategory = () => {
    if (excludedCategoryInput.trim() && !excludedCategories.includes(excludedCategoryInput.trim())) {
      setExcludedCategories([...excludedCategories, excludedCategoryInput.trim()]);
      setExcludedCategoryInput('');
    }
  };

  const removeExcludedCategory = (category: string) => {
    setExcludedCategories(excludedCategories.filter(c => c !== category));
  };

  const toggleDay = (day: AllowedDay) => {
    if (allowedDays.includes(day)) {
      setAllowedDays(allowedDays.filter(d => d !== day));
    } else {
      setAllowedDays([...allowedDays, day]);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="create-template-overlay" onClick={onClose} />

      <div className="create-template-modal">
        {/* Header */}
        <div className="create-template-header">
          <div className="create-template-header-info">
            <Package size={24} />
            <h2>Crea Nuovo Template</h2>
          </div>
          <button onClick={onClose} className="create-template-close-btn">
            <X size={24} />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="create-template-steps">
          <div className={`step-item ${step === 'basic' ? 'active' : ''} ${step !== 'basic' ? 'completed' : ''}`}>
            <div className="step-number">1</div>
            <div className="step-label">Info Base</div>
          </div>
          <div className="step-divider" />
          <div className={`step-item ${step === 'duration' ? 'active' : ''} ${step === 'restrictions' || step === 'pricing' ? 'completed' : ''}`}>
            <div className="step-number">2</div>
            <div className="step-label">Durata</div>
          </div>
          <div className="step-divider" />
          <div className={`step-item ${step === 'restrictions' ? 'active' : ''} ${step === 'pricing' ? 'completed' : ''}`}>
            <div className="step-number">3</div>
            <div className="step-label">Restrizioni</div>
          </div>
          <div className="step-divider" />
          <div className={`step-item ${step === 'pricing' ? 'active' : ''}`}>
            <div className="step-number">4</div>
            <div className="step-label">Prezzo</div>
          </div>
        </div>

        {/* Content */}
        <div className="create-template-content">
          {error && (
            <div className="create-template-error">
              {error}
            </div>
          )}

          {/* Success Message */}
          {showSuccess && (
            <div className="success-section">
              <div className="success-icon">
                <Check size={48} />
              </div>
              <h3>Template Creato!</h3>
              <div className="success-message">
                Il template <strong>{createdTemplateName}</strong> è stato creato con successo.
              </div>
            </div>
          )}

          {/* Step 1: Basic Info */}
          {!showSuccess && step === 'basic' && (
            <div className="form-step">
              <h3>Informazioni Base</h3>

              <div className="form-group">
                <label>Nome Template *</label>
                <input
                  type="text"
                  placeholder="Es: Pizza Settimanale, Coffee Lover..."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="form-input"
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label>Descrizione</label>
                <textarea
                  placeholder="Es: 1 pizza al giorno per 7 giorni"
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="form-textarea"
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label>Tipo Abbonamento</label>
                <div className="subscription-types-grid">
                  {SUBSCRIPTION_TYPES.map(type => (
                    <div
                      key={type.value}
                      className={`subscription-type-card ${formData.subscription_type === type.value ? 'active' : ''}`}
                      onClick={() => setFormData({ ...formData, subscription_type: type.value })}
                    >
                      <div className="type-label">{type.label}</div>
                      <div className="type-description">{type.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Duration & Limits */}
          {!showSuccess && step === 'duration' && (
            <div className="form-step">
              <h3>Durata e Limiti</h3>

              <div className="form-row">
                <div className="form-group">
                  <label>Durata *</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.duration_value}
                    onChange={(e) => setFormData({ ...formData, duration_value: parseInt(e.target.value) || 1 })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>Unità</label>
                  <select
                    value={formData.duration_type}
                    onChange={(e) => setFormData({ ...formData, duration_type: e.target.value as DurationType })}
                    className="form-select"
                  >
                    {DURATION_TYPES.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Limite Giornaliero</label>
                <input
                  type="number"
                  min="0"
                  placeholder="Lascia vuoto per nessun limite"
                  value={formData.daily_limit || ''}
                  onChange={(e) => setFormData({ ...formData, daily_limit: e.target.value ? parseInt(e.target.value) : undefined })}
                  className="form-input"
                />
                <small className="form-hint">Numero massimo di utilizzi al giorno</small>
              </div>

              <div className="form-group">
                <label>Limite Settimanale</label>
                <input
                  type="number"
                  min="0"
                  placeholder="Lascia vuoto per nessun limite"
                  value={formData.weekly_limit || ''}
                  onChange={(e) => setFormData({ ...formData, weekly_limit: e.target.value ? parseInt(e.target.value) : undefined })}
                  className="form-input"
                />
                <small className="form-hint">Numero massimo di utilizzi a settimana</small>
              </div>

              <div className="form-group">
                <label>Limite Totale</label>
                <input
                  type="number"
                  min="0"
                  placeholder="Lascia vuoto per nessun limite"
                  value={formData.total_limit || ''}
                  onChange={(e) => setFormData({ ...formData, total_limit: e.target.value ? parseInt(e.target.value) : undefined })}
                  className="form-input"
                />
                <small className="form-hint">Numero massimo di utilizzi nel periodo</small>
              </div>
            </div>
          )}

          {/* Step 3: Restrictions */}
          {!showSuccess && step === 'restrictions' && (
            <div className="form-step">
              <h3>Restrizioni</h3>

              <div className="form-group">
                <label>Categorie Incluse</label>
                <div className="tag-input-wrapper">
                  <input
                    type="text"
                    placeholder="Es: Pizze, Bevande..."
                    value={categoryInput}
                    onChange={(e) => setCategoryInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCategory())}
                    className="form-input"
                  />
                  <button
                    type="button"
                    onClick={addCategory}
                    className="btn-add-tag"
                  >
                    Aggiungi
                  </button>
                </div>
                {includedCategories.length > 0 && (
                  <div className="tags-list">
                    {includedCategories.map(category => (
                      <span key={category} className="tag">
                        {category}
                        <button onClick={() => removeCategory(category)}>
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <small className="form-hint">Lascia vuoto per includere tutte le categorie</small>
              </div>

              <div className="form-group">
                <label>Categorie Escluse</label>
                <div className="tag-input-wrapper">
                  <input
                    type="text"
                    placeholder="Es: Alcool, Menu Degustazione..."
                    value={excludedCategoryInput}
                    onChange={(e) => setExcludedCategoryInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addExcludedCategory())}
                    className="form-input"
                  />
                  <button
                    type="button"
                    onClick={addExcludedCategory}
                    className="btn-add-tag"
                  >
                    Aggiungi
                  </button>
                </div>
                {excludedCategories.length > 0 && (
                  <div className="tags-list">
                    {excludedCategories.map(category => (
                      <span key={category} className="tag excluded">
                        {category}
                        <button onClick={() => removeExcludedCategory(category)}>
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Prezzo Massimo per Articolo (€)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Lascia vuoto per nessun limite"
                  value={formData.max_price_per_item || ''}
                  onChange={(e) => setFormData({ ...formData, max_price_per_item: e.target.value ? parseFloat(e.target.value) : undefined })}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Orari Consentiti</label>
                <div className="form-row">
                  <div className="form-group">
                    <input
                      type="time"
                      value={timeStart}
                      onChange={(e) => setTimeStart(e.target.value)}
                      className="form-input"
                      placeholder="Inizio"
                    />
                  </div>
                  <div className="form-group">
                    <input
                      type="time"
                      value={timeEnd}
                      onChange={(e) => setTimeEnd(e.target.value)}
                      className="form-input"
                      placeholder="Fine"
                    />
                  </div>
                </div>
                <small className="form-hint">Lascia vuoto per nessuna restrizione oraria</small>
              </div>

              <div className="form-group">
                <label>Giorni Consentiti</label>
                <div className="weekdays-selector">
                  {WEEKDAYS.map(day => (
                    <button
                      key={day.value}
                      type="button"
                      className={`weekday-btn ${allowedDays.includes(day.value) ? 'active' : ''}`}
                      onClick={() => toggleDay(day.value)}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
                <small className="form-hint">Lascia vuoto per tutti i giorni</small>
              </div>
            </div>
          )}

          {/* Step 4: Pricing */}
          {!showSuccess && step === 'pricing' && (
            <div className="form-step">
              <h3>Prezzo e Impostazioni</h3>

              <div className="form-group">
                <label>Prezzo Abbonamento (€) *</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price || ''}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  className="form-input price-input"
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label>Prezzo Originale (€)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Per mostrare il risparmio"
                  value={formData.original_price || ''}
                  onChange={(e) => setFormData({ ...formData, original_price: e.target.value ? parseFloat(e.target.value) : undefined })}
                  className="form-input"
                />
                {formData.original_price && formData.original_price > formData.price && (
                  <small className="form-hint savings">
                    Risparmio: €{(formData.original_price - formData.price).toFixed(2)}
                  </small>
                )}
              </div>

              <div className="form-group">
                <label>Visibilità</label>
                <select
                  value={formData.visibility || 'public'}
                  onChange={(e) => setFormData({ ...formData, visibility: e.target.value as SubscriptionVisibility })}
                  className="form-select"
                >
                  <option value="public">Pubblico</option>
                  <option value="hidden">Nascosto</option>
                  <option value="vip_only">Solo VIP</option>
                </select>
              </div>

              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.renewable_manually || false}
                    onChange={(e) => setFormData({ ...formData, renewable_manually: e.target.checked })}
                  />
                  <span>Rinnovabile manualmente</span>
                </label>
              </div>

              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.auto_renewable || false}
                    onChange={(e) => setFormData({ ...formData, auto_renewable: e.target.checked })}
                  />
                  <span>Rinnovo automatico</span>
                </label>
              </div>

              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.is_active !== false}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  />
                  <span>Attivo</span>
                </label>
              </div>

              {/* Summary */}
              <div className="template-summary">
                <h4>Riepilogo Template</h4>
                <div className="summary-grid">
                  <div className="summary-item">
                    <span>Nome:</span>
                    <strong>{formData.name}</strong>
                  </div>
                  <div className="summary-item">
                    <span>Tipo:</span>
                    <strong>{SUBSCRIPTION_TYPES.find(t => t.value === formData.subscription_type)?.label}</strong>
                  </div>
                  <div className="summary-item">
                    <span>Durata:</span>
                    <strong>{formData.duration_value} {DURATION_TYPES.find(t => t.value === formData.duration_type)?.label.toLowerCase()}</strong>
                  </div>
                  <div className="summary-item">
                    <span>Prezzo:</span>
                    <strong className="price">€{formData.price.toFixed(2)}</strong>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {!showSuccess && (
          <div className="create-template-footer">
            {step !== 'basic' && (
              <button
                className="btn-footer btn-back"
                onClick={handleBack}
                disabled={loading}
              >
                <ChevronLeft size={20} />
                Indietro
              </button>
            )}

            {step !== 'pricing' ? (
              <button
                className="btn-footer btn-next"
                onClick={handleNext}
                disabled={loading}
              >
                Avanti
                <ChevronRight size={20} />
              </button>
            ) : (
              <button
                className="btn-footer btn-create"
                onClick={handleCreate}
                disabled={loading}
              >
                {loading ? <Loader size={20} className="spinning" /> : <Check size={20} />}
                Crea Template
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default CreateTemplateModal;
