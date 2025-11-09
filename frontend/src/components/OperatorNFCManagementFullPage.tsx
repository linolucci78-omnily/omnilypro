import React, { useState, useEffect, useRef } from 'react'
import { ArrowLeft, CreditCard, Users, Search, UserPlus, Trash2, Power, Shield, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react'
import { operatorNFCService, type OperatorNFCCard } from '../services/operatorNFCService'
import { organizationService } from '../services/organizationService'
import type { Customer } from '../lib/supabase'
import { useToast } from '../contexts/ToastContext'
import './OperatorNFCManagementFullPage.css'

interface OperatorNFCManagementFullPageProps {
  organizationId: string
  onBack: () => void
}

const OperatorNFCManagementFullPage: React.FC<OperatorNFCManagementFullPageProps> = ({
  organizationId,
  onBack
}) => {
  const { showSuccess, showError } = useToast()
  const [mode, setMode] = useState<'list' | 'add'>('list')
  const [cards, setCards] = useState<OperatorNFCCard[]>([])
  const [organizationUsers, setOrganizationUsers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // Add card states
  const [isReadingNFC, setIsReadingNFC] = useState(false)
  const [scannedNFCUid, setScannedNFCUid] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<Customer | null>(null)
  const [operatorName, setOperatorName] = useState('')
  const [operatorPassword, setOperatorPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Delete confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [cardToDelete, setCardToDelete] = useState<OperatorNFCCard | null>(null)

  const nfcCallbackRef = useRef<any>(null)

  useEffect(() => {
    if (organizationId) {
      loadCards()
      loadOrganizationUsers()
    }
  }, [organizationId])

  // Setup NFC reading for add mode
  useEffect(() => {
    if (mode !== 'add') return

    const handleNFCRead = async (rawResult: any) => {
      console.log('🔐 NFC Read for operator card:', rawResult)

      // Handle both string and object results from Android bridge (stesso formato di CardManagementPanel)
      let result = rawResult;
      if (typeof rawResult === 'string') {
        try {
          result = JSON.parse(rawResult);
          console.log('🔄 Parsed JSON result:', result);
        } catch (e) {
          console.error('❌ Failed to parse JSON result:', e);
          result = { success: false, error: 'Parse failed' };
        }
      }

      console.log('🔐 NFC CALLBACK - Parsed result:', result);
      setIsReadingNFC(false);

      // Controlla se la lettura è riuscita
      if (!result || !result.success) {
        showError('Errore Lettura NFC', result?.error || 'Lettura fallita o annullata');
        return;
      }

      // Estrai l'UID (stesso formato del CardManagementPanel)
      const nfcUid = result.cardNo || result.rfUid;

      if (!nfcUid) {
        console.error('❌ UID non trovato nel risultato:', result);
        showError('Errore Lettura', 'UID della tessera non rilevato');
        return;
      }

      console.log('✅ NFC SUCCESS - Card UID:', nfcUid);

      // Beep di conferma
      const bridge = (window as any).OmnilyPOS;
      if (bridge?.beep) {
        bridge.beep("1", "150");
      }

      // Verifica se la tessera è già associata
      try {
        const existing = await operatorNFCService.getByNFCUid(nfcUid)
        if (existing) {
          showError('Tessera Già Associata', `Questa tessera è già associata a: ${existing.operator_name}`)
          return
        }
      } catch (err) {
        console.error('Error checking existing card:', err)
      }

      setScannedNFCUid(nfcUid)
      showSuccess('Tessera Letta!', 'Seleziona ora l\'operatore dalla lista')
    }

    if (typeof window !== 'undefined') {
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
  }, [mode])

  const loadCards = async () => {
    try {
      setLoading(true)
      const data = await operatorNFCService.getAll(organizationId)
      setCards(data)
    } catch (error) {
      console.error('Error loading operator cards:', error)
      showError('Errore Caricamento', 'Impossibile caricare le tessere operatori')
    } finally {
      setLoading(false)
    }
  }

  const loadOrganizationUsers = async () => {
    try {
      console.log('🔍 Caricamento utenti per org:', organizationId)
      const users = await organizationService.getOrganizationUsers(organizationId)
      console.log('✅ Caricati', users?.length || 0, 'utenti:', users)

      setOrganizationUsers(users || [])

      // DEBUG: Toast temporaneo per vedere sul POS
      if (!users || users.length === 0) {
        console.warn('⚠️ Nessun utente trovato')
        showError('Debug', `Nessun utente trovato in organization_users per org: ${organizationId.substring(0, 8)}`)
      } else {
        // Mostra i primi utenti trovati
        const userNames = users.slice(0, 3).map((u: any) => u.name).join(', ')
        showSuccess('Debug Utenti', `Trovati ${users.length} utenti: ${userNames}${users.length > 3 ? '...' : ''}`)
      }
    } catch (error: any) {
      console.error('Error loading organization users:', error)
      console.error('Error details:', error.message, error.code)
      const errorMsg = error?.message || error?.toString() || 'Errore sconosciuto'
      showError('Errore Caricamento', `Impossibile caricare utenti: ${errorMsg.substring(0, 100)}`)
    }
  }

  const handleStartNFCReading = () => {
    const bridge = (window as any).OmnilyPOS
    if (!bridge || !bridge.readNFCCard) {
      showError('NFC Non Disponibile', 'La funzione NFC non è disponibile su questo dispositivo')
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
    if (!scannedNFCUid || !selectedUser || !operatorName.trim() || !operatorPassword.trim()) {
      showError('Campi Mancanti', 'Compila tutti i campi richiesti, inclusa la password')
      return
    }

    try {
      setLoading(true)
      await operatorNFCService.create({
        user_id: selectedUser.id,
        organization_id: organizationId,
        nfc_uid: scannedNFCUid,
        operator_name: operatorName.trim(),
        password: operatorPassword.trim()
      })

      showSuccess('Tessera Associata!', `La tessera è stata associata a ${operatorName}`)

      // Reset
      setScannedNFCUid(null)
      setSelectedUser(null)
      setOperatorName('')
      setOperatorPassword('')
      setMode('list')

      await loadCards()
    } catch (error: any) {
      console.error('Error assigning card:', error)
      showError('Errore Associazione', error.message || 'Impossibile associare la tessera')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActive = async (card: OperatorNFCCard) => {
    try {
      if (card.is_active) {
        await operatorNFCService.deactivate(card.id)
        showSuccess('Tessera Disattivata', `La tessera di ${card.operator_name} è stata disattivata`)
      } else {
        await operatorNFCService.activate(card.id)
        showSuccess('Tessera Riattivata', `La tessera di ${card.operator_name} è stata riattivata`)
      }
      await loadCards()
    } catch (error) {
      console.error('Error toggling card:', error)
      showError('Errore', 'Impossibile completare l\'operazione')
    }
  }

  const handleDeleteCard = async () => {
    if (!cardToDelete) return

    try {
      await operatorNFCService.delete(cardToDelete.id)
      showSuccess('Tessera Eliminata', `La tessera di ${cardToDelete.operator_name} è stata eliminata`)
      await loadCards()
    } catch (error) {
      console.error('Error deleting card:', error)
      showError('Errore', 'Impossibile eliminare la tessera')
    } finally {
      setShowDeleteModal(false)
      setCardToDelete(null)
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

  return (
    <div className="operator-nfc-fullpage">
      {/* Header */}
      <div className="fullpage-header">
        <button className="back-button" onClick={onBack}>
          <ArrowLeft size={20} />
          Torna alle Impostazioni
        </button>
        <div className="header-info">
          <h1>Gestione Tessere Operatori POS</h1>
          <p>Associa tessere NFC agli operatori per login rapido nel punto vendita</p>
        </div>
      </div>

      {/* Mode Tabs */}
      <div className="mode-tabs">
        <button
          className={`mode-tab ${mode === 'list' ? 'active' : ''}`}
          onClick={() => setMode('list')}
        >
          <Shield size={18} />
          Tessere Attive ({cards.length})
        </button>
        <button
          className={`mode-tab ${mode === 'add' ? 'active' : ''}`}
          onClick={() => {
            setMode('add')
            setScannedNFCUid(null)
            setSelectedUser(null)
            setOperatorName('')
            setOperatorPassword('')
            setSearchTerm('')
            if (isReadingNFC) handleStopNFCReading()
          }}
        >
          <UserPlus size={18} />
          Associa Nuova Tessera
        </button>
      </div>

      {/* Content */}
      <div className="fullpage-content">
        {/* List Mode */}
        {mode === 'list' && (
          <div className="list-mode">
            {/* Search */}
            <div className="search-box">
              <Search size={20} />
              <input
                type="text"
                placeholder="Cerca per nome operatore o UID tessera..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Cards Grid */}
            {loading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Caricamento tessere...</p>
              </div>
            ) : filteredCards.length === 0 ? (
              <div className="empty-state">
                <CreditCard size={64} />
                <h3>Nessuna Tessera Trovata</h3>
                <p>
                  {searchTerm
                    ? 'Nessun risultato per la ricerca'
                    : 'Non ci sono tessere operatore associate. Clicca su "Associa Nuova Tessera" per iniziare.'}
                </p>
                {!searchTerm && (
                  <button className="btn-primary" onClick={() => setMode('add')}>
                    <UserPlus size={20} />
                    Associa Prima Tessera
                  </button>
                )}
              </div>
            ) : (
              <div className="cards-grid">
                {filteredCards.map(card => (
                  <div key={card.id} className={`card-item ${!card.is_active ? 'inactive' : ''}`}>
                    <div className="card-header">
                      <div className="card-icon">
                        <CreditCard size={28} />
                      </div>
                      <div className={`card-status ${card.is_active ? 'active' : 'inactive'}`}>
                        {card.is_active ? 'Attiva' : 'Disattivata'}
                      </div>
                    </div>
                    <div className="card-body">
                      <h3 className="card-name">{card.operator_name}</h3>
                      <div className="card-uid">UID: {card.nfc_uid}</div>
                      {card.last_used_at ? (
                        <div className="card-last-used">
                          <CheckCircle size={14} />
                          Ultimo accesso: {new Date(card.last_used_at).toLocaleDateString('it-IT', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      ) : (
                        <div className="card-never-used">
                          <AlertCircle size={14} />
                          Mai utilizzata
                        </div>
                      )}
                    </div>
                    <div className="card-actions">
                      <button
                        className={`btn-toggle ${card.is_active ? 'active' : 'inactive'}`}
                        onClick={() => handleToggleActive(card)}
                        title={card.is_active ? 'Disattiva tessera' : 'Attiva tessera'}
                      >
                        <Power size={18} />
                        {card.is_active ? 'Disattiva' : 'Attiva'}
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => {
                          setCardToDelete(card)
                          setShowDeleteModal(true)
                        }}
                        title="Elimina tessera"
                      >
                        <Trash2 size={18} />
                        Elimina
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
            <div className="add-steps">
              {/* Step 1: Read NFC */}
              <div className={`add-step ${scannedNFCUid ? 'completed' : 'active'}`}>
                <div className="step-number">1</div>
                <div className="step-content">
                  <h3>Leggi Tessera NFC</h3>
                  {!scannedNFCUid ? (
                    <div className="nfc-read-section">
                      {!isReadingNFC ? (
                        <button className="btn-read-nfc" onClick={handleStartNFCReading}>
                          <CreditCard size={32} />
                          <span>Avvicina Tessera NFC</span>
                        </button>
                      ) : (
                        <div className="nfc-reading">
                          <div className="nfc-pulse">
                            <CreditCard size={48} />
                          </div>
                          <p>In attesa della tessera NFC...</p>
                          <button className="btn-cancel" onClick={handleStopNFCReading}>
                            Annulla
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="nfc-scanned">
                      <div className="check-icon">
                        <CheckCircle size={32} />
                      </div>
                      <p className="success-text">Tessera letta con successo!</p>
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
              </div>

              {/* Step 2: Select User */}
              {scannedNFCUid && (
                <div className={`add-step ${selectedUser ? 'completed' : 'active'}`}>
                  <div className="step-number">2</div>
                  <div className="step-content">
                    <h3>Seleziona Operatore</h3>
                    <p className="step-description">Scegli l'utente da associare a questa tessera</p>
                    <div className="search-box">
                      <Search size={18} />
                      <input
                        type="text"
                        placeholder="Cerca operatore per nome o email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <div className="users-list">
                      {filteredUsers.length === 0 ? (
                        <div className="empty-users">
                          <Users size={48} />
                          <p>Nessun operatore trovato</p>
                        </div>
                      ) : (
                        filteredUsers.map(user => (
                          <div
                            key={user.id}
                            className={`user-item ${selectedUser?.id === user.id ? 'selected' : ''}`}
                            onClick={() => {
                              setSelectedUser(user)
                              setOperatorName(user.name)
                            }}
                          >
                            <div className="user-avatar">
                              <Users size={24} />
                            </div>
                            <div className="user-info">
                              <div className="user-name">{user.name}</div>
                              <div className="user-email">{user.email || 'Nessuna email'}</div>
                            </div>
                            {selectedUser?.id === user.id && (
                              <div className="user-check">
                                <CheckCircle size={20} />
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Operator Name & Password */}
              {selectedUser && (
                <div className="add-step active">
                  <div className="step-number">3</div>
                  <div className="step-content">
                    <h3>Dati Operatore</h3>
                    <p className="step-description">Nome da mostrare e password per login NFC automatico</p>

                    <div className="form-field">
                      <label className="field-label">Nome Operatore (Display)</label>
                      <input
                        type="text"
                        className="input-operator-name"
                        placeholder="Es: Mario Rossi"
                        value={operatorName}
                        onChange={(e) => setOperatorName(e.target.value)}
                      />
                    </div>

                    <div className="form-field">
                      <label className="field-label">Password Login</label>
                      <div className="password-input-wrapper">
                        <input
                          type={showPassword ? "text" : "password"}
                          className="input-operator-name"
                          placeholder="Password operatore"
                          value={operatorPassword}
                          onChange={(e) => setOperatorPassword(e.target.value)}
                        />
                        <button
                          type="button"
                          className="password-toggle-btn"
                          onClick={() => setShowPassword(!showPassword)}
                          title={showPassword ? "Nascondi password" : "Mostra password"}
                        >
                          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                      <p className="field-hint">Inserisci la password che l'operatore usa per il login normale. Verrà salvata in modo sicuro e usata per il login automatico NFC.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Assign Button */}
            {selectedUser && operatorName.trim() && operatorPassword.trim() && (
              <div className="add-footer">
                <button
                  className="btn-assign"
                  onClick={handleAssignCard}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="spinner-small"></div>
                      Associazione in corso...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={20} />
                      Associa Tessera
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && cardToDelete && (
        <>
          <div className="modal-overlay" onClick={() => setShowDeleteModal(false)} />
          <div className="delete-modal">
            <div className="modal-header">
              <AlertCircle size={48} className="warning-icon" />
              <h3>Conferma Eliminazione</h3>
            </div>
            <div className="modal-body">
              <p>
                Sei sicuro di voler eliminare la tessera di <strong>{cardToDelete.operator_name}</strong>?
              </p>
              <div className="modal-uid">UID: {cardToDelete.nfc_uid}</div>
              <p className="modal-warning">
                Questa azione è irreversibile. L'operatore non potrà più accedere con questa tessera.
              </p>
            </div>
            <div className="modal-actions">
              <button className="btn-cancel-modal" onClick={() => {
                setShowDeleteModal(false)
                setCardToDelete(null)
              }}>
                Annulla
              </button>
              <button className="btn-confirm-delete" onClick={handleDeleteCard}>
                <Trash2 size={18} />
                Elimina Tessera
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default OperatorNFCManagementFullPage
