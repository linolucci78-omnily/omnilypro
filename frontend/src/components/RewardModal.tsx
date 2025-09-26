import React, { useState, useEffect } from 'react';
import { X, Upload, Award, Target, Image, AlertCircle } from 'lucide-react';
import './RewardModal.css';

interface RewardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (reward: RewardData) => void;
  reward?: RewardData | null;
  isLoading?: boolean;
}

export interface RewardData {
  id?: string;
  name: string;
  type: 'discount' | 'freeProduct' | 'cashback' | 'giftCard';
  value: number | string;
  points_required: number;
  description: string;
  image_url?: string;
  is_active: boolean;
  stock_quantity?: number;
  valid_from?: string;
  valid_until?: string;
  terms_conditions?: string;
}

const REWARD_TYPES = [
  { value: 'discount', label: 'Sconto (€)', icon: '💰' },
  { value: 'freeProduct', label: 'Prodotto Gratuito', icon: '🎁' },
  { value: 'cashback', label: 'Cashback', icon: '💸' },
  { value: 'giftCard', label: 'Gift Card', icon: '🎟️' }
];

const RewardModal: React.FC<RewardModalProps> = ({
  isOpen,
  onClose,
  onSave,
  reward,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<RewardData>({
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
      <div className="reward-modal">
        <div className="reward-modal-header">
          <h2>
            <Award size={24} />
            {reward ? 'Modifica Premio' : 'Nuovo Premio'}
          </h2>
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
              <div className="image-upload-area">
                {imagePreview ? (
                  <div className="image-preview">
                    <img src={imagePreview} alt="Preview" />
                    <button
                      type="button"
                      className="remove-image"
                      onClick={() => {
                        setImagePreview('');
                        setImageFile(null);
                        handleInputChange('image_url', '');
                      }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="upload-placeholder">
                    <Image size={32} />
                    <span>Clicca per caricare immagine</span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="image-input"
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
                <select
                  value={formData.type}
                  onChange={(e) => handleInputChange('type', e.target.value)}
                  className="form-input"
                  disabled={isLoading}
                >
                  {REWARD_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.icon} {type.label}
                    </option>
                  ))}
                </select>
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