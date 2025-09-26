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
          // Sale Preview Screen - ULTRA SEMPLIFICATO per monitor 4"
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '16px',
            textAlign: 'center',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            {/* Customer Name - Large and Clear */}
            <div style={{
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color: 'white',
              padding: '1.5rem',
              borderRadius: '12px',
              marginBottom: '2rem'
            }}>
              <h2 style={{
                margin: 0,
                fontSize: '2.5rem',
                fontWeight: 'bold'
              }}>
                {salePreview.customerName}
              </h2>
              <div style={{
                fontSize: '1.2rem',
                marginTop: '0.5rem',
                opacity: 0.9
              }}>
                {salePreview.tier} Member
              </div>
            </div>

            {/* Amount - Very Large and Prominent */}
            <div style={{
              background: '#f8fafc',
              padding: '3rem 2rem',
              borderRadius: '16px',
              marginBottom: '2rem',
              border: '3px solid #e2e8f0'
            }}>
              {salePreview.amount > 0 ? (
                <>
                  <div style={{
                    fontSize: '1.2rem',
                    color: '#64748b',
                    marginBottom: '1rem'
                  }}>
                    IMPORTO
                  </div>
                  <div style={{
                    fontSize: '5rem',
                    fontWeight: 'bold',
                    color: '#1e293b',
                    lineHeight: 1
                  }}>
                    €{salePreview.amount.toFixed(2)}
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>💰</div>
                  <div style={{
                    fontSize: '1.8rem',
                    color: '#64748b',
                    fontWeight: '600'
                  }}>
                    In attesa dell'importo...
                  </div>
                </>
              )}
            </div>

            {/* Points - Simple Two Column Layout */}
            {salePreview.amount > 0 && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1.5rem'
              }}>
                {/* Points to Earn */}
                <div style={{
                  background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                  color: 'white',
                  padding: '2rem',
                  borderRadius: '12px',
                  textAlign: 'center'
                }}>
                  <div style={{
                    fontSize: '1rem',
                    marginBottom: '0.5rem',
                    opacity: 0.9
                  }}>
                    GUADAGNI
                  </div>
                  <div style={{
                    fontSize: '3rem',
                    fontWeight: 'bold'
                  }}>
                    +{salePreview.pointsToEarn}
                  </div>
                  <div style={{
                    fontSize: '1rem',
                    marginTop: '0.5rem',
                    opacity: 0.9
                  }}>
                    punti
                  </div>
                </div>

                {/* Total Points */}
                <div style={{
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  color: 'white',
                  padding: '2rem',
                  borderRadius: '12px',
                  textAlign: 'center'
                }}>
                  <div style={{
                    fontSize: '1rem',
                    marginBottom: '0.5rem',
                    opacity: 0.9
                  }}>
                    TOTALE
                  </div>
                  <div style={{
                    fontSize: '3rem',
                    fontWeight: 'bold'
                  }}>
                    {salePreview.newTotalPoints}
                  </div>
                  <div style={{
                    fontSize: '1rem',
                    marginTop: '0.5rem',
                    opacity: 0.9
                  }}>
                    punti
                  </div>
                </div>
              </div>
            )}
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