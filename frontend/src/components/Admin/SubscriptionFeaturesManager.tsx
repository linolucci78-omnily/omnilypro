import React, { useState, useEffect } from 'react';
import { Building2, Crown, Edit2, Save, X, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { subscriptionFeaturesService, PLAN_LIMITS, type PlanType, type SubscriptionFeatures } from '../../services/subscriptionFeaturesService';
import { useToast } from '../../contexts/ToastContext';
import PageLoader from '../UI/PageLoader';
import './SubscriptionFeaturesManager.css';

interface Organization {
  id: string;
  name: string;
  created_at: string;
  loyalty_tiers?: any[];
}

interface OrganizationWithFeatures extends Organization {
  features?: SubscriptionFeatures | null;
  tierCount: number;
}

const SubscriptionFeaturesManager: React.FC = () => {
  const { showSuccess, showError } = useToast();
  const [organizations, setOrganizations] = useState<OrganizationWithFeatures[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingOrgId, setEditingOrgId] = useState<string | null>(null);
  const [editingFeatures, setEditingFeatures] = useState<Partial<SubscriptionFeatures> | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadOrganizations();
  }, []);

  const loadOrganizations = async () => {
    try {
      setLoading(true);

      const { data: orgs, error: orgsError } = await supabase
        .from('organizations')
        .select('id, name, created_at, loyalty_tiers')
        .order('created_at', { ascending: false });

      if (orgsError) throw orgsError;

      const orgsWithFeatures = await Promise.all(
        (orgs || []).map(async (org) => {
          const features = await subscriptionFeaturesService.getFeatures(org.id);
          const tierCount = Array.isArray(org.loyalty_tiers) ? org.loyalty_tiers.length : 0;

          return {
            ...org,
            features,
            tierCount
          };
        })
      );

      setOrganizations(orgsWithFeatures);
      console.log('[SubscriptionManager] Organizations loaded successfully');
    } catch (error) {
      console.error('[SubscriptionManager] Error loading organizations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditOrg = (org: OrganizationWithFeatures) => {
    setEditingOrgId(org.id);
    setEditingFeatures(org.features || {
      organization_id: org.id,
      tier_system_enabled: true,
      max_tiers_allowed: 5,
      tier_emails_enabled: true,
      tier_analytics_enabled: false,
      plan_type: 'free'
    });
  };

  const handleCancelEdit = () => {
    setEditingOrgId(null);
    setEditingFeatures(null);
  };

  const handleSaveFeatures = async () => {
    if (!editingFeatures || !editingOrgId) return;

    try {
      setSaving(true);

      const result = await subscriptionFeaturesService.updateFeatures({
        organization_id: editingOrgId,
        ...editingFeatures
      });

      if (result.success) {
        console.log('[SubscriptionManager] Features updated successfully');
        await loadOrganizations();
        setEditingOrgId(null);
        setEditingFeatures(null);
        showSuccess('Piano aggiornato con successo');
      } else {
        console.error('[SubscriptionManager] Update error:', result.error);
        showError('Errore aggiornamento', result.error);
      }
    } catch (error: any) {
      console.error('[SubscriptionManager] Save error:', error);
      showError('Errore durante il salvataggio', error.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePlanChange = (planType: PlanType) => {
    if (!editingFeatures) return;

    const planLimits = PLAN_LIMITS[planType];

    setEditingFeatures({
      ...editingFeatures,
      plan_type: planType,
      tier_system_enabled: planLimits.tier_system_enabled,
      max_tiers_allowed: planLimits.max_tiers_allowed,
      tier_emails_enabled: planLimits.tier_emails_enabled,
      tier_analytics_enabled: planLimits.tier_analytics_enabled
    });
  };

  if (loading) {
    return <PageLoader />;
  }

  return (
    <div className="subscription-plans-management">
      {/* Header */}
      <div className="plans-header">
        <div>
          <h1 className="plans-title">
            <Crown size={32} />
            Gestione Piani Organizzazioni
          </h1>
          <p className="plans-subtitle">
            Configura i piani e le feature disponibili per ogni organizzazione
          </p>
        </div>
      </div>

      {/* Stats Grid - Plans Legend */}
      <div className="plans-stats-grid">
        {Object.entries(PLAN_LIMITS).map(([key, plan]) => {
          const planType = key as PlanType;
          const iconBg =
            planType === 'free' ? '#f3f4f6' :
            planType === 'starter' ? '#dbeafe' :
            planType === 'pro' ? '#ede9fe' :
            '#fef3c7';
          const iconColor =
            planType === 'free' ? '#6b7280' :
            planType === 'starter' ? '#3b82f6' :
            planType === 'pro' ? '#a855f7' :
            '#eab308';

          return (
            <div key={key} className="plan-stat-card">
              <div className="stat-icon" style={{ background: iconBg, color: iconColor }}>
                <Crown size={24} />
              </div>
              <div className="stat-content">
                <div className="stat-label">{plan.name}</div>
                <div className="plan-features-list">
                  <div className="feature-item">
                    Tier: {plan.tier_system_enabled ? (plan.max_tiers_allowed === 0 ? '∞' : plan.max_tiers_allowed) : 'No'}
                  </div>
                  <div className="feature-item">
                    Email: {plan.tier_emails_enabled ? '✓' : '✗'}
                  </div>
                  <div className="feature-item">
                    Analytics: {plan.tier_analytics_enabled ? '✓' : '✗'}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Organizations Table */}
      <div className="plans-table-card">
        <table className="plans-table">
          <thead>
            <tr>
              <th>Organizzazione</th>
              <th>Piano Attuale</th>
              <th>Tier Creati</th>
              <th>Features Abilitate</th>
              <th>Azioni</th>
            </tr>
          </thead>
          <tbody>
            {organizations.map((org) => {
              const isEditing = editingOrgId === org.id;
              const features = isEditing ? editingFeatures : org.features;

              const planColor =
                features?.plan_type === 'free' ? '#6b7280' :
                features?.plan_type === 'starter' ? '#3b82f6' :
                features?.plan_type === 'pro' ? '#a855f7' :
                '#eab308';

              return (
                <tr key={org.id} className={isEditing ? 'editing-row' : ''}>
                  {/* Organization Name */}
                  <td>
                    <div className="org-name-cell">
                      <Building2 size={16} />
                      <div>
                        <div className="org-name">{org.name}</div>
                        <div className="org-date">
                          {new Date(org.created_at).toLocaleDateString('it-IT')}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Plan */}
                  <td>
                    {isEditing ? (
                      <select
                        value={features?.plan_type || 'free'}
                        onChange={(e) => handlePlanChange(e.target.value as PlanType)}
                        className="plan-select"
                      >
                        <option value="free">Free</option>
                        <option value="starter">Starter</option>
                        <option value="pro">Pro</option>
                        <option value="enterprise">Enterprise</option>
                      </select>
                    ) : (
                      <span
                        className="plan-badge"
                        style={{
                          background: `${planColor}20`,
                          color: planColor
                        }}
                      >
                        {features?.plan_type?.toUpperCase() || 'FREE'}
                      </span>
                    )}
                  </td>

                  {/* Tier Count */}
                  <td>
                    <div className="tier-count-cell">
                      <div className="tier-count-value">
                        {org.tierCount} / {features?.max_tiers_allowed === 0 ? '∞' : features?.max_tiers_allowed || 0}
                      </div>
                      {org.tierCount >= (features?.max_tiers_allowed || 0) && features?.max_tiers_allowed !== 0 && (
                        <span className="status-badge inactive">Limite Raggiunto</span>
                      )}
                    </div>
                  </td>

                  {/* Features */}
                  <td>
                    {isEditing ? (
                      <div className="features-edit">
                        <label className="feature-checkbox">
                          <input
                            type="checkbox"
                            checked={features?.tier_system_enabled || false}
                            onChange={(e) => setEditingFeatures({ ...editingFeatures!, tier_system_enabled: e.target.checked })}
                          />
                          Tier System
                        </label>
                        <label className="feature-checkbox">
                          <input
                            type="checkbox"
                            checked={features?.tier_emails_enabled || false}
                            onChange={(e) => setEditingFeatures({ ...editingFeatures!, tier_emails_enabled: e.target.checked })}
                          />
                          Email
                        </label>
                        <label className="feature-checkbox">
                          <input
                            type="checkbox"
                            checked={features?.tier_analytics_enabled || false}
                            onChange={(e) => setEditingFeatures({ ...editingFeatures!, tier_analytics_enabled: e.target.checked })}
                          />
                          Analytics
                        </label>
                        {features?.tier_system_enabled && (
                          <div className="max-tier-input-wrapper">
                            <label className="max-tier-label">Max Tier (0 = ∞):</label>
                            <input
                              type="number"
                              min="0"
                              value={features?.max_tiers_allowed || 0}
                              onChange={(e) => setEditingFeatures({ ...editingFeatures!, max_tiers_allowed: parseInt(e.target.value) || 0 })}
                              className="max-tier-input"
                            />
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="features-display">
                        {features?.tier_system_enabled && <span className="feature-tag tier">Tier</span>}
                        {features?.tier_emails_enabled && <span className="feature-tag email">Email</span>}
                        {features?.tier_analytics_enabled && <span className="feature-tag analytics">Analytics</span>}
                      </div>
                    )}
                  </td>

                  {/* Actions */}
                  <td>
                    {isEditing ? (
                      <div className="action-buttons">
                        <button
                          onClick={handleSaveFeatures}
                          disabled={saving}
                          className="action-btn save"
                        >
                          <Save size={16} />
                          {saving ? 'Salvataggio...' : 'Salva'}
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          disabled={saving}
                          className="action-btn cancel"
                        >
                          <X size={16} />
                          Annulla
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleEditOrg(org)}
                        className="action-btn edit"
                      >
                        <Edit2 size={16} />
                        Modifica
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {organizations.length === 0 && (
          <div className="empty-state">
            <AlertCircle size={48} />
            <h3>Nessuna organizzazione trovata</h3>
            <p>Le organizzazioni verranno visualizzate qui</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionFeaturesManager;
