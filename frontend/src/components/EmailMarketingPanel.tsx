import React, { useState, useEffect } from 'react'
import { X, Mail, Send, Settings, Eye, Database, FileText, CheckCircle, XCircle, Clock, BarChart, Megaphone, Plus, Users, TrendingUp } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useToast } from '../hooks/useToast'
import CreateCampaignWizard from './CreateCampaignWizard'
import './CardManagementPanel.css'

interface EmailLog {
  id: string
  organization_id: string | null
  template_type: string
  to_email: string
  to_name: string | null
  subject: string
  status: string
  error_message: string | null
  sent_at: string | null
  created_at: string
}

interface EmailTemplate {
  id: string
  organization_id: string | null
  template_type: string
  name: string
  subject: string
  html_body: string
  text_body: string | null
  variables: string[] | null
  is_active: boolean
  created_at: string
  updated_at: string
}

interface EmailCampaign {
  id: string
  organization_id: string
  name: string
  description: string | null
  template_id: string
  template_type: string
  subject: string
  status: string
  target_filter: any
  total_recipients: number
  sent_count: number
  failed_count: number
  delivered_count: number
  opened_count: number
  clicked_count: number
  scheduled_at: string | null
  started_at: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

interface EmailMarketingPanelProps {
  isOpen: boolean
  onClose: () => void
  organizationId: string
  organizationName: string
}

const EmailMarketingPanel: React.FC<EmailMarketingPanelProps> = ({
  isOpen,
  onClose,
  organizationId,
  organizationName
}) => {
  const [activeTab, setActiveTab] = useState<'logs' | 'templates' | 'campaigns' | 'settings'>('campaigns')
  const [logs, setLogs] = useState<EmailLog[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [isSendingTest, setIsSendingTest] = useState(false)
  const [testEmail, setTestEmail] = useState('')

  // Templates state
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null)
  const [templatesLoading, setTemplatesLoading] = useState(false)

  // Campaigns state
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([])
  const [campaignsLoading, setCampaignsLoading] = useState(false)
  const [showCreateCampaign, setShowCreateCampaign] = useState(false)

  // Settings state
  const [emailSettings, setEmailSettings] = useState<any>(null)
  const [settingsLoading, setSettingsLoading] = useState(false)
  const [settingsSaving, setSettingsSaving] = useState(false)

  const { showError, showSuccess } = useToast()

  useEffect(() => {
    if (isOpen && organizationId) {
      loadEmailLogs()
      loadTemplates()
      loadCampaigns()
      loadEmailSettings()
    }
  }, [isOpen, organizationId])

  const loadEmailLogs = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('email_logs')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      setLogs(data || [])
    } catch (error) {
      console.error('Error loading email logs:', error)
      showError('Errore nel caricamento dei log email')
    } finally {
      setIsLoading(false)
    }
  }

  const sendTestEmail = async () => {
    if (!testEmail) {
      showError('Inserisci un indirizzo email')
      return
    }

    setIsSendingTest(true)
    try {
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          organization_id: organizationId,
          template_type: 'receipt',
          to_email: testEmail,
          to_name: 'Cliente Test',
          dynamic_data: {
            store_name: organizationName,
            receipt_number: 'TEST-' + Date.now(),
            timestamp: new Date().toLocaleString('it-IT'),
            total: '99.99',
            items_html: '<div style="padding: 8px; border-bottom: 1px solid #e5e7eb;">Prodotto Test - €99.99</div>'
          }
        }
      })

      if (error) throw error

      showSuccess(`Email di test inviata a ${testEmail}!`)
      setTestEmail('')
      // Ricarica i log per mostrare la nuova email
      await loadEmailLogs()
    } catch (error: any) {
      console.error('Error sending test email:', error)
      showError(`Errore: ${error?.message || 'Impossibile inviare email di test'}`)
    } finally {
      setIsSendingTest(false)
    }
  }

  const loadTemplates = async () => {
    setTemplatesLoading(true)
    try {
      // Carica template globali (organization_id = NULL)
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .is('organization_id', null)
        .eq('is_active', true)
        .order('template_type')

      if (error) throw error
      setTemplates(data || [])

      // Seleziona il primo template di default
      if (data && data.length > 0 && !selectedTemplate) {
        setSelectedTemplate(data[0])
      }
    } catch (error) {
      console.error('Error loading templates:', error)
      showError('Errore nel caricamento dei template')
    } finally {
      setTemplatesLoading(false)
    }
  }

  const loadCampaigns = async () => {
    setCampaignsLoading(true)
    try {
      const { data, error } = await supabase
        .from('email_campaigns')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setCampaigns(data || [])
    } catch (error) {
      console.error('Error loading campaigns:', error)
      showError('Errore nel caricamento delle campagne')
    } finally {
      setCampaignsLoading(false)
    }
  }

  const loadEmailSettings = async () => {
    setSettingsLoading(true)
    try {
      // Carica settings per questa organizzazione o globali
      const { data, error } = await supabase
        .from('email_settings')
        .select('*')
        .eq('organization_id', organizationId)
        .single()

      if (error && error.code !== 'PGRST116') throw error

      // Se non ci sono settings specifiche, usa quelle globali come base
      if (!data) {
        const { data: globalData } = await supabase
          .from('email_settings')
          .select('*')
          .is('organization_id', null)
          .limit(1)
          .single()

        setEmailSettings(globalData || {
          from_name: organizationName,
          from_email: 'noreply@omnilypro.com',
          reply_to_email: '',
          primary_color: '#ef4444',
          secondary_color: '#dc2626',
          logo_url: '',
          enabled: true
        })
      } else {
        setEmailSettings(data)
      }
    } catch (error) {
      console.error('Error loading email settings:', error)
      showError('Errore nel caricamento delle impostazioni')
    } finally {
      setSettingsLoading(false)
    }
  }

  const saveEmailSettings = async () => {
    if (!emailSettings) return

    setSettingsSaving(true)
    try {
      const { data: existing } = await supabase
        .from('email_settings')
        .select('id')
        .eq('organization_id', organizationId)
        .single()

      if (existing) {
        // Update
        const { error } = await supabase
          .from('email_settings')
          .update({
            from_name: emailSettings.from_name,
            from_email: emailSettings.from_email,
            reply_to_email: emailSettings.reply_to_email,
            primary_color: emailSettings.primary_color,
            secondary_color: emailSettings.secondary_color,
            logo_url: emailSettings.logo_url,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id)

        if (error) throw error
      } else {
        // Insert
        const { error } = await supabase
          .from('email_settings')
          .insert({
            organization_id: organizationId,
            from_name: emailSettings.from_name,
            from_email: emailSettings.from_email,
            reply_to_email: emailSettings.reply_to_email,
            primary_color: emailSettings.primary_color,
            secondary_color: emailSettings.secondary_color,
            logo_url: emailSettings.logo_url,
            enabled: true,
            daily_limit: 1000,
            emails_sent_today: 0
          })

        if (error) throw error
      }

      showSuccess('Impostazioni salvate con successo!')
      await loadEmailSettings()
    } catch (error: any) {
      console.error('Error saving email settings:', error)
      showError(`Errore: ${error?.message || 'Impossibile salvare le impostazioni'}`)
    } finally {
      setSettingsSaving(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
      case 'delivered':
        return <CheckCircle size={16} style={{ color: '#10b981' }} />
      case 'failed':
      case 'bounced':
        return <XCircle size={16} style={{ color: '#ef4444' }} />
      case 'pending':
        return <Clock size={16} style={{ color: '#f59e0b' }} />
      default:
        return <Mail size={16} style={{ color: '#6b7280' }} />
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const filteredLogs = filterStatus === 'all'
    ? logs
    : logs.filter(log => log.status === filterStatus)

  const stats = {
    total: logs.length,
    sent: logs.filter(l => l.status === 'sent' || l.status === 'delivered').length,
    failed: logs.filter(l => l.status === 'failed' || l.status === 'bounced').length,
    pending: logs.filter(l => l.status === 'pending').length
  }

  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div className="card-management-overlay" onClick={onClose} />

      {/* Panel */}
      <div className={`card-management-panel ${isOpen ? 'open' : ''}`}>
        {/* Header */}
        <div className="card-management-header">
          <div className="header-info">
            <h2>Email Marketing</h2>
            <p>{organizationName}</p>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="mode-tabs">
          <button
            className={`mode-tab ${activeTab === 'campaigns' ? 'active' : ''}`}
            onClick={() => setActiveTab('campaigns')}
          >
            <Megaphone size={18} />
            Campagne
          </button>
          <button
            className={`mode-tab ${activeTab === 'logs' ? 'active' : ''}`}
            onClick={() => setActiveTab('logs')}
          >
            <Database size={18} />
            Log Email
          </button>
          <button
            className={`mode-tab ${activeTab === 'templates' ? 'active' : ''}`}
            onClick={() => setActiveTab('templates')}
          >
            <FileText size={18} />
            Template
          </button>
          <button
            className={`mode-tab ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <Settings size={18} />
            Impostazioni
          </button>
        </div>

        {/* Content */}
        <div className="panel-content">
          {activeTab === 'campaigns' && (
            <div className="list-mode">
              {/* Header con bottone Crea Campagna */}
              <div style={{ marginBottom: '24px' }}>
                <button
                  onClick={() => setShowCreateCampaign(true)}
                  style={{
                    width: '100%',
                    padding: '24px',
                    backgroundColor: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '20px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    minHeight: '80px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#dc2626'
                    e.currentTarget.style.transform = 'scale(1.02)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#ef4444'
                    e.currentTarget.style.transform = 'scale(1)'
                  }}
                >
                  <Plus size={28} />
                  Crea Nuova Campagna
                </button>
              </div>

              {/* Stats campagne - SOLO 3 CARD */}
              {campaigns.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                  <div style={{ padding: '16px', backgroundColor: '#dbeafe', borderRadius: '8px', textAlign: 'center', border: '2px solid #3b82f6' }}>
                    <div style={{ fontSize: '28px', fontWeight: '700', color: '#1e40af', marginBottom: '4px' }}>
                      {campaigns.length}
                    </div>
                    <div style={{ fontSize: '13px', color: '#1e40af', fontWeight: '500' }}>Campagne Totali</div>
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ flex: 1, padding: '16px', backgroundColor: '#d1fae5', borderRadius: '8px', textAlign: 'center', border: '2px solid #10b981' }}>
                      <div style={{ fontSize: '28px', fontWeight: '700', color: '#065f46', marginBottom: '4px' }}>
                        {campaigns.filter(c => c.status === 'completed').length}
                      </div>
                      <div style={{ fontSize: '13px', color: '#065f46', fontWeight: '500' }}>Completate</div>
                    </div>
                    <div style={{ flex: 1, padding: '16px', backgroundColor: '#e0e7ff', borderRadius: '8px', textAlign: 'center', border: '2px solid #6366f1' }}>
                      <div style={{ fontSize: '28px', fontWeight: '700', color: '#3730a3', marginBottom: '4px' }}>
                        {campaigns.reduce((sum, c) => sum + c.sent_count, 0)}
                      </div>
                      <div style={{ fontSize: '13px', color: '#3730a3', fontWeight: '500' }}>Email Inviate</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Lista Campagne */}
              {campaignsLoading ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6b7280' }}>
                  <Settings size={48} className="spinning" style={{ marginBottom: '12px', opacity: 0.3 }} />
                  <p style={{ margin: 0, fontSize: '16px', fontWeight: '500' }}>Caricamento campagne...</p>
                </div>
              ) : campaigns.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6b7280' }}>
                  <Megaphone size={64} style={{ marginBottom: '16px', opacity: 0.3 }} />
                  <p style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>Nessuna campagna creata</p>
                  <p style={{ margin: '8px 0 0 0', fontSize: '14px' }}>Clicca "Crea Nuova Campagna" per iniziare!</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {campaigns.map((campaign) => {
                    const statusColors: Record<string, { bg: string; border: string; text: string }> = {
                      draft: { bg: '#f3f4f6', border: '#d1d5db', text: '#6b7280' },
                      scheduled: { bg: '#e0e7ff', border: '#6366f1', text: '#3730a3' },
                      sending: { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' },
                      completed: { bg: '#d1fae5', border: '#10b981', text: '#065f46' },
                      failed: { bg: '#fee2e2', border: '#ef4444', text: '#991b1b' },
                      paused: { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' }
                    }

                    const statusColor = statusColors[campaign.status] || statusColors.draft
                    const progressPercent = campaign.total_recipients > 0
                      ? Math.round((campaign.sent_count / campaign.total_recipients) * 100)
                      : 0

                    return (
                      <div
                        key={campaign.id}
                        style={{
                          padding: '20px',
                          backgroundColor: 'white',
                          border: '2px solid #e5e7eb',
                          borderRadius: '12px',
                          transition: 'all 0.2s',
                          cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = '#3b82f6'
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.15)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = '#e5e7eb'
                          e.currentTarget.style.boxShadow = 'none'
                        }}
                      >
                        {/* Header Campagna */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                          <div style={{ flex: 1 }}>
                            <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: '700', color: '#111827' }}>
                              {campaign.name}
                            </h3>
                            {campaign.description && (
                              <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#6b7280' }}>
                                {campaign.description}
                              </p>
                            )}
                          </div>
                          <div
                            style={{
                              padding: '8px 16px',
                              backgroundColor: statusColor.bg,
                              border: `2px solid ${statusColor.border}`,
                              borderRadius: '8px',
                              fontSize: '14px',
                              fontWeight: '600',
                              color: statusColor.text,
                              textTransform: 'uppercase',
                              minWidth: '100px',
                              textAlign: 'center'
                            }}
                          >
                            {campaign.status === 'draft' && 'Bozza'}
                            {campaign.status === 'scheduled' && 'Programmata'}
                            {campaign.status === 'sending' && 'In Invio'}
                            {campaign.status === 'completed' && 'Completata'}
                            {campaign.status === 'failed' && 'Fallita'}
                            {campaign.status === 'paused' && 'In Pausa'}
                          </div>
                        </div>

                        {/* Stats Inline */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '16px' }}>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', fontWeight: '500' }}>Destinatari</div>
                            <div style={{ fontSize: '18px', fontWeight: '700', color: '#111827' }}>
                              <Users size={16} style={{ display: 'inline', marginRight: '4px' }} />
                              {campaign.total_recipients}
                            </div>
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', fontWeight: '500' }}>Inviate</div>
                            <div style={{ fontSize: '18px', fontWeight: '700', color: '#10b981' }}>
                              {campaign.sent_count}
                            </div>
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', fontWeight: '500' }}>Aperte</div>
                            <div style={{ fontSize: '18px', fontWeight: '700', color: '#3b82f6' }}>
                              {campaign.opened_count}
                            </div>
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', fontWeight: '500' }}>Click</div>
                            <div style={{ fontSize: '18px', fontWeight: '700', color: '#6366f1' }}>
                              {campaign.clicked_count}
                            </div>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        {campaign.total_recipients > 0 && (
                          <div style={{ marginBottom: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                              <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>Progresso</span>
                              <span style={{ fontSize: '12px', color: '#111827', fontWeight: '700' }}>{progressPercent}%</span>
                            </div>
                            <div style={{ width: '100%', height: '10px', backgroundColor: '#e5e7eb', borderRadius: '5px', overflow: 'hidden' }}>
                              <div
                                style={{
                                  width: `${progressPercent}%`,
                                  height: '100%',
                                  backgroundColor: campaign.status === 'completed' ? '#10b981' : '#3b82f6',
                                  transition: 'width 0.3s ease'
                                }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Footer Info */}
                        <div style={{ fontSize: '13px', color: '#9ca3af', fontWeight: '500', display: 'flex', justifyContent: 'space-between' }}>
                          <span>Oggetto: {campaign.subject}</span>
                          <span>{new Date(campaign.created_at).toLocaleDateString('it-IT')}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="list-mode">
              {/* Test Email Section */}
              <div style={{ marginBottom: '24px', padding: '20px', backgroundColor: '#f0f9ff', borderRadius: '12px', border: '2px solid #3b82f6' }}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '700', color: '#1e40af', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Send size={20} />
                  Invia Email di Test
                </h3>
                <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#1e40af' }}>
                  Testa l'invio email con il template scontrino
                </p>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <input
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="tuaemail@esempio.com"
                    style={{
                      flex: 1,
                      padding: '12px 16px',
                      border: '2px solid #3b82f6',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !isSendingTest) {
                        sendTestEmail()
                      }
                    }}
                  />
                  <button
                    onClick={sendTestEmail}
                    disabled={isSendingTest || !testEmail}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '12px 24px',
                      backgroundColor: (isSendingTest || !testEmail) ? '#9ca3af' : '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: (isSendingTest || !testEmail) ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <Send size={16} />
                    {isSendingTest ? 'Invio...' : 'Invia Test'}
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
                <div style={{ padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px', textAlign: 'center', border: '2px solid #e5e7eb' }}>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827', marginBottom: '4px' }}>{stats.total}</div>
                  <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>Totale</div>
                </div>
                <div style={{ padding: '16px', backgroundColor: '#d1fae5', borderRadius: '8px', textAlign: 'center', border: '2px solid #10b981' }}>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#065f46', marginBottom: '4px' }}>{stats.sent}</div>
                  <div style={{ fontSize: '12px', color: '#065f46', fontWeight: '500' }}>Inviate</div>
                </div>
                <div style={{ padding: '16px', backgroundColor: '#fee2e2', borderRadius: '8px', textAlign: 'center', border: '2px solid #ef4444' }}>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#991b1b', marginBottom: '4px' }}>{stats.failed}</div>
                  <div style={{ fontSize: '12px', color: '#991b1b', fontWeight: '500' }}>Fallite</div>
                </div>
                <div style={{ padding: '16px', backgroundColor: '#fef3c7', borderRadius: '8px', textAlign: 'center', border: '2px solid #f59e0b' }}>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#92400e', marginBottom: '4px' }}>{stats.pending}</div>
                  <div style={{ fontSize: '12px', color: '#92400e', fontWeight: '500' }}>In Attesa</div>
                </div>
              </div>

              {/* Filter */}
              <div style={{ marginBottom: '16px' }}>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    backgroundColor: 'white',
                    cursor: 'pointer'
                  }}
                >
                  <option value="all">Tutti gli stati</option>
                  <option value="sent">Inviate</option>
                  <option value="delivered">Consegnate</option>
                  <option value="failed">Fallite</option>
                  <option value="bounced">Rimbalzate</option>
                  <option value="pending">In Attesa</option>
                </select>
              </div>

              {/* Logs List */}
              <div className="assigned-cards-list">
                {isLoading ? (
                  <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6b7280' }}>
                    <Settings size={48} className="spinning" style={{ marginBottom: '12px', opacity: 0.3 }} />
                    <p style={{ margin: 0, fontSize: '14px', fontWeight: '500' }}>Caricamento...</p>
                  </div>
                ) : filteredLogs.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6b7280' }}>
                    <Mail size={48} style={{ marginBottom: '12px', opacity: 0.3 }} />
                    <p style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Nessuna email trovata</p>
                    <p style={{ margin: '8px 0 0 0', fontSize: '14px' }}>Non ci sono email {filterStatus !== 'all' ? `con stato "${filterStatus}"` : ''}</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {filteredLogs.map((log) => (
                      <div
                        key={log.id}
                        style={{
                          padding: '16px',
                          backgroundColor: 'white',
                          border: '2px solid #e5e7eb',
                          borderRadius: '12px',
                          transition: 'all 0.2s',
                          cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = '#3b82f6'
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.15)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = '#e5e7eb'
                          e.currentTarget.style.boxShadow = 'none'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '4px' }}>
                              {getStatusIcon(log.status)} {log.to_name || log.to_email}
                            </div>
                            <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
                              {log.to_email}
                            </div>
                          </div>
                          <div style={{ fontSize: '12px', color: '#9ca3af', fontWeight: '500', textAlign: 'right', minWidth: '100px' }}>
                            {formatDate(log.sent_at || log.created_at)}
                          </div>
                        </div>
                        <div style={{ fontSize: '14px', color: '#374151', marginBottom: '8px', padding: '8px 12px', backgroundColor: '#f9fafb', borderRadius: '6px' }}>
                          <strong style={{ color: '#111827' }}>Oggetto:</strong> {log.subject}
                        </div>
                        <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
                          <strong>Template:</strong> {log.template_type}
                        </div>
                        {log.error_message && (
                          <div style={{ fontSize: '13px', color: '#ef4444', marginTop: '12px', padding: '12px', backgroundColor: '#fee2e2', borderRadius: '6px', border: '1px solid #fecaca', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <XCircle size={16} />
                            {log.error_message}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'templates' && (
            <div className="list-mode">
              {templatesLoading ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6b7280' }}>
                  <Settings size={48} className="spinning" style={{ marginBottom: '12px', opacity: 0.3 }} />
                  <p style={{ margin: 0, fontSize: '16px', fontWeight: '500' }}>Caricamento template...</p>
                </div>
              ) : templates.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6b7280' }}>
                  <FileText size={64} style={{ marginBottom: '16px', opacity: 0.3 }} />
                  <p style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>Nessun template disponibile</p>
                </div>
              ) : (
                <div>
                  {/* Lista Template - Bottoni GRANDI per touch */}
                  <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#111827', marginBottom: '20px' }}>
                    Seleziona Template
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px', marginBottom: '30px' }}>
                    {templates.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => setSelectedTemplate(template)}
                        style={{
                          padding: '24px',
                          backgroundColor: selectedTemplate?.id === template.id ? '#eff6ff' : 'white',
                          border: selectedTemplate?.id === template.id ? '3px solid #3b82f6' : '2px solid #e5e7eb',
                          borderRadius: '12px',
                          cursor: 'pointer',
                          textAlign: 'left',
                          fontSize: '18px',
                          fontWeight: '600',
                          color: selectedTemplate?.id === template.id ? '#1e40af' : '#111827',
                          transition: 'all 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '16px',
                          minHeight: '80px'
                        }}
                      >
                        <FileText size={32} />
                        <div>
                          <div style={{ fontSize: '20px', marginBottom: '4px' }}>{template.name}</div>
                          <div style={{ fontSize: '14px', color: '#6b7280', fontWeight: '500' }}>
                            Tipo: {template.template_type}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Editor Template */}
                  {selectedTemplate && (
                    <div style={{ marginTop: '30px', padding: '24px', backgroundColor: '#f9fafb', borderRadius: '12px', border: '2px solid #e5e7eb' }}>
                      <h3 style={{ fontSize: '22px', fontWeight: '700', color: '#111827', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Eye size={28} />
                        Modifica: {selectedTemplate.name}
                      </h3>

                      {/* Oggetto Email - Campo GRANDE */}
                      <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', fontSize: '18px', fontWeight: '600', color: '#374151', marginBottom: '12px' }}>
                          Oggetto Email
                        </label>
                        <input
                          type="text"
                          defaultValue={selectedTemplate.subject}
                          style={{
                            width: '100%',
                            padding: '20px',
                            fontSize: '18px',
                            border: '2px solid #d1d5db',
                            borderRadius: '10px',
                            fontWeight: '500'
                          }}
                          placeholder="Inserisci oggetto email..."
                        />
                      </div>

                      {/* Variabili disponibili */}
                      {selectedTemplate.variables && selectedTemplate.variables.length > 0 && (
                        <div style={{ marginBottom: '24px', padding: '20px', backgroundColor: '#dbeafe', borderRadius: '10px', border: '2px solid #3b82f6' }}>
                          <h4 style={{ fontSize: '18px', fontWeight: '600', color: '#1e40af', margin: '0 0 12px 0' }}>
                            Variabili Disponibili
                          </h4>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                            {selectedTemplate.variables.map((variable) => (
                              <span
                                key={variable}
                                style={{
                                  padding: '10px 16px',
                                  backgroundColor: 'white',
                                  border: '2px solid #3b82f6',
                                  borderRadius: '8px',
                                  fontSize: '16px',
                                  fontWeight: '600',
                                  color: '#1e40af',
                                  fontFamily: 'monospace'
                                }}
                              >
                                {`{{${variable}}}`}
                              </span>
                            ))}
                          </div>
                          <p style={{ margin: '12px 0 0 0', fontSize: '14px', color: '#1e40af' }}>
                            Usa queste variabili nel tuo template per personalizzare le email
                          </p>
                        </div>
                      )}

                      {/* Preview HTML */}
                      <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', fontSize: '18px', fontWeight: '600', color: '#374151', marginBottom: '12px' }}>
                          Anteprima Template
                        </label>
                        <div
                          style={{
                            padding: '20px',
                            backgroundColor: 'white',
                            border: '2px solid #d1d5db',
                            borderRadius: '10px',
                            maxHeight: '400px',
                            overflowY: 'auto'
                          }}
                          dangerouslySetInnerHTML={{ __html: selectedTemplate.html_body }}
                        />
                      </div>

                      {/* Bottone Salva - GRANDE */}
                      <button
                        style={{
                          width: '100%',
                          padding: '24px',
                          backgroundColor: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '12px',
                          fontSize: '20px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '12px',
                          minHeight: '80px'
                        }}
                      >
                        <Settings size={28} />
                        Salva Modifiche
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="list-mode">
              {settingsLoading ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6b7280' }}>
                  <Settings size={48} className="spinning" style={{ marginBottom: '12px', opacity: 0.3 }} />
                  <p style={{ margin: 0, fontSize: '16px', fontWeight: '500' }}>Caricamento impostazioni...</p>
                </div>
              ) : !emailSettings ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6b7280' }}>
                  <Settings size={64} style={{ marginBottom: '16px', opacity: 0.3 }} />
                  <p style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>Impossibile caricare le impostazioni</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {/* Header Info */}
                  <div style={{ padding: '20px', backgroundColor: '#fef2f2', borderRadius: '12px', border: '2px solid #ef4444' }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: '700', color: '#991b1b', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Settings size={24} />
                      Configurazione Email Branding
                    </h3>
                    <p style={{ margin: 0, fontSize: '14px', color: '#991b1b', lineHeight: '1.5' }}>
                      Personalizza logo, colori e informazioni mittente per le email della tua organizzazione
                    </p>
                  </div>

                  {/* From Settings */}
                  <div style={{ padding: '20px', backgroundColor: 'white', borderRadius: '12px', border: '2px solid #e5e7eb' }}>
                    <h4 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '700', color: '#111827' }}>
                      Informazioni Mittente
                    </h4>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '16px', fontWeight: '600', color: '#374151', marginBottom: '10px' }}>
                          Nome Mittente *
                        </label>
                        <input
                          type="text"
                          value={emailSettings.from_name || ''}
                          onChange={(e) => setEmailSettings({ ...emailSettings, from_name: e.target.value })}
                          placeholder="Es: Omnily Negozio"
                          style={{
                            width: '100%',
                            padding: '16px',
                            fontSize: '16px',
                            border: '2px solid #d1d5db',
                            borderRadius: '8px',
                            fontWeight: '500',
                            minHeight: '60px'
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '16px', fontWeight: '600', color: '#374151', marginBottom: '10px' }}>
                          Email Mittente *
                        </label>
                        <input
                          type="email"
                          value={emailSettings.from_email || ''}
                          onChange={(e) => setEmailSettings({ ...emailSettings, from_email: e.target.value })}
                          placeholder="noreply@tuodominio.com"
                          style={{
                            width: '100%',
                            padding: '16px',
                            fontSize: '16px',
                            border: '2px solid #d1d5db',
                            borderRadius: '8px',
                            fontWeight: '500',
                            minHeight: '60px'
                          }}
                        />
                        <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#6b7280' }}>
                          ⚠️ Deve essere verificata su Resend
                        </p>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '16px', fontWeight: '600', color: '#374151', marginBottom: '10px' }}>
                          Email Risposta (opzionale)
                        </label>
                        <input
                          type="email"
                          value={emailSettings.reply_to_email || ''}
                          onChange={(e) => setEmailSettings({ ...emailSettings, reply_to_email: e.target.value })}
                          placeholder="info@tuodominio.com"
                          style={{
                            width: '100%',
                            padding: '16px',
                            fontSize: '16px',
                            border: '2px solid #d1d5db',
                            borderRadius: '8px',
                            fontWeight: '500',
                            minHeight: '60px'
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Branding Colors */}
                  <div style={{ padding: '20px', backgroundColor: 'white', borderRadius: '12px', border: '2px solid #e5e7eb' }}>
                    <h4 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '700', color: '#111827' }}>
                      Colori Brand
                    </h4>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '16px', fontWeight: '600', color: '#374151', marginBottom: '10px' }}>
                          Colore Primario
                        </label>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                          <input
                            type="color"
                            value={emailSettings.primary_color || '#ef4444'}
                            onChange={(e) => setEmailSettings({ ...emailSettings, primary_color: e.target.value })}
                            style={{
                              width: '80px',
                              height: '60px',
                              border: '2px solid #d1d5db',
                              borderRadius: '8px',
                              cursor: 'pointer'
                            }}
                          />
                          <input
                            type="text"
                            value={emailSettings.primary_color || '#ef4444'}
                            onChange={(e) => setEmailSettings({ ...emailSettings, primary_color: e.target.value })}
                            placeholder="#ef4444"
                            style={{
                              flex: 1,
                              padding: '16px',
                              fontSize: '16px',
                              border: '2px solid #d1d5db',
                              borderRadius: '8px',
                              fontWeight: '600',
                              fontFamily: 'monospace',
                              minHeight: '60px'
                            }}
                          />
                        </div>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '16px', fontWeight: '600', color: '#374151', marginBottom: '10px' }}>
                          Colore Secondario
                        </label>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                          <input
                            type="color"
                            value={emailSettings.secondary_color || '#dc2626'}
                            onChange={(e) => setEmailSettings({ ...emailSettings, secondary_color: e.target.value })}
                            style={{
                              width: '80px',
                              height: '60px',
                              border: '2px solid #d1d5db',
                              borderRadius: '8px',
                              cursor: 'pointer'
                            }}
                          />
                          <input
                            type="text"
                            value={emailSettings.secondary_color || '#dc2626'}
                            onChange={(e) => setEmailSettings({ ...emailSettings, secondary_color: e.target.value })}
                            placeholder="#dc2626"
                            style={{
                              flex: 1,
                              padding: '16px',
                              fontSize: '16px',
                              border: '2px solid #d1d5db',
                              borderRadius: '8px',
                              fontWeight: '600',
                              fontFamily: 'monospace',
                              minHeight: '60px'
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <p style={{ margin: '16px 0 0 0', fontSize: '13px', color: '#6b7280' }}>
                      Questi colori verranno usati nelle email per header, pulsanti e elementi di branding
                    </p>
                  </div>

                  {/* Logo URL */}
                  <div style={{ padding: '20px', backgroundColor: 'white', borderRadius: '12px', border: '2px solid #e5e7eb' }}>
                    <h4 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '700', color: '#111827' }}>
                      Logo
                    </h4>

                    <div>
                      <label style={{ display: 'block', fontSize: '16px', fontWeight: '600', color: '#374151', marginBottom: '10px' }}>
                        URL Logo (opzionale)
                      </label>
                      <input
                        type="url"
                        value={emailSettings.logo_url || ''}
                        onChange={(e) => setEmailSettings({ ...emailSettings, logo_url: e.target.value })}
                        placeholder="https://..."
                        style={{
                          width: '100%',
                          padding: '16px',
                          fontSize: '16px',
                          border: '2px solid #d1d5db',
                          borderRadius: '8px',
                          fontWeight: '500',
                          minHeight: '60px'
                        }}
                      />
                      <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#6b7280' }}>
                        Link pubblico al logo della tua organizzazione (es: da bucket IMG)
                      </p>

                      {emailSettings.logo_url && (
                        <div style={{ marginTop: '16px', padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px', textAlign: 'center' }}>
                          <p style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Anteprima:</p>
                          <img
                            src={emailSettings.logo_url}
                            alt="Logo preview"
                            style={{ maxWidth: '200px', maxHeight: '80px', objectFit: 'contain' }}
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Save Button - Touch Friendly */}
                  <button
                    onClick={saveEmailSettings}
                    disabled={settingsSaving}
                    style={{
                      width: '100%',
                      padding: '20px',
                      backgroundColor: settingsSaving ? '#9ca3af' : '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '18px',
                      fontWeight: '700',
                      cursor: settingsSaving ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '12px',
                      minHeight: '70px',
                      transition: 'all 0.2s'
                    }}
                  >
                    <Settings size={24} />
                    {settingsSaving ? 'Salvataggio...' : 'Salva Impostazioni'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create Campaign Wizard */}
      <CreateCampaignWizard
        isOpen={showCreateCampaign}
        onClose={() => setShowCreateCampaign(false)}
        organizationId={organizationId}
        organizationName={organizationName}
        onCampaignCreated={() => {
          loadCampaigns()
          setShowCreateCampaign(false)
        }}
      />
    </>
  )
}

export default EmailMarketingPanel
