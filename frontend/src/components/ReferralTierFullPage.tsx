/**
 * Referral Tier Full Page - Create/Edit Referral Tiers
 * FULLPAGE VERSION - NO MODALS!
 */

import React, { useState, useEffect } from 'react';
import { X, Star, Award, Crown, Trophy, Zap, Plus, Trash2, ArrowLeft, Save } from 'lucide-react';
import { ReferralTier } from '../services/referralService';
import './ReferralTierFullPage.css';

interface ReferralTierFullPageProps {
  tier: ReferralTier | null;
  organizationId: string;
  primaryColor: string;
  secondaryColor: string;
  onBack: () => void;
  onSave: (tier: Partial<ReferralTier>) => Promise<void>;
}

const TIER_ICONS = [
  { name: 'star', component: Star, label: 'Stella' },
  { name: 'award', component: Award, label: 'Premio' },
  { name: 'crown', component: Crown, label: 'Corona' },
  { name: 'trophy', component: Trophy, label: 'Trofeo' },
  { name: 'zap', component: Zap, label: 'Fulmine' },
];

const TIER_COLORS = [
  { value: '#ef4444', label: 'Rosso' },
  { value: '#f59e0b', label: 'Arancione' },
  { value: '#22c55e', label: 'Verde' },
  { value: '#3b82f6', label: 'Blu' },
  { value: '#8b5cf6', label: 'Viola' },
];

