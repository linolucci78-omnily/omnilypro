import { useEffect, useState } from 'react';
import strapiService from '../services/strapiService';

interface Template {
  id: number;
  attributes: {
    name: string;
    description: string;
    category: string;
    is_active: boolean;
  };
}

export default function StrapiTest() {
  const [connected, setConnected] = useState<boolean | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    try {
      setLoading(true);
      setError(null);

      // Test connessione
      const isConnected = await strapiService.checkStrapiConnection();
      setConnected(isConnected);

      if (isConnected) {
        // Carica templates
        const templatesData = await strapiService.getTemplates();
        setTemplates(templatesData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore sconosciuto');
      setConnected(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>🧪 Test Connessione Strapi</h1>

      {loading && (
        <div style={{ padding: '1rem', background: '#f0f0f0', borderRadius: '8px' }}>
          <p>⏳ Caricamento...</p>
        </div>
      )}

      {error && (
        <div style={{ padding: '1rem', background: '#fee', borderRadius: '8px', color: '#c00' }}>
          <p><strong>❌ Errore:</strong> {error}</p>
        </div>
      )}

      {!loading && connected !== null && (
        <div style={{ 
          padding: '1rem', 
          background: connected ? '#efe' : '#fee', 
          borderRadius: '8px',
          marginBottom: '2rem'
        }}>
          <p style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
            {connected ? '✅ Connesso a Strapi!' : '❌ Connessione fallita'}
          </p>
          <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>
            URL: {import.meta.env.VITE_STRAPI_URL}
          </p>
        </div>
      )}

      {connected && templates.length > 0 && (
        <div>
          <h2>📋 Template Disponibili ({templates.length})</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {templates.map((template) => (
              <div
                key={template.id}
                style={{
                  padding: '1rem',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  background: '#fff'
                }}
              >
                <h3 style={{ margin: '0 0 0.5rem 0' }}>
                  {template.attributes.name}
                </h3>
                <p style={{ margin: '0 0 0.5rem 0', color: '#666' }}>
                  {template.attributes.description}
                </p>
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.9rem' }}>
                  <span>
                    🏷️ {template.attributes.category}
                  </span>
                  <span>
                    {template.attributes.is_active ? '✅ Attivo' : '❌ Disattivo'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {connected && templates.length === 0 && !loading && (
        <div style={{ padding: '2rem', textAlign: 'center', background: '#f9f9f9', borderRadius: '8px' }}>
          <p>📭 Nessun template trovato</p>
          <p style={{ fontSize: '0.9rem', color: '#666' }}>
            Crea il primo template nell'admin Strapi!
          </p>
        </div>
      )}

      <div style={{ marginTop: '2rem', padding: '1rem', background: '#f9f9f9', borderRadius: '8px' }}>
        <h3>ℹ️ Info Configurazione</h3>
        <pre style={{ fontSize: '0.85rem', overflow: 'auto' }}>
          {JSON.stringify({
            STRAPI_URL: import.meta.env.VITE_STRAPI_URL,
            HAS_TOKEN: !!import.meta.env.VITE_STRAPI_API_TOKEN,
          }, null, 2)}
        </pre>
      </div>

      <button
        onClick={testConnection}
        style={{
          marginTop: '1rem',
          padding: '0.75rem 1.5rem',
          background: '#007bff',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '1rem'
        }}
      >
        🔄 Riprova Connessione
      </button>
    </div>
  );
}
