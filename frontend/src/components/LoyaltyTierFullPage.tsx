/**
 * Loyalty Tier Full Page - Create/Edit Loyalty Tiers
 * FULLPAGE VERSION - Beautiful editor with live preview!
 */

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Star, Award, Crown, Trophy, Zap, Plus, Trash2, Target, Gift } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import Toast from './UI/Toast';
import './LoyaltyTierFullPage.css';

interface LoyaltyTier {
  name: string;
  threshold: string;
  maxThreshold?: string;
  multiplier: string;
  color: string;
  benefits: string[];
}

interface LoyaltyTierFullPageProps {
  tier: LoyaltyTier | null;
  organizationId: string;
  primaryColor: string;
  secondaryColor: string;
  onBack: () => void;
  onSave: (tier: LoyaltyTier) => Promise<void>;
}

const TIER_COLORS = [
  { value: '#94a3b8', label: 'Grigio' },
  { value: '#3b82f6', label: 'Blu' },
  { value: '#8b5cf6', label: 'Viola' },
  { value: '#f59e0b', label: 'Arancione' },
  { value: '#ef4444', label: 'Rosso' },
  { value: '#22c55e', label: 'Verde' },
  { value: '#ec4899', label: 'Rosa' },
  { value: '#14b8a6', label: 'Teal' },
];

