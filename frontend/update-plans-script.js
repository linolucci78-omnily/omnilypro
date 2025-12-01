/**
 * Script da eseguire nella console del browser per aggiornare/creare i piani OMNILYPRO
 *
 * ISTRUZIONI:
 * 1. Apri la tua app in http://localhost:5173
 * 2. Apri Console (F12 > Console)
 * 3. Copia e incolla questo intero file nella console
 * 4. Premi Enter
 * 5. Lo script creerà/aggiornerà i 3 piani nel database
 *
 * NOTA: Assicurati che 'supabase' sia disponibile globalmente.
 * Se non funziona, vai prima su una pagina dell'app che usa supabase.
 */

(async function updateOmnilyProPlans() {
  console.log('🚀 Inizio aggiornamento piani OMNILYPRO...')

  // Usa supabase dalla finestra globale (già importato dall'app)
  if (typeof supabase === 'undefined') {
    console.error('❌ ERROR: supabase non trovato! Assicurati di essere sulla pagina dell\'app.')
    console.log('💡 Prova ad andare su /admin/subscriptions e poi riesegui questo script')
    return
  }

  const plans = [
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
      sort_order: 1,
      features: {
        // Core Features
        posEnabled: false,
        loyaltyPrograms: true,
        // Marketing & Communication
        emailMarketing: false,
        smsMarketing: false,
        whatsappMarketing: false,
        campaigns: false,
        emailAutomations: false,
        // Customer Engagement
        coupons: false,
        giftCards: false,
        giftCertificates: false,
        subscriptions: false,
        referralProgram: false,
        // Gaming & Lottery
        gamingLottery: false,
        slotMachine: false,
        scratchCards: false,
        // Advanced Features
        nfcCards: false,
        advancedAnalytics: false,
        automations: false,
        publicWebsite: false,
        websiteBuilder: false,
        mobileApp: false,
        // Business Management
        multiLocation: false,
        teamManagement: false,
        categoriesManagement: false,
        channelsManagement: false,
        inventoryManagement: false,
        // Customization & Integration
        customBranding: false,
        customDomain: false,
        apiAccess: false,
        webhooks: false,
        // Support & Services
        prioritySupport: false,
        dedicatedAccountManager: false,
        supportTickets: false,
        contactMessages: false
      },
      limits: {
        // Customer & Team Limits
        maxCustomers: 500,
        maxTeamMembers: 2,
        maxLocations: 1,
        // Marketing Limits
        maxEmailsPerMonth: 0,
        maxSMSPerMonth: 0,
        maxWhatsAppPerMonth: 0,
        maxCampaigns: 0,
        maxEmailAutomations: 0,
        // Engagement Limits
        maxActiveCoupons: 0,
        maxActiveGiftCards: 0,
        maxActiveGiftCertificates: 0,
        maxSubscriptionPlans: 0,
        maxReferralRewards: 0,
        // Gaming Limits
        maxLotteryDrawsPerMonth: 0,
        maxSlotMachineSpins: 0,
        maxScratchCardsPerMonth: 0,
        // NFC & Cards
        maxNFCCards: 0,
        maxVirtualCards: 0,
        // Automation & Workflows
        maxAutomations: 0,
        maxWorkflows: 0,
        maxWebhooks: 0,
        // Content & Analytics
        maxLoyaltyPrograms: 1,
        maxNotifications: 1000,
        maxCategories: 5,
        maxProductsPerCategory: 50,
        // Storage & Data
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
      sort_order: 2,
      features: {
        // Core Features
        posEnabled: true,
        loyaltyPrograms: true,
        // Marketing & Communication
        emailMarketing: true,
        smsMarketing: true,
        whatsappMarketing: false,
        campaigns: true,
        emailAutomations: true,
        // Customer Engagement
        coupons: true,
        giftCards: true,
        giftCertificates: true,
        subscriptions: true,
        referralProgram: true,
        // Gaming & Lottery
        gamingLottery: true,
        slotMachine: true,
        scratchCards: true,
        // Advanced Features
        nfcCards: true,
        advancedAnalytics: true,
        automations: true,
        publicWebsite: true,
        websiteBuilder: true,
        mobileApp: false,
        // Business Management
        multiLocation: true,
        teamManagement: true,
        categoriesManagement: true,
        channelsManagement: true,
        inventoryManagement: true,
        // Customization & Integration
        customBranding: true,
        customDomain: false,
        apiAccess: true,
        webhooks: true,
        // Support & Services
        prioritySupport: false,
        dedicatedAccountManager: false,
        supportTickets: true,
        contactMessages: true
      },
      limits: {
        // Customer & Team Limits
        maxCustomers: 5000,
        maxTeamMembers: 10,
        maxLocations: 3,
        // Marketing Limits
        maxEmailsPerMonth: 10000,
        maxSMSPerMonth: 5000,
        maxWhatsAppPerMonth: 0,
        maxCampaigns: 20,
        maxEmailAutomations: 10,
        // Engagement Limits
        maxActiveCoupons: 50,
        maxActiveGiftCards: 100,
        maxActiveGiftCertificates: 100,
        maxSubscriptionPlans: 10,
        maxReferralRewards: 20,
        // Gaming Limits
        maxLotteryDrawsPerMonth: 10,
        maxSlotMachineSpins: 5000,
        maxScratchCardsPerMonth: 1000,
        // NFC & Cards
        maxNFCCards: 500,
        maxVirtualCards: 1000,
        // Automation & Workflows
        maxAutomations: 20,
        maxWorkflows: 50,
        maxWebhooks: 10,
        // Content & Analytics
        maxLoyaltyPrograms: 5,
        maxNotifications: 50000,
        maxCategories: 50,
        maxProductsPerCategory: 500,
        // Storage & Data
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
      sort_order: 3,
      features: {
        // TUTTE LE FEATURES ABILITATE
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
        // TUTTI I LIMITI ILLIMITATI (null)
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

  for (const plan of plans) {
    console.log(`📝 Aggiornamento piano: ${plan.name}...`)

    // Cerca piano esistente
    const { data: existing } = await supabase
      .from('omnilypro_plans')
      .select('id')
      .eq('slug', plan.slug)
      .single()

    if (existing) {
      // Aggiorna piano esistente
      const { error } = await supabase
        .from('omnilypro_plans')
        .update(plan)
        .eq('slug', plan.slug)

      if (error) {
        console.error(`❌ Errore aggiornamento ${plan.name}:`, error)
      } else {
        console.log(`✅ Piano ${plan.name} aggiornato!`)
      }
    } else {
      // Crea nuovo piano
      const { error } = await supabase
        .from('omnilypro_plans')
        .insert(plan)

      if (error) {
        console.error(`❌ Errore creazione ${plan.name}:`, error)
      } else {
        console.log(`✅ Piano ${plan.name} creato!`)
      }
    }
  }

  // Verifica finale
  const { data: allPlans, error } = await supabase
    .from('omnilypro_plans')
    .select('*')
    .order('sort_order')

  if (error) {
    console.error('❌ Errore verifica piani:', error)
  } else {
    console.log('✅ Piani totali nel database:', allPlans.length)
    console.table(allPlans.map(p => ({
      name: p.name,
      slug: p.slug,
      price: `€${p.price_monthly}`,
      features_count: Object.values(p.features).filter(Boolean).length,
      is_active: p.is_active
    })))
  }

  console.log('🎉 Aggiornamento completato!')
})()
