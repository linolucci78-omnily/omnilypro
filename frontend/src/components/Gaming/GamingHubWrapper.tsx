/**
 * OMNILYPRO GAMING MODULE - Gaming Hub Wrapper
 * Wraps Gaming Hub with plan-based access control
 */

import React from 'react'
import { Lock, Trophy, Sparkles, X } from 'lucide-react'
import { hasAccess, getUpgradePlan, formatPlanPrice, PlanType } from '../../utils/planPermissions'
import GamingHub from './GamingHub'
import './GamingHubWrapper.css'

interface GamingHubWrapperProps {
  customerId: string
  organizationId: string
  organizationPlan: string
  primaryColor?: string
  onUpgradeClick?: () => void
  onClose?: () => void
  onPointsUpdated?: () => void
}

const GamingHubWrapper: React.FC<GamingHubWrapperProps> = ({
  customerId,
  organizationId,
  organizationPlan,
  primaryColor = '#dc2626',
  onUpgradeClick,
  onClose,
  onPointsUpdated
}) => {
  console.log('🎮 GamingHubWrapper organizationPlan:', organizationPlan)
  const hasGamingAccess = hasAccess(organizationPlan, 'gamingModule')
  console.log('🎮 hasGamingAccess:', hasGamingAccess)

  // If access granted, show full Gaming Hub
  if (hasGamingAccess) {
    return (
      <GamingHub
        customerId={customerId}
        organizationId={organizationId}
        primaryColor={primaryColor}
        onClose={onClose}
        onPointsUpdated={onPointsUpdated}
      />
    )
  }

  // If no access, show upgrade prompt
  const upgradePlan = getUpgradePlan(organizationPlan, 'gamingModule')
  const upgradePrice = upgradePlan ? formatPlanPrice(upgradePlan) : '€99/mese'

  return (
    <div className="gaming-locked" style={{ '--primary-color': primaryColor } as React.CSSProperties}>
      {/* Close Button */}
      {onClose && (
        <button
          className="gaming-hub-close-button"
          onClick={onClose}
          aria-label="Chiudi"
        >
          <X size={24} strokeWidth={3} />
        </button>
      )}

      <div className="gaming-locked-content">
        {/* Lock icon */}
        <div className="gaming-locked-icon">
          <Lock size={64} />
        </div>

        {/* Title */}
        <h2 className="gaming-locked-title">
          <Trophy size={32} />
          Gaming Module
        </h2>

        {/* Description */}
        <p className="gaming-locked-description">
          Sblocca il Gaming Module per accedere a funzionalità premium di gamification:
        </p>

        {/* Features list */}
        <ul className="gaming-locked-features">
          <li>
            <Sparkles size={20} />
            <div>
              <strong>Badge System</strong>
              <span>15+ badge predefiniti con auto-unlock intelligente</span>
            </div>
          </li>
          <li>
            <Sparkles size={20} />
            <div>
              <strong>Challenge Giornaliere e Settimanali</strong>
              <span>Sfide auto-generate per coinvolgere i clienti</span>
            </div>
          </li>
          <li>
            <Sparkles size={20} />
            <div>
              <strong>Ruota della Fortuna</strong>
              <span>Spin wheel animata con distribuzione premi</span>
            </div>
          </li>
          <li>
            <Sparkles size={20} />
            <div>
              <strong>Notifiche & Achievements</strong>
              <span>Sistema completo di notifiche e statistiche</span>
            </div>
          </li>
        </ul>

        {/* Plan badge */}
        <div className="gaming-locked-plan">
          <div className="plan-badge pro">
            {upgradePlan === PlanType.PRO && 'PRO'}
            {upgradePlan === PlanType.ENTERPRISE && 'ENTERPRISE'}
            {!upgradePlan && 'PRO+'}
          </div>
          <p className="plan-price">{upgradePrice}</p>
        </div>

        {/* CTA */}
        <button
          className="gaming-locked-cta"
          onClick={onUpgradeClick}
        >
          Passa a {upgradePlan === PlanType.PRO ? 'Pro' : 'Enterprise'} per sbloccare
        </button>

        {/* Note */}
        <p className="gaming-locked-note">
          Il Gaming Module è disponibile solo per i piani Professional ed Enterprise
        </p>
      </div>
    </div>
  )
}

export default GamingHubWrapper
