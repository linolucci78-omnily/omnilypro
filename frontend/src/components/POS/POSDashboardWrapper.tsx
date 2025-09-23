import React, { useState, useEffect, useRef } from 'react';
import POSLayout from './POSLayout';
import OrganizationsDashboard from '../OrganizationsDashboard';

const POSDashboardWrapper: React.FC = () => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const customerDisplayWindow = useRef<Window | null>(null);
  const displayCheckInterval = useRef<NodeJS.Timeout | null>(null);
  const [isDisplayConnected, setIsDisplayConnected] = useState(false);

  // Funzione per aprire il customer display
  const openCustomerDisplay = () => {
    if (!customerDisplayWindow.current || customerDisplayWindow.current.closed) {
      // Usa una route che sicuramente funziona e poi naviga internamente
      const customerDisplayUrl = `${window.location.origin}/?posomnily=true#customer-display`;

      customerDisplayWindow.current = window.open(
        customerDisplayUrl,
        'CustomerDisplay',
        'width=480,height=800,resizable=yes,scrollbars=no,toolbar=no,menubar=no,location=no,status=no'
      );

      if (customerDisplayWindow.current) {
        console.log('✅ Customer Display aperto automaticamente');
        setIsDisplayConnected(true);

        // Invia benvenuto personalizzato dell'azienda
        setTimeout(() => {
          updateCustomerDisplay({
            type: 'WELCOME',
            organizationName: 'OMNILY PRO', // Questo sarà dinamico
            welcomeMessage: 'Benvenuto nel nostro negozio!',
            transaction: { items: [], total: 0 } // Assicura che transaction esista
          });
        }, 2000);
      } else {
        console.warn('⚠️ Popup bloccato - abilita i popup per il customer display');
        setIsDisplayConnected(false);
      }
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
    }, 1000);
  };

  // Funzione per aggiornare il customer display
  const updateCustomerDisplay = (transactionData: any) => {
    if (checkDisplayConnection()) {
      customerDisplayWindow.current!.postMessage({
        type: 'TRANSACTION_UPDATE',
        transaction: transactionData
      }, '*');
      console.log('📤 Aggiornamento inviato al customer display:', transactionData);
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
    // Esponi la funzione updateCustomerDisplay globalmente per i test
    (window as any).updateCustomerDisplay = updateCustomerDisplay;

    // Apri automaticamente il customer display all'avvio
    setTimeout(() => {
      openCustomerDisplay();
    }, 1000); // Aspetta 1 secondo che l'app si carichi

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
      currentOrganization={null} // TODO: Get from OrganizationsDashboard context
    >
      <OrganizationsDashboard
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />
    </POSLayout>
  );
};

export default POSDashboardWrapper;