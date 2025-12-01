import type { PlanFeatures, PlanLimits } from './omnilyProPlansService'

/**
 * Mapping tra features e i loro limiti associati
 * Ogni feature può avere uno o più limiti correlati
 */
export const FEATURE_LIMITS_MAP: Partial<Record<keyof PlanFeatures, Array<keyof PlanLimits>>> = {
  // Core Features
  posEnabled: [],
  loyaltyPrograms: ['maxLoyaltyPrograms'],

  // Marketing & Communication
  emailMarketing: ['maxEmailsPerMonth'],
  smsMarketing: ['maxSMSPerMonth'],
  whatsappMarketing: ['maxWhatsAppPerMonth'],
  campaigns: ['maxCampaigns'],
  emailAutomations: ['maxEmailAutomations'],

  // Customer Engagement
  coupons: ['maxActiveCoupons'],
  giftCards: ['maxActiveGiftCards'],
  giftCertificates: ['maxActiveGiftCertificates'],
  subscriptions: ['maxSubscriptionPlans'],
  referralProgram: ['maxReferralRewards'],

  // Gaming & Lottery
  gamingLottery: ['maxLotteryDrawsPerMonth'],
  slotMachine: ['maxSlotMachineSpins'],
  scratchCards: ['maxScratchCardsPerMonth'],

  // Advanced Features
  nfcCards: ['maxNFCCards', 'maxVirtualCards'],
  advancedAnalytics: [],
  automations: ['maxAutomations', 'maxWorkflows'],
  publicWebsite: [],
  websiteBuilder: [],
  mobileApp: [],

  // Business Management
  multiLocation: ['maxLocations'],
  teamManagement: ['maxTeamMembers'],
  categoriesManagement: ['maxCategories', 'maxProductsPerCategory'],
  channelsManagement: [],
  inventoryManagement: [],

  // Customization & Integration
  customBranding: [],
  customDomain: [],
  apiAccess: ['maxAPICallsPerDay', 'maxWebhooks'],
  webhooks: ['maxWebhooks'],

  // Support & Services
  prioritySupport: [],
  dedicatedAccountManager: [],
  supportTickets: [],
  contactMessages: []
}

/**
 * Descrizioni user-friendly dei limiti
 */
export const LIMIT_DESCRIPTIONS: Record<keyof PlanLimits, string> = {
  // Customer & Team Limits
  maxCustomers: 'numero massimo di clienti',
  maxTeamMembers: 'membri del team',
  maxLocations: 'sedi',

  // Marketing Limits
  maxEmailsPerMonth: 'email al mese',
  maxSMSPerMonth: 'SMS al mese',
  maxWhatsAppPerMonth: 'messaggi WhatsApp al mese',
  maxCampaigns: 'campagne marketing attive',
  maxEmailAutomations: 'automazioni email',

  // Engagement Limits
  maxActiveCoupons: 'coupon attivi',
  maxActiveGiftCards: 'gift card attive',
  maxActiveGiftCertificates: 'gift certificate attivi',
  maxSubscriptionPlans: 'piani di abbonamento',
  maxReferralRewards: 'premi referral',

  // Gaming Limits
  maxLotteryDrawsPerMonth: 'estrazioni lotteria al mese',
  maxSlotMachineSpins: 'giri slot machine',
  maxScratchCardsPerMonth: 'gratta e vinci al mese',

  // NFC & Cards
  maxNFCCards: 'carte NFC fisiche',
  maxVirtualCards: 'carte virtuali',

  // Automation & Workflows
  maxAutomations: 'automazioni attive',
  maxWorkflows: 'workflows',
  maxWebhooks: 'webhooks',

  // Content & Analytics
  maxLoyaltyPrograms: 'programmi fedeltà',
  maxNotifications: 'notifiche al mese',
  maxCategories: 'categorie prodotti',
  maxProductsPerCategory: 'prodotti per categoria',

  // Storage & Data
  maxStorageGB: 'GB di storage',
  maxAPICallsPerDay: 'chiamate API al giorno',
  maxReportsPerMonth: 'report al mese'
}

/**
 * Messaggi di upgrade contestuali per ogni feature
 */
