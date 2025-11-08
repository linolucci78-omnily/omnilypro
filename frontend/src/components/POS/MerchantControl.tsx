import React, { useState, useEffect } from 'react'
import {
  CreditCard,
  Users,
  Star,
  Gift,
  Monitor,
  Printer,
  Wifi,
  Settings,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Euro,
  Zap,
  User,
  Trophy,
  Eye,
  EyeOff,
  RefreshCw
} from 'lucide-react'
import { rewardsService, type Reward } from '../../services/rewardsService'
import './MerchantControl.css'

type DisplayState = 'idle' | 'welcome' | 'reading-card' | 'customer-found' | 'transaction' | 'rewards' | 'completed'

interface MerchantControlProps {
  onDisplayStateChange: (state: DisplayState) => void
  onTransactionUpdate: (transaction: any) => void
  displayState: DisplayState
  zcsSDK: any // ZCS SDK reference
  organizationId: string // Organization ID per caricare i premi reali
}

const MerchantControl: React.FC<MerchantControlProps> = ({
  onDisplayStateChange,
  onTransactionUpdate,
  displayState,
  zcsSDK,
  organizationId
}) => {
  const [currentCustomer, setCurrentCustomer] = useState<any>(null)
  const [transactionAmount, setTransactionAmount] = useState('')
  const [connectionStatus] = useState('connected')
  const [isReading, setIsReading] = useState(false)
  const [showCustomerDetails, setShowCustomerDetails] = useState(true)
  const [rewards, setRewards] = useState<Reward[]>([])
  const [loadingRewards, setLoadingRewards] = useState(true)
  
  interface Transaction {
    id: string;
    customer: string;
    amount: number;
    points: number;
    timestamp: Date;
    status: string;
  }
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([])
  const [hardwareStatus, setHardwareStatus] = useState({
    nfc: 'connected',
    printer: 'connected',
    display: 'connected',
    emv: 'connected'
  })

  // Mock customer data
  const mockCustomers = [
    {
      id: '1',
      name: 'Mario Rossi',
      phone: '+39 347 123 4567',
      email: 'mario.rossi@email.com',
      currentPoints: 1250,
      memberSince: '2023-01-15',
      tier: 'Gold',
      visits: 45,
      totalSpent: 2850.50,
      cardUID: 'A1B2C3D4'
    },
    {
      id: '2',
      name: 'Anna Bianchi',
      phone: '+39 342 987 6543',
      email: 'anna.bianchi@email.com',
      currentPoints: 750,
      memberSince: '2023-06-22',
      tier: 'Silver',
      visits: 23,
      totalSpent: 1420.30,
      cardUID: 'E5F6G7H8'
    }
  ]

  // Carica i premi reali dal database
  useEffect(() => {
    const fetchRewards = async () => {
      try {
        setLoadingRewards(true)
        const allRewards = await rewardsService.getAll(organizationId)
        // Filtra solo i premi attivi
        const activeRewards = allRewards.filter(r => r.is_active)
        setRewards(activeRewards)
      } catch (error) {
        console.error('Errore caricamento premi:', error)
      } finally {
        setLoadingRewards(false)
      }
    }

    if (organizationId) {
      fetchRewards()
    }
  }, [organizationId])

  useEffect(() => {
    // Simulate hardware status checks
    const checkHardware = setInterval(() => {
      // Random status simulation for demo
      if (Math.random() > 0.95) {
        const hardware = ['nfc', 'printer', 'display', 'emv'][Math.floor(Math.random() * 4)]
        const status = Math.random() > 0.5 ? 'warning' : 'connected'
        setHardwareStatus(prev => ({ ...prev, [hardware]: status }))
        
        // Reset after 3 seconds
        setTimeout(() => {
          setHardwareStatus(prev => ({ ...prev, [hardware]: 'connected' }))
        }, 3000)
      }
    }, 5000)

    return () => clearInterval(checkHardware)
  }, [])

  const handleReadCard = async () => {
    setIsReading(true)
    onDisplayStateChange('reading-card')
    
    try {
      // Simulate card reading
      setTimeout(() => {
        const customer = mockCustomers[Math.floor(Math.random() * mockCustomers.length)]
        setCurrentCustomer(customer)
        
        // Calculate points to earn (1 point per euro)
        const amount = parseFloat(transactionAmount) || 25.50
        const pointsToEarn = Math.floor(amount)
        
        const transaction = {
          amount,
          pointsToEarn,
          customer,
          rewards: rewards.map(r => ({
            id: r.id,
            name: r.name,
            pointsRequired: r.points_required,
            available: customer.currentPoints >= r.points_required
          }))
        }
        
        onTransactionUpdate(transaction)
        onDisplayStateChange('customer-found')
        setIsReading(false)
      }, 2000)
    } catch (error) {
      console.error('Card reading failed:', error)
      setIsReading(false)
    }
  }

  const handleStartTransaction = () => {
    if (!currentCustomer) return
    
    onDisplayStateChange('transaction')
    
    // Simulate transaction processing
    setTimeout(() => {
      // Add to recent transactions
      const newTransaction = {
        id: Date.now().toString(),
        customer: currentCustomer.name,
        amount: parseFloat(transactionAmount) || 25.50,
        points: Math.floor(parseFloat(transactionAmount) || 25.50),
        timestamp: new Date(),
        status: 'completed'
      }
      
      setRecentTransactions(prev => [newTransaction, ...prev.slice(0, 4)])
      
      onDisplayStateChange('completed')
      
      // Reset after completion view
      setTimeout(() => {
        handleReset()
      }, 8000)
    }, 3000)
  }

  const handleReset = () => {
    setCurrentCustomer(null)
    setTransactionAmount('')
    onDisplayStateChange('idle')
    onTransactionUpdate(null)
  }

  const handlePrintReceipt = async () => {
    try {
      if (zcsSDK && currentCustomer) {
        const receiptData = {
          merchantName: 'OMNILY PRO DEMO',
          customerName: currentCustomer.name,
          pointsEarned: Math.floor(parseFloat(transactionAmount) || 25.50),
          totalPoints: currentCustomer.currentPoints + Math.floor(parseFloat(transactionAmount) || 25.50),
          qrCode: `https://app.omnily.pro/loyalty/${currentCustomer.id}`
        }
        
        await zcsSDK.printLoyaltyReceipt(receiptData)
      }
    } catch (error) {
      console.error('Print failed:', error)
    }
  }

  const formatCurrency = (amount: number) => {
    return `€${amount.toFixed(2)}`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return '#10b981'
      case 'warning': return '#f59e0b'
      case 'error': return '#ef4444'
      default: return '#6b7280'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <CheckCircle2 size={16} />
      case 'warning': return <AlertCircle size={16} />
      case 'error': return <AlertCircle size={16} />
      default: return <Clock size={16} />
    }
  }

  return (
    <div className="merchant-control">
      {/* Header */}
      <div className="control-header">
        <div className="header-left">
          <Monitor size={24} />
          <div className="header-info">
            <h2>Controllo Merchant</h2>
            <div className="pos-info">POS ZCS Z108 • USB Connected</div>
          </div>
        </div>
        
        <div className="header-right">
          <div className="connection-indicator">
            <div className={`status-dot ${connectionStatus}`}></div>
            <span>Sistema {connectionStatus === 'connected' ? 'Connesso' : 'Disconnesso'}</span>
          </div>
        </div>
      </div>

      {/* Hardware Status */}
      <div className="hardware-status">
        <h3>Stato Hardware</h3>
        <div className="status-grid">
          <div className="status-item">
            <CreditCard size={20} />
            <span>NFC Reader</span>
            <div className="status-indicator" style={{ color: getStatusColor(hardwareStatus.nfc) }}>
              {getStatusIcon(hardwareStatus.nfc)}
            </div>
          </div>
          <div className="status-item">
            <Printer size={20} />
            <span>Stampante</span>
            <div className="status-indicator" style={{ color: getStatusColor(hardwareStatus.printer) }}>
              {getStatusIcon(hardwareStatus.printer)}
            </div>
          </div>
          <div className="status-item">
            <Monitor size={20} />
            <span>Display Cliente</span>
            <div className="status-indicator" style={{ color: getStatusColor(hardwareStatus.display) }}>
              {getStatusIcon(hardwareStatus.display)}
            </div>
          </div>
          <div className="status-item">
            <Wifi size={20} />
            <span>Connessione</span>
            <div className="status-indicator" style={{ color: getStatusColor(hardwareStatus.emv) }}>
              {getStatusIcon(hardwareStatus.emv)}
            </div>
          </div>
        </div>
      </div>

      <div className="control-body">
        {/* Transaction Panel */}
        <div className="transaction-panel">
          <div className="panel-header">
            <h3>Transazione Corrente</h3>
            <div className="display-state">
              Stato Display: <span className="state-badge">{displayState}</span>
            </div>
          </div>
          
          <div className="transaction-form">
            <div className="amount-input">
              <label>Importo Transazione</label>
              <div className="input-group">
                <Euro size={18} />
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={transactionAmount}
                  onChange={(e) => setTransactionAmount(e.target.value)}
                  disabled={displayState !== 'idle'}
                />
              </div>
            </div>
            
            <div className="action-buttons">
              <button 
                className="btn-primary"
                onClick={handleReadCard}
                disabled={isReading || !transactionAmount}
              >
                {isReading ? (
                  <>
                    <RefreshCw size={18} className="spinning" />
                    Lettura in corso...
                  </>
                ) : (
                  <>
                    <CreditCard size={18} />
                    Leggi Tessera
                  </>
                )}
              </button>
              
              {currentCustomer && displayState === 'customer-found' && (
                <button 
                  className="btn-success"
                  onClick={handleStartTransaction}
                >
                  <Play size={18} />
                  Avvia Transazione
                </button>
              )}
              
              <button 
                className="btn-secondary"
                onClick={handleReset}
                disabled={displayState === 'transaction'}
              >
                <RotateCcw size={18} />
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Customer Info Panel */}
        <div className="customer-panel">
          <div className="panel-header">
            <h3>Informazioni Cliente</h3>
            <button 
              className="toggle-btn"
              onClick={() => setShowCustomerDetails(!showCustomerDetails)}
            >
              {showCustomerDetails ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          
          {currentCustomer ? (
            <div className="customer-details">
              <div className="customer-header">
                <User size={24} />
                <div className="customer-basic">
                  <div className="customer-name">{currentCustomer.name}</div>
                  <div className="customer-tier">Cliente {currentCustomer.tier}</div>
                </div>
              </div>
              
              {showCustomerDetails && (
                <div className="customer-info">
                  <div className="info-grid">
                    <div className="info-item">
                      <span className="info-label">Telefono:</span>
                      <span className="info-value">{currentCustomer.phone}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Email:</span>
                      <span className="info-value">{currentCustomer.email}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Cliente dal:</span>
                      <span className="info-value">{new Date(currentCustomer.memberSince).toLocaleDateString('it-IT')}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Visite:</span>
                      <span className="info-value">{currentCustomer.visits}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Spesa Totale:</span>
                      <span className="info-value">{formatCurrency(currentCustomer.totalSpent)}</span>
                    </div>
                  </div>
                  
                  <div className="points-summary">
                    <div className="current-points">
                      <Star size={20} />
                      <span>{currentCustomer.currentPoints.toLocaleString()} punti</span>
                    </div>
                    {transactionAmount && (
                      <div className="points-earning">
                        <Zap size={16} />
                        <span>+{Math.floor(parseFloat(transactionAmount))} punti</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="no-customer">
              <User size={48} />
              <p>Nessun cliente selezionato</p>
              <p className="help-text">Leggi una tessera per iniziare</p>
            </div>
          )}
        </div>

        {/* Rewards Panel */}
        {currentCustomer && (
          <div className="rewards-panel">
            <div className="panel-header">
              <h3>Premi Disponibili</h3>
              <Trophy size={20} />
            </div>

            <div className="rewards-list">
              {loadingRewards ? (
                <div style={{ padding: '24px', textAlign: 'center', color: '#6b7280' }}>
                  Caricamento premi...
                </div>
              ) : rewards.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: '#6b7280' }}>
                  <Gift size={32} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                  <p>Nessun premio disponibile</p>
                </div>
              ) : (
                rewards.map(reward => {
                  const isAvailable = currentCustomer.currentPoints >= reward.points_required
                  return (
                    <div
                      key={reward.id}
                      className={`reward-item ${isAvailable ? 'available' : 'unavailable'}`}
                    >
                      <div className="reward-info">
                        <div className="reward-name">{reward.name}</div>
                        <div className="reward-points">{reward.points_required} punti</div>
                      </div>
                      <div className="reward-status">
                        {isAvailable ? (
                          <CheckCircle2 size={16} color="#10b981" />
                        ) : (
                          <Clock size={16} color="#6b7280" />
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}

        {/* Recent Transactions */}
        <div className="transactions-panel">
          <div className="panel-header">
            <h3>Transazioni Recenti</h3>
            <Clock size={20} />
          </div>
          
          {recentTransactions.length > 0 ? (
            <div className="transactions-list">
              {recentTransactions.map(transaction => (
                <div key={transaction.id} className="transaction-item">
                  <div className="transaction-info">
                    <div className="transaction-customer">{transaction.customer}</div>
                    <div className="transaction-time">
                      {transaction.timestamp.toLocaleTimeString('it-IT', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                  </div>
                  <div className="transaction-details">
                    <div className="transaction-amount">{formatCurrency(transaction.amount)}</div>
                    <div className="transaction-points">+{transaction.points} punti</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-transactions">
              <Clock size={32} />
              <p>Nessuna transazione recente</p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="actions-panel">
          <div className="panel-header">
            <h3>Azioni Rapide</h3>
            <Settings size={20} />
          </div>
          
          <div className="quick-actions">
            <button 
              className="action-btn"
              onClick={handlePrintReceipt}
              disabled={!currentCustomer}
            >
              <Printer size={18} />
              Stampa Ricevuta
            </button>
            
            <button className="action-btn">
              <Gift size={18} />
              Gestisci Premi
            </button>
            
            <button className="action-btn">
              <Users size={18} />
              Lista Clienti
            </button>
            
            <button className="action-btn">
              <Settings size={18} />
              Impostazioni POS
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MerchantControl