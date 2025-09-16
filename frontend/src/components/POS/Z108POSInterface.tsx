import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import POSLogin from './POSLogin'
import './Z108POSInterface.css'

interface Z108POSInterface {
  available: boolean
  readNFC: () => Promise<string>
  print: (data: string) => Promise<string>
  scanQR: () => Promise<string>
  testHardware: () => Promise<string>
}

declare global {
  interface Window {
    ZCSNativeBridge: Z108POSInterface
  }
}

const Z108POSInterface: React.FC = () => {
  const { user } = useAuth()
  const [isConnected, setIsConnected] = useState(false)
  const [lastAction, setLastAction] = useState<string>('')
  const [hardwareStatus, setHardwareStatus] = useState<any>(null)
  const [organizationName, setOrganizationName] = useState<string>('')
  
  // Check for demo user in localStorage
  const demoUser = localStorage.getItem('pos-demo-user')
  const currentUser = user || (demoUser ? JSON.parse(demoUser) : null)
  
  // Show login if not authenticated
  if (!currentUser) {
    return (
      <div className="pos-login-container">
        <div className="pos-login-header">
          <h1>🏪 OMNILY POS Z108</h1>
          <p>Accedi con le credenziali della tua azienda</p>
        </div>
        <POSLogin />
      </div>
    )
  }

  useEffect(() => {
    // Check if native bridge is available with retry
    const checkBridge = () => {
      console.log('Checking for bridge...', window.ZCSNativeBridge)
      if (window.ZCSNativeBridge?.available) {
        setIsConnected(true)
        console.log('🚀 Z108 POS Native Bridge Connected!')
        return true
      }
      return false
    }

    // Initial check
    if (!checkBridge()) {
      // Retry every 100ms for 5 seconds
      const interval = setInterval(() => {
        if (checkBridge()) {
          clearInterval(interval)
        }
      }, 100)

      setTimeout(() => {
        clearInterval(interval)
        console.log('⚠️ Native bridge timeout after 5 seconds')
      }, 5000)
    }
  }, [])

  const handleNFCRead = async () => {
    if (!window.ZCSNativeBridge) {
      setLastAction('NFC Error: Bridge not available')
      return
    }
    
    setLastAction('Reading NFC card...')
    
    try {
      const result = await window.ZCSNativeBridge.readNFC()
      console.log('Raw NFC result:', result)
      const data = JSON.parse(result)
      setLastAction(`NFC Read: ${data.success ? `Card: ${data.cardNo}` : 'Failed'}`)
      console.log('NFC Result:', data)
    } catch (error) {
      console.error('NFC Error:', error)
      setLastAction(`NFC Error: ${error}`)
    }
  }

  const handlePrint = async () => {
    if (!window.ZCSNativeBridge) return
    
    try {
      const receiptData = JSON.stringify({
        content: "=== OMNILY POS ===\nTest Receipt\nData: " + new Date().toLocaleString() + "\n================",
        type: "text"
      })
      
      const result = await window.ZCSNativeBridge.print(receiptData)
      const data = JSON.parse(result)
      setLastAction(`Print: ${data.success ? 'Success' : 'Failed'}`)
      console.log('Print Result:', data)
    } catch (error) {
      setLastAction(`Print Error: ${error}`)
    }
  }

  const handleQRScan = async () => {
    if (!window.ZCSNativeBridge) return
    
    try {
      const result = await window.ZCSNativeBridge.scanQR()
      const data = JSON.parse(result)
      setLastAction(`QR Scan: ${data.success ? data.qrData : 'Failed'}`)
      console.log('QR Result:', data)
    } catch (error) {
      setLastAction(`QR Error: ${error}`)
    }
  }

  const handleHardwareTest = async () => {
    if (!window.ZCSNativeBridge) return
    
    try {
      const result = await window.ZCSNativeBridge.testHardware()
      const data = JSON.parse(result)
      setHardwareStatus(data)
      setLastAction(`Hardware Test: ${data.success ? 'All OK' : 'Failed'}`)
      console.log('Hardware Test:', data)
    } catch (error) {
      setLastAction(`Hardware Test Error: ${error}`)
    }
  }

  return (
    <div className="z108-pos-interface">
      <div className="pos-header">
        <h1>🏪 OMNILY POS Z108</h1>
        <div className="organization-info">
          <p>👤 {currentUser.email}</p>
          {demoUser && <p style={{fontSize: '0.8rem', opacity: 0.7}}>🧪 Demo Mode</p>}
        </div>
        <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
          {isConnected ? '🟢 Hardware Connected' : '🔴 Hardware Disconnected'}
        </div>
      </div>

      <div className="pos-actions">
        <button onClick={handleNFCRead} className="pos-button nfc-button">
          <div className="button-icon">💳</div>
          <div className="button-text">Read NFC Card</div>
        </button>

        <button onClick={handlePrint} className="pos-button print-button">
          <div className="button-icon">🖨️</div>
          <div className="button-text">Print Receipt</div>
        </button>

        <button onClick={handleQRScan} className="pos-button qr-button">
          <div className="button-icon">📱</div>
          <div className="button-text">Scan QR Code</div>
        </button>

        <button onClick={handleHardwareTest} className="pos-button test-button">
          <div className="button-icon">⚙️</div>
          <div className="button-text">Test Hardware</div>
        </button>
      </div>

      {lastAction && (
        <div className="last-action">
          <h3>Last Action:</h3>
          <p>{lastAction}</p>
        </div>
      )}

      {hardwareStatus && (
        <div className="hardware-status">
          <h3>Hardware Status:</h3>
          <div className="status-grid">
            <div className={`status-item ${hardwareStatus.nfc ? 'ok' : 'error'}`}>
              NFC: {hardwareStatus.nfc ? '✅' : '❌'}
            </div>
            <div className={`status-item ${hardwareStatus.printer ? 'ok' : 'error'}`}>
              Printer: {hardwareStatus.printer ? '✅' : '❌'}
            </div>
            <div className={`status-item ${hardwareStatus.scanner ? 'ok' : 'error'}`}>
              Scanner: {hardwareStatus.scanner ? '✅' : '❌'}
            </div>
            <div className={`status-item ${hardwareStatus.display ? 'ok' : 'error'}`}>
              Display: {hardwareStatus.display ? '✅' : '❌'}
            </div>
          </div>
        </div>
      )}

      <div className="pos-info">
        <p>🔧 POS Terminal: Z108 Android</p>
        <p>📡 Network: WiFi Connected</p>
        <p>⏰ Time: {new Date().toLocaleString()}</p>
      </div>
    </div>
  )
}

export default Z108POSInterface