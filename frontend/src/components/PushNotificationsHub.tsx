import React, { useState, useEffect } from 'react'
import { Bell, Send, Eye, Save, Sparkles, Users, BarChart3, Settings, FileText, ArrowLeft, History, Zap, Target, TestTube, Calendar, TrendingUp, MessageSquare, Megaphone, Activity, Trash2, Copy, Edit, Clock, CheckCircle, XCircle, Plus, Gift, Award, Percent, Star } from 'lucide-react'
import EnterpriseNotificationEditor from './EnterpriseNotificationEditor'
import { supabase } from '../lib/supabase'
import './PushNotificationsHub.css'

interface PushNotificationsHubProps {
  organizationId: string
  organizationName: string
  primaryColor: string
  secondaryColor: string
}

type ViewMode = 'hub' | 'editor' | 'campaigns' | 'templates' | 'analytics' | 'settings'

const PushNotificationsHub: React.FC<PushNotificationsHubProps> = ({
  organizationId,
  organizationName,
  primaryColor,
  secondaryColor
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('hub')
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [loadingCampaigns, setLoadingCampaigns] = useState(false)
  const [campaignStats, setCampaignStats] = useState({ active: 0, sent: 0, drafts: 0 })

  // Template Library state
  const [templates, setTemplates] = useState<any[]>([])
  const [loadingTemplates, setLoadingTemplates] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [templateStats, setTemplateStats] = useState({ predefined: 0, custom: 0, total: 0 })

  // Editor state - tracks what we're editing
  const [editorMode, setEditorMode] = useState<'notification' | 'template' | 'use-template'>('notification')
  const [editingCampaign, setEditingCampaign] = useState<any>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null)

  // Load campaigns when switching to campaigns view
  useEffect(() => {
    if (viewMode === 'campaigns') {
      loadCampaigns()
    }
  }, [viewMode])

  // Load templates when switching to templates view
  useEffect(() => {
    if (viewMode === 'templates') {
      loadTemplates()
    }
  }, [viewMode])

  // Load initial stats for hub view
  useEffect(() => {
    const loadInitialStats = async () => {
      try {
        // Load campaign stats
        const { data: campaignData, error: campaignError } = await supabase
          .from('push_campaigns')
          .select('status')
          .eq('organization_id', organizationId)

        if (campaignError) throw campaignError

        const cStats = {
          active: campaignData?.filter(c => c.status === 'scheduled').length || 0,
          sent: campaignData?.filter(c => c.status === 'sent').length || 0,
          drafts: campaignData?.filter(c => c.status === 'draft').length || 0
        }
        setCampaignStats(cStats)

        // Load template stats
        const { data: templateData, error: templateError } = await supabase
          .from('notification_templates')
          .select('is_predefined')
          .eq('organization_id', organizationId)

        if (templateError) {
          console.error('Error loading template stats:', templateError)
        } else {
          const tStats = {
            predefined: templateData?.filter(t => t.is_predefined).length || 0,
            custom: templateData?.filter(t => !t.is_predefined).length || 0,
            total: templateData?.length || 0
          }
          setTemplateStats(tStats)
        }
      } catch (error) {
        console.error('Error loading stats:', error)
      }
    }

    loadInitialStats()
  }, [organizationId])

  const loadCampaigns = async () => {
    setLoadingCampaigns(true)
    try {
      const { data, error } = await supabase
        .from('push_campaigns')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })

      if (error) throw error

      setCampaigns(data || [])

      // Calculate stats
      const stats = {
        active: data?.filter(c => c.status === 'scheduled').length || 0,
        sent: data?.filter(c => c.status === 'sent').length || 0,
        drafts: data?.filter(c => c.status === 'draft').length || 0
      }
      setCampaignStats(stats)
    } catch (error) {
      console.error('Error loading campaigns:', error)
    } finally {
      setLoadingCampaigns(false)
    }
  }

  const handleSaveCampaign = async (campaign: any) => {
    try {
      console.log('Saving campaign:', campaign)

      const { data, error } = await supabase
        .from('push_campaigns')
        .insert({
          organization_id: organizationId,
          name: campaign.name,
          status: 'draft',
          title: campaign.title,
          body: campaign.body,
          subtitle: campaign.subtitle,
          image_url: campaign.imageUrl,
          deep_link: campaign.deepLink,
          channels: campaign.channels,
          segments: campaign.segments,
          filters: campaign.filters,
          delivery_type: campaign.deliveryType,
          scheduled_time: campaign.scheduledTime,
          campaign_data: campaign
        })
        .select()
        .single()

      if (error) throw error

      console.log('Campaign saved:', data)
      alert('Campagna salvata come bozza!')
      loadCampaigns() // Reload campaigns list
    } catch (error) {
      console.error('Error saving campaign:', error)
      alert('Errore durante il salvataggio')
    }
  }

  const handleSendCampaign = async (campaign: any) => {
    try {
      console.log('Sending campaign:', campaign)

      // Get organization data for logo
      const { data: org } = await supabase
        .from('organizations')
        .select('logo_url')
        .eq('id', organizationId)
        .single()

      // Call edge function to send push notification
      const { data, error } = await supabase.functions.invoke('send-push-notification', {
        body: {
          organizationId: organizationId,
          title: campaign.title,
          body: campaign.body,
          subtitle: campaign.subtitle,
          imageUrl: campaign.imageUrl,
          icon: org?.logo_url || campaign.icon, // Add organization logo as icon
          actionUrl: campaign.deepLink,
          data: {
            type: 'campaign',
            campaignId: campaign.id || 'new',
            ...campaign.variables
          },
          targetAll: campaign.segments.includes('all'),
          // TODO: Add more targeting options based on segments and filters
        }
      })

      if (error) {
        throw error
      }

      console.log('Campaign sent:', data)

      // Save or update campaign status
      if (campaign.id) {
        // Update existing campaign
        await supabase
          .from('push_campaigns')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
            total_sent: data.total,
            total_delivered: data.successful
          })
          .eq('id', campaign.id)
      } else {
        // Save new campaign as sent
        await supabase
          .from('push_campaigns')
          .insert({
            organization_id: organizationId,
            name: campaign.name || 'Campagna senza nome',
            status: 'sent',
            title: campaign.title,
            body: campaign.body,
            subtitle: campaign.subtitle,
            image_url: campaign.imageUrl,
            deep_link: campaign.deepLink,
            channels: campaign.channels,
            segments: campaign.segments,
            filters: campaign.filters,
            delivery_type: campaign.deliveryType,
            campaign_data: campaign,
            sent_at: new Date().toISOString(),
            total_sent: data.total,
            total_delivered: data.successful
          })
      }

      alert(`Notifica inviata con successo a ${data.total} dispositivi!`)
      loadCampaigns() // Reload campaigns list
    } catch (error) {
      console.error('Error sending campaign:', error)
      alert(`Errore durante l'invio: ${error.message}`)
    }
  }

  const handleScheduleCampaign = async (campaign: any) => {
    try {
      console.log('Scheduling campaign:', campaign)

      const { data, error } = await supabase
        .from('push_campaigns')
        .insert({
          organization_id: organizationId,
          name: campaign.name,
          status: 'scheduled',
          title: campaign.title,
          body: campaign.body,
          subtitle: campaign.subtitle,
          image_url: campaign.imageUrl,
          deep_link: campaign.deepLink,
          channels: campaign.channels,
          segments: campaign.segments,
          filters: campaign.filters,
          delivery_type: campaign.deliveryType,
          scheduled_time: campaign.scheduledTime,
          campaign_data: campaign
        })
        .select()
        .single()

      if (error) throw error

      alert(`Campagna programmata per ${campaign.scheduledTime?.toLocaleString()}`)
      loadCampaigns() // Reload campaigns list
    } catch (error) {
      console.error('Error scheduling campaign:', error)
      alert('Errore durante la programmazione')
    }
  }

  const handleDeleteCampaign = async (campaignId: string) => {
    if (!confirm('Sei sicuro di voler eliminare questa campagna?')) return

    try {
      const { error } = await supabase
        .from('push_campaigns')
        .delete()
        .eq('id', campaignId)

      if (error) throw error

      alert('Campagna eliminata con successo')
      loadCampaigns()
    } catch (error) {
      console.error('Error deleting campaign:', error)
      alert('Errore durante l\'eliminazione')
    }
  }

  const handleDuplicateCampaign = async (campaign: any) => {
    try {
      const { data, error } = await supabase
        .from('push_campaigns')
        .insert({
          organization_id: organizationId,
          name: `${campaign.name} (Copia)`,
          status: 'draft',
          title: campaign.title,
          body: campaign.body,
          subtitle: campaign.subtitle,
          image_url: campaign.image_url,
          deep_link: campaign.deep_link,
          channels: campaign.channels,
          segments: campaign.segments,
          filters: campaign.filters,
          delivery_type: campaign.delivery_type,
          campaign_data: campaign.campaign_data
        })
        .select()
        .single()

      if (error) throw error

      alert('Campagna duplicata con successo')
      loadCampaigns()
    } catch (error) {
      console.error('Error duplicating campaign:', error)
      alert('Errore durante la duplicazione')
    }
  }

  // Template Library Functions
  const loadTemplates = async () => {
    setLoadingTemplates(true)
    try {
      const { data, error } = await supabase
        .from('notification_templates')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })

      if (error) throw error

      setTemplates(data || [])

      // Calculate stats
      const stats = {
        predefined: data?.filter(t => t.is_predefined).length || 0,
        custom: data?.filter(t => !t.is_predefined).length || 0,
        total: data?.length || 0
      }
      setTemplateStats(stats)
    } catch (error) {
      console.error('Error loading templates:', error)
    } finally {
      setLoadingTemplates(false)
    }
  }

  const handleUseTemplate = async (template: any) => {
    // Load template into editor for sending notification
    setEditorMode('use-template')
    setSelectedTemplate(template)
    setEditingCampaign(null)
    setViewMode('editor')

    // Update template usage stats
    try {
      await supabase
        .from('notification_templates')
        .update({
          usage_count: (template.usage_count || 0) + 1,
          last_used_at: new Date().toISOString()
        })
        .eq('id', template.id)
    } catch (error) {
      console.error('Error updating template usage:', error)
    }
  }

  const handleCreateNewNotification = () => {
    setEditorMode('notification')
    setEditingCampaign(null)
    setSelectedTemplate(null)
    setViewMode('editor')
  }

  const handleCreateNewTemplate = () => {
    setEditorMode('template')
    setEditingCampaign(null)
    setSelectedTemplate(null)
    setViewMode('editor')
  }

  const handleSaveTemplate = async (templateData: any) => {
    try {
      console.log('Saving template:', templateData)

      // Determine category based on content (you could also add a category selector in the editor)
      let category = 'general'
      if (templateData.title.toLowerCase().includes('benvenuto') || templateData.title.toLowerCase().includes('welcome')) {
        category = 'welcome'
      } else if (templateData.title.toLowerCase().includes('tier') || templateData.title.toLowerCase().includes('livello')) {
        category = 'tier_upgrade'
      } else if (templateData.title.toLowerCase().includes('premio') || templateData.title.toLowerCase().includes('ricompensa')) {
        category = 'rewards'
      } else if (templateData.title.toLowerCase().includes('promo') || templateData.title.toLowerCase().includes('offerta')) {
        category = 'promotions'
      } else if (templateData.title.toLowerCase().includes('punti') || templateData.title.toLowerCase().includes('point')) {
        category = 'points'
      }

      const { data, error } = await supabase
        .from('notification_templates')
        .insert({
          organization_id: organizationId,
          name: templateData.name || templateData.title,
          category: category,
          description: templateData.subtitle || '',
          title: templateData.title,
          body: templateData.body,
          subtitle: templateData.subtitle,
          image_url: templateData.imageUrl,
          deep_link: templateData.deepLink,
          icon: templateData.icon,
          default_channels: templateData.channels || ['push'],
          default_segments: templateData.segments || ['all'],
          variables: [], // TODO: extract variables from title/body
          is_predefined: false
        })
        .select()
        .single()

      if (error) throw error

      console.log('Template saved:', data)
      alert('Template salvato con successo!')

      // Reload templates and go back to template library
      loadTemplates()
      setViewMode('templates')
    } catch (error) {
      console.error('Error saving template:', error)
      alert('Errore durante il salvataggio del template')
    }
  }

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo template?')) return

    try {
      const { error } = await supabase
        .from('notification_templates')
        .delete()
        .eq('id', templateId)

      if (error) throw error

      alert('Template eliminato con successo')
      loadTemplates()
    } catch (error) {
      console.error('Error deleting template:', error)
      alert('Errore durante l\'eliminazione')
    }
  }

  const handleDuplicateTemplate = async (template: any) => {
    try {
      const { data, error } = await supabase
        .from('notification_templates')
        .insert({
          organization_id: organizationId,
          name: `${template.name} (Copia)`,
          category: template.category,
          description: template.description,
          title: template.title,
          body: template.body,
          subtitle: template.subtitle,
          image_url: template.image_url,
          deep_link: template.deep_link,
          icon: template.icon,
          default_channels: template.default_channels,
          default_segments: template.default_segments,
          variables: template.variables,
          is_predefined: false
        })
        .select()
        .single()

      if (error) throw error

      alert('Template duplicato con successo')
      loadTemplates()
    } catch (error) {
      console.error('Error duplicating template:', error)
      alert('Errore durante la duplicazione')
    }
  }

  // Render Hub View with Cards
  const renderHubView = () => (
    <div className="push-hub-view">
      <div className="push-hub-header">
        <div className="push-hub-header-content">
          <div className="push-hub-icon" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}>
            <Bell size={48} />
          </div>
          <div>
            <h1>Push Notifications Hub</h1>
            <p>Sistema enterprise per notifiche push multi-canale con AI e A/B testing</p>
          </div>
        </div>
      </div>

      <div className="push-hub-cards">
        {/* Card: Gestione Campagne */}
        <div
          className="push-hub-card push-hub-card-primary"
          onClick={() => setViewMode('campaigns')}
          style={{ '--card-color': '#10b981' } as React.CSSProperties}
        >
          <div className="push-hub-card-icon">
            <Megaphone size={32} />
          </div>
          <div className="push-hub-card-content">
            <h3>Gestione Campagne</h3>
            <p>Crea, invia e monitora tutte le tue campagne</p>
            <ul className="push-hub-card-features">
              <li><FileText size={16} />{campaignStats.drafts} bozze in lavorazione</li>
              <li><Calendar size={16} />{campaignStats.active} campagne programmate</li>
              <li><Send size={16} />{campaignStats.sent} notifiche inviate</li>
              <li><BarChart3 size={16} />Analytics e statistiche complete</li>
            </ul>
          </div>
          <div className="push-hub-card-arrow">→</div>
        </div>

        {/* Card: Template Library */}
        <div
          className="push-hub-card push-hub-card-primary"
          onClick={() => setViewMode('templates')}
          style={{ '--card-color': '#8b5cf6' } as React.CSSProperties}
        >
          <div className="push-hub-card-icon">
            <FileText size={32} />
          </div>
          <div className="push-hub-card-content">
            <h3>Template Library</h3>
            <p>Libreria template pre-costruiti e personalizzati</p>
            <ul className="push-hub-card-features">
              <li><Sparkles size={16} />{templateStats.predefined} template predefiniti</li>
              <li><Users size={16} />{templateStats.custom} template personalizzati</li>
              <li><Save size={16} />Riutilizzo rapido</li>
              <li><TrendingUp size={16} />Statistiche utilizzo</li>
            </ul>
          </div>
          <div className="push-hub-card-arrow">→</div>
        </div>

        {/* Card: Analytics & Report */}
        <div
          className="push-hub-card push-hub-card-primary"
          onClick={() => setViewMode('analytics')}
          style={{ '--card-color': '#f59e0b' } as React.CSSProperties}
        >
          <div className="push-hub-card-icon">
            <BarChart3 size={32} />
          </div>
          <div className="push-hub-card-content">
            <h3>Analytics & Insights</h3>
            <p>Dashboard completa con metriche in tempo reale</p>
            <ul className="push-hub-card-features">
              <li><TrendingUp size={16} />89.2% delivery rate</li>
              <li><Eye size={16} />34.5% open rate</li>
              <li><MessageSquare size={16} />12.8% click rate</li>
              <li><Target size={16} />4.2% conversion rate</li>
            </ul>
          </div>
          <div className="push-hub-card-arrow">→</div>
        </div>

        {/* Card: Impostazioni */}
        <div
          className="push-hub-card push-hub-card-secondary"
          onClick={() => setViewMode('settings')}
        >
          <div className="push-hub-card-icon">
            <Settings size={28} />
          </div>
          <div className="push-hub-card-content">
            <h3>Impostazioni</h3>
            <p>Configura Firebase, VAPID keys e service worker</p>
          </div>
          <div className="push-hub-card-arrow">→</div>
        </div>
      </div>
    </div>
  )

  // Render content based on view mode
  const renderContent = () => {
    switch (viewMode) {
      case 'hub':
        return renderHubView()

      case 'editor': {
        // Prepare initial data and mode based on editor mode
        let initialData = null
        let editorComponentMode: 'notification' | 'template' = 'notification'

        if (editorMode === 'use-template' && selectedTemplate) {
          // Using template to send notification - load template data
          editorComponentMode = 'notification'
          initialData = {
            name: '',
            title: selectedTemplate.title,
            body: selectedTemplate.body,
            subtitle: selectedTemplate.subtitle,
            imageUrl: selectedTemplate.image_url,
            deepLink: selectedTemplate.deep_link,
            channels: selectedTemplate.default_channels || ['push'],
            segments: selectedTemplate.default_segments || ['all'],
            filters: [],
            deliveryType: 'immediate',
            scheduledTime: null
          }
        } else if (editorMode === 'template') {
          // Creating new template
          editorComponentMode = 'template'
          initialData = null
        }

        return (
          <div className="push-hub-view">
            <button
              onClick={() => {
                setViewMode(editorMode === 'template' ? 'templates' : 'hub')
                // Reset editor state when going back
                setEditorMode('notification')
                setEditingCampaign(null)
                setSelectedTemplate(null)
              }}
              className="push-back-button"
              style={{ marginBottom: '1rem' }}
            >
              <ArrowLeft size={20} />
              <span>{editorMode === 'template' ? 'Torna ai Template' : 'Torna all\'Hub'}</span>
            </button>
            {editorMode === 'use-template' && selectedTemplate && (
              <div style={{
                background: 'linear-gradient(135deg, #f3e8ff, #fae8ff)',
                border: '2px solid #d8b4fe',
                borderRadius: '0.75rem',
                padding: '1rem 1.5rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <Sparkles size={24} style={{ color: '#8b5cf6' }} />
                <div>
                  <div style={{ fontWeight: 600, color: '#7c3aed', marginBottom: '0.25rem' }}>
                    Usando Template: {selectedTemplate.name}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#9333ea' }}>
                    {selectedTemplate.description || 'Personalizza e invia la tua notifica'}
                  </div>
                </div>
              </div>
            )}
            {editorMode === 'template' && (
              <div style={{
                background: 'linear-gradient(135deg, #f3e8ff, #fae8ff)',
                border: '2px solid #d8b4fe',
                borderRadius: '0.75rem',
                padding: '1rem 1.5rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <FileText size={24} style={{ color: '#8b5cf6' }} />
                <div>
                  <div style={{ fontWeight: 600, color: '#7c3aed', marginBottom: '0.25rem' }}>
                    Crea Nuovo Template
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#9333ea' }}>
                    Salva un template riutilizzabile per velocizzare le tue campagne future
                  </div>
                </div>
              </div>
            )}
            <EnterpriseNotificationEditor
              key={`editor-${editorMode}-${selectedTemplate?.id || 'new'}`}
              organizationId={organizationId}
              mode={editorComponentMode}
              onSend={handleSendCampaign}
              onSchedule={handleScheduleCampaign}
              onSaveDraft={handleSaveCampaign}
              onSaveTemplate={handleSaveTemplate}
              initialData={initialData}
            />
          </div>
        )
      }

      case 'campaigns': {
        return (
          <div className="push-hub-view">
            <button
              onClick={() => setViewMode('hub')}
              className="push-back-button"
              style={{ marginBottom: '1rem' }}
            >
              <ArrowLeft size={20} />
              <span>Torna all'Hub</span>
            </button>

            <div style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#111827', marginBottom: '0.5rem' }}>
                    Gestione Campagne
                  </h2>
                  <p style={{ color: '#6b7280' }}>
                    Crea, modifica e monitora tutte le tue campagne notifiche
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditorMode('notification')
                    setEditingCampaign(null)
                    setSelectedTemplate(null)
                    setViewMode('editor')
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1.5rem',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.3)'
                  }}
                >
                  <Plus size={20} />
                  Crea Nuova Campagna
                </button>
              </div>

              {/* Stats */}
            <div className="grid grid-cols-3 gap-4 max-w-3xl" style={{ marginBottom: '2rem' }}>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-3xl font-bold text-blue-600">{campaignStats.active}</p>
                <p className="text-sm text-gray-600 mt-1">Programmate</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-3xl font-bold text-green-600">{campaignStats.sent}</p>
                <p className="text-sm text-gray-600 mt-1">Inviate</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-3xl font-bold text-gray-600">{campaignStats.drafts}</p>
                <p className="text-sm text-gray-600 mt-1">Bozze</p>
              </div>
            </div>

            {/* Campaigns List */}
            {loadingCampaigns ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
                Caricamento campagne...
              </div>
            ) : campaigns.length === 0 ? (
              <div className="push-hub-empty">
                <Megaphone size={64} />
                <h3>Nessuna campagna trovata</h3>
                <p>Crea la tua prima campagna per iniziare a inviare notifiche push</p>
                <button
                  onClick={() => {
                    setEditorMode('notification')
                    setEditingCampaign(null)
                    setSelectedTemplate(null)
                    setViewMode('editor')
                  }}
                  style={{
                    marginTop: '1.5rem',
                    padding: '0.75rem 1.5rem',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.75rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <Plus size={20} />
                  Crea Prima Campagna
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {campaigns.map(campaign => (
                  <div
                    key={campaign.id}
                    style={{
                      background: 'white',
                      border: '2px solid #e5e7eb',
                      borderRadius: '1rem',
                      padding: '1.5rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'start',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = primaryColor
                      e.currentTarget.style.boxShadow = `0 4px 12px rgba(239, 68, 68, 0.15)`
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#e5e7eb'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: '700', color: '#1f2937', margin: 0 }}>
                          {campaign.name}
                        </h3>
                        <span
                          style={{
                            padding: '0.25rem 0.75rem',
                            borderRadius: '9999px',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            background: campaign.status === 'sent' ? '#dcfce7' :
                                      campaign.status === 'scheduled' ? '#dbeafe' :
                                      campaign.status === 'draft' ? '#f3f4f6' : '#fee2e2',
                            color: campaign.status === 'sent' ? '#15803d' :
                                  campaign.status === 'scheduled' ? '#1e40af' :
                                  campaign.status === 'draft' ? '#4b5563' : '#b91c1c'
                          }}
                        >
                          {campaign.status === 'sent' ? 'Inviata' :
                          campaign.status === 'scheduled' ? 'Programmata' :
                          campaign.status === 'draft' ? 'Bozza' : 'Errore'}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                        {campaign.title}
                      </p>
                      <p style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                        {campaign.body?.substring(0, 100)}{campaign.body?.length > 100 ? '...' : ''}
                      </p>
                      <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem', fontSize: '0.75rem', color: '#6b7280' }}>
                        <span>
                          <Clock size={14} style={{ display: 'inline', marginRight: '0.25rem' }} />
                          {new Date(campaign.created_at).toLocaleDateString('it-IT')}
                        </span>
                        {campaign.total_sent > 0 && (
                          <span>
                            <Send size={14} style={{ display: 'inline', marginRight: '0.25rem' }} />
                            {campaign.total_sent} inviate
                          </span>
                        )}
                        {campaign.total_delivered > 0 && (
                          <span>
                            <CheckCircle size={14} style={{ display: 'inline', marginRight: '0.25rem' }} />
                            {campaign.total_delivered} consegnate
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => handleDuplicateCampaign(campaign)}
                        style={{
                          padding: '0.5rem',
                          background: '#f3f4f6',
                          border: 'none',
                          borderRadius: '0.5rem',
                          cursor: 'pointer',
                          color: '#4b5563'
                        }}
                        title="Duplica campagna"
                      >
                        <Copy size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteCampaign(campaign.id)}
                        style={{
                          padding: '0.5rem',
                          background: '#fee2e2',
                          border: 'none',
                          borderRadius: '0.5rem',
                          cursor: 'pointer',
                          color: '#dc2626'
                        }}
                        title="Elimina campagna"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            </div>
          </div>
        )
      }

      case 'templates': {
        const categories = [
          { id: 'all', label: 'Tutti', icon: FileText, color: '#6b7280' },
          { id: 'welcome', label: 'Benvenuto', icon: Users, color: '#8b5cf6' },
          { id: 'tier_upgrade', label: 'Tier Upgrade', icon: Award, color: '#3b82f6' },
          { id: 'rewards', label: 'Premi', icon: Gift, color: '#f59e0b' },
          { id: 'promotions', label: 'Promozioni', icon: Percent, color: '#ef4444' },
          { id: 'points', label: 'Punti', icon: Star, color: '#10b981' },
        ]

        const getCategoryIcon = (category: string) => {
          const cat = categories.find(c => c.id === category)
          return cat ? cat.icon : FileText
        }

        const getCategoryColor = (category: string) => {
          const cat = categories.find(c => c.id === category)
          return cat ? cat.color : '#6b7280'
        }

        const filteredTemplates = selectedCategory === 'all'
          ? templates
          : templates.filter(t => t.category === selectedCategory)

        return (
          <div className="push-hub-view">
            <button
              onClick={() => setViewMode('hub')}
              className="push-back-button"
              style={{ marginBottom: '1rem' }}
            >
              <ArrowLeft size={20} />
              <span>Torna all'Hub</span>
            </button>

            <div style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#111827', marginBottom: '0.5rem' }}>
                    Template Library
                  </h2>
                  <p style={{ color: '#6b7280' }}>
                    Utilizza template pre-costruiti o crea i tuoi personalizzati
                  </p>
                </div>
                <button
                  onClick={handleCreateNewTemplate}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1.5rem',
                    background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 4px 6px -1px rgba(139, 92, 246, 0.3)'
                  }}
                >
                  <Plus size={20} />
                  Crea Nuovo Template
                </button>
              </div>

              {/* Stats Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{
                  background: 'white',
                  borderRadius: '0.75rem',
                  padding: '1.5rem',
                  border: '1px solid #e5e7eb',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                    Predefiniti
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#8b5cf6' }}>
                    {templateStats.predefined}
                  </div>
                </div>
                <div style={{
                  background: 'white',
                  borderRadius: '0.75rem',
                  padding: '1.5rem',
                  border: '1px solid #e5e7eb',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                    Personalizzati
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#3b82f6' }}>
                    {templateStats.custom}
                  </div>
                </div>
                <div style={{
                  background: 'white',
                  borderRadius: '0.75rem',
                  padding: '1.5rem',
                  border: '1px solid #e5e7eb',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                    Totali
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#10b981' }}>
                    {templateStats.total}
                  </div>
                </div>
              </div>

              {/* Category Filters */}
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                {categories.map(cat => {
                  const Icon = cat.icon
                  const isActive = selectedCategory === cat.id
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 1rem',
                        border: `2px solid ${isActive ? cat.color : '#e5e7eb'}`,
                        borderRadius: '0.5rem',
                        background: isActive ? `${cat.color}15` : 'white',
                        color: isActive ? cat.color : '#6b7280',
                        fontWeight: isActive ? 600 : 500,
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <Icon size={16} />
                      {cat.label}
                    </button>
                  )
                })}
              </div>

              {/* Templates List */}
              {loadingTemplates ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
                  <div>Caricamento template...</div>
                </div>
              ) : filteredTemplates.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '4rem 2rem',
                  background: 'white',
                  borderRadius: '1rem',
                  border: '2px dashed #e5e7eb'
                }}>
                  <FileText size={64} style={{ color: '#d1d5db', margin: '0 auto 1rem' }} />
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>
                    Nessun template trovato
                  </h3>
                  <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
                    {selectedCategory === 'all'
                      ? 'Inizia creando il tuo primo template personalizzato'
                      : 'Nessun template in questa categoria'}
                  </p>
                  <button
                    onClick={handleCreateNewTemplate}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.75rem 1.5rem',
                      background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      boxShadow: '0 4px 6px -1px rgba(139, 92, 246, 0.3)'
                    }}
                  >
                    <Plus size={20} />
                    Crea Primo Template
                  </button>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
                  {filteredTemplates.map(template => {
                    const CategoryIcon = getCategoryIcon(template.category)
                    const categoryColor = getCategoryColor(template.category)

                    return (
                      <div
                        key={template.id}
                        style={{
                          background: 'white',
                          borderRadius: '1rem',
                          padding: '1.5rem',
                          border: '2px solid #e5e7eb',
                          transition: 'all 0.2s',
                          cursor: 'pointer',
                          position: 'relative'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = categoryColor
                          e.currentTarget.style.boxShadow = `0 8px 16px -4px ${categoryColor}40`
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = '#e5e7eb'
                          e.currentTarget.style.boxShadow = 'none'
                        }}
                      >
                        {/* Template Header */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                            <div style={{
                              padding: '0.75rem',
                              background: `${categoryColor}15`,
                              borderRadius: '0.5rem'
                            }}>
                              <CategoryIcon size={24} style={{ color: categoryColor }} />
                            </div>
                            <div style={{ flex: 1 }}>
                              <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#111827', marginBottom: '0.25rem' }}>
                                {template.name}
                              </h4>
                              {template.is_predefined && (
                                <span style={{
                                  fontSize: '0.65rem',
                                  fontWeight: 600,
                                  color: '#8b5cf6',
                                  background: '#f3e8ff',
                                  padding: '0.125rem 0.5rem',
                                  borderRadius: '0.25rem',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.05em'
                                }}>
                                  Predefinito
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Description */}
                        {template.description && (
                          <p style={{
                            fontSize: '0.75rem',
                            color: '#6b7280',
                            marginBottom: '1rem',
                            lineHeight: '1.4'
                          }}>
                            {template.description}
                          </p>
                        )}

                        {/* Content Preview */}
                        <div style={{
                          background: '#f9fafb',
                          borderRadius: '0.5rem',
                          padding: '0.75rem',
                          marginBottom: '1rem',
                          border: '1px solid #e5e7eb'
                        }}>
                          <div style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: '#111827',
                            marginBottom: '0.25rem'
                          }}>
                            {template.title}
                          </div>
                          <div style={{
                            fontSize: '0.75rem',
                            color: '#6b7280',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical'
                          }}>
                            {template.body}
                          </div>
                        </div>

                        {/* Variables Info */}
                        {template.variables && template.variables.length > 0 && (
                          <div style={{ marginBottom: '1rem' }}>
                            <div style={{
                              fontSize: '0.65rem',
                              fontWeight: 600,
                              color: '#6b7280',
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                              marginBottom: '0.5rem'
                            }}>
                              Variabili:
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                              {template.variables.map((v: any, idx: number) => (
                                <span
                                  key={idx}
                                  style={{
                                    fontSize: '0.65rem',
                                    background: '#f3f4f6',
                                    color: '#374151',
                                    padding: '0.125rem 0.5rem',
                                    borderRadius: '0.25rem',
                                    fontFamily: 'monospace'
                                  }}
                                >
                                  {`{{${v.name}}}`}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Usage Stats */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                          <div style={{ fontSize: '0.65rem', color: '#9ca3af' }}>
                            Usato {template.usage_count || 0} volte
                          </div>
                          <div style={{ fontSize: '0.65rem', color: '#9ca3af' }}>
                            {new Date(template.created_at).toLocaleDateString('it-IT')}
                          </div>
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '1rem', borderTop: '1px solid #f3f4f6' }}>
                          <button
                            onClick={() => handleUseTemplate(template)}
                            style={{
                              flex: 1,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.5rem',
                              padding: '0.625rem',
                              background: categoryColor,
                              color: 'white',
                              border: 'none',
                              borderRadius: '0.5rem',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                          >
                            <Zap size={14} />
                            Usa Template
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDuplicateTemplate(template)
                            }}
                            style={{
                              padding: '0.625rem',
                              background: '#f3f4f6',
                              border: 'none',
                              borderRadius: '0.5rem',
                              cursor: 'pointer',
                              color: '#6b7280',
                              transition: 'all 0.2s'
                            }}
                            title="Duplica"
                          >
                            <Copy size={14} />
                          </button>
                          {!template.is_predefined && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteTemplate(template.id)
                              }}
                              style={{
                                padding: '0.625rem',
                                background: '#fef2f2',
                                border: 'none',
                                borderRadius: '0.5rem',
                                cursor: 'pointer',
                                color: '#ef4444',
                                transition: 'all 0.2s'
                              }}
                              title="Elimina"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )
      }

      case 'analytics': {
        return (
          <div className="push-hub-view">
            <button
              onClick={() => setViewMode('hub')}
              className="push-back-button"
              style={{ marginBottom: '1rem' }}
            >
              <ArrowLeft size={20} />
              <span>Torna all'Hub</span>
            </button>
            <div className="push-hub-empty">
              <BarChart3 size={64} />
              <h3>Analytics & Insights</h3>
              <p>Dashboard completa con metriche di performance in tempo reale</p>
              <div className="mt-4 grid grid-cols-4 gap-3 max-w-3xl">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">89.2%</p>
                  <p className="text-xs text-gray-600 mt-1">Delivery Rate</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">34.5%</p>
                  <p className="text-xs text-gray-600 mt-1">Open Rate</p>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">12.8%</p>
                  <p className="text-xs text-gray-600 mt-1">Click Rate</p>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <p className="text-2xl font-bold text-orange-600">4.2%</p>
                  <p className="text-xs text-gray-600 mt-1">Conversion</p>
                </div>
              </div>
              <span className="push-hub-coming-soon">Coming Soon</span>
            </div>
          </div>
        )
      }

      case 'settings': {
        return (
          <div className="push-hub-view">
            <button
              onClick={() => setViewMode('hub')}
              className="push-back-button"
              style={{ marginBottom: '1rem' }}
            >
              <ArrowLeft size={20} />
              <span>Torna all'Hub</span>
            </button>
            <div className="push-hub-empty">
              <Settings size={64} />
              <h3>Impostazioni Push</h3>
              <p>Configura Firebase, VAPID keys, e impostazioni avanzate di notifica</p>
              <div className="mt-4 space-y-2 text-left max-w-md">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">Firebase Cloud Messaging</span>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Connesso</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">VAPID Keys</span>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Configurato</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">Service Worker</span>
                  <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">Da testare</span>
                </div>
              </div>
              <span className="push-hub-coming-soon">Coming Soon</span>
            </div>
          </div>
        )
      }

      default:
        return renderHubView()
    }
  }

  return (
    <div
      className="push-notifications-hub"
      style={{
        '--primary-color': primaryColor,
        '--secondary-color': secondaryColor
      } as React.CSSProperties}
    >
      {renderContent()}
    </div>
  )
}

export default PushNotificationsHub
