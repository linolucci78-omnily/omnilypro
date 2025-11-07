import React from 'react'
import { Star, Award, Zap, TrendingUp, Edit3 } from 'lucide-react'
import './LoyaltyTiersDisplay.css'

interface LoyaltyTier {
  name: string
  threshold: string
  multiplier: string
  color: string
  benefits?: string[]
}

interface LoyaltyTiersDisplayProps {
  tiers: LoyaltyTier[]
  primaryColor: string
  onEdit?: () => void
}

const LoyaltyTiersDisplay: React.FC<LoyaltyTiersDisplayProps> = ({
  tiers,
  primaryColor,
  onEdit
}) => {
  const getIconForTier = (index: number) => {
    switch (index) {
      case 0: return Star
      case 1: return Award
      case 2: return Zap
      default: return TrendingUp
    }
  }

  return (
    <div className="loyalty-tiers-display">
      <div className="tiers-header">
        <div>
          <h2>Livelli di Fedeltà</h2>
          <p>Gestisci i livelli di fedeltà configurati per il tuo programma loyalty</p>
        </div>
        {onEdit && (
          <button
            className="btn-edit-tiers"
            onClick={onEdit}
            style={{
              background: primaryColor,
              borderColor: primaryColor
            }}
          >
            <Edit3 size={18} />
            Modifica Livelli
          </button>
        )}
      </div>

      <div className="tiers-grid">
        {tiers.map((tier, index) => {
          const Icon = getIconForTier(index)

          return (
            <div
              key={index}
              className="tier-card-animated"
              style={{
                '--tier-color': tier.color,
                '--primary-color': primaryColor
              } as React.CSSProperties}
            >
              <div className="tier-card-shine"></div>

              <div className="tier-card-icon-wrapper">
                <div className="tier-card-icon" style={{ background: tier.color }}>
                  <Icon size={32} />
                </div>
              </div>

              <div className="tier-card-content">
                <h3 className="tier-card-name" style={{ color: tier.color }}>
                  {tier.name}
                </h3>

                <div className="tier-card-stats">
                  <div className="tier-stat">
                    <span className="tier-stat-label">Soglia</span>
                    <span className="tier-stat-value">{tier.threshold} pt</span>
                  </div>
                  <div className="tier-stat-divider"></div>
                  <div className="tier-stat">
                    <span className="tier-stat-label">Moltiplicatore</span>
                    <span className="tier-stat-value">{tier.multiplier}x</span>
                  </div>
                </div>

                {tier.benefits && tier.benefits.length > 0 && (
                  <div className="tier-card-benefits">
                    <span className="benefits-title">Vantaggi:</span>
                    <ul>
                      {tier.benefits.map((benefit, idx) => (
                        <li key={idx}>{benefit}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="tier-card-badge" style={{ background: tier.color }}>
                Livello {index + 1}
              </div>
            </div>
          )
        })}
      </div>

      {tiers.length === 0 && (
        <div className="empty-state-tiers">
          <Star size={48} />
          <h3>Nessun livello configurato</h3>
          <p>Crea i tuoi livelli di fedeltà per premiare i clienti più fedeli</p>
          {onEdit && (
            <button
              className="btn-create-tiers"
              onClick={onEdit}
              style={{ background: primaryColor }}
            >
              Crea Livelli
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default LoyaltyTiersDisplay
