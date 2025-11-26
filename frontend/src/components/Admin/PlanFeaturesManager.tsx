import React, { useState, useEffect } from 'react';
import { Crown, Plus, Trash2, Edit2, Save, X, Clock, CheckCircle, XCircle, AlertCircle, Users, Target, ShoppingCart, Smartphone, Gamepad2, Settings, TrendingUp, Wallet } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import {
  PlanType,
  PLAN_NAMES,
  getAllFeatureNames,
  getPlanFeaturesSync,
  PLAN_FEATURES,
  clearOverridesCache,
  PlanFeatureOverride
} from '../../utils/planPermissions';
import { useToast } from '../../contexts/ToastContext';
import PageLoader from '../UI/PageLoader';
import './SubscriptionFeaturesManager.css';

const PlanFeaturesManager: React.FC = () => {
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [overrides, setOverrides] = useState<PlanFeatureOverride[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<PlanType>(PlanType.FREE);
  const [editingOverride, setEditingOverride] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newOverride, setNewOverride] = useState({
    feature_name: '',
    value_type: 'boolean' as 'boolean' | 'number' | 'string',
    boolean_value: true,
    number_value: 0,
    string_value: '',
    description: '',
    expires_at: ''
  });
  const [featureSearch, setFeatureSearch] = useState('');

  useEffect(() => {
    loadOverrides();
  }, []);

  const loadOverrides = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('plan_feature_overrides')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setOverrides(data || []);
      clearOverridesCache(); // Refresh cache
      console.log('[PlanFeaturesManager] Overrides loaded:', data?.length);
    } catch (error) {
      console.error('[PlanFeaturesManager] Error loading overrides:', error);
      showError('Errore caricamento override');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOverride = async (id: string) => {
    if (!confirm('Vuoi rimuovere questo override?')) return;

    try {
      const { error } = await supabase
        .from('plan_feature_overrides')
        .delete()
        .eq('id', id);

      if (error) throw error;

      showSuccess('Override rimosso');
      await loadOverrides();
    } catch (error: any) {
      showError('Errore durante la rimozione', error.message);
    }
  };

  const handleAddOverride = async () => {
    if (!newOverride.feature_name) {
      showError('Seleziona una feature');
      return;
    }

    try {
      const { error } = await supabase
        .from('plan_feature_overrides')
        .insert({
          plan_type: selectedPlan,
          feature_name: newOverride.feature_name,
          value_type: newOverride.value_type,
          boolean_value: newOverride.value_type === 'boolean' ? newOverride.boolean_value : null,
          number_value: newOverride.value_type === 'number' ? newOverride.number_value : null,
          string_value: newOverride.value_type === 'string' ? newOverride.string_value : null,
          description: newOverride.description || null,
          expires_at: newOverride.expires_at || null
        });

      if (error) throw error;

      showSuccess('Override creato');
      setShowAddModal(false);
      setFeatureSearch('');
      setNewOverride({
        feature_name: '',
        value_type: 'boolean',
        boolean_value: true,
        number_value: 0,
        string_value: '',
        description: '',
        expires_at: ''
      });
      await loadOverrides();
    } catch (error: any) {
      if (error.code === '23505') {
        showError('Override già esistente per questa feature');
      } else {
        showError('Errore durante la creazione', error.message);
      }
    }
  };

  const getPlanOverrides = () => {
    return overrides.filter(o => o.plan_type === selectedPlan);
  };

  const isExpired = (expiresAt?: string) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  const getBaseFeatureValue = (featureName: string): any => {
    const baseFeatures = PLAN_FEATURES[selectedPlan];
    return (baseFeatures as any)[featureName];
  };

  const getFeatureValueType = (featureName: string): 'boolean' | 'number' | 'string' => {
    const baseValue = getBaseFeatureValue(featureName);
    if (typeof baseValue === 'boolean') return 'boolean';
    if (typeof baseValue === 'number') return 'number';
    if (typeof baseValue === 'string') return 'string';
    return 'boolean';
  };

  const handleFeatureSelect = (featureName: string) => {
    const valueType = getFeatureValueType(featureName);
    const baseValue = getBaseFeatureValue(featureName);

    setNewOverride({
      ...newOverride,
      feature_name: featureName,
      value_type: valueType,
      boolean_value: valueType === 'boolean' ? baseValue : true,
      number_value: valueType === 'number' ? baseValue : 0,
      string_value: valueType === 'string' ? baseValue : ''
    });
  };

  const getOverrideDisplayValue = (override: PlanFeatureOverride): string => {
    switch (override.value_type) {
      case 'boolean':
        return override.boolean_value ? '✅ Abilitata' : '❌ Disabilitata';
      case 'number':
        return `${override.number_value}`;
      case 'string':
        return override.string_value || '-';
      default:
        return '-';
    }
  };

  const allFeatures = getAllFeatureNames();
  const planOverrides = getPlanOverrides();

  // Categorizza features con icone
  const getFeatureIcon = (featureName: string) => {
    // Core Limits
    if (['maxCustomers', 'maxWorkflows', 'maxNotifications'].includes(featureName)) {
      return <Users size={14} />;
    }
    // Feature Limits
    if (['maxTiers', 'maxRewards', 'maxCoupons', 'maxGiftCertificates', 'maxCampaigns'].includes(featureName)) {
      return <Target size={14} />;
    }
    // Commerce
    if (['coupons', 'giftCertificates', 'lottery'].includes(featureName)) {
      return <ShoppingCart size={14} />;
    }
    // Crypto & Wallet
    if (['omnyWallet', 'cryptoPayments'].includes(featureName)) {
      return <Wallet size={14} />;
    }
    // Dashboard Sections
    if (['loyaltyTiers', 'rewards', 'categories', 'marketingCampaigns', 'teamManagement',
         'posIntegration', 'notifications', 'analyticsReports', 'brandingSocial', 'channelsIntegration'].includes(featureName)) {
      return <Smartphone size={14} />;
    }
    // Gaming
    if (featureName === 'gamingModule') {
      return <Gamepad2 size={14} />;
    }
    // Advanced
    return <Settings size={14} />;
  };

  // Filtra features in base alla ricerca
  const filteredFeatures = allFeatures.filter(f =>
    f.toLowerCase().includes(featureSearch.toLowerCase())
  );

  if (loading) {
    return <PageLoader />;
  }

  return (
    <div style={{ width: '100%' }}>

      {/* Plan Tabs */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        {Object.values(PlanType).map(plan => (
          <button
            key={plan}
            onClick={() => setSelectedPlan(plan)}
            style={{
              padding: '0.75rem 1.5rem',
              background: selectedPlan === plan ? 'var(--omnily-primary)' : 'white',
              color: selectedPlan === plan ? 'white' : '#64748b',
              border: '1px solid',
              borderColor: selectedPlan === plan ? 'var(--omnily-primary)' : '#e2e8f0',
              borderRadius: '8px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {PLAN_NAMES[plan]}
          </button>
        ))}
      </div>

      {/* Add Override Button */}
      <button
        onClick={() => setShowAddModal(true)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.75rem 1.5rem',
          background: '#10b981',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontWeight: 600,
          cursor: 'pointer',
          marginBottom: '1.5rem'
        }}
      >
        <Plus size={20} />
        Aggiungi Override per {PLAN_NAMES[selectedPlan]}
      </button>

      {/* Features Table */}
      <div className="plans-table-card">
        <table className="plans-table">
          <thead>
            <tr>
              <th>Feature</th>
              <th>Valore Base</th>
              <th>Override Attivo</th>
              <th>Descrizione</th>
              <th>Scadenza</th>
              <th>Stato</th>
              <th>Azioni</th>
            </tr>
          </thead>
          <tbody>
            {allFeatures.map(featureName => {
              const override = planOverrides.find(o => o.feature_name === featureName);
              const baseValue = getBaseFeatureValue(featureName);
              const expired = override && isExpired(override.expires_at);

              return (
                <tr key={featureName}>
                  {/* Feature Name with Icon */}
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', color: '#64748b' }}>
                        {getFeatureIcon(featureName)}
                      </span>
                      <strong style={{ color: '#0f172a' }}>{featureName}</strong>
                    </div>
                  </td>

                  {/* Base Value */}
                  <td>
                    <span
                      className="plan-badge"
                      style={{
                        background: typeof baseValue === 'boolean' ? (baseValue ? '#d1fae5' : '#fee2e2') : '#f1f5f9',
                        color: typeof baseValue === 'boolean' ? (baseValue ? '#065f46' : '#991b1b') : '#475569',
                        fontWeight: typeof baseValue === 'number' ? 600 : 500
                      }}
                    >
                      {typeof baseValue === 'boolean'
                        ? (baseValue ? '✅ Enabled' : '❌ Disabled')
                        : baseValue === -1
                          ? '∞ Illimitato'
                          : baseValue}
                    </span>
                  </td>

                  {/* Override Value */}
                  <td>
                    {override ? (
                      <span
                        className="plan-badge"
                        style={{
                          background: override.value_type === 'boolean'
                            ? (override.boolean_value ? '#d1fae5' : '#fee2e2')
                            : '#e0e7ff',
                          color: override.value_type === 'boolean'
                            ? (override.boolean_value ? '#065f46' : '#991b1b')
                            : '#3730a3',
                          opacity: expired ? 0.5 : 1,
                          fontWeight: 600
                        }}
                      >
                        {getOverrideDisplayValue(override)}
                      </span>
                    ) : (
                      <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Nessun override</span>
                    )}
                  </td>

                  {/* Description */}
                  <td>
                    <span style={{ fontSize: '0.875rem', color: '#64748b' }}>
                      {override?.description || '-'}
                    </span>
                  </td>

                  {/* Expiration */}
                  <td>
                    {override?.expires_at ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                        <Clock size={14} color={expired ? '#ef4444' : '#64748b'} />
                        <span style={{ color: expired ? '#ef4444' : '#64748b' }}>
                          {new Date(override.expires_at).toLocaleDateString('it-IT')}
                        </span>
                      </div>
                    ) : override ? (
                      <span style={{ fontSize: '0.875rem', color: '#10b981', fontWeight: 600 }}>
                        ∞ Permanente
                      </span>
                    ) : '-'}
                  </td>

                  {/* Status */}
                  <td>
                    {override ? (
                      expired ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444', fontSize: '0.875rem', fontWeight: 600 }}>
                          <XCircle size={16} />
                          Scaduto
                        </span>
                      ) : (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', fontSize: '0.875rem', fontWeight: 600 }}>
                          <CheckCircle size={16} />
                          Attivo
                        </span>
                      )
                    ) : (
                      <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>-</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td>
                    {override && (
                      <button
                        onClick={() => handleDeleteOverride(override.id)}
                        className="action-btn"
                        style={{ background: '#fee2e2', borderColor: '#ef4444', color: '#991b1b' }}
                      >
                        <Trash2 size={16} />
                        Rimuovi
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add Override Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '500px',
            width: '90%'
          }}>
            <h2 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Plus size={24} />
              Nuovo Override per {PLAN_NAMES[selectedPlan]}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Search Field */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem', color: '#0f172a' }}>
                  🔍 Cerca Feature
                </label>
                <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.75rem', color: '#64748b', lineHeight: 1.4 }}>
                  Filtra le features disponibili per trovare quella che ti serve
                </p>
                <input
                  type="text"
                  value={featureSearch}
                  onChange={(e) => setFeatureSearch(e.target.value)}
                  placeholder="es: customer, marketing, max..."
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    background: '#ffffff',
                    color: '#0f172a'
                  }}
                />
                {featureSearch && (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#64748b' }}>
                    {filteredFeatures.length} feature{filteredFeatures.length !== 1 ? 's' : ''} trovate
                  </div>
                )}
              </div>

              {/* Feature Selection */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem', color: '#0f172a' }}>
                  Seleziona Feature *
                </label>
                <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.75rem', color: '#64748b', lineHeight: 1.4 }}>
                  Scegli quale funzionalità vuoi modificare per il piano {PLAN_NAMES[selectedPlan]}
                </p>
                <select
                  value={newOverride.feature_name}
                  onChange={(e) => handleFeatureSelect(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    background: '#ffffff',
                    color: '#0f172a',
                    maxHeight: '200px'
                  }}
                  size={filteredFeatures.length > 10 ? 10 : Math.max(3, filteredFeatures.length)}
                >
                  <option value="">Seleziona feature...</option>
                  {filteredFeatures.map(f => {
                    const baseVal = getBaseFeatureValue(f);
                    const valType = typeof baseVal === 'boolean' ? 'bool' : typeof baseVal === 'number' ? 'num' : 'text';
                    return (
                      <option key={f} value={f}>
                        {f} ({valType}: {baseVal === -1 ? '∞' : String(baseVal)})
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Dynamic Value Input based on type */}
              {newOverride.feature_name && (
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem', color: '#0f172a' }}>
                    Nuovo Valore *
                  </label>
                  <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.75rem', color: '#64748b', lineHeight: 1.4 }}>
                    {newOverride.value_type === 'boolean' && 'Attiva o disattiva questa funzionalità per tutte le organizzazioni con piano ' + PLAN_NAMES[selectedPlan]}
                    {newOverride.value_type === 'number' && 'Imposta un limite numerico personalizzato (es: 200 clienti, 10 tier). Usa -1 per illimitato.'}
                    {newOverride.value_type === 'string' && 'Inserisci un valore testuale personalizzato per questa configurazione'}
                  </p>

                  {newOverride.value_type === 'boolean' && (
                    <div
                      onClick={() => setNewOverride({ ...newOverride, boolean_value: !newOverride.boolean_value })}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        cursor: 'pointer',
                        padding: '0.5rem'
                      }}
                    >
                      <div style={{
                        position: 'relative',
                        width: '52px',
                        height: '28px',
                        background: newOverride.boolean_value ? '#10b981' : '#cbd5e1',
                        borderRadius: '14px',
                        transition: 'background 0.2s',
                        boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)'
                      }}>
                        <div style={{
                          position: 'absolute',
                          top: '2px',
                          left: newOverride.boolean_value ? '26px' : '2px',
                          width: '24px',
                          height: '24px',
                          background: 'white',
                          borderRadius: '50%',
                          transition: 'left 0.2s',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                        }} />
                      </div>
                      <span style={{
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        color: newOverride.boolean_value ? '#10b981' : '#64748b'
                      }}>
                        {newOverride.boolean_value ? '✅ Abilitata' : '❌ Disabilitata'}
                      </span>
                    </div>
                  )}

                  {newOverride.value_type === 'number' && (
                    <input
                      type="number"
                      value={newOverride.number_value}
                      onChange={(e) => setNewOverride({ ...newOverride, number_value: parseInt(e.target.value) || 0 })}
                      placeholder="es: 200 (usa -1 per illimitato)"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        background: '#ffffff',
                        color: '#0f172a'
                      }}
                    />
                  )}

                  {newOverride.value_type === 'string' && (
                    <input
                      type="text"
                      value={newOverride.string_value}
                      onChange={(e) => setNewOverride({ ...newOverride, string_value: e.target.value })}
                      placeholder="es: premium, advanced, custom"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        background: '#ffffff',
                        color: '#0f172a'
                      }}
                    />
                  )}
                </div>
              )}

              {/* Description */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem', color: '#0f172a' }}>
                  Descrizione Override
                </label>
                <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.75rem', color: '#64748b', lineHeight: 1.4 }}>
                  Spiega il motivo di questo override (es: promozione, test, evento speciale)
                </p>
                <input
                  type="text"
                  value={newOverride.description}
                  onChange={(e) => setNewOverride({ ...newOverride, description: e.target.value })}
                  placeholder="es: Promo Black Friday 2025"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    background: '#ffffff',
                    color: '#0f172a'
                  }}
                />
              </div>

              {/* Expiration Date */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem', color: '#0f172a' }}>
                  Data Scadenza (opzionale)
                </label>
                <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.75rem', color: '#64748b', lineHeight: 1.4 }}>
                  Imposta quando l'override scade automaticamente. Lascia vuoto per renderlo permanente.
                </p>
                <input
                  type="date"
                  value={newOverride.expires_at}
                  onChange={(e) => setNewOverride({ ...newOverride, expires_at: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    background: '#ffffff',
                    color: '#0f172a'
                  }}
                />
              </div>
            </div>


            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button
                onClick={handleAddOverride}
                style={{
                  flex: 1,
                  padding: '0.875rem',
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#059669'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#10b981'}
              >
                Salva Override
              </button>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setFeatureSearch('');
                  setNewOverride({
                    feature_name: '',
                    value_type: 'boolean',
                    boolean_value: true,
                    number_value: 0,
                    string_value: '',
                    description: '',
                    expires_at: ''
                  });
                }}
                style={{
                  flex: 1,
                  padding: '0.875rem',
                  background: '#f1f5f9',
                  color: '#64748b',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#e2e8f0';
                  e.currentTarget.style.color = '#475569';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#f1f5f9';
                  e.currentTarget.style.color = '#64748b';
                }}
              >
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div style={{
        marginTop: '2rem',
        padding: '1.5rem',
        background: '#eff6ff',
        border: '1px solid #3b82f6',
        borderRadius: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
          <AlertCircle size={24} color="#3b82f6" style={{ flexShrink: 0, marginTop: '0.25rem' }} />
          <div>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#1e40af', fontSize: '1rem' }}>
              Come Funzionano gli Override
            </h3>
            <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#1e40af', fontSize: '0.875rem', lineHeight: 1.6 }}>
              <li>Gli override nel database hanno <strong>priorità assoluta</strong> sul codice</li>
              <li>Override con scadenza passata vengono automaticamente <strong>ignorati</strong></li>
              <li>I cambiamenti sono <strong>immediati</strong> (cache 1 minuto)</li>
              <li>Rimuovi override per tornare al valore base del codice</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlanFeaturesManager;
