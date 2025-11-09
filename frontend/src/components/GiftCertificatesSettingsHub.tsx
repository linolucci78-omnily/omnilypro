import React, { useState, useEffect } from 'react'
import {
  Gift,
  Mail,
  Shield,
  FileText,
  DollarSign,
  Calendar,
  AlertTriangle,
  Save,
  RefreshCw,
  Clock,
  Lock
} from 'lucide-react'
import { giftCertificatesService } from '../services/giftCertificatesService'
import './GiftCertificatesSettingsHub.css'

interface GiftCertificatesSettingsHubProps {
  organizationId: string
  organizationName: string
  primaryColor: string
  secondaryColor: string
  onBack: () => void
}

const GiftCertificatesSettingsHub: React.FC<GiftCertificatesSettingsHubProps> = ({
  organizationId,
  organizationName,
  primaryColor,
  secondaryColor,
  onBack
}) => {
  const [formData, setFormData] = useState({
    gc_enabled: true,
    gc_code_prefix: 'GIFT',
    gc_min_amount: 10,
    gc_max_amount: 1000,
    gc_preset_amounts: '25, 50, 100, 250',
    gc_default_validity_days: 365,
    gc_send_email_on_issue: true,
    gc_send_email_on_redeem: false,
    gc_send_reminder_before_expiry: true,
    gc_max_validation_attempts: 5,
    gc_lockout_duration_minutes: 30,
    gc_default_terms: 'Questo gift certificate è valido per acquisti presso la nostra attività. Non è rimborsabile in denaro e non può essere sostituito in caso di smarrimento o furto. Valido fino alla data di scadenza indicata.'
  })

  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    loadSettings()
  }, [organizationId])

  const loadSettings = async () => {
    try {
      const settings = await giftCertificatesService.getSettings(organizationId)
      if (settings) {
        setFormData({
          gc_enabled: settings.is_enabled ?? true,
          gc_code_prefix: settings.code_prefix || 'GIFT',
          gc_min_amount: 10,
          gc_max_amount: 1000,
          gc_preset_amounts: '25, 50, 100, 250',
          gc_default_validity_days: settings.default_validity_days || 365,
          gc_send_email_on_issue: settings.send_email_on_issue ?? true,
          gc_send_email_on_redeem: settings.send_email_on_redeem ?? false,
          gc_send_reminder_before_expiry: settings.send_reminder_before_expiry ?? true,
          gc_max_validation_attempts: 5,
          gc_lockout_duration_minutes: 30,
          gc_default_terms: settings.default_terms || formData.gc_default_terms
        })
      }
    } catch (error) {
      console.error('Error loading gift certificate settings:', error)
      setMessage({ type: 'error', text: 'Errore nel caricamento delle impostazioni' })
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)

    try {
      await giftCertificatesService.updateSettings(organizationId, {
        is_enabled: formData.gc_enabled,
        code_prefix: formData.gc_code_prefix,
        default_validity_days: formData.gc_default_validity_days,
        send_email_on_issue: formData.gc_send_email_on_issue,
        send_email_on_redeem: formData.gc_send_email_on_redeem,
        send_reminder_before_expiry: formData.gc_send_reminder_before_expiry,
        default_terms: formData.gc_default_terms
      })
      setMessage({ type: 'success', text: 'Impostazioni Gift Certificates salvate con successo!' })
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      console.error('Error saving gift certificate settings:', error)
      setMessage({ type: 'error', text: 'Errore nel salvataggio delle impostazioni' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="gc-settings-hub"
      style={{
        '--primary-color': primaryColor,
        '--secondary-color': secondaryColor
      } as React.CSSProperties}
    >
      {/* Header */}
      <div className="gc-settings-header">
        <button className="back-button" onClick={onBack}>
          ← Torna alle Impostazioni
        </button>
        <div className="gc-settings-header-content">
          <div className="gc-settings-icon">
            <Gift size={48} />
          </div>
          <div>
            <h1>Gift Certificates - Configurazioni</h1>
            <p>Gestisci impostazioni, sicurezza e automazioni per i buoni regalo</p>
          </div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`gc-message ${message.type}`}>
          {message.type === 'success' ? <Save size={20} /> : <AlertTriangle size={20} />}
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)}>×</button>
        </div>
      )}

      {/* Main Content */}
      <div className="gc-settings-content">

        {/* General Settings */}
        <div className="gc-section">
          <div className="gc-section-header">
            <Gift size={24} />
            <h2>Impostazioni Generali</h2>
          </div>

          <div className="gc-form-grid">
            <div className="form-group">
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={formData.gc_enabled}
                  onChange={(e) => setFormData({ ...formData, gc_enabled: e.target.checked })}
                />
                <span>Sistema Gift Certificates Abilitato</span>
              </label>
              <span className="form-hint">Attiva o disattiva completamente i buoni regalo</span>
            </div>

            <div className="form-group">
              <label>
                <FileText size={18} />
                Prefisso Codice
              </label>
              <input
                type="text"
                value={formData.gc_code_prefix}
                onChange={(e) => setFormData({ ...formData, gc_code_prefix: e.target.value })}
                placeholder="GIFT"
                maxLength={10}
              />
              <span className="form-hint">Prefisso per i codici buono (es: GIFT-XXXX)</span>
            </div>

            <div className="form-group">
              <label>
                <Calendar size={18} />
                Validità Default (Giorni)
              </label>
              <input
                type="number"
                min="1"
                max="3650"
                value={formData.gc_default_validity_days}
                onChange={(e) => setFormData({ ...formData, gc_default_validity_days: parseInt(e.target.value) })}
              />
              <span className="form-hint">Giorni di validità predefiniti per i nuovi buoni</span>
            </div>
          </div>
        </div>

        {/* Amount Settings */}
        <div className="gc-section">
          <div className="gc-section-header">
            <DollarSign size={24} />
            <h2>Importi</h2>
          </div>

          <div className="gc-form-grid">
            <div className="form-group">
              <label>
                <DollarSign size={18} />
                Importo Minimo (€)
              </label>
              <input
                type="number"
                min="1"
                value={formData.gc_min_amount}
                onChange={(e) => setFormData({ ...formData, gc_min_amount: parseInt(e.target.value) })}
              />
              <span className="form-hint">Importo minimo per emettere un buono</span>
            </div>

            <div className="form-group">
              <label>
                <DollarSign size={18} />
                Importo Massimo (€)
              </label>
              <input
                type="number"
                min="1"
                value={formData.gc_max_amount}
                onChange={(e) => setFormData({ ...formData, gc_max_amount: parseInt(e.target.value) })}
              />
              <span className="form-hint">Importo massimo per un singolo buono</span>
            </div>

            <div className="form-group full-width">
              <label>
                <DollarSign size={18} />
                Importi Preset (separati da virgola)
              </label>
              <input
                type="text"
                value={formData.gc_preset_amounts}
                onChange={(e) => setFormData({ ...formData, gc_preset_amounts: e.target.value })}
                placeholder="25, 50, 100, 250"
              />
              <span className="form-hint">Importi predefiniti mostrati all'emissione</span>
            </div>
          </div>
        </div>

        {/* Email Automations */}
        <div className="gc-section">
          <div className="gc-section-header">
            <Mail size={24} />
            <h2>Automazioni Email</h2>
          </div>

          <div className="gc-form-grid">
            <div className="form-group">
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={formData.gc_send_email_on_issue}
                  onChange={(e) => setFormData({ ...formData, gc_send_email_on_issue: e.target.checked })}
                />
                <span>Email all'Emissione</span>
              </label>
              <span className="form-hint">Invia email quando viene creato un nuovo buono</span>
            </div>

            <div className="form-group">
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={formData.gc_send_email_on_redeem}
                  onChange={(e) => setFormData({ ...formData, gc_send_email_on_redeem: e.target.checked })}
                />
                <span>Email al Riscatto</span>
              </label>
              <span className="form-hint">Invia email quando un buono viene riscattato</span>
            </div>

            <div className="form-group">
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={formData.gc_send_reminder_before_expiry}
                  onChange={(e) => setFormData({ ...formData, gc_send_reminder_before_expiry: e.target.checked })}
                />
                <span>Promemoria Scadenza</span>
              </label>
              <span className="form-hint">Invia reminder prima della scadenza</span>
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="gc-section">
          <div className="gc-section-header">
            <Shield size={24} />
            <h2>Sicurezza</h2>
          </div>

          <div className="gc-form-grid">
            <div className="form-group">
              <label>
                <Lock size={18} />
                Tentativi Validazione Max
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={formData.gc_max_validation_attempts}
                onChange={(e) => setFormData({ ...formData, gc_max_validation_attempts: parseInt(e.target.value) })}
              />
              <span className="form-hint">Tentativi falliti prima del blocco temporaneo</span>
            </div>

            <div className="form-group">
              <label>
                <Clock size={18} />
                Durata Lockout (Minuti)
              </label>
              <input
                type="number"
                min="5"
                max="1440"
                value={formData.gc_lockout_duration_minutes}
                onChange={(e) => setFormData({ ...formData, gc_lockout_duration_minutes: parseInt(e.target.value) })}
              />
              <span className="form-hint">Minuti di blocco dopo tentativi falliti</span>
            </div>
          </div>
        </div>

        {/* Terms & Conditions */}
        <div className="gc-section">
          <div className="gc-section-header">
            <FileText size={24} />
            <h2>Termini e Condizioni Default</h2>
          </div>

          <div className="form-group full-width">
            <label>Testo Termini e Condizioni</label>
            <textarea
              rows={6}
              value={formData.gc_default_terms}
              onChange={(e) => setFormData({ ...formData, gc_default_terms: e.target.value })}
              placeholder="Inserisci i termini e condizioni predefiniti..."
            />
            <span className="form-hint">Questi termini saranno stampati su ogni buono regalo</span>
          </div>
        </div>

        {/* Save Button */}
        <button className="btn-save" onClick={handleSave} disabled={saving}>
          {saving ? <RefreshCw size={20} className="spin" /> : <Save size={20} />}
          {saving ? 'Salvataggio...' : 'Salva Tutte le Impostazioni'}
        </button>
      </div>
    </div>
  )
}

export default GiftCertificatesSettingsHub
