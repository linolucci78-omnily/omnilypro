import React, { useState, useEffect } from 'react'
import { zcsSDK } from '../../services/zcsSDKService.js'
import { CreditCard, Printer, Smartphone, Shield, Zap, CheckCircle, AlertCircle, Play } from 'lucide-react'

interface POSTestPanelProps {
  posModel: string
  posConnection: string
  onTestComplete: (results: any) => void
}

const POSTestPanel: React.FC<POSTestPanelProps> = ({ 
  posModel, 
  posConnection, 
  onTestComplete 
}) => {
  const [isConnected, setIsConnected] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResults, setTestResults] = useState<any>({})
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    setLogs(prev => [...prev.slice(-9), `[${new Date().toLocaleTimeString()}] ${message}`])
  }

  const connectPOS = async () => {
    setTesting(true)
    addLog(`Connessione a POS ${posModel} via ${posConnection}...`)

    try {
      const result = await zcsSDK.initializeSDK(posModel, posConnection)
      
      if (result.success) {
        setIsConnected(true)
        addLog('✅ POS connesso con successo!')
        
        // Test automatico hardware dopo connessione
        await testHardware()
      } else {
        addLog(`❌ Errore connessione: ${result.error}`)
      }
    } catch (error) {
      addLog(`❌ Errore: ${error}`)
    }
    
    setTesting(false)
  }

  const testHardware = async () => {
    addLog('Test componenti hardware...')
    
    try {
      const results = await zcsSDK.testHardware()
      
      if (results.success) {
        setTestResults(results.results)
        addLog('✅ Test hardware completato')
        
        const passedTests = Object.values(results.results).filter(Boolean).length
        const totalTests = Object.keys(results.results).length
        addLog(`📊 Risultati: ${passedTests}/${totalTests} componenti OK`)
        
        onTestComplete(results.results)
      } else {
        addLog(`❌ Test fallito: ${results.error}`)
      }
    } catch (error) {
      addLog(`❌ Errore test: ${error}`)
    }
  }

  const testNFCRead = async () => {
    addLog('Test lettura NFC...')
    
    try {
      addLog('🔍 Avvicinare tessera NFC al lettore...')
      const result = await zcsSDK.readNFCCard(10000) // 10 sec timeout
      
      if (result.success) {
        addLog(`✅ Carta letta: ${result.cardNo}`)
        addLog(`📱 Tipo RF: ${result.rfCardType}`)
      }
    } catch (error) {
      addLog(`❌ Lettura NFC fallita: ${error.message}`)
    }
  }

  const testPrint = async () => {
    addLog('Test stampa ricevuta...')
    
    try {
      const receiptData = {
        merchantName: 'OMNILY PRO - TEST',
        customerName: 'Cliente Test',
        pointsEarned: 50,
        totalPoints: 1250,
        date: new Date().toLocaleString(),
        qrCode: 'https://omnilypro.app/loyalty/test123'
      }

      const result = await zcsSDK.printLoyaltyReceipt(receiptData)
      
      if (result.success) {
        addLog('✅ Ricevuta stampata con successo!')
      }
    } catch (error) {
      addLog(`❌ Stampa fallita: ${error.message}`)
    }
  }

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      zcsSDK.cleanup()
    }
  }, [])

  const getStatusColor = (isOk: boolean) => isOk ? '#10b981' : '#ef4444'
  const getStatusIcon = (isOk: boolean) => isOk ? CheckCircle : AlertCircle

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '40px',
      background: '#e5e7eb' // Light gray background for the page
    }}>
      <div style={{
        width: '440px', // Device width + bezel
        height: '680px', // Device height + bezel
        background: '#111827', // Device bezel color
        borderRadius: '24px',
        padding: '20px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
      }}>
        <div style={{
          background: '#f8fafc',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '20px',
            flexShrink: 0
          }}>
            <CreditCard size={24} color="#3b82f6" />
            <h3 style={{ margin: 0, color: '#1e293b', fontSize: '1.1rem' }}>
              Test POS {posModel}
            </h3>
            <div style={{
              background: isConnected ? '#dcfce7' : '#fee2e2',
              color: isConnected ? '#166534' : '#991b1b',
              padding: '4px 8px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '500'
            }}>
              {isConnected ? 'CONNESSO' : 'DISCONNESSO'}
            </div>
          </div>

          <div style={{
            flexGrow: 1,
            overflowY: 'auto',
            paddingRight: '10px', // To avoid scrollbar overlap
            marginRight: '-10px'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '20px',
              marginBottom: '20px'
            }}>
              {/* Controlli */}
              <div>
                <h4 style={{ marginBottom: '12px', color: '#374151' }}>Controlli</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button
                    onClick={connectPOS}
                    disabled={testing || isConnected}
                    style={{
                      padding: '8px 12px',
                      background: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: testing || isConnected ? 'not-allowed' : 'pointer',
                      opacity: testing || isConnected ? 0.5 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <Play size={16} />
                    {testing ? 'Connessione...' : isConnected ? 'Connesso' : 'Connetti POS'}
                  </button>

                  <button
                    onClick={testNFCRead}
                    disabled={!isConnected}
                    style={{
                      padding: '8px 12px',
                      background: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: !isConnected ? 'not-allowed' : 'pointer',
                      opacity: !isConnected ? 0.5 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <Smartphone size={16} />
                    Test NFC
                  </button>

                  <button
                    onClick={testPrint}
                    disabled={!isConnected}
                    style={{
                      padding: '8px 12px',
                      background: '#8b5cf6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: !isConnected ? 'not-allowed' : 'pointer',
                      opacity: !isConnected ? 0.5 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <Printer size={16} />
                    Test Stampa
                  </button>
                </div>
              </div>

              {/* Status Hardware */}
              <div>
                <h4 style={{ marginBottom: '12px', color: '#374151' }}>Status Hardware</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {Object.entries({
                    led: { icon: Zap, label: 'LED' },
                    beeper: { icon: Shield, label: 'Beeper' },
                    printer: { icon: Printer, label: 'Printer' },
                    scanner: { icon: Smartphone, label: 'Scanner' }
                  }).map(([key, config]) => {
                    const Icon = config.icon
                    const StatusIcon = getStatusIcon(testResults[key])
                    const isOk = testResults[key]
                    
                    return (
                      <div
                        key={key}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '6px',
                          borderRadius: '4px',
                          background: isOk ? '#f0fdf4' : testResults[key] === false ? '#fef2f2' : '#f9fafb'
                        }}
                      >
                        <Icon size={16} color="#6b7280" />
                        <span style={{ fontSize: '14px', flex: 1 }}>{config.label}</span>
                        {testResults[key] !== undefined && (
                          <StatusIcon size={16} color={getStatusColor(isOk)} />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Log Console */}
            <div>
              <h4 style={{ marginBottom: '8px', color: '#374151' }}>Console Log</h4>
              <div style={{
                background: '#000',
                color: '#00ff00',
                padding: '12px',
                borderRadius: '6px',
                fontFamily: 'monospace',
                fontSize: '12px',
                height: '120px',
                overflowY: 'auto'
              }}>
                {logs.length === 0 ? (
                  <div style={{ color: '#666' }}>Premi "Connetti POS" per iniziare...</div>
                ) : (
                  logs.map((log, index) => (
                    <div key={index}>{log}</div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Info Modello */}
          <div style={{
            marginTop: '16px',
            padding: '12px',
            background: '#eff6ff',
            borderRadius: '6px',
            fontSize: '12px',
            color: '#1e40af',
            flexShrink: 0
          }}>
            <strong>Modello:</strong> {posModel} | 
            <strong> Connessione:</strong> {posConnection.toUpperCase()} | 
            <strong> SDK:</strong> ZCS Android Platform v1.2
          </div>
        </div>
      </div>
    </div>
  )
}

export default POSTestPanel