const ReferralTierFullPage: React.FC<ReferralTierFullPageProps> = ({
  tier,
  organizationId,
  primaryColor,
  secondaryColor,
  onBack,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    threshold: 0,
    color: '#ef4444',
    icon: 'star',
    points_per_referral: 0,
    discount_percentage: 0,
    special_perks: [] as Array<{ type: string; description: string; value?: number }>,
  });

  const [loading, setLoading] = useState(false);
  const [newPerk, setNewPerk] = useState({ description: '' });

  useEffect(() => {
    if (tier) {
      setFormData({
        name: tier.name,
        description: tier.description || '',
        threshold: tier.threshold,
        color: tier.color,
        icon: tier.icon,
        points_per_referral: tier.points_per_referral,
        discount_percentage: tier.discount_percentage,
        special_perks: tier.special_perks || [],
      });
    } else {
      // Reset form for new tier
      setFormData({
        name: '',
        description: '',
        threshold: 0,
        color: '#ef4444',
        icon: 'star',
        points_per_referral: 0,
        discount_percentage: 0,
        special_perks: [],
      });
    }
  }, [tier]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onSave({
        ...formData,
        organization_id: organizationId,
      });
      onBack();
    } catch (error) {
      console.error('Error saving tier:', error);
    } finally {
      setLoading(false);
    }
  };

  const addPerk = () => {
    if (newPerk.description.trim()) {
      setFormData({
        ...formData,
        special_perks: [
          ...formData.special_perks,
          { type: 'custom', description: newPerk.description },
        ],
      });
      setNewPerk({ description: '' });
    }
  };

  const removePerk = (index: number) => {
    setFormData({
      ...formData,
      special_perks: formData.special_perks.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="tier-fullpage" style={{ '--primary-color': primaryColor, '--secondary-color': secondaryColor } as React.CSSProperties}>
      {/* Header */}
      <div className="tier-fullpage-header" style={{ background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)` }}>
        <button className="back-button" onClick={onBack}>
          <ArrowLeft size={20} />
          Indietro
        </button>
        <h1>{tier ? 'Modifica Livello Referral' : 'Nuovo Livello Referral'}</h1>
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
      <div className="tier-fullpage-content">
        <form onSubmit={handleSubmit} className="tier-form">
          {/* Left Column - Preview */}
          <div className="tier-preview-section">
            <h2>Anteprima Livello</h2>
            <div className="tier-preview" style={{ borderColor: formData.color }}>
              <div className="tier-preview-header" style={{ background: formData.color }}>
                <div className="tier-preview-icon">
                  {(() => {
                    const IconComponent = TIER_ICONS.find((i) => i.name === formData.icon)?.component || Star;
                    return <IconComponent size={48} />;
                  })()}
                </div>
                <h3>{formData.name || 'Nome Livello'}</h3>
              </div>
              <div className="tier-preview-body">
                <div className="tier-preview-threshold">
                  Soglia: {formData.threshold} referral
                </div>
                <div className="tier-preview-rewards">
                  <div>{formData.points_per_referral} punti/referral</div>
                  {formData.discount_percentage > 0 && (
                    <div>{formData.discount_percentage}% sconto</div>
                  )}
                </div>
                {formData.special_perks.length > 0 && (
                  <div className="tier-preview-perks">
                    <h4>Vantaggi Speciali:</h4>
                    <ul>
                      {formData.special_perks.map((perk, i) => (
                        <li key={i}>{perk.description}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Form Fields */}
          <div className="tier-form-section">
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
                    placeholder="es: Bronze, Silver, Gold"
                    required
                  />
                </div>

                <div className="form-field">
                  <label>Soglia Referral *</label>
                  <input
                    type="number"
                    value={formData.threshold}
                    onChange={(e) =>
                      setFormData({ ...formData, threshold: parseInt(e.target.value) || 0 })
                    }
                    min="0"
                    required
                  />
                  <span className="field-hint">Numero minimo di referral completati</span>
                </div>
              </div>

              <div className="form-field">
                <label>Descrizione</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrizione del livello..."
                  rows={3}
                />
              </div>
            </div>

            {/* Personalizzazione Visuale */}
            <div className="form-section">
              <h3>Personalizzazione Visuale</h3>

              <div className="form-field">
                <label>Colore</label>
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

              <div className="form-field">
                <label>Icona</label>
                <div className="icon-picker">
                  {TIER_ICONS.map((icon) => {
                    const IconComponent = icon.component;
                    return (
                      <button
                        key={icon.name}
                        type="button"
                        className={`icon-option ${formData.icon === icon.name ? 'active' : ''}`}
                        onClick={() => setFormData({ ...formData, icon: icon.name })}
                        title={icon.label}
                      >
                        <IconComponent size={24} />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Rewards */}
            <div className="form-section">
              <h3>Rewards</h3>

              <div className="form-row">
                <div className="form-field">
                  <label>Punti per Referral</label>
                  <input
                    type="number"
                    value={formData.points_per_referral}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        points_per_referral: parseInt(e.target.value) || 0,
                      })
                    }
                    min="0"
                  />
                  <span className="field-hint">Punti extra guadagnati per ogni referral</span>
                </div>

                <div className="form-field">
                  <label>Sconto Percentuale</label>
                  <input
                    type="number"
                    value={formData.discount_percentage}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        discount_percentage: parseFloat(e.target.value) || 0,
                      })
                    }
                    min="0"
                    max="100"
                    step="0.1"
                  />
                  <span className="field-hint">Sconto applicato agli acquisti</span>
                </div>
              </div>
            </div>

            {/* Special Perks */}
            <div className="form-section">
              <h3>Vantaggi Speciali</h3>

              <div className="perks-list">
                {formData.special_perks.map((perk, index) => (
                  <div key={index} className="perk-item">
                    <span>{perk.description}</span>
                    <button
                      type="button"
                      className="remove-perk"
                      onClick={() => removePerk(index)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="add-perk">
                <input
                  type="text"
                  value={newPerk.description}
                  onChange={(e) => setNewPerk({ description: e.target.value })}
                  placeholder="es: Accesso prioritario agli eventi"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addPerk();
                    }
                  }}
                />
                <button type="button" onClick={addPerk} className="btn-add-perk">
                  <Plus size={20} />
                  Aggiungi
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="tier-actions">
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
    </div>
  );
};

export default ReferralTierFullPage;
