/**
 * Update Plan Features Button
 * Popola le features dei piani esistenti con la configurazione completa
 */

import React, { useState } from 'react'
import { Zap, CheckCircle, AlertCircle } from 'lucide-react'
import { omnilyProPlansService, type PlanFeatures, type PlanLimits } from '../../services/omnilyProPlansService'
import { useToast } from '../../contexts/ToastContext'

interface UpdatePlanFeaturesButtonProps {
  onComplete?: () => void
}

const UpdatePlanFeaturesButton: React.FC<UpdatePlanFeaturesButtonProps> = ({ onComplete }) => {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const { showSuccess, showError } = useToast()

  const planConfigurations = {
    starter: {
      features: {
        // Core Features
        posEnabled: true,
        loyaltyPrograms: true,

        // Marketing & Communication
        emailMarketing: true,
        smsMarketing: false,
        whatsappMarketing: false,
        campaigns: true,
        emailAutomations: false,

        // Customer Engagement
        coupons: true,
        giftCards: true,
        giftCertificates: false,
        subscriptions: false,
        referralProgram: true,

        // Gaming & Lottery
        gamingLottery: false,
        slotMachine: false,
        scratchCards: false,
        omnyCoin: false,

        // Advanced Features
        nfcCards: false,
        advancedAnalytics: false,
        automations: false,
        publicWebsite: true,
        websiteBuilder: false,
        mobileApp: false,

        // Business Management
        multiLocation: false,
        teamManagement: true,
        categoriesManagement: true,
        channelsManagement: false,
        inventoryManagement: true,

        // Customization & Integration
        customBranding: false,
        customDomain: false,
        apiAccess: false,
        webhooks: false,

        // Support & Services
        prioritySupport: false,
        dedicatedAccountManager: false,
        supportTickets: true,
        contactMessages: true
      } as PlanFeatures,
      limits: {
        maxCustomers: 500,
        maxTeamMembers: 3,
        maxLocations: 1,
        maxEmailsPerMonth: 1000,
        maxSMSPerMonth: 0,
        maxWhatsAppPerMonth: 0,
        maxCampaigns: 5,
        maxEmailAutomations: 0,
        maxActiveCoupons: 10,
        maxActiveGiftCards: 20,
        maxActiveGiftCertificates: 0,
        maxSubscriptionPlans: 0,
        maxReferralRewards: 5,
        maxLotteryDrawsPerMonth: 0,
        maxSlotMachineSpins: 0,
        maxScratchCardsPerMonth: 0,
        maxNFCCards: 0,
        maxVirtualCards: 100,
        maxAutomations: 0,
        maxWorkflows: 0,
        maxWebhooks: 0,
        maxLoyaltyPrograms: 1,
        maxNotifications: 100,
        maxCategories: 20,
        maxProductsPerCategory: 100,
        maxStorageGB: 5,
        maxAPICallsPerDay: 0,
        maxReportsPerMonth: 10
      } as PlanLimits
    },
    professional: {
      features: {
        posEnabled: true,
        loyaltyPrograms: true,
        emailMarketing: true,
        smsMarketing: true,
        whatsappMarketing: true,
        campaigns: true,
        emailAutomations: true,
        coupons: true,
        giftCards: true,
        giftCertificates: true,
        subscriptions: true,
        referralProgram: true,
        gamingLottery: true,
        slotMachine: true,
        scratchCards: true,
        omnyCoin: true,
        nfcCards: true,
        advancedAnalytics: true,
        automations: true,
        publicWebsite: true,
        websiteBuilder: true,
        mobileApp: false,
        multiLocation: true,
        teamManagement: true,
        categoriesManagement: true,
        channelsManagement: true,
        inventoryManagement: true,
        customBranding: true,
        customDomain: true,
        apiAccess: true,
        webhooks: true,
        prioritySupport: true,
        dedicatedAccountManager: false,
        supportTickets: true,
        contactMessages: true
      } as PlanFeatures,
      limits: {
        maxCustomers: 5000,
        maxTeamMembers: 10,
        maxLocations: 3,
        maxEmailsPerMonth: 10000,
        maxSMSPerMonth: 1000,
        maxWhatsAppPerMonth: 500,
        maxCampaigns: null,
        maxEmailAutomations: 20,
        maxActiveCoupons: null,
        maxActiveGiftCards: null,
        maxActiveGiftCertificates: 50,
        maxSubscriptionPlans: 10,
        maxReferralRewards: null,
        maxLotteryDrawsPerMonth: 10,
        maxSlotMachineSpins: null,
        maxScratchCardsPerMonth: 1000,
        maxNFCCards: 500,
        maxVirtualCards: null,
        maxAutomations: 50,
        maxWorkflows: 20,
        maxWebhooks: 10,
        maxLoyaltyPrograms: 3,
        maxNotifications: null,
        maxCategories: null,
        maxProductsPerCategory: null,
        maxStorageGB: 50,
        maxAPICallsPerDay: 10000,
        maxReportsPerMonth: null
      } as PlanLimits
    },
    enterprise: {
      features: {
        posEnabled: true,
        loyaltyPrograms: true,
        emailMarketing: true,
        smsMarketing: true,
        whatsappMarketing: true,
        campaigns: true,
        emailAutomations: true,
        coupons: true,
        giftCards: true,
        giftCertificates: true,
        subscriptions: true,
        referralProgram: true,
        gamingLottery: true,
        slotMachine: true,
        scratchCards: true,
        omnyCoin: true,
        nfcCards: true,
        advancedAnalytics: true,
        automations: true,
        publicWebsite: true,
        websiteBuilder: true,
        mobileApp: true,
        multiLocation: true,
        teamManagement: true,
        categoriesManagement: true,
        channelsManagement: true,
        inventoryManagement: true,
        customBranding: true,
        customDomain: true,
        apiAccess: true,
        webhooks: true,
        prioritySupport: true,
        dedicatedAccountManager: true,
        supportTickets: true,
        contactMessages: true
      } as PlanFeatures,
      limits: {
        maxCustomers: null,
        maxTeamMembers: null,
        maxLocations: null,
        maxEmailsPerMonth: null,
        maxSMSPerMonth: null,
        maxWhatsAppPerMonth: null,
        maxCampaigns: null,
        maxEmailAutomations: null,
        maxActiveCoupons: null,
        maxActiveGiftCards: null,
        maxActiveGiftCertificates: null,
        maxSubscriptionPlans: null,
        maxReferralRewards: null,
        maxLotteryDrawsPerMonth: null,
        maxSlotMachineSpins: null,
        maxScratchCardsPerMonth: null,
        maxNFCCards: null,
        maxVirtualCards: null,
        maxAutomations: null,
        maxWorkflows: null,
        maxWebhooks: null,
        maxLoyaltyPrograms: null,
        maxNotifications: null,
        maxCategories: null,
        maxProductsPerCategory: null,
        maxStorageGB: null,
        maxAPICallsPerDay: null,
        maxReportsPerMonth: null
      } as PlanLimits
    }
  }

  const handleUpdateFeatures = async () => {
    try {
      setLoading(true)
      console.log('🔄 Updating plan features...')

      // Get all plans
      const plans = await omnilyProPlansService.getAllPlans()
      console.log('📋 Found plans:', plans.length)

      let updatedCount = 0

      for (const plan of plans) {
        // Determine configuration based on slug or name
        let config = null

        if (plan.slug.includes('starter') || plan.name.toLowerCase().includes('starter')) {
          config = planConfigurations.starter
          console.log(`📦 Updating Starter plan: ${plan.name}`)
        } else if (plan.slug.includes('professional') || plan.slug.includes('pro') || plan.name.toLowerCase().includes('professional')) {
          config = planConfigurations.professional
          console.log(`📦 Updating Professional plan: ${plan.name}`)
        } else if (plan.slug.includes('enterprise') || plan.name.toLowerCase().includes('enterprise')) {
          config = planConfigurations.enterprise
          console.log(`📦 Updating Enterprise plan: ${plan.name}`)
        }

        if (config) {
          await omnilyProPlansService.updatePlan(plan.id, {
            features: config.features,
            limits: config.limits
          })
          updatedCount++
          console.log(`✅ Updated ${plan.name}`)
        } else {
          console.log(`⏭️ Skipping ${plan.name} - no matching configuration`)
        }
      }

      setSuccess(true)
      showSuccess('Completato!', `${updatedCount} piani aggiornati con successo`)

      if (onComplete) {
        onComplete()
      }

      // Reset success after 3 seconds
      setTimeout(() => setSuccess(false), 3000)
    } catch (error: any) {
      console.error('❌ Error updating plan features:', error)
      showError('Errore', error.message || 'Impossibile aggiornare le features dei piani')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleUpdateFeatures}
      disabled={loading || success}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '12px 24px',
        background: success ? '#10b981' : loading ? '#94a3b8' : '#8b5cf6',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: 600,
        cursor: loading || success ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}
    >
      {success ? (
        <>
          <CheckCircle size={18} />
          Features Aggiornate!
        </>
      ) : loading ? (
        <>
          <div style={{
            width: '18px',
            height: '18px',
            border: '2px solid white',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
          }} />
          Aggiornamento...
        </>
      ) : (
        <>
          <Zap size={18} />
          Popola Features Piani
        </>
      )}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </button>
  )
}

export default UpdatePlanFeaturesButton
