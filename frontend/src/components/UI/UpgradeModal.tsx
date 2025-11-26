import React from 'react'
import { X, Crown, Check, Zap, ArrowRight } from 'lucide-react'
import { PlanType, PLAN_PRICES, PLAN_NAMES, formatPlanPrice } from '../../utils/planPermissions'
import './UpgradeModal.css'

interface UpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  currentPlan: PlanType
  requiredPlan: PlanType
  featureName: string
  onUpgrade?: (plan: PlanType) => void
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({
  isOpen,
  onClose,
  currentPlan,
  requiredPlan,
  featureName,
  onUpgrade
}) => {
  if (!isOpen) return null

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade(requiredPlan)
    } else {
      // Default: apri pagina contatto o upgrade (da implementare con Stripe)
      console.log('🚀 Upgrade to:', requiredPlan)
      alert(`Upgrade to ${PLAN_NAMES[requiredPlan]} will be available soon with Stripe integration!`)
    }
  }

  const getPlanBenefits = (plan: PlanType): string[] => {
    const benefits = {
      [PlanType.FREE]: [
        'Fino a 50 clienti',
        '1 workflow automatico',
        'Tessere punti base',
        'Support via email'
      ],
      [PlanType.BASIC]: [
        'Fino a 100 clienti',
        '5 workflows automatici',
        'Livelli fedeltà',
        'Premi personalizzati',
        'Notifiche base',
        'Support prioritario'
      ],
      [PlanType.PRO]: [
        'Fino a 1000 clienti',
        '50 workflows automatici',
        'Campagne marketing avanzate',
        'Analytics & Report completi',
        'Branding personalizzato',
        'Gaming module',
        'API Access',
        'Support 24/7'
      ],
      [PlanType.ENTERPRISE]: [
        'Clienti illimitati',
        'Workflows illimitati',
        'Tutti i canali integrazione',
        'White label completo',
        'Custom domain',
        'SSO enterprise',
        'Account manager dedicato',
        'SLA garantiti'
      ]
    }

    return benefits[plan] || []
  }

  return (
    <div className="upgrade-modal-overlay" onClick={onClose}>
      <div className="upgrade-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="upgrade-modal-header">
          <div className="upgrade-icon">
            <Crown size={32} color="#f59e0b" />
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="upgrade-modal-content">
          <h2 className="upgrade-title">
            Funzionalità Premium
          </h2>
          <p className="upgrade-subtitle">
            <strong>{featureName}</strong> è disponibile dal piano <strong>{PLAN_NAMES[requiredPlan]}</strong>
          </p>

          {/* Current Plan Badge */}
          <div className="current-plan-badge">
            <span className="badge-label">Piano Attuale:</span>
            <span className={`badge-value plan-${currentPlan}`}>
              {PLAN_NAMES[currentPlan]}
            </span>
          </div>

          {/* Plan Comparison */}
          <div className="plan-comparison">
            <div className="comparison-column current">
              <div className="column-header">
                <h3>{PLAN_NAMES[currentPlan]}</h3>
                <div className="plan-price">{formatPlanPrice(currentPlan)}</div>
              </div>
              <ul className="benefits-list">
                {getPlanBenefits(currentPlan).map((benefit, index) => (
                  <li key={index}>
                    <Check size={16} color="#10b981" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="comparison-arrow">
              <ArrowRight size={32} color="#f59e0b" />
            </div>

            <div className="comparison-column target">
              <div className="column-header premium">
                <Crown size={20} color="#f59e0b" />
                <h3>{PLAN_NAMES[requiredPlan]}</h3>
                <div className="plan-price highlighted">{formatPlanPrice(requiredPlan)}</div>
              </div>
              <ul className="benefits-list">
                {getPlanBenefits(requiredPlan).map((benefit, index) => (
                  <li key={index}>
                    <Check size={16} color="#f59e0b" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="upgrade-modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Rimani su {PLAN_NAMES[currentPlan]}
          </button>
          <button className="btn-upgrade" onClick={handleUpgrade}>
            <Zap size={18} />
            Passa a {PLAN_NAMES[requiredPlan]}
          </button>
        </div>

        {/* Money-back guarantee notice */}
        <div className="upgrade-notice">
          <span className="notice-icon">💯</span>
          <span>Garanzia soddisfatti o rimborsati 30 giorni</span>
        </div>
      </div>
    </div>
  )
}

export default UpgradeModal
