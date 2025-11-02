import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import QRCode from 'qrcode'
import {
  Key,
  Clock,
  CheckCircle,
  XCircle,
  Download,
  Search,
  Smartphone,
  Building2,
  Eye,
  Trash2,
  RefreshCw
} from 'lucide-react'
import { useToast } from '../../hooks/useToast'
import { useConfirm } from '../../hooks/useConfirm'
import Toast from '../UI/Toast'
import ConfirmModal from '../UI/ConfirmModal'
import PageLoader from '../UI/PageLoader'
import './AdminLayout.css'

interface SetupToken {
  id: string
  token: string
  device_id?: string
  store_config_id?: string
  expires_at: string
  max_uses: number
  current_uses: number
  used: boolean
  setup_data?: any
  qr_code_generated: boolean
  qr_code_url?: string
  generated_by?: string
  used_by_device_info?: any
  used_at?: string
  created_at: string
  // Joined data
  device?: {
    name: string
  }
  store_config?: {
    store_name: string
  }
}

const TokenSetupViewer: React.FC = () => {
  const [tokens, setTokens] = useState<SetupToken[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'used' | 'expired'>('active')
  const [selectedToken, setSelectedToken] = useState<SetupToken | null>(null)
  const [qrCodeImage, setQrCodeImage] = useState('')
  const [showQRModal, setShowQRModal] = useState(false)
  const { toast, showSuccess, showError, showWarning, hideToast } = useToast()
  const { confirmState, showConfirm, hideConfirm, handleConfirm } = useConfirm()

  useEffect(() => {
    loadTokens()

    // Auto-refresh ogni 30 secondi
    const interval = setInterval(loadTokens, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadTokens = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('setup_tokens')
        .select(`
          *,
          device:devices(name),
          store_config:store_configs(store_name)
        `)
        .order('created_at', { ascending: false })
        .limit(200)

      if (error) throw error
      setTokens(data || [])
    } catch (error) {
      console.error('Error loading tokens:', error)
      showError('Errore nel caricamento dei token')
    } finally {
      setLoading(false)
    }
  }

  const isTokenExpired = (token: SetupToken) => {
    return new Date(token.expires_at) < new Date()
  }

  const isTokenActive = (token: SetupToken) => {
    return !token.used && !isTokenExpired(token) && token.current_uses < token.max_uses
  }

  const getTokenStatus = (token: SetupToken): { label: string; color: string; icon: React.ReactNode } => {
    if (token.used || token.current_uses >= token.max_uses) {
      return { label: 'Usato', color: '#6b7280', icon: <CheckCircle size={14} /> }
    }
    if (isTokenExpired(token)) {
      return { label: 'Scaduto', color: '#ef4444', icon: <XCircle size={14} /> }
    }
    return { label: 'Attivo', color: '#10b981', icon: <Clock size={14} /> }
  }

  const handleGenerateQR = async (token: SetupToken) => {
    try {
      // Generate provisioning JSON URL
      const provisioningJsonUrl = `https://sjvatdnvewohvswfrdiv.supabase.co/storage/v1/object/public/provisioning/setup-${token.token}.json`

      // Create provisioning JSON with token data
      // Provisioning configuration for Android 14 - PRODUCTION APK with OU=Production
      const provisioningData = {
        "android.app.extra.PROVISIONING_DEVICE_ADMIN_COMPONENT_NAME": "com.omnilypro.pos/.mdm.MyDeviceAdminReceiver",
        "android.app.extra.PROVISIONING_DEVICE_ADMIN_PACKAGE_DOWNLOAD_LOCATION": "https://sjvatdnvewohvswfrdiv.supabase.co/storage/v1/object/public/apks/omnilybridgepos.apk",
        "android.app.extra.PROVISIONING_DEVICE_ADMIN_PACKAGE_CHECKSUM": "JvkiN6BA-BiGl5onJ_wLceF5hyAdEc8ApLj7lWjhNHM",
        "android.app.extra.PROVISIONING_SKIP_ENCRYPTION": true,
        "android.app.extra.PROVISIONING_LEAVE_ALL_SYSTEM_APPS_ENABLED": true,
        "android.app.extra.PROVISIONING_ADMIN_EXTRAS_BUNDLE": {
          "setup_token": token.token,
          ...token.setup_data
        }
      }

      // Upload provisioning JSON to Supabase
      const jsonBlob = new Blob([JSON.stringify(provisioningData, null, 2)], { type: 'application/json' })
      const fileName = `setup-${token.token}.json`

      const { error: uploadError } = await supabase.storage
        .from('provisioning')
        .upload(fileName, jsonBlob, {
          contentType: 'application/json',
          upsert: true
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        throw new Error('Errore nel caricamento del file di provisioning')
      }

      // Generate QR code with provisioning URL
      const qrCodeImageUrl = await QRCode.toDataURL(provisioningJsonUrl, {
        width: 400,
        margin: 2,
        errorCorrectionLevel: 'H',
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })

      setQrCodeImage(qrCodeImageUrl)
      setSelectedToken(token)
      setShowQRModal(true)

      console.log('✅ QR Code di provisioning generato:', provisioningJsonUrl)
    } catch (error) {
      console.error('Error generating provisioning QR code:', error)
      showError('Errore nella generazione del QR Code di provisioning')
    }
  }

  const downloadQRCode = () => {
    if (qrCodeImage && selectedToken) {
      const link = document.createElement('a')
      link.href = qrCodeImage
      link.download = `setup-token-${selectedToken.token.substring(0, 8)}-${Date.now()}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const handleDeleteToken = async (tokenId: string) => {
    showConfirm(
      'Sei sicuro di voler eliminare questo token? Se è associato a un dispositivo, verrà eliminato anche il dispositivo e tutti i suoi comandi. Questa azione non può essere annullata.',
      async () => {
        try {
          // Get token to check if it has an associated device
          const { data: tokenData } = await supabase
            .from('setup_tokens')
            .select('device_id')
            .eq('id', tokenId)
            .single()

          // If there's an associated device, delete it first (and its commands via cascade)
          if (tokenData?.device_id) {
            // Delete device commands first (foreign key constraint)
            const { error: commandsError } = await supabase
              .from('device_commands')
              .delete()
              .eq('device_id', tokenData.device_id)

            if (commandsError) throw commandsError

            // Delete the device
            const { error: deviceError } = await supabase
              .from('devices')
              .delete()
              .eq('id', tokenData.device_id)

            if (deviceError) throw deviceError
          }

          // Delete the token
          const { error } = await supabase
            .from('setup_tokens')
            .delete()
            .eq('id', tokenId)

          if (error) throw error

          if (tokenData?.device_id) {
            showSuccess('Token e dispositivo associato eliminati con successo')
          } else {
            showSuccess('Token eliminato con successo')
          }
          loadTokens()
        } catch (error) {
          console.error('Error deleting token:', error)
          showError('Errore nell\'eliminazione del token')
        }
      },
      {
        title: 'Elimina Token e Dispositivo',
        confirmText: 'Elimina',
        type: 'danger'
      }
    )
  }

  const handleRevokeToken = async (tokenId: string) => {
    try {
      const { error } = await supabase
        .from('setup_tokens')
        .update({ used: true, used_at: new Date().toISOString() })
        .eq('id', tokenId)

      if (error) throw error
      showSuccess('Token revocato con successo')
      loadTokens()
    } catch (error) {
      console.error('Error revoking token:', error)
      showError('Errore nella revoca del token')
    }
  }

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString))
  }

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date().getTime()
    const expiry = new Date(expiresAt).getTime()
    const diff = expiry - now

    if (diff <= 0) return 'Scaduto'

    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    if (hours > 24) {
      return `${Math.floor(hours / 24)}g ${hours % 24}h`
    }
    return `${hours}h ${minutes}m`
  }

  const filteredTokens = tokens.filter(token => {
    const matchesSearch =
      token.token.toLowerCase().includes(searchTerm.toLowerCase()) ||
      token.device?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      token.store_config?.store_name.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesFilter =
      filterStatus === 'all' ||
      (filterStatus === 'active' && isTokenActive(token)) ||
      (filterStatus === 'used' && (token.used || token.current_uses >= token.max_uses)) ||
      (filterStatus === 'expired' && isTokenExpired(token) && !token.used)

    return matchesSearch && matchesFilter
  })

  const stats = {
    total: tokens.length,
    active: tokens.filter(t => isTokenActive(t)).length,
    used: tokens.filter(t => t.used || t.current_uses >= t.max_uses).length,
    expired: tokens.filter(t => isTokenExpired(t) && !t.used).length
  }

  if (loading) {
    return <PageLoader message="Caricamento token setup..." size="medium" />
  }

  return (
    <div className="admin-dashboard" style={{ width: '100%', maxWidth: 'none', margin: 0, padding: 0 }}>
      {/* Header */}
      <div className="dashboard-header" style={{ padding: '1.5rem' }}>
        <div className="header-title-section">
          <h1>🔑 Setup Tokens</h1>
          <p>Gestisci i token per il setup automatico dei dispositivi</p>
        </div>
        <button className="btn-primary" onClick={loadTokens}>
          <RefreshCw size={20} />
          Aggiorna
        </button>
      </div>

      {/* Stats */}
      <div className="dashboard-stats" style={{ padding: '0 1.5rem 1.5rem' }}>
        <div className="stat-card">
          <Key size={20} />
          <div>
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Token Totali</div>
          </div>
        </div>
        <div className="stat-card online">
          <Clock size={20} />
          <div>
            <div className="stat-value">{stats.active}</div>
            <div className="stat-label">Attivi</div>
          </div>
        </div>
        <div className="stat-card">
          <CheckCircle size={20} />
          <div>
            <div className="stat-value">{stats.used}</div>
            <div className="stat-label">Usati</div>
          </div>
        </div>
        <div className="stat-card offline">
          <XCircle size={20} />
          <div>
            <div className="stat-value">{stats.expired}</div>
            <div className="stat-label">Scaduti</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ padding: '0 1.5rem 1.5rem' }}>
        <div className="search-bar" style={{ marginBottom: '1rem' }}>
          <Search size={20} />
          <input
            type="text"
            placeholder="Cerca per token, dispositivo o store..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className={`btn-secondary ${filterStatus === 'all' ? 'active' : ''}`}
            onClick={() => setFilterStatus('all')}
          >
            Tutti
          </button>
          <button
            className={`btn-secondary ${filterStatus === 'active' ? 'active' : ''}`}
            onClick={() => setFilterStatus('active')}
          >
            Attivi
          </button>
          <button
            className={`btn-secondary ${filterStatus === 'used' ? 'active' : ''}`}
            onClick={() => setFilterStatus('used')}
          >
            Usati
          </button>
          <button
            className={`btn-secondary ${filterStatus === 'expired' ? 'active' : ''}`}
            onClick={() => setFilterStatus('expired')}
          >
            Scaduti
          </button>
        </div>
      </div>

      {/* Tokens Grid */}
      <div className="devices-grid" style={{ padding: '0 1.5rem' }}>
        {filteredTokens.map(token => {
          const status = getTokenStatus(token)
          return (
            <div
              key={token.id}
              className={`device-card ${isTokenActive(token) ? 'online' : 'offline'}`}
            >
              <div className="device-header">
                <div className="device-info">
                  <h3 style={{ fontFamily: 'monospace', fontSize: '1rem' }}>
                    {token.token.substring(0, 16)}...
                  </h3>
                  {token.device && (
                    <p className="organization">
                      <Smartphone size={14} />
                      {token.device.name}
                    </p>
                  )}
                  {token.store_config && (
                    <p className="location">
                      <Building2 size={14} />
                      {token.store_config.store_name}
                    </p>
                  )}
                </div>
                <div className="device-status">
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '9999px',
                    backgroundColor: status.color + '20',
                    color: status.color
                  }}>
                    {status.icon}
                    <span style={{ fontWeight: '600', fontSize: '0.875rem' }}>{status.label}</span>
                  </div>
                </div>
              </div>

              <div className="device-metrics">
                <div className="metric">
                  <Clock size={16} />
                  <span>Scade: {getTimeRemaining(token.expires_at)}</span>
                </div>
                <div className="metric">
                  <Key size={16} />
                  <span>{token.current_uses}/{token.max_uses} utilizzi</span>
                </div>
              </div>

              <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '0.5rem' }}>
                <div>Creato: {formatDate(token.created_at)}</div>
                {token.used_at && (
                  <div>Usato: {formatDate(token.used_at)}</div>
                )}
              </div>

              <div className="device-actions" style={{ marginTop: '1rem' }}>
                <button
                  className="action-btn primary"
                  onClick={() => handleGenerateQR(token)}
                  disabled={!isTokenActive(token)}
                >
                  <Eye size={14} />
                  Vedi QR
                </button>
                {isTokenActive(token) && (
                  <button
                    className="action-btn warning"
                    onClick={() => handleRevokeToken(token.id)}
                  >
                    <XCircle size={14} />
                    Revoca
                  </button>
                )}
                <button
                  className="action-btn danger"
                  onClick={() => handleDeleteToken(token.id)}
                >
                  <Trash2 size={14} />
                  Elimina
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {filteredTokens.length === 0 && (
        <div className="no-devices" style={{ margin: '2rem 0' }}>
          <Key size={48} />
          <h3>Nessun token trovato</h3>
          <p>Non ci sono token che corrispondono ai criteri di ricerca.</p>
        </div>
      )}

      {/* QR Code Modal */}
      {showQRModal && selectedToken && (
        <div className="device-modal-overlay" onClick={() => setShowQRModal(false)}>
          <div className="device-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🔑 QR Code Setup Token</h2>
              <button className="close-btn" onClick={() => setShowQRModal(false)}>×</button>
            </div>

            <div className="modal-content" style={{ textAlign: 'center' }}>
              {qrCodeImage && (
                <>
                  <img
                    src={qrCodeImage}
                    alt="QR Code Setup"
                    style={{
                      width: '400px',
                      height: '400px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      margin: '1rem auto'
                    }}
                  />
                  <div style={{
                    backgroundColor: '#f9fafb',
                    padding: '1rem',
                    borderRadius: '8px',
                    marginTop: '1rem',
                    textAlign: 'left'
                  }}>
                    <h4 style={{ margin: '0 0 0.5rem 0' }}>Dettagli Token</h4>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                      <div>Token: <code>{selectedToken.token}</code></div>
                      <div>Scadenza: {formatDate(selectedToken.expires_at)}</div>
                      <div>Utilizzi: {selectedToken.current_uses}/{selectedToken.max_uses}</div>
                      {selectedToken.device && <div>Dispositivo: {selectedToken.device.name}</div>}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="modal-actions">
              <button className="action-btn secondary" onClick={() => setShowQRModal(false)}>
                Chiudi
              </button>
              <button className="action-btn primary" onClick={downloadQRCode}>
                <Download size={16} />
                Scarica QR Code
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast message={toast.message} type={toast.type} isVisible={toast.isVisible} onClose={hideToast} />
      <ConfirmModal
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        cancelText={confirmState.cancelText}
        type={confirmState.type}
        onConfirm={handleConfirm}
        onCancel={hideConfirm}
      />
    </div>
  )
}

export default TokenSetupViewer