export const FEATURE_UPGRADE_MESSAGES: Partial<Record<keyof PlanFeatures, {
  title: string
  description: string
  benefits: string[]
}>> = {
  emailMarketing: {
    title: 'Email Marketing Professionale',
    description: 'Raggiungi i tuoi clienti con campagne email professionali',
    benefits: [
      'Campagne illimitate',
      'Segmentazione avanzata',
      'A/B testing',
      'Analytics dettagliate',
      'Automazioni email'
    ]
  },
  smsMarketing: {
    title: 'SMS Marketing',
    description: 'Comunica istantaneamente con i tuoi clienti via SMS',
    benefits: [
      'Invio SMS massivo',
      'Personalizzazione messaggi',
      'Programmazione invii',
      'Tracciamento consegne',
      'Risposte automatiche'
    ]
  },
  whatsappMarketing: {
    title: 'WhatsApp Business',
    description: 'Connetti con i clienti sul canale più usato',
    benefits: [
      'Messaggi WhatsApp ufficiali',
      'Template certificati',
      'Chat interattive',
      'Media support',
      'API ufficiali WhatsApp'
    ]
  },
  posEnabled: {
    title: 'Sistema POS Integrato',
    description: 'Gestisci vendite in store con il nostro POS',
    benefits: [
      'Terminale POS completo',
      'Pagamenti carta/NFC',
      'Stampa scontrini',
      'Sincronizzazione inventario',
      'Report vendite real-time'
    ]
  },
  advancedAnalytics: {
    title: 'Analytics Avanzate',
    description: 'Insights professionali per far crescere il business',
    benefits: [
      'Dashboard interattive',
      'Previsioni AI',
      'Segmentazione RFM',
      'Funnel di conversione',
      'Export dati personalizzati'
    ]
  },
  apiAccess: {
    title: 'API Access',
    description: 'Integra OMNILYPRO con i tuoi sistemi',
    benefits: [
      'REST API completa',
      'Webhooks real-time',
      'Documentazione estesa',
      'Rate limits elevati',
      'Supporto tecnico dedicato'
    ]
  },
  customBranding: {
    title: 'Branding Personalizzato',
    description: 'Rendi la piattaforma unica con il tuo brand',
    benefits: [
      'Logo e colori custom',
      'Interfaccia white-label',
      'Email brandizzate',
      'App personalizzata',
      'Rimozione OMNILYPRO branding'
    ]
  },
  multiLocation: {
    title: 'Multi-Location',
    description: 'Gestisci più sedi da un\'unica piattaforma',
    benefits: [
      'Gestione centralizzata',
      'Report per sede',
      'Inventario separato',
      'Staff per location',
      'Analytics comparative'
    ]
  },
  automations: {
    title: 'Automazioni Marketing',
    description: 'Automatizza le tue campagne marketing',
    benefits: [
      'Workflow personalizzati',
      'Trigger basati su eventi',
      'Email/SMS automatici',
      'Segmentazione dinamica',
      'A/B test automatici'
    ]
  },
  prioritySupport: {
    title: 'Supporto Prioritario',
    description: 'Assistenza dedicata quando ne hai bisogno',
    benefits: [
      'Risposta entro 2 ore',
      'Chat dedicata',
      'Chiamate di supporto',
      'Account manager',
      'Onboarding personalizzato'
    ]
  },
  loyaltyPrograms: {
    title: 'Programmi Fedeltà',
    description: 'Crea programmi fedeltà per fidelizzare i clienti',
    benefits: [
      'Punti e premi personalizzati',
      'Carte fedeltà digitali',
      'Livelli VIP',
      'Premi automatici',
      'Analytics fedeltà'
    ]
  },
  campaigns: {
    title: 'Campagne Marketing',
    description: 'Crea e gestisci campagne marketing multicanale',
    benefits: [
      'Campagne email, SMS, WhatsApp',
      'Scheduling automatico',
      'Segmentazione clienti',
      'A/B testing',
      'ROI tracking'
    ]
  },
  emailAutomations: {
    title: 'Automazioni Email',
    description: 'Email automatiche basate sul comportamento cliente',
    benefits: [
      'Benvenuto automatico',
      'Email compleanno',
      'Recupero carrello',
      'Win-back campaigns',
      'Trigger personalizzati'
    ]
  },
  coupons: {
    title: 'Sistema Coupon',
    description: 'Crea e distribuisci coupon sconto',
    benefits: [
      'Codici sconto personalizzati',
      'Limiti utilizzo',
      'Validità temporale',
      'Tracciamento redemption',
      'QR code dinamici'
    ]
  },
  giftCards: {
    title: 'Gift Card',
    description: 'Vendi e gestisci gift card digitali',
    benefits: [
      'Gift card ricaricabili',
      'Design personalizzato',
      'Invio via email/SMS',
      'Saldo real-time',
      'Report vendite'
    ]
  },
  giftCertificates: {
    title: 'Gift Certificate',
    description: 'Certificati regalo per servizi e prodotti',
    benefits: [
      'Template personalizzabili',
      'Scadenze flessibili',
      'Codici univoci',
      'Stampa e invio digitale',
      'Tracking utilizzo'
    ]
  },
  subscriptions: {
    title: 'Abbonamenti Ricorrenti',
    description: 'Gestisci abbonamenti e pagamenti ricorrenti',
    benefits: [
      'Piani mensili/annuali',
      'Fatturazione automatica',
      'Gestione disdette',
      'Trial gratuiti',
      'Analytics MRR'
    ]
  },
  referralProgram: {
    title: 'Programma Referral',
    description: 'Incentiva i clienti a portare nuovi clienti',
    benefits: [
      'Link referral unici',
      'Premi automatici',
      'Tracking conversioni',
      'Dashboard referrer',
      'Premi personalizzabili'
    ]
  },
  gamingLottery: {
    title: 'Sistema Lotteria',
    description: 'Crea lotterie ed estrazioni per engagement',
    benefits: [
      'Estrazioni automatiche',
      'Biglietti digitali',
      'Premi personalizzati',
      'Notifiche vincitori',
      'Report trasparenza'
    ]
  },
  slotMachine: {
    title: 'Slot Machine Gamification',
    description: 'Slot machine virtuale per coinvolgere i clienti',
    benefits: [
      'Giri giornalieri gratuiti',
      'Premi personalizzati',
      'Animazioni accattivanti',
      'Probabilità configurabili',
      'Leaderboard vincitori'
    ]
  },
  scratchCards: {
    title: 'Gratta e Vinci',
    description: 'Card digitali gratta e vinci per promozioni',
    benefits: [
      'Design personalizzato',
      'Premi istantanei',
      'Distribuzione automatica',
      'QR code integrati',
      'Analytics vincite'
    ]
  },
  nfcCards: {
    title: 'Carte NFC',
    description: 'Carte fisiche NFC per clienti fedeli',
    benefits: [
      'Carte fisiche brandizzate',
      'Tap to pay/earn',
      'Gestione digitale',
      'Sincronizzazione cloud',
      'Sostituzione card'
    ]
  },
  publicWebsite: {
    title: 'Sito Web Pubblico',
    description: 'Sito web professionale per la tua attività',
    benefits: [
      'Template professionali',
      'Dominio personalizzato',
      'SEO ottimizzato',
      'Mobile responsive',
      'Form di contatto'
    ]
  },
  websiteBuilder: {
    title: 'Website Builder',
    description: 'Editor drag & drop per creare siti web',
    benefits: [
      'Editor visuale',
      'Componenti pre-built',
      'Personalizzazione totale',
      'Preview real-time',
      'Pubblicazione istantanea'
    ]
  },
  mobileApp: {
    title: 'App Mobile Brandizzata',
    description: 'App iOS/Android con il tuo brand',
    benefits: [
      'App nativa iOS/Android',
      'Design personalizzato',
      'Push notifications',
      'Store listing',
      'Aggiornamenti automatici'
    ]
  },
  teamManagement: {
    title: 'Gestione Team',
    description: 'Gestisci staff e permessi',
    benefits: [
      'Ruoli personalizzati',
      'Permessi granulari',
      'Activity log',
      'Performance tracking',
      'Turni e presenze'
    ]
  },
  categoriesManagement: {
    title: 'Gestione Categorie',
    description: 'Organizza prodotti in categorie',
    benefits: [
      'Categorie illimitate',
      'Sotto-categorie',
      'Ordinamento drag&drop',
      'Immagini categoria',
      'SEO per categoria'
    ]
  },
  channelsManagement: {
    title: 'Gestione Canali',
    description: 'Gestisci canali di vendita multipli',
    benefits: [
      'Multi-channel sync',
      'Inventario centralizzato',
      'Prezzi per canale',
      'Analytics per canale',
      'Integrazione marketplace'
    ]
  },
  inventoryManagement: {
    title: 'Gestione Inventario',
    description: 'Sistema completo di gestione magazzino',
    benefits: [
      'Tracking real-time',
      'Alert stock basso',
      'Ordini automatici',
      'Barcode scanner',
      'Report inventario'
    ]
  },
  customDomain: {
    title: 'Dominio Personalizzato',
    description: 'Usa il tuo dominio personalizzato',
    benefits: [
      'Dominio custom',
      'SSL certificato',
      'Email professionale',
      'DNS management',
      'Backup automatici'
    ]
  },
  webhooks: {
    title: 'Webhooks',
    description: 'Integra con sistemi esterni via webhooks',
    benefits: [
      'Eventi real-time',
      'Payload personalizzati',
      'Retry automatici',
      'Logs dettagliati',
      'Sicurezza HMAC'
    ]
  },
  dedicatedAccountManager: {
    title: 'Account Manager Dedicato',
    description: 'Manager dedicato per il tuo successo',
    benefits: [
      'Consulente personale',
      'Chiamate strategiche mensili',
      'Training personalizzato',
      'Priorità massima',
      'Contatto diretto'
    ]
  },
  supportTickets: {
    title: 'Sistema Ticket',
    description: 'Gestione ticket di supporto avanzata',
    benefits: [
      'Ticket illimitati',
      'SLA garantiti',
      'Priorità custom',
      'Knowledge base',
      'Escalation automatica'
    ]
  },
  contactMessages: {
    title: 'Messaggi Contatto',
    description: 'Ricevi e gestisci messaggi clienti',
    benefits: [
      'Inbox centralizzata',
      'Risposte automatiche',
      'Template messaggi',
      'Analytics conversazioni',
      'Integrazione CRM'
    ]
  }
}

/**
 * Helper per ottenere i limiti associati a una feature
 */
export function getFeatureLimits(feature: keyof PlanFeatures): Array<keyof PlanLimits> {
  return FEATURE_LIMITS_MAP[feature] || []
}

/**
 * Helper per ottenere il messaggio di upgrade per una feature
 */
export function getFeatureUpgradeMessage(feature: keyof PlanFeatures) {
  return FEATURE_UPGRADE_MESSAGES[feature] || {
    title: `Upgrade per ${feature}`,
    description: 'Questa funzionalità non è disponibile nel tuo piano attuale',
    benefits: []
  }
}
