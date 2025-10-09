import React, { useState, useEffect } from 'react'
import { Settings, Save, Send, CheckCircle, AlertTriangle } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useToast } from '../../hooks/useToast'

interface EmailSettings {
  id: string
  organization_id: string | null
  resend_api_key: string | null
  from_name: string
  from_email: string
  reply_to_email: string | null
  logo_url: string | null
  primary_color: string
  secondary_color: string
  enabled: boolean
  daily_limit: number
  emails_sent_today: number
  last_reset_date: string
}

const EmailSettingsManager: React.FC = () => {
  const [settings, setSettings] = useState<EmailSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [testEmail, setTestEmail] = useState('')
  const { showSuccess, showError, showWarning } = useToast()

  const [formData, setFormData] = useState({
    from_name: 'Omnily PRO',
    from_email: 'onboarding@resend.dev',
    reply_to_email: '',
    primary_color: '#3b82f6',
    secondary_color: '#1e40af',
    enabled: true,
    daily_limit: 1000,
    resend_api_key: ''
  })

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    setIsLoading(true)
    try {
      // Carica settings globali (organization_id = NULL)
      const { data, error } = await supabase
        .from('email_settings')
        .select('*')
        .is('organization_id', null)
        .single()

      if (error) throw error

      if (data) {
        setSettings(data)
        setFormData({
          from_name: data.from_name,
          from_email: data.from_email,
          reply_to_email: data.reply_to_email || '',
          primary_color: data.primary_color,
          secondary_color: data.secondary_color,
          enabled: data.enabled,
          daily_limit: data.daily_limit,
          resend_api_key: data.resend_api_key || ''
        })
      }
    } catch (error) {
      console.error('Error loading settings:', error)
      showError('Errore nel caricamento delle impostazioni')
    } finally {
      setIsLoading(false)
    }
  }

  const saveSettings = async () => {
    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('email_settings')
        .update({
          from_name: formData.from_name,
          from_email: formData.from_email,
          reply_to_email: formData.reply_to_email || null,
          primary_color: formData.primary_color,
          secondary_color: formData.secondary_color,
          enabled: formData.enabled,
          daily_limit: formData.daily_limit,
          resend_api_key: formData.resend_api_key || null
        })
        .is('organization_id', null)

      if (error) throw error

      showSuccess('Impostazioni salvate con successo!')
      await loadSettings()
    } catch (error: any) {
      console.error('Error saving settings:', error)
      showError(`Errore: ${error?.message || 'Impossibile salvare'}`)
    } finally {
      setIsSaving(false)
    }
  }

  const sendTestEmail = async () => {
    if (!testEmail) {
      showWarning('Inserisci un indirizzo email per il test')
      return
    }

    setIsTesting(true)
    try {
      // Ottieni organization_id per il test
      const { data: orgs } = await supabase
        .from('organizations')
        .select('id')
        .limit(1)
        .single()

      if (!orgs) {
        showError('Nessuna organizzazione trovata per il test')
        return
      }

      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          organization_id: orgs.id,
          template_type: 'receipt',
          to_email: testEmail,
          to_name: 'Test User',
          dynamic_data: {
            store_name: 'Negozio Test',
            receipt_number: 'TEST-001',
            timestamp: new Date().toLocaleString('it-IT'),
            total: '99.99',
            items_html: '<div>Prodotto Test - €99.99</div>'
          }
        }
      })

      if (error) throw error

      showSuccess(`✅ Email di test inviata a ${testEmail}!`)
      setTestEmail('')
    } catch (error: any) {
      console.error('Error sending test email:', error)
      showError(`Errore: ${error?.message || 'Impossibile inviare email di test'}`)
    } finally {
      setIsTesting(false)
    }
  }

  if (isLoading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <p style={{ color: '#6b7280' }}>Caricamento...</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '24px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <Settings size={24} style={{ color: '#3b82f6' }} />
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#111827' }}>
          Configurazione Email Globale
        </h3>
      </div>

      {/* Status Badge */}
      {settings && (
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          backgroundColor: settings.enabled ? '#d1fae5' : '#fee2e2',
          color: settings.enabled ? '#065f46' : '#991b1b',
          borderRadius: '6px',
          marginBottom: '24px',
          fontSize: '14px',
          fontWeight: '500'
        }}>
          {settings.enabled ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
          {settings.enabled ? 'Servizio Attivo' : 'Servizio Disattivato'}
          <span style={{ marginLeft: '12px', opacity: 0.8 }}>
            {settings.emails_sent_today}/{settings.daily_limit} email oggi
          </span>
        </div>
      )}

      {/* Form */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
        {/* Resend API Key */}
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
            Resend API Key *
          </label>
          <input
            type="password"
            value={formData.resend_api_key}
            onChange={(e) => setFormData({ ...formData, resend_api_key: e.target.value })}
            placeholder="re_xxxxxxxxxxxxx"
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              fontFamily: 'monospace'
            }}
          />
          <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0 0 0' }}>
            Ottieni la tua API Key da <a href="https://resend.com/api-keys" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6' }}>resend.com</a>
          </p>
        </div>

        {/* From Name */}
        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
            Nome Mittente
          </label>
          <input
            type="text"
            value={formData.from_name}
            onChange={(e) => setFormData({ ...formData, from_name: e.target.value })}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px'
            }}
          />
        </div>

        {/* From Email */}
        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
            Email Mittente
          </label>
          <input
            type="email"
            value={formData.from_email}
            onChange={(e) => setFormData({ ...formData, from_email: e.target.value })}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px'
            }}
          />
        </div>

        {/* Reply To */}
        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
            Reply-To Email (opzionale)
          </label>
          <input
            type="email"
            value={formData.reply_to_email}
            onChange={(e) => setFormData({ ...formData, reply_to_email: e.target.value })}
            placeholder="support@example.com"
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px'
            }}
          />
        </div>

        {/* Daily Limit */}
        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
            Limite Giornaliero
          </label>
          <input
            type="number"
            value={formData.daily_limit}
            onChange={(e) => setFormData({ ...formData, daily_limit: parseInt(e.target.value) || 1000 })}
            min="1"
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px'
            }}
          />
        </div>

        {/* Primary Color */}
        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
            Colore Primario
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="color"
              value={formData.primary_color}
              onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
              style={{ width: '60px', height: '42px', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer' }}
            />
            <input
              type="text"
              value={formData.primary_color}
              onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
              style={{ flex: 1, padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
            />
          </div>
        </div>

        {/* Secondary Color */}
        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
            Colore Secondario
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="color"
              value={formData.secondary_color}
              onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
              style={{ width: '60px', height: '42px', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer' }}
            />
            <input
              type="text"
              value={formData.secondary_color}
              onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
              style={{ flex: 1, padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
            />
          </div>
        </div>

        {/* Enabled Toggle */}
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={formData.enabled}
              onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
              Abilita servizio email
            </span>
          </label>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '12px', paddingTop: '20px', borderTop: '1px solid #e5e7eb' }}>
        <button
          onClick={saveSettings}
          disabled={isSaving}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            backgroundColor: isSaving ? '#9ca3af' : '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: isSaving ? 'not-allowed' : 'pointer'
          }}
        >
          <Save size={16} />
          {isSaving ? 'Salvataggio...' : 'Salva Impostazioni'}
        </button>
      </div>

      {/* Test Email Section */}
      <div style={{ marginTop: '32px', padding: '20px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
        <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600', color: '#111827' }}>
          🧪 Test Invio Email
        </h4>
        <div style={{ display: 'flex', gap: '12px' }}>
          <input
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="tuaemail@example.com"
            style={{
              flex: 1,
              padding: '10px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px'
            }}
          />
          <button
            onClick={sendTestEmail}
            disabled={isTesting || !testEmail}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              backgroundColor: (isTesting || !testEmail) ? '#9ca3af' : '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: (isTesting || !testEmail) ? 'not-allowed' : 'pointer'
            }}
          >
            <Send size={16} />
            {isTesting ? 'Invio...' : 'Invia Test'}
          </button>
        </div>
        <p style={{ fontSize: '12px', color: '#6b7280', margin: '8px 0 0 0' }}>
          Invia un'email di test con il template scontrino predefinito
        </p>
      </div>
    </div>
  )
}

export default EmailSettingsManager
