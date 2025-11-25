import React, { useState, useEffect } from 'react'
import { Wallet, TrendingUp, DollarSign, Users, ArrowLeft, Plus, CreditCard, History, BarChart3, Euro } from 'lucide-react'
import { walletService } from '../services/walletService'
import type { CustomerWallet, WalletStats } from '../services/walletService'
import WalletManagementPanel from './WalletManagementPanel'
import './WalletHub.css'

interface WalletHubProps {
  organizationId: string
  organizationName: string
  primaryColor: string
  secondaryColor: string
  staffId?: string
  staffName?: string
}

type ViewType = 'hub' | 'manage'

const WalletHub: React.FC<WalletHubProps> = ({
  organizationId,
  organizationName,
  primaryColor,
  secondaryColor,
  staffId,
  staffName
}) => {
  const [activeView, setActiveView] = useState<ViewType>('hub')
  const [wallets, setWallets] = useState<CustomerWallet[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<WalletStats>({
    total_wallets: 0,
    active_wallets: 0,
    total_balance: 0,
    total_transactions_today: 0,
    total_amount_today: 0
  })

  useEffect(() => {
    fetchWallets()
  }, [organizationId])

  const fetchWallets = async () => {
    try {
      setLoading(true)
      const allWallets = await walletService.getOrganizationWallets(organizationId)
      setWallets(allWallets)

      const statsData = await walletService.getStats(organizationId)
      setStats(statsData)
    } catch (error) {
      console.error('Error fetching wallets:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  // Top 5 wallet con saldo più alto
  const topWallets = [...wallets]
    .sort((a, b) => b.balance - a.balance)
    .slice(0, 5)

  // Vista gestione completa
  if (activeView === 'manage') {
    return (
      <div>
        <button
          className="back-button"
          onClick={() => {
            setActiveView('hub')
            fetchWallets()
          }}
          style={{ color: primaryColor }}
        >
          <ArrowLeft size={20} />
          <span>Torna a Wallet</span>
        </button>
        <WalletManagementPanel
          organizationId={organizationId}
          organizationName={organizationName}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
          staffId={staffId}
          staffName={staffName}
        />
      </div>
    )
  }

  // Vista principale Hub
  return (
    <div
      className="wallet-hub"
      style={{
        '--primary-color': primaryColor,
        '--secondary-color': secondaryColor
      } as React.CSSProperties}
    >
      <div className="wallet-hub-header">
        <div className="wallet-hub-header-content">
          <div className="wallet-hub-icon">
            <Wallet size={48} />
          </div>
          <div>
            <h1>Centro Wallet</h1>
            <p>Gestisci i wallet digitali dei clienti, ricariche e transazioni</p>
          </div>
        </div>
      </div>

      {/* Statistiche Overview */}
      <div className="wallet-stats-grid">
        <div className="wallet-stat-card">
          <div className="wallet-stat-icon" style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}>
            <Users size={24} />
          </div>
          <div className="wallet-stat-content">
            <div className="wallet-stat-value">{stats.active_wallets}</div>
            <div className="wallet-stat-label">Wallet Attivi</div>
          </div>
        </div>

        <div className="wallet-stat-card">
          <div className="wallet-stat-icon" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
            <Euro size={24} />
          </div>
          <div className="wallet-stat-content">
            <div className="wallet-stat-value">{formatCurrency(stats.total_balance)}</div>
            <div className="wallet-stat-label">Saldo Totale</div>
          </div>
        </div>

        <div className="wallet-stat-card">
          <div className="wallet-stat-icon" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
            <TrendingUp size={24} />
          </div>
          <div className="wallet-stat-content">
            <div className="wallet-stat-value">{stats.total_transactions_today}</div>
            <div className="wallet-stat-label">Transazioni Oggi</div>
          </div>
        </div>

        <div className="wallet-stat-card">
          <div className="wallet-stat-icon" style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>
            <BarChart3 size={24} />
          </div>
          <div className="wallet-stat-content">
            <div className="wallet-stat-value">{formatCurrency(stats.total_amount_today)}</div>
            <div className="wallet-stat-label">Volume Oggi</div>
          </div>
        </div>
      </div>

      {/* Top 5 Wallet per Saldo */}
      {topWallets.length > 0 && (
        <div className="wallet-top-section">
          <h2><DollarSign size={28} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} /> Top 5 Wallet per Saldo</h2>
          <div className="wallet-top-grid">
            {topWallets.map((wallet: any, index) => (
              <div key={wallet.id} className="wallet-top-card">
                <div className="wallet-top-badge">#{index + 1}</div>
                <div className="wallet-top-info">
                  <h3>{wallet.customer?.name || 'Cliente'}</h3>
                  <p className="wallet-top-description">{wallet.customer?.email}</p>
                  <div className="wallet-top-meta">
                    <span className="wallet-top-balance">
                      <Euro size={16} />
                      {formatCurrency(wallet.balance)}
                    </span>
                    <span className={`wallet-status-badge wallet-status-${wallet.status}`}>
                      {wallet.status === 'active' ? 'Attivo' : wallet.status === 'suspended' ? 'Sospeso' : 'Chiuso'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Azioni Rapide */}
      <div className="wallet-actions-section">
        <h2>Azioni Rapide</h2>
        <div className="wallet-actions-grid">
          <button
            className="wallet-action-card"
            onClick={() => setActiveView('manage')}
            style={{
              background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`
            }}
          >
            <Wallet size={32} />
            <h3>Gestisci Wallet</h3>
            <p>Visualizza e gestisci tutti i wallet clienti</p>
          </button>

          <button
            className="wallet-action-card wallet-action-secondary"
            onClick={() => setActiveView('manage')}
          >
            <Plus size={32} />
            <h3>Ricarica Wallet</h3>
            <p>Ricarica il wallet di un cliente</p>
          </button>

          <button
            className="wallet-action-card wallet-action-secondary"
            onClick={() => setActiveView('manage')}
          >
            <CreditCard size={32} />
            <h3>Processa Pagamento</h3>
            <p>Accetta pagamento con wallet cliente</p>
          </button>

          <button
            className="wallet-action-card wallet-action-secondary"
            onClick={() => setActiveView('manage')}
          >
            <History size={32} />
            <h3>Storico Transazioni</h3>
            <p>Visualizza tutte le transazioni wallet</p>
          </button>
        </div>
      </div>

      {/* Wallet Recenti */}
      {wallets.length > 0 && (
        <div className="wallet-recent-section">
          <div className="wallet-recent-header">
            <h2>Wallet Recenti</h2>
            <button
              className="wallet-view-all-btn"
              onClick={() => setActiveView('manage')}
              style={{ color: primaryColor }}
            >
              Vedi tutti →
            </button>
          </div>
          <div className="wallet-recent-grid">
            {wallets.slice(0, 6).map((wallet: any) => (
              <div key={wallet.id} className="wallet-recent-card">
                <div className="wallet-recent-header-card">
                  <h3>{wallet.customer?.name || 'Cliente'}</h3>
                  <span className={`wallet-status-badge wallet-status-${wallet.status}`}>
                    {wallet.status === 'active' ? 'Attivo' : wallet.status === 'suspended' ? 'Sospeso' : 'Chiuso'}
                  </span>
                </div>
                <p className="wallet-recent-email">{wallet.customer?.email}</p>
                <div className="wallet-recent-balance">
                  <span className="wallet-balance-label">Saldo:</span>
                  <span className="wallet-balance-value">{formatCurrency(wallet.balance)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {wallets.length === 0 && !loading && (
        <div className="wallet-empty-state">
          <Wallet size={64} style={{ opacity: 0.3 }} />
          <h3>Nessun Wallet Creato</h3>
          <p>I wallet verranno creati automaticamente quando i clienti si registrano</p>
        </div>
      )}
    </div>
  )
}

export default WalletHub
