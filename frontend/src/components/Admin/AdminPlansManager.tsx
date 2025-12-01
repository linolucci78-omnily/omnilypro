import React, { useState, useEffect } from 'react'
import {
  Save, Plus, Trash2, ArrowLeft, Settings, DollarSign, Palette, Eye, EyeOff, Star,
  Mail, MessageSquare, Send, Megaphone, Zap, Tag, Gift, CreditCard, Receipt,
  Users, Repeat, Ticket, Coins, Sparkles, Dice5, Smartphone, BarChart3,
  Globe, Code, Webhook, Headphones, UserCog, MessageCircle, ShoppingCart,
  Building2, Shield, Layers, Package, Hash, ChevronDown, CheckCircle2
} from 'lucide-react'
import { omnilyProPlansService, type OmnilyProPlan, type PlanFeatures, type PlanLimits } from '../../services/omnilyProPlansService'
import { useToast } from '../../contexts/ToastContext'
import PageLoader from '../UI/PageLoader'
import { SeedPlansButton } from './SeedPlansButton'
import { getFeatureLimits } from '../../services/featureLimitsMapping'
import './AdminPlansManager.css' // Compact layout applied

const PRESET_COLORS = [
  '#64748b', '#3b82f6', '#6366f1', '#8b5cf6',
  '#ec4899', '#ef4444', '#f97316', '#f59e0b',
  '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9'
]

const FEATURE_ICONS: Record<keyof PlanFeatures, React.ComponentType<any>> = {
  // Core Features
  posEnabled: ShoppingCart,
  loyaltyPrograms: Star,

  // Marketing & Communication
  emailMarketing: Mail,
  smsMarketing: MessageSquare,
  whatsappMarketing: Send,
  campaigns: Megaphone,
  emailAutomations: Zap,

  // Customer Engagement
  coupons: Tag,
  giftCards: Gift,
  giftCertificates: Receipt,
  subscriptions: Repeat,
  referralProgram: Users,

  // Gaming & Lottery
  gamingLottery: Ticket,
  slotMachine: Dice5,
  scratchCards: Sparkles,

  // Advanced Features
  nfcCards: CreditCard,
  advancedAnalytics: BarChart3,
  automations: Zap,
  publicWebsite: Globe,
  websiteBuilder: Code,
  mobileApp: Smartphone,

  // Business Management
  multiLocation: Building2,
  teamManagement: Users,
  categoriesManagement: Layers,
  channelsManagement: Hash,
  inventoryManagement: Package,

  // Customization & Integration
  customBranding: Palette,
  customDomain: Globe,
  apiAccess: Code,
  webhooks: Webhook,

  // Support & Services
  prioritySupport: Headphones,
  dedicatedAccountManager: UserCog,
  supportTickets: MessageCircle,
  contactMessages: Mail
}

const FEATURE_LABELS: Record<keyof PlanFeatures, string> = {
  // Core Features
  posEnabled: 'Sistema POS',
  loyaltyPrograms: 'Programmi Fedeltà',

  // Marketing & Communication
  emailMarketing: 'Email Marketing',
  smsMarketing: 'SMS Marketing',
  whatsappMarketing: 'WhatsApp Marketing',
  campaigns: 'Campagne Marketing',
  emailAutomations: 'Automazioni Email',

  // Customer Engagement
  coupons: 'Coupon e Sconti',
  giftCards: 'Gift Cards',
  giftCertificates: 'Buoni Regalo',
  subscriptions: 'Abbonamenti Clienti',
  referralProgram: 'Programma Referral',

  // Gaming & Lottery
  gamingLottery: 'Lotteria e Estrazioni',
  slotMachine: 'Slot Machine',
  scratchCards: 'Gratta e Vinci',

  // Advanced Features
  nfcCards: 'Carte NFC',
  advancedAnalytics: 'Analytics Avanzate',
  automations: 'Automazioni',
  publicWebsite: 'Sito Web Pubblico',
  websiteBuilder: 'Website Builder',
  mobileApp: 'App Mobile',

  // Business Management
  multiLocation: 'Multi-Location',
  teamManagement: 'Gestione Team',
  categoriesManagement: 'Gestione Categorie',
  channelsManagement: 'Gestione Canali',
  inventoryManagement: 'Gestione Inventario',

  // Customization & Integration
  customBranding: 'Branding Personalizzato',
  customDomain: 'Dominio Personalizzato',
  apiAccess: 'Accesso API',
  webhooks: 'Webhooks',

  // Support & Services
  prioritySupport: 'Supporto Prioritario',
  dedicatedAccountManager: 'Account Manager Dedicato',
  supportTickets: 'Sistema Ticket',
  contactMessages: 'Messaggi Contatto'
}

