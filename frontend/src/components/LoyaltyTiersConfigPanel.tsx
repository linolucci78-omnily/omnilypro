import React, { useState, useEffect } from 'react';
import { X, Star, Plus, Trash2, Edit3, Save, AlertTriangle } from 'lucide-react';
import './LoyaltyTiersConfigPanel.css';
import { supabase } from '../lib/supabase';
import { subscriptionFeaturesService, type PlanType, type SubscriptionFeatures } from '../services/subscriptionFeaturesService';
import TierLimitModal from './TierLimitModal';

interface LoyaltyTier {
  name: string;
  threshold: string;
  maxThreshold?: string; // Soglia massima (opzionale, per l'ultimo tier)
  multiplier: string;
  color: string;
  benefits: string[]; // Array di benefici mostrati nell'app
}

interface LoyaltyTiersConfigPanelProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  organization?: any;
  onSaved?: () => void;
}

const LoyaltyTiersConfigPanel: React.FC<LoyaltyTiersConfigPanelProps> = ({
  isOpen,
  onClose,
  organizationId,
  organization,
  onSaved
}) => {
  const [tiers, setTiers] = useState<LoyaltyTier[]>([
    {
      name: 'Iniziale',
      threshold: '0',
      maxThreshold: '299',
      multiplier: '1',
      color: '#94a3b8',
      benefits: ['Accumulo punti base', 'Accesso alle offerte']
    },
    {
      name: 'Affezionato',
      threshold: '300',
      maxThreshold: '799',
      multiplier: '1.5',
      color: '#3b82f6',
      benefits: ['50% punti in più', 'Sconti esclusivi', 'Priority support']
    },
    {
      name: 'VIP',
      threshold: '800',
      multiplier: '2',
      color: '#f59e0b',
      benefits: ['Punti doppi', 'Regali esclusivi', 'Eventi VIP', 'Consegna gratuita']
    }
  ]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [subscriptionFeatures, setSubscriptionFeatures] = useState<SubscriptionFeatures | null>(null);
  const [showLimitModal, setShowLimitModal] = useState(false);

  // Carica i livelli e le features dall'organizzazione quando si apre il pannello
  useEffect(() => {
    if (isOpen && organizationId) {
      // Carica tier esistenti
      if (organization?.loyalty_tiers && organization.loyalty_tiers.length > 0) {
        console.log('[LoyaltyTiers] Loading existing loyalty tiers');
        setTiers(organization.loyalty_tiers);
      }

      // Carica subscription features
      const loadFeatures = async () => {
        const features = await subscriptionFeaturesService.getFeatures(organizationId);
        console.log('[LoyaltyTiers] Subscription features loaded');
        setSubscriptionFeatures(features);
      };
      loadFeatures();
    }
  }, [isOpen, organization, organizationId]);

  const addTier = async () => {
    // Controlla se può creare più tier
    if (!subscriptionFeatures) {
      console.warn('[LoyaltyTiers] Subscription features not loaded');
      return;
    }

    const canCreate = await subscriptionFeaturesService.canCreateMoreTiers(
      organizationId,
      tiers.length
    );

    console.log('[LoyaltyTiers] Tier creation check:', canCreate);

    if (!canCreate.canCreate) {
      console.log('[LoyaltyTiers] Tier limit reached, showing upgrade modal');
      setShowLimitModal(true);
      return;
    }

    // Se può creare, aggiungi il tier
    console.log('[LoyaltyTiers] Adding new tier');
    setTiers([...tiers, {
      name: `Livello ${tiers.length + 1}`,
      threshold: '100',
      maxThreshold: '200',
      multiplier: '1',
      color: '#6b7280',
      benefits: ['Inserisci benefici...']
    }]);
  };

  const removeTier = (index: number) => {
    if (tiers.length <= 1) {
      alert('Devi avere almeno un livello di fedeltà');
      return;
    }
    setTiers(tiers.filter((_, i) => i !== index));
  };

  const updateTier = (index: number, field: keyof LoyaltyTier, value: string) => {
    const newTiers = [...tiers];
    newTiers[index] = { ...newTiers[index], [field]: value };
    setTiers(newTiers);

    // Clear errors for this field
    const errorKey = `${index}_${field}`;
    if (errors[errorKey]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }
  };

  const addBenefit = (tierIndex: number) => {
    const newTiers = [...tiers];
    if (!newTiers[tierIndex].benefits) {
      newTiers[tierIndex].benefits = [];
    }
    newTiers[tierIndex].benefits.push('Nuovo beneficio');
    setTiers(newTiers);
  };

  const updateBenefit = (tierIndex: number, benefitIndex: number, value: string) => {
    const newTiers = [...tiers];
    newTiers[tierIndex].benefits[benefitIndex] = value;
    setTiers(newTiers);
  };

  const removeBenefit = (tierIndex: number, benefitIndex: number) => {
    const newTiers = [...tiers];
    newTiers[tierIndex].benefits.splice(benefitIndex, 1);
    setTiers(newTiers);
  };

  const validateTiers = () => {
    const newErrors: { [key: string]: string } = {};

    tiers.forEach((tier, index) => {
      if (!tier.name.trim()) {
        newErrors[`${index}_name`] = 'Nome richiesto';
      }

      if (!tier.threshold || isNaN(parseInt(tier.threshold))) {
        newErrors[`${index}_threshold`] = 'Soglia punti richiesta';
      }

      if (!tier.multiplier || isNaN(parseFloat(tier.multiplier))) {
        newErrors[`${index}_multiplier`] = 'Moltiplicatore richiesto';
      }
    });

    // Check for duplicate thresholds
    const thresholds = tiers.map(t => parseInt(t.threshold)).filter(t => !isNaN(t));
    const duplicates = thresholds.filter((t, i) => thresholds.indexOf(t) !== i);
    if (duplicates.length > 0) {
      newErrors.general = 'Non puoi avere soglie duplicate';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateTiers()) {
      return;
    }

    setSaving(true);
    try {
      console.log('💾 Saving loyalty tiers to organization:', organizationId);
      console.log('🏆 Tiers data:', tiers);

      const { error } = await supabase
        .from('organizations')
        .update({
          loyalty_tiers: tiers,
          updated_at: new Date().toISOString()
        })
        .eq('id', organizationId);

      if (error) {
        console.error('❌ Error saving loyalty tiers:', error);
        alert(`Errore nel salvataggio: ${error.message}`);
        return;
      }

      console.log('✅ Loyalty tiers saved successfully');
      alert('Livelli di fedeltà salvati con successo!');

      if (onSaved) {
        onSaved();
      }

      onClose();

    } catch (error: any) {
      console.error('❌ Exception saving loyalty tiers:', error);
      alert(`Errore: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div className="loyalty-tiers-panel-overlay" onClick={onClose} />

      {/* Slide Panel */}
      <div className={`loyalty-tiers-panel ${isOpen ? 'open' : ''}`}>
        {/* Header */}
        <div className="loyalty-panel-header">
          <div className="header-content">
            <div className="header-icon">
              <Star size={28} />
            </div>
            <div className="header-text">
              <h2>Configurazione Livelli Fedeltà</h2>
              <p>Personalizza i livelli del sistema loyalty</p>
            </div>
          </div>
          <button className="close-button" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="loyalty-panel-content">
          <div className="tiers-section">
            <div className="section-header">
              <h3>Livelli di Fedeltà</h3>
              <p>Configura i diversi livelli e le soglie di punti</p>
            </div>

            {errors.general && (
              <div className="error-message general-error">
                <AlertTriangle size={16} />
                {errors.general}
              </div>
            )}

            <div className="tiers-list">
              {tiers.map((tier, index) => (
                <div key={index} className="tier-item">
                  <div className="tier-header">
                    <div className="tier-number" style={{ backgroundColor: tier.color }}>
                      {index + 1}
                    </div>
                    <div className="tier-preview">
                      <strong>{tier.name}</strong>
                      <span>{tier.threshold}+ punti • {tier.multiplier}x moltiplicatore</span>
                    </div>
                    {tiers.length > 1 && (
                      <button
                        className="remove-tier-btn"
                        onClick={() => removeTier(index)}
                        title="Rimuovi livello"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  <div className="tier-fields">
                    <div className="field-group">
                      <label>Nome Livello</label>
                      <input
                        type="text"
                        value={tier.name}
                        onChange={(e) => updateTier(index, 'name', e.target.value)}
                        placeholder="Es. VIP, Gold, Premium..."
                        className={errors[`${index}_name`] ? 'error' : ''}
                      />
                      {errors[`${index}_name`] && (
                        <span className="field-error">{errors[`${index}_name`]}</span>
                      )}
                    </div>

                    <div className="field-row">
                      <div className="field-group">
                        <label>📍 Soglia Minima</label>
                        <input
                          type="number"
                          value={tier.threshold}
                          onChange={(e) => updateTier(index, 'threshold', e.target.value)}
                          placeholder="0"
                          min="0"
                          className={errors[`${index}_threshold`] ? 'error' : ''}
                        />
                        {errors[`${index}_threshold`] && (
                          <span className="field-error">{errors[`${index}_threshold`]}</span>
                        )}
                      </div>

                      <div className="field-group">
                        <label>🎯 Soglia Massima</label>
                        <input
                          type="number"
                          value={tier.maxThreshold || ''}
                          onChange={(e) => updateTier(index, 'maxThreshold', e.target.value)}
                          placeholder="999 (opzionale)"
                          min="0"
                        />
                        <small style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                          Lascia vuoto per l'ultimo livello
                        </small>
                      </div>
                    </div>

                    <div className="field-row">
                      <div className="field-group">
                        <label>⚡ Moltiplicatore</label>
                        <input
                          type="number"
                          step="0.1"
                          value={tier.multiplier}
                          onChange={(e) => updateTier(index, 'multiplier', e.target.value)}
                          placeholder="1.5"
                          min="0.1"
                          className={errors[`${index}_multiplier`] ? 'error' : ''}
                        />
                        {errors[`${index}_multiplier`] && (
                          <span className="field-error">{errors[`${index}_multiplier`]}</span>
                        )}
                      </div>

                      <div className="field-group">
                        <label>🎨 Colore</label>
                        <input
                          type="color"
                          value={tier.color}
                          onChange={(e) => updateTier(index, 'color', e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Benefits Section */}
                    <div className="benefits-section" style={{ marginTop: '1rem', padding: '1rem', background: '#f9fafb', borderRadius: '0.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <label style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          🎁 Benefici (visibili nell'app)
                        </label>
                        <button
                          type="button"
                          onClick={() => addBenefit(index)}
                          style={{
                            padding: '0.25rem 0.75rem',
                            background: 'var(--primary)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.375rem',
                            fontSize: '0.875rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}
                        >
                          <Plus size={14} />
                          Aggiungi
                        </button>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {tier.benefits && tier.benefits.map((benefit, benefitIndex) => (
                          <div key={benefitIndex} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <span style={{ color: '#6b7280' }}>•</span>
                            <input
                              type="text"
                              value={benefit}
                              onChange={(e) => updateBenefit(index, benefitIndex, e.target.value)}
                              placeholder="Es. 10% di sconto, Spedizione gratuita..."
                              style={{
                                flex: 1,
                                padding: '0.5rem',
                                border: '1px solid #d1d5db',
                                borderRadius: '0.375rem',
                                fontSize: '0.875rem'
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => removeBenefit(index, benefitIndex)}
                              style={{
                                padding: '0.5rem',
                                background: '#fee2e2',
                                color: '#dc2626',
                                border: 'none',
                                borderRadius: '0.375rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center'
                              }}
                              title="Rimuovi beneficio"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                        {(!tier.benefits || tier.benefits.length === 0) && (
                          <p style={{ color: '#9ca3af', fontSize: '0.875rem', fontStyle: 'italic' }}>
                            Nessun beneficio aggiunto. Clicca "Aggiungi" per inserire i vantaggi di questo livello.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              className="add-tier-btn"
              onClick={addTier}
            >
              <Plus size={16} />
              Aggiungi Livello
            </button>
          </div>

          {/* Preview Section */}
          <div className="preview-section">
            <h3>Anteprima Sistema (come appare nell'app)</h3>
            <div className="tiers-preview">
              {tiers
                .sort((a, b) => parseInt(a.threshold) - parseInt(b.threshold))
                .map((tier, index) => (
                  <div key={index} className="preview-tier" style={{ borderLeftColor: tier.color, padding: '1rem', marginBottom: '0.75rem' }}>
                    <div className="preview-tier-name" style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                      {tier.name}
                    </div>
                    <div className="preview-tier-details" style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.75rem' }}>
                      📍 {tier.threshold} - {tier.maxThreshold || '∞'} punti • ⚡ Bonus {tier.multiplier}x
                    </div>
                    {tier.benefits && tier.benefits.length > 0 && (
                      <div style={{ marginTop: '0.5rem' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', marginBottom: '0.25rem' }}>
                          🎁 Benefici:
                        </div>
                        <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.875rem' }}>
                          {tier.benefits.map((benefit, i) => (
                            <li key={i} style={{ color: '#374151' }}>{benefit}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="loyalty-panel-footer">
          <button className="btn-secondary" onClick={onClose}>
            Annulla
          </button>
          <button
            className="btn-primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <>
                <div className="spinner" />
                Salvataggio...
              </>
            ) : (
              <>
                <Save size={16} />
                Salva Configurazione
              </>
            )}
          </button>
        </div>
      </div>

      {/* Tier Limit Modal */}
      {subscriptionFeatures && (
        <TierLimitModal
          isOpen={showLimitModal}
          currentPlan={subscriptionFeatures.plan_type as PlanType}
          currentTierCount={tiers.length}
          maxTiersAllowed={subscriptionFeatures.max_tiers_allowed}
          onClose={() => setShowLimitModal(false)}
          onUpgrade={() => {
            console.log('[LoyaltyTiers] Plan upgrade requested');
            // TODO: Redirect to upgrade page or contact support
            setShowLimitModal(false);
          }}
        />
      )}
    </>
  );
};

export default LoyaltyTiersConfigPanel;