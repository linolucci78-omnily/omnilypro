import React, { useState, useEffect, useRef } from 'react';
import { X, CreditCard, Users, Search, UserCheck, AlertTriangle, Target, Settings, Trash2, QrCode, ArrowLeft } from 'lucide-react';
import type { Customer, NFCCard } from '../lib/supabase';
import { nfcCardsApi } from '../lib/supabase';
import './CardManagementPanel.css';

interface CardData {
  id: string;
  uid: string;
  assignedTo?: Customer;
  assignedAt?: string;
}

interface CardManagementPanelProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  organizationId: string;
  onAssignCard?: (cardId: string, customerId: string) => void;
  onReassignCard?: (cardId: string, customerId: string) => void;
  onCardRead?: (cardData: any) => void;
}

const CardManagementPanel: React.FC<CardManagementPanelProps> = ({
  isOpen,
  onClose,
  customers,
  organizationId,
  onAssignCard,
  onReassignCard,
  onCardRead
}) => {
  const [mode, setMode] = useState<'read' | 'list' | 'assign'>('read');
  const [isReading, setIsReading] = useState(false);
  const [isReadingQR, setIsReadingQR] = useState(false);
  const [scannedCard, setScannedCard] = useState<CardData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showReassignDialog, setShowReassignDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [cardToDelete, setCardToDelete] = useState<{id: string, uid: string} | null>(null);
  const [assignedCards, setAssignedCards] = useState<NFCCard[]>([]);
  const [loading, setLoading] = useState(false);
  const busyRef = useRef(false); // Ref per prevenire doppi click

  // Carica tessere esistenti quando il pannello si apre
  useEffect(() => {
    if (isOpen && organizationId) {
      checkBridgeVersion();
      // Caricamento automatico delle tessere all'apertura del pannello
      loadAssignedCards();
      // Debug: log dei clienti ricevuti
      console.log('🔍 CUSTOMERS DEBUG - Total customers:', customers.length);
      console.log('🔍 CUSTOMERS DEBUG - Customers:', customers);
      console.log('🔍 CUSTOMERS DEBUG - OrganizationId:', organizationId);
    }
  }, [isOpen, organizationId, customers]);

  const checkBridgeVersion = () => {
    if (typeof window !== 'undefined' && (window as any).OmnilyPOS) {
      const bridge = (window as any).OmnilyPOS;

      if (bridge.getBridgeVersion) {
        const version = bridge.getBridgeVersion();
        console.log('Bridge version:', version);

        if (!version.includes('nfc-on-demand')) {
          console.warn('Bridge may need update for proper NFC control');
        }
      }
    }
  };

  const loadAssignedCards = async () => {
    try {
      setLoading(true);
      const cards = await nfcCardsApi.getAll(organizationId);
      setAssignedCards(cards);

    } catch (error: any) {
      console.error('Error loading cards:', error);
      setAssignedCards([]);

      if (typeof window !== 'undefined' && (window as any).OmnilyPOS) {
        (window as any).OmnilyPOS.showToast(`Errore DB (tessere): ${error?.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    // Definisce la funzione di callback sul window object per essere raggiungibile dal bridge Java
    if (typeof window !== 'undefined' && (window as any).OmnilyPOS && isOpen) {
      (window as any).cardManagementNFCHandler = async (rawResult: any) => {
        console.log('🔵 NFC CALLBACK TRIGGERED - Raw result:', rawResult);
        console.log('🔵 Raw result type:', typeof rawResult);

        // Handle both string and object results from Android bridge
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
        console.log('🔵 NFC CALLBACK - Parsed result:', result);
        setIsReading(false); // Ferma l'indicatore di caricamento

        // Il bridge Java disattiva automaticamente il lettore NFC dopo la lettura.

        if (result && result.success) {
          console.log('✅ NFC SUCCESS - Card UID:', result.cardNo || result.rfUid);
          if ((window as any).OmnilyPOS.beep) {
            (window as any).OmnilyPOS.beep("1", "150");
          }

          const cardUID = result.cardNo || result.rfUid;
          if (!cardUID) {
            console.error("UID della tessera non trovato nel risultato.");
            if ((window as any).OmnilyPOS.showToast) {
              (window as any).OmnilyPOS.showToast('Errore: UID non letto.');
            }
            return;
          }

          try {
            const existingCard = await nfcCardsApi.getByUID(organizationId, cardUID);
            if (existingCard) {
              setScannedCard({
                id: existingCard.id,
                uid: existingCard.uid,
                assignedTo: existingCard.customer,
                assignedAt: existingCard.assigned_at
              });
              setShowReassignDialog(true);
            } else {
              setScannedCard({ id: '', uid: cardUID });
              console.log('🔍 SWITCHING TO ASSIGN MODE - Customers available:', customers.length);
              setMode('assign');
            }
          } catch (error: any) {
            console.error('Errore controllo tessera esistente:', error);
            if (typeof window !== 'undefined' && (window as any).OmnilyPOS) {
              (window as any).OmnilyPOS.showToast(`Errore DB (UID): ${error?.message}`);
            }
          }

          onCardRead?.(result);
        } else {
          console.log('❌ NFC FAILED - Error:', result?.error || 'Unknown error');
          if ((window as any).OmnilyPOS.beep) {
            (window as any).OmnilyPOS.beep("3", "50");
          }
          if ((window as any).OmnilyPOS.showToast) {
            (window as any).OmnilyPOS.showToast(result?.error || 'Lettura fallita o annullata');
          }
        }
      };
      console.log('📡 NFC Handler registered: cardManagementNFCHandler');

      // QR Code callback
      (window as any).cardManagementQRHandler = async (rawResult: any) => {
        console.log('🟡 QR CALLBACK TRIGGERED - Raw result:', rawResult);
        console.log('🟡 Raw result type:', typeof rawResult);

        // Handle both string and object results from Android bridge
        let result = rawResult;
        if (typeof rawResult === 'string') {
          try {
            result = JSON.parse(rawResult);
            console.log('🔄 Parsed QR JSON result:', result);
          } catch (e) {
            console.error('❌ Failed to parse QR JSON result:', e);
            result = { success: false, error: 'Parse failed' };
          }
        }
        console.log('🟡 QR CALLBACK - Parsed result:', result);
        setIsReadingQR(false); // Ferma l'indicatore di caricamento

        if (result && result.success && result.data) {
          console.log('✅ QR SUCCESS - Data:', result.data);
          if ((window as any).OmnilyPOS.beep) {
            (window as any).OmnilyPOS.beep("1", "150");
          }

          // Check if it's an OMNILY customer QR code
          if (result.data.startsWith('OMNILY_CUSTOMER:')) {
            const customerId = result.data.replace('OMNILY_CUSTOMER:', '');
            console.log('🎯 OMNILY Customer QR detected:', customerId);

            // Find customer and show in assignment mode
            const customer = customers.find(c => c.id === customerId);
            if (customer) {
              console.log('✅ Customer found from QR:', customer.name);
              setSelectedCustomer(customer);
              // If we have a scanned card, trigger assignment
              if (scannedCard) {
                await handleAssignCard(customer);
              } else {
                if ((window as any).OmnilyPOS.showToast) {
                  (window as any).OmnilyPOS.showToast(`Cliente selezionato: ${customer.name}`);
                }
              }
            } else {
              console.log('❌ Customer not found for QR ID:', customerId);
              if ((window as any).OmnilyPOS.showToast) {
                (window as any).OmnilyPOS.showToast('Cliente non trovato');
              }
            }
          } else {
            console.log('❌ QR code not valid for OMNILY');
            if ((window as any).OmnilyPOS.showToast) {
              (window as any).OmnilyPOS.showToast('QR code non riconosciuto');
            }
          }
        } else {
          console.log('❌ QR read failed:', result?.error || 'Lettura fallita');
          if ((window as any).OmnilyPOS.beep) {
            (window as any).OmnilyPOS.beep("3", "100");
          }
          if ((window as any).OmnilyPOS.showToast) {
            (window as any).OmnilyPOS.showToast('Errore lettura QR');
          }
        }
      };

      console.log('📡 QR Handler registered: cardManagementQRHandler');
    }

    // Funzione di pulizia eseguita quando il componente viene smontato o il pannello si chiude
    return () => {
      if (typeof window !== 'undefined') {
        const bridge = (window as any).OmnilyPOS;
        if (bridge && bridge.stopNFCReading) {
          // Ferma esplicitamente la lettura se era in corso
          bridge.stopNFCReading();
          console.log("🧹 CLEANUP: Lettura NFC fermata e callback rimosso.");
        }
        // Rimuove la funzione globale per evitare memory leak
        delete (window as any).cardManagementNFCHandler;
      }
    };
  }, [isOpen, organizationId, onCardRead]);

  const handleReadCard = () => {
    console.log('🎯 handleReadCard called - isReading:', isReading);

    // Previene doppi click veloci
    if (busyRef.current) {
      console.log('⚠️ Busy - ignoring click');
      return;
    }
    busyRef.current = true;

    const bridge = (window as any).OmnilyPOS;
    if (!bridge || !bridge.readNFCCard) {
      console.error("Metodo 'readNFCCard' non trovato sul bridge. L'app Android è aggiornata?");
      if (bridge?.showToast) {
        bridge.showToast("Errore: Funzione NFC non trovata. Aggiornare l'app.");
      }
      busyRef.current = false;
      return;
    }

    if (isReading) {
      // Se la lettura è già in corso, il secondo click la annulla
      console.log('🛑 Stopping NFC reading...');
      bridge.stopNFCReading();
      setIsReading(false);
      if (bridge.showToast) {
        bridge.showToast('Lettura tessera annullata.');
      }
    } else {
      console.log('🟢 Starting NFC reading...');
      setIsReading(true);
      setScannedCard(null);
      if (bridge.showToast) {
        bridge.showToast('Avvicina la tessera NFC...');
      }
      // Chiama il metodo del bridge per iniziare la lettura, passando il nome del callback globale
      console.log('📡 Calling bridge.readNFCCard with callback: cardManagementNFCHandler');
      bridge.readNFCCard('cardManagementNFCHandler');
    }

    // Rilascia il lock dopo un breve periodo per permettere una nuova azione
    setTimeout(() => {
      busyRef.current = false;
    }, 500);
  };

  const handleAssignCard = async (customer: Customer) => {
    if (!scannedCard) return;

    try {
      setLoading(true);

      let cardResult: NFCCard;

      if (scannedCard.id) {
        // Tessera esistente - solo assegna al nuovo cliente
        cardResult = await nfcCardsApi.assignToCustomer(scannedCard.id, customer.id);
      } else {
        // Tessera nuova - crea e assegna
        cardResult = await nfcCardsApi.create({
          organization_id: organizationId,
          uid: scannedCard.uid,
          customer_id: customer.id
        });
      }

      // Ricarica la lista delle tessere
      await loadAssignedCards();

      // Notifica il parent component
      onAssignCard?.(cardResult.id, customer.id);

      if (typeof window !== 'undefined' && (window as any).OmnilyPOS) {
        (window as any).OmnilyPOS.showToast(`Tessera assegnata a ${customer.name}`);
      }

      setScannedCard(null);
      setMode('list'); // Mostra la lista delle tessere dopo l'assegnazione

    } catch (error: any) {
      console.error('Errore assegnazione tessera:', error);
      if (typeof window !== 'undefined' && (window as any).OmnilyPOS) {
        (window as any).OmnilyPOS.showToast(`Errore Assegnazione: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReassignCard = async (customer: Customer) => {
    if (!scannedCard?.id) return;

    try {
      setLoading(true);

      // Riassegna tessera al nuovo cliente
      await nfcCardsApi.reassignToCustomer(scannedCard.id, customer.id);

      // Ricarica la lista delle tessere
      await loadAssignedCards();

      // Notifica il parent component
      onReassignCard?.(scannedCard.id, customer.id);

      if (typeof window !== 'undefined' && (window as any).OmnilyPOS) {
        (window as any).OmnilyPOS.showToast(`Tessera riassegnata a ${customer.name}`);
      }

      setShowReassignDialog(false);
      setScannedCard(null);
      setMode('list'); // Mostra la lista delle tessere dopo la riassegnazione

    } catch (error: any) {
      console.error('Errore riassegnazione tessera:', error);
      if (typeof window !== 'undefined' && (window as any).OmnilyPOS) {
        (window as any).OmnilyPOS.showToast(`Errore Riassegnazione: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQRRead = () => {
    if (busyRef.current) {
      console.log('⏸️ Ignoring QR read - system busy');
      return;
    }

    busyRef.current = true;

    if (typeof window === 'undefined' || !(window as any).OmnilyPOS) {
      console.log('❌ Bridge Android non disponibile per QR');
      if ((window as any).OmnilyPOS?.showToast) {
        (window as any).OmnilyPOS.showToast('Bridge Android non disponibile. Usa solo da dispositivo POS.');
      }
      busyRef.current = false;
      return;
    }

    const bridge = (window as any).OmnilyPOS;

    if (isReadingQR) {
      // Se la lettura QR è già in corso, il secondo click la annulla
      console.log('🛑 Stopping QR reading...');
      if (bridge.stopQRReading) {
        bridge.stopQRReading();
      }
      setIsReadingQR(false);
      if (bridge.showToast) {
        bridge.showToast('Lettura QR annullata.');
      }
    } else {
      console.log('🟡 Starting QR reading...');
      setIsReadingQR(true);
      if (bridge.showToast) {
        bridge.showToast('Inquadra il QR code del cliente...');
      }

      if (bridge.readQRCode) {
        console.log('📡 Calling bridge.readQRCode with callback: cardManagementQRHandler');
        bridge.readQRCode('cardManagementQRHandler');
      } else {
        console.log('❌ readQRCode non disponibile nel bridge');
        setIsReadingQR(false);
        if (bridge.showToast) {
          bridge.showToast('Scanner QR non disponibile. Funzionalità non ancora implementata nel dispositivo.');
        }
      }
    }

    // Rilascia il lock dopo un breve periodo
    setTimeout(() => {
      busyRef.current = false;
    }, 500);
  };

  const handleDeleteCard = (cardId: string, cardUid: string) => {
    // Mostra il dialog di conferma professionale
    setCardToDelete({ id: cardId, uid: cardUid });
    setShowDeleteDialog(true);
  };

  const confirmDeleteCard = async () => {
    if (!cardToDelete) return;

    try {
      setLoading(true);

      await nfcCardsApi.deactivate(cardToDelete.id, organizationId);

      // Ricarica la lista delle tessere
      await loadAssignedCards();

      if (typeof window !== 'undefined' && (window as any).OmnilyPOS) {
        (window as any).OmnilyPOS.showToast(`Tessera ${cardToDelete.uid} eliminata con successo`);
      }

      setShowDeleteDialog(false);
      setCardToDelete(null);

    } catch (error: any) {
      console.error('Error deleting card:', error);
      if (typeof window !== 'undefined' && (window as any).OmnilyPOS) {
        (window as any).OmnilyPOS.showToast(`Errore eliminazione: ${error?.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div className="card-management-overlay" onClick={onClose} />

      {/* Panel */}
      <div className={`card-management-panel ${isOpen ? 'open' : ''}`}>
        {/* Header */}
        <div className="card-management-header">
          <button className="back-button-header" onClick={onClose}>
            <ArrowLeft size={20} />
            Indietro
          </button>
          <div className="header-info">
            <h2>Gestione Tessere NFC</h2>
            <p>Leggi, assegna e gestisci le tessere per i clienti</p>
          </div>
        </div>

        {/* Mode Tabs */}
        <div className="mode-tabs">
          <button
            className={`mode-tab ${mode === 'read' ? 'active' : ''}`}
            onClick={() => setMode('read')}
          >
            <CreditCard size={18} />
            Leggi Tessera
          </button>
          <button
            className={`mode-tab ${mode === 'list' ? 'active' : ''}`}
            onClick={() => setMode('list')}
          >
            <Target size={18} />
            Tessere Assegnate
          </button>
          <button
            className={`mode-tab ${mode === 'assign' ? 'active' : ''}`}
            onClick={() => setMode('assign')}
            disabled={!scannedCard}
          >
            <Users size={18} />
            Assegna Cliente
          </button>
        </div>

        {/* Content */}
        <div className="panel-content">
          {mode === 'read' && (
            <div className="read-mode">
              <div className="read-card-section">
                <div className="nfc-reader-area">
                  <CreditCard size={64} />
                  <h3>Lettore Tessere NFC</h3>
                  <p>Premi il pulsante e avvicina la tessera al dispositivo</p>

                  <button
                    className={`read-btn ${isReading ? 'reading' : ''}`}
                    onClick={handleReadCard}
                    disabled={isReading}
                  >
                    {isReading ? (
                      <>
                        <Settings size={18} className="spinning" />
                        Lettura in corso...
                      </>
                    ) : (
                      <>
                        <CreditCard size={18} />
                        Leggi Tessera
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {mode === 'list' && (
            <div className="list-mode">
              <div className="assigned-cards-list">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3>Tessere Assegnate ({assignedCards.length})</h3>
                  <button
                    className="btn-primary"
                    onClick={loadAssignedCards}
                    disabled={loading}
                    style={{ padding: '8px 16px', fontSize: '14px' }}
                  >
                    {loading ? 'Caricamento...' : 'Carica Tessere'}
                  </button>
                </div>

                {assignedCards.length === 0 ? (
                  <div className="empty-state">
                    <CreditCard size={48} />
                    <p>Nessuna tessera assegnata</p>
                  </div>
                ) : (
                  <div className="cards-list">
                    {loading ? (
                      <div className="loading-state">
                        <Settings size={32} className="spinning" />
                        <p>Caricamento tessere...</p>
                      </div>
                    ) : assignedCards.map((card, index) => (
                      <div key={index} className="assigned-card-item">
                        <div className="card-info">
                          <div className="card-uid">
                            <CreditCard size={20} />
                            <span>UID: {card.uid}</span>
                          </div>
                          {card.customer && (
                            <div className="assigned-customer">
                              <Users size={16} />
                              <span>{card.customer.name}</span>
                              <span className="customer-email">({card.customer.email})</span>
                            </div>
                          )}
                          {card.assigned_at && (
                            <div className="assigned-date">
                              Assegnata: {new Date(card.assigned_at).toLocaleDateString('it-IT')}
                            </div>
                          )}
                          {!card.customer && (
                            <div className="unassigned-status">
                              <AlertTriangle size={16} />
                              <span>Non assegnata</span>
                            </div>
                          )}
                        </div>
                        <div className="card-actions">
                          <button
                            className="delete-card-btn"
                            onClick={() => handleDeleteCard(card.id, card.uid)}
                            disabled={loading}
                            title="Elimina tessera"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {mode === 'assign' && scannedCard && (
            <div className="assign-mode">
              <div className="scanned-card-info">
                <div className="card-preview">
                  <CreditCard size={32} />
                  <div>
                    <strong>Tessera Letta</strong>
                    <p>UID: {scannedCard.uid}</p>
                  </div>
                </div>
              </div>

              <div className="customer-selection">
                <h3>Seleziona Cliente</h3>

                <div className="search-bar">
                  <Search size={18} />
                  <input
                    type="text"
                    placeholder="Cerca cliente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="customers-list">
                  {filteredCustomers.map((customer) => (
                    <div
                      key={customer.id}
                      className={`customer-item ${selectedCustomer?.id === customer.id ? 'selected' : ''}`}
                      onClick={() => setSelectedCustomer(customer)}
                    >
                      <div className="customer-avatar">
                        <Users size={20} />
                      </div>
                      <div className="customer-details">
                        <div className="customer-name">{customer.name}</div>
                        <div className="customer-meta">
                          {customer.email} • {customer.points} punti
                        </div>
                      </div>
                      <button
                        className="assign-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAssignCard(customer);
                        }}
                      >
                        <UserCheck size={16} />
                        Assegna
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Reassign Dialog */}
        {showReassignDialog && scannedCard && (
          <div className="reassign-dialog-overlay">
            <div className="reassign-dialog">
              <div className="dialog-header">
                <AlertTriangle size={24} color="#f59e0b" />
                <h3>Tessera Già Assegnata</h3>
              </div>

              <div className="dialog-content">
                <p>
                  La tessera <strong>{scannedCard.uid}</strong> è già assegnata a{' '}
                  <strong>{scannedCard.assignedTo?.name}</strong>.
                </p>
                <p>Vuoi riassegnarla a un altro cliente?</p>
              </div>

              <div className="dialog-actions">
                <button
                  className="btn-secondary"
                  onClick={() => {
                    setShowReassignDialog(false);
                    setScannedCard(null);
                  }}
                >
                  Annulla
                </button>
                <button
                  className="btn-primary"
                  onClick={() => {
                    setShowReassignDialog(false);
                    setMode('assign');
                  }}
                >
                  Riassegna
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        {showDeleteDialog && cardToDelete && (
          <div className="reassign-dialog-overlay">
            <div className="reassign-dialog delete-dialog">
              <div className="dialog-header">
                <Trash2 size={24} color="#dc2626" />
                <h3>Conferma Eliminazione</h3>
              </div>
              <div className="dialog-content">
                <p>
                  Sei sicuro di voler eliminare la tessera <strong>{cardToDelete.uid}</strong>?
                </p>
                <p className="warning-text">
                  Questa azione non può essere annullata. La tessera verrà disattivata permanentemente.
                </p>
              </div>
              <div className="dialog-actions">
                <button
                  className="btn-secondary"
                  onClick={() => {
                    setShowDeleteDialog(false);
                    setCardToDelete(null);
                  }}
                  disabled={loading}
                >
                  Annulla
                </button>
                <button
                  className="btn-danger"
                  onClick={confirmDeleteCard}
                  disabled={loading}
                >
                  {loading ? 'Eliminazione...' : 'Elimina Tessera'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default CardManagementPanel;