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
    const coinsContainer = document.getElementById('coins-container');
    if (!coinsContainer) return;

    for (let i = 0; i < 15; i++) {
      setTimeout(() => {
        const coin = document.createElement('div');
        coin.className = 'coin';
        coin.style.left = Math.random() * 100 + '%';
        coin.style.animationDelay = Math.random() * 2 + 's';
        coin.style.animationDuration = (3 + Math.random() * 2) + 's';
        coinsContainer.appendChild(coin);

        // Rimuovi la moneta dopo l'animazione
        setTimeout(() => {
          coin.remove();
        }, 5000);
      }, i * 200);
    }
  };

  // Funzione per riprodurre suono coin.wav
  const playCoinSound = () => {
    try {
      const audio = new Audio('/sounds/coin.wav');
      audio.volume = 0.7; // Volume al 70%
      audio.play().catch(error => {
        console.error('Errore riproduzione suono coin.wav:', error);
      });
    } catch (error) {
      console.error('Errore caricamento suono coin.wav:', error);
    }
  };

  // Attiva pioggia di monete e suono quando inizia la celebrazione
  React.useEffect(() => {
    if (showCelebration && celebrationData?.showCoinsRain) {
      // Riproduce suono delle monete
      playCoinSound();

      // Attiva pioggia di monete
      createCoinsRain();

      console.log('🔊 Suono coin.wav riprodotto durante celebrazione');
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
      {/* Header */}
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
          // Sale Preview Screen
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <div style={{
              background: '#3b82f6',
              color: 'white',
              padding: '1rem',
              borderRadius: '8px',
              marginBottom: '1.5rem'
            }}>
              <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem' }}>
                👋 Ciao {salePreview.customerName}!
              </h2>
              <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>
                {salePreview.tier} Member
              </div>
            </div>

            {salePreview.amount > 0 && (
              <div style={{
                background: '#f8fafc',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                padding: '1.5rem',
                marginBottom: '1rem'
              }}>
                <div style={{
                  fontSize: '2.5rem',
                  fontWeight: 'bold',
                  color: '#1f2937',
                  marginBottom: '0.5rem'
                }}>
                  €{salePreview.amount.toFixed(2)}
                </div>
                <div style={{ color: '#6b7280', fontSize: '1rem' }}>
                  Importo vendita
                </div>
              </div>
            )}

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: '1rem',
              marginBottom: '1rem'
            }}>
              <div style={{
                background: '#f3f4f6',
                padding: '1rem',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#374151' }}>
                  {salePreview.currentPoints}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Punti attuali</div>
              </div>

              <div style={{
                background: '#dcfce7',
                padding: '1rem',
                borderRadius: '8px',
                textAlign: 'center',
                border: '2px solid #16a34a'
              }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#16a34a' }}>
                  +{salePreview.pointsToEarn}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#15803d' }}>Punti guadagnati</div>
              </div>

              <div style={{
                background: '#fef3c7',
                padding: '1rem',
                borderRadius: '8px',
                textAlign: 'center',
                border: '2px solid #d97706'
              }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#d97706' }}>
                  {salePreview.newTotalPoints}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#92400e' }}>Nuovo totale</div>
              </div>
            </div>

            {salePreview.amount === 0 && (
              <p style={{ color: '#6b7280', fontSize: '1rem', fontStyle: 'italic' }}>
                Inserisci l'importo della vendita...
              </p>
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