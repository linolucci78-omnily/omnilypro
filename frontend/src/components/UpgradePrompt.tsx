import React from 'react'
import { Crown, X, Check } from 'lucide-react'
import { PlanType, PLAN_NAMES, PLAN_PRICES, formatPlanPrice } from '../utils/planPermissions'
import './UpgradePrompt.css'

interface UpgradePromptProps {
  isOpen: boolean
  onClose: () => void
  feature: string
  currentPlan: string
  requiredPlan: PlanType
  onUpgrade?: (plan: PlanType) => void
}

const UpgradePrompt: React.FC<UpgradePromptProps> = ({
  isOpen,
  onClose,
  feature,
  currentPlan,
  requiredPlan,
  onUpgrade
}) => {
  if (!isOpen) return null

  const requiredPlanName = PLAN_NAMES[requiredPlan]
  const requiredPrice = formatPlanPrice(requiredPlan)

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade(requiredPlan)
    }
    onClose()
  }

  const getFeaturesByPlan = (plan: PlanType) => {
    const features: Record<string, string[]> = {
      'basic': [
        'Livelli fedeltà personalizzati',
        'Sistema premi avanzato',
        'Categorie prodotti',
        'Notifiche base',
        'Fino a 100 clienti',
        'Supporto email'
      ],
      'pro': [
        'Tutte le funzioni Basic',
        'Campagne marketing automatiche',
        'Gestione team multi-utente',
        'Analytics avanzate',
        'Branding personalizzato',
        'Social media integration',
        'API access',
        'Webhook support',
        'Fino a 1000 clienti'
      ],
      'enterprise': [
        'Tutte le funzioni Pro',
        'Canali integrazione illimitati',
        'White label completo',
        'Dominio personalizzato',
        'SSO enterprise',
        'Supporto prioritario',
        'Clienti illimitati',
        'Workflow illimitati'
      ]
    }

    return features[plan] || []
  }

  return (
    <div className="upgrade-overlay">
      <div className="upgrade-prompt">
        <div className="upgrade-header">
          <div className="upgrade-icon">
            <Crown size={32} />
          </div>
          <button className="upgrade-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="upgrade-content">
          <h2>Upgrade Richiesto</h2>
          <p className="upgrade-message">
            La funzione <strong>"{feature}"</strong> è disponibile solo nel piano{' '}
            <strong>{requiredPlanName}</strong> e superiori.
          </p>

          <div className="current-plan-info">
            <div className="plan-badge current">
              Piano Attuale: {PLAN_NAMES[currentPlan.toLowerCase() as PlanType] || 'Free'}
            </div>
            <div className="plan-badge required">
              Richiesto: {requiredPlanName} ({requiredPrice})
            </div>
          </div>

          <div className="plan-features">
            <h3>Con {requiredPlanName} ottieni:</h3>
            <ul className="features-list">
              {getFeaturesByPlan(requiredPlan).map((feature: string, index: number) => (
                <li key={index} className="feature-item">
                  <Check size={16} />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="upgrade-actions">
            <button className="btn-upgrade" onClick={handleUpgrade}>
              <Crown size={18} />
              Upgrade a {requiredPlanName}
            </button>
            <button className="btn-cancel" onClick={onClose}>
              Continua con piano attuale
            </button>
          </div>

          <p className="upgrade-note">
            💡 Potrai sempre fare downgrade in qualsiasi momento dal pannello di controllo.
          </p>
        </div>
      </div>
    </div>
  )
}

export default UpgradePrompt