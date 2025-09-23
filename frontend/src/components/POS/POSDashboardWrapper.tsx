
import React, { useState, useEffect, useRef, useCallback } from 'react';
import POSLayout from './POSLayout';
import OrganizationsDashboard from '../OrganizationsDashboard';

interface POSDashboardWrapperProps {
  currentOrganization?: any;
}

const POSDashboardWrapper: React.FC<POSDashboardWrapperProps> = ({ currentOrganization: initialOrganization }) => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [organization, setOrganization] = useState(initialOrganization);
  const customerDisplayWindow = useRef<Window | null>(null);

  /**
   * Apre una finestra per il customer display.
   * Soluzione pulita che si affida al metodo onCreateWindow implementato in Android.
   */
  const openCustomerDisplay = useCallback(() => {
    if (customerDisplayWindow.current && !customerDisplayWindow.current.closed) {
      console.log('✅ Customer Display già aperto');
      return customerDisplayWindow.current;
    }

    console.log('🔄 Apertura Customer Display...');
    const customerDisplayUrl = `${window.location.origin}/?posomnily=true#customer-display`;

    // Apertura pulita con window.open - il resto viene gestito da Android onCreateWindow
    const newWindow = window.open(customerDisplayUrl, 'CustomerDisplay', 'width=480,height=800');

    if (newWindow) {
      console.log('✅ Richiesta apertura inviata ad Android');
      customerDisplayWindow.current = newWindow;
    } else {
      console.warn('⚠️ Apertura fallita - verifica setSupportMultipleWindows(true) in Android');
      customerDisplayWindow.current = null;
    }
    return newWindow;
  }, []);

  /**
   * Invia dati al customer display tramite postMessage.
   * Gestisce automaticamente i casi di finestra chiusa o non disponibile.
   */
  const updateCustomerDisplay = useCallback((messageData: any) => {
    const windowRef = customerDisplayWindow.current;

    if (!windowRef || windowRef.closed) {
      console.warn('❌ Customer Display non disponibile per invio dati');
      return;
    }

    try {
      console.log('📤 Invio al customer display:', messageData);
      windowRef.postMessage(messageData, '*');
    } catch (error) {
      console.error('❌ Errore postMessage:', error);
    }
  }, []);

  // Gestisce il cambio di organizzazione
  const handleOrganizationChange = useCallback((org: any) => {
    if (org) {
      console.log('🏢 Organizzazione caricata:', org.name);
      setOrganization(org);
      // Invia i dati della nuova organizzazione al display
      updateCustomerDisplay({
        type: 'WELCOME',
        organizationName: org.name,
        welcomeMessage: `Benvenuto da ${org.name}!`,
        logoUrl: org.logo_url,
        transaction: { items: [], total: 0 }
      });
    }
  }, [updateCustomerDisplay]);

  // Setup iniziale e cleanup
  useEffect(() => {
    console.log('🔄 POSDashboardWrapper montato');
    (window as any).updateCustomerDisplay = updateCustomerDisplay;

    // Apertura immediata del customer display
    openCustomerDisplay();

    return () => {
      console.log('🧹 Cleanup: chiusura customer display');
      if (customerDisplayWindow.current && !customerDisplayWindow.current.closed) {
        customerDisplayWindow.current.close();
      }
      delete (window as any).updateCustomerDisplay;
    };
  }, [openCustomerDisplay, updateCustomerDisplay]);

  return (
    <POSLayout
      activeSection={activeSection}
      onSectionChange={setActiveSection}
      currentOrganization={organization}
    >
      <OrganizationsDashboard
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        onOrganizationChange={handleOrganizationChange}
      />
    </POSLayout>
  );
};

export default POSDashboardWrapper;
