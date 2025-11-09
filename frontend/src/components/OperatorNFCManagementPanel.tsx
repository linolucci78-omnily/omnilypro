import React, { useState, useEffect, useRef } from 'react'
import { X, CreditCard, Users, Search, UserPlus, AlertTriangle, Trash2, Power, Shield } from 'lucide-react'
import { operatorNFCService, type OperatorNFCCard } from '../services/operatorNFCService'
import type { Customer } from '../lib/supabase'
import './OperatorNFCManagementPanel.css'

interface OperatorNFCManagementPanelProps {
  isOpen: boolean
  onClose: () => void
  organizationId: string
  organizationUsers: Customer[] // Lista degli utenti dell'organizzazione
}

const OperatorNFCManagementPanel: React.FC<OperatorNFCManagementPanelProps> = ({
  isOpen,
  onClose,
  organizationId,
  organizationUsers
}) => {
  const [mode, setMode] = useState<'list' | 'add'>('list')
  const [cards, setCards] = useState<OperatorNFCCard[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // Add card states
  const [isReadingNFC, setIsReadingNFC] = useState(false)
  const [scannedNFCUid, setScannedNFCUid] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<Customer | null>(null)
  const [operatorName, setOperatorName] = useState('')

  const nfcCallbackRef = useRef<any>(null)

  useEffect(() => {
    if (isOpen && organizationId) {
      loadCards()
    }
  }, [isOpen, organizationId])

  // Setup NFC reading for add mode
  useEffect(() => {
    if (!isOpen || mode !== 'add') return

    const handleNFCRead = async (rawResult: any) => {
      console.log('🔐 NFC Read for operator card:', rawResult)

      let nfcUid = ''
      if (typeof rawResult === 'string') {
        try {
          const parsed = JSON.parse(rawResult)
          nfcUid = parsed.uid || parsed.nfcUid || ''
        } catch {
          nfcUid = rawResult
        }
      } else if (rawResult?.uid) {
        nfcUid = rawResult.uid
      } else if (rawResult?.nfcUid) {
        nfcUid = rawResult.nfcUid
      }

      if (!nfcUid) {
        alert('Errore: Impossibile leggere la tessera')
        setIsReadingNFC(false)
        return
      }

      // Verifica se la tessera è già associata
      try {
        const existing = await operatorNFCService.getByNFCUid(nfcUid)
        if (existing) {
          alert('Questa tessera è già associata a: ' + existing.operator_name)
          setIsReadingNFC(false)
          return
        }
      } catch (err) {
        console.error('Error checking existing card:', err)
      }

      setScannedNFCUid(nfcUid)
      setIsReadingNFC(false)

      const bridge = (window as any).OmnilyPOS
      if (bridge?.showToast) {
        bridge.showToast('Tessera letta! Seleziona l\'operatore.')
      }
    }

    if (typeof window !== 'undefined' && (window as any).OmnilyPOS) {
      (window as any).operatorNFCManagementHandler = handleNFCRead
      nfcCallbackRef.current = handleNFCRead
    }

    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).operatorNFCManagementHandler
        const bridge = (window as any).OmnilyPOS
        if (bridge && bridge.stopNFCReading) {
          bridge.stopNFCReading()
        }
      }
    }
  }, [isOpen, mode])

  const loadCards = async () => {
    try {
      setLoading(true)
      const data = await operatorNFCService.getAll(organizationId)
      setCards(data)
    } catch (error) {
      console.error('Error loading operator cards:', error)
      alert('Errore caricamento tessere operatori')
    } finally {
      setLoading(false)
    }
  }

  const handleStartNFCReading = () => {
    const bridge = (window as any).OmnilyPOS
    if (!bridge || !bridge.readNFCCard) {
      alert('Funzione NFC non disponibile')
      return
    }

    setIsReadingNFC(true)
    setScannedNFCUid(null)

    if (bridge.showToast) {
      bridge.showToast('Avvicina la tessera NFC dell\'operatore...')
    }

    bridge.readNFCCard('operatorNFCManagementHandler')
  }

  const handleStopNFCReading = () => {
    const bridge = (window as any).OmnilyPOS
    if (bridge && bridge.stopNFCReading) {
      bridge.stopNFCReading()
    }
    setIsReadingNFC(false)
  }

  const handleAssignCard = async () => {
    if (!scannedNFCUid || !selectedUser || !operatorName.trim()) {
      alert('Compila tutti i campi')
      return
    }

    try {
      setLoading(true)
      await operatorNFCService.create({
        user_id: selectedUser.id,
        organization_id: organizationId,
        nfc_uid: scannedNFCUid,
        operator_name: operatorName.trim()
      })

      alert('Tessera associata con successo!')

      // Reset
      setScannedNFCUid(null)
      setSelectedUser(null)
      setOperatorName('')
      setMode('list')

      await loadCards()
    } catch (error: any) {
      console.error('Error assigning card:', error)
      alert('Errore: ' + (error.message || 'Impossibile associare la tessera'))
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActive = async (card: OperatorNFCCard) => {
    try {
      if (card.is_active) {
        await operatorNFCService.deactivate(card.id)
        alert('Tessera disattivata')
      } else {
        await operatorNFCService.activate(card.id)
        alert('Tessera riattivata')
      }
      await loadCards()
    } catch (error) {
      console.error('Error toggling card:', error)
      alert('Errore durante l\'operazione')
    }
  }

  const handleDeleteCard = async (card: OperatorNFCCard) => {
    if (!confirm(`Eliminare la tessera di ${card.operator_name}?`)) return

    try {
      await operatorNFCService.delete(card.id)
      alert('Tessera eliminata')
      await loadCards()
    } catch (error) {
      console.error('Error deleting card:', error)
      alert('Errore durante l\'eliminazione')
    }
  }

  const filteredCards = cards.filter(card =>
    card.operator_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    card.nfc_uid.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredUsers = organizationUsers.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div className="operator-nfc-overlay" onClick={onClose} />

      {/* Panel */}
      <div className={`operator-nfc-panel ${isOpen ? 'open' : ''}`}>
        {/* Header */}
        <div className="operator-nfc-header">
          <div className="header-info">
            <h2>Gestione Tessere Operatori</h2>
            <p>Associa tessere NFC agli operatori per login rapido</p>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="mode-tabs">
          <button
            className={`mode-tab ${mode === 'list' ? 'active' : ''}`}
            onClick={() => setMode('list')}
          >
            <Shield size={18} />
            Tessere Attive
          </button>
          <button
            className={`mode-tab ${mode === 'add' ? 'active' : ''}`}
            onClick={() => {
              setMode('add')
              setScannedNFCUid(null)
              setSelectedUser(null)
              setOperatorName('')
              if (isReadingNFC) handleStopNFCReading()
            }}
          >
            <UserPlus size={18} />
            Associa Tessera
          </button>
        </div>

        {/* Content */}
        <div className="panel-content">
          {/* List Mode */}
          {mode === 'list' && (
            <div className="list-mode">
              {/* Search */}
              <div className="search-box">
                <Search size={18} />
                <input
                  type="text"
                  placeholder="Cerca per nome o UID tessera..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Cards List */}
              {loading ? (
                <div className="loading-state">Caricamento...</div>
              ) : filteredCards.length === 0 ? (
                <div className="empty-state">
                  <CreditCard size={48} />
                  <p>Nessuna tessera operatore trovata</p>
                </div>
              ) : (
                <div className="cards-list">
                  {filteredCards.map(card => (
                    <div key={card.id} className={`card-item ${!card.is_active ? 'inactive' : ''}`}>
                      <div className="card-icon">
                        <CreditCard size={24} />
                      </div>
                      <div className="card-info">
                        <div className="card-name">{card.operator_name}</div>
                        <div className="card-uid">UID: {card.nfc_uid}</div>
                        {card.last_used_at && (
                          <div className="card-last-used">
                            Ultimo accesso: {new Date(card.last_used_at).toLocaleString('it-IT')}
                          </div>
                        )}
                      </div>
                      <div className="card-actions">
                        <button
                          className={`btn-toggle ${card.is_active ? 'active' : 'inactive'}`}
                          onClick={() => handleToggleActive(card)}
                          title={card.is_active ? 'Disattiva' : 'Attiva'}
                        >
                          <Power size={18} />
                        </button>
                        <button
                          className="btn-delete"
                          onClick={() => handleDeleteCard(card)}
                          title="Elimina"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Add Mode */}
          {mode === 'add' && (
            <div className="add-mode">
              {/* Step 1: Read NFC */}
              <div className="add-step">
                <h3>1. Leggi Tessera NFC</h3>
                {!scannedNFCUid ? (
                  <div className="nfc-read-section">
                    {!isReadingNFC ? (
                      <button className="btn-read-nfc" onClick={handleStartNFCReading}>
                        <CreditCard size={32} />
                        <span>Avvicina Tessera</span>
                      </button>
                    ) : (
                      <div className="nfc-reading">
                        <div className="nfc-pulse">
                          <CreditCard size={48} />
                        </div>
                        <p>In attesa della tessera...</p>
                        <button className="btn-cancel" onClick={handleStopNFCReading}>
                          Annulla
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="nfc-scanned">
                    <div className="check-icon">✓</div>
                    <p>Tessera letta</p>
                    <div className="scanned-uid">UID: {scannedNFCUid}</div>
                    <button className="btn-read-again" onClick={() => {
                      setScannedNFCUid(null)
                      handleStartNFCReading()
                    }}>
                      Leggi un'altra tessera
                    </button>
                  </div>
                )}
              </div>

              {/* Step 2: Select User */}
              {scannedNFCUid && (
                <>
                  <div className="add-step">
                    <h3>2. Seleziona Operatore</h3>
                    <div className="search-box">
                      <Search size={18} />
                      <input
                        type="text"
                        placeholder="Cerca operatore..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <div className="users-list">
                      {filteredUsers.map(user => (
                        <div
                          key={user.id}
                          className={`user-item ${selectedUser?.id === user.id ? 'selected' : ''}`}
                          onClick={() => {
                            setSelectedUser(user)
                            setOperatorName(user.name)
                          }}
                        >
                          <Users size={20} />
                          <div className="user-info">
                            <div className="user-name">{user.name}</div>
                            <div className="user-email">{user.email || 'Nessuna email'}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Step 3: Operator Name */}
                  {selectedUser && (
                    <div className="add-step">
                      <h3>3. Nome Operatore (per display)</h3>
                      <input
                        type="text"
                        className="input-operator-name"
                        placeholder="Es: Mario Rossi"
                        value={operatorName}
                        onChange={(e) => setOperatorName(e.target.value)}
                      />
                    </div>
                  )}

                  {/* Assign Button */}
                  {selectedUser && operatorName.trim() && (
                    <button
                      className="btn-assign"
                      onClick={handleAssignCard}
                      disabled={loading}
                    >
                      {loading ? 'Associazione...' : 'Associa Tessera'}
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default OperatorNFCManagementPanel
