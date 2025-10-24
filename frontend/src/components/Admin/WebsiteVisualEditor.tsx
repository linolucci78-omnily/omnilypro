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
      <div style="font-family: system-ui, -apple-system, sans-serif;">
        <header style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 60px 20px; text-align: center;">
          <h1 style="margin: 0 0 10px 0; font-size: 3em;">${siteName}</h1>
          <p style="margin: 0; font-size: 1.2em; opacity: 0.9;">Benvenuti nel nostro sito</p>
        </header>

        <section style="padding: 60px 20px; max-width: 1200px; margin: 0 auto;">
          <h2 style="text-align: center; font-size: 2.5em; margin-bottom: 30px;">Chi Siamo</h2>
          <p style="font-size: 1.1em; line-height: 1.6; text-align: center; max-width: 800px; margin: 0 auto;">
            Clicca su qualsiasi elemento per modificarlo. Trascina nuovi blocchi dalla barra laterale per costruire il tuo sito.
          </p>
        </section>

        <section style="background: #f8fafc; padding: 60px 20px;">
          <div style="max-width: 1200px; margin: 0 auto;">
            <h2 style="text-align: center; font-size: 2.5em; margin-bottom: 40px;">I Nostri Servizi</h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 30px;">
              <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); text-align: center;">
                <h3 style="margin: 0 0 15px 0; font-size: 1.5em;">Servizio 1</h3>
                <p style="margin: 0; color: #64748b;">Descrizione del primo servizio</p>
              </div>
              <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); text-align: center;">
                <h3 style="margin: 0 0 15px 0; font-size: 1.5em;">Servizio 2</h3>
                <p style="margin: 0; color: #64748b;">Descrizione del secondo servizio</p>
              </div>
              <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); text-align: center;">
                <h3 style="margin: 0 0 15px 0; font-size: 1.5em;">Servizio 3</h3>
                <p style="margin: 0; color: #64748b;">Descrizione del terzo servizio</p>
              </div>
            </div>
          </div>
        </section>

        <footer style="background: #1f2937; color: white; padding: 40px 20px; text-align: center;">
          <p style="margin: 0;">&copy; 2025 ${siteName}. Tutti i diritti riservati.</p>
        </footer>
      </div>
    `;
  };

  const generateDefaultCSS = () => {
    return `
      * {
        box-sizing: border-box;
      }
      body {
        margin: 0;
        padding: 0;
        font-family: system-ui, -apple-system, sans-serif;
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
