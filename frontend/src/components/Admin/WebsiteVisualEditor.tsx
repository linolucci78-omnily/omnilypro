import React, { useState, useEffect, useRef } from 'react';
import { X, Save, Loader } from 'lucide-react';
import WebsiteGrapesJSEditor from './WebsiteGrapesJSEditor';
import { directusClient } from '../../lib/directus';

interface WebsiteVisualEditorProps {
  websiteId: number;
  onClose: () => void;
  onSave?: () => void;
}

const WebsiteVisualEditor: React.FC<WebsiteVisualEditorProps> = ({
  websiteId,
  onClose,
  onSave
}) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [websiteData, setWebsiteData] = useState<any>(null);
  const [editorData, setEditorData] = useState({
    html: '',
    css: '',
    gjsComponents: null,
    gjsStyles: null
  });
  const editorRef = useRef<any>(null);

  // Carica i dati del sito da Directus
  useEffect(() => {
    loadWebsiteData();
  }, [websiteId]);

  const loadWebsiteData = async () => {
    try {
      setLoading(true);
      const website = await directusClient.getWebsiteComplete(websiteId);
      setWebsiteData(website);

      // Carica HTML/CSS esistenti o inizia da template base
      const html = website.grapesjs_html || generateDefaultHTML(website);
      const css = website.grapesjs_css || generateDefaultCSS();
      const gjsComponents = website.grapesjs_components ? JSON.parse(website.grapesjs_components) : null;
      const gjsStyles = website.grapesjs_styles ? JSON.parse(website.grapesjs_styles) : null;

      console.log('🔍 Dati caricati da Directus:', {
        has_html: !!website.grapesjs_html,
        has_css: !!website.grapesjs_css,
        has_components: !!website.grapesjs_components,
        has_styles: !!website.grapesjs_styles,
        html_length: html?.length,
        css_length: css?.length
      });

      // Se i dati GrapesJS non esistono nel database, salva quelli di default
      if (!website.grapesjs_html || !website.grapesjs_css) {
        console.log('💾 Inizializzazione dati GrapesJS di default...');
        try {
          await directusClient.updateWebsite(websiteId, {
            grapesjs_html: html,
            grapesjs_css: css,
          });
          console.log('✅ Dati GrapesJS di default salvati');
        } catch (saveError) {
          console.error('⚠️ Errore nel salvataggio dati di default:', saveError);
        }
      }

      setEditorData({
        html,
        css,
        gjsComponents,
        gjsStyles
      });
    } catch (error) {
      console.error('Errore caricamento sito:', error);
      alert('Errore nel caricamento del sito');
    } finally {
      setLoading(false);
    }
  };

  const generateDefaultHTML = (website: any) => {
    const siteName = website.site_name || 'Il Mio Sito';
    return `
      <section class="hero-section">
        <div class="hero-content">
          <h1 class="hero-title">${siteName}</h1>
          <p class="hero-subtitle">Benvenuti nel nostro sito</p>
          <a href="#contatti" class="hero-cta">Contattaci</a>
        </div>
      </section>

      <section class="about-section">
        <h2 class="section-title">Chi Siamo</h2>
        <div class="about-content">
          <p class="about-description">
            Clicca su qualsiasi elemento per modificarlo. Trascina nuovi blocchi dalla barra laterale per costruire il tuo sito.
            Personalizza testi, immagini, colori e layout per creare un sito unico che rappresenta la tua attività.
          </p>
        </div>
      </section>

      <section class="services-section">
        <h2 class="section-title">I Nostri Servizi</h2>
        <div class="services-grid">
          <div class="service-card">
            <h3 class="service-title">Servizio 1</h3>
            <p class="service-description">Descrizione del primo servizio offerto dalla tua attività. Modifica questo testo per descrivere cosa offri.</p>
          </div>
          <div class="service-card">
            <h3 class="service-title">Servizio 2</h3>
            <p class="service-description">Descrizione del secondo servizio. Aggiungi dettagli su caratteristiche, prezzi o vantaggi.</p>
          </div>
          <div class="service-card">
            <h3 class="service-title">Servizio 3</h3>
            <p class="service-description">Terzo servizio principale. Personalizza o aggiungi altri servizi secondo le tue esigenze.</p>
          </div>
        </div>
      </section>

      <footer class="footer">
        <p>&copy; 2025 ${siteName}. Tutti i diritti riservati.</p>
      </footer>
    `;
  };

  const generateDefaultCSS = () => {
    // Inline the complete RestaurantClassic CSS
    return `
/* Restaurant Classic Template - Professional Design */
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 0;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  color: #1a1a1a;
  line-height: 1.6;
}

html {
  scroll-behavior: smooth;
}

/* Sections */
section {
  padding: 80px 20px;
}

.section-title {
  font-size: 2.5rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: 3rem;
  color: #2c3e50;
}

/* Hero Section */
.hero-section {
  min-height: 90vh;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  position: relative;
}

.hero-content {
  max-width: 800px;
  padding: 2rem;
}

.hero-title {
  font-size: 3.5rem;
  font-weight: 800;
  margin-bottom: 1.5rem;
  line-height: 1.2;
}

.hero-subtitle {
  font-size: 1.5rem;
  margin-bottom: 2rem;
  opacity: 0.95;
}

.hero-cta {
  display: inline-block;
  padding: 1rem 2.5rem;
  background: white;
  color: #667eea;
  text-decoration: none;
  border-radius: 50px;
  font-weight: 600;
  font-size: 1.1rem;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.hero-cta:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 25px rgba(0,0,0,0.2);
}

/* About Section */
.about-section {
  background: white;
}

.about-content {
  max-width: 800px;
  margin: 0 auto;
  text-align: center;
}

.about-description {
  font-size: 1.2rem;
  color: #555;
  line-height: 1.8;
}

/* Services Grid */
.services-section {
  background: #f8fafc;
}

.services-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.service-card {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  text-align: center;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.service-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 24px rgba(0,0,0,0.15);
}

.service-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: #2c3e50;
}

.service-description {
  color: #64748b;
  line-height: 1.6;
}

/* Footer */
.footer {
  background: #1f2937;
  color: white;
  padding: 3rem 2rem;
  text-align: center;
}

.footer p {
  margin: 0;
  opacity: 0.9;
}

/* Responsive Design */
@media (max-width: 768px) {
  .hero-title {
    font-size: 2.5rem;
  }

  .hero-subtitle {
    font-size: 1.2rem;
  }

  .section-title {
    font-size: 2rem;
  }

  .services-grid {
    grid-template-columns: 1fr;
  }
}
    `;
  };

  const handleEditorChange = (data: any) => {
    setEditorData(data);
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Salva su Directus
      await directusClient.updateWebsite(websiteId, {
        grapesjs_html: editorData.html,
        grapesjs_css: editorData.css,
        grapesjs_components: editorData.gjsComponents ? JSON.stringify(editorData.gjsComponents) : null,
        grapesjs_styles: editorData.gjsStyles ? JSON.stringify(editorData.gjsStyles) : null,
      });

      alert('✅ Sito salvato con successo!');

      if (onSave) {
        onSave();
      }
    } catch (error) {
      console.error('Errore salvataggio:', error);
      alert('❌ Errore nel salvataggio del sito');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header con bottoni */}
      <div style={{
        background: '#1f2937',
        color: 'white',
        padding: '12px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
      }}>
        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
          Visual Editor - {websiteData?.site_name || 'Caricamento...'}
        </h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: saving ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 600,
              opacity: saving ? 0.6 : 1
            }}
          >
            {saving ? <Loader size={18} className="animate-spin" /> : <Save size={18} />}
            {saving ? 'Salvataggio...' : 'Salva'}
          </button>
          <button
            onClick={onClose}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600
            }}
          >
            <X size={18} />
            Chiudi
          </button>
        </div>
      </div>

      {/* Editor */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {loading ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            background: '#f8fafc'
          }}>
            <div style={{ textAlign: 'center' }}>
              <Loader size={48} className="animate-spin" style={{ color: '#10b981', margin: '0 auto 20px' }} />
              <p style={{ margin: 0, fontSize: '18px', color: '#64748b' }}>Caricamento editor...</p>
            </div>
          </div>
        ) : (
          <WebsiteGrapesJSEditor
            html={editorData.html}
            css={editorData.css}
            gjsComponents={editorData.gjsComponents}
            gjsStyles={editorData.gjsStyles}
            onChange={handleEditorChange}
            websiteName={websiteData?.site_name}
            editorRef={editorRef}
          />
        )}
      </div>
    </div>
  );
};

export default WebsiteVisualEditor;
