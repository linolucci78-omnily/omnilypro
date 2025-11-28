import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { CreditCard, Key, CheckCircle2, AlertTriangle, Copy, Check, Loader, Save, RefreshCw, Shield } from 'lucide-react'
import { useToast } from '../../contexts/ToastContext'
import './StripeConfigDashboard.css'

interface StripeConfig {
  id: string
  stripe_publishable_key: string | null
  stripe_secret_key: string | null
  stripe_webhook_secret: string | null
  mode: 'test' | 'live'
  enabled: boolean
  webhook_url: string | null
  configured_at: string
  updated_at: string
  notes: string | null
}

const StripeConfigDashboard: React.FC = () => {
  const { showSuccess, showError, showWarning } = useToast()
  const [config, setConfig] = useState<StripeConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testingConnection, setTestingConnection] = useState(false)
  const [connectionSuccess, setConnectionSuccess] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  // Form state
  const [publishableKey, setPublishableKey] = useState('')
  const [secretKey, setSecretKey] = useState('')
  const [webhookSecret, setWebhookSecret] = useState('')
  const [mode, setMode] = useState<'test' | 'live'>('test')
  const [enabled, setEnabled] = useState(false)
  const [notes, setNotes] = useState('')

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from('stripe_config')
        .select('*')
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
        console.error('Error loading config:', error)
        // Non mostrare alert, solo logga l'errore
        setLoading(false)
        return
      }

      if (data) {
        setConfig(data)
        setPublishableKey(data.stripe_publishable_key || '')
        setSecretKey(data.stripe_secret_key || '')
        setWebhookSecret(data.stripe_webhook_secret || '')
        setMode(data.mode)
        setEnabled(data.enabled)
        setNotes(data.notes || '')
      }

      setLoading(false)
    } catch (err: any) {
      console.error('Error loading config:', err)
      // Non mostrare alert per non bloccare, solo logga
      setLoading(false)
    }
  }

  const saveConfig = async () => {
    try {
      setSaving(true)

      // Generate webhook URL
      const { data: { url: supabaseUrl } } = await supabase.auth.getSession()
      const baseUrl = supabaseUrl?.split('/auth')[0] || ''
      const webhookUrl = `${baseUrl}/functions/v1/stripe-webhook`

      const configData = {
        stripe_publishable_key: publishableKey || null,
        stripe_secret_key: secretKey || null,
        stripe_webhook_secret: webhookSecret || null,
        mode,
        enabled,
        webhook_url: webhookUrl,
        notes: notes || null,
        configured_by: (await supabase.auth.getUser()).data.user?.id
      }

      if (config) {
        // Update existing
        const { error } = await supabase
          .from('stripe_config')
          .update(configData)
          .eq('id', config.id)

        if (error) throw error
      } else {
        // Insert new
        const { error } = await supabase
          .from('stripe_config')
          .insert([configData])

        if (error) throw error
      }

      // Also update Supabase secrets
      if (secretKey && webhookSecret) {
        console.log('⚠️ IMPORTANTE: Devi anche aggiornare i secrets in Supabase:')
        console.log(`supabase secrets set STRIPE_SECRET_KEY=${secretKey}`)
        console.log(`supabase secrets set STRIPE_WEBHOOK_SECRET=${webhookSecret}`)
      }

      showSuccess('Configurazione salvata', 'Le impostazioni Stripe sono state aggiornate con successo')
      await loadConfig()
      setSaving(false)
    } catch (err: any) {
      console.error('Error saving config:', err)
      showError('Errore salvataggio', err.message || 'Si è verificato un errore durante il salvataggio')
      setSaving(false)
    }
  }

  const testConnection = async () => {
    if (!secretKey) {
      showWarning('Chiave mancante', 'Inserisci prima la Secret Key')
      return
    }

    try {
      setTestingConnection(true)
      setConnectionSuccess(false)

      // Test connessione chiamando Stripe API
      const response = await fetch('https://api.stripe.com/v1/balance', {
        headers: {
          'Authorization': `Bearer ${secretKey}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setConnectionSuccess(true)
        // Mantieni il successo visibile per 5 secondi
        setTimeout(() => setConnectionSuccess(false), 5000)
      } else {
        const error = await response.json()
        throw new Error(error.error?.message || 'Errore connessione Stripe')
      }

      setTestingConnection(false)
    } catch (err: any) {
      console.error('Test connection error:', err)
      showError('Test fallito', err.message || 'Impossibile connettersi a Stripe. Verifica la Secret Key.')
      setTestingConnection(false)
      setConnectionSuccess(false)
    }
  }

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (err) {
      console.error('Copy failed:', err)
    }
  }

  const webhookUrl = config?.webhook_url || `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-webhook`

  if (loading) {
    return (
      <div className="stripe-config-loading">
        <Loader size={48} className="spinner" />
        <p>Caricamento configurazione...</p>
      </div>
    )
  }

  return (
    <div className="stripe-config-dashboard">

      {/* Header */}
      <div className="stripe-config-header">
        <div className="header-left">
          <CreditCard size={32} color="#635bff" />
          <div>
            <h1>Configurazione Stripe</h1>
            <p>Gestisci le API keys e le impostazioni di pagamento</p>
          </div>
        </div>
        <div className="header-right">
          {enabled ? (
            <div className="status-badge status-active">
              <CheckCircle2 size={16} />
              Attivo
            </div>
          ) : (
            <div className="status-badge status-inactive">
              <AlertTriangle size={16} />
              Non Attivo
            </div>
          )}
        </div>
      </div>

      {/* Mode Selection */}
      <div className="config-card">
        <h3>Modalità</h3>
        <div className="mode-selector">
          <button
            className={`mode-btn ${mode === 'test' ? 'active' : ''}`}
            onClick={() => setMode('test')}
          >
            <div className="mode-icon">
              <Shield size={28} color={mode === 'test' ? '#635bff' : '#9ca3af'} />
            </div>
            <div>
              <div className="mode-title">Test Mode</div>
              <div className="mode-desc">Per sviluppo e testing</div>
            </div>
          </button>
          <button
            className={`mode-btn ${mode === 'live' ? 'active' : ''}`}
            onClick={() => setMode('live')}
          >
            <div className="mode-icon">
              <CheckCircle2 size={28} color={mode === 'live' ? '#635bff' : '#9ca3af'} />
            </div>
            <div>
              <div className="mode-title">Live Mode</div>
              <div className="mode-desc">Produzione - pagamenti reali</div>
            </div>
          </button>
        </div>
      </div>

      {/* API Keys */}
      <div className="config-card">
        <h3>
          <Key size={20} />
          API Keys {mode === 'test' ? '(Test)' : '(Live)'}
        </h3>

        <div className="form-group">
          <label>Publishable Key</label>
          <div className="input-with-icon">
            <input
              type="text"
              value={publishableKey}
              onChange={(e) => setPublishableKey(e.target.value)}
              placeholder={mode === 'test' ? 'pk_test_...' : 'pk_live_...'}
            />
            {publishableKey && (
              <button
                className="copy-btn"
                onClick={() => copyToClipboard(publishableKey, 'publishable')}
              >
                {copiedField === 'publishable' ? <Check size={16} /> : <Copy size={16} />}
              </button>
            )}
          </div>
          <small>Usata nel frontend - visibile al pubblico</small>
        </div>

        <div className="form-group">
          <label>Secret Key</label>
          <div className="input-with-icon">
            <input
              type="password"
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              placeholder={mode === 'test' ? 'sk_test_...' : 'sk_live_...'}
            />
            {secretKey && (
              <button
                className="copy-btn"
                onClick={() => copyToClipboard(secretKey, 'secret')}
              >
                {copiedField === 'secret' ? <Check size={16} /> : <Copy size={16} />}
              </button>
            )}
          </div>
          <small>⚠️ MANTIENI SEGRETA - usata nelle Edge Functions</small>
        </div>

        <button
          className="test-btn"
          onClick={testConnection}
          disabled={!secretKey || testingConnection}
        >
          {testingConnection ? (
            <>
              <Loader size={16} className="spinner" />
              Testing...
            </>
          ) : (
            <>
              <RefreshCw size={16} />
              Test Connessione
            </>
          )}
        </button>

        {/* Success Message */}
        {connectionSuccess && (
          <div style={{
            marginTop: '1rem',
            padding: '1rem',
            background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
            borderRadius: '8px',
            border: '2px solid #6ee7b7',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            animation: 'fadeIn 0.3s ease-out'
          }}>
            <CheckCircle2 size={24} color="#059669" />
            <div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#065f46' }}>
                Connessione Stripe riuscita
              </div>
              <div style={{ fontSize: '14px', color: '#047857', marginTop: '0.25rem' }}>
                Le tue chiavi API sono valide e funzionanti
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Webhook Configuration */}
      <div className="config-card">
        <h3>Webhook Configuration</h3>

        <div className="webhook-url-box">
          <label>Webhook URL (copia questo in Stripe Dashboard)</label>
          <div className="webhook-url">
            <code>{webhookUrl}</code>
            <button
              className="copy-btn"
              onClick={() => copyToClipboard(webhookUrl, 'webhook_url')}
            >
              {copiedField === 'webhook_url' ? <Check size={16} /> : <Copy size={16} />}
            </button>
          </div>
        </div>

        <div className="form-group">
          <label>Webhook Signing Secret</label>
          <div className="input-with-icon">
            <input
              type="password"
              value={webhookSecret}
              onChange={(e) => setWebhookSecret(e.target.value)}
              placeholder="whsec_..."
            />
            {webhookSecret && (
              <button
                className="copy-btn"
                onClick={() => copyToClipboard(webhookSecret, 'webhook_secret')}
              >
                {copiedField === 'webhook_secret' ? <Check size={16} /> : <Copy size={16} />}
              </button>
            )}
          </div>
          <small>Ottienilo da Stripe Dashboard dopo aver creato il webhook endpoint</small>
        </div>

        <div className="webhook-events">
          <label>Eventi da configurare in Stripe:</label>
          <ul>
            <li><code>checkout.session.completed</code></li>
            <li><code>customer.subscription.updated</code></li>
            <li><code>customer.subscription.deleted</code></li>
            <li><code>invoice.payment_failed</code></li>
          </ul>
        </div>
      </div>

      {/* Notes */}
      <div className="config-card">
        <h3>Note</h3>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Note sulla configurazione..."
          rows={3}
        />
      </div>

      {/* Enable/Disable */}
      <div className="config-card">
        <div className="enable-section">
          <div>
            <h3>Abilita Stripe</h3>
            <p>Quando abilitato, i pagamenti saranno processati tramite Stripe</p>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
      </div>

      {/* Save Button */}
      <div className="config-actions">
        <button
          className="save-btn"
          onClick={saveConfig}
          disabled={saving || !publishableKey || !secretKey}
        >
          {saving ? (
            <>
              <Loader size={18} className="spinner" />
              Salvataggio...
            </>
          ) : (
            <>
              <Save size={18} />
              Salva Configurazione
            </>
          )}
        </button>
      </div>

      {/* Last Updated */}
      {config && (
        <div className="config-footer">
          <small>
            Ultima modifica: {new Date(config.updated_at).toLocaleString('it-IT')}
          </small>
        </div>
      )}

    </div>
  )
}

export default StripeConfigDashboard
