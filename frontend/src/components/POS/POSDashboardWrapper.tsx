import React, { useState, useEffect, useRef } from 'react';
import POSLayout from './POSLayout';
import OrganizationsDashboard from '../OrganizationsDashboard';

interface POSDashboardWrapperProps {
  currentOrganization?: any;
}

const POSDashboardWrapper: React.FC<POSDashboardWrapperProps> = ({ currentOrganization }) => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const customerDisplayWindow = useRef<Window | null>(null);
  const displayCheckInterval = useRef<NodeJS.Timeout | null>(null);
  const [isDisplayConnected, setIsDisplayConnected] = useState(false);

  // Funzione per aprire il customer display
  const openCustomerDisplay = () => {
    // Verifica se il customer display è già aperto e funzionante
    if (customerDisplayWindow.current && !customerDisplayWindow.current.closed) {
      console.log('✅ Customer Display già aperto - test connessione');
      if (checkDisplayConnection()) {
        console.log('✅ Customer Display già funzionante - non riaperto');
        return;
      }
    }

    console.log('🔄 Apertura nuovo Customer Display...');

    // Usa una route che sicuramente funziona e poi naviga internamente
    const customerDisplayUrl = `${window.location.origin}/?posomnily=true#customer-display`;

    customerDisplayWindow.current = window.open(
      customerDisplayUrl,
      'CustomerDisplay',
      'width=480,height=800,resizable=yes,scrollbars=no,toolbar=no,menubar=no,location=no,status=no'
    );

    console.log('🔍 Risultato window.open:', customerDisplayWindow.current);

    if (customerDisplayWindow.current) {
        console.log('✅ Customer Display aperto automaticamente');
        setIsDisplayConnected(true);

        // Non inviare il benvenuto qui - aspetta che l'organizzazione sia caricata
        console.log('✅ Customer Display aperto - aspettando caricamento organizzazione per messaggio benvenuto');
      } else {
        console.warn('⚠️ Popup bloccato - abilita i popup per il customer display');
        setIsDisplayConnected(false);
      }
  };

  // Funzione per controllare se il display è ancora connesso
  const checkDisplayConnection = () => {
    if (customerDisplayWindow.current && !customerDisplayWindow.current.closed) {
      try {
        // Test di connessione con ping
        customerDisplayWindow.current.postMessage({ type: 'PING' }, '*');
        setIsDisplayConnected(true);
        return true;
      } catch (error) {
        console.warn('⚠️ Display disconnesso:', error);
        setIsDisplayConnected(false);
        return false;
      }
    } else {
      setIsDisplayConnected(false);
      return false;
    }
  };

  // Funzione per riconnettere il customer display dopo standby
  const reconnectCustomerDisplay = () => {
    console.log('🔄 Tentativo riconnessione customer display...');

    // Salva lo stato corrente in localStorage per recupero
    localStorage.setItem('omnily_display_state', JSON.stringify({
      timestamp: Date.now(),
      lastSection: activeSection,
      needsReconnection: true
    }));

    // Chiudi la finestra esistente se aperta
    if (customerDisplayWindow.current && !customerDisplayWindow.current.closed) {
      customerDisplayWindow.current.close();
    }

    // Riapri il customer display
    setTimeout(() => {
      openCustomerDisplay();

      // Invia messaggio di benvenuto se l'organizzazione è disponibile
      setTimeout(() => {
        const org = (window as any).currentOrganization;
        if (org && customerDisplayWindow.current && !customerDisplayWindow.current.closed) {
          console.log('📤 Invio messaggio benvenuto dopo riconnessione:', org.name);
          updateCustomerDisplay({
            type: 'WELCOME',
            organizationName: org.name,
            welcomeMessage: `Benvenuto da ${org.name}!`,
            transaction: { items: [], total: 0 }
          });
        }
      }, 2000);
    }, 1000);
  };

  // Funzione per aggiornare il customer display
  const updateCustomerDisplay = (messageData: any) => {
    if (checkDisplayConnection()) {
      // Invia il messaggio così com'è, senza sovrascrivere il tipo
      customerDisplayWindow.current!.postMessage(messageData, '*');
      console.log('📤 Messaggio inviato al customer display:', messageData);
    } else {
      console.warn('⚠️ Customer display non connesso - tentativo riconnessione...');
      reconnectCustomerDisplay();
    }
  };

  // Recovery automatico dopo standby
  const handleVisibilityChange = () => {
    if (!document.hidden) {
      console.log('🔄 App tornata in foreground - controllo display...');

      // Controlla se abbiamo bisogno di riconnessione
      const savedState = localStorage.getItem('omnily_display_state');
      if (savedState) {
        const state = JSON.parse(savedState);
        const timeDiff = Date.now() - state.timestamp;

        // Se è passato più di 30 secondi, probabilmente c'è stato uno standby
        if (timeDiff > 30000 || state.needsReconnection) {
          console.log('🔄 Possibile standby rilevato - riconnetto display...');
          reconnectCustomerDisplay();
          localStorage.removeItem('omnily_display_state');
        }
      }

      // Controlla connessione esistente
      if (!checkDisplayConnection()) {
        console.log('🔄 Display disconnesso - riconnetto...');
        reconnectCustomerDisplay();
      }
    }
  };

  useEffect(() => {
    console.log('🔄 POSDashboardWrapper montato/rimontato - inizializzazione customer display');

    // Esponi la funzione updateCustomerDisplay globalmente per i test
    (window as any).updateCustomerDisplay = updateCustomerDisplay;

    // Apri automaticamente il customer display all'avvio/navigazione al dashboard
    setTimeout(() => {
      console.log('🔄 Apertura automatica customer display (app web o Android)');
      openCustomerDisplay();
    }, 1500); // Aspetta che l'app si carichi completamente

    // Event listener per standby/recovery
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Controllo periodico della connessione
    displayCheckInterval.current = setInterval(() => {
      checkDisplayConnection();
    }, 5000); // Ogni 5 secondi

    // Cleanup function
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);

      if (displayCheckInterval.current) {
        clearInterval(displayCheckInterval.current);
      }

      if (customerDisplayWindow.current && !customerDisplayWindow.current.closed) {
        customerDisplayWindow.current.close();
      }

      delete (window as any).updateCustomerDisplay;
    };
  }, [activeSection]);

  return (
    <POSLayout
      activeSection={activeSection}
      onSectionChange={setActiveSection}
      currentOrganization={currentOrganization}
    >
      <OrganizationsDashboard
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        onOrganizationChange={(org: any) => {
          console.log('🏢 Organizzazione caricata:', org?.name);

          // Quando l'organizzazione è caricata, gestisci il customer display
          if (org) {
            console.log('🏢 Organizzazione caricata, gestione customer display');

            // Salva l'organizzazione corrente per uso futuro
            (window as any).currentOrganization = org;

            // Se il customer display non è ancora aperto, aprilo ora (per app Android)
            if (!customerDisplayWindow.current || customerDisplayWindow.current.closed) {
              console.log('📱 Customer display non aperto - apertura per app Android');
              setTimeout(() => {
                openCustomerDisplay();
                // Invia messaggio di benvenuto dopo apertura
                setTimeout(() => {
                  console.log('🏢 PRIMO INVIO MESSAGGIO BENVENUTO:', {
                    type: 'WELCOME',
                    organizationName: org.name,
                    welcomeMessage: `Benvenuto da ${org.name}!`
                  });

                  updateCustomerDisplay({
                    type: 'WELCOME',
                    organizationName: org.name,
                    welcomeMessage: `Benvenuto da ${org.name}!`,
                    transaction: { items: [], total: 0 }
                  });
                }, 2000);
              }, 500);
            } else if (customerDisplayWindow.current && !customerDisplayWindow.current.closed) {
              console.log('📤 Customer display già aperto - invio messaggio benvenuto:', org.name);

              setTimeout(() => {
                console.log('🏢 INVIO MESSAGGIO BENVENUTO:', {
                  type: 'WELCOME',
                  organizationName: org.name,
                  welcomeMessage: `Benvenuto da ${org.name}!`
                });

                updateCustomerDisplay({
                  type: 'WELCOME',
                  organizationName: org.name,
                  welcomeMessage: `Benvenuto da ${org.name}!`,
                  transaction: { items: [], total: 0 }
                });
              }, 1000); // Aspetta un secondo che il customer display sia completamente caricato
            }
          }
        }}
      />
    </POSLayout>
  );
};

export default POSDashboardWrapper;