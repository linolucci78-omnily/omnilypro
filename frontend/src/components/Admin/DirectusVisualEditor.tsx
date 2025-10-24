import React, { useEffect, useState } from 'react';
import { ExternalLink, CheckCircle } from 'lucide-react';

interface DirectusVisualEditorProps {
  websiteId: number;
  onClose: () => void;
}

/**
 * DirectusVisualEditor
 *
 * Apre direttamente il pannello admin di Directus in una nuova finestra
 * per permettere la modifica visuale del sito web.
 *
 * Questo componente è AGGIUNTIVO e non sostituisce AdminWebsiteEditor esistente.
 */
const DirectusVisualEditor: React.FC<DirectusVisualEditorProps> = ({
  websiteId,
  onClose
}) => {
  const [directusUrl] = useState(
    import.meta.env.VITE_DIRECTUS_URL || 'https://omnilypro-directus.onrender.com'
  );
  const [windowOpened, setWindowOpened] = useState(false);

  // URL diretto alla collezione organizations_websites su Directus
  const directusAdminUrl = `${directusUrl}/admin/content/organizations_websites/${websiteId}`;

  useEffect(() => {
    // Apri automaticamente Directus in una nuova finestra
    const newWindow = window.open(directusAdminUrl, '_blank', 'noopener,noreferrer');

    if (newWindow) {
      setWindowOpened(true);
      // Chiudi automaticamente il modal dopo 2 secondi
      const timer = setTimeout(() => {
        onClose();
      }, 3000);

      return () => clearTimeout(timer);
    } else {
      // Popup bloccato
      setWindowOpened(false);
    }
  }, [directusAdminUrl, onClose]);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        backdropFilter: 'blur(4px)'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '3rem',
          maxWidth: '500px',
          textAlign: 'center',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.3)',
          animation: 'fadeIn 0.3s ease-out'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {windowOpened ? (
          <>
            {/* Success */}
            <div style={{ marginBottom: '1.5rem' }}>
              <CheckCircle size={64} style={{ color: '#10b981', margin: '0 auto' }} />
            </div>
            <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.5rem', fontWeight: 700, color: '#1f2937' }}>
              Directus Editor Aperto! 🎨
            </h2>
            <p style={{ margin: '0 0 1.5rem 0', color: '#6b7280', lineHeight: 1.6 }}>
              Il pannello Directus è stato aperto in una nuova finestra. Puoi chiudere questo messaggio e continuare a modificare il sito.
            </p>
            <button
              onClick={onClose}
              style={{
                padding: '0.75rem 2rem',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#059669'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#10b981'}
            >
              Chiudi
            </button>
          </>
        ) : (
          <>
            {/* Popup bloccato */}
            <div style={{ marginBottom: '1.5rem' }}>
              <ExternalLink size={64} style={{ color: '#f59e0b', margin: '0 auto' }} />
            </div>
            <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.5rem', fontWeight: 700, color: '#1f2937' }}>
              Popup Bloccato ⚠️
            </h2>
            <p style={{ margin: '0 0 1.5rem 0', color: '#6b7280', lineHeight: 1.6 }}>
              Il browser ha bloccato l'apertura automatica. Clicca sul pulsante qui sotto per aprire Directus manualmente.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <a
                href={directusAdminUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: '0.75rem 2rem',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontSize: '1rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
              >
                <ExternalLink size={20} />
                Apri Directus Editor
              </a>
              <button
                onClick={onClose}
                style={{
                  padding: '0.75rem 2rem',
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e5e7eb'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
              >
                Annulla
              </button>
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default DirectusVisualEditor;
