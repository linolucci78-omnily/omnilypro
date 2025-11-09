import React, { useState } from 'react'
import {
  Award,
  Gem,
  TrendingUp,
  Gift,
  Calendar,
  Clock,
  AlertTriangle,
  Save,
  RefreshCw,
  Settings,
  Users
} from 'lucide-react'
import { organizationService } from '../services/organizationService'
import './LoyaltySystemHub.css'

interface LoyaltySystemHubProps {
  organizationId: string
  organizationName: string
  primaryColor: string
  secondaryColor: string
  organization: any
  onBack: () => void
  onUpdate: () => void
}

const LoyaltySystemHub: React.FC<LoyaltySystemHubProps> = ({
  organizationId,
  organizationName,
  primaryColor,
  secondaryColor,
  organization,
  onBack,
  onUpdate
}) => {
  const [formData, setFormData] = useState({
    points_name: organization?.points_name || 'Punti',
    points_per_euro: organization?.points_per_euro || 1,
    reward_threshold: organization?.reward_threshold || 100,
    welcome_bonus: organization?.welcome_bonus || 50,
    points_expiry_months: organization?.points_expiry_months || 12,
    enable_tier_system: organization?.enable_tier_system ?? true
  })

  const [resetConfirmText, setResetConfirmText] = useState('')
  const [scheduledResetDate, setScheduledResetDate] = useState(
    organization?.scheduled_points_reset
      ? new Date(organization.scheduled_points_reset).toISOString().split('T')[0]
      : ''
  )
  const [scheduledResetTime, setScheduledResetTime] = useState(
    organization?.scheduled_points_reset
      ? new Date(organization.scheduled_points_reset).toTimeString().slice(0, 5)
      : ''
  )
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)

    try {
      await organizationService.updateLoyaltySettings(organizationId, formData)
      setMessage({ type: 'success', text: 'Impostazioni salvate con successo!' })
      setTimeout(() => {
        setMessage(null)
        onUpdate()
      }, 3000)
    } catch (error) {
      console.error('Error saving loyalty settings:', error)
      setMessage({ type: 'error', text: 'Errore nel salvataggio delle impostazioni' })
    } finally {
      setSaving(false)
    }
  }

  const handleScheduleReset = async () => {
    if (!scheduledResetDate || !scheduledResetTime) {
      setMessage({ type: 'error', text: 'Inserisci data e ora per il reset programmato' })
      return
    }

    setSaving(true)
    try {
      const resetDateTime = new Date(`${scheduledResetDate}T${scheduledResetTime}`)
      await organizationService.updateOrganizationDetails(organizationId, {
        scheduled_points_reset: resetDateTime.toISOString()
      })
      setMessage({ type: 'success', text: 'Reset programmato con successo!' })
      setScheduledResetDate('')
      setScheduledResetTime('')
      setTimeout(() => {
        setMessage(null)
        onUpdate()
      }, 3000)
    } catch (error) {
      console.error('Error scheduling reset:', error)
      setMessage({ type: 'error', text: 'Errore nella programmazione del reset' })
    } finally {
      setSaving(false)
    }
  }

  const handleResetNow = async () => {
    if (resetConfirmText.trim().toUpperCase() !== 'RESET') {
      setMessage({ type: 'error', text: 'Digita "RESET" per confermare l\'azzeramento' })
      return
    }

    setSaving(true)
    try {
      await organizationService.resetAllPoints(organizationId)
      setMessage({ type: 'success', text: 'Tutti i punti sono stati azzerati!' })
      setResetConfirmText('')
      setTimeout(() => {
        setMessage(null)
        onUpdate()
      }, 3000)
    } catch (error) {
      console.error('Error resetting points:', error)
      setMessage({ type: 'error', text: 'Errore nell\'azzeramento dei punti' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="loyalty-system-hub"
      style={{
        '--primary-color': primaryColor,
        '--secondary-color': secondaryColor
      } as React.CSSProperties}
    >
      {/* Header */}
      <div className="loyalty-system-header">
        <button className="back-button" onClick={onBack}>
          ← Torna alle Impostazioni
        </button>
        <div className="loyalty-system-header-content">
          <div className="loyalty-system-icon">
            <Gem size={48} />
          </div>
          <div>
            <h1>Sistema Fedeltà & Punti</h1>
            <p>Configura punti, premi, scadenze e reset per {organizationName}</p>
          </div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`loyalty-message ${message.type}`}>
          {message.type === 'success' ? <Save size={20} /> : <AlertTriangle size={20} />}
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)}>×</button>
        </div>
      )}

      {/* Main Content */}
      <div className="loyalty-system-content">

        {/* Points Configuration */}
        <div className="loyalty-section">
          <div className="loyalty-section-header">
            <Settings size={24} />
            <h2>Configurazione Punti</h2>
          </div>

          <div className="loyalty-form-grid">
            <div className="form-group">
              <label>
                <Award size={18} />
                Nome Punti
              </label>
              <input
                type="text"
                value={formData.points_name}
                onChange={(e) => setFormData({ ...formData, points_name: e.target.value })}
                placeholder="es: Gemme, Stelle, Punti"
              />
              <span className="form-hint">Personalizza il nome dei tuoi punti fedeltà</span>
            </div>

            <div className="form-group">
              <label>
                <TrendingUp size={18} />
                Punti per Euro
              </label>
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={formData.points_per_euro}
                onChange={(e) => setFormData({ ...formData, points_per_euro: parseFloat(e.target.value) })}
              />
              <span className="form-hint">Quanti punti guadagna il cliente per ogni euro speso</span>
            </div>

            <div className="form-group">
              <label>
                <Gift size={18} />
                Soglia Reward (Punti)
              </label>
              <input
                type="number"
                min="1"
                value={formData.reward_threshold}
                onChange={(e) => setFormData({ ...formData, reward_threshold: parseInt(e.target.value) })}
              />
              <span className="form-hint">Punti necessari per sbloccare un premio</span>
            </div>

            <div className="form-group">
              <label>
                <Users size={18} />
                Bonus Benvenuto
              </label>
              <input
                type="number"
                min="0"
                value={formData.welcome_bonus}
                onChange={(e) => setFormData({ ...formData, welcome_bonus: parseInt(e.target.value) })}
              />
              <span className="form-hint">Punti regalati ai nuovi clienti</span>
            </div>

            <div className="form-group">
              <label>
                <Calendar size={18} />
                Scadenza Punti (Mesi)
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={formData.points_expiry_months}
                onChange={(e) => setFormData({ ...formData, points_expiry_months: parseInt(e.target.value) })}
              />
              <span className="form-hint">Dopo quanti mesi i punti scadono (0 = mai)</span>
            </div>

            <div className="form-group">
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={formData.enable_tier_system}
                  onChange={(e) => setFormData({ ...formData, enable_tier_system: e.target.checked })}
                />
                <span>Abilita Sistema Tier/Livelli</span>
              </label>
              <span className="form-hint">Attiva i livelli di fedeltà (Bronze, Silver, Gold, etc.)</span>
            </div>
          </div>

          <button className="btn-save" onClick={handleSave} disabled={saving}>
            {saving ? <RefreshCw size={20} className="spin" /> : <Save size={20} />}
            {saving ? 'Salvataggio...' : 'Salva Configurazione'}
          </button>
        </div>

        {/* Scheduled Reset */}
        <div className="loyalty-section">
          <div className="loyalty-section-header">
            <Clock size={24} />
            <h2>Reset Programmato</h2>
          </div>

          <p className="section-description">
            Programma un reset automatico di tutti i punti fedeltà. Utile per azzeramenti annuali o stagionali.
          </p>

          <div className="loyalty-form-grid">
            <div className="form-group">
              <label>Data Reset</label>
              <input
                type="date"
                value={scheduledResetDate}
                onChange={(e) => setScheduledResetDate(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Ora Reset</label>
              <input
                type="time"
                value={scheduledResetTime}
                onChange={(e) => setScheduledResetTime(e.target.value)}
              />
            </div>
          </div>

          <button className="btn-schedule" onClick={handleScheduleReset} disabled={saving}>
            <Calendar size={20} />
            Programma Reset
          </button>
        </div>

        {/* Immediate Reset - DANGER ZONE */}
        <div className="loyalty-section danger-zone">
          <div className="loyalty-section-header">
            <AlertTriangle size={24} />
            <h2>Zona Pericolosa</h2>
          </div>

          <div className="danger-warning">
            <AlertTriangle size={20} />
            <div>
              <strong>Attenzione!</strong> Questa azione azzererà TUTTI i punti di TUTTI i clienti immediatamente e in modo irreversibile.
            </div>
          </div>

          <div className="form-group">
            <label>Digita "RESET" per confermare l'azzeramento totale</label>
            <input
              type="text"
              value={resetConfirmText}
              onChange={(e) => setResetConfirmText(e.target.value)}
              placeholder="RESET"
              className="confirm-input"
            />
          </div>

          <button
            className="btn-danger"
            onClick={() => {
              console.log('BUTTON CLICKED!', resetConfirmText)
              handleResetNow()
            }}
            style={{ cursor: 'pointer', pointerEvents: 'auto', position: 'relative', zIndex: 9999 }}
          >
            <RefreshCw size={20} />
            {saving ? 'Azzeramento...' : 'Azzera Tutti i Punti Ora'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default LoyaltySystemHub
