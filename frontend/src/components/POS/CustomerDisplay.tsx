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
  const [tierUpgrade, setTierUpgrade] = useState<any>(null);

  // Ref per evitare click multipli
  const celebrationClickedRef = React.useRef(false);
  const tierUpgradeClickedRef = React.useRef(false);

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
        celebrationClickedRef.current = false; // RESET ref quando si apre celebrazione
        setSalePreview(null); // Nascondi preview durante celebrazione
        setSaleProcessing(null); // Nascondi processing durante celebrazione
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
      } else if (event.data.type === 'TIER_UPGRADE') {
        console.log('👑 Tier Upgrade ricevuto:', event.data.tierUpgrade);
        setTierUpgrade(event.data.tierUpgrade);
        tierUpgradeClickedRef.current = false; // RESET ref quando si apre
        setSalePreview(null);
        setSaleProcessing(null);
        setShowCelebration(false);
        setGiftCertificate(null);
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
    console.log('[CoinsRain] Pioggia monete iniziata - SENZA AUDIO');

    // Cerca o crea container monete
    let coinsContainer = document.getElementById('coins-container');
    if (!coinsContainer) {
      console.log('[CoinsRain] Creazione container monete');
      coinsContainer = document.createElement('div');
      coinsContainer.id = 'coins-container';
      coinsContainer.style.position = 'fixed';
      coinsContainer.style.top = '0';
      coinsContainer.style.left = '0';
      coinsContainer.style.width = '100vw';
      coinsContainer.style.height = '100vh';
      coinsContainer.style.pointerEvents = 'none'; // IMPORTANTE: non intercetta click
      coinsContainer.style.zIndex = '99998'; // Sotto la celebrazione
      document.body.appendChild(coinsContainer);
    } else {
      // Pulisci monete precedenti se esistono
      coinsContainer.innerHTML = '';
      console.log('[CoinsRain] Pulizia monete precedenti');
    }

    console.log('[CoinsRain] Creando 15 monete animate');
    for (let i = 0; i < 15; i++) {
      setTimeout(() => {
        if (!coinsContainer) return; // Safety check

        const coin = document.createElement('div');
        coin.className = 'coin';
        coin.style.left = Math.random() * 100 + '%';
        coin.style.animationDelay = Math.random() * 0.5 + 's';
        coin.style.animationDuration = (2 + Math.random() * 1) + 's';
        coinsContainer!.appendChild(coin);

        // Rimuovi la moneta dopo l'animazione
        setTimeout(() => {
          if (coin && coin.parentNode) {
            coin.remove();
          }
        }, 3500);
      }, i * 150);
    }

    console.log('[CoinsRain] Setup completato');
  };

  // Suono pioggia monete tipo slot machine - DA FILE AUDIO
  const playSlotMachineSound = () => {
    try {
      console.log('🎰 Riproduzione suono slot machine da file audio...');
      const audio = new Audio('/sounds/slot-machine-coin-payout-1-188227.mp3');
      audio.volume = 0.9; // Volume al 90%
      audio.play()
        .then(() => console.log('✅ Suono slot machine riprodotto da file!'))
        .catch(err => console.error('❌ Errore riproduzione audio:', err));
    } catch (error) {
      console.error('❌ Errore suono slot machine:', error);
    }
  };

  // Attiva pioggia di monete quando inizia la celebrazione
  React.useEffect(() => {
    console.log('🎯 Customer Display - Effect triggered:', { showCelebration, celebrationData });

    if (showCelebration && celebrationData) {
      console.log('🪙 INIZIO pioggia di monete attivata sul customer display');

      // Attiva pioggia di monete SEMPRE durante celebrazione
      createCoinsRain();

      // Suono slot machine
      playSlotMachineSound();

      // AUTO-CHIUSURA dopo 3 secondi
      const autoCloseTimer = setTimeout(() => {
        console.log('⏰ Auto-chiusura celebrazione dopo 3 secondi');
        setShowCelebration(false);
        setCelebrationData(null);
      }, 3000);

      console.log('✅ FINE pioggia di monete completata');

      return () => clearTimeout(autoCloseTimer);
    }
  }, [showCelebration, celebrationData]);

  // Auto-chiusura tier upgrade dopo 4 secondi
  React.useEffect(() => {
    if (tierUpgrade) {
      console.log('👑 Tier Upgrade mostrato - auto-chiusura dopo 4 secondi');

      const autoCloseTierTimer = setTimeout(() => {
        console.log('⏰ Auto-chiusura tier upgrade dopo 4 secondi');
        setTierUpgrade(null);
      }, 4000);

      return () => clearTimeout(autoCloseTierTimer);
    }
  }, [tierUpgrade]);

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
      {!showCelebration && !salePreview && !saleProcessing && !tierUpgrade && (
        <div style={{
          background: '#1e293b',
          color: 'white',
          padding: '0.5rem',
          textAlign: 'center'
        }}>
          <img
            src={organizationLogo || "https://sjvatdnvewohvswfrdiv.supabase.co/storage/v1/object/public/IMG/OMNILYPRO.png"}
            alt={organizationName}
            style={{ height: '40px', marginBottom: '0.25rem', objectFit: 'contain' }}
          />
          <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>
            {currentTime.toLocaleTimeString('it-IT')}
          </div>
        </div>
      )}

      {/* Content */}
      <div style={{
        flex: 1,
        padding: '0.75rem',
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
          // Gift Certificate Display - MINI per 4"
          <div style={{
            background: giftCertificate.isRedemption
              ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' // Blu per riscatto
              : giftCertificate.isIssuance
              ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' // Arancione per emissione
              : 'linear-gradient(135deg, #10b981 0%, #059669 100%)', // Verde per validazione
            color: 'white',
            padding: '0.5rem',
            borderRadius: '6px',
            textAlign: 'center',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: '0.3rem'
          }}>
            {/* Icona Gift Certificate - MINI */}
            <div style={{
              fontSize: '1.5rem'
            }}>
              {giftCertificate.isRedemption ? '💰' : giftCertificate.isIssuance ? '🎟️' : '🎁'}
            </div>

            {/* Titolo - MINI */}
            <h2 style={{
              margin: 0,
              fontSize: '0.9rem',
              fontWeight: 'bold',
              lineHeight: 1.1
            }}>
              {giftCertificate.isRedemption ? 'Riscatto' : giftCertificate.isIssuance ? 'Emesso' : 'Gift Certificate'}
            </h2>

            {/* Codice - MINI */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.2)',
              padding: '0.3rem',
              borderRadius: '4px',
              fontSize: '0.75rem',
              fontWeight: 'bold',
              letterSpacing: '0.5px'
            }}>
              {giftCertificate.code}
            </div>

            {/* Display diverso per validazione vs riscatto vs emissione - MINI */}
            {giftCertificate.isRedemption ? (
              // Visualizzazione RISCATTO - MINI
              <>
                {/* Importo Riscattato - MINI */}
                <div style={{
                  background: 'white',
                  color: '#3b82f6',
                  padding: '0.4rem',
                  borderRadius: '6px',
                  marginTop: '0.2rem'
                }}>
                  <div style={{
                    fontSize: '0.65rem',
                    marginBottom: '0.2rem',
                    opacity: 0.8
                  }}>
                    Riscattato
                  </div>
                  <div style={{
                    fontSize: '1.4rem',
                    fontWeight: 'bold',
                    lineHeight: 1
                  }}>
                    €{giftCertificate.amountRedeemed.toFixed(2)}
                  </div>
                </div>

                {/* Saldo Rimanente - MINI */}
                <div style={{
                  fontSize: '0.7rem',
                  opacity: 0.9
                }}>
                  Residuo: <strong>€{giftCertificate.balanceAfter.toFixed(2)}</strong>
                </div>
              </>
            ) : giftCertificate.isIssuance ? (
              // Visualizzazione EMISSIONE - MINI
              <>
                {/* Importo Gift Certificate - MINI */}
                <div style={{
                  background: 'white',
                  color: '#f59e0b',
                  padding: '0.4rem',
                  borderRadius: '6px',
                  marginTop: '0.2rem'
                }}>
                  <div style={{
                    fontSize: '0.65rem',
                    marginBottom: '0.2rem',
                    opacity: 0.8
                  }}>
                    Valore
                  </div>
                  <div style={{
                    fontSize: '1.4rem',
                    fontWeight: 'bold',
                    lineHeight: 1
                  }}>
                    €{giftCertificate.amount.toFixed(2)}
                  </div>
                </div>

                {/* Recipient (se presente) - MINI */}
                {giftCertificate.recipientName && (
                  <div style={{
                    fontSize: '0.7rem',
                    opacity: 0.9
                  }}>
                    Per: <strong>{giftCertificate.recipientName}</strong>
                  </div>
                )}
              </>
            ) : (
              // Visualizzazione VALIDAZIONE - MINI
              <>
                {/* Saldo Disponibile - MINI */}
                <div style={{
                  background: 'white',
                  color: '#10b981',
                  padding: '0.4rem',
                  borderRadius: '6px',
                  marginTop: '0.2rem'
                }}>
                  <div style={{
                    fontSize: '0.65rem',
                    marginBottom: '0.2rem',
                    opacity: 0.8
                  }}>
                    Saldo
                  </div>
                  <div style={{
                    fontSize: '1.4rem',
                    fontWeight: 'bold',
                    lineHeight: 1
                  }}>
                    €{giftCertificate.balance.toFixed(2)}
                  </div>
                </div>

                {/* Recipient (se presente) - MINI */}
                {giftCertificate.recipientName && (
                  <div style={{
                    fontSize: '0.7rem',
                    opacity: 0.9
                  }}>
                    {giftCertificate.recipientName}
                  </div>
                )}
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
          // Welcome Screen - BRAND ROSSO per 4"
          <div style={{
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            padding: '1rem',
            borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(239, 68, 68, 0.3)',
            textAlign: 'center',
            color: 'white',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Decorative circles */}
            <div style={{
              position: 'absolute',
              top: '-50px',
              right: '-50px',
              width: '150px',
              height: '150px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '50%'
            }} />
            <div style={{
              position: 'absolute',
              bottom: '-30px',
              left: '-30px',
              width: '100px',
              height: '100px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '50%'
            }} />

            {/* Content */}
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{
                fontSize: '3rem',
                marginBottom: '0.5rem',
                animation: 'wave 2s ease-in-out infinite'
              }}>
                👋
              </div>

              <h2 style={{
                margin: '0 0 0.75rem 0',
                fontSize: '1.5rem',
                fontWeight: 'bold',
                textShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}>
                Benvenuto!
              </h2>

              <div style={{
                background: 'rgba(255, 255, 255, 0.2)',
                padding: '1rem',
                borderRadius: '8px',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                marginBottom: '0.75rem'
              }}>
                <div style={{
                  fontSize: '1.3rem',
                  fontWeight: 'bold',
                  marginBottom: '0.25rem'
                }}>
                  {organizationName}
                </div>
              </div>

              <p style={{
                fontSize: '0.95rem',
                margin: 0,
                opacity: 0.95,
                lineHeight: 1.4
              }}>
                {welcomeMessage}
              </p>
            </div>

            <style dangerouslySetInnerHTML={{
              __html: `
                @keyframes wave {
                  0%, 100% { transform: rotate(0deg); }
                  25% { transform: rotate(20deg); }
                  75% { transform: rotate(-20deg); }
                }
              `
            }} />
          </div>
        )}
      </div>

      {/* Celebration Screen - BRAND ROSSO ULTRA-COMPATTA per 4" - AUTO-CHIUSURA 3 SEC */}
      {showCelebration && celebrationData && (
        <div
          style={{
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
            zIndex: 99999, // MASSIMO! Sopra TUTTO
            color: 'white',
            textAlign: 'center',
            padding: '0.75rem',
            gap: '0.5rem'
          }}
        >

          {/* Icona successo ULTRA-COMPATTA per 4" */}
          <div style={{
            fontSize: '2rem',
            animation: 'bounce 1s ease-in-out'
          }}>
            ✅
          </div>

          {/* Nome cliente ULTRA-COMPATTO per 4" */}
          <h1 style={{
            margin: 0,
            fontSize: '1.4rem',
            fontWeight: 'bold',
            textShadow: '0 2px 4px rgba(0,0,0,0.3)',
            lineHeight: 1.2
          }}>
            Grazie {celebrationData.customerName}!
          </h1>

          {/* Informazioni transazione ULTRA-COMPATTE per 4" */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.15)',
            padding: '0.75rem',
            borderRadius: '8px',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            width: '100%',
            maxWidth: '280px'
          }}>
            <div style={{
              fontSize: '2.2rem',
              fontWeight: 'bold',
              marginBottom: '0.3rem',
              lineHeight: 1
            }}>
              €{celebrationData.amount.toFixed(2)}
            </div>
            <div style={{
              fontSize: '1rem',
              marginBottom: '0.2rem',
              opacity: 0.95
            }}>
              +{celebrationData.pointsEarned} punti!
            </div>
            <div style={{
              fontSize: '0.85rem',
              opacity: 0.8
            }}>
              Totale: {celebrationData.newTotalPoints} punti
            </div>
          </div>

          {/* Messaggio finale ULTRA-COMPATTO per 4" */}
          <div style={{
            fontSize: '1rem',
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

      {/* Tier Upgrade Celebration - ULTRA-COMPATTA per 4" - AUTO-CHIUSURA 4 SEC */}
      {tierUpgrade && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: `linear-gradient(135deg, ${tierUpgrade.newTierColor || '#F59E0B'} 0%, ${tierUpgrade.newTierColor || '#F59E0B'}dd 50%, ${tierUpgrade.newTierColor || '#F59E0B'}aa 100%)`,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 99999,
            color: 'white',
            textAlign: 'center',
            padding: '1rem',
            gap: '0.75rem'
          }}
        >
          {/* Icona tier - COMPATTA */}
          <div style={{
            fontSize: '3rem',
            animation: 'bounce 1.5s ease-in-out infinite'
          }}>
            {tierUpgrade.newTierName === 'Platinum' && '👑'}
            {tierUpgrade.newTierName === 'Gold' && '⭐'}
            {tierUpgrade.newTierName === 'Silver' && '✨'}
            {tierUpgrade.newTierName === 'Bronze' && '🥉'}
          </div>

          {/* Titolo COMPATTO */}
          <h1 style={{
            margin: 0,
            fontSize: '1.6rem',
            fontWeight: 'bold',
            textShadow: '0 2px 4px rgba(0,0,0,0.3)',
            lineHeight: 1.2
          }}>
            Congratulazioni!
          </h1>

          {/* Nome cliente COMPATTO */}
          <div style={{
            fontSize: '1.2rem',
            fontWeight: '600',
            opacity: 0.95
          }}>
            {tierUpgrade.customerName}
          </div>

          {/* Tier change card - COMPATTA */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.2)',
            padding: '1rem',
            borderRadius: '12px',
            backdropFilter: 'blur(10px)',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            width: '100%',
            maxWidth: '300px'
          }}>
            {/* Old tier - COMPATTO */}
            <div style={{
              fontSize: '0.9rem',
              opacity: 0.8,
              marginBottom: '0.5rem'
            }}>
              {tierUpgrade.oldTierName}
            </div>

            {/* Arrow - COMPATTO */}
            <div style={{
              fontSize: '1.5rem',
              margin: '0.25rem 0'
            }}>
              ⬇️
            </div>

            {/* New tier - COMPATTO */}
            <div style={{
              fontSize: '1.8rem',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              marginTop: '0.5rem'
            }}>
              {tierUpgrade.newTierName}
            </div>

            {/* Multiplier badge se presente - COMPATTO */}
            {tierUpgrade.multiplier && tierUpgrade.multiplier > 1 && (
              <div style={{
                background: 'rgba(255, 255, 255, 0.3)',
                padding: '0.4rem 0.8rem',
                borderRadius: '12px',
                fontSize: '1rem',
                fontWeight: '700',
                marginTop: '0.5rem',
                display: 'inline-block'
              }}>
                {tierUpgrade.multiplier}x Punti
              </div>
            )}
          </div>

          {/* Messaggio finale - COMPATTO */}
          <div style={{
            fontSize: '1rem',
            opacity: 0.95,
            animation: 'pulse 2s infinite',
            lineHeight: 1.4
          }}>
            Hai raggiunto un nuovo livello! 🎉
          </div>

          {/* Stili animazioni */}
          <style dangerouslySetInnerHTML={{
            __html: `
              @keyframes bounce {
                0%, 20%, 50%, 80%, 100% { transform: translateY(0) scale(1); }
                40% { transform: translateY(-15px) scale(1.1); }
                60% { transform: translateY(-7px) scale(1.05); }
              }
              @keyframes pulse {
                0%, 100% { opacity: 0.8; }
                50% { opacity: 1; }
              }
            `
          }} />
        </div>
      )}

    </div>
  );
};

export default CustomerDisplay;