const LIMIT_LABELS: Record<keyof PlanLimits, string> = {
  // Customer & Team Limits
  maxCustomers: 'Max Clienti',
  maxTeamMembers: 'Max Membri Team',
  maxLocations: 'Max Sedi',

  // Marketing Limits
  maxEmailsPerMonth: 'Max Email/Mese',
  maxSMSPerMonth: 'Max SMS/Mese',
  maxWhatsAppPerMonth: 'Max WhatsApp/Mese',
  maxCampaigns: 'Max Campagne Attive',
  maxEmailAutomations: 'Max Automazioni Email',

  // Engagement Limits
  maxActiveCoupons: 'Max Coupon Attivi',
  maxActiveGiftCards: 'Max Gift Card Attive',
  maxActiveGiftCertificates: 'Max Buoni Regalo Attivi',
  maxSubscriptionPlans: 'Max Piani Abbonamento',
  maxReferralRewards: 'Max Premi Referral',

  // Gaming Limits
  maxLotteryDrawsPerMonth: 'Max Estrazioni/Mese',
  maxSlotMachineSpins: 'Max Spin Slot Machine',
  maxScratchCardsPerMonth: 'Max Gratta&Vinci/Mese',

  // NFC & Cards
  maxNFCCards: 'Max Carte NFC',
  maxVirtualCards: 'Max Carte Virtuali',

  // Automation & Workflows
  maxAutomations: 'Max Automazioni',
  maxWorkflows: 'Max Workflows',
  maxWebhooks: 'Max Webhooks',

  // Content & Analytics
  maxLoyaltyPrograms: 'Max Programmi Fedeltà',
  maxNotifications: 'Max Notifiche/Mese',
  maxCategories: 'Max Categorie',
  maxProductsPerCategory: 'Max Prodotti per Categoria',

  // Storage & Data
  maxStorageGB: 'Max Storage (GB)',
  maxAPICallsPerDay: 'Max Chiamate API/Giorno',
  maxReportsPerMonth: 'Max Report/Mese'
}