const LoyaltyTierFullPage: React.FC<LoyaltyTierFullPageProps> = ({
  tier,
  organizationId,
  primaryColor,
  secondaryColor,
  onBack,
  onSave,
}) => {
  const [formData, setFormData] = useState<LoyaltyTier>({
    name: '',
    threshold: '0',
    maxThreshold: '',
    multiplier: '1',
    color: '#94a3b8',
    benefits: [],
  });

  const [loading, setLoading] = useState(false);
  const [newBenefit, setNewBenefit] = useState('');
  const { toast, showSuccess, showError, hideToast } = useToast();

  useEffect(() => {
    if (tier) {
      setFormData({
        name: tier.name,
        threshold: tier.threshold,
        maxThreshold: tier.maxThreshold || '',
        multiplier: tier.multiplier,
        color: tier.color,
        benefits: tier.benefits || [],
      });
    } else {
      // Reset form for new tier
      setFormData({
        name: '',
        threshold: '0',
        maxThreshold: '',
        multiplier: '1',
        color: '#94a3b8',
        benefits: [],
      });
    }
  }, [tier]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onSave(formData);
      showSuccess('✅ Livello salvato con successo!');
    } catch (error) {
      console.error('Error saving tier:', error);
      showError('❌ Errore durante il salvataggio');
    } finally {
      setLoading(false);
    }
  };

  const addBenefit = () => {
    if (newBenefit.trim()) {
      setFormData({
        ...formData,
        benefits: [...formData.benefits, newBenefit.trim()],
      });
      setNewBenefit('');
    }
  };

  const removeBenefit = (index: number) => {
    setFormData({
      ...formData,
      benefits: formData.benefits.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="loyalty-tier-fullpage" style={{ '--primary-color': primaryColor, '--secondary-color': secondaryColor } as React.CSSProperties}>
      {/* Header */}
      <div className="loyalty-tier-fullpage-header" style={{ background: `linear - gradient(135deg, ${primaryColor} 0 %, ${secondaryColor} 100 %)` }}>
        <button className="back-button" onClick={onBack}>
          <ArrowLeft size={20} />
          Indietro
        </button>
        <h1>{tier ? 'Modifica Livello Fedeltà' : 'Nuovo Livello Fedeltà'}</h1>
        <button
          className="btn-save-header"
          onClick={handleSubmit}
          disabled={loading || !formData.name}
        >
          <Save size={20} />
          {loading ? 'Salvataggio...' : 'Salva'}
        </button>
      </div>

      {/* Content */}
      <div className="loyalty-tier-fullpage-content">
        <form onSubmit={handleSubmit} className="loyalty-tier-form">
          {/* Left Column - Preview */}
          <div className="loyalty-tier-preview-section">
            <h2>Anteprima Livello</h2>
            <div className="loyalty-tier-preview" style={{ borderColor: formData.color }}>
              <div className="loyalty-tier-preview-header" style={{ background: formData.color }}>
                <div className="loyalty-tier-preview-icon">
                  <Star size={48} />
                </div>
                <h3>{formData.name || 'Nome Livello'}</h3>
              </div>
              <div className="loyalty-tier-preview-body">
                <div className="loyalty-tier-preview-range">
                  <Target size={18} />
                  <span>Range: {formData.threshold} - {formData.maxThreshold || '∞'} punti</span>
                </div>
                <div className="loyalty-tier-preview-multiplier">
                  <Zap size={18} />
                  <span>Moltiplicatore: {formData.multiplier}x</span>
                </div>
                {formData.benefits.length > 0 && (
                  <div className="loyalty-tier-preview-benefits">
                    <h4>
                      <Gift size={16} />
                      Vantaggi:
                    </h4>
                    <ul>
                      {formData.benefits.map((benefit, i) => (
                        <li key={i}>{benefit}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Form Fields */}
          <div className="loyalty-tier-form-section">
            {/* Informazioni Base */}
            <div className="form-section">
              <h3>Informazioni Base</h3>

              <div className="form-row">
                <div className="form-field">
                  <label>Nome Livello *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="es: Iniziale, Affezionato, VIP"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label>Soglia Minima *</label>
                  <input
                    type="number"
                    value={formData.threshold}
                    onChange={(e) => setFormData({ ...formData, threshold: e.target.value })}
                    min="0"
                    required
                  />
                  <span className="field-hint">Numero minimo di punti per questo livello</span>
                </div>

                <div className="form-field">
                  <label>Soglia Massima (opzionale)</label>
                  <input
                    type="number"
                    value={formData.maxThreshold || ''}
                    onChange={(e) => setFormData({ ...formData, maxThreshold: e.target.value })}
                    min={parseInt(formData.threshold) || 0}
                    placeholder="Lascia vuoto per illimitato"
                  />
                  <span className="field-hint">Numero massimo di punti per questo livello</span>
                </div>
              </div>
            </div>

            {/* Moltiplicatore */}
            <div className="form-section">
              <h3>Moltiplicatore Punti</h3>

              <div className="form-field">
                <label>Moltiplicatore *</label>
                <input
                  type="number"
                  value={formData.multiplier}
                  onChange={(e) => setFormData({ ...formData, multiplier: e.target.value })}
                  min="1"
                  step="0.1"
                  required
                />
                <span className="field-hint">Fattore moltiplicativo per i punti guadagnati (es: 1.5 = 50% in più)</span>
              </div>
            </div>

            {/* Personalizzazione Visuale */}
            <div className="form-section">
              <h3>Personalizzazione Visuale</h3>

              <div className="form-field">
                <label>Colore Livello</label>
                <div className="custom-color-picker-clean">
                  <div
                    className="color-preview-large"
                    style={{ background: formData.color }}
                  />
                  <div className="color-info">
                    <span className="color-label">Seleziona colore</span>
                    <span className="color-value">{formData.color}</span>
                  </div>
                  <input
                    id="customColor"
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="color-input-clean"
                  />
                </div>
              </div>
            </div>

            {/* Vantaggi */}
            <div className="form-section">
              <h3>
                <Gift size={20} />
                Vantaggi del Livello
              </h3>

              <div className="benefits-list">
                {formData.benefits.map((benefit, index) => (
                  <div key={index} className="benefit-item">
                    <span>{benefit}</span>
                    <button
                      type="button"
                      className="remove-benefit"
                      onClick={() => removeBenefit(index)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="add-benefit">
                <input
                  type="text"
                  value={newBenefit}
                  onChange={(e) => setNewBenefit(e.target.value)}
                  placeholder="es: 50% punti in più, Sconti esclusivi"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addBenefit();
                    }
                  }}
                />
                <button type="button" onClick={addBenefit} className="btn-add-benefit">
                  <Plus size={20} />
                  Aggiungi
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="loyalty-tier-actions">
              <button type="button" className="btn-cancel" onClick={onBack}>
                Annulla
              </button>
              <button type="submit" className="btn-save" disabled={loading || !formData.name}>
                {loading ? 'Salvataggio...' : tier ? 'Salva Modifiche' : 'Crea Livello'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Toast Notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
    </div>
  );
};

export default LoyaltyTierFullPage;
