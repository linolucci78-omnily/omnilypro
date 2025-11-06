import React, { useState, useEffect } from 'react'
import { Mail, Save, CheckCircle, AlertCircle, Gift, Award, Cake } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useToast } from '../../hooks/useToast'

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

interface EmailAutomationsManagerProps {
  organizationId: string
}

const EmailAutomationsManager: React.FC<EmailAutomationsManagerProps> = ({ organizationId }) => {
  const [automations, setAutomations] = useState<EmailAutomation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const { showSuccess, showError } = useToast()

  // Stati form per ogni tipo di automazione
  const [welcomeEnabled, setWelcomeEnabled] = useState(false)
  const [tierUpgradeEnabled, setTierUpgradeEnabled] = useState(false)
  const [birthdayEnabled, setBirthdayEnabled] = useState(false)

  useEffect(() => {
    loadAutomations()
  }, [organizationId])

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

    } catch (error) {
      console.error('Error loading automations:', error)
      showError('Errore nel caricamento delle automazioni email')
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
          description: 'Inviata quando un cliente sale di tier/livello fedeltà',
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

      showSuccess('Automazioni email create con successo!')
      await loadAutomations()
    } catch (error: any) {
      console.error('Error creating automations:', error)
      showError(`Errore: ${error?.message || 'Impossibile creare automazioni'}`)
    } finally {
      setIsSaving(false)
    }
  }

  const toggleAutomation = async (automationType: string, enabled: boolean) => {
    setIsSaving(true)
    try {
      const automation = automations.find(a => a.automation_type === automationType)

      if (!automation) {
        showError('Automazione non trovata. Crea prima le automazioni.')
        return
      }

      const { error } = await supabase
        .from('email_automations')
        .update({ enabled })
        .eq('id', automation.id)

      if (error) throw error

      showSuccess(`Automazione ${enabled ? 'attivata' : 'disattivata'} con successo!`)
      await loadAutomations()
    } catch (error: any) {
      console.error('Error toggling automation:', error)
      showError(`Errore: ${error?.message || 'Impossibile modificare'}`)
    } finally {
      setIsSaving(false)
    }
  }

  const getAutomationIcon = (type: string) => {
    switch (type) {
      case 'welcome':
        return <Mail size={20} />
      case 'tier_upgrade':
        return <Award size={20} />
      case 'birthday':
        return <Cake size={20} />
      default:
        return <Gift size={20} />
    }
  }

  const getAutomationStats = (automation: EmailAutomation) => {
    const successRate = automation.total_sent > 0
      ? ((automation.total_sent - automation.total_failed) / automation.total_sent * 100).toFixed(1)
      : '0.0'

    return {
      total: automation.total_sent,
      success: automation.total_sent - automation.total_failed,
      failed: automation.total_failed,
      opened: automation.total_opened,
      clicked: automation.total_clicked,
      successRate
    }
  }

  if (isLoading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <p style={{ color: '#6b7280' }}>Caricamento...</p>
      </div>
    )
  }

  // Se non ci sono automazioni, mostra pulsante per crearle
  if (automations.length === 0) {
    return (
      <div style={{ padding: '24px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e5e7eb', textAlign: 'center' }}>
        <Mail size={48} style={{ color: '#9ca3af', marginBottom: '16px' }} />
        <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600', color: '#111827' }}>
          Nessuna automazione configurata
        </h3>
        <p style={{ color: '#6b7280', marginBottom: '24px' }}>
          Crea le automazioni email per inviare messaggi automatici ai tuoi clienti
        </p>
        <button
          onClick={createDefaultAutomations}
          disabled={isSaving}
          style={{
            padding: '12px 24px',
            backgroundColor: isSaving ? '#9ca3af' : '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: isSaving ? 'not-allowed' : 'pointer'
          }}
        >
          {isSaving ? 'Creazione...' : 'Crea Automazioni Email'}
        </button>
      </div>
    )
  }

  return (
    <div style={{ padding: '24px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <Mail size={24} style={{ color: '#3b82f6' }} />
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#111827' }}>
          Automazioni Email
        </h3>
      </div>

      <p style={{ color: '#6b7280', marginBottom: '24px', fontSize: '14px' }}>
        Gestisci l'invio automatico di email ai tuoi clienti per eventi specifici
      </p>

      {/* Automation Cards */}
      <div style={{ display: 'grid', gap: '16px' }}>
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
              style={{
                padding: '20px',
                backgroundColor: '#f9fafb',
                borderRadius: '8px',
                border: '1px solid #e5e7eb'
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '40px',
                    height: '40px',
                    backgroundColor: isEnabled ? '#dbeafe' : '#f3f4f6',
                    borderRadius: '8px',
                    color: isEnabled ? '#3b82f6' : '#9ca3af'
                  }}>
                    {getAutomationIcon(automation.automation_type)}
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '600', color: '#111827' }}>
                      {automation.name}
                    </h4>
                    <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>
                      {automation.description}
                    </p>
                  </div>
                </div>

                {/* Toggle Switch */}
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                  <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                    {isEnabled ? 'Attiva' : 'Disattiva'}
                  </span>
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
                    style={{ width: '18px', height: '18px', cursor: isSaving ? 'not-allowed' : 'pointer' }}
                  />
                  {isEnabled ? <CheckCircle size={18} style={{ color: '#10b981' }} /> : <AlertCircle size={18} style={{ color: '#9ca3af' }} />}
                </label>
              </div>

              {/* Statistics */}
              {stats.total > 0 && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(5, 1fr)',
                  gap: '12px',
                  marginTop: '16px',
                  paddingTop: '16px',
                  borderTop: '1px solid #e5e7eb'
                }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Inviate</div>
                    <div style={{ fontSize: '18px', fontWeight: '600', color: '#111827' }}>{stats.total}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Successo</div>
                    <div style={{ fontSize: '18px', fontWeight: '600', color: '#10b981' }}>{stats.success}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Fallite</div>
                    <div style={{ fontSize: '18px', fontWeight: '600', color: '#ef4444' }}>{stats.failed}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Aperte</div>
                    <div style={{ fontSize: '18px', fontWeight: '600', color: '#3b82f6' }}>{stats.opened}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Tasso</div>
                    <div style={{ fontSize: '18px', fontWeight: '600', color: '#8b5cf6' }}>{stats.successRate}%</div>
                  </div>
                </div>
              )}

              {/* Last Sent */}
              {automation.last_sent_at && (
                <div style={{ marginTop: '12px', fontSize: '12px', color: '#9ca3af' }}>
                  Ultima inviata: {new Date(automation.last_sent_at).toLocaleString('it-IT')}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Info Section */}
      <div style={{
        marginTop: '24px',
        padding: '16px',
        backgroundColor: '#eff6ff',
        borderRadius: '8px',
        border: '1px solid #bfdbfe'
      }}>
        <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600', color: '#1e40af', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={16} />
          Come funzionano le automazioni
        </h4>
        <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px', color: '#1e40af', fontSize: '13px', lineHeight: '1.6' }}>
          <li><strong>Email di Benvenuto:</strong> Inviata automaticamente quando un nuovo cliente si registra</li>
          <li><strong>Email Cambio Livello:</strong> Inviata quando un cliente raggiunge un nuovo tier di fedeltà</li>
          <li><strong>Email Compleanno:</strong> Inviata il giorno del compleanno del cliente (richiede cron job configurato)</li>
        </ul>
        <p style={{ margin: '12px 0 0 0', fontSize: '12px', color: '#6b7280' }}>
          📧 Le email utilizzano i template globali configurati nel sistema. Puoi personalizzarli per la tua organizzazione.
        </p>
      </div>
    </div>
  )
}

export default EmailAutomationsManager
