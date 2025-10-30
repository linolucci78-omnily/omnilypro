import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import QRCode from 'qrcode'
import { useToast } from '../../hooks/useToast'
import { useConfirm } from '../../hooks/useConfirm'
import Toast from '../UI/Toast'
import ConfirmModal from '../UI/ConfirmModal'
import {
  Smartphone,
  MapPin,
  Battery,
  Wifi,
  Power,
  Settings,
  Lock,
  Unlock,
  RefreshCw,
  Download,
  AlertTriangle,
  CheckCircle,
  Clock,
  Search,
  Plus,
  Printer,
  Monitor,
  Package,
  Activity,
  Key,
  Store,
  Bell,
  Calendar,
  Zap,
  Send,
  Map,
  Grid,
  Trash2
} from 'lucide-react'
import './AdminLayout.css'
import './MDMDashboard.css'
import PrintTemplateManager from './PrintTemplateManager'
import AppRepositoryManager from './AppRepositoryManager'
import ActivityLogsViewer from './ActivityLogsViewer'
import TokenSetupViewer from './TokenSetupViewer'
import StoreConfigManager from './StoreConfigManager'
import CommandScheduler from './CommandScheduler'
import AlertsSystem from './AlertsSystem'
import BulkOperations from './BulkOperations'
import AppPushUpdate from './AppPushUpdate'
import PageLoader from '../UI/PageLoader'
import DeviceMap from './DeviceMap'

interface Device {
  id: string
  name: string
  android_id: string
  device_model: string
  organization_id: string
  store_location: string
  status: 'online' | 'offline' | 'setup' | 'maintenance'
  last_seen: string
  wifi_ssid: string
  battery_level: number
  kiosk_mode_active: boolean
  current_app_package: string
  latitude: number
  longitude: number
  location_accuracy_meters?: number
  language: string
  created_at: string

  // Join data
  organization?: {
    name: string
  }
}

interface DeviceCommand {
  id: string
  device_id: string
  command_type: string
  status: 'pending' | 'completed' | 'failed'
  created_at: string
  completed_at: string
  error_message: string
}

interface Organization {
  id: string
  name: string
}

