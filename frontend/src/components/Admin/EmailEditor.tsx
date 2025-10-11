import React, { useRef, useEffect } from 'react'
import StudioEditor from '@grapesjs/studio-sdk/react'

interface EmailEditorProps {
  html?: string
  onChange?: (html: string) => void
  onSave?: (html: string) => void
  onEditorReady?: (editor: any) => void
  variables?: string[]
}

const EmailEditor: React.FC<EmailEditorProps> = ({ html = '', onChange, onSave, onEditorReady, variables = [] }) => {
  const editorRef = useRef<any>(null)
  const [isEditorReady, setIsEditorReady] = React.useState(false)
  const [initialHtml, setInitialHtml] = React.useState(html)
  const [updatedHtml, setUpdatedHtml] = React.useState(html)

  // Genera ID univoci per progetto e utente
  const projectId = React.useMemo(() => `omnily-email-${Date.now()}`, [])
  const userId = React.useMemo(() => `admin-user-${Math.random().toString(36).substr(2, 9)}`, [])

  // Aggiorna l'HTML iniziale quando cambia (senza loop infinito)
  useEffect(() => {
    if (html && html !== initialHtml) {
      setInitialHtml(html)
      setUpdatedHtml(html)
      setIsEditorReady(false)
    }
  }, [html]) // SOLO html nelle dipendenze, non initialHtml!

  // Carica l'HTML nel editor quando è pronto
  useEffect(() => {
    if (isEditorReady && editorRef.current && initialHtml) {
      try {
        const editor = editorRef.current
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
    if (!onChange) return

    try {
      let extractedHtml = ''

      // Prova vari metodi per estrarre l'HTML
      if (data?.html) {
        extractedHtml = data.html
      } else if (data?.pages?.[0]?.component) {
        extractedHtml = data.pages[0].component
      } else if (editorRef.current) {
        const editor = editorRef.current
        if (typeof editor.getHtml === 'function') {
          extractedHtml = editor.getHtml()
        } else if (editor.editor?.getHtml) {
          extractedHtml = editor.editor.getHtml()
        } else if (editor.instance?.getHtml) {
          extractedHtml = editor.instance.getHtml()
        }
      }

      if (extractedHtml) {
        onChange(extractedHtml)
      }
    } catch (error) {
      console.error('Errore nell\'estrazione HTML:', error)
    }
  }

  // Crea le options
  const editorOptions = React.useMemo(() => ({
    licenseKey: 'ff2fab8f4c544ed98668ac8555413fcec821766e12a048bd9676cf10b550ec19',
    theme: 'light' as const,
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
    storage: {
      type: 'browser' as const
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

      {/* Pannello Variabili */}
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
            if (editor) {
              editorRef.current = editor

              // Passa l'istanza al parent tramite callback
              if (onEditorReady) {
                onEditorReady(editor)
              }

              // SOLUZIONE GEMINI: Ascolta l'evento 'update' per catturare TUTTE le modifiche
              try {
                editor.on('update', () => {
                  try {
                    const newHtml = editor.getHtml?.() || editor.editor?.getHtml?.() || ''
                    if (newHtml) {
                      setUpdatedHtml(newHtml)
                      if (onChange) {
                        onChange(newHtml)
                      }
                    }
                  } catch (e) {
                    // Ignora errori di estrazione HTML
                  }
                })
              } catch (e) {
                // Ignora se editor.on non è disponibile
              }

              // Intercetta il comando "save" di GrapeJS
              if (editor.Commands && onSave) {
                // Salva il riferimento alla funzione onSave
                const saveFn = onSave

                editor.Commands.add('save', {
                  run: () => {
                    try {
                      const html = editor.getHtml?.() || editor.editor?.getHtml?.() || updatedHtml
                      if (html && saveFn) {
                        // Chiama in un setTimeout per evitare problemi di serializzazione
                        setTimeout(() => saveFn(String(html)), 0)
                      }
                    } catch (e) {
                      // Ignora errori
                    }
                  }
                })
              }
            }
            setIsEditorReady(true)
          }}
          onChange={handleEditorUpdate}
          options={editorOptions}
        />
      </div>
    </div>
  )
}

export default EmailEditor
