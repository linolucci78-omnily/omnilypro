import React, { useState, useEffect } from 'react';
import { Building2, Crown, Edit2, Save, X, AlertCircle, Check, Lock, Unlock, Settings, Users } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { PLAN_FEATURES, PLAN_NAMES, PLAN_PRICES, PlanType, getPlanFeaturesSync, formatPlanPrice } from '../../utils/planPermissions';
import { useToast } from '../../contexts/ToastContext';
import PageLoader from '../UI/PageLoader';
import PlanFeaturesManager from './PlanFeaturesManager';
import './SubscriptionFeaturesManager.css';

interface Organization {
  id: string;
  name: string;
  plan_type: string;
  created_at: string;
  logo_url?: string;
  email?: string;
}

type TabType = 'organizations' | 'features';

const SubscriptionFeaturesManagerV2: React.FC = () => {
  const { showSuccess, showError } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>('organizations');
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingOrgId, setEditingOrgId] = useState<string | null>(null);
  const [editingPlan, setEditingPlan] = useState<PlanType | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadOrganizations();
  }, []);

  const loadOrganizations = async () => {
    try {
      setLoading(true);

      const { data: orgs, error: orgsError } = await supabase
        .from('organizations')
        .select('id, name, plan_type, created_at, logo_url, email')
        .order('created_at', { ascending: false });

      if (orgsError) throw orgsError;

      setOrganizations(orgs || []);
      console.log('[SubscriptionManagerV2] Organizations loaded successfully');
    } catch (error) {
      console.error('[SubscriptionManagerV2] Error loading organizations:', error);
      showError('Errore caricamento organizzazioni');
    } finally {
      setLoading(false);
    }
  };

  const handleEditOrg = (org: Organization) => {
    setEditingOrgId(org.id);
    setEditingPlan((org.plan_type || 'free') as PlanType);
  };

  const handleCancelEdit = () => {
    setEditingOrgId(null);
    setEditingPlan(null);
  };

  const handleSavePlan = async () => {
    if (!editingPlan || !editingOrgId) return;

    try {
      setSaving(true);
      console.log(`[SubscriptionManagerV2] Updating plan for ${editingOrgId} to ${editingPlan}`);

      const { error } = await supabase
        .from('organizations')
        .update({ plan_type: editingPlan })
        .eq('id', editingOrgId);

      if (error) throw error;

      console.log('[SubscriptionManagerV2] Plan updated successfully');
      await loadOrganizations();
      setEditingOrgId(null);
      setEditingPlan(null);
      showSuccess(`Piano aggiornato a ${PLAN_NAMES[editingPlan]} con successo!`);
    } catch (error: any) {
      console.error('[SubscriptionManagerV2] Save error:', error);
      showError('Errore durante il salvataggio', error.message);
    } finally {
      setSaving(false);
    }
  };

  const getFeatureCount = (planType: string) => {
    const features = getPlanFeaturesSync(planType);
    const totalFeatures = Object.keys(features).filter(key =>
      !['maxCustomers', 'maxWorkflows', 'maxNotifications'].includes(key)
    );
    const enabledFeatures = totalFeatures.filter(key => features[key as keyof typeof features] === true);
    return { enabled: enabledFeatures.length, total: totalFeatures.length };
  };

  const getPlanColor = (planType: string) => {
    switch (planType) {
      case 'free': return '#6b7280';
      case 'basic': return '#3b82f6';
      case 'pro': return '#a855f7';
      case 'enterprise': return '#eab308';
      default: return '#6b7280';
    }
  };

  const getPlanBgColor = (planType: string) => {
    switch (planType) {
      case 'free': return '#f3f4f6';
      case 'basic': return '#dbeafe';
      case 'pro': return '#ede9fe';
      case 'enterprise': return '#fef3c7';
      default: return '#f3f4f6';
    }
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
            Gestione Piani e Features
          </h1>
          <p className="plans-subtitle">
            Configura i piani delle organizzazioni e le feature dinamiche per ogni piano
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '2rem',
        borderBottom: '2px solid #e2e8f0',
        paddingBottom: '0'
      }}>
        <button
          onClick={() => setActiveTab('organizations')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.5rem',
            background: activeTab === 'organizations' ? 'white' : 'transparent',
            color: activeTab === 'organizations' ? 'var(--omnily-primary)' : '#64748b',
            border: 'none',
            borderBottom: activeTab === 'organizations' ? '3px solid var(--omnily-primary)' : '3px solid transparent',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
            marginBottom: '-2px'
          }}
        >
          <Users size={20} />
          Piani Organizzazioni
        </button>
        <button
          onClick={() => setActiveTab('features')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.5rem',
            background: activeTab === 'features' ? 'white' : 'transparent',
            color: activeTab === 'features' ? 'var(--omnily-primary)' : '#64748b',
            border: 'none',
            borderBottom: activeTab === 'features' ? '3px solid var(--omnily-primary)' : '3px solid transparent',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
            marginBottom: '-2px'
          }}
        >
          <Settings size={20} />
          Features Dinamiche
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'features' ? (
        <PlanFeaturesManager />
      ) : (
        <>
      {/* Organizations Tab Content */}

      {/* Stats Grid - Plans Legend */}
      <div className="plans-stats-grid">
        {Object.entries(PLAN_FEATURES).map(([key, features]) => {
          const planType = key as PlanType;
          const pricing = PLAN_PRICES[planType];
          const featureCount = getFeatureCount(planType);

          return (
            <div key={key} className="plan-stat-card">
              <div
                className="stat-icon"
                style={{
                  background: getPlanBgColor(planType),
                  color: getPlanColor(planType)
                }}
              >
                <Crown size={24} />
              </div>
              <div className="stat-content">
                <div className="stat-label">{PLAN_NAMES[planType]}</div>
                <div className="stat-price">{formatPlanPrice(planType)}</div>
                <div className="plan-features-list">
                  <div className="feature-item">
                    <strong>Features:</strong> {featureCount.enabled}/{featureCount.total}
                  </div>
                  <div className="feature-item">
                    <strong>Clienti:</strong> {features.maxCustomers === -1 ? '∞' : features.maxCustomers}
                  </div>
                  <div className="feature-item">
                    <strong>Workflows:</strong> {features.maxWorkflows === -1 ? '∞' : features.maxWorkflows}
                  </div>
                  <div className="feature-item">
                    <strong>Tier Loyalty:</strong> {features.maxTiers === -1 ? '∞' : features.maxTiers}
                  </div>
                  <div className="feature-item">
                    <strong>Premi:</strong> {features.maxRewards === -1 ? '∞' : features.maxRewards}
                  </div>
                  <div className="feature-item">
                    <strong>Coupon:</strong> {features.maxCoupons === -1 ? '∞' : features.maxCoupons}
                  </div>
                  <div className="feature-item">
                    <strong>Campagne:</strong> {features.maxCampaigns === -1 ? '∞' : features.maxCampaigns}
                  </div>
                  <div className="feature-item">
                    {features.coupons ? '✅' : '❌'} Coupons
                  </div>
                  <div className="feature-item">
                    {features.lottery ? '✅' : '❌'} Lotterie
                  </div>
                  <div className="feature-item">
                    {features.giftCertificates ? '✅' : '❌'} Gift Certificates
                  </div>
                  <div className="feature-item">
                    {features.marketingCampaigns ? '✅' : '❌'} Marketing
                  </div>
                  <div className="feature-item">
                    {features.analyticsReports ? '✅' : '❌'} Analytics
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
              <th>Prezzo</th>
              <th>Features Attive</th>
              <th>Limiti</th>
              <th>Azioni</th>
            </tr>
          </thead>
          <tbody>
            {organizations.map((org) => {
              const isEditing = editingOrgId === org.id;
              const currentPlan = (isEditing ? editingPlan : org.plan_type) as PlanType;
              const planColor = getPlanColor(currentPlan);
              const planBgColor = getPlanBgColor(currentPlan);
              const features = getPlanFeaturesSync(currentPlan);
              const featureCount = getFeatureCount(currentPlan);

              return (
                <tr key={org.id} className={isEditing ? 'editing-row' : ''}>
                  {/* Organization Name */}
                  <td>
                    <div className="org-name-cell">
                      {org.logo_url ? (
                        <img src={org.logo_url} alt={org.name} style={{ width: 32, height: 32, borderRadius: 6 }} />
                      ) : (
                        <Building2 size={20} />
                      )}
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
                        value={currentPlan}
                        onChange={(e) => setEditingPlan(e.target.value as PlanType)}
                        className="plan-select"
                      >
                        <option value="free">Free</option>
                        <option value="basic">Basic</option>
                        <option value="pro">Pro</option>
                        <option value="enterprise">Enterprise</option>
                      </select>
                    ) : (
                      <span
                        className="plan-badge"
                        style={{
                          background: planBgColor,
                          color: planColor
                        }}
                      >
                        {PLAN_NAMES[currentPlan]}
                      </span>
                    )}
                  </td>

                  {/* Price */}
                  <td>
                    <div className="price-cell">
                      {formatPlanPrice(currentPlan)}
                    </div>
                  </td>

                  {/* Feature Count */}
                  <td>
                    <div className="features-count">
                      <div className="count-badge">
                        {featureCount.enabled}/{featureCount.total}
                      </div>
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{
                            width: `${(featureCount.enabled / featureCount.total) * 100}%`,
                            background: planColor
                          }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Limits */}
                  <td>
                    <div className="limits-cell">
                      <div className="limit-item">
                        👥 {features.maxCustomers === -1 ? '∞' : features.maxCustomers}
                      </div>
                      <div className="limit-item">
                        ⚡ {features.maxWorkflows === -1 ? '∞' : features.maxWorkflows}
                      </div>
                    </div>
                  </td>

                  {/* Actions */}
                  <td>
                    {isEditing ? (
                      <div className="action-buttons">
                        <button
                          onClick={handleSavePlan}
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
                        Modifica Piano
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

      {/* Features Details Section */}
      {editingOrgId && editingPlan && (
        <div className="features-details-panel">
          <h3>Features incluse nel piano {PLAN_NAMES[editingPlan]}</h3>
          <div className="features-grid">
            {Object.entries(getPlanFeaturesSync(editingPlan)).map(([key, value]) => {
              if (['maxCustomers', 'maxWorkflows', 'maxNotifications'].includes(key)) return null;

              const isEnabled = value === true;
              return (
                <div key={key} className={`feature-card ${isEnabled ? 'enabled' : 'disabled'}`}>
                  {isEnabled ? <Check size={16} color="#10b981" /> : <Lock size={16} color="#ef4444" />}
                  <span>{key}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};

export default SubscriptionFeaturesManagerV2;
