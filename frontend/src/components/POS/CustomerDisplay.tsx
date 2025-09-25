import React, { useState, useEffect } from 'react';
import './CustomerDisplay.css';

interface TransactionData {
  items: Array<{
    name: string;
    price: number;
    quantity: number;
  }>;
  total: number;
  customer?: {
    name: string;
    points: number;
  };
}

const CustomerDisplay: React.FC = () => {
  const [transaction, setTransaction] = useState<TransactionData>({
    items: [],
    total: 0
  });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [organizationName, setOrganizationName] = useState('OMNILY PRO');
  const [welcomeMessage, setWelcomeMessage] = useState('Il tuo ordine apparirà qui automaticamente');
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationData, setCelebrationData] = useState<any>(null);
  const [salePreview, setSalePreview] = useState<any>(null);

  useEffect(() => {
    // Aggiorna l'ora ogni secondo
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Ascolta messaggi dal POS
    const handleMessage = (event: MessageEvent) => {
      console.log('📨 Customer Display ricevuto messaggio:', event.data);

      if (event.data.type === 'TRANSACTION_UPDATE') {
        console.log('✅ Aggiornamento transazione ricevuto:', event.data.transaction);
        setTransaction(event.data.transaction);
      } else if (event.data.type === 'WELCOME') {
        console.log('👋 Messaggio di benvenuto ricevuto:', event.data);
        if (event.data.organizationName) {
          setOrganizationName(event.data.organizationName);
        }
        if (event.data.welcomeMessage) {
          setWelcomeMessage(event.data.welcomeMessage);
        }
      } else if (event.data.type === 'SALE_CELEBRATION') {
        console.log('🎉 Celebrazione vendita ricevuta:', event.data.celebration);
        setCelebrationData(event.data.celebration);
        setShowCelebration(true);
        setSalePreview(null); // Nascondi preview durante celebrazione

        // Termina celebrazione dopo il tempo specificato
        setTimeout(() => {
          setShowCelebration(false);
          setCelebrationData(null);
        }, event.data.celebration.duration || 4000);
      } else if (event.data.type === 'SALE_PREVIEW') {
        console.log('👀 Preview vendita ricevuta:', event.data.preview);
        setSalePreview(event.data.preview);
      } else {
        console.log('❌ Tipo messaggio sconosciuto:', event.data.type);
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      clearInterval(timeInterval);
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  // Funzione per creare pioggia di monete
  const createCoinsRain = () => {
    console.log('🪙 CREAZIONE pioggia monete iniziata...');

    let coinsContainer = document.getElementById('coins-container');
    if (!coinsContainer) {
      console.log('📦 Container monete non trovato, lo creo');
      coinsContainer = document.createElement('div');
      coinsContainer.id = 'coins-container';
      coinsContainer.style.position = 'fixed';
      coinsContainer.style.top = '0';
      coinsContainer.style.left = '0';
      coinsContainer.style.width = '100vw';
      coinsContainer.style.height = '100vh';
      coinsContainer.style.pointerEvents = 'none';
      coinsContainer.style.zIndex = '10000';
      document.body.appendChild(coinsContainer);
    }

    console.log(`🪙 Creando 15 monete animate...`);
    for (let i = 0; i < 15; i++) {
      setTimeout(() => {
        const coin = document.createElement('div');
        coin.className = 'coin';
        coin.style.left = Math.random() * 100 + '%';
        coin.style.animationDelay = Math.random() * 2 + 's';
        coin.style.animationDuration = (3 + Math.random() * 2) + 's';
        coinsContainer!.appendChild(coin);

        console.log(`🪙 Moneta ${i + 1}/15 creata`);

        // Rimuovi la moneta dopo l'animazione
        setTimeout(() => {
          coin.remove();
        }, 5000);
      }, i * 200);
    }

    console.log('✅ Pioggia monete setup completato');
  };

  // Attiva pioggia di monete quando inizia la celebrazione
  React.useEffect(() => {
    console.log('🎯 Customer Display - Effect triggered:', { showCelebration, showCoinsRain: celebrationData?.showCoinsRain });

    if (showCelebration && celebrationData?.showCoinsRain) {
      console.log('🪙 INIZIO pioggia di monete attivata sul customer display');

      // Attiva pioggia di monete (senza suono)
      createCoinsRain();

      console.log('✅ FINE pioggia di monete completata');
    }
  }, [showCelebration, celebrationData]);

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'Inter, sans-serif',
      overflow: 'hidden'
    }}>
      {/* Header - nascosto durante celebrazioni */}
      {!showCelebration && (
        <div style={{
          background: '#1e293b',
          color: 'white',
          padding: '1rem',
          textAlign: 'center'
        }}>
          <img
            src="https://sjvatdnvewohvswfrdiv.supabase.co/storage/v1/object/public/IMG/OMNILYPRO.png"
            alt={organizationName}
            style={{ height: '40px', marginBottom: '0.5rem' }}
          />
          <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>
            {currentTime.toLocaleTimeString('it-IT')}
          </div>
        </div>
      )}

      {/* Content */}
      <div style={{
        flex: 1,
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center'
      }}>
        {transaction.items && transaction.items.length > 0 ? (
          <>
            {/* Items List */}
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '1.5rem',
              marginBottom: '1rem',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              maxHeight: '300px',
              overflowY: 'auto'
            }}>
              <h3 style={{ margin: '0 0 1rem 0', color: '#1f2937', fontSize: '1.2rem' }}>
                I tuoi acquisti:
              </h3>
              {transaction.items.map((item, index) => (
                <div key={index} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.5rem 0',
                  borderBottom: index < transaction.items.length - 1 ? '1px solid #e5e7eb' : 'none'
                }}>
                  <div>
                    <div style={{ fontWeight: '600', color: '#1f2937' }}>{item.name}</div>
                    <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                      Qtà: {item.quantity}
                    </div>
                  </div>
                  <div style={{ fontWeight: '600', color: '#1f2937' }}>
                    €{(item.price * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            {/* Total */}
            <div style={{
              background: '#ef4444',
              color: 'white',
              padding: '1.5rem',
              borderRadius: '12px',
              textAlign: 'center',
              fontSize: '2rem',
              fontWeight: 'bold',
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
            }}>
              TOTALE: €{transaction.total.toFixed(2)}
            </div>

            {/* Customer Info */}
            {transaction.customer && (
              <div style={{
                background: '#10b981',
                color: 'white',
                padding: '1rem',
                borderRadius: '8px',
                marginTop: '1rem',
                textAlign: 'center'
              }}>
                👋 Ciao {transaction.customer.name}!<br />
                <small>Punti fedeltà: {transaction.customer.points}</small>
              </div>
            )}
          </>
        ) : salePreview ? (
          // Sale Preview Screen - Layout ricco e professionale
          <div style={{
            background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
            padding: '2rem',
            borderRadius: '16px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
            border: '1px solid #e2e8f0',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Background Pattern */}
            <div style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '200px',
              height: '200px',
              background: 'linear-gradient(45deg, rgba(239, 68, 68, 0.05), rgba(220, 38, 38, 0.05))',
              borderRadius: '50%',
              transform: 'translate(50%, -50%)'
            }} />

            {/* Customer Header */}
            <div style={{
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 50%, #b91c1c 100%)',
              color: 'white',
              padding: '2rem',
              borderRadius: '12px',
              marginBottom: '2rem',
              position: 'relative',
              textAlign: 'center',
              boxShadow: '0 10px 30px rgba(239, 68, 68, 0.3)'
            }}>
              <div style={{
                position: 'absolute',
                top: '10px',
                right: '15px',
                background: 'rgba(255, 255, 255, 0.2)',
                padding: '0.5rem',
                borderRadius: '50%',
                fontSize: '1.5rem'
              }}>
                ⭐
              </div>

              <h2 style={{
                margin: '0 0 0.5rem 0',
                fontSize: '2.2rem',
                fontWeight: 'bold',
                textShadow: '0 2px 4px rgba(0,0,0,0.3)'
              }}>
                Ciao {salePreview.customerName}! 👋
              </h2>

              <div style={{
                background: 'rgba(255, 255, 255, 0.2)',
                display: 'inline-block',
                padding: '0.5rem 1rem',
                borderRadius: '20px',
                fontSize: '1rem',
                fontWeight: '600',
                marginTop: '0.5rem'
              }}>
                {salePreview.tier} Member
              </div>
            </div>

            {/* Amount Display */}
            {salePreview.amount > 0 ? (
              <div style={{
                background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                color: 'white',
                padding: '2.5rem',
                borderRadius: '16px',
                marginBottom: '2rem',
                textAlign: 'center',
                boxShadow: '0 15px 35px rgba(30, 41, 59, 0.4)',
                border: '2px solid #334155'
              }}>
                <div style={{ fontSize: '0.9rem', opacity: 0.8, marginBottom: '0.5rem' }}>
                  IMPORTO VENDITA
                </div>
                <div style={{
                  fontSize: '4rem',
                  fontWeight: 'bold',
                  marginBottom: '0.5rem',
                  textShadow: '0 4px 8px rgba(0,0,0,0.3)'
                }}>
                  €{salePreview.amount.toFixed(2)}
                </div>
                <div style={{
                  fontSize: '1.1rem',
                  opacity: 0.9,
                  background: 'rgba(34, 197, 94, 0.2)',
                  display: 'inline-block',
                  padding: '0.5rem 1rem',
                  borderRadius: '20px',
                  border: '1px solid rgba(34, 197, 94, 0.3)'
                }}>
                  ⚡ Transazione in corso...
                </div>
              </div>
            ) : (
              <div style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                color: 'white',
                padding: '3rem',
                borderRadius: '16px',
                marginBottom: '2rem',
                textAlign: 'center',
                boxShadow: '0 15px 35px rgba(99, 102, 241, 0.4)'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💰</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '600' }}>
                  In attesa dell'importo...
                </div>
                <div style={{ fontSize: '1rem', opacity: 0.9, marginTop: '0.5rem' }}>
                  L'operatore sta inserendo l'importo della vendita
                </div>
              </div>
            )}

            {/* Points Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: '1.5rem',
              marginBottom: '2rem'
            }}>
              {/* Current Points */}
              <div style={{
                background: 'white',
                padding: '2rem',
                borderRadius: '16px',
                textAlign: 'center',
                boxShadow: '0 8px 25px rgba(0,0,0,0.08)',
                border: '2px solid #f1f5f9',
                position: 'relative'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '-10px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: '#64748b',
                  color: 'white',
                  padding: '0.3rem 0.8rem',
                  borderRadius: '15px',
                  fontSize: '0.7rem',
                  fontWeight: 'bold'
                }}>
                  ATTUALI
                </div>
                <div style={{ fontSize: '2.5rem', marginTop: '0.5rem', marginBottom: '0.5rem' }}>📊</div>
                <div style={{
                  fontSize: '2.2rem',
                  fontWeight: 'bold',
                  color: '#334155',
                  marginBottom: '0.5rem'
                }}>
                  {salePreview.currentPoints}
                </div>
                <div style={{ fontSize: '0.9rem', color: '#64748b' }}>punti fedeltà</div>
              </div>

              {/* Earned Points */}
              <div style={{
                background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
                padding: '2rem',
                borderRadius: '16px',
                textAlign: 'center',
                boxShadow: '0 8px 25px rgba(239, 68, 68, 0.15)',
                border: '2px solid #ef4444',
                position: 'relative',
                transform: 'scale(1.05)'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '-10px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: '#dc2626',
                  color: 'white',
                  padding: '0.3rem 0.8rem',
                  borderRadius: '15px',
                  fontSize: '0.7rem',
                  fontWeight: 'bold',
                  animation: 'pulse 2s infinite'
                }}>
                  GUADAGNI
                </div>
                <div style={{ fontSize: '2.5rem', marginTop: '0.5rem', marginBottom: '0.5rem' }}>🎯</div>
                <div style={{
                  fontSize: '2.8rem',
                  fontWeight: 'bold',
                  color: '#dc2626',
                  marginBottom: '0.5rem'
                }}>
                  +{salePreview.pointsToEarn}
                </div>
                <div style={{ fontSize: '0.9rem', color: '#b91c1c', fontWeight: '600' }}>nuovi punti!</div>
              </div>

              {/* Total Points */}
              <div style={{
                background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                padding: '2rem',
                borderRadius: '16px',
                textAlign: 'center',
                boxShadow: '0 8px 25px rgba(217, 119, 6, 0.15)',
                border: '2px solid #d97706',
                position: 'relative'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '-10px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: '#d97706',
                  color: 'white',
                  padding: '0.3rem 0.8rem',
                  borderRadius: '15px',
                  fontSize: '0.7rem',
                  fontWeight: 'bold'
                }}>
                  TOTALE
                </div>
                <div style={{ fontSize: '2.5rem', marginTop: '0.5rem', marginBottom: '0.5rem' }}>🏆</div>
                <div style={{
                  fontSize: '2.2rem',
                  fontWeight: 'bold',
                  color: '#d97706',
                  marginBottom: '0.5rem'
                }}>
                  {salePreview.newTotalPoints}
                </div>
                <div style={{ fontSize: '0.9rem', color: '#92400e', fontWeight: '600' }}>punti totali</div>
              </div>
            </div>

            {/* Progress Bar Tier */}
            <div style={{
              background: 'white',
              padding: '1.5rem',
              borderRadius: '12px',
              boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
              marginBottom: '1rem'
            }}>
              <div style={{
                fontSize: '0.9rem',
                color: '#6b7280',
                marginBottom: '0.5rem',
                textAlign: 'center'
              }}>
                Progresso verso il prossimo livello
              </div>
              <div style={{
                background: '#f3f4f6',
                height: '10px',
                borderRadius: '5px',
                overflow: 'hidden'
              }}>
                <div style={{
                  background: 'linear-gradient(90deg, #ef4444, #f59e0b)',
                  height: '100%',
                  width: '65%',
                  transition: 'width 0.5s ease'
                }} />
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.8rem',
                color: '#9ca3af',
                marginTop: '0.5rem'
              }}>
                <span>Livello {salePreview.tier}</span>
                <span>65% completato</span>
              </div>
            </div>

          </div>
        ) : (
          // Welcome Screen
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <h2 style={{ color: '#1f2937', marginBottom: '1rem', fontSize: '1.5rem' }}>
              Benvenuto da {organizationName}! 👋
            </h2>
            <p style={{ color: '#6b7280', fontSize: '1.1rem', margin: 0 }}>
              {welcomeMessage}
            </p>
          </div>
        )}
      </div>

      {/* Celebration Overlay */}
      {showCelebration && celebrationData && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          color: 'white',
          textAlign: 'center'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #10b981, #059669)',
            padding: '2rem',
            borderRadius: '16px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
            animation: 'pulse 2s infinite'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
            <h2 style={{ margin: '0 0 1rem 0', fontSize: '2rem' }}>
              Vendita Completata!
            </h2>
            <p style={{ margin: '0 0 1rem 0', fontSize: '1.2rem' }}>
              Grazie {celebrationData.customerName}!
            </p>
            <div style={{
              background: 'rgba(255, 255, 255, 0.2)',
              padding: '1rem',
              borderRadius: '8px',
              marginBottom: '1rem'
            }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                €{celebrationData.amount.toFixed(2)}
              </div>
              <div style={{ fontSize: '1rem', opacity: 0.9 }}>
                +{celebrationData.pointsEarned} punti guadagnati!
              </div>
              <div style={{ fontSize: '1rem', opacity: 0.9 }}>
                Totale punti: {celebrationData.newTotalPoints}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Container per le monete animate */}
      <div id="coins-container" style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 10000
      }} />
    </div>
  );
};

export default CustomerDisplay;