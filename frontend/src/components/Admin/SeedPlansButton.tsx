import React, { useState } from 'react'
import { Database } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { OmnilyProPlan } from '../../services/omnilyProPlansService'

/**
 * Componente per popolare/aggiornare i piani OMNILYPRO nel database
 * Da aggiungere temporaneamente in AdminPlansManager
 */
export const SeedPlansButton: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string>('')

  const seedPlans = async () => {
    setLoading(true)
    setResult('🚀 Inizio aggiornamento piani...')

    const plans: Partial<OmnilyProPlan>[] = [
      {
        slug: 'basic',
        name: 'Basic',
        description: 'Piano ideale per iniziare con le funzionalità essenziali',
        price_monthly: 29,
        price_yearly: 290,
        setup_fee: 0,
        currency: 'EUR',
        color: '#3b82f6',
        is_popular: false,
        is_featured: false,
        is_active: true,
        visibility: 'public',
        show_in_wizard: true,
        show_in_landing: true,
        sort_order: 1,
        features: {
          posEnabled: false,
          loyaltyPrograms: true,
          emailMarketing: false,
          smsMarketing: false,
          whatsappMarketing: false,
          campaigns: false,
          emailAutomations: false,
          coupons: false,
          giftCards: false,
          giftCertificates: false,
          subscriptions: false,
          referralProgram: false,
          gamingLottery: false,
          slotMachine: false,
          scratchCards: false,
          nfcCards: false,
          advancedAnalytics: false,
          automations: false,
          publicWebsite: false,
          websiteBuilder: false,
          mobileApp: false,
          multiLocation: false,
          teamManagement: false,
          categoriesManagement: false,
          channelsManagement: false,
          inventoryManagement: false,
          customBranding: false,
          customDomain: false,
          apiAccess: false,
          webhooks: false,
          prioritySupport: false,
          dedicatedAccountManager: false,
          supportTickets: false,
          contactMessages: false
        },
        limits: {
          maxCustomers: 500,
          maxTeamMembers: 2,
          maxLocations: 1,
          maxEmailsPerMonth: 0,
          maxSMSPerMonth: 0,
          maxWhatsAppPerMonth: 0,
          maxCampaigns: 0,
          maxEmailAutomations: 0,
          maxActiveCoupons: 0,
          maxActiveGiftCards: 0,
          maxActiveGiftCertificates: 0,
          maxSubscriptionPlans: 0,
          maxReferralRewards: 0,
          maxLotteryDrawsPerMonth: 0,
          maxSlotMachineSpins: 0,
          maxScratchCardsPerMonth: 0,
          maxNFCCards: 0,
          maxVirtualCards: 0,
          maxAutomations: 0,
          maxWorkflows: 0,
          maxWebhooks: 0,
          maxLoyaltyPrograms: 1,
          maxNotifications: 1000,
          maxCategories: 5,
          maxProductsPerCategory: 50,
          maxStorageGB: 1,
          maxAPICallsPerDay: 0,
          maxReportsPerMonth: 5
        }
      },
      {
        slug: 'professional',
        name: 'Professional',
        description: 'Tutte le funzionalità per far crescere il tuo business',
        price_monthly: 99,
        price_yearly: 990,
        setup_fee: 0,
        currency: 'EUR',
        color: '#8b5cf6',
        badge_text: 'Più Popolare',
        is_popular: true,
        is_featured: true,
        is_active: true,
        visibility: 'public',
        show_in_wizard: true,
        show_in_landing: true,
        sort_order: 2,
        features: {
          posEnabled: true,
          loyaltyPrograms: true,
          emailMarketing: true,
          smsMarketing: true,
          whatsappMarketing: false,
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
          customDomain: false,
          apiAccess: true,
          webhooks: true,
          prioritySupport: false,
          dedicatedAccountManager: false,
          supportTickets: true,
          contactMessages: true
        },
        limits: {
          maxCustomers: 5000,
          maxTeamMembers: 10,
          maxLocations: 3,
          maxEmailsPerMonth: 10000,
          maxSMSPerMonth: 5000,
          maxWhatsAppPerMonth: 0,
          maxCampaigns: 20,
          maxEmailAutomations: 10,
          maxActiveCoupons: 50,
          maxActiveGiftCards: 100,
          maxActiveGiftCertificates: 100,
          maxSubscriptionPlans: 10,
          maxReferralRewards: 20,
          maxLotteryDrawsPerMonth: 10,
          maxSlotMachineSpins: 5000,
          maxScratchCardsPerMonth: 1000,
          maxNFCCards: 500,
          maxVirtualCards: 1000,
          maxAutomations: 20,
          maxWorkflows: 50,
          maxWebhooks: 10,
          maxLoyaltyPrograms: 5,
          maxNotifications: 50000,
          maxCategories: 50,
          maxProductsPerCategory: 500,
          maxStorageGB: 50,
          maxAPICallsPerDay: 10000,
          maxReportsPerMonth: 100
        }
      },
      {
        slug: 'enterprise',
        name: 'Enterprise',
        description: 'Soluzione completa con supporto dedicato e funzionalità illimitate',
        price_monthly: 299,
        price_yearly: 2990,
        setup_fee: 500,
        currency: 'EUR',
        color: '#ec4899',
        badge_text: 'Best Value',
        is_popular: false,
        is_featured: true,
        is_active: true,
        visibility: 'public',
        show_in_wizard: true,
        show_in_landing: true,
        sort_order: 3,
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
        },
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
        }
      }
    ]

    let successCount = 0
    let errorCount = 0

    for (const plan of plans) {
      try {
        // Cerca piano esistente
        const { data: existing } = await supabase
          .from('omnilypro_plans')
          .select('id')
          .eq('slug', plan.slug)
          .single()

        if (existing) {
          // Aggiorna
          const { error } = await supabase
            .from('omnilypro_plans')
            .update(plan)
            .eq('slug', plan.slug)

          if (error) throw error
          setResult(prev => `${prev}\n✅ ${plan.name} aggiornato`)
          successCount++
        } else {
          // Crea
          const { error } = await supabase
            .from('omnilypro_plans')
            .insert(plan)

          if (error) throw error
          setResult(prev => `${prev}\n✅ ${plan.name} creato`)
          successCount++
        }
      } catch (error: any) {
        setResult(prev => `${prev}\n❌ Errore ${plan.name}: ${error.message}`)
        errorCount++
      }
    }

    setResult(prev => `${prev}\n\n🎉 Completato! ${successCount} successi, ${errorCount} errori`)
    setLoading(false)

    // Ricarica la pagina dopo 2 secondi per vedere i nuovi piani
    setTimeout(() => window.location.reload(), 2000)
  }

  return (
    <div style={{ padding: '20px', background: '#f0f9ff', border: '2px solid #3b82f6', borderRadius: '8px', marginBottom: '20px' }}>
      <h3 style={{ margin: '0 0 10px 0', color: '#1e40af' }}>
        <Database style={{ display: 'inline', marginRight: '8px' }} size={20} />
        Popola/Aggiorna Piani OMNILYPRO
      </h3>
      <p style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#64748b' }}>
        Questo pulsante creerà o aggiornerà i 3 piani standard (Basic, Professional, Enterprise) con tutte le 38 features.
      </p>
      <button
        onClick={seedPlans}
        disabled={loading}
        style={{
          padding: '10px 20px',
          background: loading ? '#94a3b8' : '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontWeight: '600'
        }}
      >
        {loading ? 'Aggiornamento in corso...' : '🚀 Popola Piani'}
      </button>
      {result && (
        <pre style={{
          marginTop: '15px',
          padding: '10px',
          background: '#1e293b',
          color: '#e2e8f0',
          borderRadius: '4px',
          fontSize: '12px',
          overflow: 'auto',
          maxHeight: '200px'
        }}>
          {result}
        </pre>
      )}
    </div>
  )
}
