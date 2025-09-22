import React, { useState, useEffect } from 'react';
import { X, CreditCard, Users, Search, UserCheck, AlertTriangle, Target, Settings } from 'lucide-react';
import type { Customer } from '../lib/supabase';
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
  onAssignCard?: (cardId: string, customerId: string) => void;
  onReassignCard?: (cardId: string, customerId: string) => void;
  onCardRead?: (cardData: any) => void;
}

const CardManagementPanel: React.FC<CardManagementPanelProps> = ({
  isOpen,
  onClose,
  customers,
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
  const [assignedCards, setAssignedCards] = useState<CardData[]>([
    {
      id: '1',
      uid: 'A1B2C3D4E5F6',
      assignedTo: customers[0],
      assignedAt: '2024-01-15T10:30:00Z'
    },
    {
      id: '2',
      uid: 'F6E5D4C3B2A1',
      assignedTo: customers[1],
      assignedAt: '2024-01-20T14:20:00Z'
    }
  ]);

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Setup NFC callback
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).OmnilyPOS) {
      (window as any).cardManagementNFCHandler = (result: any) => {
        console.log('Card Management NFC Result:', result);
        setIsReading(false);

        if (result && result.success) {
          const cardData: CardData = {
            id: Date.now().toString(),
            uid: result.cardNo || result.rfUid,
          };

          // Check if card is already assigned
          const existingCard = assignedCards.find(card => card.uid === cardData.uid);

          if (existingCard) {
            setScannedCard({ ...cardData, assignedTo: existingCard.assignedTo });
            setShowReassignDialog(true);
          } else {
            setScannedCard(cardData);
            setMode('assign');
          }

          onCardRead?.(result);

          if ((window as any).OmnilyPOS.beep) {
            (window as any).OmnilyPOS.beep("1", "150");
          }
        } else {
          if ((window as any).OmnilyPOS.beep) {
            (window as any).OmnilyPOS.beep("3", "50");
          }
          if ((window as any).OmnilyPOS.showToast) {
            (window as any).OmnilyPOS.showToast('Errore lettura tessera');
          }
        }
      };
    }
  }, [assignedCards, onCardRead]);

  const handleReadCard = () => {
    setIsReading(true);
    setScannedCard(null);

    if (typeof window !== 'undefined' && (window as any).OmnilyPOS) {
      const bridge = (window as any).OmnilyPOS;

      try {
        bridge.readNFCCard('cardManagementNFCHandler');
        if (bridge.showToast) {
          bridge.showToast('Avvicina la tessera NFC');
        }
      } catch (error) {
        console.error('NFC Error:', error);
        setIsReading(false);
        if (bridge.showToast) {
          bridge.showToast('Errore sistema NFC');
        }
      }
    }
  };

  const handleAssignCard = (customer: Customer) => {
    if (scannedCard) {
      const newCard: CardData = {
        ...scannedCard,
        assignedTo: customer,
        assignedAt: new Date().toISOString()
      };

      setAssignedCards(prev => [...prev, newCard]);
      onAssignCard?.(scannedCard.id, customer.id);

      if (typeof window !== 'undefined' && (window as any).OmnilyPOS) {
        (window as any).OmnilyPOS.showToast(`Tessera assegnata a ${customer.name}`);
      }

      setScannedCard(null);
      setMode('read');
    }
  };

  const handleReassignCard = (customer: Customer) => {
    if (scannedCard) {
      setAssignedCards(prev =>
        prev.map(card =>
          card.uid === scannedCard.uid
            ? { ...card, assignedTo: customer, assignedAt: new Date().toISOString() }
            : card
        )
      );

      onReassignCard?.(scannedCard.id, customer.id);

      if (typeof window !== 'undefined' && (window as any).OmnilyPOS) {
        (window as any).OmnilyPOS.showToast(`Tessera riassegnata a ${customer.name}`);
      }

      setShowReassignDialog(false);
      setScannedCard(null);
      setMode('read');
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
                <h3>Tessere Assegnate ({assignedCards.length})</h3>

                {assignedCards.length === 0 ? (
                  <div className="empty-state">
                    <CreditCard size={48} />
                    <p>Nessuna tessera assegnata</p>
                  </div>
                ) : (
                  <div className="cards-list">
                    {assignedCards.map((card, index) => (
                      <div key={index} className="assigned-card-item">
                        <div className="card-info">
                          <div className="card-uid">
                            <CreditCard size={20} />
                            <span>UID: {card.uid}</span>
                          </div>
                          {card.assignedTo && (
                            <div className="assigned-customer">
                              <Users size={16} />
                              <span>{card.assignedTo.name}</span>
                            </div>
                          )}
                          {card.assignedAt && (
                            <div className="assigned-date">
                              Assegnata: {new Date(card.assignedAt).toLocaleDateString('it-IT')}
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