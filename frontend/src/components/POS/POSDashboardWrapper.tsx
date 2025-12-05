
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Mic } from 'lucide-react';
import POSLayout from './POSLayout';
import OrganizationsDashboard from '../OrganizationsDashboard';
import NotificationAnimations, { NotificationAnimationsRef } from '../NotificationAnimations';
import { LotteryTicketSaleModal } from './LotteryTicketSaleModal';
import OrganizationAssistant from '../Admin/OmnyAssistant/OrganizationAssistant';

interface POSDashboardWrapperProps {
  currentOrganization?: any;
}

const POSDashboardWrapper: React.FC<POSDashboardWrapperProps> = ({ currentOrganization: initialOrganization }) => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [organization, setOrganization] = useState(initialOrganization);
  const [previewColors, setPreviewColors] = useState<{
    primary: string | null
    secondary: string | null
  }>({ primary: null, secondary: null });
  const animationsRef = useRef<NotificationAnimationsRef>(null);
  const [lotteryModalOpen, setLotteryModalOpen] = useState(false);
  const [showAssistant, setShowAssistant] = useState(false);

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

  // Gestisce il cambio dei colori preview
  const handlePreviewColorsChange = useCallback((primary: string | null, secondary: string | null) => {
    console.log('🎨 POSDashboardWrapper - Preview colors changed:', { primary, secondary });
    setPreviewColors({ primary, secondary });
  }, []);

  // Setup iniziale - NESSUNA gestione di finestre
  useEffect(() => {
    console.log('🔄 POSDashboardWrapper montato - customer display gestito SOLO da Android');
    (window as any).updateCustomerDisplay = updateCustomerDisplay;
    // Esponi animationsRef globalmente per accesso da CustomerSlidePanel
    (window as any).notificationAnimationsRef = animationsRef;
    console.log('✅ animationsRef esposto globalmente');

    return () => {
      console.log('🧹 Cleanup POSDashboardWrapper');
      delete (window as any).updateCustomerDisplay;
      delete (window as any).notificationAnimationsRef;
    };
  }, [updateCustomerDisplay]);

  // Invia messaggio WELCOME all'avvio se c'è già un'organizzazione
  useEffect(() => {
    if (organization) {
      console.log('🏢 Invio messaggio WELCOME iniziale per:', organization.name);
      updateCustomerDisplay({
        type: 'WELCOME',
        organizationName: organization.name,
        welcomeMessage: `Benvenuto da ${organization.name}!`,
        logoUrl: organization.logo_url,
        transaction: { items: [], total: 0 }
      });
    }
  }, []); // Solo al mount iniziale

  // Esponi funzione globale per aprire modal lotteria
  useEffect(() => {
    (window as any).openLotteryModal = () => setLotteryModalOpen(true);
    return () => {
      delete (window as any).openLotteryModal;
    };
  }, []);

  return (
    <>
      <POSLayout
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        currentOrganization={organization}
        previewColors={previewColors}
      >
        <OrganizationsDashboard
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          onOrganizationChange={handleOrganizationChange}
          onPreviewColorsChange={handlePreviewColorsChange}
        />
      </POSLayout>

      {/* Notification Animations - Persistent across all POS operations */}
      <NotificationAnimations ref={animationsRef} />

      {/* Lottery Ticket Sale Modal */}
      {organization && (
        <LotteryTicketSaleModal
          isOpen={lotteryModalOpen}
          onClose={() => setLotteryModalOpen(false)}
          organizationId={organization.id}
          staffId={(window as any).currentUser?.id}
          staffName={(window as any).currentUser?.full_name}
          onTicketSold={(ticket) => {
            console.log('🎟️ Biglietto venduto:', ticket);
            // Notifica successo (se disponibile)
            if (animationsRef.current && typeof animationsRef.current.showSuccess === 'function') {
              animationsRef.current.showSuccess('Biglietto venduto con successo!');
            }
          }}
        />
      )}

      {/* Omny Assistant FAB - POS Mode (Gemini Style) */}
      <button
        onClick={() => setShowAssistant(true)}
        className="omny-assistant-fab-pos"
        style={{
          position: 'fixed',
          bottom: '2rem',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '96px',
          height: '96px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
          border: 'none',
          boxShadow: '0 8px 32px rgba(220, 38, 38, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          zIndex: 1000
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateX(-50%) scale(1.1)';
          e.currentTarget.style.boxShadow = '0 12px 48px rgba(220, 38, 38, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.15)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateX(-50%) scale(1)';
          e.currentTarget.style.boxShadow = '0 8px 32px rgba(220, 38, 38, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)';
        }}
      >
        {/* Microfono */}
        <Mic size={32} color="white" strokeWidth={2} />

        {/* Google Color Dots */}
        <div style={{
          display: 'flex',
          gap: '4px',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: '#4285F4'
          }} />
          <div style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: '#DB4437'
          }} />
          <div style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: '#F4B400'
          }} />
          <div style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: '#0F9D58'
          }} />
        </div>
      </button>

      {/* Omny Assistant Modal */}
      {showAssistant && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999 }}>
          <OrganizationAssistant
            onClose={() => setShowAssistant(false)}
            organizationId={organization?.id}
          />
        </div>
      )}

      <style>{`
        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 8px 32px rgba(102, 126, 234, 0.5), 0 0 0 4px rgba(102, 126, 234, 0.1);
          }
          50% {
            box-shadow: 0 8px 32px rgba(102, 126, 234, 0.7), 0 0 0 8px rgba(102, 126, 234, 0.15);
          }
        }
      `}</style>
    </>
  );
};

export default POSDashboardWrapper;
