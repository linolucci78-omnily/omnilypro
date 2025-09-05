import React, { useState, useEffect } from 'react'
import { CreditCard, Gift, CheckCircle2, Star, Clock, User, Trophy, Zap } from 'lucide-react'
import './CustomerDisplay.css'

interface CustomerDisplayProps {
  merchantData?: {
    businessName: string
    logo?: string
    primaryColor: string
    secondaryColor: string
  }
  currentTransaction?: {
    amount: number
    pointsToEarn: number
    customer?: {
      name: string
      currentPoints: number
      memberSince: string
      tier: string
    }
    rewards?: Array<{
      id: string
      name: string
      pointsRequired: number
      available: boolean
    }>
  }
  displayState: 'idle' | 'welcome' | 'reading-card' | 'customer-found' | 'transaction' | 'rewards' | 'completed'
  onStateChange?: (state: string) => void
}

const CustomerDisplay: React.FC<CustomerDisplayProps> = ({
  merchantData = {
    businessName: 'OMNILY PRO DEMO',
    primaryColor: '#ef4444',
    secondaryColor: '#dc2626'
  },
  currentTransaction,
  displayState,
  onStateChange
}) => {
  const [animationClass, setAnimationClass] = useState('')

  useEffect(() => {
    setAnimationClass('fade-in')
    const timer = setTimeout(() => setAnimationClass(''), 300)
    return () => clearTimeout(timer)
  }, [displayState])

  const handleCardTap = () => {
    onStateChange?.('reading-card')
    setTimeout(() => {
      onStateChange?.('customer-found')
    }, 2000)
  }

  const renderIdleScreen = () => (
    <div className="display-content idle-screen">
      <div className="welcome-section">
        <div className="business-logo">
          {merchantData.logo ? (
            <img src={merchantData.logo} alt="Logo" />
          ) : (
            <div 
              className="logo-placeholder"
              style={{ backgroundColor: merchantData.primaryColor }}
            >
              {merchantData.businessName.charAt(0)}
            </div>
          )}
        </div>
        <h1 className="business-name">{merchantData.businessName}</h1>
        <p className="welcome-message">Benvenuto nel nostro programma fedeltà!</p>
      </div>
      
      <div className="loyalty-promo">
        <div className="promo-card">
          <Gift size={48} color={merchantData.primaryColor} />
          <h3>Guadagna Punti Ad Ogni Acquisto</h3>
          <p>Accumula punti e ricevi fantastici premi</p>
        </div>
      </div>
      
      <div className="tap-instruction">
        <div className="nfc-icon-container">
          <div className="nfc-waves"></div>
          <CreditCard size={64} color={merchantData.primaryColor} />
        </div>
        <h2>Avvicina la tua tessera fedeltà</h2>
        <button 
          className="tap-demo-btn"
          onClick={handleCardTap}
          style={{ backgroundColor: merchantData.primaryColor }}
        >
          Simula Lettura Tessera
        </button>
      </div>
    </div>
  )

  const renderReadingCard = () => (
    <div className="display-content reading-screen">
      <div className="reading-animation">
        <div className="spinner" style={{ borderTopColor: merchantData.primaryColor }}></div>
        <CreditCard size={64} color={merchantData.primaryColor} />
      </div>
      <h2>Lettura tessera in corso...</h2>
      <p>Tieni la tessera vicino al lettore</p>
    </div>
  )

  const renderCustomerFound = () => {
    const customer = currentTransaction?.customer
    if (!customer) return null

    return (
      <div className="display-content customer-screen">
        <div className="customer-welcome">
          <div className="success-icon">
            <CheckCircle2 size={48} color="#10b981" />
          </div>
          <h2>Ciao {customer.name}! 👋</h2>
          <p className="customer-status">Cliente {customer.tier} dal {customer.memberSince}</p>
        </div>
        
        <div className="points-display">
          <div className="current-points">
            <Star size={32} color="#f59e0b" />
            <div className="points-info">
              <div className="points-value">{customer.currentPoints.toLocaleString()}</div>
              <div className="points-label">Punti Disponibili</div>
            </div>
          </div>
          
          {currentTransaction && (
            <div className="transaction-preview">
              <div className="earning-points">
                <Zap size={24} color={merchantData.primaryColor} />
                <span>+{currentTransaction.pointsToEarn} punti con questo acquisto</span>
              </div>
              <div className="total-after">
                Totale dopo l'acquisto: <strong>{(customer.currentPoints + currentTransaction.pointsToEarn).toLocaleString()}</strong>
              </div>
            </div>
          )}
        </div>

        <div className="available-rewards">
          <h3>🎁 I Tuoi Premi Disponibili</h3>
          <div className="rewards-list">
            {currentTransaction?.rewards?.filter(r => r.available).map(reward => (
              <div key={reward.id} className="reward-item available">
                <Trophy size={20} color="#10b981" />
                <span className="reward-name">{reward.name}</span>
                <span className="reward-points">{reward.pointsRequired} punti</span>
              </div>
            ))}
            {currentTransaction?.rewards?.filter(r => !r.available).slice(0, 2).map(reward => (
              <div key={reward.id} className="reward-item unavailable">
                <Clock size={20} color="#6b7280" />
                <span className="reward-name">{reward.name}</span>
                <span className="reward-points">{reward.pointsRequired} punti</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const renderTransaction = () => (
    <div className="display-content transaction-screen">
      <div className="transaction-progress">
        <div className="progress-icon">
          <div className="processing-spinner"></div>
          <CreditCard size={48} color={merchantData.primaryColor} />
        </div>
        <h2>Transazione in corso...</h2>
        <p>Non rimuovere la carta</p>
      </div>
      
      {currentTransaction && (
        <div className="transaction-details">
          <div className="amount">€{currentTransaction.amount.toFixed(2)}</div>
          <div className="points-earning">
            <Star size={24} color="#f59e0b" />
            <span>Guadagnerai {currentTransaction.pointsToEarn} punti</span>
          </div>
        </div>
      )}
    </div>
  )

  const renderCompleted = () => (
    <div className="display-content completed-screen">
      <div className="success-animation">
        <div className="checkmark-container">
          <CheckCircle2 size={72} color="#10b981" />
        </div>
        <h2>Transazione Completata! ✨</h2>
      </div>
      
      {currentTransaction && (
        <div className="completion-summary">
          <div className="points-earned">
            <Star size={32} color="#f59e0b" />
            <div className="earned-info">
              <div className="earned-value">+{currentTransaction.pointsToEarn}</div>
              <div className="earned-label">Punti Guadagnati</div>
            </div>
          </div>
          
          <div className="new-total">
            <p>Nuovo saldo punti:</p>
            <div className="total-points">
              {currentTransaction.customer ? 
                (currentTransaction.customer.currentPoints + currentTransaction.pointsToEarn).toLocaleString() 
                : currentTransaction.pointsToEarn.toLocaleString()
              }
            </div>
          </div>
          
          <div className="thank-you">
            <h3>Grazie per il tuo acquisto!</h3>
            <p>La ricevuta è stata stampata</p>
          </div>
        </div>
      )}
      
      <div className="next-visit">
        <Gift size={24} color={merchantData.primaryColor} />
        <p>Torna presto per guadagnare altri punti!</p>
      </div>
    </div>
  )

  return (
    <div 
      className={`customer-display ${animationClass}`}
      style={{ 
        '--primary-color': merchantData.primaryColor,
        '--secondary-color': merchantData.secondaryColor 
      } as React.CSSProperties}
    >
      <div className="display-header">
        <div className="status-bar">
          <div className="connection-status connected">
            <div className="status-dot"></div>
            <span>Connesso</span>
          </div>
          <div className="display-title">Display Cliente</div>
          <div className="time">
            {new Date().toLocaleTimeString('it-IT', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </div>
        </div>
      </div>

      <div className="display-body">
        {displayState === 'idle' && renderIdleScreen()}
        {displayState === 'welcome' && renderIdleScreen()}
        {displayState === 'reading-card' && renderReadingCard()}
        {displayState === 'customer-found' && renderCustomerFound()}
        {displayState === 'transaction' && renderTransaction()}
        {displayState === 'completed' && renderCompleted()}
      </div>

      <div className="display-footer">
        <div className="footer-text">
          Powered by OMNILY PRO • Loyalty System
        </div>
      </div>
    </div>
  )
}

export default CustomerDisplay