const AdminPlansManager: React.FC = () => {
  const { showSuccess, showError } = useToast()
  const [plans, setPlans] = useState<OmnilyProPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<OmnilyProPlan | null>(null)
  const [saving, setSaving] = useState(false)
  const [expandedFeatures, setExpandedFeatures] = useState<Record<string, boolean>>({})

  useEffect(() => {
    loadPlans()
  }, [])

  const loadPlans = async () => {
    try {
      setLoading(true)
      const data = await omnilyProPlansService.getAllPlans()
      setPlans(data)
    } catch (error: any) {
      showError('Errore caricamento piani', error.message)
    } finally {
      setLoading(false)
    }
  }

  const startEditing = (plan: OmnilyProPlan) => {
    setEditingPlanId(plan.id)
    setEditForm(JSON.parse(JSON.stringify(plan))) // Deep copy
  }

  const handleSave = async () => {
    if (!editForm) return

    try {
      setSaving(true)
      await omnilyProPlansService.updatePlan(editForm.id, editForm)
      await loadPlans()
      showSuccess('Piano salvato', `Il piano ${editForm.name} è stato aggiornato con successo`)
    } catch (error: any) {
      showError('Errore salvataggio', error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!editForm) return

    if (!confirm(`Sei sicuro di voler eliminare definitivamente il piano "${editForm.name}"?`)) {
      return
    }

    try {
      await omnilyProPlansService.deletePlan(editForm.id)
      await loadPlans()
      setEditingPlanId(null)
      setEditForm(null)
      showSuccess('Piano eliminato', `Il piano ${editForm.name} è stato eliminato`)
    } catch (error: any) {
      showError('Errore eliminazione', error.message)
    }
  }

  const handleAddPlan = async () => {
    const timestamp = Date.now()
    const newPlan: Partial<OmnilyProPlan> = {
      name: `Nuovo Piano ${timestamp}`,
      slug: `new-plan-${timestamp}`,
      description: 'Descrizione del nuovo piano',
      price_monthly: 0,
      price_yearly: 0,
      setup_fee: 0,
      currency: 'EUR',
      color: '#3b82f6',
      is_popular: false,
      is_featured: false,
      is_active: true,
      visibility: 'public',
      sort_order: plans.length + 1,
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
        maxCustomers: 100,
        maxTeamMembers: 1,
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
        maxNotifications: 100,
        maxCategories: 0,
        maxProductsPerCategory: 0,

        // Storage & Data
        maxStorageGB: 1,
        maxAPICallsPerDay: 0,
        maxReportsPerMonth: 0
      }
    }

    try {
      const created = await omnilyProPlansService.createPlan(newPlan)
      await loadPlans()
      startEditing(created)
      showSuccess('Piano creato', 'Nuovo piano creato con successo')
    } catch (error: any) {
      showError('Errore creazione', error.message)
    }
  }

  const updateFeature = (featureName: keyof PlanFeatures, value: boolean) => {
    if (!editForm) return
    setEditForm({
      ...editForm,
      features: {
        ...editForm.features,
        [featureName]: value
      }
    })
  }

  const updateLimit = (limitName: keyof PlanLimits, value: number | null) => {
    if (!editForm) return
    setEditForm({
      ...editForm,
      limits: {
        ...editForm.limits,
        [limitName]: value
      }
    })
  }

  if (loading) {
    return <PageLoader message="Caricamento piani..." />
  }

  return (
    <div className="admin-plans-manager">
      <div className="plans-manager-header">
        <div>
          <h2 className="plans-manager-title">
            <Settings className="title-icon" />
            Gestione Piani OMNILYPRO
          </h2>
          <p className="plans-manager-subtitle">
            Crea, modifica e gestisci i piani di abbonamento della piattaforma
          </p>
        </div>
      </div>

      {/* Pulsante per aggiornare i piani con tutte le features */}
      <SeedPlansButton />

      <div className="plans-manager-content">
        {/* Sidebar List */}
        <div className="plans-sidebar">
          <button onClick={handleAddPlan} className="add-plan-button">
            <Plus className="button-icon" />
            Aggiungi Nuovo Piano
          </button>

          {plans.map((plan) => (
            <button
              key={plan.id}
              onClick={() => startEditing(plan)}
              className={`plan-item ${editingPlanId === plan.id ? 'active' : ''}`}
              style={{
                borderColor: editingPlanId === plan.id ? plan.color : undefined,
                backgroundColor: editingPlanId === plan.id ? `${plan.color}10` : undefined
              }}
            >
              <div className="plan-item-header">
                <div className="plan-color-dot" style={{ backgroundColor: plan.color }} />
                <div>
                  <div className="plan-item-name">{plan.name}</div>
                  <div className="plan-item-price">€{plan.price_monthly}/mese</div>
                </div>
              </div>
              <div className="plan-item-badges">
                {plan.badge_text && <Star className="badge-icon popular" />}
                {!plan.is_active && <EyeOff className="badge-icon inactive" />}
              </div>
            </button>
          ))}
        </div>

        {/* Editor Area */}
        <div className="plans-editor">
          {editForm ? (
            <div className="editor-card">
              <div
                className="editor-header"
                style={{ backgroundColor: editForm.color }}
              >
                <h3>Modifica {editForm.name}</h3>
                <div className="editor-actions">
                  <button onClick={handleDelete} className="delete-button">
                    <Trash2 className="button-icon" />
                  </button>
                  <button onClick={handleSave} disabled={saving} className="save-button">
                    <Save className="button-icon" />
                    {saving ? 'Salvataggio...' : 'Salva'}
                  </button>
                </div>
              </div>

              <div className="editor-body">
                {/* Basic Info */}
                <section className="editor-section">
                  <h4 className="section-title">Informazioni Base</h4>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Nome Piano</label>
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <label>Slug</label>
                      <input
                        type="text"
                        value={editForm.slug}
                        onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })}
                        className="form-input"
                      />
                    </div>
                    <div className="form-group full-width">
                      <label>Descrizione</label>
                      <input
                        type="text"
                        value={editForm.description || ''}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        className="form-input"
                      />
                    </div>
                  </div>
                </section>

                {/* Pricing */}
                <section className="editor-section">
                  <h4 className="section-title">
                    <DollarSign className="section-icon" />
                    Prezzi
                  </h4>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Prezzo Mensile (€)</label>
                      <input
                        type="number"
                        value={editForm.price_monthly}
                        onChange={(e) => setEditForm({ ...editForm, price_monthly: parseFloat(e.target.value) || 0 })}
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <label>Prezzo Annuale (€)</label>
                      <input
                        type="number"
                        value={editForm.price_yearly}
                        onChange={(e) => setEditForm({ ...editForm, price_yearly: parseFloat(e.target.value) || 0 })}
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <label>Setup Fee (€)</label>
                      <input
                        type="number"
                        value={editForm.setup_fee}
                        onChange={(e) => setEditForm({ ...editForm, setup_fee: parseFloat(e.target.value) || 0 })}
                        className="form-input"
                      />
                    </div>
                  </div>
                </section>

                {/* Color & Badge */}
                <section className="editor-section">
                  <h4 className="section-title">
                    <Palette className="section-icon" />
                    Colore & Badge
                  </h4>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 500, color: '#475569', marginBottom: '0.375rem' }}>
                        Colore Piano
                      </label>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <input
                          type="color"
                          value={editForm.color}
                          onChange={(e) => setEditForm({ ...editForm, color: e.target.value })}
                          style={{
                            width: '60px',
                            height: '36px',
                            border: '1px solid #e2e8f0',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        />
                        <input
                          type="text"
                          value={editForm.color}
                          onChange={(e) => setEditForm({ ...editForm, color: e.target.value })}
                          className="form-input"
                          placeholder="#000000"
                          style={{ flex: 1, maxWidth: '120px', textTransform: 'uppercase' }}
                        />
                      </div>
                      <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                        {PRESET_COLORS.map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setEditForm({ ...editForm, color })}
                            style={{
                              width: '20px',
                              height: '20px',
                              borderRadius: '3px',
                              border: editForm.color === color ? '2px solid #1e293b' : '1px solid #e2e8f0',
                              backgroundColor: color,
                              cursor: 'pointer',
                              padding: 0
                            }}
                            title={color}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="form-group" style={{ marginTop: '0.75rem' }}>
                    <label>Badge Text (es. "Più Popolare")</label>
                    <input
                      type="text"
                      value={editForm.badge_text || ''}
                      onChange={(e) => setEditForm({ ...editForm, badge_text: e.target.value })}
                      className="form-input"
                      placeholder="Lascia vuoto per nessun badge"
                    />
                  </div>
                  <div className="checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={editForm.is_popular}
                        onChange={(e) => setEditForm({ ...editForm, is_popular: e.target.checked })}
                      />
                      <span>Piano Popolare</span>
                    </label>
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={editForm.is_active}
                        onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                      />
                      <span>Piano Attivo</span>
                    </label>
                  </div>
                </section>

                {/* Features & Limits - Card Espandibili */}
                <section className="editor-section">
                  <h4 className="section-title">Funzionalità e Limiti</h4>
                  <p className="section-description">Clicca su una card per configurare i limiti</p>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: '0.75rem'
                  }}>
                    {(Object.keys(editForm.features) as Array<keyof PlanFeatures>).map((featureName) => {
                      const associatedLimits = getFeatureLimits(featureName)
                      const isEnabled = editForm.features[featureName]
                      const isExpanded = expandedFeatures[featureName] || false
                      const FeatureIcon = FEATURE_ICONS[featureName]

                      return (
                        <div
                          key={featureName}
                          style={{
                            border: `2px solid ${isEnabled ? '#3b82f6' : '#e2e8f0'}`,
                            borderRadius: '8px',
                            overflow: 'hidden',
                            transition: 'all 0.2s ease',
                            background: isEnabled ? 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)' : '#fff',
                            boxShadow: isEnabled ? '0 4px 6px rgba(59, 130, 246, 0.1)' : 'none'
                          }}
                        >
                          {/* Header della Card */}
                          <div
                            onClick={() => {
                              if (isEnabled && associatedLimits.length > 0) {
                                setExpandedFeatures(prev => ({
                                  ...prev,
                                  [featureName]: !prev[featureName]
                                }))
                              }
                            }}
                            style={{
                              padding: '0.875rem',
                              cursor: isEnabled && associatedLimits.length > 0 ? 'pointer' : 'default',
                              background: isEnabled ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
                              borderBottom: isExpanded ? '1px solid #e2e8f0' : 'none',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between'
                            }}
                          >
                            <label
                              className="feature-checkbox"
                              style={{
                                margin: 0,
                                flex: 1,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <input
                                type="checkbox"
                                checked={isEnabled}
                                onChange={(e) => {
                                  updateFeature(featureName, e.target.checked)
                                  if (!e.target.checked) {
                                    setExpandedFeatures(prev => ({
                                      ...prev,
                                      [featureName]: false
                                    }))
                                  }
                                }}
                                style={{ cursor: 'pointer' }}
                              />
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.25rem 0.5rem',
                                borderRadius: '6px',
                                background: isEnabled ? 'rgba(59, 130, 246, 0.1)' : 'rgba(148, 163, 184, 0.1)'
                              }}>
                                <FeatureIcon
                                  size={18}
                                  style={{
                                    color: isEnabled ? '#3b82f6' : '#94a3b8',
                                    flexShrink: 0
                                  }}
                                />
                                <span style={{
                                  fontWeight: 600,
                                  fontSize: '0.875rem',
                                  color: isEnabled ? '#1e40af' : '#64748b'
                                }}>
                                  {FEATURE_LABELS[featureName]}
                                </span>
                              </div>
                            </label>

                            {/* Indicatore espandibile */}
                            {isEnabled && associatedLimits.length > 0 && (
                              <div style={{
                                fontSize: '0.7rem',
                                color: '#64748b',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                fontWeight: 500
                              }}>
                                <span>{associatedLimits.length} limiti</span>
                                <span style={{
                                  transition: 'transform 0.2s',
                                  transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
                                }}>
                                  ▼
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Limiti Espandibili */}
                          {isEnabled && associatedLimits.length > 0 && isExpanded && (
                            <div style={{
                              padding: '0.75rem',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '0.625rem',
                              background: '#fff'
                            }}>
                              {associatedLimits.map((limitName) => (
                                <div key={limitName} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                  <label style={{
                                    fontSize: '0.7rem',
                                    color: '#475569',
                                    fontWeight: 600,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.025em'
                                  }}>
                                    {LIMIT_LABELS[limitName]}
                                  </label>
                                  <input
                                    type="number"
                                    value={editForm.limits[limitName] || ''}
                                    onChange={(e) => {
                                      const value = e.target.value === '' ? null : parseInt(e.target.value)
                                      updateLimit(limitName, value)
                                    }}
                                    className="form-input"
                                    placeholder="∞ Illimitato"
                                    style={{
                                      fontSize: '0.875rem',
                                      padding: '0.5rem',
                                      borderColor: '#cbd5e1',
                                      borderRadius: '4px'
                                    }}
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </section>

                {/* Limiti Generali (non legati a features specifiche) */}
                <section className="editor-section">
                  <h4 className="section-title">Limiti Generali</h4>
                  <p className="section-description">Limiti che si applicano a tutto il piano</p>
                  <div className="limits-grid">
                    {/* Solo limiti non associati a features specifiche */}
                    {(Object.keys(editForm.limits) as Array<keyof PlanLimits>)
                      .filter(limitName => {
                        // Trova se questo limite è associato a qualche feature
                        const isAssociated = (Object.keys(editForm.features) as Array<keyof PlanFeatures>)
                          .some(featureName => getFeatureLimits(featureName).includes(limitName))
                        return !isAssociated
                      })
                      .map((limitName) => (
                        <div key={limitName} className="form-group">
                          <label>{LIMIT_LABELS[limitName]}</label>
                          <input
                            type="number"
                            value={editForm.limits[limitName] || ''}
                            onChange={(e) => {
                              const value = e.target.value === '' ? null : parseInt(e.target.value)
                              updateLimit(limitName, value)
                            }}
                            className="form-input"
                            placeholder="Illimitato"
                          />
                        </div>
                      ))}
                  </div>
                </section>
              </div>
            </div>
          ) : (
            <div className="editor-empty">
              <Settings className="empty-icon" />
              <p>Seleziona un piano per modificarlo o creane uno nuovo</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminPlansManager
