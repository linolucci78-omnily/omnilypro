import React, { useState } from 'react'
import {
  Activity, Zap, Wifi, Printer, Smartphone, CreditCard, Building2,
  CheckCircle2, XCircle, AlertTriangle, RefreshCw, Settings,
  Terminal, TestTube, BarChart3, Wrench, PlayCircle, Trash2
} from 'lucide-react'
import './POSIntegrationHub.css'

interface HardwareStatus {
  bridge: {
    status: 'connected' | 'disconnected' | 'checking'
    message?: string
    version?: string
  }
  network: {
    status: 'online' | 'offline' | 'checking'
    ip?: string
    type?: string
  }
  printer: {
    status: 'ready' | 'error' | 'offline' | 'checking'
    message?: string
    model?: string
  }
  nfc: {
    status: 'available' | 'unavailable' | 'checking'
    message?: string
  }
  emv: {
    status: 'available' | 'unavailable' | 'checking'
    message?: string
  }
  system: {
    manufacturer?: string
    model?: string
  }
}

interface NFCResult {
  cardUID?: string
  cardType?: string
  customerName?: string
  loyaltyPoints?: number
  timestamp?: number
}

interface POSIntegrationHubProps {
  organizationId: string
  organizationName: string
  posModel?: string
  posConnection?: string
  primaryColor: string
  secondaryColor: string
  hardwareStatus: HardwareStatus
  nfcResult?: NFCResult
  matrixLogs: string[]
  monitorEnabled: boolean
  matrixLogsRef: React.RefObject<HTMLDivElement>
  onCheckHardware: () => void
  onTestPrinter: () => void
  onTestNFC: () => void
  onToggleMonitor: () => void
  onClearLogs: () => void
}

