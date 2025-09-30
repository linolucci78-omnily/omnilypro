import React, { useState, useEffect } from 'react';
import { X, Upload, Award, Target, Image, AlertCircle, Percent, Gift, DollarSign, CreditCard } from 'lucide-react';
import './RewardModal.css';

interface RewardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (reward: RewardData) => void;
  reward?: RewardData | null;
  isLoading?: boolean;
  loyaltyTiers?: any[]; // Livelli di fedeltà dall'organizzazione
}

export interface RewardData {
  id?: string;
  name: string;
  type: 'discount' | 'freeProduct' | 'cashback' | 'giftCard';
  value: number | string;
  points_required: number;
  required_tier?: string; // Livello di fedeltà richiesto
  description: string;
  image_url?: string;
  is_active: boolean;
  stock_quantity?: number;
  valid_from?: string;
  valid_until?: string;
  terms_conditions?: string;
}

const REWARD_TYPES = [
  { value: 'discount', label: 'Sconto (€)', icon: Percent },
  { value: 'freeProduct', label: 'Prodotto Gratuito', icon: Gift },
  { value: 'cashback', label: 'Cashback', icon: DollarSign },
  { value: 'giftCard', label: 'Gift Card', icon: CreditCard }
];

const RewardModal: React.FC<RewardModalProps> = ({
  isOpen,
  onClose,
  onSave,
  reward,
  isLoading = false,
  loyaltyTiers = []
}) => {
  const [formData, setFormData] = useState<RewardData>({
    name: '',
    type: 'discount',
    value: '',
    points_required: 100,
    required_tier: loyaltyTiers.length > 0 ? loyaltyTiers[0].name : undefined,
    description: '',
    is_active: true,
    stock_quantity: undefined,
    valid_from: '',
    valid_until: '',
    terms_conditions: ''
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when modal opens/closes or reward changes
  useEffect(() => {
    if (isOpen) {
      if (reward) {
        // Edit mode
        setFormData({ ...reward });
        setImagePreview(reward.image_url || '');
      } else {
        // Create mode - reset form
        setFormData({
          name: '',
          type: 'discount',
          value: '',
          points_required: 100,
          description: '',
          is_active: true,
          stock_quantity: undefined,
          valid_from: '',
          valid_until: '',
          terms_conditions: ''
        });
        setImagePreview('');
      }
      setImageFile(null);
      setErrors({});
    }
  }, [isOpen, reward]);

  const handleInputChange = (field: keyof RewardData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setErrors(prev => ({ ...prev, image: 'Immagine troppo grande (max 5MB)' }));
        return;
      }

      setImageFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Clear error
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.image;
        return newErrors;
      });
    }
  };

  const handleImageUploadClick = () => {
    // Usa input file con attributo capture per Android
    console.log('📸 Aprendo fotocamera per cattura immagine...');
    const input = document.querySelector('.image-input') as HTMLInputElement;
    if (input) {
      input.click();
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome premio richiesto';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Descrizione richiesta';
    }

    if (!formData.value || (typeof formData.value === 'string' && !formData.value.trim())) {
      newErrors.value = 'Valore richiesto';
    }

    if (formData.points_required < 1) {
      newErrors.points_required = 'Punti richiesti devono essere maggiori di 0';
    }

    if (formData.valid_from && formData.valid_until) {
      const fromDate = new Date(formData.valid_from);
      const untilDate = new Date(formData.valid_until);
      if (fromDate >= untilDate) {
        newErrors.valid_until = 'Data fine deve essere successiva a data inizio';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Prepare data for submission
    const submitData = {
      ...formData,
      imageFile // Include file for upload
    };

    onSave(submitData as any);
  };

  if (!isOpen) return null;

  return (
    <div className="reward-modal-backdrop">
      <div className={`reward-modal ${isOpen ? 'open' : ''}`}>
        <div className="reward-modal-header">
          <div className="reward-modal-header-info">
            <h2>
              <Award size={24} />
              {reward ? 'Modifica Premio' : 'Nuovo Premio'}
            </h2>
            {formData.required_tier && (
              <div className="reward-tier-badge">
                <Target size={16} />
                Richiede: {formData.required_tier}
              </div>
            )}
          </div>
          <button
            className="reward-modal-close"
            onClick={onClose}
            disabled={isLoading}
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="reward-modal-form">
          <div className="reward-modal-content">

            {/* Image Upload Section */}
            <div className="form-section">
              <label className="form-label">Immagine Premio</label>
              <div className="image-upload-area" onClick={imagePreview ? undefined : handleImageUploadClick}>
                {imagePreview ? (
                  <div className="image-preview">
                    <img src={imagePreview} alt="Preview" />
                    <button
                      type="button"
                      className="remove-image-btn"
                      onClick={() => {
                        setImagePreview('');
                        setImageFile(null);
                        handleInputChange('image_url', '');
                      }}
                      title="Rimuovi immagine"
                    >
                      🗑️
                    </button>
                  </div>
                ) : (
                  <div className="upload-placeholder" style={{ cursor: 'pointer' }}>
                    <Image size={32} />
                    <span>📸 Clicca per scattare/caricare foto</span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="image-input"
                  style={{ display: 'none' }}
                />
              </div>
              {errors.image && (
                <div className="error-message">
                  <AlertCircle size={16} />
                  {errors.image}
                </div>
              )}
            </div>

            <div className="form-grid">
              {/* Basic Info */}
              <div className="form-group">
                <label className="form-label">Nome Premio *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`form-input ${errors.name ? 'error' : ''}`}
                  placeholder="es. Caffè Gratuito"
                  disabled={isLoading}
                />
                {errors.name && <div className="error-message">{errors.name}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">Tipo Premio *</label>
                <div className="reward-types-grid">
                  {REWARD_TYPES.map(type => {
                    const IconComponent = type.icon;
                    return (
                      <label
                        key={type.value}
                        className={`reward-type-option ${formData.type === type.value ? 'selected' : ''}`}
                      >
                        <input
                          type="radio"
                          name="reward-type"
                          value={type.value}
                          checked={formData.type === type.value}
                          onChange={(e) => handleInputChange('type', e.target.value)}
                          disabled={isLoading}
                        />
                        <div className="reward-type-content">
                          <IconComponent size={20} />
                          <span>{type.label}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Target size={16} />
                  Punti Richiesti *
                </label>
                <input
                  type="number"
                  value={formData.points_required}
                  onChange={(e) => handleInputChange('points_required', parseInt(e.target.value) || 0)}
                  className={`form-input ${errors.points_required ? 'error' : ''}`}
                  min="1"
                  disabled={isLoading}
                />
                {errors.points_required && <div className="error-message">{errors.points_required}</div>}
              </div>

              {loyaltyTiers && loyaltyTiers.length > 0 && (
                <div className="form-group">
                  <div className="tier-requirement-toggle">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={!!formData.required_tier}
                        onChange={(e) => {
                          if (e.target.checked) {
                            // Se spuntata, imposta il primo livello disponibile
                            const firstTier = loyaltyTiers.length > 0 ? loyaltyTiers[0].name : '';
                            handleInputChange('required_tier', firstTier);
                          } else {
                            // Se non spuntata, rimuovi il requisito livello
                            handleInputChange('required_tier', undefined);
                          }
                        }}
                        disabled={isLoading}
                      />
                      <span className="checkbox-text">
                        Richiede livello di fedeltà oltre ai punti
                      </span>
                    </label>
                  </div>

                  {formData.required_tier && (
                    <div className="tier-select-group">
                      <label className="form-label">Livello Richiesto</label>
                      <select
                        value={formData.required_tier || ''}
                        onChange={(e) => handleInputChange('required_tier', e.target.value || undefined)}
                        className="form-input"
                        disabled={isLoading}
                      >
                        {loyaltyTiers.map((tier: any) => (
                          <option key={tier.name} value={tier.name}>
                            {tier.name} ({tier.threshold}+ punti)
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Valore *</label>
                <input
                  type={formData.type === 'discount' || formData.type === 'cashback' ? 'number' : 'text'}
                  value={formData.value}
                  onChange={(e) => handleInputChange('value', e.target.value)}
                  className={`form-input ${errors.value ? 'error' : ''}`}
                  placeholder={formData.type === 'discount' ? 'es. 5' : 'es. Cappuccino'}
                  disabled={isLoading}
                />
                {errors.value && <div className="error-message">{errors.value}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">Quantità Disponibile</label>
                <input
                  type="number"
                  value={formData.stock_quantity || ''}
                  onChange={(e) => handleInputChange('stock_quantity', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="form-input"
                  placeholder="Illimitato se vuoto"
                  min="0"
                  disabled={isLoading}
                />
              </div>

              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => handleInputChange('is_active', e.target.checked)}
                    disabled={isLoading}
                  />
                  <span className="checkmark"></span>
                  Premio Attivo
                </label>
              </div>
            </div>

            {/* Description */}
            <div className="form-group">
              <label className="form-label">Descrizione *</label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className={`form-textarea ${errors.description ? 'error' : ''}`}
                placeholder="Descrizione dettagliata del premio..."
                rows={3}
                disabled={isLoading}
              />
              {errors.description && <div className="error-message">{errors.description}</div>}
            </div>

            {/* Validity Period */}
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Valido Da</label>
                <input
                  type="date"
                  value={formData.valid_from || ''}
                  onChange={(e) => handleInputChange('valid_from', e.target.value)}
                  className="form-input"
                  disabled={isLoading}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Valido Fino</label>
                <input
                  type="date"
                  value={formData.valid_until || ''}
                  onChange={(e) => handleInputChange('valid_until', e.target.value)}
                  className={`form-input ${errors.valid_until ? 'error' : ''}`}
                  disabled={isLoading}
                />
                {errors.valid_until && <div className="error-message">{errors.valid_until}</div>}
              </div>
            </div>

            {/* Terms & Conditions */}
            <div className="form-group">
              <label className="form-label">Termini e Condizioni</label>
              <textarea
                value={formData.terms_conditions || ''}
                onChange={(e) => handleInputChange('terms_conditions', e.target.value)}
                className="form-textarea"
                placeholder="Termini e condizioni specifici per questo premio..."
                rows={2}
                disabled={isLoading}
              />
            </div>

          </div>

          <div className="reward-modal-actions">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={isLoading}
            >
              Annulla
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isLoading}
            >
              {isLoading ? (
                <>⏳ Salvando...</>
              ) : (
                <>{reward ? 'Aggiorna Premio' : 'Crea Premio'}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RewardModal;