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
  const [organizationLogo, setOrganizationLogo] = useState<string | null>(null);
  const [welcomeMessage, setWelcomeMessage] = useState('Il tuo ordine apparirà qui automaticamente');
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationData, setCelebrationData] = useState<any>(null);
  const [salePreview, setSalePreview] = useState<any>(null);
  const [saleProcessing, setSaleProcessing] = useState<any>(null);
  const [giftCertificate, setGiftCertificate] = useState<any>(null);

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
        if (event.data.logoUrl) {
          setOrganizationLogo(event.data.logoUrl);
        }
        if (event.data.welcomeMessage) {
          setWelcomeMessage(event.data.welcomeMessage);
        }
      } else if (event.data.type === 'SALE_CELEBRATION') {
        console.log('🎉 Celebrazione vendita ricevuta:', event.data.celebration);
        setCelebrationData(event.data.celebration);
        setShowCelebration(true);
        setSalePreview(null); // Nascondi preview durante celebrazione
        setSaleProcessing(null); // Nascondi processing durante celebrazione

        // Termina celebrazione dopo il tempo specificato
        setTimeout(() => {
          setShowCelebration(false);
          setCelebrationData(null);
        }, event.data.celebration.duration || 4000);
      } else if (event.data.type === 'SALE_PREVIEW') {
        console.log('👀 Preview vendita ricevuta:', event.data.preview);
        setSalePreview(event.data.preview);
        setSaleProcessing(null); // Reset processing se torniamo al preview
      } else if (event.data.type === 'SALE_PROCESSING') {
        console.log('🔄 Elaborazione transazione ricevuta:', event.data.processing);
        setSaleProcessing(event.data.processing);
        setSalePreview(null); // Nascondi preview durante elaborazione
      } else if (event.data.type === 'GIFT_CERTIFICATE_VALIDATED') {
        console.log('🎁 Gift Certificate validato ricevuto:', event.data.giftCertificate);
        setGiftCertificate({ ...event.data.giftCertificate, isValidation: true });
        setSalePreview(null);
        setSaleProcessing(null);
        setShowCelebration(false);

        // Nascondi dopo 8 secondi
        setTimeout(() => {
          setGiftCertificate(null);
        }, 8000);
      } else if (event.data.type === 'GIFT_CERTIFICATE_REDEEMED') {
        console.log('💰 Gift Certificate riscattato ricevuto:', event.data.redemption);
        setGiftCertificate({ ...event.data.redemption, isRedemption: true });
        setSalePreview(null);
        setSaleProcessing(null);
        setShowCelebration(false);

        // Nascondi dopo 6 secondi
        setTimeout(() => {
          setGiftCertificate(null);
        }, 6000);
      } else if (event.data.type === 'GIFT_CERTIFICATE_ISSUED') {
        console.log('🎟️ Gift Certificate emesso ricevuto:', event.data.issuance);
        setGiftCertificate({ ...event.data.issuance, isIssuance: true });
        setSalePreview(null);
        setSaleProcessing(null);
        setShowCelebration(false);

        // Nascondi dopo 7 secondi
        setTimeout(() => {
          setGiftCertificate(null);
        }, 7000);
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

    // Riproduci suono pioggia monete con diagnostica avanzata
    console.log('🎵 Tentativo riproduzione coinrain.mp3...');
    try {
      const audio = new Audio('/sounds/coinrain.mp3');
      audio.volume = 0.6; // Volume moderato

      // Log eventi audio per debug
      audio.addEventListener('loadstart', () => console.log('📥 Audio: Inizio caricamento'));
      audio.addEventListener('canplay', () => console.log('✅ Audio: Pronto per riproduzione'));
      audio.addEventListener('play', () => console.log('▶️ Audio: Riproduzione iniziata'));
      audio.addEventListener('ended', () => console.log('⏹️ Audio: Riproduzione terminata'));
      audio.addEventListener('error', (e) => console.error('❌ Audio Error:', e));

      audio.play().then(() => {
        console.log('🔊 Suono coinrain.mp3 riprodotto con successo!');
      }).catch((error) => {
        console.error('⚠️ Autoplay bloccato dal browser:', error.message);
        console.log('💡 Suggerimento: Il browser richiede interazione utente per audio');

        // Tentativo alternativo con user gesture
        document.addEventListener('click', () => {
          audio.play().then(() => {
            console.log('🔊 Audio riprodotto dopo click utente');
          }).catch(e => console.error('❌ Anche con click non funziona:', e));
        }, { once: true });
      });
    } catch (error) {
      console.error('⚠️ Errore critico caricamento coinrain.mp3:', error);
    }

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
        coin.style.animationDuration = (1.5 + Math.random() * 1) + 's';
        coinsContainer!.appendChild(coin);

        console.log(`🪙 Moneta ${i + 1}/15 creata`);

        // Rimuovi la moneta dopo l'animazione più veloce
        setTimeout(() => {
          coin.remove();
        }, 3000);
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
      {/* Header - nascosto durante transazioni per ottimizzare spazio */}
      {!showCelebration && !salePreview && !saleProcessing && (
        <div style={{
          background: '#1e293b',
          color: 'white',
          padding: '1rem',
          textAlign: 'center'
        }}>
          <img
            src={organizationLogo || "https://sjvatdnvewohvswfrdiv.supabase.co/storage/v1/object/public/IMG/OMNILYPRO.png"}
            alt={organizationName}
            style={{ height: '60px', marginBottom: '0.5rem', objectFit: 'contain' }}
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
        ) : saleProcessing ? (
          // Sale Processing Screen - COMPATTA per 4"
          <div style={{
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            color: 'white',
            padding: '1.5rem',
            borderRadius: '12px',
            textAlign: 'center',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: '1rem'
          }}>
            {/* Spinner piccolo */}
            <div style={{
              width: '40px',
              height: '40px',
              border: '4px solid rgba(255, 255, 255, 0.3)',
              borderTop: '4px solid white',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto'
            }} />

            {/* Nome cliente compatto */}
            <h2 style={{
              margin: 0,
              fontSize: '1.8rem',
              fontWeight: 'bold'
            }}>
              {saleProcessing.customerName}
            </h2>

            {/* Importo grande */}
            <div style={{
              fontSize: '3rem',
              fontWeight: 'bold',
              lineHeight: 1
            }}>
              €{saleProcessing.amount.toFixed(2)}
            </div>

            {/* Punti compatti */}
            <div style={{
              fontSize: '1.2rem',
              opacity: 0.9
            }}>
              +{saleProcessing.pointsToEarn} punti
            </div>

            {/* Messaggio elaborazione */}
            <div style={{
              fontSize: '1rem',
              opacity: 0.8,
              animation: 'pulse 2s infinite'
            }}>
              Elaborazione...
            </div>

            <style dangerouslySetInnerHTML={{
              __html: `
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
                @keyframes pulse {
                  0%, 100% { opacity: 0.6; }
                  50% { opacity: 1; }
                }
              `
            }} />
          </div>
        ) : salePreview ? (
          // Sale Preview Screen - COMPATTA per 4"
          <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '12px',
            textAlign: 'center',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: '1rem'
          }}>
            {/* Customer Name - Compatto */}
            <div style={{
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color: 'white',
              padding: '1rem',
              borderRadius: '8px'
            }}>
              <h2 style={{
                margin: 0,
                fontSize: '1.6rem',
                fontWeight: 'bold'
              }}>
                {salePreview.customerName}
              </h2>
            </div>

            {/* Amount - Compatto */}
            {salePreview.amount > 0 ? (
              <div style={{
                background: '#f8fafc',
                padding: '1.5rem',
                borderRadius: '8px',
                border: '2px solid #e2e8f0'
              }}>
                <div style={{
                  fontSize: '3.5rem',
                  fontWeight: 'bold',
                  color: '#1e293b',
                  lineHeight: 1
                }}>
                  €{salePreview.amount.toFixed(2)}
                </div>
              </div>
            ) : (
              <div style={{
                background: '#f8fafc',
                padding: '2rem',
                borderRadius: '8px'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💰</div>
                <div style={{
                  fontSize: '1.2rem',
                  color: '#64748b'
                }}>
                  In attesa...
                </div>
              </div>
            )}

            {/* Points - Una riga compatta */}
            {salePreview.amount > 0 && (
              <div style={{
                display: 'flex',
                gap: '1rem',
                justifyContent: 'center'
              }}>
                {/* Points to Earn */}
                <div style={{
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  color: 'white',
                  padding: '1rem',
                  borderRadius: '8px',
                  textAlign: 'center',
                  flex: 1
                }}>
                  <div style={{
                    fontSize: '1.8rem',
                    fontWeight: 'bold'
                  }}>
                    +{salePreview.pointsToEarn}
                  </div>
                  <div style={{
                    fontSize: '0.8rem',
                    opacity: 0.9
                  }}>
                    guadagni
                  </div>
                </div>

                {/* Total Points */}
                <div style={{
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  color: 'white',
                  padding: '1rem',
                  borderRadius: '8px',
                  textAlign: 'center',
                  flex: 1
                }}>
                  <div style={{
                    fontSize: '1.8rem',
                    fontWeight: 'bold'
                  }}>
                    {salePreview.newTotalPoints}
                  </div>
                  <div style={{
                    fontSize: '0.8rem',
                    opacity: 0.9
                  }}>
                    totali
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : giftCertificate ? (
          // Gift Certificate Display - COMPATTA per 4"
          <div style={{
            background: giftCertificate.isRedemption
              ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' // Blu per riscatto
              : giftCertificate.isIssuance
              ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' // Arancione per emissione
              : 'linear-gradient(135deg, #10b981 0%, #059669 100%)', // Verde per validazione
            color: 'white',
            padding: '1.5rem',
            borderRadius: '12px',
            textAlign: 'center',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: '1rem'
          }}>
            {/* Icona Gift Certificate */}
            <div style={{
              fontSize: '3rem'
            }}>
              {giftCertificate.isRedemption ? '💰' : giftCertificate.isIssuance ? '🎟️' : '🎁'}
            </div>

            {/* Titolo */}
            <h2 style={{
              margin: 0,
              fontSize: '1.8rem',
              fontWeight: 'bold'
            }}>
              {giftCertificate.isRedemption ? 'Riscatto Completato!' : giftCertificate.isIssuance ? 'Gift Certificate Emesso!' : 'Gift Certificate Valido!'}
            </h2>

            {/* Codice */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.2)',
              padding: '1rem',
              borderRadius: '8px',
              fontSize: '1.5rem',
              fontWeight: 'bold',
              letterSpacing: '2px'
            }}>
              {giftCertificate.code}
            </div>

            {/* Display diverso per validazione vs riscatto vs emissione */}
            {giftCertificate.isRedemption ? (
              // Visualizzazione RISCATTO
              <>
                {/* Importo Riscattato */}
                <div style={{
                  background: 'white',
                  color: '#3b82f6',
                  padding: '1.5rem',
                  borderRadius: '12px',
                  marginTop: '0.5rem'
                }}>
                  <div style={{
                    fontSize: '1rem',
                    marginBottom: '0.5rem',
                    opacity: 0.8
                  }}>
                    Importo Riscattato
                  </div>
                  <div style={{
                    fontSize: '3.5rem',
                    fontWeight: 'bold',
                    lineHeight: 1
                  }}>
                    €{giftCertificate.amountRedeemed.toFixed(2)}
                  </div>
                </div>

                {/* Saldo Rimanente */}
                <div style={{
                  fontSize: '1.2rem',
                  opacity: 0.9,
                  marginTop: '0.5rem'
                }}>
                  Saldo rimanente: <strong>€{giftCertificate.balanceAfter.toFixed(2)}</strong>
                </div>

                {/* Messaggio */}
                <div style={{
                  fontSize: '1rem',
                  opacity: 0.8
                }}>
                  ✅ Transazione completata
                </div>
              </>
            ) : giftCertificate.isIssuance ? (
              // Visualizzazione EMISSIONE
              <>
                {/* Importo Gift Certificate */}
                <div style={{
                  background: 'white',
                  color: '#f59e0b',
                  padding: '1.5rem',
                  borderRadius: '12px',
                  marginTop: '0.5rem'
                }}>
                  <div style={{
                    fontSize: '1rem',
                    marginBottom: '0.5rem',
                    opacity: 0.8
                  }}>
                    Valore Gift Certificate
                  </div>
                  <div style={{
                    fontSize: '3.5rem',
                    fontWeight: 'bold',
                    lineHeight: 1
                  }}>
                    €{giftCertificate.amount.toFixed(2)}
                  </div>
                </div>

                {/* Recipient (se presente) */}
                {giftCertificate.recipientName && (
                  <div style={{
                    fontSize: '1.2rem',
                    opacity: 0.9,
                    marginTop: '0.5rem'
                  }}>
                    Per: <strong>{giftCertificate.recipientName}</strong>
                  </div>
                )}

                {/* Messaggio */}
                <div style={{
                  fontSize: '1rem',
                  opacity: 0.8
                }}>
                  🎉 Gift Certificate emesso con successo!
                </div>
              </>
            ) : (
              // Visualizzazione VALIDAZIONE
              <>
                {/* Saldo Disponibile - GRANDE */}
                <div style={{
                  background: 'white',
                  color: '#10b981',
                  padding: '1.5rem',
                  borderRadius: '12px',
                  marginTop: '0.5rem'
                }}>
                  <div style={{
                    fontSize: '1rem',
                    marginBottom: '0.5rem',
                    opacity: 0.8
                  }}>
                    Saldo Disponibile
                  </div>
                  <div style={{
                    fontSize: '3.5rem',
                    fontWeight: 'bold',
                    lineHeight: 1
                  }}>
                    €{giftCertificate.balance.toFixed(2)}
                  </div>
                </div>

                {/* Recipient (se presente) */}
                {giftCertificate.recipientName && (
                  <div style={{
                    fontSize: '1.2rem',
                    opacity: 0.9
                  }}>
                    Per: {giftCertificate.recipientName}
                  </div>
                )}

                {/* Messaggio */}
                <div style={{
                  fontSize: '1rem',
                  opacity: 0.8,
                  animation: 'pulse 2s infinite'
                }}>
                  ✅ Pronto per essere utilizzato
                </div>
              </>
            )}

            <style dangerouslySetInnerHTML={{
              __html: `
                @keyframes pulse {
                  0%, 100% { opacity: 0.6; }
                  50% { opacity: 1; }
                }
              `
            }} />
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

      {/* Celebration Screen - BRAND ROSSO COMPATTA per 4" */}
      {showCelebration && celebrationData && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 50%, #b91c1c 100%)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          color: 'white',
          textAlign: 'center',
          padding: '1.5rem',
          gap: '1rem'
        }}>

          {/* Icona successo compatta */}
          <div style={{
            fontSize: '3rem',
            animation: 'bounce 1s ease-in-out'
          }}>
            ✅
          </div>

          {/* Nome cliente compatto */}
          <h1 style={{
            margin: 0,
            fontSize: '2rem',
            fontWeight: 'bold',
            textShadow: '0 2px 4px rgba(0,0,0,0.3)'
          }}>
            Grazie {celebrationData.customerName}!
          </h1>

          {/* Informazioni transazione compatte */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.15)',
            padding: '1.5rem',
            borderRadius: '12px',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            width: '100%',
            maxWidth: '300px'
          }}>
            <div style={{
              fontSize: '3rem',
              fontWeight: 'bold',
              marginBottom: '0.5rem',
              lineHeight: 1
            }}>
              €{celebrationData.amount.toFixed(2)}
            </div>
            <div style={{
              fontSize: '1.2rem',
              marginBottom: '0.5rem',
              opacity: 0.95
            }}>
              +{celebrationData.pointsEarned} punti!
            </div>
            <div style={{
              fontSize: '1rem',
              opacity: 0.8
            }}>
              Totale: {celebrationData.newTotalPoints} punti
            </div>
          </div>

          {/* Messaggio finale compatto */}
          <div style={{
            fontSize: '1.2rem',
            opacity: 0.9,
            animation: 'pulse 2s infinite'
          }}>
            Vendita completata! 🎉
          </div>

          {/* Stili per le animazioni */}
          <style dangerouslySetInnerHTML={{
            __html: `
              @keyframes bounce {
                0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
                40% { transform: translateY(-10px); }
                60% { transform: translateY(-5px); }
              }
              @keyframes pulse {
                0%, 100% { opacity: 0.7; }
                50% { opacity: 1; }
              }
            `
          }} />
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