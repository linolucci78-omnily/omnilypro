import React, { useState, useEffect, useRef } from 'react';
import POSLayout from './POSLayout';
import OrganizationsDashboard from '../OrganizationsDashboard';

const POSDashboardWrapper: React.FC = () => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const customerDisplayWindow = useRef<Window | null>(null);

  // Funzione per aggiornare il customer display
  const updateCustomerDisplay = (transactionData: any) => {
    if (customerDisplayWindow.current && !customerDisplayWindow.current.closed) {
      customerDisplayWindow.current.postMessage({
        type: 'TRANSACTION_UPDATE',
        transaction: transactionData
      }, '*');
      console.log('📤 Aggiornamento inviato al customer display:', transactionData);
    }
  };

  useEffect(() => {
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
        }
      }
    };

    // Apri automaticamente il customer display sul secondo schermo
    const timer = setTimeout(openCustomerDisplay, 2000);

    // Esponi la funzione updateCustomerDisplay globalmente per i test
    (window as any).updateCustomerDisplay = updateCustomerDisplay;

    // Cleanup: chiudi il customer display quando il componente viene smontato
    return () => {
      clearTimeout(timer);
      if (customerDisplayWindow.current && !customerDisplayWindow.current.closed) {
        customerDisplayWindow.current.close();
      }
      delete (window as any).updateCustomerDisplay;
    };
  }, []);

  return (
    <POSLayout
      activeSection={activeSection}
      onSectionChange={setActiveSection}
    >
      <OrganizationsDashboard
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />
    </POSLayout>
  );
};

export default POSDashboardWrapper;