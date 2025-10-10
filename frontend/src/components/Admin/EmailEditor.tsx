import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import StudioEditor from '@grapesjs/studio-sdk/react'
import '@grapesjs/studio-sdk/style'

interface EmailEditorProps {
  html?: string
  onChange?: (html: string) => void
  variables?: string[]
}

export interface EmailEditorRef {
  getHtml: () => string
}

const EmailEditor = forwardRef<EmailEditorRef, EmailEditorProps>(({ html = '', onChange, variables = [] }, ref) => {
  const editorRef = useRef<any>(null)
  const [isEditorReady, setIsEditorReady] = React.useState(false)
  const [initialHtml, setInitialHtml] = React.useState(html)
  const currentHtmlRef = useRef<string>(html) // Salva HTML corrente

  // Genera ID univoci per progetto e utente
  const projectId = React.useMemo(() => `omnily-email-${Date.now()}`, [])
  const userId = React.useMemo(() => `admin-user-${Math.random().toString(36).substr(2, 9)}`, [])

  // Esponi metodo per estrarre HTML dall'editor
  useImperativeHandle(ref, () => ({
    getHtml: () => {
      console.log('🔍 Estraendo HTML dall\'editor in tempo reale...')

      // Prima prova a usare l'HTML salvato da onChange
      if (currentHtmlRef.current && currentHtmlRef.current !== html) {
        console.log('✅ Uso HTML da currentHtmlRef, lunghezza:', currentHtmlRef.current.length)
        return currentHtmlRef.current
      }

      // Altrimenti estrai direttamente dall'editor
      if (!editorRef.current) {
        console.warn('⚠️ Editor ref non disponibile, ritorno HTML iniziale')
        return html
      }

      try {
        const editor = editorRef.current

        // Prova getProjectData per ottenere il progetto completo
        if (typeof editor.getProjectData === 'function') {
          const projectData = editor.getProjectData()
          console.log('📦 Project data ottenuto:', projectData)

          if (projectData?.pages?.[0]?.component) {
            console.log('✅ HTML estratto da getProjectData().pages[0].component')
            return projectData.pages[0].component
          }
        }

        // Prova getHtml diretto
        if (typeof editor.getHtml === 'function') {
          const result = editor.getHtml()
          console.log('✅ HTML estratto con getHtml(), lunghezza:', result?.length)
          return result
        }

        console.warn('⚠️ Nessun metodo funzionante, ritorno HTML iniziale')
        return html
      } catch (error) {
        console.error('❌ Errore estrazione:', error)
        return html
      }
    }
  }))

  // Aggiorna l'HTML iniziale quando cambia
  useEffect(() => {
    if (html && html !== initialHtml) {
      setInitialHtml(html)
      currentHtmlRef.current = html // Aggiorna anche il ref
      setIsEditorReady(false) // Reset per ricaricare
    }
  }, [html]) // Rimosso initialHtml dalle dipendenze per evitare loop infinito

  // Carica l'HTML nel editor quando è pronto
  useEffect(() => {
    if (isEditorReady && editorRef.current && initialHtml) {
      try {
        const editor = editorRef.current

        // Carica l'HTML nell'editor
        if (typeof editor.setComponents === 'function') {
          editor.setComponents(initialHtml)
        } else if (editor.editor && typeof editor.editor.setComponents === 'function') {
          editor.editor.setComponents(initialHtml)
        } else if (editor.instance && typeof editor.instance.setComponents === 'function') {
          editor.instance.setComponents(initialHtml)
        }
      } catch (error) {
        console.error('Errore nel caricamento HTML:', error)
      }
    }
  }, [isEditorReady, initialHtml])

  // Gestisce i cambiamenti nell'editor
  const handleEditorUpdate = (data: any) => {
    console.log('📧 Studio SDK onChange triggered:', data)

    try {
      let extractedHtml = ''

      // Prova a ottenere l'HTML dal data object
      if (data && data.html) {
        extractedHtml = data.html
        console.log('✅ HTML trovato in data.html, lunghezza:', extractedHtml.length)
      }
      // Prova data.pages[0].component
      else if (data && data.pages && data.pages[0] && data.pages[0].component) {
        extractedHtml = data.pages[0].component
        console.log('✅ HTML trovato in data.pages[0].component, lunghezza:', extractedHtml.length)
      }
      // Altrimenti prova dal ref
      else if (editorRef.current) {
        const editor = editorRef.current

        if (typeof editor.getHtml === 'function') {
          extractedHtml = editor.getHtml()
          console.log('✅ HTML estratto con editor.getHtml(), lunghezza:', extractedHtml?.length)
        } else if (editor.editor && typeof editor.editor.getHtml === 'function') {
          extractedHtml = editor.editor.getHtml()
          console.log('✅ HTML estratto con editor.editor.getHtml(), lunghezza:', extractedHtml?.length)
        } else if (editor.instance && typeof editor.instance.getHtml === 'function') {
          extractedHtml = editor.instance.getHtml()
          console.log('✅ HTML estratto con editor.instance.getHtml(), lunghezza:', extractedHtml?.length)
        } else {
          console.warn('⚠️ Nessun metodo per estrarre HTML trovato')
        }
      }

      // Salva HTML corrente nel ref per uso successivo
      if (extractedHtml) {
        currentHtmlRef.current = extractedHtml
        console.log('💾 HTML salvato in currentHtmlRef, lunghezza:', extractedHtml.length)

        // Chiama onChange se fornito
        if (onChange) {
          onChange(extractedHtml)
        }
      }
    } catch (error) {
      console.error('❌ Errore nell\'estrazione HTML:', error)
    }
  }

  // Crea le options una sola volta con l'HTML iniziale
  const editorOptions = React.useMemo(() => ({
    licenseKey: 'ff2fab8f4c544ed98668ac8555413fcec821766e12a048bd9676cf10b550ec19',
    theme: 'light' as const,
    ...(initialHtml && {
      pages: [{
        id: 'main-page',
        component: initialHtml
      }]
    }),
    customTheme: {
      default: {
        colors: {
          global: {
            background1: "rgba(248, 250, 252, 1)",
            background2: "rgba(241, 245, 249, 1)",
            background3: "rgba(226, 232, 240, 1)",
            backgroundHover: "rgba(248, 250, 252, 1)",
            text: "rgba(15, 23, 42, 1)",
            border: "rgba(203, 213, 225, 1)",
            focus: "rgba(59, 130, 246, 0.8)",
            placeholder: "rgba(148, 163, 184, 1)"
          },
          primary: {
            background1: "rgba(59, 130, 246, 1)",
            background3: "rgba(29, 78, 216, 1)",
            backgroundHover: "rgba(37, 99, 235, 1)",
            text: "rgba(255, 255, 255, 1)"
          },
          component: {
            background1: "rgba(255, 255, 255, 1)",
            background2: "rgba(248, 250, 252, 1)",
            background3: "rgba(241, 245, 249, 1)",
            text: "rgba(15, 23, 42, 1)"
          },
          selector: {
            background1: "rgba(102, 126, 234, 1)",
            background2: "rgba(118, 75, 162, 1)",
            text: "rgba(255, 255, 255, 1)"
          },
          symbol: {
            background1: "rgba(59, 130, 246, 1)",
            background2: "rgba(37, 99, 235, 1)",
            background3: "rgba(29, 78, 216, 1)",
            text: "rgba(255, 255, 255, 1)"
          }
        }
      }
    },
    project: {
      type: 'web' as const,
      id: projectId
    },
    identity: {
      id: userId
    },
    assets: {
      storageType: 'local' as const
    },
    storage: {
      type: 'local' as const
    }
  }), [projectId, userId, initialHtml])

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '100%',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      boxSizing: 'border-box',
      padding: '0',
      background: '#f8fafc'
    }}>
      {/* HEADER PROFESSIONALE */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '8px 12px',
        borderRadius: '0',
        marginBottom: '0',
        textAlign: 'center',
        boxShadow: '0 2px 6px rgba(102, 126, 234, 0.15)',
        flexShrink: 0
      }}>
        <h2 style={{
          margin: '0 0 4px 0',
          fontSize: 'clamp(16px, 3vw, 20px)',
          fontWeight: '700',
          letterSpacing: '0.5px'
        }}>
          📧 Editor Email Studio PRO
        </h2>
        <p style={{
          margin: '0',
          fontSize: 'clamp(11px, 2vw, 13px)',
          opacity: '0.9',
          fontWeight: '400'
        }}>
          Editor professionale con AI e cloud storage
        </p>
      </div>

      {/* Pannello Variabili PROFESSIONALE */}
      {variables && variables.length > 0 && (
        <div style={{
          background: '#ffffff',
          border: '0',
          borderBottom: '1px solid #e1e5e9',
          borderRadius: '0',
          padding: '8px 12px',
          marginBottom: '0',
          boxShadow: 'none',
          flexShrink: 0
        }}>
          <h4 style={{
            margin: '0 0 8px 0',
            fontSize: 'clamp(13px, 2.5vw, 15px)',
            fontWeight: '600',
            color: '#374151',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <span>🏷️</span>
            Variabili Disponibili
          </h4>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(200px, 100%), 1fr))',
            gap: 'clamp(10px, 2vw, 15px)'
          }}>
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
                onClick={() => {
                  navigator.clipboard.writeText(`{{${variable}}}`)

                  // Notifica semplice e professionale
                  const notification = document.createElement('div');
                  notification.innerText = `✓ ${variable} copiato`;
                  notification.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: #10b981;
                    color: white;
                    padding: 12px 20px;
                    border-radius: 8px;
                    font-weight: 600;
                    z-index: 10000;
                    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.15);
                    font-size: 14px;
                  `;
                  document.body.appendChild(notification);
                  setTimeout(() => {
                    if (document.body.contains(notification)) {
                      document.body.removeChild(notification);
                    }
                  }, 2000);
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #dbeafe, #bfdbfe)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(59, 130, 246, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #eff6ff, #dbeafe)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                title="Clicca per copiare negli appunti"
              >
                {`{{${variable}}}`}
              </div>
            ))}
          </div>
          <p style={{
            margin: '8px 0 0 0',
            fontSize: 'clamp(10px, 2vw, 12px)',
            color: '#6b7280',
            textAlign: 'center'
          }}>
            💡 Clicca una variabile per copiarla negli appunti
          </p>
        </div>
      )}

      {/* EDITOR STUDIO PRO */}
      <div style={{
        flex: 1,
        border: '0',
        borderRadius: '0',
        overflow: 'hidden',
        boxShadow: 'none',
        background: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0
      }}>
        <StudioEditor
          onReady={(editor: any) => {
            // Salva il riferimento all'editor
            if (editor) {
              editorRef.current = editor
            }
            setIsEditorReady(true)
          }}
          onChange={handleEditorUpdate}
          options={editorOptions}
        />
      </div>
    </div>
  )
})

EmailEditor.displayName = 'EmailEditor'

export default EmailEditor
export type { EmailEditorRef }
