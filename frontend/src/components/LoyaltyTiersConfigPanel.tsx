import React, { useState, useEffect } from 'react';
import { X, Star, Plus, Trash2, Edit3, Save, AlertTriangle } from 'lucide-react';
import './LoyaltyTiersConfigPanel.css';
import { supabase } from '../lib/supabase';
import { subscriptionFeaturesService, type PlanType, type SubscriptionFeatures } from '../services/subscriptionFeaturesService';
import TierLimitModal from './TierLimitModal';

interface LoyaltyTier {
  name: string;
  threshold: string;
  multiplier: string;
  color: string;
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
    { name: 'Iniziale', threshold: '0', multiplier: '1', color: '#94a3b8' },
    { name: 'Affezionato', threshold: '300', multiplier: '1.5', color: '#3b82f6' },
    { name: 'VIP', threshold: '800', multiplier: '2', color: '#f59e0b' }
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
      multiplier: '1',
      color: '#6b7280'
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
                        <label>Soglia Punti</label>
                        <input
                          type="number"
                          value={tier.threshold}
                          onChange={(e) => updateTier(index, 'threshold', e.target.value)}
                          placeholder="300"
                          min="0"
                          className={errors[`${index}_threshold`] ? 'error' : ''}
                        />
                        {errors[`${index}_threshold`] && (
                          <span className="field-error">{errors[`${index}_threshold`]}</span>
                        )}
                      </div>

                      <div className="field-group">
                        <label>Moltiplicatore</label>
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
                        <label>Colore</label>
                        <input
                          type="color"
                          value={tier.color}
                          onChange={(e) => updateTier(index, 'color', e.target.value)}
                        />
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
            <h3>Anteprima Sistema</h3>
            <div className="tiers-preview">
              {tiers
                .sort((a, b) => parseInt(a.threshold) - parseInt(b.threshold))
                .map((tier, index) => (
                  <div key={index} className="preview-tier" style={{ borderLeftColor: tier.color }}>
                    <div className="preview-tier-name">{tier.name}</div>
                    <div className="preview-tier-details">
                      Da {tier.threshold} punti • Bonus {tier.multiplier}x
                    </div>
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