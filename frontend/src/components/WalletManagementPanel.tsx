import React, { useState, useEffect } from 'react'
import {
  X,
  Search,
  Wallet,
  Plus,
  CreditCard,
  History,
  Euro,
  User,
  Phone,
  Mail,
  TrendingUp,
  TrendingDown
} from 'lucide-react'
import { walletService } from '../services/walletService'
import type { CustomerWallet, WalletTransaction } from '../services/walletService'
import Toast from './Toast'
import './WalletManagementPanel.css'

interface WalletManagementPanelProps {
  organizationId: string
  organizationName: string
  primaryColor: string
  secondaryColor: string
  staffId?: string
  staffName?: string
}

const WalletManagementPanel: React.FC<WalletManagementPanelProps> = ({
  organizationId,
  primaryColor,
  staffId
}) => {
  const [wallets, setWallets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedWallet, setSelectedWallet] = useState<any | null>(null)
  const [transactions, setTransactions] = useState<WalletTransaction[]>([])
  const [showTopUpModal, setShowTopUpModal] = useState(false)
  const [topUpAmount, setTopUpAmount] = useState('')
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    loadWallets()
  }, [organizationId])

  const loadWallets = async () => {
    setLoading(true)
    try {
      const data = await walletService.getOrganizationWallets(organizationId)
      setWallets(data)
    } catch (error) {
      console.error('Error loading wallets:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadTransactions = async (walletId: string) => {
    try {
      const data = await walletService.getWalletTransactions(walletId, 50)
      setTransactions(data)
    } catch (error) {
      console.error('Error loading transactions:', error)
    }
  }

  const handleWalletClick = async (wallet: any) => {
    setSelectedWallet(wallet)
    await loadTransactions(wallet.id)
  }

  const handleTopUp = async () => {
    if (!selectedWallet || !topUpAmount) return

    const amount = parseFloat(topUpAmount)
    if (isNaN(amount) || amount <= 0) {
      setToast({ message: 'Importo non valido', type: 'error' })
      return
    }

    try {
      const result = await walletService.topUpWallet(
        organizationId,
        selectedWallet.customer_id,
        amount,
        'Carta di Credito',
        staffId
      )

      if (result.success) {
        setToast({ message: `Ricarica di €${amount.toFixed(2)} completata!`, type: 'success' })
        setShowTopUpModal(false)
        setTopUpAmount('')
        await loadWallets()
        if (selectedWallet) {
          await loadTransactions(selectedWallet.id)
          // Aggiorna il saldo del wallet selezionato
          setSelectedWallet({
            ...selectedWallet,
            balance: result.newBalance || selectedWallet.balance
          })
        }
      } else {
        setToast({ message: result.error || 'Errore durante la ricarica', type: 'error' })
      }
    } catch (error) {
      setToast({ message: 'Errore imprevisto', type: 'error' })
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTransactionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      credit: 'Accredito',
      debit: 'Addebito',
      gift_certificate_redeem: 'Riscatto Gift Certificate',
      refund: 'Rimborso',
      payment: 'Pagamento',
      top_up: 'Ricarica'
    }
    return labels[type] || type
  }

  const isCredit = (type: string) => {
    return ['credit', 'gift_certificate_redeem', 'refund', 'top_up'].includes(type)
  }

  const filteredWallets = wallets.filter(wallet =>
    wallet.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    wallet.customer?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    wallet.customer?.phone?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="wallet-management-panel">
      <div className="wallet-panel-container">
        {/* Lista Wallet */}
        <div className="wallet-list-section">
          <div className="wallet-search-bar">
            <Search size={20} />
            <input
              type="text"
              placeholder="Cerca cliente per nome, email o telefono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="wallet-list">
            {loading ? (
              <div className="wallet-loading">Caricamento...</div>
            ) : filteredWallets.length === 0 ? (
              <div className="wallet-empty">
                <Wallet size={48} style={{ opacity: 0.3 }} />
                <p>Nessun wallet trovato</p>
              </div>
            ) : (
              filteredWallets.map((wallet) => (
                <div
                  key={wallet.id}
                  className={`wallet-item ${selectedWallet?.id === wallet.id ? 'selected' : ''}`}
                  onClick={() => handleWalletClick(wallet)}
                >
                  <div className="wallet-item-header">
                    <div className="wallet-item-customer">
                      <h3>{wallet.customer?.name || 'Cliente'}</h3>
                      <p>{wallet.customer?.email}</p>
                    </div>
                    <span className={`wallet-status-badge wallet-status-${wallet.status}`}>
                      {wallet.status}
                    </span>
                  </div>
                  <div className="wallet-item-balance">
                    <span className="wallet-balance-label">Saldo:</span>
                    <span className="wallet-balance-amount">{formatCurrency(wallet.balance)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Dettagli Wallet */}
        <div className="wallet-details-section">
          {selectedWallet ? (
            <>
              {/* Header Wallet */}
              <div className="wallet-details-header">
                <div className="wallet-customer-info">
                  <div className="wallet-customer-avatar">
                    <User size={32} />
                  </div>
                  <div>
                    <h2>{selectedWallet.customer?.name || 'Cliente'}</h2>
                    <div className="wallet-customer-contacts">
                      {selectedWallet.customer?.email && (
                        <span><Mail size={14} /> {selectedWallet.customer.email}</span>
                      )}
                      {selectedWallet.customer?.phone && (
                        <span><Phone size={14} /> {selectedWallet.customer.phone}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="wallet-balance-card">
                  <div className="wallet-balance-label">Saldo Attuale</div>
                  <div className="wallet-balance-value">{formatCurrency(selectedWallet.balance)}</div>
                </div>
              </div>

              {/* Azioni */}
              <div className="wallet-actions">
                <button
                  className="wallet-action-btn wallet-action-primary"
                  onClick={() => setShowTopUpModal(true)}
                  style={{ background: primaryColor }}
                >
                  <Plus size={20} />
                  Ricarica
                </button>
                <button className="wallet-action-btn wallet-action-secondary" disabled>
                  <CreditCard size={20} />
                  Processa Pagamento
                </button>
              </div>

              {/* Transazioni */}
              <div className="wallet-transactions-section">
                <h3><History size={20} /> Storico Transazioni</h3>

                {transactions.length === 0 ? (
                  <div className="wallet-no-transactions">
                    <p>Nessuna transazione</p>
                  </div>
                ) : (
                  <div className="wallet-transactions-list">
                    {transactions.map((tx) => (
                      <div key={tx.id} className="wallet-transaction-item">
                        <div className="wallet-transaction-icon">
                          {isCredit(tx.type) ? (
                            <TrendingUp size={20} style={{ color: '#10b981' }} />
                          ) : (
                            <TrendingDown size={20} style={{ color: '#ef4444' }} />
                          )}
                        </div>
                        <div className="wallet-transaction-info">
                          <div className="wallet-transaction-type">
                            {getTransactionTypeLabel(tx.type)}
                          </div>
                          <div className="wallet-transaction-date">
                            {formatDate(tx.created_at)}
                          </div>
                          {tx.description && (
                            <div className="wallet-transaction-description">
                              {tx.description}
                            </div>
                          )}
                        </div>
                        <div className="wallet-transaction-amount">
                          <span className={isCredit(tx.type) ? 'credit' : 'debit'}>
                            {isCredit(tx.type) ? '+' : '-'}{formatCurrency(tx.amount)}
                          </span>
                          <div className="wallet-transaction-balance">
                            Saldo: {formatCurrency(tx.balance_after)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="wallet-no-selection">
              <Wallet size={64} style={{ opacity: 0.2 }} />
              <p>Seleziona un wallet dalla lista</p>
            </div>
          )}
        </div>
      </div>

      {/* Top Up Modal */}
      {showTopUpModal && (
        <div className="modal-overlay" onClick={() => setShowTopUpModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Ricarica Wallet</h2>
              <button onClick={() => setShowTopUpModal(false)}>
                <X size={24} />
              </button>
            </div>
            <div className="modal-body">
              <div className="modal-customer-info">
                <strong>{selectedWallet?.customer?.name}</strong>
                <span>Saldo attuale: {formatCurrency(selectedWallet?.balance || 0)}</span>
              </div>

              <div className="modal-input-group">
                <label>Importo Ricarica</label>
                <div className="modal-amount-input">
                  <Euro size={20} />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={topUpAmount}
                    onChange={(e) => setTopUpAmount(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>

              <div className="modal-preset-amounts">
                {[10, 20, 50, 100, 200].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setTopUpAmount(amount.toString())}
                    className="modal-preset-btn"
                  >
                    €{amount}
                  </button>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="modal-btn modal-btn-secondary"
                onClick={() => setShowTopUpModal(false)}
              >
                Annulla
              </button>
              <button
                className="modal-btn modal-btn-primary"
                onClick={handleTopUp}
                disabled={!topUpAmount || parseFloat(topUpAmount) <= 0}
                style={{ background: primaryColor }}
              >
                Conferma Ricarica
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      <Toast
        message={toast?.message || ''}
        type={toast?.type || 'success'}
        isVisible={!!toast}
        onClose={() => setToast(null)}
      />
    </div>
  )
}

export default WalletManagementPanel
