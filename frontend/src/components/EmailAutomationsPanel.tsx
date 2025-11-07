import React, { useState, useEffect } from 'react'
import { Mail, Save, CheckCircle, AlertCircle, Gift, Award, Cake, Clock, Send, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import './EmailAutomationsPanel.css'
import './CardManagementPanel.css'

interface EmailAutomation {
  id: string
  organization_id: string
  automation_type: 'welcome' | 'tier_upgrade' | 'birthday' | 'special_event'
  name: string
  description: string | null
  enabled: boolean
  template_id: string | null
  send_days_before: number
  send_time: string
  total_sent: number
  total_opened: number
  total_clicked: number
  total_failed: number
  last_sent_at: string | null
  created_at: string
  updated_at: string
}

interface EmailAutomationsPanelProps {
  isOpen: boolean
  onClose: () => void
  organizationId: string
  organizationName: string
}

const EmailAutomationsPanel: React.FC<EmailAutomationsPanelProps> = ({
  isOpen,
  onClose,
  organizationId,
  organizationName
}) => {
  const [automations, setAutomations] = useState<EmailAutomation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState<'success' | 'error'>('success')

  // Stati form per ogni tipo di automazione
  const [welcomeEnabled, setWelcomeEnabled] = useState(false)
  const [tierUpgradeEnabled, setTierUpgradeEnabled] = useState(false)
  const [birthdayEnabled, setBirthdayEnabled] = useState(false)

  useEffect(() => {
    if (isOpen && organizationId) {
      loadAutomations()
    }
  }, [isOpen, organizationId])

  const showToastMessage = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(message)
    setToastType(type)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 3000)
  }

  const loadAutomations = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('email_automations')
        .select('*')
        .eq('organization_id', organizationId)
        .order('automation_type')

      if (error) throw error

      setAutomations(data || [])

      // Inizializza gli stati toggle
      const welcome = data?.find(a => a.automation_type === 'welcome')
      const tierUpgrade = data?.find(a => a.automation_type === 'tier_upgrade')
      const birthday = data?.find(a => a.automation_type === 'birthday')

      setWelcomeEnabled(welcome?.enabled || false)
      setTierUpgradeEnabled(tierUpgrade?.enabled || false)
      setBirthdayEnabled(birthday?.enabled || false)

    } catch (error: any) {
      console.error('Error loading automations:', error)
      const errorMessage = error?.message || 'Errore nel caricamento delle automazioni'
      console.error('Detailed error:', errorMessage, error?.code, error?.details)
      showToastMessage(`Errore: ${errorMessage}`, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const createDefaultAutomations = async () => {
    setIsSaving(true)
    try {
      // Crea automazioni di default per questa organizzazione
      const defaultAutomations = [
        {
          organization_id: organizationId,
          automation_type: 'welcome',
          name: 'Email di Benvenuto',
          description: 'Inviata automaticamente quando un nuovo cliente si registra',
          enabled: true,
          send_days_before: 0,
          send_time: '09:00:00'
        },
        {
          organization_id: organizationId,
          automation_type: 'tier_upgrade',
          name: 'Email Cambio Livello',
          description: 'Inviata quando un cliente raggiunge un nuovo tier di fedeltà',
          enabled: true,
          send_days_before: 0,
          send_time: '09:00:00'
        },
        {
          organization_id: organizationId,
          automation_type: 'birthday',
          name: 'Email Compleanno',
          description: 'Inviata il giorno del compleanno del cliente',
          enabled: true,
          send_days_before: 0,
          send_time: '09:00:00'
        }
      ]

      const { error } = await supabase
        .from('email_automations')
        .insert(defaultAutomations)

      if (error) throw error

      showToastMessage('✅ Automazioni email create con successo!', 'success')
      await loadAutomations()
    } catch (error: any) {
      console.error('Error creating automations:', error)
      showToastMessage(`❌ Errore: ${error?.message || 'Impossibile creare'}`, 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const toggleAutomation = async (automationType: string, enabled: boolean) => {
    setIsSaving(true)
    try {
      const automation = automations.find(a => a.automation_type === automationType)

      if (!automation) {
        showToastMessage('❌ Automazione non trovata', 'error')
        return
      }

      const { error } = await supabase
        .from('email_automations')
        .update({ enabled })
        .eq('id', automation.id)

      if (error) throw error

      showToastMessage(
        enabled ? '✅ Automazione attivata!' : '⚠️ Automazione disattivata',
        'success'
      )
      await loadAutomations()
    } catch (error: any) {
      console.error('Error toggling automation:', error)
      showToastMessage(`❌ Errore: ${error?.message || 'Impossibile modificare'}`, 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const getAutomationIcon = (type: string) => {
    switch (type) {
      case 'welcome':
        return <Mail className="automation-icon" />
      case 'tier_upgrade':
        return <Award className="automation-icon" />
      case 'birthday':
        return <Cake className="automation-icon" />
      default:
        return <Gift className="automation-icon" />
    }
  }

  const getAutomationStats = (automation: EmailAutomation) => {
    const successRate = automation.total_sent > 0
      ? ((automation.total_sent - automation.total_failed) / automation.total_sent * 100).toFixed(1)
      : '0.0'

    const openRate = automation.total_sent > 0
      ? ((automation.total_opened / automation.total_sent) * 100).toFixed(1)
      : '0.0'

    const clickRate = automation.total_sent > 0
      ? ((automation.total_clicked / automation.total_sent) * 100).toFixed(1)
      : '0.0'

    return {
      total: automation.total_sent,
      success: automation.total_sent - automation.total_failed,
      failed: automation.total_failed,
      opened: automation.total_opened,
      clicked: automation.total_clicked,
      successRate,
      openRate,
      clickRate
    }
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
            <h2>Automazioni Email</h2>
            <p>{organizationName}</p>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="panel-content">
          {isLoading ? (
            <div className="email-automations-panel loading">
              <div className="loading-spinner"></div>
              <p>Caricamento automazioni...</p>
            </div>
          ) : automations.length === 0 ? (
            <div className="email-automations-panel">
              {/* Toast */}
              {showToast && (
                <div className={`toast toast-${toastType}`}>
                  {toastMessage}
                </div>
              )}

              <div className="empty-state">
                <Mail size={64} className="empty-icon" />
                <h3>Nessuna automazione configurata</h3>
                <p>Crea le automazioni email per inviare messaggi automatici ai tuoi clienti</p>
                <button
                  onClick={createDefaultAutomations}
                  disabled={isSaving}
                  className="btn-create-automations"
                >
                  {isSaving ? 'Creazione in corso...' : 'Crea Automazioni Email'}
                </button>
              </div>
            </div>
          ) : (
            <div className="email-automations-panel">
      {/* Toast */}
      {showToast && (
        <div className={`toast toast-${toastType}`}>
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <div className="panel-header">
        <div className="header-title">
          <Mail size={28} />
          <div>
            <h2>Automazioni Email</h2>
            <p>Gestisci l'invio automatico di email ai tuoi clienti</p>
          </div>
        </div>
      </div>

      {/* Automation Cards Grid */}
      <div className="automations-grid">
        {automations.map((automation) => {
          const stats = getAutomationStats(automation)
          const isEnabled =
            automation.automation_type === 'welcome' ? welcomeEnabled :
            automation.automation_type === 'tier_upgrade' ? tierUpgradeEnabled :
            automation.automation_type === 'birthday' ? birthdayEnabled :
            automation.enabled

          return (
            <div
              key={automation.id}
              className={`automation-card ${isEnabled ? 'enabled' : 'disabled'}`}
            >
              {/* Header */}
              <div className="card-header">
                <div className="card-info">
                  <div className={`icon-container ${isEnabled ? 'active' : ''}`}>
                    {getAutomationIcon(automation.automation_type)}
                  </div>
                  <div className="card-text">
                    <h3>{automation.name}</h3>
                    <p>{automation.description}</p>
                  </div>
                </div>

                {/* Toggle Switch - GRANDE per POS */}
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={isEnabled}
                    onChange={(e) => {
                      const newValue = e.target.checked
                      if (automation.automation_type === 'welcome') setWelcomeEnabled(newValue)
                      if (automation.automation_type === 'tier_upgrade') setTierUpgradeEnabled(newValue)
                      if (automation.automation_type === 'birthday') setBirthdayEnabled(newValue)
                      toggleAutomation(automation.automation_type, newValue)
                    }}
                    disabled={isSaving}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              {/* Status Badge */}
              <div className={`status-badge ${isEnabled ? 'active' : 'inactive'}`}>
                {isEnabled ? (
                  <>
                    <CheckCircle size={18} />
                    <span>Attiva</span>
                  </>
                ) : (
                  <>
                    <AlertCircle size={18} />
                    <span>Disattiva</span>
                  </>
                )}
              </div>

              {/* Statistics - Solo se ci sono email inviate */}
              {stats.total > 0 && (
                <div className="card-stats">
                  <div className="stat-item">
                    <Send size={16} />
                    <div className="stat-value">{stats.total}</div>
                    <div className="stat-label">Inviate</div>
                  </div>
                  <div className="stat-item success">
                    <CheckCircle size={16} />
                    <div className="stat-value">{stats.success}</div>
                    <div className="stat-label">Consegnate</div>
                  </div>
                  <div className="stat-item error">
                    <AlertCircle size={16} />
                    <div className="stat-value">{stats.failed}</div>
                    <div className="stat-label">Fallite</div>
                  </div>
                  <div className="stat-item opened">
                    <Mail size={16} />
                    <div className="stat-value">{stats.opened}</div>
                    <div className="stat-label">Aperte ({stats.openRate}%)</div>
                  </div>
                  <div className="stat-item clicked">
                    <Award size={16} />
                    <div className="stat-value">{stats.clicked}</div>
                    <div className="stat-label">Cliccate ({stats.clickRate}%)</div>
                  </div>
                </div>
              )}

              {/* Last Sent */}
              {automation.last_sent_at && (
                <div className="last-sent">
                  <Clock size={14} />
                  <span>Ultima: {new Date(automation.last_sent_at).toLocaleDateString('it-IT')}</span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Info Section */}
      <div className="info-section">
        <h4>
          <AlertCircle size={18} />
          Come funzionano le automazioni
        </h4>
        <ul>
          <li>
            <Mail size={16} />
            <strong>Email di Benvenuto:</strong> Inviata quando un nuovo cliente si registra
          </li>
          <li>
            <Award size={16} />
            <strong>Email Cambio Livello:</strong> Inviata quando un cliente sale di tier
          </li>
          <li>
            <Cake size={16} />
            <strong>Email Compleanno:</strong> Inviata il giorno del compleanno del cliente
          </li>
        </ul>
        <p className="info-note">
          📧 Le email utilizzano i template globali del sistema. Personalizzabili per la tua organizzazione.
        </p>
      </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default EmailAutomationsPanel
