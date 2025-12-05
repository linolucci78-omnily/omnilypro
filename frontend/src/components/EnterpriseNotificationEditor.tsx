import { useState, useEffect } from 'react'
import {
  Bell,
  Send,
  Clock,
  Users,
  Target,
  Image as ImageIcon,
  Link2,
  Sparkles,
  TestTube,
  Calendar,
  Globe,
  Smartphone,
  Monitor,
  BarChart3,
  Settings,
  ChevronDown,
  Plus,
  X,
  Eye,
  Save,
  Play,
  Pause,
  Zap,
  Mail,
  MessageSquare,
  Activity,
  Moon,
  Star,
  Gem,
  Crown,
  AlertTriangle,
  TrendingUp
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import './EnterpriseNotificationEditor.css'

// =====================================================
// Types
// =====================================================
interface NotificationCampaign {
  id?: string
  name: string
  type: 'push' | 'multi-channel'
  channels: ('push' | 'email' | 'sms')[]

  // Content
  title: string
  body: string
  subtitle?: string
  imageUrl?: string
  icon?: string
  deepLink?: string
  actionButtons?: Array<{
    id: string
    text: string
    action: string
  }>

  // Personalization
  variables: Record<string, string>
  dynamicContent: boolean

  // Targeting
  segments: string[]
  filters: Filter[]
  excludeSegments: string[]

  // Scheduling
  deliveryType: 'immediate' | 'scheduled' | 'intelligent'
  scheduledTime?: Date
  timezone?: string
  optimizeDeliveryTime: boolean

  // A/B Testing
  abTest: {
    enabled: boolean
    variants: Variant[]
    testDuration: number
    winnerMetric: 'opens' | 'clicks' | 'conversions'
  }

  // Advanced
  ttl: number // Time to live in seconds
  priority: 'normal' | 'high'
  sound?: string
  badge?: number
  collapseKey?: string

  // Analytics
  trackOpens: boolean
  trackClicks: boolean
  conversionGoal?: string
}

interface Filter {
  id: string
  type: 'demographic' | 'behavioral' | 'location' | 'engagement' | 'custom'
  field: string
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'in' | 'between'
  value: any
}

interface Variant {
  id: string
  name: string
  title: string
  body: string
  imageUrl?: string
  traffic: number // percentage
}

interface EnterpriseNotificationEditorProps {
  organizationId: string
  mode?: 'notification' | 'template' // notification = invia ora/programma/salva bozza, template = salva template
  onSend?: (campaign: NotificationCampaign) => void
  onSchedule?: (campaign: NotificationCampaign) => void
  onSaveDraft?: (campaign: NotificationCampaign) => void
  onSaveTemplate?: (template: NotificationCampaign) => void
  initialData?: {
    name?: string
    title: string
    body: string
    subtitle?: string
    imageUrl?: string
    deepLink?: string
    channels?: string[]
    segments?: string[]
    filters?: any[]
    deliveryType?: string
    scheduledTime?: Date | null
  } | null
}

// =====================================================
// Main Component
// =====================================================
export default function EnterpriseNotificationEditor({
  organizationId,
  mode = 'notification',
  onSend,
  onSchedule,
  onSaveDraft,
  onSaveTemplate,
  initialData
}: EnterpriseNotificationEditorProps) {
  const [activeSection, setActiveSection] = useState<'compose' | 'audience' | 'schedule' | 'test' | 'preview'>('compose')
  const [loyaltyTiers, setLoyaltyTiers] = useState<any[]>([])
  const [loadingTiers, setLoadingTiers] = useState(true)
  const [organization, setOrganization] = useState<any>(null)

  // Campaign state
  const [campaign, setCampaign] = useState<NotificationCampaign>({
    name: '',
    type: 'push',
    channels: ['push'],
    title: '',
    body: '',
    segments: ['all'],
    filters: [],
    excludeSegments: [],
    deliveryType: 'immediate',
    optimizeDeliveryTime: false,
    variables: {},
    dynamicContent: false,
    abTest: {
      enabled: false,
      variants: [],
      testDuration: 24,
      winnerMetric: 'opens'
    },
    ttl: 86400,
    priority: 'normal',
    trackOpens: true,
    trackClicks: true,
    actionButtons: []
  })

  const [previewDevice, setPreviewDevice] = useState<'ios' | 'android' | 'web'>('ios')
  const [estimatedReach, setEstimatedReach] = useState(0)
  const [showAdvanced, setShowAdvanced] = useState(false)

  // =====================================================
  // Load initial data when provided
  // =====================================================
  useEffect(() => {
    if (initialData) {
      console.log('[EnterpriseNotificationEditor] Loading initial data:', initialData)
      setCampaign(prev => ({
        ...prev,
        name: initialData.name || '',
        title: initialData.title || '',
        body: initialData.body || '',
        subtitle: initialData.subtitle,
        imageUrl: initialData.imageUrl,
        deepLink: initialData.deepLink,
        channels: (initialData.channels as any) || ['push'],
        segments: initialData.segments || ['all'],
        filters: initialData.filters || [],
        deliveryType: (initialData.deliveryType as any) || 'immediate',
        scheduledTime: initialData.scheduledTime || undefined
      }))
    }
  }, [initialData])

  // =====================================================
  // Load organization data (logo, name, tiers)
  // =====================================================
  useEffect(() => {
    const loadOrganizationData = async () => {
      try {
        const { data: org, error } = await supabase
          .from('organizations')
          .select('id, name, logo_url, loyalty_tiers')
          .eq('id', organizationId)
          .single()

        if (error) throw error

        if (org) {
          console.log('[EnterpriseNotificationEditor] Organization loaded:', {
            name: org.name,
            logo_url: org.logo_url,
            has_tiers: org.loyalty_tiers?.length || 0
          })
          setOrganization(org)
          if (org.loyalty_tiers && Array.isArray(org.loyalty_tiers)) {
            setLoyaltyTiers(org.loyalty_tiers)
          }
        }
      } catch (error) {
        console.error('[EnterpriseNotificationEditor] Error loading organization data:', error)
      } finally {
        setLoadingTiers(false)
      }
    }

    loadOrganizationData()
  }, [organizationId])

  // =====================================================
  // Handlers
  // =====================================================
  const updateCampaign = (updates: Partial<NotificationCampaign>) => {
    setCampaign(prev => ({ ...prev, ...updates }))
  }

  const addActionButton = () => {
    const newButton = {
      id: `btn_${Date.now()}`,
      text: 'Azione',
      action: ''
    }
    updateCampaign({
      actionButtons: [...(campaign.actionButtons || []), newButton]
    })
  }

  const removeActionButton = (id: string) => {
    updateCampaign({
      actionButtons: campaign.actionButtons?.filter(btn => btn.id !== id)
    })
  }

  const addFilter = () => {
    const newFilter: Filter = {
      id: `filter_${Date.now()}`,
      type: 'demographic',
      field: 'age',
      operator: 'greater_than',
      value: 18
    }
    updateCampaign({
      filters: [...campaign.filters, newFilter]
    })
  }

  const removeFilter = (id: string) => {
    updateCampaign({
      filters: campaign.filters.filter(f => f.id !== id)
    })
  }

  const addABVariant = () => {
    const newVariant: Variant = {
      id: `variant_${Date.now()}`,
      name: `Variante ${campaign.abTest.variants.length + 1}`,
      title: campaign.title,
      body: campaign.body,
      traffic: 50
    }
    updateCampaign({
      abTest: {
        ...campaign.abTest,
        variants: [...campaign.abTest.variants, newVariant]
      }
    })
  }

  // Calculate estimated reach based on segments and filters
  useEffect(() => {
    const calculateReach = async () => {
      try {
        // Get total customers count
        const { count: totalCustomers, error } = await supabase
          .from('customers')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', organizationId)

        if (error) throw error

        let reach = totalCustomers || 1000 // fallback to 1000 if no customers

        // If specific segments are selected (not "all")
        if (!campaign.segments.includes('all') && campaign.segments.length > 0) {
          // Check if tier segments are selected
          const tierSegments = campaign.segments.filter(s => s.startsWith('tier_'))

          if (tierSegments.length > 0) {
            // Calculate reach for specific tiers
            let tierReach = 0
            for (const tierSegment of tierSegments) {
              // Parse tier segment: "tier_0_bronze" -> extract index
              const parts = tierSegment.split('_')
              if (parts.length >= 3) {
                const tierIndex = parseInt(parts[1])
                const tier = loyaltyTiers[tierIndex]

                if (tier) {
                  const minPoints = parseInt(tier.threshold) || 0
                  const maxPoints = tier.maxThreshold ? parseInt(tier.maxThreshold) : 999999999

                  const { count, error: tierError } = await supabase
                    .from('customers')
                    .select('*', { count: 'exact', head: true })
                    .eq('organization_id', organizationId)
                    .gte('points', minPoints)
                    .lte('points', maxPoints)

                  if (!tierError) {
                    tierReach += count || 0
                  }
                }
              }
            }
            reach = tierReach
          } else {
            // For other segment types, use multipliers
            if (campaign.segments.includes('active')) {
              reach = Math.floor(reach * 0.6) // 60% active users
            } else if (campaign.segments.includes('inactive')) {
              reach = Math.floor(reach * 0.3) // 30% inactive
            } else if (campaign.segments.includes('new_users')) {
              reach = Math.floor(reach * 0.15) // 15% new users
            } else if (campaign.segments.includes('high_spenders')) {
              reach = Math.floor(reach * 0.1) // 10% high spenders
            } else if (campaign.segments.includes('at_risk')) {
              reach = Math.floor(reach * 0.2) // 20% at risk
            }
          }
        }

        // Apply filter multipliers
        campaign.filters.forEach(filter => {
          reach = Math.floor(reach * 0.8)
        })

        setEstimatedReach(reach)
      } catch (error) {
        console.error('Error calculating reach:', error)
        setEstimatedReach(1000) // fallback
      }
    }

    if (!loadingTiers) {
      calculateReach()
    }
  }, [campaign.segments, campaign.filters, organizationId, loyaltyTiers, loadingTiers])

  // =====================================================
  // Render Sections
  // =====================================================
  const renderComposeSection = () => (
    <div className="space-y-6">
      {/* Campaign Name */}
      <div>
        <label className="enterprise-label">
          Nome Campagna *
        </label>
        <input
          type="text"
          value={campaign.name}
          onChange={(e) => updateCampaign({ name: e.target.value })}
          placeholder="Es: Black Friday 2024 - Early Access"
          className="enterprise-input"
        />
      </div>

      {/* Channel Selection */}
      <div>
        <label className="enterprise-label">
          Canali di Comunicazione
        </label>
        <div className="flex gap-3">
          {(['push', 'email', 'sms'] as const).map(channel => (
            <button
              key={channel}
              onClick={() => {
                const channels = campaign.channels.includes(channel)
                  ? campaign.channels.filter(c => c !== channel)
                  : [...campaign.channels, channel]
                updateCampaign({ channels, type: channels.length > 1 ? 'multi-channel' : 'push' })
              }}
              className={`channel-button ${campaign.channels.includes(channel) ? 'active' : ''}`}
            >
              {channel === 'push' && <Bell className="w-4 h-4" />}
              {channel === 'email' && <Mail className="w-4 h-4" />}
              {channel === 'sms' && <MessageSquare className="w-4 h-4" />}
              <span className="capitalize">{channel}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Title */}
      <div>
        <label className="enterprise-label">
          Titolo *
          <span className="text-xs text-gray-500 ml-2">
            ({campaign.title.length}/65 caratteri)
          </span>
        </label>
        <input
          type="text"
          value={campaign.title}
          onChange={(e) => updateCampaign({ title: e.target.value })}
          placeholder="Es: Sconto Esclusivo del 50%"
          maxLength={65}
          className="enterprise-input"
        />
      </div>

      {/* Subtitle (iOS only) */}
      <div>
        <label className="enterprise-label">
          Sottotitolo (iOS)
          <span className="text-xs text-gray-500 ml-2">Opzionale</span>
        </label>
        <input
          type="text"
          value={campaign.subtitle || ''}
          onChange={(e) => updateCampaign({ subtitle: e.target.value })}
          placeholder="Es: Solo per i membri Gold"
          className="enterprise-input"
        />
      </div>

      {/* Body */}
      <div>
        <label className="enterprise-label">
          Messaggio *
          <span className="text-xs text-gray-500 ml-2">
            ({campaign.body.length}/178 caratteri)
          </span>
        </label>
        <textarea
          value={campaign.body}
          onChange={(e) => updateCampaign({ body: e.target.value })}
          placeholder="Es: Approfitta ora dello sconto del 50% su tutti i prodotti. Offerta valida solo per 24 ore!"
          maxLength={178}
          rows={4}
          className="enterprise-input resize-none"
        />
      </div>

      {/* Dynamic Content Toggle */}
      <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-blue-600" />
          <div>
            <p className="font-semibold text-sm text-gray-900">Contenuto Dinamico</p>
            <p className="text-xs text-gray-600">Personalizza con variabili come {'{'}first_name{'}'}, {'{'}points{'}'}</p>
          </div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={campaign.dynamicContent}
            onChange={(e) => updateCampaign({ dynamicContent: e.target.checked })}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>

      {/* Rich Media */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="enterprise-label">
            <ImageIcon className="w-4 h-4 inline mr-1" />
            URL Immagine
          </label>
          <input
            type="url"
            value={campaign.imageUrl || ''}
            onChange={(e) => updateCampaign({ imageUrl: e.target.value })}
            placeholder="https://..."
            className="enterprise-input"
          />
        </div>

        <div>
          <label className="enterprise-label">
            <Link2 className="w-4 h-4 inline mr-1" />
            Deep Link / URL
          </label>
          <input
            type="text"
            value={campaign.deepLink || ''}
            onChange={(e) => updateCampaign({ deepLink: e.target.value })}
            placeholder="myapp://promo/blackfriday"
            className="enterprise-input"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="enterprise-label mb-0">
            Pulsanti di Azione
            <span className="text-xs text-gray-500 ml-2">Max 3 pulsanti</span>
          </label>
          <button
            onClick={addActionButton}
            disabled={(campaign.actionButtons?.length || 0) >= 3}
            className="text-sm px-3 py-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            Aggiungi
          </button>
        </div>

        <div className="space-y-2">
          {campaign.actionButtons?.map(button => (
            <div key={button.id} className="flex gap-2">
              <input
                type="text"
                value={button.text}
                onChange={(e) => {
                  const updated = campaign.actionButtons?.map(btn =>
                    btn.id === button.id ? { ...btn, text: e.target.value } : btn
                  )
                  updateCampaign({ actionButtons: updated })
                }}
                placeholder="Testo pulsante"
                className="enterprise-input flex-1"
              />
              <input
                type="text"
                value={button.action}
                onChange={(e) => {
                  const updated = campaign.actionButtons?.map(btn =>
                    btn.id === button.id ? { ...btn, action: e.target.value } : btn
                  )
                  updateCampaign({ actionButtons: updated })
                }}
                placeholder="Azione (URL o deep link)"
                className="enterprise-input flex-1"
              />
              <button
                onClick={() => removeActionButton(button.id)}
                className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Advanced Settings */}
      <div className="border-t pt-4">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900"
        >
          <Settings className="w-4 h-4" />
          Impostazioni Avanzate
          <ChevronDown className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
        </button>

        {showAdvanced && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="enterprise-label">Priorità</label>
              <select
                value={campaign.priority}
                onChange={(e) => updateCampaign({ priority: e.target.value as any })}
                className="enterprise-input"
              >
                <option value="normal">Normale</option>
                <option value="high">Alta</option>
              </select>
            </div>

            <div>
              <label className="enterprise-label">TTL (secondi)</label>
              <input
                type="number"
                value={campaign.ttl}
                onChange={(e) => updateCampaign({ ttl: parseInt(e.target.value) })}
                className="enterprise-input"
              />
            </div>

            <div>
              <label className="enterprise-label">Badge Count</label>
              <input
                type="number"
                value={campaign.badge || 0}
                onChange={(e) => updateCampaign({ badge: parseInt(e.target.value) })}
                className="enterprise-input"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )

  const renderAudienceSection = () => (
    <div className="space-y-6">
      {/* Estimated Reach */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 border border-purple-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-600">Reach Stimato</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">
              {estimatedReach.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-1">utenti riceveranno questa notifica</p>
          </div>
          <Users className="w-12 h-12 text-purple-400" />
        </div>
      </div>

      {/* Predefined Segments */}
      <div>
        <label className="enterprise-label">
          Segmenti Predefiniti
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { id: 'all', label: 'Tutti i Clienti', IconComponent: Users },
            { id: 'active', label: 'Utenti Attivi', IconComponent: Activity },
            { id: 'inactive', label: 'Utenti Inattivi', IconComponent: Moon },
            ...loyaltyTiers.map((tier, index) => ({
              id: `tier_${index}_${tier.name.toLowerCase().replace(/\s+/g, '_')}`,
              label: `Tier ${tier.name}`,
              IconComponent: [Star, Sparkles, Gem, Crown, TrendingUp][index] || Star,
              tierData: tier // Store tier data for reach calculation
            })),
            { id: 'new_users', label: 'Nuovi Utenti', IconComponent: Sparkles },
            { id: 'high_spenders', label: 'Top Spenders', IconComponent: Gem },
            { id: 'at_risk', label: 'A Rischio', IconComponent: AlertTriangle }
          ].map(segment => {
            const Icon = segment.IconComponent
            return (
              <button
                key={segment.id}
                onClick={() => {
                  const segments = campaign.segments.includes(segment.id)
                    ? campaign.segments.filter(s => s !== segment.id)
                    : [...campaign.segments.filter(s => s !== 'all'), segment.id]
                  updateCampaign({ segments: segments.length ? segments : ['all'] })
                }}
                className={`segment-button ${campaign.segments.includes(segment.id) ? 'active' : ''}`}
              >
                <Icon className="w-8 h-8" />
                <span className="text-xs font-semibold">{segment.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Advanced Filters */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="enterprise-label mb-0">
            Filtri Avanzati
          </label>
          <button
            onClick={addFilter}
            className="text-sm px-3 py-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            Aggiungi Filtro
          </button>
        </div>

        <div className="space-y-3">
          {campaign.filters.map(filter => (
            <div key={filter.id} className="flex gap-2 items-start p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-2">
                <select
                  value={filter.type}
                  onChange={(e) => {
                    const updated = campaign.filters.map(f =>
                      f.id === filter.id ? { ...f, type: e.target.value as any } : f
                    )
                    updateCampaign({ filters: updated })
                  }}
                  className="enterprise-input"
                >
                  <option value="demographic">Demografico</option>
                  <option value="behavioral">Comportamento</option>
                  <option value="location">Posizione</option>
                  <option value="engagement">Engagement</option>
                  <option value="custom">Personalizzato</option>
                </select>

                <input
                  type="text"
                  value={filter.field}
                  onChange={(e) => {
                    const updated = campaign.filters.map(f =>
                      f.id === filter.id ? { ...f, field: e.target.value } : f
                    )
                    updateCampaign({ filters: updated })
                  }}
                  placeholder="Campo"
                  className="enterprise-input"
                />

                <select
                  value={filter.operator}
                  onChange={(e) => {
                    const updated = campaign.filters.map(f =>
                      f.id === filter.id ? { ...f, operator: e.target.value as any } : f
                    )
                    updateCampaign({ filters: updated })
                  }}
                  className="enterprise-input"
                >
                  <option value="equals">uguale a</option>
                  <option value="not_equals">diverso da</option>
                  <option value="greater_than">maggiore di</option>
                  <option value="less_than">minore di</option>
                  <option value="contains">contiene</option>
                  <option value="in">in</option>
                  <option value="between">tra</option>
                </select>

                <input
                  type="text"
                  value={filter.value}
                  onChange={(e) => {
                    const updated = campaign.filters.map(f =>
                      f.id === filter.id ? { ...f, value: e.target.value } : f
                    )
                    updateCampaign({ filters: updated })
                  }}
                  placeholder="Valore"
                  className="enterprise-input"
                />
              </div>

              <button
                onClick={() => removeFilter(filter.id)}
                className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Exclusions */}
      <div>
        <label className="enterprise-label">
          Escludi Segmenti
          <span className="text-xs text-gray-500 ml-2">Utenti da non targetizzare</span>
        </label>
        <select
          multiple
          value={campaign.excludeSegments}
          onChange={(e) => {
            const selected = Array.from(e.target.selectedOptions, option => option.value)
            updateCampaign({ excludeSegments: selected })
          }}
          className="enterprise-input"
          size={4}
        >
          <option value="unsubscribed">Disiscritti</option>
          <option value="opted_out">Opt-out Marketing</option>
          <option value="recent_purchase">Acquisto Recente</option>
          <option value="test_users">Utenti Test</option>
        </select>
      </div>
    </div>
  )

  const renderScheduleSection = () => (
    <div className="space-y-6">
      {/* Delivery Type */}
      <div>
        <label className="enterprise-label">
          Tipo di Consegna
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            onClick={() => updateCampaign({ deliveryType: 'immediate' })}
            className={`delivery-type-button ${campaign.deliveryType === 'immediate' ? 'active' : ''}`}
          >
            <Zap className="w-6 h-6" />
            <div className="text-left">
              <p className="font-semibold">Immediato</p>
              <p className="text-xs text-gray-600">Invia subito</p>
            </div>
          </button>

          <button
            onClick={() => updateCampaign({ deliveryType: 'scheduled' })}
            className={`delivery-type-button ${campaign.deliveryType === 'scheduled' ? 'active' : ''}`}
          >
            <Calendar className="w-6 h-6" />
            <div className="text-left">
              <p className="font-semibold">Programmato</p>
              <p className="text-xs text-gray-600">Scegli data/ora</p>
            </div>
          </button>

          <button
            onClick={() => updateCampaign({ deliveryType: 'intelligent' })}
            className={`delivery-type-button ${campaign.deliveryType === 'intelligent' ? 'active' : ''}`}
          >
            <Sparkles className="w-6 h-6" />
            <div className="text-left">
              <p className="font-semibold">Intelligente</p>
              <p className="text-xs text-gray-600">AI ottimizzata</p>
            </div>
          </button>
        </div>
      </div>

      {/* Scheduled Time */}
      {campaign.deliveryType === 'scheduled' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="enterprise-label">Data e Ora</label>
              <input
                type="datetime-local"
                value={campaign.scheduledTime?.toISOString().slice(0, 16) || ''}
                onChange={(e) => updateCampaign({ scheduledTime: new Date(e.target.value) })}
                className="enterprise-input"
              />
            </div>

            <div>
              <label className="enterprise-label">Timezone</label>
              <select
                value={campaign.timezone || 'Europe/Rome'}
                onChange={(e) => updateCampaign({ timezone: e.target.value })}
                className="enterprise-input"
              >
                <option value="Europe/Rome">Europa/Roma (CET)</option>
                <option value="America/New_York">America/New York (EST)</option>
                <option value="America/Los_Angeles">America/Los Angeles (PST)</option>
                <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                <option value="UTC">UTC</option>
              </select>
            </div>
          </div>
        </>
      )}

      {/* Intelligent Delivery */}
      {campaign.deliveryType === 'intelligent' && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 border border-purple-200">
          <div className="flex items-start gap-4">
            <Sparkles className="w-8 h-8 text-purple-600 flex-shrink-0" />
            <div>
              <h3 className="font-bold text-gray-900 mb-2">Consegna Intelligente AI</h3>
              <p className="text-sm text-gray-700 mb-3">
                Il nostro algoritmo AI analizzerà il comportamento di ogni utente per determinare
                il momento ottimale di consegna, massimizzando il tasso di apertura e engagement.
              </p>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>✓ Analisi storica aperture notifiche</li>
                <li>✓ Pattern di utilizzo app</li>
                <li>✓ Timezone automatico per utente</li>
                <li>✓ Previsione engagement in tempo reale</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Delivery Optimization */}
      <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-5 h-5 text-green-600" />
          <div>
            <p className="font-semibold text-sm text-gray-900">Ottimizza Orario Consegna</p>
            <p className="text-xs text-gray-600">Invia quando gli utenti sono più attivi</p>
          </div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={campaign.optimizeDeliveryTime}
            onChange={(e) => updateCampaign({ optimizeDeliveryTime: e.target.checked })}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
        </label>
      </div>

      {/* Frequency Cap */}
      <div className="border rounded-lg p-4">
        <h3 className="font-semibold text-sm mb-3">Frequency Capping</h3>
        <p className="text-xs text-gray-600 mb-3">
          Limita il numero di notifiche che un utente può ricevere
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="enterprise-label">Max al giorno</label>
            <input type="number" defaultValue={3} className="enterprise-input" />
          </div>
          <div>
            <label className="enterprise-label">Max alla settimana</label>
            <input type="number" defaultValue={10} className="enterprise-input" />
          </div>
        </div>
      </div>
    </div>
  )

  const renderTestSection = () => (
    <div className="space-y-6">
      {/* A/B Test Toggle */}
      <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
        <div className="flex items-center gap-3">
          <TestTube className="w-5 h-5 text-yellow-600" />
          <div>
            <p className="font-semibold text-sm text-gray-900">A/B Testing</p>
            <p className="text-xs text-gray-600">Testa varianti per ottimizzare performance</p>
          </div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={campaign.abTest.enabled}
            onChange={(e) => updateCampaign({
              abTest: { ...campaign.abTest, enabled: e.target.checked }
            })}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-600"></div>
        </label>
      </div>

      {campaign.abTest.enabled && (
        <>
          {/* Test Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="enterprise-label">Durata Test (ore)</label>
              <input
                type="number"
                value={campaign.abTest.testDuration}
                onChange={(e) => updateCampaign({
                  abTest: { ...campaign.abTest, testDuration: parseInt(e.target.value) }
                })}
                className="enterprise-input"
              />
            </div>

            <div>
              <label className="enterprise-label">Metrica Vincitore</label>
              <select
                value={campaign.abTest.winnerMetric}
                onChange={(e) => updateCampaign({
                  abTest: { ...campaign.abTest, winnerMetric: e.target.value as any }
                })}
                className="enterprise-input"
              >
                <option value="opens">Tasso Apertura</option>
                <option value="clicks">Tasso Click</option>
                <option value="conversions">Conversioni</option>
              </select>
            </div>
          </div>

          {/* Variants */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="enterprise-label mb-0">
                Varianti
                <span className="text-xs text-gray-500 ml-2">
                  ({campaign.abTest.variants.length} varianti)
                </span>
              </label>
              <button
                onClick={addABVariant}
                className="text-sm px-3 py-1 bg-yellow-50 text-yellow-600 rounded-lg hover:bg-yellow-100 flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Aggiungi Variante
              </button>
            </div>

            {/* Original (Control) */}
            <div className="mb-3 p-4 bg-blue-50 rounded-lg border-2 border-blue-300">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-blue-900">Variante A (Controllo)</span>
                <span className="text-xs bg-blue-200 text-blue-900 px-2 py-1 rounded">50%</span>
              </div>
              <p className="text-sm font-semibold text-gray-900">{campaign.title}</p>
              <p className="text-xs text-gray-700 mt-1">{campaign.body}</p>
            </div>

            {/* Additional Variants */}
            <div className="space-y-3">
              {campaign.abTest.variants.map((variant, index) => (
                <div key={variant.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <input
                      type="text"
                      value={variant.name}
                      onChange={(e) => {
                        const updated = campaign.abTest.variants.map(v =>
                          v.id === variant.id ? { ...v, name: e.target.value } : v
                        )
                        updateCampaign({ abTest: { ...campaign.abTest, variants: updated } })
                      }}
                      className="text-sm font-bold bg-transparent border-none focus:outline-none"
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={variant.traffic}
                        onChange={(e) => {
                          const updated = campaign.abTest.variants.map(v =>
                            v.id === variant.id ? { ...v, traffic: parseInt(e.target.value) } : v
                          )
                          updateCampaign({ abTest: { ...campaign.abTest, variants: updated } })
                        }}
                        className="w-16 text-xs px-2 py-1 border border-gray-300 rounded"
                      />
                      <span className="text-xs">%</span>
                      <button
                        onClick={() => {
                          const updated = campaign.abTest.variants.filter(v => v.id !== variant.id)
                          updateCampaign({ abTest: { ...campaign.abTest, variants: updated } })
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <input
                    type="text"
                    value={variant.title}
                    onChange={(e) => {
                      const updated = campaign.abTest.variants.map(v =>
                        v.id === variant.id ? { ...v, title: e.target.value } : v
                      )
                      updateCampaign({ abTest: { ...campaign.abTest, variants: updated } })
                    }}
                    placeholder="Titolo variante"
                    className="w-full text-sm font-semibold mb-2 px-2 py-1 border border-gray-300 rounded"
                  />

                  <textarea
                    value={variant.body}
                    onChange={(e) => {
                      const updated = campaign.abTest.variants.map(v =>
                        v.id === variant.id ? { ...v, body: e.target.value } : v
                      )
                      updateCampaign({ abTest: { ...campaign.abTest, variants: updated } })
                    }}
                    placeholder="Messaggio variante"
                    rows={2}
                    className="w-full text-xs px-2 py-1 border border-gray-300 rounded resize-none"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Test Summary */}
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-4 border border-yellow-200">
            <h4 className="font-semibold text-sm mb-2">Riepilogo Test</h4>
            <ul className="text-xs text-gray-700 space-y-1">
              <li>• Il test durerà <strong>{campaign.abTest.testDuration} ore</strong></li>
              <li>• La variante vincente sarà determinata in base a <strong>{campaign.abTest.winnerMetric}</strong></li>
              <li>• Dopo il test, la variante vincente sarà inviata al rimanente {100 - campaign.abTest.variants.reduce((acc, v) => acc + v.traffic, 50)}% del pubblico</li>
            </ul>
          </div>
        </>
      )}
    </div>
  )

  const renderPreviewSection = () => (
    <div className="space-y-6">
      {/* Device Selector */}
      <div className="flex justify-center gap-3">
        <button
          onClick={() => setPreviewDevice('ios')}
          className={`preview-device-button ${previewDevice === 'ios' ? 'active' : ''}`}
        >
          <Smartphone className="w-5 h-5" />
          iOS
        </button>
        <button
          onClick={() => setPreviewDevice('android')}
          className={`preview-device-button ${previewDevice === 'android' ? 'active' : ''}`}
        >
          <Smartphone className="w-5 h-5" />
          Android
        </button>
        <button
          onClick={() => setPreviewDevice('web')}
          className={`preview-device-button ${previewDevice === 'web' ? 'active' : ''}`}
        >
          <Monitor className="w-5 h-5" />
          Web
        </button>
      </div>

      {/* Preview */}
      <div className="flex justify-center">
        <div className={`notification-preview ${previewDevice}`}>
          {previewDevice === 'ios' && (
            <div className="ios-notification">
              {campaign.imageUrl && (
                <img src={campaign.imageUrl} alt="" className="notification-image" />
              )}
              <div className="notification-content">
                <div className="notification-header">
                  {organization?.logo_url ? (
                    <img
                      src={organization.logo_url}
                      alt={organization.name || 'Logo'}
                      className="app-icon"
                      crossOrigin="anonymous"
                      onError={(e) => {
                        console.warn('[Preview iOS] Logo failed to load, using fallback')
                        const target = e.currentTarget as HTMLImageElement
                        target.style.display = 'none'
                      }}
                    />
                  ) : null}
                  {(!organization?.logo_url || !organization) && (
                    <div className="app-icon" style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Bell className="w-3 h-3 text-white" />
                    </div>
                  )}
                  <span className="app-name">{organization?.name || 'OmnilyPro'}</span>
                  <span className="notification-time">adesso</span>
                </div>
                <div className="notification-body">
                  <p className="notification-title">{campaign.title || 'Titolo notifica'}</p>
                  {campaign.subtitle && (
                    <p className="notification-subtitle">{campaign.subtitle}</p>
                  )}
                  <p className="notification-text">{campaign.body || 'Messaggio della notifica...'}</p>
                </div>
                {campaign.actionButtons && campaign.actionButtons.length > 0 && (
                  <div className="notification-actions">
                    {campaign.actionButtons.map(btn => (
                      <button key={btn.id} className="action-button">{btn.text}</button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {previewDevice === 'android' && (
            <div className="android-notification">
              <div className="notification-content">
                <div className="notification-header">
                  {organization?.logo_url ? (
                    <img
                      src={organization.logo_url}
                      alt={organization.name || 'Logo'}
                      className="app-icon"
                      crossOrigin="anonymous"
                      onError={(e) => {
                        console.warn('[Preview Android] Logo failed to load, using fallback')
                        const target = e.currentTarget as HTMLImageElement
                        target.style.display = 'none'
                      }}
                    />
                  ) : null}
                  {(!organization?.logo_url || !organization) && (
                    <div className="app-icon" style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>
                      <Bell className="w-3 h-3 text-white" />
                    </div>
                  )}
                  <div className="header-text">
                    <span className="app-name">{organization?.name || 'OmnilyPro'}</span>
                    <span className="notification-time">adesso</span>
                  </div>
                </div>
                <div className="notification-body">
                  <p className="notification-title">{campaign.title || 'Titolo notifica'}</p>
                  <p className="notification-text">{campaign.body || 'Messaggio della notifica...'}</p>
                </div>
                {campaign.imageUrl && (
                  <img src={campaign.imageUrl} alt="" className="notification-image" />
                )}
                {campaign.actionButtons && campaign.actionButtons.length > 0 && (
                  <div className="notification-actions">
                    {campaign.actionButtons.map(btn => (
                      <button key={btn.id} className="action-button">{btn.text}</button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {previewDevice === 'web' && (
            <div className="web-notification">
              <div className="web-notification-header">
                {organization?.logo_url ? (
                  <img
                    src={organization.logo_url}
                    alt={organization.name || 'Logo'}
                    className="web-app-icon"
                    crossOrigin="anonymous"
                    onError={(e) => {
                      console.warn('[Preview Web] Logo failed to load, using fallback')
                      const target = e.currentTarget as HTMLImageElement
                      target.style.display = 'none'
                    }}
                  />
                ) : null}
                {(!organization?.logo_url || !organization) && (
                  <div className="web-app-icon" style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Bell className="w-4 h-4 text-white" />
                  </div>
                )}
                <div className="web-header-text">
                  <span className="web-app-name">{organization?.name || 'OmnilyPro'}</span>
                  <span className="web-notification-domain">omnilypro.com</span>
                </div>
              </div>
              {campaign.imageUrl && (
                <img src={campaign.imageUrl} alt="" className="notification-image" />
              )}
              <div className="notification-content">
                <p className="notification-title">{campaign.title || 'Titolo notifica'}</p>
                <p className="notification-text">{campaign.body || 'Messaggio della notifica...'}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats Preview */}
      <div className="grid grid-cols-3 gap-4">
        <div className="stat-card">
          <p className="stat-label">Reach Stimato</p>
          <p className="stat-value">{estimatedReach.toLocaleString()}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Apertura Attesa</p>
          <p className="stat-value">~{Math.floor(estimatedReach * 0.35).toLocaleString()}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Click Attesi</p>
          <p className="stat-value">~{Math.floor(estimatedReach * 0.12).toLocaleString()}</p>
        </div>
      </div>
    </div>
  )

  // =====================================================
  // Main Render
  // =====================================================
  return (
    <div className="enterprise-editor">
      {/* Header */}
      <div className="enterprise-header">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Enterprise Notification Editor</h1>
          <p className="text-sm text-gray-600 mt-1">
            Editor professionale per campagne push notification multi-canale
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="progress-steps">
        {[
          { id: 'compose', label: 'Componi', icon: Bell },
          { id: 'audience', label: 'Audience', icon: Users },
          { id: 'schedule', label: 'Pianifica', icon: Clock },
          { id: 'test', label: 'A/B Test', icon: TestTube },
          { id: 'preview', label: 'Preview', icon: Eye }
        ].map((step, index) => {
          const Icon = step.icon
          const isActive = activeSection === step.id
          const isCompleted = false // TODO: track completion

          return (
            <button
              key={step.id}
              onClick={() => setActiveSection(step.id as any)}
              className={`step-button ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
            >
              <div className="step-icon">
                <Icon className="w-5 h-5" />
              </div>
              <span className="step-label">{step.label}</span>
            </button>
          )
        })}
      </div>

      {/* Content Area */}
      <div className="enterprise-content">
        {activeSection === 'compose' && renderComposeSection()}
        {activeSection === 'audience' && renderAudienceSection()}
        {activeSection === 'schedule' && renderScheduleSection()}
        {activeSection === 'test' && renderTestSection()}
        {activeSection === 'preview' && renderPreviewSection()}
      </div>

      {/* Footer Actions */}
      <div className="enterprise-footer">
        <div className="flex items-center gap-3">
          <button className="btn-secondary">
            <Eye className="w-4 h-4" />
            {mode === 'template' ? 'Anteprima' : 'Test Notifica'}
          </button>
          {mode === 'notification' && (
            <button
              onClick={() => onSaveDraft?.(campaign)}
              className="btn-secondary"
              disabled={!campaign.title || !campaign.body}
            >
              <Save className="w-4 h-4" />
              Salva Bozza
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          {mode === 'template' ? (
            <button
              onClick={() => onSaveTemplate?.(campaign)}
              className="btn-primary"
              disabled={!campaign.title || !campaign.body}
            >
              <Save className="w-4 h-4" />
              Salva Template
            </button>
          ) : (
            <>
              {campaign.deliveryType === 'scheduled' ? (
                <button
                  onClick={() => onSchedule?.(campaign)}
                  className="btn-primary"
                  disabled={!campaign.title || !campaign.body}
                >
                  <Calendar className="w-4 h-4" />
                  Programma Invio
                </button>
              ) : (
                <button
                  onClick={() => onSend?.(campaign)}
                  className="btn-primary"
                  disabled={!campaign.title || !campaign.body}
                >
                  <Send className="w-4 h-4" />
                  Invia Ora
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
