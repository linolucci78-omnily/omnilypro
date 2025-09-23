
import React, { useState, useEffect, useCallback } from 'react';
import POSLayout from './POSLayout';
import OrganizationsDashboard from '../OrganizationsDashboard';

interface POSDashboardWrapperProps {
  currentOrganization?: any;
}

const POSDashboardWrapper: React.FC<POSDashboardWrapperProps> = ({ currentOrganization: initialOrganization }) => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [organization, setOrganization] = useState(initialOrganization);

  /**
   * Invia dati al customer display tramite bridge Android.
   * Soluzione pulita senza popup o finestre.
   */
  const updateCustomerDisplay = useCallback((messageData: any) => {
    try {
      console.log('📤 Invio dati al customer display via Android bridge:', messageData);

      // Usa il bridge Android per inviare i dati al customer display
      if ((window as any).OmnilyPOS && (window as any).OmnilyPOS.updateCustomerDisplay) {
        (window as any).OmnilyPOS.updateCustomerDisplay(JSON.stringify(messageData));
      } else {
        console.warn('⚠️ Bridge Android non disponibile per customer display');
      }
    } catch (error) {
      console.error('❌ Errore invio dati customer display:', error);
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

  // Setup iniziale - NESSUNA gestione di finestre
  useEffect(() => {
    console.log('🔄 POSDashboardWrapper montato - customer display gestito SOLO da Android');
    (window as any).updateCustomerDisplay = updateCustomerDisplay;

    return () => {
      console.log('🧹 Cleanup POSDashboardWrapper');
      delete (window as any).updateCustomerDisplay;
    };
  }, [updateCustomerDisplay]);

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
