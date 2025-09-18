import React, { useState, useEffect } from 'react'
import { Monitor, Maximize2, Minimize2, RotateCcw, Settings } from 'lucide-react'
import CustomerDisplay from './CustomerDisplay'
import MerchantControl from './MerchantControl'
import { zcsSDK } from '../../services/zcsSDKService'
import { organizationsApi } from '../../lib/supabase'
import type { Organization } from '../../lib/supabase'
import './POSSimulator.css'

interface POSSimulatorProps {
  organizationData?: {
    name: string
    logo?: string
    primaryColor: string
    secondaryColor: string
  }
}

const POSSimulator: React.FC<POSSimulatorProps> = ({
  organizationData: _organizationData = {
    name: 'OMNILY PRO DEMO',
    primaryColor: '#ef4444',
    secondaryColor: '#dc2626'
  }
}) => {
  type DisplayState = 'completed' | 'idle' | 'welcome' | 'reading-card' | 'customer-found' | 'transaction' | 'rewards';
  const [displayState, setDisplayState] = useState<DisplayState>('idle');
  const [currentTransaction, setCurrentTransaction] = useState<any>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [activeView, setActiveView] = useState<'dual' | 'customer' | 'merchant'>('dual')
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connected')
  const [showDebugPanel, setShowDebugPanel] = useState(true)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [selectedOrgId, setSelectedOrgId] = useState<string>('')
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(false)

  // Initialize ZCS SDK on mount
  useEffect(() => {
    const initializeSDK = async () => {
      try {
        setConnectionStatus('connecting')
        // In a real implementation, this would connect to actual hardware
        await zcsSDK.initializeSDK('Z108', 'usb')
        setConnectionStatus('connected')
      } catch (error) {
        console.error('SDK initialization failed:', error)
        setConnectionStatus('disconnected')
      }
    }

    initializeSDK()
    loadOrganizations()
  }, [])

  // Load organizations from database
  const loadOrganizations = async () => {
    try {
      setLoading(true)
      const data = await organizationsApi.getAll()
      setOrganizations(data)
      if (data.length > 0) {
        setSelectedOrgId(data[0].id)
        setCurrentOrganization(data[0])
      }
    } catch (error) {
      console.error('Error loading organizations:', error)
    } finally {
      setLoading(false)
    }
  }

  // Handle organization selection
  const handleOrganizationChange = (orgId: string) => {
    const org = organizations.find(o => o.id === orgId)
    if (org) {
      setSelectedOrgId(orgId)
      setCurrentOrganization(org)
    }
  }

  // Auto-reset after completed state
  useEffect(() => {
    if (displayState === 'completed') {
      const timer = setTimeout(() => {
        handleReset()
      }, 10000) // Reset after 10 seconds

      return () => clearTimeout(timer)
    }
  }, [displayState])

  const handleDisplayStateChange = (newState: DisplayState) => {
    setDisplayState(newState)
  }

  const handleTransactionUpdate = (transaction: any) => {
    setCurrentTransaction(transaction)
  }

  const handleReset = () => {
    setDisplayState('idle')
    setCurrentTransaction(null)
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  const switchView = (view: 'dual' | 'customer' | 'merchant') => {
    setActiveView(view)
  }

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return '#10b981'
      case 'connecting': return '#f59e0b'
      case 'disconnected': return '#ef4444'
      default: return '#6b7280'
    }
  }

  return (
    <div className={`pos-simulator ${isFullscreen ? 'fullscreen' : ''}`}>
      {/* Simulator Header */}
      <div className="simulator-header">
        <div className="simulator-title">
          <Monitor size={24} />
          <h2>POS ZCS Z108 Simulator</h2>
          <div className="connection-status">
            <div 
              className="status-dot"
              style={{ backgroundColor: getConnectionStatusColor() }}
            />
            <span>{connectionStatus === 'connected' ? 'Connesso' : connectionStatus === 'connecting' ? 'Connessione...' : 'Disconnesso'}</span>
          </div>
        </div>
        
        <div className="simulator-controls">
          <div className="organization-selector">
            <label>Azienda:</label>
            <select 
              value={selectedOrgId} 
              onChange={(e) => handleOrganizationChange(e.target.value)}
              disabled={loading}
            >
              <option value="">Seleziona Azienda</option>
              {organizations.map(org => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="view-switcher">
            <button 
              className={`view-btn ${activeView === 'dual' ? 'active' : ''}`}
              onClick={() => switchView('dual')}
            >
              Dual Screen
            </button>
            <button 
              className={`view-btn ${activeView === 'customer' ? 'active' : ''}`}
              onClick={() => switchView('customer')}
            >
              Solo Cliente
            </button>
            <button 
              className={`view-btn ${activeView === 'merchant' ? 'active' : ''}`}
              onClick={() => switchView('merchant')}
            >
              Solo Merchant
            </button>
          </div>
          
          <div className="action-controls">
            <button className="control-btn" onClick={handleReset}>
              <RotateCcw size={16} />
              Reset
            </button>
            
            <button className="control-btn" onClick={toggleFullscreen}>
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              {isFullscreen ? 'Finestra' : 'Fullscreen'}
            </button>
          </div>
        </div>
      </div>

      {/* Display State Indicator */}
      <div className="state-indicator">
        <div className="state-info">
          <span className="state-label">Stato Display:</span>
          <span className={`state-value state-${displayState}`}>
            {displayState.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </span>
        </div>
        
        {currentTransaction && (
          <div className="transaction-info">
            <span>Cliente: {currentTransaction.customer?.name || 'N/A'}</span>
            <span>Importo: €{currentTransaction.amount?.toFixed(2) || '0.00'}</span>
            <span>Punti: +{currentTransaction.pointsToEarn || 0}</span>
          </div>
        )}
      </div>

      {/* Screens Layout */}
      <div className={`screens-container ${activeView}`}>
        {/* Customer Display */}
        {(activeView === 'dual' || activeView === 'customer') && (
          <div className="screen customer-screen">
            <div className="screen-header">
              <h3>Display Cliente</h3>
              <div className="screen-resolution">3.95" QUADRATO (480×480px IPS)</div>
            </div>
            <div className="screen-content">
              <CustomerDisplay />
            </div>
          </div>
        )}

        {/* Merchant Control */}
        {(activeView === 'dual' || activeView === 'merchant') && (
          <div className="screen merchant-screen">
            <div className="screen-header">
              <h3>Controllo Merchant</h3>
              <div className="screen-resolution">8" WIDESCREEN (1280×800px IPS)</div>
            </div>
            <div className="screen-content">
              <MerchantControl
                onDisplayStateChange={handleDisplayStateChange}
                onTransactionUpdate={handleTransactionUpdate}
                displayState={displayState}
                zcsSDK={zcsSDK}
              />
            </div>
          </div>
        )}
      </div>

      {/* Debug Panel */}
      {showDebugPanel && (
        <div className="debug-panel">
        <div className="debug-header">
          <Settings size={16} />
          <span>Debug & Dimensioni Reali</span>
          <button 
            className="debug-close-btn"
            onClick={() => setShowDebugPanel(false)}
          >
            ×
          </button>
        </div>
        <div className="debug-content">
          <div className="debug-section">
            <div className="debug-section-title">📱 Display Cliente (7")</div>
            <div className="debug-item">
              <span className="debug-label">Risoluzione:</span>
              <span className="debug-value">1024×768px</span>
            </div>
            <div className="debug-item">
              <span className="debug-label">Dimensioni:</span>
              <span className="debug-value">14.2×10.6 cm</span>
            </div>
            <div className="debug-item">
              <span className="debug-label">DPI:</span>
              <span className="debug-value">146 ppi</span>
            </div>
            <div className="debug-item">
              <span className="debug-label">Aspect Ratio:</span>
              <span className="debug-value">4:3</span>
            </div>
          </div>
          
          <div className="debug-section">
            <div className="debug-section-title">💻 Display Merchant (10.1")</div>
            <div className="debug-item">
              <span className="debug-label">Risoluzione:</span>
              <span className="debug-value">1280×800px</span>
            </div>
            <div className="debug-item">
              <span className="debug-label">Dimensioni:</span>
              <span className="debug-value">21.7×13.6 cm</span>
            </div>
            <div className="debug-item">
              <span className="debug-label">DPI:</span>
              <span className="debug-value">149 ppi</span>
            </div>
            <div className="debug-item">
              <span className="debug-label">Aspect Ratio:</span>
              <span className="debug-value">16:10</span>
            </div>
          </div>

          <div className="debug-section">
            <div className="debug-section-title">🔧 Stato Sistema</div>
            <div className="debug-item">
              <span className="debug-label">Display State:</span>
              <span className="debug-value">{displayState}</span>
            </div>
            <div className="debug-item">
              <span className="debug-label">Connection:</span>
              <span className="debug-value">{connectionStatus}</span>
            </div>
            <div className="debug-item">
              <span className="debug-label">Active View:</span>
              <span className="debug-value">{activeView}</span>
            </div>
            <div className="debug-item">
              <span className="debug-label">Viewport:</span>
              <span className="debug-value">{window.innerWidth}×{window.innerHeight}</span>
            </div>
            {currentTransaction && (
              <div className="debug-item">
                <span className="debug-label">Transaction ID:</span>
                <span className="debug-value">{Date.now()}</span>
              </div>
            )}
          </div>
        </div>
        </div>
      )}

      {/* Hardware Status Indicators */}
      <div className="hardware-indicators">
        <div className="hardware-item">
          <div className="indicator-dot connected"></div>
          <span>NFC</span>
        </div>
        <div className="hardware-item">
          <div className="indicator-dot connected"></div>
          <span>Printer</span>
        </div>
        <div className="hardware-item">
          <div className="indicator-dot connected"></div>
          <span>EMV</span>
        </div>
        <div className="hardware-item">
          <div className="indicator-dot connected"></div>
          <span>Display</span>
        </div>
      </div>
    </div>
  )
}

export default POSSimulator