import React, { useState, useEffect, useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { Book, ChevronRight, Search, Menu, X } from 'lucide-react'
import './DocumentationViewer.css'
import 'highlight.js/styles/atom-one-dark.css'

interface DocSection {
  id: string
  title: string
  icon?: React.ReactNode
  file: string
}

interface DocumentationViewerProps {
  sections: DocSection[]
  defaultSection?: string
}

const DocumentationViewer: React.FC<DocumentationViewerProps> = ({
  sections,
  defaultSection
}) => {
  const [activeSection, setActiveSection] = useState(defaultSection || sections[0]?.id)
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [preloadProgress, setPreloadProgress] = useState(0)
  const [cacheUpdateTrigger, setCacheUpdateTrigger] = useState(0)

  // Cache per contenuti già caricati - evita di ricaricare gli stessi file
  const contentCache = React.useRef<Map<string, string>>(new Map())
  const preloadStarted = React.useRef(false)

  // Preload DISABILITATO - caricamento solo on-demand con cache
  // useEffect(() => {
  //   if (preloadStarted.current) return
  //   preloadStarted.current = true
  //   const preloadAllDocs = async () => {
  //     const totalSections = sections.length
  //     let loaded = 0
  //     const promises = sections.map(async (section) => {
  //       try {
  //         const response = await fetch(section.file)
  //         const text = await response.text()
  //         contentCache.current.set(section.id, text)
  //         loaded++
  //         setPreloadProgress((loaded / totalSections) * 100)
  //         setCacheUpdateTrigger(prev => prev + 1)
  //       } catch (error) {
  //         console.error(`Error preloading ${section.id}:`, error)
  //       }
  //     })
  //     await Promise.all(promises)
  //     console.log('✅ Tutti i documenti precaricati in cache')
  //   }
  //   preloadAllDocs()
  // }, [sections])

  useEffect(() => {
    loadContent(activeSection)
  }, [activeSection])

  const loadContent = async (sectionId: string) => {
    // Controlla se il contenuto è già in cache
    if (contentCache.current.has(sectionId)) {
      // Caricamento istantaneo dalla cache - nessun loading necessario
      const cachedContent = contentCache.current.get(sectionId)!
      setContent(cachedContent)
      setLoading(false)
      return
    }

    // Solo se non è in cache, mostra loading
    setLoading(true)
    const section = sections.find(s => s.id === sectionId)
    if (!section) return

    try {
      const response = await fetch(section.file)
      const text = await response.text()

      // Salva in cache per caricamenti futuri
      contentCache.current.set(sectionId, text)
      setContent(text)
    } catch (error) {
      console.error('Error loading documentation:', error)
      setContent('# Errore\n\nImpossibile caricare la documentazione.')
    } finally {
      setLoading(false)
    }
  }

  // Controlla se una sezione è già in cache
  const isSectionCached = (sectionId: string) => {
    return contentCache.current.has(sectionId)
  }

  const filteredSections = sections.filter(section =>
    section.title.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Memoizza il rendering del markdown per evitare re-rendering costosi
  const renderedContent = useMemo(() => {
    if (!content) return null

    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
      >
        {content}
      </ReactMarkdown>
    )
  }, [content])

  return (
    <div className="documentation-viewer">
      {/* Header */}
      <div className="doc-header">
        <div className="doc-header-content">
          <button
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <div className="doc-header-title">
            <Book size={28} />
            <div>
              <h1>Documentazione</h1>
              <p>Manuale d'uso completo della piattaforma</p>
            </div>
          </div>
        </div>
      </div>

      <div className="doc-container">
        {/* Sidebar */}
        <aside className={`doc-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
          <div className="sidebar-search">
            <Search size={18} />
            <input
              type="text"
              placeholder="Cerca sezione..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <nav className="doc-nav">
            {filteredSections.map((section) => (
              <button
                key={section.id}
                className={`doc-nav-item ${activeSection === section.id ? 'active' : ''}`}
                onClick={() => {
                  setActiveSection(section.id)
                  if (window.innerWidth < 768) setSidebarOpen(false)
                }}
              >
                {section.icon && <span className="nav-icon">{section.icon}</span>}
                <span className="nav-title">{section.title}</span>
                <ChevronRight size={18} className="nav-arrow" />
              </button>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <main className="doc-content">
          {loading ? (
            <div className="doc-loading">
              <div className="loading-spinner"></div>
              <p>Caricamento documentazione...</p>
            </div>
          ) : (
            <div className="markdown-content">
              {renderedContent}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default DocumentationViewer
