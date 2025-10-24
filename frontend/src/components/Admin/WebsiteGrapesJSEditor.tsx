import React, { useMemo, useEffect, useRef, useCallback } from 'react';
import StudioEditor from '@grapesjs/studio-sdk/react';
import '@grapesjs/studio-sdk/dist/style.css';

interface WebsiteGrapesJSEditorProps {
  html?: string;
  css?: string;
  gjsComponents?: any;
  gjsStyles?: any;
  onChange?: (data: { html: string, css: string, gjsComponents?: any, gjsStyles?: any }) => void;
  onSave?: (data: { html: string, css: string, gjsComponents?: any, gjsStyles?: any }) => void;
  websiteName?: string;
  editorRef?: React.MutableRefObject<any>;
}

const WebsiteGrapesJSEditor: React.FC<WebsiteGrapesJSEditorProps> = ({
  html = '',
  css = '',
  gjsComponents,
  gjsStyles,
  onChange,
  onSave,
  websiteName = 'Sito Web',
  editorRef: externalEditorRef,
}) => {
  const internalEditorRef = useRef<any>(null);
  const editorRef = externalEditorRef || internalEditorRef;
  const loadedContentRef = useRef<string>('');
  const projectId = useMemo(() => `omnily-website-project`, []);
  const userId = useMemo(() => `omnily-admin-user`, []);

  // Funzione per caricare il contenuto nell'editor
  const loadContentIntoEditor = useCallback((editor: any) => {
    if (!editor) return;

    try {
      // L'editor GrapeJS reale è dentro editor.editor
      const gjs = editor.editor || editor;

      // Crea un ID univoco per questo contenuto
      const contentId = JSON.stringify({ html, gjsComponents, gjsStyles });

      // Se abbiamo già caricato questo contenuto, non ricaricare (previene loop)
      if (loadedContentRef.current === contentId) {
        return;
      }

      console.log('📝 Caricamento contenuto sito nell\'editor');

      // Se abbiamo dati GrapeJS strutturati, usali per ricostruire l'editor
      if (gjsComponents) {
        console.log('✅ Caricamento dati GrapeJS strutturati');
        gjs.setComponents(gjsComponents);
        // Se abbiamo gjsStyles (struttura GrapesJS), usa quella
        if (gjsStyles) {
          console.log('🎨 Caricamento gjsStyles strutturati');
          gjs.setStyle(gjsStyles);
        }
      } else if (html) {
        // Nessun dato GrapeJS, carica HTML + CSS come stringa
        console.log('⚠️ Caricamento HTML e CSS testuali');

        // Se abbiamo CSS, includiamolo nell'HTML con un tag <style>
        let htmlWithCss = html;
        if (css) {
          console.log('🎨 Inserimento CSS nell\'HTML come <style> tag');
          // Inserisci il CSS all'inizio dell'HTML
          htmlWithCss = `<style>${css}</style>${html}`;
        }

        gjs.setComponents(htmlWithCss);
      }

      // Marca questo contenuto come caricato
      loadedContentRef.current = contentId;
    } catch (err) {
      console.error('❌ Errore nel caricamento contenuto:', err);
      if (err instanceof Error && err.message.includes('insecure')) {
        console.warn('⚠️ Errore sicurezza rilevato (probabilmente CORS su immagini). L\'editor continuerà a funzionare.');
      }
    }
  }, [html, css, gjsComponents, gjsStyles]);

  // Questo Effect gestisce l'aggiornamento del contenuto dell'editor quando le props cambiano
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    loadContentIntoEditor(editor);
  }, [loadContentIntoEditor]);


  const editorOptions = useMemo(() => ({
    licenseKey: 'ff2fab8f4c544ed98668ac8555413fcec821766e12a048bd9676cf10b550ec19',
    project: {
      id: projectId,
      pages: [{
        component: '<div style="padding: 20px; text-align: center;"><h1>Caricamento editor...</h1></div>',
      }],
    },
    identity: { id: userId },
    theme: 'light' as const,
  }), [projectId, userId]);

  const handleOnChange = (data: any) => {
    if (onChange) {
      try {
        const editor = editorRef.current;
        const gjs = editor?.editor || editor;
        const gjsComponents = gjs ? gjs.getComponents() : undefined;
        const gjsStyles = gjs ? gjs.getStyle() : undefined;

        console.log('🔄 WebsiteEditor onChange:', {
          hasEditor: !!editor,
          html_length: data.html?.length,
          css_length: data.css?.length
        });

        onChange({
          html: data.html,
          css: data.css,
          gjsComponents,
          gjsStyles
        });
      } catch (err) {
        console.error('❌ Errore in handleOnChange:', err);
      }
    }
  };

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '100%',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      boxSizing: 'border-box',
      background: '#f8fafc'
    }}>
      {/* HEADER */}
      <div style={{
        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
        color: 'white',
        padding: '12px 16px',
        textAlign: 'center',
        boxShadow: '0 2px 6px rgba(59, 130, 246, 0.15)',
        flexShrink: 0
      }}>
        <h2 style={{ margin: '0 0 4px 0', fontSize: 'clamp(16px, 3vw, 20px)', fontWeight: '700' }}>
          🌐 Editor Sito Web - {websiteName}
        </h2>
        <p style={{ margin: '0', fontSize: 'clamp(11px, 2vw, 13px)', opacity: '0.9' }}>
          Drag & Drop professionale - Modifica sezioni, testi, immagini
        </p>
      </div>

      {/* EDITOR STUDIO PRO */}
      <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
        <StudioEditor
          options={editorOptions}
          onReady={(editor) => {
            editorRef.current = editor;

            // Configura attributi CORS per immagini
            const gjs = editor.editor || editor;
            if (gjs && gjs.on) {
              const addCorsAttr = (model: any) => {
                if (model.is('image')) {
                  model.set('crossorigin', 'anonymous');
                }
                model.components().forEach(addCorsAttr);
              };

              gjs.on('load', () => {
                addCorsAttr(gjs.getWrapper());
              });

              gjs.on('component:add', addCorsAttr);
            }

            // Carica il contenuto appena l'editor è pronto
            console.log('🎨 Website Editor GrapeJS pronto');
            loadContentIntoEditor(editor);
          }}
          onChange={handleOnChange}
        />
      </div>
    </div>
  );
};

export default WebsiteGrapesJSEditor;