const MDMDashboard: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([])
  const [commands, setCommands] = useState<DeviceCommand[]>([])
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null)
  const [activeTab, setActiveTab] = useState<'devices' | 'scheduler' | 'alerts' | 'bulk' | 'push' | 'print' | 'apps' | 'logs' | 'tokens' | 'stores'>('devices')
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid')
  const [showAddDeviceModal, setShowAddDeviceModal] = useState(false)
  const [showQRModal, setShowQRModal] = useState(false)
  const [showStoreConfigModal, setShowStoreConfigModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deviceToDelete, setDeviceToDelete] = useState<Device | null>(null)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [formLoading, setFormLoading] = useState(false)
  const [qrCodeData, setQrCodeData] = useState('')
  const [qrCodeImage, setQrCodeImage] = useState('')
  const [qrLoading, setQrLoading] = useState(false)
  const { toast, showSuccess, showError, showWarning, hideToast } = useToast()
  const { confirmState, showConfirm, hideConfirm, handleConfirm } = useConfirm()
  const [stats, setStats] = useState({
    total: 0,
    online: 0,
    offline: 0,
    kioskActive: 0
  })

  // Form state for new device
  const [deviceForm, setDeviceForm] = useState({
    name: '',
    device_model: 'Z108',
    organization_id: '',
    store_location: '',
    store_address: '',
    kiosk_auto_start: true,
    main_app_package: 'com.omnily.bridge'
  })

  useEffect(() => {
    loadDevices()
    loadCommands()
    loadOrganizations()

    // Real-time subscription per device updates
    const deviceSubscription = supabase
      .channel('device-changes')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'devices'
        },
        () => {
          loadDevices()
        }
      )
      .subscribe()

    // Auto-refresh ogni 30 secondi
    const interval = setInterval(loadDevices, 30000)

    return () => {
      deviceSubscription.unsubscribe()
      clearInterval(interval)
    }
  }, [])

  const loadDevices = async () => {
    try {
      const { data, error } = await supabase
        .from('devices')
        .select(`
          *,
          organization:organizations(name)
        `)
        .order('last_seen', { ascending: false })

      if (error) throw error

      setDevices(data || [])

      // Calculate stats
      const total = data?.length || 0
      const online = data?.filter(d => d.status === 'online').length || 0
      const offline = data?.filter(d => d.status === 'offline').length || 0
      const kioskActive = data?.filter(d => d.kiosk_mode_active).length || 0

      setStats({ total, online, offline, kioskActive })

    } catch (error) {
      console.error('Error loading devices:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadCommands = async () => {
    try {
      const { data, error } = await supabase
        .from('device_commands')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      setCommands(data || [])
    } catch (error) {
      console.error('Error loading commands:', error)
    }
  }

  const loadOrganizations = async () => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name')
        .order('name')

      if (error) throw error
      setOrganizations(data || [])
    } catch (error) {
      console.error('Error loading organizations:', error)
    }
  }

  const sendCommand = async (deviceId: string, commandType: string, payload = {}) => {
    try {
      const { error } = await supabase
        .from('device_commands')
        .insert({
          device_id: deviceId,
          command_type: commandType,
          payload: payload,
          status: 'pending'
        })

      if (error) throw error

      loadCommands()
      showSuccess(`Comando "${commandType}" inviato al dispositivo`)
    } catch (error) {
      console.error('Error sending command:', error)
      showError('Errore invio comando')
    }
  }

  const confirmDeleteDevice = async () => {
    if (!deviceToDelete) return

    if (deleteConfirmText !== 'ELIMINA') {
      showWarning('Digita "ELIMINA" per confermare')
      return
    }

    try {
      // Delete setup tokens associated with this device
      const { error: tokensError } = await supabase
        .from('setup_tokens')
        .delete()
        .eq('device_id', deviceToDelete.id)

      if (tokensError) throw tokensError

      // Delete device commands (foreign key constraint)
      const { error: commandsError } = await supabase
        .from('device_commands')
        .delete()
        .eq('device_id', deviceToDelete.id)

      if (commandsError) throw commandsError

      // Delete the device
      const { error: deviceError } = await supabase
        .from('devices')
        .delete()
        .eq('id', deviceToDelete.id)

      if (deviceError) throw deviceError

      showSuccess('Dispositivo, token e comandi eliminati con successo')
      setSelectedDevice(null)
      setShowDeleteModal(false)
      setDeviceToDelete(null)
      setDeleteConfirmText('')
      loadDevices() // Reload the device list
    } catch (error) {
      console.error('Error deleting device:', error)
      showError('Errore durante l\'eliminazione del dispositivo')
    }
  }

  const sendTestPrintCommand = async (deviceId: string, organizationId: string) => {
    try {
      // Load print template for the organization
      const { data: template, error: templateError } = await supabase
        .from('print_templates')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_default', true)
        .single()

      if (templateError || !template) {
        // Try to get any template for this organization
        const { data: anyTemplate, error: anyError } = await supabase
          .from('print_templates')
          .select('*')
          .eq('organization_id', organizationId)
          .limit(1)
          .single()

        if (anyError || !anyTemplate) {
          showError('Nessun template di stampa trovato per questa organizzazione')
          return
        }

        // Use the first template found
        await sendCommand(deviceId, 'test_print', {
          template: anyTemplate
        })
        return
      }

      // Send test print command with template data
      await sendCommand(deviceId, 'test_print', {
        template: template
      })
    } catch (error) {
      console.error('Error sending test print command:', error)
      showError('Errore durante l\'invio del comando di test stampa')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <CheckCircle className="status-icon online" size={16} />
      case 'offline': return <AlertTriangle className="status-icon offline" size={16} />
      case 'setup': return <Clock className="status-icon setup" size={16} />
      case 'maintenance': return <Settings className="status-icon maintenance" size={16} />
      default: return <AlertTriangle className="status-icon" size={16} />
    }
  }

  const getTimeSince = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'Ora'
    if (diffMins < 60) return `${diffMins}m fa`
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h fa`
    return `${Math.floor(diffMins / 1440)}g fa`
  }

  const handleCreateDevice = async () => {
    if (!deviceForm.name || !deviceForm.organization_id || !deviceForm.store_location) {
      showWarning('Compila tutti i campi obbligatori')
      return
    }

    setFormLoading(true)
    try {
      // Generate unique Android ID
      const androidId = `android_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`

      const { error } = await supabase
        .from('devices')
        .insert({
          name: deviceForm.name,
          android_id: androidId,
          device_model: deviceForm.device_model,
          organization_id: deviceForm.organization_id,
          store_location: deviceForm.store_location,
          status: 'setup',
          kiosk_mode_active: false,
          current_app_package: deviceForm.main_app_package,
          language: 'it',
          created_at: new Date().toISOString()
        })

      if (error) throw error

      // Create basic store config
      await supabase
        .from('store_configs')
        .insert({
          store_name: deviceForm.store_location,
          organization_id: deviceForm.organization_id,
          pos_terminal_count: 1,
          kiosk_auto_start: deviceForm.kiosk_auto_start,
          main_app_package: deviceForm.main_app_package
        })

      // Reset form
      setDeviceForm({
        name: '',
        device_model: 'Z108',
        organization_id: '',
        store_location: '',
        store_address: '',
        kiosk_auto_start: true,
        main_app_package: 'com.omnily.bridge'
      })

      setShowAddDeviceModal(false)
      loadDevices()
      showSuccess('Dispositivo creato con successo! Il WiFi verrà configurato durante il setup fisico.')

    } catch (error) {
      console.error('Error creating device:', error)
      showError('Errore durante la creazione del dispositivo')
    } finally {
      setFormLoading(false)
    }
  }

  const handleGenerateQR = async () => {
    if (!deviceForm.name || !deviceForm.organization_id) {
      showWarning('Compila almeno nome dispositivo e organizzazione per generare il QR Code')
      return
    }

    setQrLoading(true)
    try {
      // 1. Generate security token
      const setupToken = crypto.randomUUID()
      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + 24) // Token valido 24 ore

      // 2. Prepare setup data
      const setupData = {
        deviceName: deviceForm.name,
        organizationId: deviceForm.organization_id,
        storeLocation: deviceForm.store_location,
        kioskAutoStart: deviceForm.kiosk_auto_start,
        mainAppPackage: deviceForm.main_app_package,
        setupUrl: `${window.location.origin}/device-setup`,
        configureWifiOnSite: true,
        security: {
          setupToken: setupToken,
          expiresAt: expiresAt.toISOString()
        },
        timestamp: Date.now()
      }

      // 3. Save token to database
      const { error: tokenError } = await supabase
        .from('setup_tokens')
        .insert({
          token: setupToken,
          expires_at: expiresAt.toISOString(),
          setup_data: setupData,
          qr_code_generated: true,
          max_uses: 1
        })

      if (tokenError) {
        console.error('Error saving setup token:', tokenError)
        showError('Errore nel salvataggio del token di sicurezza')
        return
      }

      // 4. Create provisioning JSON with token data (direct JSON in QR, not URL)
      // Using PACKAGE_CHECKSUM in base64url format (Samsung Knox spec)
      const provisioningData = {
        "android.app.extra.PROVISIONING_DEVICE_ADMIN_COMPONENT_NAME": "com.omnilypro.pos/.mdm.MyDeviceAdminReceiver",
        "android.app.extra.PROVISIONING_DEVICE_ADMIN_PACKAGE_CHECKSUM": "eLJy78mw51oy7wGWbuHynGIsy4vZfQUxwWa1Wc-Rjk4",
        "android.app.extra.PROVISIONING_DEVICE_ADMIN_PACKAGE_DOWNLOAD_LOCATION": "https://sjvatdnvewohvswfrdiv.supabase.co/storage/v1/object/public/apks/Omnily-Bridge-pos.apk",
        "android.app.extra.PROVISIONING_SKIP_ENCRYPTION": true,
        "android.app.extra.PROVISIONING_LEAVE_ALL_SYSTEM_APPS_ENABLED": true,
        "android.app.extra.PROVISIONING_ADMIN_EXTRAS_BUNDLE": {
          "setup_token": setupToken,
          "device_name": deviceForm.name,
          "organization_id": deviceForm.organization_id,
          "store_location": deviceForm.store_location
        }
      }

      // Convert provisioning data to JSON string for QR
      const provisioningJsonString = JSON.stringify(provisioningData)

      setQrCodeData(provisioningJsonString)

      // 5. Generate QR code with JSON directly embedded (for afw#setup method)
      const qrCodeImageUrl = await QRCode.toDataURL(provisioningJsonString, {
        width: 400,
        margin: 2,
        errorCorrectionLevel: 'L', // Low correction for more data capacity
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })

      console.log('✅ Provisioning QR generated with embedded JSON')
      console.log('JSON length:', provisioningJsonString.length, 'bytes')

      setQrCodeImage(qrCodeImageUrl)
      setShowQRModal(true)
      showSuccess('QR Code generato con token di sicurezza valido 24 ore')
    } catch (error) {
      console.error('Error generating QR code:', error)
      showError('Errore nella generazione del QR Code')
    } finally {
      setQrLoading(false)
    }
  }

  const handleGenerateQRForDevice = async (device: Device) => {
    setQrLoading(true)
    try {
      // 1. Generate security token
      const setupToken = crypto.randomUUID()
      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + 24) // Token valido 24 ore

      // 2. Prepare setup data
      const setupData = {
        deviceName: device.name,
        deviceId: device.id,
        androidId: device.android_id,
        organizationId: device.organization_id,
        storeLocation: device.store_location,
        kioskAutoStart: true,
        mainAppPackage: device.current_app_package || 'com.omnily.bridge',
        setupUrl: `${window.location.origin}/device-setup`,
        configureWifiOnSite: true,
        security: {
          setupToken: setupToken,
          expiresAt: expiresAt.toISOString()
        },
        timestamp: Date.now()
      }

      // 3. Save token to database
      const { error: tokenError } = await supabase
        .from('setup_tokens')
        .insert({
          token: setupToken,
          device_id: device.id,
          expires_at: expiresAt.toISOString(),
          setup_data: setupData,
          qr_code_generated: true,
          max_uses: 3 // Allow up to 3 uses for existing device re-setup
        })

      if (tokenError) {
        console.error('Error saving setup token:', tokenError)
        showError('Errore nel salvataggio del token di sicurezza')
        return
      }

      // 4. Create provisioning JSON with token data (direct JSON in QR, not URL)
      // Using PACKAGE_CHECKSUM in base64url format (Samsung Knox spec)
      const provisioningData = {
        "android.app.extra.PROVISIONING_DEVICE_ADMIN_COMPONENT_NAME": "com.omnilypro.pos/.mdm.MyDeviceAdminReceiver",
        "android.app.extra.PROVISIONING_DEVICE_ADMIN_PACKAGE_CHECKSUM": "eLJy78mw51oy7wGWbuHynGIsy4vZfQUxwWa1Wc-Rjk4",
        "android.app.extra.PROVISIONING_DEVICE_ADMIN_PACKAGE_DOWNLOAD_LOCATION": "https://sjvatdnvewohvswfrdiv.supabase.co/storage/v1/object/public/apks/Omnily-Bridge-pos.apk",
        "android.app.extra.PROVISIONING_SKIP_ENCRYPTION": true,
        "android.app.extra.PROVISIONING_LEAVE_ALL_SYSTEM_APPS_ENABLED": true,
        "android.app.extra.PROVISIONING_ADMIN_EXTRAS_BUNDLE": {
          "setup_token": setupToken,
          "device_name": deviceForm.name,
          "organization_id": deviceForm.organization_id,
          "store_location": deviceForm.store_location
        }
      }

      // Convert provisioning data to JSON string for QR
      const provisioningJsonString = JSON.stringify(provisioningData)

      setQrCodeData(provisioningJsonString)

      // 5. Generate QR code with JSON directly embedded (for afw#setup method)
      const qrCodeImageUrl = await QRCode.toDataURL(provisioningJsonString, {
        width: 400,
        margin: 2,
        errorCorrectionLevel: 'L', // Low correction for more data capacity
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })

      console.log('✅ Provisioning QR generated with embedded JSON')
      console.log('JSON length:', provisioningJsonString.length, 'bytes')

      setQrCodeImage(qrCodeImageUrl)
      setShowQRModal(true)
      showSuccess(`QR Code generato per ${device.name} - Token valido 24 ore`)
    } catch (error) {
      console.error('Error generating QR code:', error)
      showError('Errore nella generazione del QR Code')
    } finally {
      setQrLoading(false)
    }
  }

  const downloadQRCode = () => {
    if (qrCodeImage) {
      const link = document.createElement('a')
      link.href = qrCodeImage
      link.download = `qr-setup-${deviceForm.name || 'device'}-${Date.now()}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const filteredDevices = devices.filter(device =>
    device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    device.store_location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    device.organization?.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return <PageLoader message="Caricamento dispositivi POS..." size="medium" />
  }

  return (
    <div className="mdm-dashboard admin-dashboard"
         style={{ width: '100%', maxWidth: 'none', margin: 0, padding: 0, boxSizing: 'border-box' }}>
      {/* Tab Navigation */}
      <div className="dashboard-tabs">
        <div style={{ display: 'flex', gap: '0' }}>
          <button
            onClick={() => setActiveTab('devices')}
            className={`tab ${activeTab === 'devices' ? 'active' : ''}`}
          >
            <Monitor size={18} />
            Dispositivi
          </button>
          <button
            onClick={() => setActiveTab('scheduler')}
            className={`tab ${activeTab === 'scheduler' ? 'active' : ''}`}
          >
            <Calendar size={18} />
            Scheduler
          </button>
          <button
            onClick={() => setActiveTab('alerts')}
            className={`tab ${activeTab === 'alerts' ? 'active' : ''}`}
          >
            <Bell size={18} />
            Alert
          </button>
          <button
            onClick={() => setActiveTab('bulk')}
            className={`tab ${activeTab === 'bulk' ? 'active' : ''}`}
          >
            <Zap size={18} />
            Bulk Ops
          </button>
          <button
            onClick={() => setActiveTab('push')}
            className={`tab ${activeTab === 'push' ? 'active' : ''}`}
          >
            <Send size={18} />
            App Push
          </button>
          <button
            onClick={() => setActiveTab('apps')}
            className={`tab ${activeTab === 'apps' ? 'active' : ''}`}
          >
            <Package size={18} />
            Repository App
          </button>
          <button
            onClick={() => setActiveTab('print')}
            className={`tab ${activeTab === 'print' ? 'active' : ''}`}
          >
            <Printer size={18} />
            Template Stampa
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`tab ${activeTab === 'logs' ? 'active' : ''}`}
          >
            <Activity size={18} />
            Activity Logs
          </button>
          <button
            onClick={() => setActiveTab('tokens')}
            className={`tab ${activeTab === 'tokens' ? 'active' : ''}`}
          >
            <Key size={18} />
            Setup Tokens
          </button>
          <button
            onClick={() => setActiveTab('stores')}
            className={`tab ${activeTab === 'stores' ? 'active' : ''}`}
          >
            <Store size={18} />
            Config Store
          </button>
        </div>
      </div>

      {/* Devices Tab */}
      {activeTab === 'devices' && (
        <>
          {/* Header con statistiche */}
          <div className="mdm-header dashboard-header"
               style={{ width: '100%', margin: 0, padding: '1.5rem', boxSizing: 'border-box' }}>
            <div className="header-title-section">
              <h1>📱 Gestione Dispositivi POS</h1>
              <div className="header-actions">
            <button
              className="btn-primary"
              onClick={() => setShowAddDeviceModal(true)}
              title="Aggiungi un nuovo dispositivo POS al sistema"
            >
              <Plus size={20} />
              Aggiungi Dispositivo
            </button>
            <button
              className="btn-secondary"
              onClick={() => setShowQRModal(true)}
              title="Genera QR Code per setup dispositivo"
            >
              <Download size={20} />
              Genera QR Setup
            </button>
            <button
              className="btn-secondary"
              onClick={() => setShowStoreConfigModal(true)}
              title="Gestisci configurazioni avanzate dei negozi"
            >
              <Settings size={20} />
              Configurazioni Store
            </button>
          </div>
        </div>
        <div className="stats-cards dashboard-stats"
             style={{ width: '100%', margin: '0 0 1.5rem 0', padding: '1.5rem', display: 'grid', gap: '1rem', boxSizing: 'border-box' }}>
          <div className="stat-card">
            <Smartphone size={20} />
            <div>
              <div className="stat-value">{stats.total}</div>
              <div className="stat-label">Totali</div>
            </div>
          </div>
          <div className="stat-card online">
            <CheckCircle size={20} />
            <div>
              <div className="stat-value">{stats.online}</div>
              <div className="stat-label">Online</div>
            </div>
          </div>
          <div className="stat-card offline">
            <AlertTriangle size={20} />
            <div>
              <div className="stat-value">{stats.offline}</div>
              <div className="stat-label">Offline</div>
            </div>
          </div>
          <div className="stat-card kiosk">
            <Lock size={20} />
            <div>
              <div className="stat-value">{stats.kioskActive}</div>
              <div className="stat-label">Kiosk Attivo</div>
            </div>
          </div>
        </div>
      </div>

      {/* Barra ricerca e toggle vista */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', alignItems: 'center' }}>
        <div className="search-bar" style={{ flex: 1, marginBottom: 0 }}>
          <Search size={20} />
          <input
            type="text"
            placeholder="Cerca dispositivo, negozio o organizzazione..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '4px', background: 'white', border: '1px solid #d1d5db', borderRadius: '8px', padding: '4px' }}>
          <button
            onClick={() => setViewMode('grid')}
            className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              border: 'none',
              borderRadius: '6px',
              background: viewMode === 'grid' ? '#3b82f6' : 'transparent',
              color: viewMode === 'grid' ? 'white' : '#6b7280',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 500,
              transition: 'all 0.2s'
            }}
          >
            <Grid size={16} />
            Griglia
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`view-toggle-btn ${viewMode === 'map' ? 'active' : ''}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              border: 'none',
              borderRadius: '6px',
              background: viewMode === 'map' ? '#3b82f6' : 'transparent',
              color: viewMode === 'map' ? 'white' : '#6b7280',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 500,
              transition: 'all 0.2s'
            }}
          >
            <Map size={16} />
            Mappa
          </button>
        </div>
      </div>

      {/* Vista Mappa */}
      {viewMode === 'map' && (
        <DeviceMap
          devices={filteredDevices}
          onDeviceSelect={(device) => setSelectedDevice(device)}
        />
      )}

      {/* Vista Griglia */}
      {viewMode === 'grid' && (
        <div className="devices-grid">
        {filteredDevices.map(device => (
          <div
            key={device.id}
            className={`device-card ${device.status}`}
            onClick={() => setSelectedDevice(device)}
          >
            <div className="device-header">
              <div className="device-info">
                <h3>{device.name}</h3>
                <p className="organization">{device.organization?.name}</p>
                <p className="location">
                  <MapPin size={14} />
                  {device.store_location}
                </p>
              </div>
              <div className="device-status">
                {getStatusIcon(device.status)}
                <span className="status-text">{device.status}</span>
              </div>
            </div>

            <div className="device-metrics">
              <div className="metric">
                <Battery size={16} />
                <span>{device.battery_level || 0}%</span>
              </div>
              <div className="metric">
                <Wifi size={16} />
                <span>{device.wifi_ssid || 'N/A'}</span>
              </div>
              <div className="metric">
                <Clock size={16} />
                <span>{getTimeSince(device.last_seen)}</span>
              </div>
            </div>

            <div className="device-actions">
              <button
                className="action-btn primary"
                onClick={(e) => {
                  e.stopPropagation()
                  sendCommand(device.id, 'reboot')
                }}
                disabled={device.status === 'offline'}
              >
                <RefreshCw size={14} />
                Riavvia
              </button>

              <button
                className={`action-btn ${device.kiosk_mode_active ? 'danger' : 'success'}`}
                onClick={(e) => {
                  e.stopPropagation()
                  sendCommand(device.id, device.kiosk_mode_active ? 'kiosk_off' : 'kiosk_on')
                }}
                disabled={device.status === 'offline'}
              >
                {device.kiosk_mode_active ? <Unlock size={14} /> : <Lock size={14} />}
                {device.kiosk_mode_active ? 'Sblocca' : 'Kiosk'}
              </button>

              <button
                className="action-btn warning"
                onClick={(e) => {
                  e.stopPropagation()
                  handleGenerateQRForDevice(device)
                }}
                disabled={qrLoading}
              >
                <Download size={14} />
                QR Setup
              </button>

              <button
                className="action-btn danger"
                onClick={(e) => {
                  e.stopPropagation()
                  sendCommand(device.id, 'kiosk_off')
                }}
                disabled={device.status === 'offline'}
                title="Forza uscita da Kiosk Mode (usa questo se il dispositivo è bloccato)"
              >
                <Unlock size={14} />
                Force Unlock
              </button>
            </div>

            {device.kiosk_mode_active && (
              <div className="kiosk-indicator">
                <Lock size={12} />
                Modalità Kiosk Attiva
              </div>
            )}
          </div>
        ))}

        {filteredDevices.length === 0 && (
          <div className="no-devices">
            <Smartphone size={48} />
            <h3>Nessun dispositivo trovato</h3>
            <p>Non ci sono dispositivi che corrispondono ai criteri di ricerca.</p>
          </div>
        )}
      </div>
      )}

      {/* Device Detail Modal */}
      {selectedDevice && (
        <div className="device-modal-overlay" onClick={() => setSelectedDevice(null)}>
          <div className="device-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedDevice.name}</h2>
              <button
                className="close-btn"
                onClick={() => setSelectedDevice(null)}
              >
                ×
              </button>
            </div>

            <div className="modal-content">
              <div className="device-details">
                <div className="detail-group">
                  <h4>Informazioni Generali</h4>
                  <div className="detail-row">
                    <span>Organizzazione:</span>
                    <span>{selectedDevice.organization?.name}</span>
                  </div>
                  <div className="detail-row">
                    <span>Negozio:</span>
                    <span>{selectedDevice.store_location}</span>
                  </div>
                  <div className="detail-row">
                    <span>Modello:</span>
                    <span>{selectedDevice.device_model || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span>Android ID:</span>
                    <span className="mono">{selectedDevice.android_id}</span>
                  </div>
                </div>

                <div className="detail-group">
                  <h4>Status Sistema</h4>
                  <div className="detail-row">
                    <span>Status:</span>
                    <span className={`status-badge ${selectedDevice.status}`}>
                      {selectedDevice.status}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span>Batteria:</span>
                    <span>{selectedDevice.battery_level || 0}%</span>
                  </div>
                  <div className="detail-row">
                    <span>WiFi:</span>
                    <span>{selectedDevice.wifi_ssid || 'Non connesso'}</span>
                  </div>
                  <div className="detail-row">
                    <span>Ultimo ping:</span>
                    <span>{getTimeSince(selectedDevice.last_seen)}</span>
                  </div>
                </div>

                <div className="detail-group">
                  <h4>Configurazione</h4>
                  <div className="detail-row">
                    <span>Modalità Kiosk:</span>
                    <span className={selectedDevice.kiosk_mode_active ? 'active' : 'inactive'}>
                      {selectedDevice.kiosk_mode_active ? 'Attiva' : 'Non attiva'}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span>App corrente:</span>
                    <span className="mono">{selectedDevice.current_app_package || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span>Lingua:</span>
                    <span>{selectedDevice.language}</span>
                  </div>
                </div>

                {selectedDevice.latitude && selectedDevice.longitude ? (
                  <div className="detail-group">
                    <h4>📍 Posizione GPS</h4>
                    <div className="detail-row">
                      <span>Latitudine:</span>
                      <span className="mono">{selectedDevice.latitude.toFixed(6)}°</span>
                    </div>
                    <div className="detail-row">
                      <span>Longitudine:</span>
                      <span className="mono">{selectedDevice.longitude.toFixed(6)}°</span>
                    </div>
                    <div className="detail-row">
                      <span>Precisione:</span>
                      <span>{selectedDevice.location_accuracy_meters ? `±${selectedDevice.location_accuracy_meters}m` : 'N/A'}</span>
                    </div>
                    <div className="detail-row">
                      <span>Indirizzo approssimativo:</span>
                      <span>{selectedDevice.store_location}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                      <button
                        className="action-btn secondary"
                        onClick={() => {
                          const url = `https://www.google.com/maps?q=${selectedDevice.latitude},${selectedDevice.longitude}`
                          window.open(url, '_blank')
                        }}
                        style={{ flex: 1 }}
                      >
                        <MapPin size={14} />
                        Google Maps
                      </button>
                      <button
                        className="action-btn secondary"
                        onClick={() => {
                          const url = `https://www.openstreetmap.org/?mlat=${selectedDevice.latitude}&mlon=${selectedDevice.longitude}&zoom=16`
                          window.open(url, '_blank')
                        }}
                        style={{ flex: 1 }}
                      >
                        <MapPin size={14} />
                        OpenStreetMap
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="detail-group">
                    <h4>📍 Posizione GPS</h4>
                    <div style={{
                      padding: '12px',
                      background: '#fef3c7',
                      border: '1px solid #f59e0b',
                      borderRadius: '6px',
                      fontSize: '13px',
                      color: '#92400e'
                    }}>
                      ⚠️ Nessuna posizione GPS disponibile. Il dispositivo deve inviare le coordinate.
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-actions">
                <button
                  className="action-btn primary"
                  onClick={() => sendCommand(selectedDevice.id, 'reboot')}
                  disabled={selectedDevice.status === 'offline'}
                >
                  <RefreshCw size={16} />
                  Riavvia Dispositivo
                </button>

                <button
                  className={`action-btn ${selectedDevice.kiosk_mode_active ? 'danger' : 'success'}`}
                  onClick={() => sendCommand(
                    selectedDevice.id,
                    selectedDevice.kiosk_mode_active ? 'kiosk_off' : 'kiosk_on'
                  )}
                  disabled={selectedDevice.status === 'offline'}
                >
                  {selectedDevice.kiosk_mode_active ? <Unlock size={16} /> : <Lock size={16} />}
                  {selectedDevice.kiosk_mode_active ? 'Disattiva Kiosk' : 'Attiva Kiosk'}
                </button>

                <button
                  className="action-btn danger"
                  onClick={() => sendCommand(selectedDevice.id, 'kiosk_off')}
                  disabled={selectedDevice.status === 'offline'}
                  title="Forza uscita da Kiosk Mode anche se lo stato è incorretto"
                >
                  <Unlock size={16} />
                  Force Unlock 🆘
                </button>

                <button
                  className="action-btn warning"
                  onClick={() => showConfirm(
                    'Sei sicuro di voler spegnere il dispositivo? Questa azione richiederà un riavvio manuale.',
                    () => sendCommand(selectedDevice.id, 'shutdown'),
                    {
                      title: 'Spegni dispositivo',
                      confirmText: 'Spegni',
                      type: 'danger'
                    }
                  )}
                  disabled={selectedDevice.status === 'offline'}
                >
                  <Power size={16} />
                  Spegni
                </button>

                <button
                  className="action-btn secondary"
                  onClick={() => sendCommand(selectedDevice.id, 'locate')}
                  disabled={selectedDevice.status === 'offline'}
                >
                  <MapPin size={16} />
                  Localizza
                </button>

                <button
                  className="action-btn danger"
                  onClick={() => {
                    setDeviceToDelete(selectedDevice)
                    setShowDeleteModal(true)
                    setDeleteConfirmText('')
                  }}
                  style={{ marginTop: '12px', width: '100%' }}
                >
                  <Trash2 size={16} />
                  Elimina Dispositivo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Device Modal */}
      {showAddDeviceModal && (
        <div className="device-modal-overlay" onClick={() => setShowAddDeviceModal(false)}>
          <div className="device-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>➕ Aggiungi Nuovo Dispositivo POS</h2>
              <button
                className="close-btn"
                onClick={() => setShowAddDeviceModal(false)}
              >
                ×
              </button>
            </div>

            <div className="modal-content">
              <div className="add-device-form">
                <div className="form-section">
                  <h4>📱 Informazioni Dispositivo</h4>
                  <div className="form-row">
                    <label>Nome Dispositivo:</label>
                    <input
                      type="text"
                      placeholder="es. POS-Milano-01"
                      value={deviceForm.name}
                      onChange={(e) => setDeviceForm({...deviceForm, name: e.target.value})}
                    />
                  </div>
                  <div className="form-row">
                    <label>Modello:</label>
                    <select
                      value={deviceForm.device_model}
                      onChange={(e) => setDeviceForm({...deviceForm, device_model: e.target.value})}
                    >
                      <option value="Z108">Z108 Terminal</option>
                      <option value="custom">Altro Modello</option>
                    </select>
                  </div>
                  <div className="form-row">
                    <label>Android ID:</label>
                    <input type="text" placeholder="Verrà generato automaticamente" disabled />
                  </div>
                </div>

                <div className="form-section">
                  <h4>🏪 Associazione Store</h4>
                  <div className="form-row">
                    <label>Organizzazione:</label>
                    <select
                      value={deviceForm.organization_id}
                      onChange={(e) => setDeviceForm({...deviceForm, organization_id: e.target.value})}
                    >
                      <option value="">Seleziona Organizzazione...</option>
                      {organizations.map(org => (
                        <option key={org.id} value={org.id}>{org.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-row">
                    <label>Negozio/Ubicazione:</label>
                    <input
                      type="text"
                      placeholder="es. Milano Centro, Roma Termini"
                      value={deviceForm.store_location}
                      onChange={(e) => setDeviceForm({...deviceForm, store_location: e.target.value})}
                    />
                  </div>
                  <div className="form-row">
                    <label>Indirizzo:</label>
                    <input
                      type="text"
                      placeholder="Via Roma 123, Milano"
                      value={deviceForm.store_address}
                      onChange={(e) => setDeviceForm({...deviceForm, store_address: e.target.value})}
                    />
                  </div>
                </div>

                <div className="form-section">
                  <h4>📶 Configurazione Rete</h4>
                  <div style={{
                    background: '#f0f9ff',
                    border: '1px solid #0284c7',
                    borderRadius: '8px',
                    padding: '12px',
                    fontSize: '13px',
                    color: '#0369a1'
                  }}>
                    ℹ️ <strong>WiFi sarà configurato durante il setup fisico</strong><br />
                    Il tecnico sul posto selezionerà la rete WiFi disponibile e inserirà le credenziali
                  </div>
                </div>

                <div className="form-section">
                  <h4>⚙️ Configurazione Kiosk</h4>
                  <div className="form-row">
                    <label>
                      <input
                        type="checkbox"
                        checked={deviceForm.kiosk_auto_start}
                        onChange={(e) => setDeviceForm({...deviceForm, kiosk_auto_start: e.target.checked})}
                      />
                      Attiva modalità Kiosk all'avvio
                    </label>
                  </div>
                  <div className="form-row">
                    <label>App principale:</label>
                    <select
                      value={deviceForm.main_app_package}
                      onChange={(e) => setDeviceForm({...deviceForm, main_app_package: e.target.value})}
                    >
                      <option value="com.omnily.bridge">OMNILY Bridge POS</option>
                      <option value="custom">Altra App</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="modal-actions">
                <button
                  className="action-btn secondary"
                  onClick={() => setShowAddDeviceModal(false)}
                >
                  Annulla
                </button>
                <button
                  className="action-btn primary"
                  onClick={handleGenerateQR}
                  disabled={formLoading || qrLoading}
                >
                  <Download size={16} />
                  {qrLoading ? 'Generando...' : 'Genera QR Code Setup'}
                </button>
                <button
                  className="action-btn success"
                  onClick={handleCreateDevice}
                  disabled={formLoading}
                >
                  <Plus size={16} />
                  {formLoading ? 'Creando...' : 'Crea Dispositivo'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQRModal && (
        <div className="device-modal-overlay" onClick={() => setShowQRModal(false)}>
          <div className="device-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📱 QR Code Setup Dispositivo</h2>
              <button
                className="close-btn"
                onClick={() => setShowQRModal(false)}
              >
                ×
              </button>
            </div>

            <div className="modal-content">
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <div style={{
                  backgroundColor: '#fff',
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px',
                  padding: '20px',
                  margin: '20px 0',
                  minHeight: '320px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {qrCodeImage ? (
                    <>
                      <img
                        src={qrCodeImage}
                        alt="QR Code Setup Dispositivo"
                        style={{
                          width: '300px',
                          height: '300px',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px'
                        }}
                      />
                      <p style={{
                        color: '#059669',
                        fontSize: '14px',
                        fontWeight: '600',
                        marginTop: '12px',
                        marginBottom: '0'
                      }}>
                        ✅ QR Code generato con successo
                      </p>
                    </>
                  ) : (
                    <div style={{
                      fontSize: '18px',
                      color: '#6b7280',
                      textAlign: 'center'
                    }}>
                      📱 Genera QR Code dal form o dalla lista dispositivi
                    </div>
                  )}
                </div>
                <p style={{ color: '#6b7280', fontSize: '14px' }}>
                  <strong>Istruzioni:</strong> Stampa questo QR Code e consegnalo al tecnico per la configurazione del dispositivo sul posto.
                </p>
                {qrCodeData && (
                  <details style={{
                    marginTop: '16px',
                    textAlign: 'left',
                    backgroundColor: '#f9fafb',
                    padding: '12px',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}>
                    <summary style={{ cursor: 'pointer', fontWeight: '600' }}>
                      Visualizza dati configurazione
                    </summary>
                    <pre style={{
                      marginTop: '8px',
                      fontSize: '11px',
                      overflow: 'auto',
                      backgroundColor: '#ffffff',
                      padding: '8px',
                      borderRadius: '4px',
                      border: '1px solid #e5e7eb'
                    }}>
                      {qrCodeData}
                    </pre>
                  </details>
                )}
              </div>

              <div className="modal-actions">
                <button
                  className="action-btn secondary"
                  onClick={() => setShowQRModal(false)}
                >
                  Chiudi
                </button>
                <button
                  className="action-btn primary"
                  onClick={downloadQRCode}
                  disabled={!qrCodeImage}
                >
                  <Download size={16} />
                  Scarica QR Code
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Store Config Modal */}
      {showStoreConfigModal && (
        <div className="device-modal-overlay" onClick={() => setShowStoreConfigModal(false)}>
          <div className="device-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>⚙️ Configurazioni Store</h2>
              <button
                className="close-btn"
                onClick={() => setShowStoreConfigModal(false)}
              >
                ×
              </button>
            </div>

            <div className="modal-content">
              <div className="add-device-form">
                <div className="form-section">
                  <h4>🏪 Configurazioni Globali Store</h4>
                  <div style={{
                    background: '#f0f9ff',
                    border: '1px solid #0284c7',
                    borderRadius: '8px',
                    padding: '16px',
                    marginBottom: '20px'
                  }}>
                    <h5 style={{ margin: '0 0 12px 0', color: '#0369a1' }}>
                      🔧 Gestione Configurazioni Template
                    </h5>
                    <p style={{
                      margin: '0',
                      fontSize: '14px',
                      color: '#0369a1',
                      lineHeight: '1.4'
                    }}>
                      Questa sezione permette di creare template di configurazione per diversi tipi di store
                      (ristoranti, retail, farmacie, etc.) che possono essere applicati automaticamente ai dispositivi.
                    </p>
                  </div>

                  <div className="form-row">
                    <label>Template predefiniti:</label>
                    <select>
                      <option>🍕 Ristorante/Pizzeria</option>
                      <option>🛒 Negozio Retail</option>
                      <option>💊 Farmacia</option>
                      <option>☕ Bar/Caffetteria</option>
                      <option>🏪 Supermercato</option>
                      <option>⚙️ Configurazione Personalizzata</option>
                    </select>
                  </div>
                </div>

                <div className="form-section">
                  <h4>🖥️ Impostazioni Display POS</h4>
                  <div className="form-row">
                    <label>
                      <input type="checkbox" defaultChecked />
                      Abilita screensaver dopo inattività
                    </label>
                  </div>
                  <div className="form-row">
                    <label>Timeout screensaver (minuti):</label>
                    <input type="number" defaultValue="5" min="1" max="60" />
                  </div>
                  <div className="form-row">
                    <label>
                      <input type="checkbox" defaultChecked />
                      Mostra logo aziendale nello screensaver
                    </label>
                  </div>
                </div>

                <div className="form-section">
                  <h4>🔒 Sicurezza e Accesso</h4>
                  <div className="form-row">
                    <label>
                      <input type="checkbox" defaultChecked />
                      Richiedi PIN per accesso admin
                    </label>
                  </div>
                  <div className="form-row">
                    <label>
                      <input type="checkbox" />
                      Blocco automatico dopo ore lavorative
                    </label>
                  </div>
                  <div className="form-row">
                    <label>Orario chiusura:</label>
                    <input type="time" defaultValue="22:00" />
                  </div>
                </div>

                <div className="form-section">
                  <h4>🖨️ Configurazione Stampa</h4>
                  <div className="form-row">
                    <label>
                      <input type="checkbox" defaultChecked />
                      Stampa automatica scontrini
                    </label>
                  </div>
                  <div className="form-row">
                    <label>Formato carta:</label>
                    <select>
                      <option>80mm termico</option>
                      <option>58mm termico</option>
                      <option>A4 standard</option>
                    </select>
                  </div>
                  <div className="form-row">
                    <label>
                      <input type="checkbox" />
                      Stampa logo su scontrini
                    </label>
                  </div>
                </div>

                <div className="form-section">
                  <h4>📡 Connettività e Sincronizzazione</h4>
                  <div className="form-row">
                    <label>Frequenza sincronizzazione dati:</label>
                    <select>
                      <option>Ogni 5 minuti</option>
                      <option>Ogni 15 minuti</option>
                      <option>Ogni ora</option>
                      <option>Solo manuale</option>
                    </select>
                  </div>
                  <div className="form-row">
                    <label>
                      <input type="checkbox" defaultChecked />
                      Backup automatico dati locali
                    </label>
                  </div>
                </div>
              </div>

              <div className="modal-actions">
                <button
                  className="action-btn secondary"
                  onClick={() => setShowStoreConfigModal(false)}
                >
                  Annulla
                </button>
                <button className="action-btn warning">
                  <Download size={16} />
                  Esporta Configurazione
                </button>
                <button className="action-btn success">
                  <Settings size={16} />
                  Salva Template
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
        </>
      )}

      {/* Command Scheduler Tab */}
      {activeTab === 'scheduler' && (
        <CommandScheduler />
      )}

      {/* Alerts System Tab */}
      {activeTab === 'alerts' && (
        <AlertsSystem />
      )}

      {/* Bulk Operations Tab */}
      {activeTab === 'bulk' && (
        <BulkOperations />
      )}

      {/* App Push Update Tab */}
      {activeTab === 'push' && (
        <AppPushUpdate />
      )}

      {/* App Repository Tab */}
      {activeTab === 'apps' && (
        <AppRepositoryManager />
      )}

      {/* Print Templates Tab */}
      {activeTab === 'print' && (
        <PrintTemplateManager organizationId={undefined} />
      )}

      {/* Activity Logs Tab */}
      {activeTab === 'logs' && (
        <ActivityLogsViewer />
      )}

      {/* Setup Tokens Tab */}
      {activeTab === 'tokens' && (
        <TokenSetupViewer />
      )}

      {/* Store Config Tab */}
      {activeTab === 'stores' && (
        <StoreConfigManager />
      )}

      {/* Delete Device Modal with Text Confirmation */}
      {showDeleteModal && deviceToDelete && (
        <div className="device-modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="device-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2 style={{ color: '#dc2626' }}>⚠️ Elimina Dispositivo</h2>
              <button
                className="close-btn"
                onClick={() => {
                  setShowDeleteModal(false)
                  setDeviceToDelete(null)
                  setDeleteConfirmText('')
                }}
              >
                ×
              </button>
            </div>

            <div className="modal-content" style={{ padding: '24px' }}>
              <div style={{
                background: '#fef2f2',
                border: '2px solid #dc2626',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '20px'
              }}>
                <p style={{ fontWeight: 600, marginBottom: '12px', color: '#991b1b' }}>
                  Stai per eliminare il dispositivo "{deviceToDelete.name}"
                </p>
                <p style={{ fontSize: '14px', marginBottom: '8px', color: '#7f1d1d' }}>
                  Questa azione eliminerà permanentemente:
                </p>
                <ul style={{ fontSize: '14px', color: '#7f1d1d', paddingLeft: '20px', marginBottom: 0 }}>
                  <li>Il dispositivo</li>
                  <li>Tutti i token setup associati</li>
                  <li>Tutti i comandi associati</li>
                </ul>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 600,
                  marginBottom: '8px',
                  color: '#374151'
                }}>
                  Digita <span style={{ color: '#dc2626', fontFamily: 'monospace' }}>ELIMINA</span> per confermare:
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value.toUpperCase())}
                  placeholder="ELIMINA"
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '16px',
                    border: '2px solid #d1d5db',
                    borderRadius: '6px',
                    fontFamily: 'monospace',
                    letterSpacing: '2px'
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && deleteConfirmText === 'ELIMINA') {
                      confirmDeleteDevice()
                    }
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => {
                    setShowDeleteModal(false)
                    setDeviceToDelete(null)
                    setDeleteConfirmText('')
                  }}
                  className="action-btn secondary"
                  style={{ flex: 1 }}
                >
                  Annulla
                </button>
                <button
                  onClick={confirmDeleteDevice}
                  disabled={deleteConfirmText !== 'ELIMINA'}
                  className="action-btn danger"
                  style={{
                    flex: 1,
                    opacity: deleteConfirmText === 'ELIMINA' ? 1 : 0.5,
                    cursor: deleteConfirmText === 'ELIMINA' ? 'pointer' : 'not-allowed'
                  }}
                >
                  <Trash2 size={16} />
                  Elimina Tutto
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />

      {/* Confirm Modal */}
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

export default MDMDashboard