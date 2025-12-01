import React from 'react'
import { FeatureGate, LimitGate } from './FeatureGate'
import { usePlanFeatures } from '../hooks/usePlanFeatures'
import type { PlanFeatures, PlanLimits } from '../services/omnilyProPlansService'
import { getFeatureLimits } from '../services/featureLimitsMapping'

interface FeatureWithLimitGateProps {
  feature: keyof PlanFeatures
  children: React.ReactNode
  currentUsage?: Partial<Record<keyof PlanLimits, number>>
  showUpgradePrompt?: boolean
}

/**
 * Component che combina controllo feature + limiti automaticamente
 *
 * Controlla prima se la feature è disponibile, poi verifica i limiti associati
 *
 * Usage:
 * <FeatureWithLimitGate
 *   feature="emailMarketing"
 *   currentUsage={{ maxEmailsPerMonth: emailsSentThisMonth }}
 * >
 *   <EmailCampaigns />
 * </FeatureWithLimitGate>
 */
export const FeatureWithLimitGate: React.FC<FeatureWithLimitGateProps> = ({
  feature,
  children,
  currentUsage = {},
  showUpgradePrompt = true
}) => {
  const { checkLimit } = usePlanFeatures()

  // Prima controlla se la feature è disponibile
  return (
    <FeatureGate feature={feature} showUpgradePrompt={showUpgradePrompt}>
      {/* Poi controlla i limiti associati a quella feature */}
      {(() => {
        const associatedLimits = getFeatureLimits(feature)

        // Se non ci sono limiti associati, mostra direttamente i children
        if (associatedLimits.length === 0) {
          return <>{children}</>
        }

        // Controlla tutti i limiti associati
        let content = <>{children}</>

        for (const limitKey of associatedLimits) {
          const currentValue = currentUsage[limitKey] || 0
          content = (
            <LimitGate
              key={limitKey}
              limit={limitKey}
              currentValue={currentValue}
            >
              {content}
            </LimitGate>
          )
        }

        return content
      })()}
    </FeatureGate>
  )
}

/**
 * Hook helper per verificare velocemente feature + limiti
 */
export function useFeatureWithLimit(
  feature: keyof PlanFeatures,
  currentUsage?: Partial<Record<keyof PlanLimits, number>>
): {
  canUse: boolean
  reason?: string
  limitReached?: keyof PlanLimits
} {
  const { canUseFeature, checkLimit } = usePlanFeatures()

  // Check feature availability
  const featureCheck = canUseFeature(feature)
  if (!featureCheck.allowed) {
    return {
      canUse: false,
      reason: featureCheck.reason
    }
  }

  // Check associated limits
  const associatedLimits = getFeatureLimits(feature)

  for (const limitKey of associatedLimits) {
    const currentValue = currentUsage?.[limitKey] || 0
    const limitCheck = checkLimit(limitKey, currentValue)

    if (!limitCheck.allowed) {
      return {
        canUse: false,
        reason: `Limite raggiunto: ${limitCheck.limit} ${limitKey}`,
        limitReached: limitKey
      }
    }
  }

  return { canUse: true }
}
