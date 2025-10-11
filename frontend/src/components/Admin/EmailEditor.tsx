import React, { useMemo, useEffect, useRef, useCallback } from 'react';
import StudioEditor from '@grapesjs/studio-sdk/react';
import '@grapesjs/studio-sdk/dist/style.css';

interface TemplateData {
  id: string;
  name: string;
  html_body: string;
}

interface EmailEditorProps {
  html?: string;
  css?: string;
  gjsComponents?: any;
  gjsStyles?: any;
  onChange?: (data: { html: string, css: string, gjsComponents?: any, gjsStyles?: any }) => void;
  onSave?: (data: { html: string, css: string, gjsComponents?: any, gjsStyles?: any }) => void;
  variables?: string[];
  templates?: TemplateData[];
  editorRef?: React.MutableRefObject<any>;
}

const EmailEditor: React.FC<EmailEditorProps> = ({
  html = '',
  css = '',
  gjsComponents,
  gjsStyles,
  onChange,
  onSave,
  variables = [],
  templates = [],
  editorRef: externalEditorRef,
}) => {
  const internalEditorRef = useRef<any>(null);
  const editorRef = externalEditorRef || internalEditorRef;
  const loadedContentRef = useRef<string>(''); // Track cosa abbiamo già caricato
  const projectId = useMemo(() => `omnily-email-project`, []);
  const userId = useMemo(() => `omnily-admin-user`, []);

  // Funzione per caricare il contenuto nell'editor
  const loadContentIntoEditor = useCallback((editor: any) => {
    if (!editor) return;

    // L'editor GrapeJS reale è dentro editor.editor
    const gjs = editor.editor || editor;

    // Crea un ID univoco per questo contenuto
    const contentId = JSON.stringify({ html, gjsComponents, gjsStyles });

    // Se abbiamo già caricato questo contenuto, non ricaricare
    if (loadedContentRef.current === contentId) {
      return;
    }

    console.log('📝 Caricamento nuovo contenuto nell\'editor');

    try {
      // Se abbiamo dati GrapeJS strutturati, usali per ricostruire l'editor
      if (gjsComponents) {
        console.log('✅ Caricamento dati GrapeJS strutturati');
        gjs.setComponents(gjsComponents);
        if (gjsStyles) {
          gjs.setStyle(gjsStyles);
        }
      } else if (html) {
        // Nessun dato GrapeJS, carica solo HTML
        console.log('⚠️ Caricamento solo HTML (senza dati GrapeJS)');
        gjs.setComponents(html);
      }

      // Marca questo contenuto come caricato
      loadedContentRef.current = contentId;
    } catch (err) {
      console.error('❌ Errore nel caricamento contenuto:', err);
    }
  }, [html, gjsComponents, gjsStyles]);

  // Questo Effect gestisce l'aggiornamento del contenuto dell'editor quando le props cambiano
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    loadContentIntoEditor(editor);
  }, [loadContentIntoEditor]); // Si attiva quando cambiano i dati

  const editorOptions = useMemo(() => ({
    licenseKey: 'ff2fab8f4c544ed98668ac8555413fcec821766e12a048bd9676cf10b550ec19',
    project: {
      id: projectId,
      pages: [{
        // NON impostare contenuto qui - verrà caricato dopo nel useEffect
        component: '<p>Caricamento editor...</p>',
      }],
    },
    identity: { id: userId },
    // storage: { type: 'browser' as const }, // Disabilitato per evitare conflitti con contenuto dinamico
    theme: 'light' as const,
    // templates: non supportato in questa versione del SDK - caricamento manuale via setComponents
  }), [projectId, userId]);

  const handleOnChange = (data: any) => {
    if (onChange) {
      const editor = editorRef.current;
      const gjsComponents = editor ? editor.getComponents() : undefined;
      const gjsStyles = editor ? editor.getStyle() : undefined;

      console.log('🔄 EmailEditor onChange:', {
        hasEditor: !!editor,
        gjsComponents: gjsComponents,
        gjsStyles: gjsStyles,
        html_length: data.html?.length,
        css_length: data.css?.length
      });

      onChange({
        html: data.html,
        css: data.css,
        gjsComponents,
        gjsStyles
      });
    }
  };

  const handleOnSave = (data: any) => {
    if (onSave) {
      const editor = editorRef.current;
      const gjsComponents = editor ? editor.getComponents() : undefined;
      const gjsStyles = editor ? editor.getStyle() : undefined;

      console.log('💾 EmailEditor onSave:', {
        hasEditor: !!editor,
        gjsComponents: gjsComponents,
        gjsStyles: gjsStyles,
        html_length: data.html?.length,
        css_length: data.css?.length
      });

      onSave({
        html: data.html,
        css: data.css,
        gjsComponents,
        gjsStyles
      });
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
      {/* HEADER (invariato) */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '8px 12px',
        textAlign: 'center',
        boxShadow: '0 2px 6px rgba(102, 126, 234, 0.15)',
        flexShrink: 0
      }}>
        <h2 style={{ margin: '0 0 4px 0', fontSize: 'clamp(16px, 3vw, 20px)', fontWeight: '700' }}>
          📧 Editor Email Studio PRO
        </h2>
        <p style={{ margin: '0', fontSize: 'clamp(11px, 2vw, 13px)', opacity: '0.9' }}>
          Editor professionale con AI e cloud storage
        </p>
      </div>

      {/* Pannello Variabili (invariato) */}
      {variables && variables.length > 0 && (
        <div style={{
          background: '#ffffff',
          borderBottom: '1px solid #e1e5e9',
          padding: '8px 12px',
          flexShrink: 0
        }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: 'clamp(13px, 2.5vw, 15px)', fontWeight: '600', color: '#374151', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>🏷️</span>
            Variabili Disponibili
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(200px, 100%), 1fr))', gap: 'clamp(10px, 2vw, 15px)' }}>
            {variables.map((variable) => (
              <div
                key={variable}
                style={{
                  background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
                  border: '1px solid #93c5fd',
                  borderRadius: 'clamp(4px, 1vw, 6px)',
                  padding: 'clamp(8px, 2vw, 10px)',
                  fontSize: 'clamp(11px, 2vw, 13px)',
                  fontWeight: '600',
                  color: '#1e40af',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.2s ease',
                  fontFamily: 'monospace'
                }}
                onClick={() => navigator.clipboard.writeText(`{{${variable}}}`)}
                title="Clicca per copiare"
              >
                {`{{${variable}}}`}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* EDITOR STUDIO PRO */}
      <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
        <StudioEditor
          options={editorOptions}
          onReady={(editor) => {
            editorRef.current = editor;
            // Carica il contenuto appena l'editor è pronto
            console.log('🎨 Editor GrapeJS pronto');
            console.log('📋 Metodi disponibili:', Object.keys(editor));
            console.log('📋 Ha getComponents?', typeof editor.getComponents);
            console.log('📋 Ha getStyle?', typeof editor.getStyle);
            console.log('📋 Ha getHtml?', typeof editor.getHtml);
            console.log('📋 Ha getCss?', typeof editor.getCss);
            loadContentIntoEditor(editor);
          }}
          onChange={handleOnChange}
          onSave={handleOnSave}
        />
      </div>
    </div>
  );
};

export default EmailEditor;
