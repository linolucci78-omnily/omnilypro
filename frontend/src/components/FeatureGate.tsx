import React from 'react'
import { Lock, TrendingUp, CheckCircle, AlertCircle } from 'lucide-react'
import { usePlanFeatures } from '../hooks/usePlanFeatures'
import type { PlanFeatures } from '../services/omnilyProPlansService'
import { getFeatureUpgradeMessage, getFeatureLimits, LIMIT_DESCRIPTIONS } from '../services/featureLimitsMapping'

interface FeatureGateProps {
  feature: keyof PlanFeatures
  children: React.ReactNode
  fallback?: React.ReactNode
  showUpgradePrompt?: boolean
}

/**
 * Component that gates features based on plan
 *
 * Usage:
 * <FeatureGate feature="emailMarketing">
 *   <EmailMarketingComponent />
 * </FeatureGate>
 *
 * If the feature is not available, shows an upgrade prompt or custom fallback
 */
export const FeatureGate: React.FC<FeatureGateProps> = ({
  feature,
  children,
  fallback,
  showUpgradePrompt = true
}) => {
  const { canUseFeature, plan, loading } = usePlanFeatures()

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>
        Caricamento...
      </div>
    )
  }

  const { allowed, reason } = canUseFeature(feature)

  if (allowed) {
    return <>{children}</>
  }

  // Feature not allowed
  if (fallback) {
    return <>{fallback}</>
  }

  if (!showUpgradePrompt) {
    return null
  }

  // Get custom upgrade message for this feature
  const upgradeMessage = getFeatureUpgradeMessage(feature)
  const associatedLimits = getFeatureLimits(feature)

  // Default upgrade prompt with custom messaging
  return (
    <div
      style={{
        padding: '48px',
        maxWidth: '600px',
        margin: '0 auto',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '16px',
        color: 'white',
        boxShadow: '0 20px 60px rgba(102, 126, 234, 0.4)'
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <Lock size={56} style={{ marginBottom: '16px', opacity: 0.9 }} />
        <h2 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '12px', lineHeight: '1.2' }}>
          {upgradeMessage.title}
        </h2>
        <p style={{ fontSize: '16px', opacity: 0.9, lineHeight: '1.6' }}>
          {upgradeMessage.description}
        </p>
      </div>

      {/* Benefits */}
      {upgradeMessage.benefits.length > 0 && (
        <div style={{ marginBottom: '32px', textAlign: 'left' }}>
          <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '16px', opacity: 0.9, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Cosa include
          </h4>
          <div style={{ display: 'grid', gap: '12px' }}>
            {upgradeMessage.benefits.map((benefit, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <CheckCircle size={20} style={{ flexShrink: 0, opacity: 0.9 }} />
                <span style={{ fontSize: '15px', lineHeight: '1.5' }}>{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Associated Limits */}
      {associatedLimits.length > 0 && plan && (
        <div style={{ marginBottom: '32px', padding: '16px', background: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}>
          <h4 style={{ fontSize: '13px', fontWeight: '600', marginBottom: '12px', opacity: 0.9 }}>
            Limiti disponibili con upgrade
          </h4>
          {associatedLimits.map((limitKey) => {
            const limitValue = plan.limits[limitKey]
            const limitDesc = LIMIT_DESCRIPTIONS[limitKey]
            return (
              <div key={limitKey} style={{ fontSize: '14px', marginBottom: '6px', opacity: 0.9 }}>
                • {limitValue === null || limitValue === 0 ? 'Illimitati' : limitValue} {limitDesc}
              </div>
            )
          })}
        </div>
      )}

      {/* Current Plan */}
      {plan && (
        <div style={{ textAlign: 'center', marginBottom: '24px', padding: '12px', background: 'rgba(255,255,255,0.15)', borderRadius: '8px' }}>
          <p style={{ fontSize: '13px', opacity: 0.8, marginBottom: '4px' }}>
            Piano attuale
          </p>
          <p style={{ fontSize: '18px', fontWeight: '600' }}>
            {plan.name} - €{plan.price_monthly}/mese
          </p>
        </div>
      )}

      {/* CTA Button */}
      <div style={{ textAlign: 'center' }}>
        <button
          onClick={() => {
            window.location.href = '/admin/subscriptions'
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '14px 32px',
            background: 'white',
            color: '#667eea',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)'
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.2)'
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'
          }}
        >
          <TrendingUp size={20} />
          Effettua l'Upgrade Ora
        </button>
      </div>
    </div>
  )
}

interface LimitGateProps {
  limit: keyof import('../services/omnilyProPlansService').PlanLimits
  currentValue: number
  children: React.ReactNode
  onLimitReached?: () => void
}

/**
 * Component that checks limits and shows warning when approaching/exceeding
 *
 * Usage:
 * <LimitGate limit="maxCustomers" currentValue={customerCount}>
 *   <AddCustomerButton />
 * </LimitGate>
 */
export const LimitGate: React.FC<LimitGateProps> = ({
  limit,
  currentValue,
  children,
  onLimitReached
}) => {
  const { checkLimit, plan, loading } = usePlanFeatures()

  if (loading) {
    return <>{children}</>
  }

  const { allowed, limit: limitValue, remaining } = checkLimit(limit, currentValue)

  if (!allowed) {
    if (onLimitReached) {
      onLimitReached()
    }

    return (
      <div
        style={{
          padding: '20px',
          background: '#fef2f2',
          border: '2px solid #fca5a5',
          borderRadius: '8px',
          color: '#991b1b'
        }}
      >
        <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
          Limite Raggiunto
        </h4>
        <p style={{ fontSize: '14px', marginBottom: '12px' }}>
          Hai raggiunto il limite di {limitValue} per il piano {plan?.name}.
        </p>
        <button
          onClick={() => (window.location.href = '/admin/subscriptions')}
          style={{
            padding: '8px 16px',
            background: '#dc2626',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          Upgrade Piano
        </button>
      </div>
    )
  }

  // Show warning when approaching limit (80%)
  if (limitValue && remaining !== null && remaining < limitValue * 0.2) {
    return (
      <div>
        <div
          style={{
            padding: '12px',
            background: '#fffbeb',
            border: '1px solid #fbbf24',
            borderRadius: '6px',
            color: '#92400e',
            marginBottom: '12px',
            fontSize: '14px'
          }}
        >
          ⚠️ Attenzione: stai raggiungendo il limite ({currentValue}/{limitValue}). Considera un upgrade.
        </div>
        {children}
      </div>
    )
  }

  return <>{children}</>
}
