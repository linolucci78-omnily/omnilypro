import React, { useState, useEffect } from 'react'
import { Globe, ArrowLeft, Eye, Settings, BarChart3, Image, FileText, Users, Video, MessageSquare, MapPin, Palette, Code } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { websiteService } from '../services/websiteService'
import { WebsiteConfigPanel } from './WebsiteConfigPanel'
import { ContactMessagesPanel } from './ContactMessagesPanel'
import './WebsiteHub.css'
import './WebsiteConfigPanel.css'

interface WebsiteHubProps {
  organizationId: string
  organizationSlug: string
  primaryColor: string
  secondaryColor: string
}

type ViewType = 'hub' | 'configure' | 'preview' | 'messages'

const WebsiteHub: React.FC<WebsiteHubProps> = ({
  organizationId,
  organizationSlug,
  primaryColor,
  secondaryColor
}) => {
  const [activeView, setActiveView] = useState<ViewType>('hub')
  const [websiteConfig, setWebsiteConfig] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    sectionsEnabled: 0,
    totalSections: 10,
    websiteEnabled: false,
    lastUpdated: null as Date | null
  })

  useEffect(() => {
    loadWebsiteConfig()
  }, [organizationId])

  const loadWebsiteConfig = async () => {
    try {
      setLoading(true)

      // Carica configurazione dal database
      const { data, error } = await supabase
        .from('organizations')
        .select(`
          website_enabled,
          website_show_hero,
          website_show_about,
          website_show_services,
          website_show_gallery,
          website_show_loyalty,
          website_show_testimonials,
          website_show_team,
          website_show_video,
          website_show_map,
          website_show_contact_form,
          updated_at
        `)
        .eq('id', organizationId)
        .single()

      if (error) throw error

      // Usa valori dal database o defaults
      const config = {
        website_enabled: data?.website_enabled ?? false,
        website_show_hero: data?.website_show_hero ?? true,
        website_show_about: data?.website_show_about ?? true,
        website_show_services: data?.website_show_services ?? false,
        website_show_gallery: data?.website_show_gallery ?? false,
        website_show_loyalty: data?.website_show_loyalty ?? true,
        website_show_testimonials: data?.website_show_testimonials ?? false,
        website_show_team: data?.website_show_team ?? false,
        website_show_video: data?.website_show_video ?? false,
        website_show_map: data?.website_show_map ?? true,
        website_show_contact_form: data?.website_show_contact_form ?? true
      }

      setWebsiteConfig(config)

      // Calculate stats
      const sectionsEnabled = Object.keys(config)
        .filter(key => key.startsWith('website_show_'))
        .filter(key => config[key])
        .length

      setStats({
        sectionsEnabled,
        totalSections: 10,
        websiteEnabled: config.website_enabled,
        lastUpdated: data?.updated_at ? new Date(data.updated_at) : null
      })
    } catch (error) {
      console.error('Error loading website config:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleWebsite = async (enabled: boolean) => {
    try {
      await websiteService.toggleWebsite(organizationId, enabled)
      setWebsiteConfig({ ...websiteConfig, website_enabled: enabled })
      setStats({ ...stats, websiteEnabled: enabled })
    } catch (error) {
      console.error('Error toggling website:', error)
    }
  }

  // Vista configurazione
  if (activeView === 'configure') {
    return (
      <WebsiteConfigPanel
        organizationId={organizationId}
        organizationSlug={organizationSlug}
        primaryColor={primaryColor}
        onBack={() => {
          setActiveView('hub')
          loadWebsiteConfig() // Ricarica stats dopo modifiche
        }}
      />
    )
  }

  // Vista messaggi
  if (activeView === 'messages') {
    return (
      <ContactMessagesPanel
        organizationId={organizationId}
        primaryColor={primaryColor}
        onBack={() => setActiveView('hub')}
      />
    )
  }

  // Vista preview
  if (activeView === 'preview') {
    return (
      <div>
        <button
          className="back-button"
          onClick={() => setActiveView('hub')}
          style={{ color: primaryColor }}
        >
          <ArrowLeft size={20} />
          <span>Torna al Sito Web</span>
        </button>
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <p style={{ marginBottom: '1rem', color: '#6b7280' }}>Apri il tuo sito in una nuova finestra:</p>
          <a
            href={`/w/${organizationSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary"
            style={{ backgroundColor: primaryColor }}
          >
            <Globe size={20} />
            Apri Sito Web
          </a>
        </div>
      </div>
    )
  }

  // Vista principale HUB
  return (
    <div
      className="website-hub"
      style={{
        '--primary-color': primaryColor,
        '--secondary-color': secondaryColor
      } as React.CSSProperties}
    >
      {/* Header */}
      <div className="website-hub-header">
        <div className="website-hub-header-content">
          <div className="website-hub-icon" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}>
            <Globe size={40} />
          </div>
          <div>
            <h1>Sito Web</h1>
            <p>Gestisci il tuo sito web aziendale</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}>
            <Globe size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Stato Sito</div>
            <div className="stat-value">
              {stats.websiteEnabled ? (
                <span style={{ color: '#10b981' }}>● Pubblicato</span>
              ) : (
                <span style={{ color: '#ef4444' }}>● Offline</span>
              )}
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}>
            <BarChart3 size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Sezioni Attive</div>
            <div className="stat-value">{stats.sectionsEnabled}/{stats.totalSections}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}>
            <Eye size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-label">URL Pubblico</div>
            <div className="stat-value" style={{ fontSize: '0.875rem' }}>
              /w/{organizationSlug}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="section-card">
        <div className="section-header">
          <h2>Azioni Rapide</h2>
        </div>
        <div className="quick-actions-grid">
          <button
            className="action-card"
            onClick={() => setActiveView('configure')}
            style={{ borderColor: `${primaryColor}20` }}
          >
            <div className="action-icon" style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}>
              <Settings size={24} />
            </div>
            <div className="action-content">
              <h3>Configura Sito</h3>
              <p>Personalizza contenuti, immagini e sezioni</p>
            </div>
          </button>

          <button
            className="action-card"
            onClick={() => setActiveView('preview')}
            style={{ borderColor: `${primaryColor}20` }}
          >
            <div className="action-icon" style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}>
              <Eye size={24} />
            </div>
            <div className="action-content">
              <h3>Anteprima Sito</h3>
              <p>Visualizza il sito come appare ai visitatori</p>
            </div>
          </button>

          <button
            className="action-card"
            onClick={() => setActiveView('messages')}
            style={{ borderColor: `${primaryColor}20` }}
          >
            <div className="action-icon" style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}>
              <MessageSquare size={24} />
            </div>
            <div className="action-content">
              <h3>Messaggi dal Sito</h3>
              <p>Gestisci i messaggi ricevuti dal form di contatto</p>
            </div>
          </button>

          <a
            href={`/w/${organizationSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="action-card"
            style={{ borderColor: `${primaryColor}20`, textDecoration: 'none', color: 'inherit' }}
          >
            <div className="action-icon" style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}>
              <Globe size={24} />
            </div>
            <div className="action-content">
              <h3>Apri Sito Web</h3>
              <p>Visualizza il sito pubblico in una nuova scheda</p>
            </div>
          </a>

          <button
            className="action-card"
            onClick={() => toggleWebsite(!stats.websiteEnabled)}
            style={{ borderColor: stats.websiteEnabled ? '#10b98120' : '#ef444420' }}
          >
            <div className="action-icon" style={{
              backgroundColor: stats.websiteEnabled ? '#10b98115' : '#ef444415',
              color: stats.websiteEnabled ? '#10b981' : '#ef4444'
            }}>
              <Globe size={24} />
            </div>
            <div className="action-content">
              <h3>{stats.websiteEnabled ? 'Disattiva Sito' : 'Attiva Sito'}</h3>
              <p>{stats.websiteEnabled ? 'Rendi il sito offline' : 'Pubblica il sito online'}</p>
            </div>
          </button>
        </div>
      </div>

      {/* Sezioni Disponibili */}
      <div className="section-card">
        <div className="section-header">
          <h2>Sezioni del Sito</h2>
          <p className="section-subtitle">Personalizza quali sezioni mostrare sul tuo sito</p>
        </div>
        <div className="sections-list">
          {[
            { key: 'hero', label: 'Homepage Hero', icon: Image, enabled: websiteConfig?.website_show_hero },
            { key: 'about', label: 'Chi Siamo', icon: FileText, enabled: websiteConfig?.website_show_about },
            { key: 'services', label: 'Servizi', icon: BarChart3, enabled: websiteConfig?.website_show_services },
            { key: 'gallery', label: 'Gallery Foto', icon: Image, enabled: websiteConfig?.website_show_gallery },
            { key: 'loyalty', label: 'Programma Fedeltà', icon: Globe, enabled: websiteConfig?.website_show_loyalty },
            { key: 'testimonials', label: 'Recensioni', icon: MessageSquare, enabled: websiteConfig?.website_show_testimonials },
            { key: 'team', label: 'Il Nostro Team', icon: Users, enabled: websiteConfig?.website_show_team },
            { key: 'video', label: 'Video Presentazione', icon: Video, enabled: websiteConfig?.website_show_video },
            { key: 'map', label: 'Mappa', icon: MapPin, enabled: websiteConfig?.website_show_map },
            { key: 'contact_form', label: 'Form Contatto', icon: MessageSquare, enabled: websiteConfig?.website_show_contact_form },
          ].map((section) => (
            <div key={section.key} className="section-item">
              <div className="section-item-icon" style={{
                backgroundColor: section.enabled ? `${primaryColor}15` : '#f3f4f6',
                color: section.enabled ? primaryColor : '#9ca3af'
              }}>
                <section.icon size={20} />
              </div>
              <div className="section-item-content">
                <h4>{section.label}</h4>
              </div>
              <div className={`section-status ${section.enabled ? 'enabled' : 'disabled'}`}>
                {section.enabled ? '✓ Attiva' : '○ Disattivata'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SEO & Analytics */}
      <div className="section-card">
        <div className="section-header">
          <h2>SEO & Analytics</h2>
          <p className="section-subtitle">Ottimizzazione e tracciamento</p>
        </div>
        <div className="quick-actions-grid">
          <div className="action-card" style={{ borderColor: `${primaryColor}20`, cursor: 'default' }}>
            <div className="action-icon" style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}>
              <BarChart3 size={24} />
            </div>
            <div className="action-content">
              <h3>Google Analytics</h3>
              <p>Traccia visite e comportamento utenti</p>
            </div>
          </div>

          <div className="action-card" style={{ borderColor: `${primaryColor}20`, cursor: 'default' }}>
            <div className="action-icon" style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}>
              <Palette size={24} />
            </div>
            <div className="action-content">
              <h3>Meta Tags</h3>
              <p>Ottimizza per motori di ricerca e social</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WebsiteHub