const POSIntegrationHub: React.FC<POSIntegrationHubProps> = ({
  organizationId,
  organizationName,
  posModel,
  posConnection,
  primaryColor,
  secondaryColor,
  hardwareStatus,
  nfcResult,
  matrixLogs,
  monitorEnabled,
  matrixLogsRef,
  onCheckHardware,
  onTestPrinter,
  onTestNFC,
  onToggleMonitor,
  onClearLogs
}) => {
  // Calcola statistiche overview
  const getComponentsOnline = () => {
    let online = 0
    if (hardwareStatus.bridge.status === 'connected') online++
    if (hardwareStatus.network.status === 'online') online++
    if (hardwareStatus.printer.status === 'ready') online++
    if (hardwareStatus.nfc.status === 'available') online++
    if (hardwareStatus.emv.status === 'available') online++
    return online
  }

  const getTotalComponents = () => 5

  const getSystemHealth = () => {
    const online = getComponentsOnline()
    const total = getTotalComponents()
    const percentage = (online / total) * 100

    if (percentage === 100) return { status: 'excellent', label: 'Eccellente', color: '#10b981' }
    if (percentage >= 80) return { status: 'good', label: 'Buono', color: '#3b82f6' }
    if (percentage >= 60) return { status: 'warning', label: 'Attenzione', color: '#f59e0b' }
    return { status: 'critical', label: 'Critico', color: '#ef4444' }
  }

  const componentsOnline = getComponentsOnline()
  const totalComponents = getTotalComponents()
  const systemHealth = getSystemHealth()

  return (
    <div
      className="pos-integration-hub"
      style={{
        '--primary-color': primaryColor,
        '--secondary-color': secondaryColor
      } as React.CSSProperties}
    >
      {/* Header con immagine POS */}
      <div className="pos-hub-header">
        <div className="pos-hub-header-content">
          <div className="pos-device-showcase">
            <img
              src="https://sjvatdnvewohvswfrdiv.supabase.co/storage/v1/object/public/IMG/logos/ZCS108.png"
              alt="ZCS108 POS Terminal"
              className="pos-device-image"
            />
            <div className="pos-device-badge">
              <Terminal size={20} />
              <span>ZCS108 Terminal</span>
            </div>
          </div>
          <div className="pos-hub-header-text">
            <h1>Centro Integrazione POS</h1>
            <p>Monitoraggio hardware, testing e diagnostica in tempo reale</p>
            <div className="pos-org-info">
              <Building2 size={16} />
              <span>{organizationName}</span>
              <span className="separator">•</span>
              <span>{posModel || 'ZCS108'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Statistiche Overview */}
      <div className="pos-stats-grid">
        <div className="pos-stat-card">
          <div className="pos-stat-icon" style={{ background: systemHealth.color }}>
            <Activity size={24} />
          </div>
          <div className="pos-stat-content">
            <div className="pos-stat-value">{systemHealth.label}</div>
            <div className="pos-stat-label">Stato Sistema</div>
          </div>
        </div>

        <div className="pos-stat-card">
          <div className="pos-stat-icon" style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}>
            <CheckCircle2 size={24} />
          </div>
          <div className="pos-stat-content">
            <div className="pos-stat-value">{componentsOnline}/{totalComponents}</div>
            <div className="pos-stat-label">Componenti Online</div>
          </div>
        </div>

        <div className="pos-stat-card">
          <div className="pos-stat-icon" style={{ background: hardwareStatus.bridge.status === 'connected' ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #ef4444, #dc2626)' }}>
            <Zap size={24} />
          </div>
          <div className="pos-stat-content">
            <div className="pos-stat-value">
              {hardwareStatus.bridge.status === 'connected' ? 'Connesso' : 'Offline'}
            </div>
            <div className="pos-stat-label">Bridge Android</div>
          </div>
        </div>

        <div className="pos-stat-card">
          <div className="pos-stat-icon" style={{ background: hardwareStatus.network.status === 'online' ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #ef4444, #dc2626)' }}>
            <Wifi size={24} />
          </div>
          <div className="pos-stat-content">
            <div className="pos-stat-value">
              {hardwareStatus.network.status === 'online' ? 'Online' : 'Offline'}
            </div>
            <div className="pos-stat-label">Connessione</div>
          </div>
        </div>
      </div>

      {/* Hardware Monitoring Section */}
      <div className="pos-hardware-section">
        <h2>
          <Activity size={28} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />
          Monitoraggio Hardware
          <button className="pos-refresh-btn" onClick={onCheckHardware}>
            <RefreshCw size={16} />
            Aggiorna Stato
          </button>
        </h2>

        <div className="pos-hardware-grid">
          {/* Bridge Android */}
          <div className={`pos-hardware-card status-${hardwareStatus.bridge.status}`}>
            <div className="pos-hardware-header">
              <div className="pos-hardware-icon">
                <Zap size={28} />
              </div>
              <div className="pos-hardware-title">
                <h3>Bridge Android</h3>
                <p>Connettore SDK</p>
              </div>
              <div className={`pos-status-indicator status-${hardwareStatus.bridge.status}`}>
                {hardwareStatus.bridge.status === 'connected' && <CheckCircle2 size={20} />}
                {hardwareStatus.bridge.status === 'disconnected' && <XCircle size={20} />}
                {hardwareStatus.bridge.status === 'checking' && <AlertTriangle size={20} />}
              </div>
            </div>
            <div className="pos-hardware-body">
              <p className="pos-hardware-message">{hardwareStatus.bridge.message || 'Verifica in corso...'}</p>
              {hardwareStatus.bridge.version && (
                <div className="pos-hardware-detail">
                  <strong>Versione:</strong> {hardwareStatus.bridge.version}
                </div>
              )}
            </div>
            <div className={`pos-hardware-badge status-${hardwareStatus.bridge.status}`}>
              {hardwareStatus.bridge.status === 'connected' && 'Connesso'}
              {hardwareStatus.bridge.status === 'disconnected' && 'Disconnesso'}
              {hardwareStatus.bridge.status === 'checking' && 'Verifica...'}
            </div>
          </div>

          {/* Network */}
          <div className={`pos-hardware-card status-${hardwareStatus.network.status}`}>
            <div className="pos-hardware-header">
              <div className="pos-hardware-icon">
                <Wifi size={28} />
              </div>
              <div className="pos-hardware-title">
                <h3>Connessione Rete</h3>
                <p>WiFi / Ethernet</p>
              </div>
              <div className={`pos-status-indicator status-${hardwareStatus.network.status}`}>
                {hardwareStatus.network.status === 'online' && <CheckCircle2 size={20} />}
                {hardwareStatus.network.status === 'offline' && <XCircle size={20} />}
                {hardwareStatus.network.status === 'checking' && <AlertTriangle size={20} />}
              </div>
            </div>
            <div className="pos-hardware-body">
              <div className="pos-hardware-detail">
                <strong>IP:</strong> {hardwareStatus.network.ip || 'N/A'}
              </div>
              <div className="pos-hardware-detail">
                <strong>Tipo:</strong> {hardwareStatus.network.type || 'N/A'}
              </div>
            </div>
            <div className={`pos-hardware-badge status-${hardwareStatus.network.status}`}>
              {hardwareStatus.network.status === 'online' && 'Online'}
              {hardwareStatus.network.status === 'offline' && 'Offline'}
              {hardwareStatus.network.status === 'checking' && 'Verifica...'}
            </div>
          </div>

          {/* Printer */}
          <div className={`pos-hardware-card status-${hardwareStatus.printer.status}`}>
            <div className="pos-hardware-header">
              <div className="pos-hardware-icon">
                <Printer size={28} />
              </div>
              <div className="pos-hardware-title">
                <h3>Stampante</h3>
                <p>Termica 58/80mm</p>
              </div>
              <div className={`pos-status-indicator status-${hardwareStatus.printer.status}`}>
                {hardwareStatus.printer.status === 'ready' && <CheckCircle2 size={20} />}
                {(hardwareStatus.printer.status === 'error' || hardwareStatus.printer.status === 'offline') && <XCircle size={20} />}
                {hardwareStatus.printer.status === 'checking' && <AlertTriangle size={20} />}
              </div>
            </div>
            <div className="pos-hardware-body">
              <p className="pos-hardware-message">{hardwareStatus.printer.message || 'Verifica in corso...'}</p>
              {hardwareStatus.printer.model && (
                <div className="pos-hardware-detail">
                  <strong>Modello:</strong> {hardwareStatus.printer.model}
                </div>
              )}
            </div>
            <div className="pos-hardware-footer">
              <div className={`pos-hardware-badge status-${hardwareStatus.printer.status}`}>
                {hardwareStatus.printer.status === 'ready' && 'Pronta'}
                {hardwareStatus.printer.status === 'error' && 'Errore'}
                {hardwareStatus.printer.status === 'offline' && 'Offline'}
                {hardwareStatus.printer.status === 'checking' && 'Verifica...'}
              </div>
              <button
                className="pos-test-btn"
                onClick={onTestPrinter}
                disabled={hardwareStatus.printer.status !== 'ready'}
              >
                <Printer size={16} />
                Test Stampa
              </button>
            </div>
          </div>

          {/* NFC Reader */}
          <div className={`pos-hardware-card status-${hardwareStatus.nfc.status}`}>
            <div className="pos-hardware-header">
              <div className="pos-hardware-icon">
                <Smartphone size={28} />
              </div>
              <div className="pos-hardware-title">
                <h3>Lettore NFC</h3>
                <p>Contactless Reader</p>
              </div>
              <div className={`pos-status-indicator status-${hardwareStatus.nfc.status}`}>
                {hardwareStatus.nfc.status === 'available' && <CheckCircle2 size={20} />}
                {hardwareStatus.nfc.status === 'unavailable' && <XCircle size={20} />}
                {hardwareStatus.nfc.status === 'checking' && <AlertTriangle size={20} />}
              </div>
            </div>
            <div className="pos-hardware-body">
              <p className="pos-hardware-message">{hardwareStatus.nfc.message || 'Verifica in corso...'}</p>

              {nfcResult && (
                <div className="nfc-result-card">
                  <div className="nfc-result-header">
                    <Smartphone size={16} />
                    <strong>Tessera Letta</strong>
                  </div>
                  <div className="nfc-result-detail">
                    <strong>UID:</strong> {nfcResult.cardUID?.slice(0, 16)}...
                  </div>
                  <div className="nfc-result-detail">
                    <strong>Tipo:</strong> {nfcResult.cardType || 'N/A'}
                  </div>
                  {nfcResult.customerName && (
                    <div className="nfc-result-detail">
                      <strong>Cliente:</strong> {nfcResult.customerName}
                    </div>
                  )}
                  {nfcResult.loyaltyPoints !== undefined && (
                    <div className="nfc-result-detail">
                      <strong>Punti:</strong> {nfcResult.loyaltyPoints}
                    </div>
                  )}
                  <div className="nfc-result-timestamp">
                    {new Date(nfcResult.timestamp || Date.now()).toLocaleString('it-IT')}
                  </div>
                </div>
              )}
            </div>
            <div className="pos-hardware-footer">
              <div className={`pos-hardware-badge status-${hardwareStatus.nfc.status}`}>
                {hardwareStatus.nfc.status === 'available' && 'Disponibile'}
                {hardwareStatus.nfc.status === 'unavailable' && 'Non disponibile'}
                {hardwareStatus.nfc.status === 'checking' && 'Verifica...'}
              </div>
              <button
                className="pos-test-btn"
                onClick={onTestNFC}
                disabled={hardwareStatus.nfc.status !== 'available'}
              >
                <Smartphone size={16} />
                Test NFC
              </button>
            </div>
          </div>

          {/* EMV/PinPad */}
          <div className={`pos-hardware-card status-${hardwareStatus.emv.status}`}>
            <div className="pos-hardware-header">
              <div className="pos-hardware-icon">
                <CreditCard size={28} />
              </div>
              <div className="pos-hardware-title">
                <h3>Terminale Pagamenti</h3>
                <p>EMV / PinPad</p>
              </div>
              <div className={`pos-status-indicator status-${hardwareStatus.emv.status}`}>
                {hardwareStatus.emv.status === 'available' && <CheckCircle2 size={20} />}
                {hardwareStatus.emv.status === 'unavailable' && <XCircle size={20} />}
                {hardwareStatus.emv.status === 'checking' && <AlertTriangle size={20} />}
              </div>
            </div>
            <div className="pos-hardware-body">
              <p className="pos-hardware-message">{hardwareStatus.emv.message || 'Verifica in corso...'}</p>
            </div>
            <div className={`pos-hardware-badge status-${hardwareStatus.emv.status}`}>
              {hardwareStatus.emv.status === 'available' && 'Disponibile'}
              {hardwareStatus.emv.status === 'unavailable' && 'Non disponibile'}
              {hardwareStatus.emv.status === 'checking' && 'Verifica...'}
            </div>
          </div>

          {/* System Info */}
          <div className="pos-hardware-card pos-system-info">
            <div className="pos-hardware-header">
              <div className="pos-hardware-icon">
                <Building2 size={28} />
              </div>
              <div className="pos-hardware-title">
                <h3>Informazioni Sistema</h3>
                <p>Device Info</p>
              </div>
            </div>
            <div className="pos-hardware-body">
              <div className="pos-hardware-detail">
                <strong>Organizzazione:</strong> {organizationName}
              </div>
              <div className="pos-hardware-detail">
                <strong>Modello POS:</strong> {posModel || 'ZCS108'}
              </div>
              <div className="pos-hardware-detail">
                <strong>Tipo:</strong> {posConnection || 'Android Terminal'}
              </div>
              {(hardwareStatus.system.manufacturer || hardwareStatus.system.model) && (
                <>
                  <div className="pos-hardware-detail">
                    <strong>Manufacturer:</strong> {hardwareStatus.system.manufacturer || 'N/A'}
                  </div>
                  <div className="pos-hardware-detail">
                    <strong>Model:</strong> {hardwareStatus.system.model || 'N/A'}
                  </div>
                </>
              )}
            </div>
            <div className="pos-hardware-badge system">
              Sistema Operativo
            </div>
          </div>
        </div>
      </div>

      {/* Testing Suite - Sezione Test Hardware */}
      <div className="pos-testing-suite">
        <h2>
          <TestTube size={28} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />
          Testing Suite Hardware
        </h2>
        <p className="pos-testing-description">
          Esegui test su tutti i componenti hardware del terminale POS
        </p>

        <div className="pos-testing-grid">
          {/* Test Stampante */}
          <div className="pos-test-card">
            <div className="pos-test-header">
              <div className="pos-test-icon" style={{ background: 'linear-gradient(135deg, var(--primary-color, #dc2626), var(--secondary-color, #ef4444))' }}>
                <Printer size={32} />
              </div>
              <div className="pos-test-info">
                <h3>Test Stampante</h3>
                <p>Stampa una ricevuta di test per verificare il funzionamento</p>
              </div>
            </div>
            <div className="pos-test-status">
              <span className={`pos-test-badge ${hardwareStatus.printer.status}`}>
                {hardwareStatus.printer.status === 'ready' && '✓ Pronta'}
                {hardwareStatus.printer.status === 'error' && '✗ Errore'}
                {hardwareStatus.printer.status === 'offline' && '○ Offline'}
                {hardwareStatus.printer.status === 'checking' && '◌ Verifica...'}
              </span>
            </div>
            <button
              className="pos-test-action-btn"
              onClick={onTestPrinter}
              disabled={hardwareStatus.printer.status !== 'ready'}
            >
              <Printer size={20} />
              Esegui Test Stampa
            </button>
          </div>

          {/* Test Lettore NFC */}
          <div className="pos-test-card">
            <div className="pos-test-header">
              <div className="pos-test-icon" style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}>
                <Smartphone size={32} />
              </div>
              <div className="pos-test-info">
                <h3>Test Lettore NFC</h3>
                <p>Leggi una tessera NFC per verificare il lettore contactless</p>
              </div>
            </div>
            <div className="pos-test-status">
              <span className={`pos-test-badge ${hardwareStatus.nfc.status}`}>
                {hardwareStatus.nfc.status === 'available' && '✓ Disponibile'}
                {hardwareStatus.nfc.status === 'unavailable' && '✗ Non disponibile'}
                {hardwareStatus.nfc.status === 'checking' && '◌ Verifica...'}
              </span>
            </div>
            <button
              className="pos-test-action-btn"
              onClick={onTestNFC}
              disabled={hardwareStatus.nfc.status !== 'available'}
            >
              <Smartphone size={20} />
              Esegui Test NFC
            </button>
          </div>

          {/* Test Connettività */}
          <div className="pos-test-card">
            <div className="pos-test-header">
              <div className="pos-test-icon" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                <Wifi size={32} />
              </div>
              <div className="pos-test-info">
                <h3>Test Connettività</h3>
                <p>Verifica lo stato di rete e connessione internet</p>
              </div>
            </div>
            <div className="pos-test-status">
              <span className={`pos-test-badge ${hardwareStatus.network.status}`}>
                {hardwareStatus.network.status === 'online' && '✓ Online'}
                {hardwareStatus.network.status === 'offline' && '✗ Offline'}
                {hardwareStatus.network.status === 'checking' && '◌ Verifica...'}
              </span>
            </div>
            <button
              className="pos-test-action-btn"
              onClick={onCheckHardware}
              disabled={false}
            >
              <RefreshCw size={20} />
              Verifica Connessione
            </button>
          </div>

          {/* Test Sistema Completo */}
          <div className="pos-test-card">
            <div className="pos-test-header">
              <div className="pos-test-icon" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                <Activity size={32} />
              </div>
              <div className="pos-test-info">
                <h3>Test Sistema Completo</h3>
                <p>Aggiorna lo stato di tutti i componenti hardware</p>
              </div>
            </div>
            <div className="pos-test-status">
              <span className={`pos-test-badge ${componentsOnline === totalComponents ? 'available' : componentsOnline > 0 ? 'checking' : 'unavailable'}`}>
                {componentsOnline}/{totalComponents} Online
              </span>
            </div>
            <button
              className="pos-test-action-btn"
              onClick={onCheckHardware}
              disabled={false}
            >
              <Activity size={20} />
              Aggiorna Tutto
            </button>
          </div>
        </div>
      </div>

      {/* Matrix Monitor - Sistema di Log in Tempo Reale */}
      <div className="pos-matrix-section">
        <div className="pos-matrix-header">
          <div className="pos-matrix-title">
            <Terminal size={24} />
            <h2>Monitor Sistema</h2>
          </div>
          <div className="pos-matrix-controls">
            <button
              className={`pos-monitor-toggle ${monitorEnabled ? 'active' : 'inactive'}`}
              onClick={onToggleMonitor}
            >
              {monitorEnabled ? '● ON' : '○ OFF'}
            </button>
            <button className="pos-clear-logs" onClick={onClearLogs}>
              <Trash2 size={16} />
              Pulisci
            </button>
          </div>
        </div>
        <div className="pos-matrix-logs" ref={matrixLogsRef}>
          {matrixLogs.length === 0 ? (
            <div className="pos-matrix-empty">
              <Terminal size={48} />
              <p>Monitor in attesa di eventi...</p>
              <small>I log appariranno qui in tempo reale</small>
            </div>
          ) : (
            matrixLogs.map((log, index) => {
              const logClass = log.includes('[ERROR]') ? 'matrix-log-error' :
                               log.includes('[WARN]') ? 'matrix-log-warn' :
                               log.includes('[INFO]') ? 'matrix-log-info' :
                               log.includes('[SUCCESS]') ? 'matrix-log-success' :
                               'matrix-log-line';
              return <div key={index} className={`pos-matrix-line ${logClass}`}>{log}</div>
            })
          )}
        </div>
      </div>

      {/* Action Cards */}
      <div className="pos-action-cards">
        <div className="pos-action-card pos-action-card-primary">
          <div className="pos-action-icon">
            <TestTube size={32} />
          </div>
          <div className="pos-action-content">
            <h3>Testing Suite</h3>
            <p>Esegui test completi su tutti i componenti hardware</p>
            <ul className="pos-action-features">
              <li><Printer size={16} />Test stampante termica</li>
              <li><Smartphone size={16} />Test lettore NFC</li>
              <li><CreditCard size={16} />Test terminale pagamenti</li>
              <li><Wifi size={16} />Test connettività</li>
            </ul>
          </div>
          <div className="coming-soon-badge">Disponibile</div>
        </div>

        <div className="pos-action-card pos-action-card-secondary">
          <div className="pos-action-icon">
            <Settings size={32} />
          </div>
          <div className="pos-action-content">
            <h3>Configurazione</h3>
            <p>Configura parametri e impostazioni del terminale</p>
            <ul className="pos-action-features">
              <li><Wrench size={16} />Parametri stampante</li>
              <li><Zap size={16} />Impostazioni bridge</li>
              <li><Wifi size={16} />Configurazione rete</li>
              <li><Terminal size={16} />Opzioni terminale</li>
            </ul>
          </div>
          <div className="coming-soon-badge">In Arrivo</div>
        </div>

        <div className="pos-action-card pos-action-card-tertiary">
          <div className="pos-action-icon">
            <BarChart3 size={32} />
          </div>
          <div className="pos-action-content">
            <h3>Diagnostica Avanzata</h3>
            <p>Analytics e monitoraggio performance in tempo reale</p>
            <ul className="pos-action-features">
              <li><Activity size={16} />Metriche performance</li>
              <li><BarChart3 size={16} />Log sistema</li>
              <li><AlertTriangle size={16} />Alerting errori</li>
              <li><RefreshCw size={16} />Auto-recovery</li>
            </ul>
          </div>
          <div className="coming-soon-badge">In Arrivo</div>
        </div>
      </div>
    </div>
  )
}

export default POSIntegrationHub
