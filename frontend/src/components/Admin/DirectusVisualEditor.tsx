import React, { useEffect, useState } from 'react';
import { X, ExternalLink } from 'lucide-react';

interface DirectusVisualEditorProps {
  websiteId: number;
  onClose: () => void;
}

/**
 * DirectusVisualEditor
 *
 * Apre il pannello admin di Directus in un iframe per permettere
 * la modifica visuale del sito web direttamente da Directus.
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

  // URL diretto alla collezione organizations_websites su Directus
  const directusAdminUrl = `${directusUrl}/admin/content/organizations_websites/${websiteId}`;

  useEffect(() => {
    // Previeni scroll della pagina sottostante
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          width: '100%',
          height: '100%',
          maxWidth: '1400px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#f9fafb'
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>
              🎨 Directus Visual Editor
            </h2>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: '#6b7280' }}>
              Modifica il sito direttamente da Directus CMS
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {/* Apri in nuova finestra */}
            <a
              href={directusAdminUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#3b82f6',
                color: 'white',
                borderRadius: '8px',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
            >
              <ExternalLink size={16} />
              Apri in nuova tab
            </a>

            {/* Chiudi */}
            <button
              onClick={onClose}
              style={{
                padding: '0.5rem',
                backgroundColor: '#f3f4f6',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e5e7eb'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Iframe Directus */}
        <iframe
          src={directusAdminUrl}
          style={{
            flex: 1,
            border: 'none',
            width: '100%',
            backgroundColor: '#ffffff'
          }}
          title="Directus Visual Editor"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
        />

        {/* Footer Info */}
        <div
          style={{
            padding: '0.75rem 1.5rem',
            borderTop: '1px solid #e5e7eb',
            backgroundColor: '#f9fafb',
            fontSize: '0.75rem',
            color: '#6b7280',
            textAlign: 'center'
          }}
        >
          💡 Suggerimento: Per un'esperienza migliore, usa il pulsante "Apri in nuova tab"
        </div>
      </div>
    </div>
  );
};

export default DirectusVisualEditor;
