import React, { useState, useEffect } from 'react';
import { X, CreditCard, Users, Search, UserCheck, AlertTriangle, Target, Settings } from 'lucide-react';
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
  const [scannedCard, setScannedCard] = useState<CardData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showReassignDialog, setShowReassignDialog] = useState(false);
  const [assignedCards, setAssignedCards] = useState<NFCCard[]>([]);
  const [loading, setLoading] = useState(false);

  // Carica tessere esistenti quando il pannello si apre
  useEffect(() => {
    if (isOpen && organizationId) {
      checkBridgeVersion();
      // Non caricare automaticamente le tessere per evitare errori
      // loadAssignedCards();
    }
  }, [isOpen, organizationId]);

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
        (window as any).OmnilyPOS.showToast(`Error: ${error?.message || 'Database connection'}`);
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
      (window as any).cardManagementNFCHandler = async (rawResult: string) => {
        const result = JSON.parse(rawResult);
        console.log('Card Management NFC Result:', result);
        setIsReading(false); // Ferma l'indicatore di caricamento

        // Il bridge Java disattiva automaticamente il lettore NFC dopo la lettura.

        if (result && result.success) {
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
              setMode('assign');
            }
          } catch (error) {
            console.error('Errore controllo tessera esistente:', error);
            setScannedCard({ id: '', uid: cardUID });
            setMode('assign');
          }

          onCardRead?.(result);
        } else {
          if ((window as any).OmnilyPOS.beep) {
            (window as any).OmnilyPOS.beep("3", "50");
          }
          if ((window as any).OmnilyPOS.showToast) {
            (window as any).OmnilyPOS.showToast(result?.error || 'Lettura fallita o annullata');
          }
        }
      };
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
    const bridge = (window as any).OmnilyPOS;
    if (!bridge || !bridge.readNFCCard) {
      console.error("Metodo 'readNFCCard' non trovato sul bridge. L'app Android è aggiornata?");
      if (bridge?.showToast) {
        bridge.showToast("Errore: Funzione NFC non trovata. Aggiornare l'app.");
      }
      return;
    }

    if (isReading) {
      // Se la lettura è già in corso, il secondo click la annulla
      bridge.stopNFCReading();
      setIsReading(false);
      if (bridge.showToast) {
        bridge.showToast('Lettura tessera annullata.');
      }
      return;
    }

    setIsReading(true);
    setScannedCard(null);
    if (bridge.showToast) {
      bridge.showToast('Avvicina la tessera NFC...');
    }

    // Chiama il metodo del bridge per iniziare la lettura, passando il nome del callback globale
    bridge.readNFCCard('cardManagementNFCHandler');
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

    } catch (error) {
      console.error('Errore assegnazione tessera:', error);
      if (typeof window !== 'undefined' && (window as any).OmnilyPOS) {
        (window as any).OmnilyPOS.showToast('Errore assegnazione tessera');
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

    } catch (error) {
      console.error('Errore riassegnazione tessera:', error);
      if (typeof window !== 'undefined' && (window as any).OmnilyPOS) {
        (window as any).OmnilyPOS.showToast('Errore riassegnazione tessera');
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
          <div className="header-info">
            <h2>Gestione Tessere NFC</h2>
            <p>Leggi, assegna e gestisci le tessere per i clienti</p>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
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
      </div>
    </>
  );
};

export default CardManagementPanel;