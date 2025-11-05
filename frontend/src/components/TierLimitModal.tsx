import React from 'react';
import { Crown, AlertCircle, X, ArrowRight } from 'lucide-react';
import './TierLimitModal.css';
import { PLAN_LIMITS, type PlanType } from '../services/subscriptionFeaturesService';

interface TierLimitModalProps {
  isOpen: boolean;
  currentPlan: PlanType;
  currentTierCount: number;
  maxTiersAllowed: number;
  onClose: () => void;
  onUpgrade?: () => void;
}

const TierLimitModal: React.FC<TierLimitModalProps> = ({
  isOpen,
  currentPlan,
  currentTierCount,
  maxTiersAllowed,
  onClose,
  onUpgrade
}) => {
  if (!isOpen) return null;

  // Trova il piano successivo che permette più tier
  const getNextPlan = (): { plan: PlanType; name: string; maxTiers: number } | null => {
    const plans: PlanType[] = ['free', 'starter', 'pro', 'enterprise'];
    const currentIndex = plans.indexOf(currentPlan);

    for (let i = currentIndex + 1; i < plans.length; i++) {
      const plan = plans[i];
      const limits = PLAN_LIMITS[plan];
      if (limits.max_tiers_allowed > maxTiersAllowed || limits.max_tiers_allowed === 0) {
        return {
          plan,
          name: limits.name,
          maxTiers: limits.max_tiers_allowed
        };
      }
    }
    return null;
  };

  const nextPlan = getNextPlan();
  const planColor =
    currentPlan === 'free' ? '#6b7280' :
    currentPlan === 'starter' ? '#3b82f6' :
    currentPlan === 'pro' ? '#a855f7' :
    '#eab308';

  return (
    <div className="tier-limit-overlay" onClick={onClose}>
      <div
        className="tier-limit-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button className="tier-limit-close" onClick={onClose}>
          <X size={16} />
        </button>

        {/* Icon */}
        <div className="tier-limit-icon" style={{ backgroundColor: `${planColor}20` }}>
          <AlertCircle size={32} style={{ color: planColor }} />
        </div>

        {/* Title */}
        <h2 className="tier-limit-title">
          Limite Tier Raggiunto
        </h2>

        {/* Message */}
        <div className="tier-limit-message">
          <p>
            Hai raggiunto il limite massimo di tier per il tuo piano <strong>{PLAN_LIMITS[currentPlan].name}</strong>.
          </p>
          <div className="tier-limit-stats">
            <div className="stat-box">
              <div className="stat-label">Tier Creati</div>
              <div className="stat-value">{currentTierCount}</div>
            </div>
            <div className="stat-divider">/</div>
            <div className="stat-box">
              <div className="stat-label">Tier Massimi</div>
              <div className="stat-value">{maxTiersAllowed === 0 ? '∞' : maxTiersAllowed}</div>
            </div>
          </div>
        </div>

        {/* Upgrade Suggestion */}
        {nextPlan && (
          <div className="tier-limit-upgrade">
            <div className="upgrade-header">
              <Crown size={16} />
              <span>Upgrade per più tier</span>
            </div>
            <div className="upgrade-comparison">
              <div className="plan-card current">
                <div className="plan-name">{PLAN_LIMITS[currentPlan].name}</div>
                <div className="plan-tiers">
                  {maxTiersAllowed === 0 ? 'Tier Illimitati' : `Fino a ${maxTiersAllowed} tier`}
                </div>
              </div>
              <ArrowRight size={16} className="upgrade-arrow" />
              <div className="plan-card next">
                <div className="plan-name">{nextPlan.name}</div>
                <div className="plan-tiers">
                  {nextPlan.maxTiers === 0 ? 'Tier Illimitati' : `Fino a ${nextPlan.maxTiers} tier`}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="tier-limit-actions">
          <button className="btn-secondary" onClick={onClose}>
            Torna Indietro
          </button>
          {nextPlan && onUpgrade && (
            <button className="btn-primary-upgrade" onClick={onUpgrade}>
              <Crown size={14} />
              Upgrade a {nextPlan.name}
            </button>
          )}
        </div>

        {/* Help Text */}
        <p className="tier-limit-help">
          Contatta il supporto per maggiori informazioni sui piani disponibili
        </p>
      </div>
    </div>
  );
};

export default TierLimitModal;
