import React, { useState, useEffect } from 'react'
import {
  Shield, Lock, Key, UserCheck, AlertTriangle, CheckCircle,
  Clock, Eye, EyeOff, Copy, RefreshCw, LogIn, Database,
  Terminal, Fingerprint, Smartphone
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { supabase } from '../../lib/supabase'
import './RootAccessControl.css'

interface SecurityLog {
  id: string
  action: string
  timestamp: Date
  ip_address: string
  user_agent: string
  status: 'success' | 'failed'
}

const RootAccessControl: React.FC = () => {
  const { user, isSuperAdmin } = useAuth()
  const { showSuccess, showError } = useToast()
  const [loading, setLoading] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)
  const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>([])

  const [securitySettings, setSecuritySettings] = useState({
    twoFactorEnabled: true,
    apiAccessEnabled: true,
    databaseBackupEnabled: true,
    loginNotificationsEnabled: true,
    sessionTimeout: 60 // minutes
  })

  useEffect(() => {
    if (!isSuperAdmin) {
      showError('Accesso negato: Solo super amministratori')
      return
    }
    loadSecurityLogs()
  }, [isSuperAdmin])

  const loadSecurityLogs = async () => {
    // In a real app, load from audit_logs table
    // Mock data for now
    const mockLogs: SecurityLog[] = [
      {
        id: '1',
        action: 'Login super admin',
        timestamp: new Date(Date.now() - 1000 * 60 * 15),
        ip_address: '192.168.1.100',
        user_agent: 'Chrome/120.0',
        status: 'success'
      },
      {
        id: '2',
        action: 'Modifica impostazioni database',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
        ip_address: '192.168.1.100',
        user_agent: 'Chrome/120.0',
        status: 'success'
      },
      {
        id: '3',
        action: 'Tentativo accesso API',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
        ip_address: '203.0.113.45',
        user_agent: 'PostmanRuntime/7.36',
        status: 'failed'
      }
    ]
    setSecurityLogs(mockLogs)
  }

  const generateApiKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let key = 'omni_'
    for (let i = 0; i < 32; i++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return key
  }

  const [apiKey] = useState(generateApiKey())

  const copyApiKey = () => {
    navigator.clipboard.writeText(apiKey)
    showSuccess('API Key copiata negli appunti')
  }

  const regenerateApiKey = () => {
    showSuccess('Nuova API Key generata')
    // In real app, would update in database
  }

  const handleToggleSetting = (setting: keyof typeof securitySettings) => {
    setSecuritySettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }))
    showSuccess('Impostazione aggiornata')
  }

  const formatTimestamp = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days} giorni fa`
    if (hours > 0) return `${hours} ore fa`
    if (minutes > 0) return `${minutes} minuti fa`
    return 'Adesso'
  }

  if (!isSuperAdmin) {
    return (
      <div className="access-denied">
        <Shield size={64} className="denied-icon" />
        <h2>Accesso Negato</h2>
        <p>Questa sezione è accessibile solo ai super amministratori</p>
      </div>
    )
  }

  return (
    <div className="root-access-control">
      {/* Header */}
      <div className="access-header">
        <div>
          <h1 className="access-title">
            <Shield size={28} />
            Root Access Control
          </h1>
          <p className="access-subtitle">
            Gestione avanzata sicurezza e accessi amministrativi OmnilyPro
          </p>
        </div>
        <div className="security-badge operational">
          <CheckCircle size={18} />
          <span>Sicuro</span>
        </div>
      </div>

      <div className="access-content-grid">
        {/* Security Settings */}
        <div className="access-card">
          <div className="card-header">
            <h3>
              <Lock size={20} />
              Impostazioni Sicurezza
            </h3>
          </div>
          <div className="security-settings">
            <div className="setting-item">
              <div className="setting-info">
                <Smartphone size={18} />
                <div>
                  <div className="setting-label">Autenticazione a Due Fattori</div>
                  <div className="setting-description">
                    Richiedi codice OTP per login amministrativo
                  </div>
                </div>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={securitySettings.twoFactorEnabled}
                  onChange={() => handleToggleSetting('twoFactorEnabled')}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <Key size={18} />
                <div>
                  <div className="setting-label">Accesso API</div>
                  <div className="setting-description">
                    Abilita accesso programmatico via API Key
                  </div>
                </div>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={securitySettings.apiAccessEnabled}
                  onChange={() => handleToggleSetting('apiAccessEnabled')}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <Database size={18} />
                <div>
                  <div className="setting-label">Backup Automatico Database</div>
                  <div className="setting-description">
                    Backup giornaliero automatico alle 02:00 UTC
                  </div>
                </div>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={securitySettings.databaseBackupEnabled}
                  onChange={() => handleToggleSetting('databaseBackupEnabled')}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <AlertTriangle size={18} />
                <div>
                  <div className="setting-label">Notifiche Login</div>
                  <div className="setting-description">
                    Avvisa via email per ogni nuovo login amministrativo
                  </div>
                </div>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={securitySettings.loginNotificationsEnabled}
                  onChange={() => handleToggleSetting('loginNotificationsEnabled')}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <Clock size={18} />
                <div>
                  <div className="setting-label">Timeout Sessione</div>
                  <div className="setting-description">
                    Disconnetti automaticamente dopo {securitySettings.sessionTimeout} minuti di inattività
                  </div>
                </div>
              </div>
              <select
                className="timeout-select"
                value={securitySettings.sessionTimeout}
                onChange={(e) => setSecuritySettings(prev => ({ ...prev, sessionTimeout: Number(e.target.value) }))}
              >
                <option value={30}>30 minuti</option>
                <option value={60}>60 minuti</option>
                <option value={120}>2 ore</option>
                <option value={240}>4 ore</option>
              </select>
            </div>
          </div>
        </div>

        {/* API Key Management */}
        <div className="access-card">
          <div className="card-header">
            <h3>
              <Key size={20} />
              API Key Management
            </h3>
          </div>
          <div className="api-key-section">
            <div className="api-key-info">
              <Terminal size={18} />
              <div>
                <div className="api-key-label">Master API Key</div>
                <div className="api-key-description">
                  Usa questa chiave per accedere alle API OmnilyPro da applicazioni esterne
                </div>
              </div>
            </div>
            <div className="api-key-display">
              <div className="api-key-value">
                {showApiKey ? apiKey : '•'.repeat(36)}
              </div>
              <button
                className="btn-icon"
                onClick={() => setShowApiKey(!showApiKey)}
                title={showApiKey ? 'Nascondi' : 'Mostra'}
              >
                {showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
              <button
                className="btn-icon"
                onClick={copyApiKey}
                title="Copia"
              >
                <Copy size={18} />
              </button>
              <button
                className="btn-icon danger"
                onClick={regenerateApiKey}
                title="Rigenera"
              >
                <RefreshCw size={18} />
              </button>
            </div>
            <div className="api-key-warning">
              <AlertTriangle size={16} />
              <span>Non condividere mai questa chiave. Ha accesso completo al sistema.</span>
            </div>
          </div>
        </div>

        {/* Security Logs */}
        <div className="access-card full-width">
          <div className="card-header">
            <h3>
              <Fingerprint size={20} />
              Log Accessi Recenti
            </h3>
            <button className="btn-refresh" onClick={loadSecurityLogs}>
              <RefreshCw size={16} />
              Aggiorna
            </button>
          </div>
          <div className="security-logs">
            {securityLogs.map(log => (
              <div key={log.id} className={`log-item ${log.status}`}>
                <div className={`log-status-icon ${log.status}`}>
                  {log.status === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                </div>
                <div className="log-content">
                  <div className="log-action">{log.action}</div>
                  <div className="log-meta">
                    <span>{formatTimestamp(log.timestamp)}</span>
                    <span>•</span>
                    <span>{log.ip_address}</span>
                    <span>•</span>
                    <span>{log.user_agent}</span>
                  </div>
                </div>
                <div className={`log-status-badge ${log.status}`}>
                  {log.status === 'success' ? 'Successo' : 'Fallito'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="access-card">
          <div className="card-header">
            <h3>
              <Terminal size={20} />
              Azioni Amministrative
            </h3>
          </div>
          <div className="admin-actions">
            <button className="admin-action-btn">
              <Database size={18} />
              <span>Backup Manuale Database</span>
            </button>
            <button className="admin-action-btn">
              <UserCheck size={18} />
              <span>Audit Completo Utenti</span>
            </button>
            <button className="admin-action-btn danger">
              <RefreshCw size={18} />
              <span>Reset Cache Sistema</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RootAccessControl
