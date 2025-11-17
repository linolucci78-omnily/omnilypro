import React, { useState, useEffect } from 'react'
import {
  Save,
  Eye,
  Image as ImageIcon,
  FileText,
  Star,
  MessageSquare,
  Briefcase,
  Users,
  Video,
  Mail,
  Search,
  X,
  Plus,
  Trash2,
  Upload,
  Palette,
  Paintbrush,
  Sparkles,
  Zap,
  Target,
  Lightbulb,
  Heart,
  Globe,
  Layout,
  Settings,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Youtube,
  Link as LinkIcon,
  GripVertical,
  Camera,
  ZoomIn,
  MoveUp,
  MoveDown,
  BarChart,
  Code,
  LayoutGrid,
  DollarSign,
  Cookie,
  Shield,
  Type,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { websiteService } from '../services/websiteService'
import { ImageUploader } from './ImageUploader'
import { ToggleSwitch } from './ToggleSwitch'
import { WebsiteStylingTab } from './WebsiteStylingTab'
import { InfoCard } from './InfoCard'
import { ColorPicker } from './ColorPicker'
import { useToast } from '../hooks/useToast'
import Toast from './UI/Toast'

interface WebsiteConfigPanelProps {
  organizationId: string
  organizationSlug: string
  primaryColor: string
  onBack: () => void
}

type TabType = 'content' | 'services' | 'gallery' | 'testimonials' | 'pricing' | 'typography' | 'gdpr' | 'seo' | 'settings'

export const WebsiteConfigPanel: React.FC<WebsiteConfigPanelProps> = ({
  organizationId,
  organizationSlug,
  primaryColor,
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('content')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [config, setConfig] = useState<any>({})
  const { toast, showSuccess, showError, hideToast } = useToast()

  useEffect(() => {
    loadConfig()
  }, [organizationId])

  // Definizione tabs
  const allTabsDefinition = [
    { id: 'content', label: 'Contenuti', icon: FileText, alwaysShow: true },
    { id: 'customize', label: 'Personalizza', icon: Palette, alwaysShow: true },
    { id: 'styling', label: 'Stile Sezioni', icon: Paintbrush, alwaysShow: true },
    { id: 'services', label: 'Servizi', icon: Briefcase, toggleKey: 'website_show_services' },
    { id: 'gallery', label: 'Gallery', icon: ImageIcon, toggleKey: 'website_show_gallery' },
    { id: 'team', label: 'Team', icon: Users, toggleKey: 'website_show_team' },
    { id: 'video', label: 'Video', icon: Video, toggleKey: 'website_show_video' },
    { id: 'testimonials', label: 'Recensioni', icon: Star, toggleKey: 'website_show_testimonials' },
    { id: 'pricing', label: 'Listino', icon: DollarSign, toggleKey: 'website_show_pricing' },
    { id: 'typography', label: 'Tipografia & Colori', icon: Type, alwaysShow: true },
    { id: 'gdpr', label: 'GDPR/Cookie', icon: Shield, alwaysShow: true },
    { id: 'seo', label: 'SEO', icon: Search, alwaysShow: true },
  ]

  // Se il tab corrente viene disabilitato, torna a 'content'
  useEffect(() => {
    const currentTabConfig = allTabsDefinition.find(t => t.id === activeTab)
    if (currentTabConfig && !currentTabConfig.alwaysShow && currentTabConfig.toggleKey) {
      const isEnabled = config[currentTabConfig.toggleKey as keyof typeof config]
      if (!isEnabled) {
        setActiveTab('content')
      }
    }
  }, [config, activeTab])

  // Parallax scroll effect for gallery
  useEffect(() => {
    if (activeTab !== 'gallery') return

    const handleScroll = () => {
      const galleryCards = document.querySelectorAll('.gallery-card-hover')

      galleryCards.forEach((card, index) => {
        const rect = card.getBoundingClientRect()
        const windowHeight = window.innerHeight
        const cardCenter = rect.top + rect.height / 2
        const distanceFromCenter = (windowHeight / 2 - cardCenter) / windowHeight

        // Parallax movement based on scroll position
        const translateY = distanceFromCenter * 20
        const translateX = (index % 2 === 0 ? 1 : -1) * distanceFromCenter * 10
        const rotate = distanceFromCenter * 2

        // Apply transform only when card is in viewport
        if (rect.top < windowHeight && rect.bottom > 0) {
          ;(card as HTMLElement).style.transform = `
            translateY(${translateY}px)
            translateX(${translateX}px)
            rotate(${rotate}deg)
          `
        }
      })
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // Initial call

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [activeTab, config.website_gallery])

  const loadConfig = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', organizationId)
        .single()

      if (error) throw error
      setConfig(data || {})
    } catch (error) {
      console.error('Error loading config:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveConfig = async () => {
    try {
      setSaving(true)
      await websiteService.updateWebsiteConfig(organizationId, config)
      showSuccess('✅ Configurazione salvata con successo!')
    } catch (error) {
      console.error('Error saving config:', error)
      showError('❌ Errore nel salvare la configurazione')
    } finally {
      setSaving(false)
    }
  }

  const updateConfig = (key: string, value: any) => {
    setConfig({ ...config, [key]: value })
  }

  const addService = () => {
    const services = config.website_services || []
    services.push({
      title: 'Nuovo Servizio',
      description: 'Descrizione del servizio',
      icon: 'Sparkles',
      image: '',
    })
    updateConfig('website_services', services)
  }

  const updateService = (index: number, field: string, value: any) => {
    const services = [...(config.website_services || [])]
    services[index] = { ...services[index], [field]: value }
    updateConfig('website_services', services)
  }

  const removeService = (index: number) => {
    const services = [...(config.website_services || [])]
    services.splice(index, 1)
    updateConfig('website_services', services)
  }

  const addGalleryImage = () => {
    const gallery = config.website_gallery || []
    gallery.push({
      url: '',
      caption: '',
    })
    updateConfig('website_gallery', gallery)
  }

  const updateGalleryImage = (index: number, field: string, value: any) => {
    const gallery = [...(config.website_gallery || [])]
    gallery[index] = { ...gallery[index], [field]: value }
    updateConfig('website_gallery', gallery)
  }

  const removeGalleryImage = (index: number) => {
    const gallery = [...(config.website_gallery || [])]
    gallery.splice(index, 1)
    updateConfig('website_gallery', gallery)
  }

  const moveGalleryImage = (index: number, direction: 'up' | 'down') => {
    const gallery = [...(config.website_gallery || [])]
    if (direction === 'up' && index > 0) {
      [gallery[index - 1], gallery[index]] = [gallery[index], gallery[index - 1]]
    } else if (direction === 'down' && index < gallery.length - 1) {
      [gallery[index], gallery[index + 1]] = [gallery[index + 1], gallery[index]]
    }
    updateConfig('website_gallery', gallery)
  }

  const addTestimonial = () => {
    const testimonials = config.website_testimonials || []
    testimonials.push({
      name: 'Nome Cliente',
      role: 'Ruolo',
      content: 'Testimonianza del cliente...',
      rating: 5,
      image: '',
    })
    updateConfig('website_testimonials', testimonials)
  }

  const updateTestimonial = (index: number, field: string, value: any) => {
    const testimonials = [...(config.website_testimonials || [])]
    testimonials[index] = { ...testimonials[index], [field]: value }
    updateConfig('website_testimonials', testimonials)
  }

  const removeTestimonial = (index: number) => {
    const testimonials = [...(config.website_testimonials || [])]
    testimonials.splice(index, 1)
    updateConfig('website_testimonials', testimonials)
  }

  // Price list categories management
  const addPriceListCategory = () => {
    const categories = config.website_price_list_categories || []
    categories.push({
      id: `cat-${Date.now()}`,
      name: 'Nuova Categoria',
      description: '',
      items: [],
    })
    updateConfig('website_price_list_categories', categories)
  }

  const updatePriceListCategory = (index: number, field: string, value: any) => {
    const categories = [...(config.website_price_list_categories || [])]
    categories[index] = { ...categories[index], [field]: value }
    updateConfig('website_price_list_categories', categories)
  }

  const removePriceListCategory = (index: number) => {
    const categories = [...(config.website_price_list_categories || [])]
    categories.splice(index, 1)
    updateConfig('website_price_list_categories', categories)
  }

  const addPriceListItem = (categoryIndex: number) => {
    const categories = [...(config.website_price_list_categories || [])]
    if (!categories[categoryIndex].items) categories[categoryIndex].items = []
    categories[categoryIndex].items.push({
      id: `item-${Date.now()}`,
      name: 'Nuovo Servizio',
      description: '',
      price: '€0',
      duration: '',
      image: '',
    })
    updateConfig('website_price_list_categories', categories)
  }

  const updatePriceListItem = (categoryIndex: number, itemIndex: number, field: string, value: any) => {
    const categories = [...(config.website_price_list_categories || [])]
    categories[categoryIndex].items[itemIndex] = {
      ...categories[categoryIndex].items[itemIndex],
      [field]: value,
    }
    updateConfig('website_price_list_categories', categories)
  }

  const removePriceListItem = (categoryIndex: number, itemIndex: number) => {
    const categories = [...(config.website_price_list_categories || [])]
    categories[categoryIndex].items.splice(itemIndex, 1)
    updateConfig('website_price_list_categories', categories)
  }

  // Team members management
  const addTeamMember = () => {
    const team = config.website_team || []
    team.push({
      name: 'Nome Membro',
      role: 'Ruolo',
      bio: 'Breve biografia...',
      image: '',
      linkedin: '',
      email: '',
    })
    updateConfig('website_team', team)
  }

  const updateTeamMember = (index: number, field: string, value: any) => {
    const team = [...(config.website_team || [])]
    team[index] = { ...team[index], [field]: value }
    updateConfig('website_team', team)
  }

  const removeTeamMember = (index: number) => {
    const team = [...(config.website_team || [])]
    team.splice(index, 1)
    updateConfig('website_team', team)
  }

  // Video management
  const addVideo = () => {
    const videos = config.website_videos || []
    videos.push({
      title: 'Titolo Video',
      url: '',
      thumbnail: '',
      description: '',
    })
    updateConfig('website_videos', videos)
  }

  const updateVideo = (index: number, field: string, value: any) => {
    const videos = [...(config.website_videos || [])]
    videos[index] = { ...videos[index], [field]: value }
    updateConfig('website_videos', videos)
  }

  const removeVideo = (index: number) => {
    const videos = [...(config.website_videos || [])]
    videos.splice(index, 1)
    updateConfig('website_videos', videos)
  }

  // Custom sections management
  const addCustomSection = () => {
    const sections = config.website_custom_sections || []
    sections.push({
      id: `section-${Date.now()}`,
      title: 'Nuova Sezione',
      content: 'Contenuto della sezione...',
      visible: true,
      menuLabel: 'Menu',
      order: sections.length,
      backgroundColor: '#ffffff',
      textColor: '#000000',
      image: '',
      imagePosition: 'right',
      overlayOpacity: 0.5,
      enableParallax: false,
    })
    updateConfig('website_custom_sections', sections)
  }

  const updateCustomSection = (index: number, field: string, value: any) => {
    const sections = [...(config.website_custom_sections || [])]
    sections[index] = { ...sections[index], [field]: value }
    updateConfig('website_custom_sections', sections)
  }

  const removeCustomSection = (index: number) => {
    const sections = [...(config.website_custom_sections || [])]
    sections.splice(index, 1)
    updateConfig('website_custom_sections', sections)
  }

  const moveCustomSection = (index: number, direction: 'up' | 'down') => {
    const sections = [...(config.website_custom_sections || [])]
    if (direction === 'up' && index > 0) {
      [sections[index - 1], sections[index]] = [sections[index], sections[index - 1]]
    } else if (direction === 'down' && index < sections.length - 1) {
      [sections[index], sections[index + 1]] = [sections[index + 1], sections[index]]
    }
    // Update order property
    sections.forEach((section, i) => {
      section.order = i
    })
    updateConfig('website_custom_sections', sections)
  }

  // Filtra i tab in base ai toggle attivi
  const tabs = allTabsDefinition.filter(tab => tab.alwaysShow || config[tab.toggleKey as keyof typeof config])

  if (loading) {
    return <div className="p-8 text-center">Caricamento...</div>
  }

  return (
    <div className="website-config-panel">
      {/* Header */}
      <div className="config-header">
        <button onClick={onBack} className="back-button">
          <X className="w-5 h-5" />
          Chiudi
        </button>
        <h2>Configurazione Sito Web</h2>
        <div className="header-actions">
          <a
            href={`/w/${organizationSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-preview"
          >
            <Eye className="w-5 h-5" />
            Anteprima
          </a>
          <button onClick={saveConfig} disabled={saving} className="btn-save">
            <Save className="w-5 h-5" />
            {saving ? 'Salvataggio...' : 'Salva'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="config-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            style={{
              borderBottomColor: activeTab === tab.id ? primaryColor : 'transparent',
            }}
          >
            <tab.icon className="w-5 h-5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="config-content">
        {/* Contenuti Tab */}
        {activeTab === 'content' && (
          <>
            {/* Maintenance Mode Warning */}
            {config.website_maintenance_mode && (
              <div style={{
                background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                border: '2px solid #f59e0b',
                borderRadius: 'var(--omnily-border-radius-lg)',
                padding: 'var(--omnily-spacing-4)',
                marginBottom: 'var(--omnily-spacing-6)',
                color: 'white'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--omnily-spacing-3)' }}>
                  <Settings size={24} />
                  <div>
                    <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>🔧 Sito in Modalità Manutenzione</h4>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', opacity: 0.9 }}>
                      I visitatori vedranno la pagina "Sito in Manutenzione" invece del sito normale
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Maintenance Mode Toggle */}
            <div className="config-section" style={{ marginBottom: 'var(--omnily-spacing-6)', background: '#f8fafc', padding: 'var(--omnily-spacing-5)', borderRadius: 'var(--omnily-border-radius-lg)', border: '2px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--omnily-spacing-4)', marginBottom: 'var(--omnily-spacing-4)' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: 'var(--omnily-border-radius-md)',
                  background: `linear-gradient(135deg, ${primaryColor}15, ${primaryColor}25)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Settings size={24} style={{ color: primaryColor }} />
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#1f2937' }}>⚙️ Modalità Manutenzione</h3>
                  <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '0.95rem' }}>
                    Quando attiva, i visitatori vedranno una pagina di manutenzione invece del sito
                  </p>
                </div>
              </div>

              <ToggleSwitch
                checked={config.website_maintenance_mode || false}
                onChange={(checked) => updateConfig('website_maintenance_mode', checked)}
                label="Attiva Modalità Manutenzione"
                description={config.website_maintenance_mode
                  ? "🔧 Il sito mostra la pagina di manutenzione - Disattiva quando il sito è pronto"
                  : "Il sito è online e accessibile a tutti"}
                primaryColor={primaryColor}
              />

              {config.website_maintenance_mode && (
                <div style={{ marginTop: 'var(--omnily-spacing-4)', paddingTop: 'var(--omnily-spacing-4)', borderTop: '1px solid #e5e7eb' }}>
                  <div className="form-group">
                    <label>💬 Messaggio Personalizzato (opzionale)</label>
                    <textarea
                      value={config.website_maintenance_message || ''}
                      onChange={(e) => updateConfig('website_maintenance_message', e.target.value)}
                      placeholder="Es: Stiamo lavorando per migliorare la tua esperienza. Torneremo presto online!"
                      rows={3}
                      style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '2px solid #e5e7eb' }}
                    />
                    <small style={{ color: '#6b7280', fontSize: '0.85rem' }}>
                      Lascia vuoto per usare il messaggio predefinito
                    </small>
                  </div>

                  <div className="form-group" style={{ marginTop: 'var(--omnily-spacing-3)' }}>
                    <label>🕐 Ritorno Previsto (opzionale)</label>
                    <input
                      type="datetime-local"
                      value={config.website_maintenance_until || ''}
                      onChange={(e) => updateConfig('website_maintenance_until', e.target.value)}
                      style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '2px solid #e5e7eb' }}
                    />
                    <small style={{ color: '#6b7280', fontSize: '0.85rem' }}>
                      Mostra ai visitatori quando tornerai online
                    </small>
                  </div>
                </div>
              )}
            </div>

            {/* Info cards all'inizio */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--omnily-spacing-4)', marginBottom: 'var(--omnily-spacing-8)' }}>
              <InfoCard
                icon={Sparkles}
                title="Prima Impressione Perfetta"
                description="La sezione Hero è la prima cosa che vedono i tuoi clienti. Rendila memorabile con un messaggio potente e immagini emozionanti."
                primaryColor={primaryColor}
              />
              <InfoCard
                icon={Target}
                title="Comunica i Tuoi Valori"
                description="Usa la sezione Chi Siamo per connetterti emotivamente con i clienti. Racconta chi sei, cosa ti rende unico e perché dovrebbero sceglierti."
                primaryColor={primaryColor}
              />
              <InfoCard
                icon={Heart}
                title="Costruisci Fiducia"
                description="Ogni dettaglio conta. Personalizza ogni testo, immagine e colore per creare un'esperienza che rispecchia il tuo brand."
                primaryColor={primaryColor}
              />
            </div>

            {/* Hero Section */}
            <div className="config-section" style={{ marginBottom: 'var(--omnily-spacing-6)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--omnily-spacing-3)', marginBottom: 'var(--omnily-spacing-6)' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: 'var(--omnily-border-radius-lg)',
                  background: `linear-gradient(135deg, ${primaryColor}20, ${primaryColor}10)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Zap size={24} style={{ color: primaryColor }} />
                </div>
                <div>
                  <h3 style={{ margin: 0 }}>🎯 Sezione Hero - La Tua Vetrina</h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: 'var(--omnily-font-size-sm)', color: 'var(--omnily-gray-600)' }}>
                    Cattura l'attenzione in 3 secondi con un messaggio potente
                  </p>
                </div>
              </div>

              {/* Hero Override con Info dal Branding */}
              <div style={{
                padding: 'var(--omnily-spacing-4)',
                background: `${primaryColor}10`,
                borderRadius: 'var(--omnily-border-radius-lg)',
                border: `2px solid ${primaryColor}20`,
                marginBottom: 'var(--omnily-spacing-4)'
              }}>
                <div style={{ display: 'flex', alignItems: 'start', gap: 'var(--omnily-spacing-3)' }}>
                  <Lightbulb size={20} style={{ color: primaryColor, flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <h5 style={{ margin: '0 0 var(--omnily-spacing-2) 0', fontSize: 'var(--omnily-font-size-base)', fontWeight: 700, color: primaryColor }}>
                      📋 Default dal Branding
                    </h5>
                    <p style={{ margin: 0, fontSize: 'var(--omnily-font-size-sm)', color: 'var(--omnily-gray-700)', lineHeight: 1.6 }}>
                      <strong>Nome Organizzazione:</strong> {organizationSlug}<br />
                      <strong>Tagline:</strong> {/* Mostra tagline dal branding */}
                    </p>
                    <p style={{ margin: 'var(--omnily-spacing-2) 0 0 0', fontSize: 'var(--omnily-font-size-xs)', color: 'var(--omnily-gray-600)', lineHeight: 1.5 }}>
                      💡 Questi valori vengono presi automaticamente dal tuo <strong>Branding</strong>. <br/>
                      Usa i campi qui sotto <strong>solo se vuoi un testo diverso</strong> nella Hero del sito.
                    </p>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>✨ Titolo Hero (Opzionale - Override)</label>
                <input
                  type="text"
                  value={config.website_hero_title_override || ''}
                  onChange={(e) => updateConfig('website_hero_title_override', e.target.value)}
                  placeholder={`Lascia vuoto per usare: "${organizationSlug}"`}
                />
                <small style={{ display: 'block', marginTop: '8px', color: 'var(--omnily-gray-500)', fontSize: 'var(--omnily-font-size-xs)' }}>
                  ℹ️ Se vuoto, usa il nome dell'organizzazione dal Branding
                </small>
              </div>

              <div className="form-group">
                <label>📝 Tagline Hero (Opzionale - Override)</label>
                <input
                  type="text"
                  value={config.website_hero_subtitle_override || ''}
                  onChange={(e) => updateConfig('website_hero_subtitle_override', e.target.value)}
                  placeholder="Lascia vuoto per usare il tagline dal Branding"
                />
                <small style={{ display: 'block', marginTop: '8px', color: 'var(--omnily-gray-500)', fontSize: 'var(--omnily-font-size-xs)' }}>
                  ℹ️ Se vuoto, usa il tagline dal Branding
                </small>
              </div>

              <div className="form-group">
                <label>💬 Sottotitolo Hero Aggiuntivo (Opzionale)</label>
                <input
                  type="text"
                  value={config.website_hero_subtitle || ''}
                  onChange={(e) => updateConfig('website_hero_subtitle', e.target.value)}
                  placeholder="Testo aggiuntivo sotto la tagline (lascia vuoto se non serve)"
                />
                <small style={{ display: 'block', marginTop: '8px', color: 'var(--omnily-gray-500)', fontSize: 'var(--omnily-font-size-xs)' }}>
                  ℹ️ Questo testo appare sotto la tagline. Lascia vuoto se vuoi solo nome + tagline
                </small>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>🎯 Testo Bottone Primario (CTA)</label>
                  <input
                    type="text"
                    value={config.website_hero_cta_primary || ''}
                    onChange={(e) => updateConfig('website_hero_cta_primary', e.target.value)}
                    placeholder="es: Scopri i Vantaggi"
                  />
                </div>

                <div className="form-group">
                  <label>💬 Testo Bottone Secondario</label>
                  <input
                    type="text"
                    value={config.website_hero_cta_secondary || ''}
                    onChange={(e) => updateConfig('website_hero_cta_secondary', e.target.value)}
                    placeholder="es: Parla con Noi"
                  />
                </div>
              </div>

              <ImageUploader
                label="🖼️ Immagine Hero di Sfondo"
                value={config.website_hero_image || ''}
                onChange={(url) => updateConfig('website_hero_image', url)}
                folder="hero"
              />

              {/* Live Preview Hero */}
              {config.website_hero_image && (
                <div style={{ marginTop: 'var(--omnily-spacing-6)' }}>
                  <label style={{
                    display: 'block',
                    fontWeight: 600,
                    color: 'var(--omnily-gray-700)',
                    marginBottom: 'var(--omnily-spacing-3)',
                    fontSize: 'var(--omnily-font-size-sm)'
                  }}>
                    👁️ Anteprima Live Hero
                  </label>
                  <div style={{
                    position: 'relative',
                    width: '100%',
                    height: config.website_hero_height === 'full' ? '400px' : config.website_hero_height === 'medium' ? '300px' : '200px',
                    borderRadius: 'var(--omnily-border-radius-xl)',
                    overflow: 'hidden',
                    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
                    transition: 'all 0.3s ease'
                  }}>
                    {/* Background Image */}
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      backgroundImage: `url(${config.website_hero_image})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      transform: config.website_hero_enable_parallax ? 'scale(1.1)' : 'scale(1)',
                      transition: 'transform 0.3s ease'
                    }} />

                    {/* Overlay */}
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      backgroundColor: config.website_hero_overlay_color || '#000000',
                      opacity: config.website_hero_overlay_opacity || 0.5
                    }} />

                    {/* Particles Effect Preview (if enabled) */}
                    {config.website_hero_enable_particles && (
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)',
                        backgroundSize: '50px 50px',
                        animation: 'particlesFloat 20s linear infinite'
                      }} />
                    )}

                    {/* Content */}
                    <div style={{
                      position: 'relative',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: config.website_hero_text_position === 'left' ? 'flex-start' : config.website_hero_text_position === 'right' ? 'flex-end' : 'center',
                      justifyContent: 'center',
                      padding: 'var(--omnily-spacing-8)',
                      textAlign: config.website_hero_text_position === 'left' ? 'left' : config.website_hero_text_position === 'right' ? 'right' : 'center',
                      color: 'white'
                    }}>
                      <h1 style={{
                        fontSize: '2.5rem',
                        fontWeight: 700,
                        margin: '0 0 var(--omnily-spacing-4) 0',
                        textShadow: '0 2px 10px rgba(0,0,0,0.3)'
                      }}>
                        {config.website_hero_title || 'Il Tuo Titolo Hero'}
                      </h1>
                      <p style={{
                        fontSize: '1.25rem',
                        margin: '0 0 var(--omnily-spacing-6) 0',
                        textShadow: '0 2px 8px rgba(0,0,0,0.3)',
                        maxWidth: '600px'
                      }}>
                        {config.website_hero_subtitle || 'Il tuo sottotitolo accattivante'}
                      </p>

                      {/* Buttons Preview */}
                      <div style={{ display: 'flex', gap: 'var(--omnily-spacing-3)', flexWrap: 'wrap' }}>
                        {config.website_hero_button1_text && (
                          <button style={{
                            padding: 'var(--omnily-spacing-3) var(--omnily-spacing-6)',
                            borderRadius: 'var(--omnily-border-radius)',
                            border: config.website_hero_button1_style === 'outline' ? '2px solid white' : 'none',
                            background: config.website_hero_button1_style === 'primary' ? primaryColor : config.website_hero_button1_style === 'secondary' ? 'white' : 'transparent',
                            color: config.website_hero_button1_style === 'secondary' ? primaryColor : 'white',
                            fontWeight: 600,
                            cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                          }}>
                            {config.website_hero_button1_text}
                          </button>
                        )}
                        {config.website_hero_button2_text && (
                          <button style={{
                            padding: 'var(--omnily-spacing-3) var(--omnily-spacing-6)',
                            borderRadius: 'var(--omnily-border-radius)',
                            border: config.website_hero_button2_style === 'outline' ? '2px solid white' : 'none',
                            background: config.website_hero_button2_style === 'primary' ? primaryColor : config.website_hero_button2_style === 'secondary' ? 'white' : 'transparent',
                            color: config.website_hero_button2_style === 'secondary' ? primaryColor : 'white',
                            fontWeight: 600,
                            cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                          }}>
                            {config.website_hero_button2_text}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Effects Indicators */}
                  <div style={{
                    marginTop: 'var(--omnily-spacing-3)',
                    display: 'flex',
                    gap: 'var(--omnily-spacing-2)',
                    flexWrap: 'wrap'
                  }}>
                    {config.website_hero_enable_parallax && (
                      <span style={{
                        padding: '4px 12px',
                        background: `${primaryColor}15`,
                        color: primaryColor,
                        borderRadius: 'var(--omnily-border-radius)',
                        fontSize: 'var(--omnily-font-size-xs)',
                        fontWeight: 600
                      }}>
                        🌊 Parallax Attivo
                      </span>
                    )}
                    {config.website_hero_enable_particles && (
                      <span style={{
                        padding: '4px 12px',
                        background: `${primaryColor}15`,
                        color: primaryColor,
                        borderRadius: 'var(--omnily-border-radius)',
                        fontSize: 'var(--omnily-font-size-xs)',
                        fontWeight: 600
                      }}>
                        ✨ Particelle Attive
                      </span>
                    )}
                    <span style={{
                      padding: '4px 12px',
                      background: 'var(--omnily-gray-100)',
                      color: 'var(--omnily-gray-700)',
                      borderRadius: 'var(--omnily-border-radius)',
                      fontSize: 'var(--omnily-font-size-xs)',
                      fontWeight: 600
                    }}>
                      📐 Altezza: {config.website_hero_height === 'full' ? 'Full' : config.website_hero_height === 'medium' ? 'Media' : 'Piccola'}
                    </span>
                    <span style={{
                      padding: '4px 12px',
                      background: 'var(--omnily-gray-100)',
                      color: 'var(--omnily-gray-700)',
                      borderRadius: 'var(--omnily-border-radius)',
                      fontSize: 'var(--omnily-font-size-xs)',
                      fontWeight: 600
                    }}>
                      📍 Testo: {config.website_hero_text_position === 'left' ? 'Sinistra' : config.website_hero_text_position === 'right' ? 'Destra' : 'Centro'}
                    </span>
                  </div>

                  {/* Particles Animation CSS */}
                  <style>{`
                    @keyframes particlesFloat {
                      0% {
                        transform: translateY(0) translateX(0);
                      }
                      100% {
                        transform: translateY(-100px) translateX(50px);
                      }
                    }
                  `}</style>
                </div>
              )}

              {/* Advanced Hero Customization */}
              <div style={{ marginTop: 'var(--omnily-spacing-8)', paddingTop: 'var(--omnily-spacing-6)', borderTop: '2px solid var(--omnily-border-color)' }}>
                <h4 style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--omnily-spacing-2)',
                  marginBottom: 'var(--omnily-spacing-6)',
                  fontSize: 'var(--omnily-font-size-lg)',
                  fontWeight: 700,
                  color: primaryColor
                }}>
                  <Palette size={20} />
                  🎨 Personalizzazione Avanzata Hero
                </h4>

                {/* Overlay Settings */}
                <div style={{
                  background: 'var(--omnily-gray-50)',
                  padding: 'var(--omnily-spacing-5)',
                  borderRadius: 'var(--omnily-border-radius-lg)',
                  marginBottom: 'var(--omnily-spacing-5)'
                }}>
                  <h5 style={{ marginTop: 0, marginBottom: 'var(--omnily-spacing-4)', fontSize: 'var(--omnily-font-size-base)', fontWeight: 600 }}>
                    🌈 Effetti Overlay
                  </h5>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Colore Overlay</label>
                      <input
                        type="color"
                        value={config.website_hero_overlay_color || '#000000'}
                        onChange={(e) => updateConfig('website_hero_overlay_color', e.target.value)}
                        style={{ height: '48px', cursor: 'pointer' }}
                      />
                      <small style={{ display: 'block', marginTop: '8px', color: 'var(--omnily-gray-500)', fontSize: 'var(--omnily-font-size-xs)' }}>
                        💡 Usa nero per drammaticità, bianco per luminosità
                      </small>
                    </div>
                    <div className="form-group">
                      <label>Opacità Overlay: {Math.round((config.website_hero_overlay_opacity || 0.5) * 100)}%</label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={(config.website_hero_overlay_opacity || 0.5) * 100}
                        onChange={(e) => updateConfig('website_hero_overlay_opacity', parseFloat(e.target.value) / 100)}
                        style={{ width: '100%', cursor: 'pointer' }}
                      />
                      <small style={{ display: 'block', marginTop: '8px', color: 'var(--omnily-gray-500)', fontSize: 'var(--omnily-font-size-xs)' }}>
                        💡 30-60% è ideale per leggibilità del testo
                      </small>
                    </div>
                  </div>
                </div>

                {/* Configurable Buttons */}
                <div style={{
                  background: 'var(--omnily-gray-50)',
                  padding: 'var(--omnily-spacing-5)',
                  borderRadius: 'var(--omnily-border-radius-lg)',
                  marginBottom: 'var(--omnily-spacing-5)'
                }}>
                  <h5 style={{ marginTop: 0, marginBottom: 'var(--omnily-spacing-4)', fontSize: 'var(--omnily-font-size-base)', fontWeight: 600 }}>
                    🔘 Bottoni Call-to-Action Personalizzabili
                  </h5>

                  {/* Button 1 */}
                  <div style={{ marginBottom: 'var(--omnily-spacing-5)', paddingBottom: 'var(--omnily-spacing-5)', borderBottom: '1px solid var(--omnily-border-color)' }}>
                    <p style={{ fontWeight: 600, marginBottom: 'var(--omnily-spacing-3)', color: 'var(--omnily-gray-700)' }}>
                      Bottone Primario
                    </p>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Testo Bottone</label>
                        <input
                          type="text"
                          value={config.website_hero_button1_text || 'Scopri di Più'}
                          onChange={(e) => updateConfig('website_hero_button1_text', e.target.value)}
                          placeholder="es: Inizia Ora, Scopri di Più"
                        />
                      </div>
                      <div className="form-group">
                        <label>Link Destinazione</label>
                        <input
                          type="text"
                          value={config.website_hero_button1_link || ''}
                          onChange={(e) => updateConfig('website_hero_button1_link', e.target.value)}
                          placeholder="es: #loyalty, https://..."
                        />
                      </div>
                      <div className="form-group">
                        <label>Stile Bottone</label>
                        <select
                          value={config.website_hero_button1_style || 'primary'}
                          onChange={(e) => updateConfig('website_hero_button1_style', e.target.value)}
                        >
                          <option value="primary">Primario (Pieno)</option>
                          <option value="secondary">Secondario (Neutro)</option>
                          <option value="outline">Outline (Trasparente)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Button 2 */}
                  <div>
                    <p style={{ fontWeight: 600, marginBottom: 'var(--omnily-spacing-3)', color: 'var(--omnily-gray-700)' }}>
                      Bottone Secondario
                    </p>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Testo Bottone</label>
                        <input
                          type="text"
                          value={config.website_hero_button2_text || 'Contattaci'}
                          onChange={(e) => updateConfig('website_hero_button2_text', e.target.value)}
                          placeholder="es: Contattaci, Prenota Ora"
                        />
                      </div>
                      <div className="form-group">
                        <label>Link Destinazione</label>
                        <input
                          type="text"
                          value={config.website_hero_button2_link || ''}
                          onChange={(e) => updateConfig('website_hero_button2_link', e.target.value)}
                          placeholder="es: #contact, tel:+39..."
                        />
                      </div>
                      <div className="form-group">
                        <label>Stile Bottone</label>
                        <select
                          value={config.website_hero_button2_style || 'secondary'}
                          onChange={(e) => updateConfig('website_hero_button2_style', e.target.value)}
                        >
                          <option value="primary">Primario (Pieno)</option>
                          <option value="secondary">Secondario (Neutro)</option>
                          <option value="outline">Outline (Trasparente)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Layout & Effects */}
                <div style={{
                  background: 'var(--omnily-gray-50)',
                  padding: 'var(--omnily-spacing-5)',
                  borderRadius: 'var(--omnily-border-radius-lg)'
                }}>
                  <h5 style={{ marginTop: 0, marginBottom: 'var(--omnily-spacing-4)', fontSize: 'var(--omnily-font-size-base)', fontWeight: 600 }}>
                    ✨ Layout ed Effetti Movimento
                  </h5>

                  <div className="form-row" style={{ marginBottom: 'var(--omnily-spacing-4)' }}>
                    <div className="form-group">
                      <label>Posizione Testo</label>
                      <select
                        value={config.website_hero_text_position || 'center'}
                        onChange={(e) => updateConfig('website_hero_text_position', e.target.value)}
                      >
                        <option value="left">⬅️ Sinistra (Moderno)</option>
                        <option value="center">⬆️ Centro (Classico)</option>
                        <option value="right">➡️ Destra (Unico)</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Altezza Hero</label>
                      <select
                        value={config.website_hero_height || 'full'}
                        onChange={(e) => updateConfig('website_hero_height', e.target.value)}
                      >
                        <option value="full">📐 Schermo Intero (Dramatic)</option>
                        <option value="medium">📏 Media (Balanced)</option>
                        <option value="small">📌 Piccola (Compact)</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--omnily-spacing-3)' }}>
                    <ToggleSwitch
                      checked={config.website_hero_enable_parallax ?? true}
                      onChange={(checked) => updateConfig('website_hero_enable_parallax', checked)}
                      label="🌊 Effetto Parallax"
                      description="Movimento di profondità durante lo scroll - crea un effetto WOW tridimensionale"
                      primaryColor={primaryColor}
                    />

                    <ToggleSwitch
                      checked={config.website_hero_enable_particles ?? false}
                      onChange={(checked) => updateConfig('website_hero_enable_particles', checked)}
                      label="✨ Particelle Animate"
                      description="Effetto particelle galleggianti per un look premium e moderno"
                      primaryColor={primaryColor}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* About Section */}
            <div className="config-section" style={{ marginBottom: 'var(--omnily-spacing-6)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--omnily-spacing-3)', marginBottom: 'var(--omnily-spacing-6)' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: 'var(--omnily-border-radius-lg)',
                  background: `linear-gradient(135deg, ${primaryColor}20, ${primaryColor}10)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Heart size={24} style={{ color: primaryColor }} />
                </div>
                <div>
                  <h3 style={{ margin: 0 }}>❤️ Sezione Chi Siamo - La Tua Storia</h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: 'var(--omnily-font-size-sm)', color: 'var(--omnily-gray-600)' }}>
                    Condividi la tua storia e crea una connessione autentica
                  </p>
                </div>
              </div>

              <div className="form-group">
                <label>🏷️ Titolo Sezione Chi Siamo</label>
                <input
                  type="text"
                  value={config.website_about_title || ''}
                  onChange={(e) => updateConfig('website_about_title', e.target.value)}
                  placeholder="es: La Nostra Passione dal 1990"
                />
              </div>

              <div className="form-group">
                <label>📖 La Tua Storia (Descrizione Azienda)</label>
                <textarea
                  rows={6}
                  value={config.website_description || ''}
                  onChange={(e) => updateConfig('website_description', e.target.value)}
                  placeholder="Racconta chi sei, cosa ti rende speciale, quali valori guidano il tuo business. Parla del tuo impegno verso i clienti e della tua visione..."
                />
                <small style={{ display: 'block', marginTop: '8px', color: 'var(--omnily-gray-500)', fontSize: 'var(--omnily-font-size-xs)' }}>
                  💡 Consiglio: Sii autentico! I clienti si connettono con storie vere e passione genuina
                </small>
              </div>

              {/* Statistics Section */}
              <div style={{
                marginTop: 'var(--omnily-spacing-6)',
                padding: 'var(--omnily-spacing-5)',
                background: 'var(--omnily-gray-50)',
                borderRadius: 'var(--omnily-border-radius-xl)',
                border: '2px solid var(--omnily-border-color)'
              }}>
                <h4 style={{
                  margin: '0 0 var(--omnily-spacing-4) 0',
                  fontSize: 'var(--omnily-font-size-lg)',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--omnily-spacing-2)'
                }}>
                  📊 Statistiche Aziendali
                  <span style={{ fontSize: 'var(--omnily-font-size-sm)', fontWeight: 400, color: 'var(--omnily-gray-600)' }}>
                    (Es: 500+ clienti, 98% soddisfazione)
                  </span>
                </h4>

                <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                  {/* Stat 1 */}
                  <div className="form-group">
                    <label>Statistica 1 - Valore</label>
                    <input
                      type="text"
                      value={config.website_about_stat1_value || '500+'}
                      onChange={(e) => updateConfig('website_about_stat1_value', e.target.value)}
                      placeholder="es: 500+"
                    />
                  </div>
                  <div className="form-group">
                    <label>Statistica 1 - Etichetta</label>
                    <input
                      type="text"
                      value={config.website_about_stat1_label || 'Clienti Felici'}
                      onChange={(e) => updateConfig('website_about_stat1_label', e.target.value)}
                      placeholder="es: Clienti Felici"
                    />
                  </div>

                  {/* Stat 2 */}
                  <div className="form-group">
                    <label>Statistica 2 - Valore</label>
                    <input
                      type="text"
                      value={config.website_about_stat2_value || '15+'}
                      onChange={(e) => updateConfig('website_about_stat2_value', e.target.value)}
                      placeholder="es: 15+"
                    />
                  </div>
                  <div className="form-group">
                    <label>Statistica 2 - Etichetta</label>
                    <input
                      type="text"
                      value={config.website_about_stat2_label || 'Anni di Esperienza'}
                      onChange={(e) => updateConfig('website_about_stat2_label', e.target.value)}
                      placeholder="es: Anni di Esperienza"
                    />
                  </div>

                  {/* Stat 3 */}
                  <div className="form-group">
                    <label>Statistica 3 - Valore</label>
                    <input
                      type="text"
                      value={config.website_about_stat3_value || '98%'}
                      onChange={(e) => updateConfig('website_about_stat3_value', e.target.value)}
                      placeholder="es: 98%"
                    />
                  </div>
                  <div className="form-group">
                    <label>Statistica 3 - Etichetta</label>
                    <input
                      type="text"
                      value={config.website_about_stat3_label || 'Soddisfazione'}
                      onChange={(e) => updateConfig('website_about_stat3_label', e.target.value)}
                      placeholder="es: Soddisfazione"
                    />
                  </div>

                  {/* Stat 4 */}
                  <div className="form-group">
                    <label>Statistica 4 - Valore</label>
                    <input
                      type="text"
                      value={config.website_about_stat4_value || '24/7'}
                      onChange={(e) => updateConfig('website_about_stat4_value', e.target.value)}
                      placeholder="es: 24/7"
                    />
                  </div>
                  <div className="form-group">
                    <label>Statistica 4 - Etichetta</label>
                    <input
                      type="text"
                      value={config.website_about_stat4_label || 'Supporto'}
                      onChange={(e) => updateConfig('website_about_stat4_label', e.target.value)}
                      placeholder="es: Supporto"
                    />
                  </div>
                </div>

                <small style={{ display: 'block', marginTop: '12px', color: 'var(--omnily-gray-600)', fontSize: 'var(--omnily-font-size-xs)' }}>
                  💡 Usa numeri che impressionano! Clienti serviti, anni di esperienza, percentuale di soddisfazione, etc.
                </small>
              </div>
            </div>

            {/* Footer Section */}
            <div className="config-section" style={{ marginBottom: 'var(--omnily-spacing-6)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--omnily-spacing-3)', marginBottom: 'var(--omnily-spacing-6)' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: 'var(--omnily-border-radius-lg)',
                  background: `linear-gradient(135deg, ${primaryColor}20, ${primaryColor}10)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Layout size={24} style={{ color: primaryColor }} />
                </div>
                <div>
                  <h3 style={{ margin: 0 }}>🎨 Footer - Tocco Finale</h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: 'var(--omnily-font-size-sm)', color: 'var(--omnily-gray-600)' }}>
                    Personalizza il footer del tuo sito
                  </p>
                </div>
              </div>

              <div className="form-group">
                <label>© Testo Copyright Footer</label>
                <input
                  type="text"
                  value={config.website_footer_text || ''}
                  onChange={(e) => updateConfig('website_footer_text', e.target.value)}
                  placeholder="es: © 2024 Nome Azienda. Tutti i diritti riservati."
                />
              </div>

              <div style={{ position: 'relative' }}>
                <ToggleSwitch
                  checked={config.website_show_powered_by ?? true}
                  onChange={(checked) => {
                    // Allow disabling only for professional+ plans
                    const isProfessionalOrHigher = config.subscription_tier && ['professional', 'enterprise', 'premium'].includes(config.subscription_tier.toLowerCase())
                    if (!checked && !isProfessionalOrHigher) {
                      // Cannot disable on basic plan
                      return
                    }
                    updateConfig('website_show_powered_by', checked)
                  }}
                  label="Mostra 'Powered by OMNILY PRO'"
                  description={
                    config.subscription_tier && ['professional', 'enterprise', 'premium'].includes(config.subscription_tier.toLowerCase())
                      ? "Supporta OMNILY PRO mostrando il badge nel footer"
                      : "🔒 Rimuovi il badge con il piano Professional o superiore"
                  }
                  primaryColor={primaryColor}
                  disabled={!(config.subscription_tier && ['professional', 'enterprise', 'premium'].includes(config.subscription_tier.toLowerCase())) && !(config.website_show_powered_by ?? true)}
                />

                {/* Upgrade notice for basic users */}
                {!(config.subscription_tier && ['professional', 'enterprise', 'premium'].includes(config.subscription_tier.toLowerCase())) && (
                  <div style={{
                    marginTop: 'var(--omnily-spacing-3)',
                    padding: 'var(--omnily-spacing-4)',
                    background: `linear-gradient(135deg, ${primaryColor}10, ${primaryColor}05)`,
                    borderRadius: 'var(--omnily-border-radius-lg)',
                    border: `1px solid ${primaryColor}30`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--omnily-spacing-3)'
                  }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '20px',
                      flexShrink: 0
                    }}>
                      🚀
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{
                        margin: 0,
                        fontWeight: 600,
                        fontSize: 'var(--omnily-font-size-sm)',
                        color: 'var(--omnily-gray-900)'
                      }}>
                        Rimuovi il badge e ottieni il massimo dal tuo sito
                      </p>
                      <p style={{
                        margin: '4px 0 0 0',
                        fontSize: 'var(--omnily-font-size-xs)',
                        color: 'var(--omnily-gray-600)',
                        lineHeight: 1.4
                      }}>
                        Passa al piano <strong>Professional</strong> per rimuovere il badge "Powered by" e dare al tuo sito un aspetto completamente personalizzato
                      </p>
                    </div>
                    <button
                      onClick={() => window.open('/pricing', '_blank')}
                      style={{
                        padding: 'var(--omnily-spacing-3) var(--omnily-spacing-5)',
                        background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)`,
                        color: 'white',
                        border: 'none',
                        borderRadius: 'var(--omnily-border-radius)',
                        fontWeight: 600,
                        fontSize: 'var(--omnily-font-size-sm)',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                        whiteSpace: 'nowrap'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)'
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)'
                      }}
                    >
                      Upgrade
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Social Media Section */}
            <div className="config-section" style={{ marginBottom: 'var(--omnily-spacing-6)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--omnily-spacing-3)', marginBottom: 'var(--omnily-spacing-6)' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: 'var(--omnily-border-radius-lg)',
                  background: `linear-gradient(135deg, ${primaryColor}20, ${primaryColor}10)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Globe size={24} style={{ color: primaryColor }} />
                </div>
                <div>
                  <h3 style={{ margin: 0 }}>🌐 Social Media - Collegati con i Clienti</h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: 'var(--omnily-font-size-sm)', color: 'var(--omnily-gray-600)' }}>
                    Aggiungi i link ai tuoi profili social - appariranno nel footer
                  </p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--omnily-spacing-4)' }}>
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Facebook size={18} style={{ color: '#1877f2' }} />
                    Facebook
                  </label>
                  <input
                    type="url"
                    value={config.facebook_url || ''}
                    onChange={(e) => updateConfig('facebook_url', e.target.value)}
                    placeholder="https://facebook.com/tuapagina"
                  />
                </div>

                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Instagram size={18} style={{ color: '#E4405F' }} />
                    Instagram
                  </label>
                  <input
                    type="url"
                    value={config.instagram_url || ''}
                    onChange={(e) => updateConfig('instagram_url', e.target.value)}
                    placeholder="https://instagram.com/tuoprofilo"
                  />
                </div>

                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Twitter size={18} style={{ color: '#1DA1F2' }} />
                    Twitter / X
                  </label>
                  <input
                    type="url"
                    value={config.twitter_url || ''}
                    onChange={(e) => updateConfig('twitter_url', e.target.value)}
                    placeholder="https://twitter.com/tuoprofilo"
                  />
                </div>

                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Linkedin size={18} style={{ color: '#0A66C2' }} />
                    LinkedIn
                  </label>
                  <input
                    type="url"
                    value={config.linkedin_url || ''}
                    onChange={(e) => updateConfig('linkedin_url', e.target.value)}
                    placeholder="https://linkedin.com/company/tuaazienda"
                  />
                </div>

                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Youtube size={18} style={{ color: '#FF0000' }} />
                    YouTube
                  </label>
                  <input
                    type="url"
                    value={config.youtube_url || ''}
                    onChange={(e) => updateConfig('youtube_url', e.target.value)}
                    placeholder="https://youtube.com/@tuocanale"
                  />
                </div>

                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <LinkIcon size={18} style={{ color: primaryColor }} />
                    TikTok
                  </label>
                  <input
                    type="url"
                    value={config.tiktok_url || ''}
                    onChange={(e) => updateConfig('tiktok_url', e.target.value)}
                    placeholder="https://tiktok.com/@tuoprofilo"
                  />
                </div>
              </div>
            </div>

            {/* Visibility Section */}
            <div className="config-section">
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--omnily-spacing-3)', marginBottom: 'var(--omnily-spacing-6)' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: 'var(--omnily-border-radius-lg)',
                  background: `linear-gradient(135deg, ${primaryColor}20, ${primaryColor}10)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Settings size={24} style={{ color: primaryColor }} />
                </div>
                <div>
                  <h3 style={{ margin: 0 }}>⚙️ Gestisci Visibilità Sezioni</h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: 'var(--omnily-font-size-sm)', color: 'var(--omnily-gray-600)' }}>
                    Attiva o disattiva le sezioni che vuoi mostrare sul tuo sito web
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--omnily-spacing-3)' }}>
                {[
                  {
                    key: 'website_show_hero',
                    label: '🎯 Hero Section',
                    description: 'La prima impressione - banner principale con titolo e CTA'
                  },
                  {
                    key: 'website_show_about',
                    label: '❤️ Chi Siamo',
                    description: 'Racconta la tua storia e connettiti con i clienti'
                  },
                  {
                    key: 'website_show_services',
                    label: '💼 Servizi',
                    description: 'Mostra cosa offri ai tuoi clienti'
                  },
                  {
                    key: 'website_show_gallery',
                    label: '🖼️ Gallery Foto',
                    description: 'Galleria immagini dei tuoi prodotti o locale'
                  },
                  {
                    key: 'website_show_loyalty',
                    label: '⭐ Programma Fedeltà',
                    description: 'Il cuore di OMNILY PRO - mostra i vantaggi del tuo programma'
                  },
                  {
                    key: 'website_show_testimonials',
                    label: '💬 Recensioni Clienti',
                    description: 'Le testimonianze costruiscono fiducia e credibilità'
                  },
                  {
                    key: 'website_show_pricing',
                    label: '💰 Listino Prezzi',
                    description: 'Mostra i tuoi piani e prezzi in modo professionale'
                  },
                  {
                    key: 'website_show_team',
                    label: '👥 Il Nostro Team',
                    description: 'Presenta le persone dietro al tuo business'
                  },
                  {
                    key: 'website_show_video',
                    label: '🎥 Video Presentazione',
                    description: 'Un video vale più di mille parole'
                  },
                  {
                    key: 'website_show_contact_form',
                    label: '📧 Form Contatti',
                    description: 'Permetti ai clienti di contattarti facilmente'
                  },
                  {
                    key: 'website_show_map',
                    label: '📍 Mappa Posizione',
                    description: 'Aiuta i clienti a trovarti fisicamente'
                  },
                ].map((section) => (
                  <ToggleSwitch
                    key={section.key}
                    checked={config[section.key] ?? true}
                    onChange={(checked) => updateConfig(section.key, checked)}
                    label={section.label}
                    description={section.description}
                    primaryColor={primaryColor}
                  />
                ))}
              </div>
            </div>

            {/* Contact Form Configuration */}
            {config.website_show_contact_form && (
              <div className="config-section" style={{ marginTop: 'var(--omnily-spacing-6)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--omnily-spacing-3)', marginBottom: 'var(--omnily-spacing-6)' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: 'var(--omnily-border-radius-lg)',
                    background: `linear-gradient(135deg, ${primaryColor}20, ${primaryColor}10)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Mail size={24} style={{ color: primaryColor }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: 0 }}>📧 Configurazione Form Contatti</h3>
                    <p style={{ margin: '4px 0 0 0', fontSize: 'var(--omnily-font-size-sm)', color: 'var(--omnily-gray-600)' }}>
                      Gestisci come ricevere i messaggi dai tuoi clienti
                    </p>
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>📬 Email Destinazione</label>
                    <input
                      type="email"
                      value={config.website_contact_form_email || ''}
                      onChange={(e) => updateConfig('website_contact_form_email', e.target.value)}
                      placeholder="info@tuodominio.it"
                    />
                    <small style={{ display: 'block', marginTop: '8px', color: 'var(--omnily-gray-500)', fontSize: 'var(--omnily-font-size-xs)' }}>
                      ℹ️ Le richieste verranno salvate nel pannello e visualizzabili sotto "Messaggi" (futuro feature)
                    </small>
                  </div>

                  <div className="form-group">
                    <label>✉️ Oggetto Email</label>
                    <input
                      type="text"
                      value={config.website_contact_form_subject || 'Nuovo messaggio dal sito web'}
                      onChange={(e) => updateConfig('website_contact_form_subject', e.target.value)}
                      placeholder="Nuovo messaggio dal sito web"
                    />
                    <small style={{ display: 'block', marginTop: '8px', color: 'var(--omnily-gray-500)', fontSize: 'var(--omnily-font-size-xs)' }}>
                      ℹ️ L'oggetto dell'email che riceverai
                    </small>
                  </div>

                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label>✅ Messaggio di Successo</label>
                    <textarea
                      value={config.website_contact_form_success_message || 'Grazie per averci contattato! Ti risponderemo il prima possibile.'}
                      onChange={(e) => updateConfig('website_contact_form_success_message', e.target.value)}
                      placeholder="Grazie per averci contattato! Ti risponderemo il prima possibile."
                      rows={3}
                      style={{
                        width: '100%',
                        padding: 'var(--omnily-spacing-3)',
                        borderRadius: 'var(--omnily-border-radius-md)',
                        border: '2px solid var(--omnily-border-color)',
                        fontSize: 'var(--omnily-font-size-base)',
                        fontFamily: 'inherit',
                        resize: 'vertical'
                      }}
                    />
                    <small style={{ display: 'block', marginTop: '8px', color: 'var(--omnily-gray-500)', fontSize: 'var(--omnily-font-size-xs)' }}>
                      ℹ️ Il messaggio che i clienti vedranno dopo aver inviato il form
                    </small>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Personalizza Tab */}
        {activeTab === 'customize' && (
          <>
            {/* Hero Effects Section */}
            <div className="config-section">
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--omnily-spacing-3)', marginBottom: 'var(--omnily-spacing-6)' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: 'var(--omnily-border-radius-lg)',
                  background: `linear-gradient(135deg, ${primaryColor}20, ${primaryColor}10)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Sparkles size={24} style={{ color: primaryColor }} />
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: 0 }}>✨ Effetti Hero Section</h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: 'var(--omnily-font-size-sm)', color: 'var(--omnily-gray-600)' }}>
                    Controlla gli effetti visivi della sezione principale
                  </p>
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <ToggleSwitch
                    checked={config.website_hero_enable_parallax ?? true}
                    onChange={(checked) => updateConfig('website_hero_enable_parallax', checked)}
                    label="Effetto Parallax"
                    description="Movimento fluido durante lo scroll per creare profondità"
                  />
                </div>

                <div className="form-group">
                  <ToggleSwitch
                    checked={config.website_hero_enable_particles ?? false}
                    onChange={(checked) => updateConfig('website_hero_enable_particles', checked)}
                    label="Particelle Animate"
                    description="Punti luminosi che fluttuano sullo sfondo per un effetto magico"
                  />
                </div>
              </div>
            </div>

            {/* Info Card */}
            <InfoCard
              icon={Lightbulb}
              title="🚀 Crea Sezioni Uniche per il Tuo Business"
              description="Le sezioni personalizzate ti permettono di aggiungere contenuti speciali che nessun'altra azienda ha! Perfetto per: La Tua Storia, I Tuoi Valori, Certificazioni, Come Lavoriamo, Garanzie, o qualsiasi cosa renda unico il tuo business. Ogni sezione creata apparirà automaticamente nel menu di navigazione."
              primaryColor={primaryColor}
            />

            <div className="config-section" style={{ marginTop: 'var(--omnily-spacing-6)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--omnily-spacing-3)', marginBottom: 'var(--omnily-spacing-6)' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: 'var(--omnily-border-radius-lg)',
                  background: `linear-gradient(135deg, ${primaryColor}20, ${primaryColor}10)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Sparkles size={24} style={{ color: primaryColor }} />
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: 0 }}>✨ Sezioni Personalizzate</h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: 'var(--omnily-font-size-sm)', color: 'var(--omnily-gray-600)' }}>
                    Contenuti unici che distinguono il tuo sito da tutti gli altri
                  </p>
                </div>
                <button onClick={addCustomSection} className="btn-add">
                  <Plus className="w-5 h-5" />
                  Nuova Sezione
                </button>
              </div>

              {(!config.website_custom_sections || config.website_custom_sections.length === 0) ? (
                <div className="empty-state">
                  <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, ${primaryColor}15, ${primaryColor}05)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto var(--omnily-spacing-6) auto'
                  }}>
                    <Sparkles size={40} style={{ color: primaryColor }} />
                  </div>
                  <h4 style={{ fontSize: 'var(--omnily-font-size-xl)', fontWeight: 700, marginBottom: 'var(--omnily-spacing-3)' }}>
                    Inizia a Creare Qualcosa di Speciale!
                  </h4>
                  <p style={{ fontSize: 'var(--omnily-font-size-base)', color: 'var(--omnily-gray-600)', marginBottom: 'var(--omnily-spacing-2)' }}>
                    Le sezioni personalizzate rendono il tuo sito unico
                  </p>
                  <p style={{ fontSize: 'var(--omnily-font-size-sm)', color: 'var(--omnily-gray-500)', marginBottom: 'var(--omnily-spacing-6)', maxWidth: '500px', margin: '0 auto var(--omnily-spacing-6) auto' }}>
                    💡 Esempi: "I Nostri Valori", "Certificazioni e Premi", "Come Lavoriamo", "La Nostra Promessa", "Garanzia di Qualità"
                  </p>
                  <button
                    onClick={addCustomSection}
                    className="btn-primary"
                    style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)`, boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)' }}
                  >
                    <Plus className="w-5 h-5" />
                    Crea la Tua Prima Sezione
                  </button>
                </div>
            ) : (
              <div className="items-list">
                {config.website_custom_sections.map((section: any, index: number) => (
                  <div key={section.id} className="item-card">
                    <div className="item-header">
                      <h4>{section.title || `Sezione ${index + 1}`}</h4>
                      <button onClick={() => removeCustomSection(index)} className="btn-remove">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="form-group">
                      <label>🏷️ Titolo Sezione (Grande Visibile nel Sito)</label>
                      <input
                        type="text"
                        value={section.title || ''}
                        onChange={(e) => updateCustomSection(index, 'title', e.target.value)}
                        placeholder="es: I Nostri Valori, La Nostra Storia, Come Lavoriamo..."
                      />
                      <small style={{ display: 'block', marginTop: '8px', color: 'var(--omnily-gray-500)', fontSize: 'var(--omnily-font-size-xs)' }}>
                        💡 Usa un titolo descrittivo e coinvolgente che catturi l'attenzione
                      </small>
                    </div>

                    <div className="form-group">
                      <label>📍 Etichetta Menu (Piccola nel Navbar)</label>
                      <input
                        type="text"
                        value={section.menuLabel || ''}
                        onChange={(e) => updateCustomSection(index, 'menuLabel', e.target.value)}
                        placeholder="es: Valori, Storia, Lavoriamo..."
                      />
                      <small style={{ display: 'block', marginTop: '8px', color: 'var(--omnily-gray-500)', fontSize: 'var(--omnily-font-size-xs)' }}>
                        🔗 Questo testo apparirà nel menu di navigazione - tienilo breve!
                      </small>
                    </div>

                    <div className="form-group">
                      <label>✍️ Contenuto della Sezione</label>
                      <textarea
                        rows={8}
                        value={section.content || ''}
                        onChange={(e) => updateCustomSection(index, 'content', e.target.value)}
                        placeholder="Scrivi qui il contenuto che vuoi mostrare ai tuoi clienti. Spiega cosa ti rende unico, i tuoi valori, le tue promesse, o qualsiasi cosa tu voglia condividere..."
                        style={{ lineHeight: '1.6' }}
                      />
                      <small style={{ display: 'block', marginTop: '8px', color: 'var(--omnily-gray-500)', fontSize: 'var(--omnily-font-size-xs)' }}>
                        💬 Scrivi in modo autentico e personale - i clienti apprezzano la sincerità!
                      </small>
                    </div>

                    {/* Advanced Customization */}
                    <div style={{
                      marginTop: 'var(--omnily-spacing-6)',
                      paddingTop: 'var(--omnily-spacing-6)',
                      borderTop: '2px solid var(--omnily-border-color)'
                    }}>
                      <h4 style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--omnily-spacing-2)',
                        marginBottom: 'var(--omnily-spacing-5)',
                        fontSize: 'var(--omnily-font-size-lg)',
                        fontWeight: 700,
                        color: primaryColor
                      }}>
                        <Palette size={20} />
                        🎨 Personalizzazione Avanzata
                      </h4>

                      {/* Colors Section */}
                      <div style={{
                        background: 'var(--omnily-gray-50)',
                        padding: 'var(--omnily-spacing-5)',
                        borderRadius: 'var(--omnily-border-radius-lg)',
                        marginBottom: 'var(--omnily-spacing-5)'
                      }}>
                        <h5 style={{ marginTop: 0, marginBottom: 'var(--omnily-spacing-4)', fontSize: 'var(--omnily-font-size-base)', fontWeight: 600 }}>
                          🌈 Colori Personalizzati
                        </h5>
                        <div className="form-row">
                          <div className="form-group">
                            <label>Colore di Sfondo</label>
                            <input
                              type="color"
                              value={section.backgroundColor || '#ffffff'}
                              onChange={(e) => updateCustomSection(index, 'backgroundColor', e.target.value)}
                              style={{ height: '48px', cursor: 'pointer' }}
                            />
                            <small style={{ display: 'block', marginTop: '8px', color: 'var(--omnily-gray-500)', fontSize: 'var(--omnily-font-size-xs)' }}>
                              💡 Usa colori che si abbinano al tuo brand
                            </small>
                          </div>
                          <div className="form-group">
                            <label>Colore del Testo</label>
                            <input
                              type="color"
                              value={section.textColor || '#000000'}
                              onChange={(e) => updateCustomSection(index, 'textColor', e.target.value)}
                              style={{ height: '48px', cursor: 'pointer' }}
                            />
                            <small style={{ display: 'block', marginTop: '8px', color: 'var(--omnily-gray-500)', fontSize: 'var(--omnily-font-size-xs)' }}>
                              💡 Assicurati che sia ben leggibile sullo sfondo
                            </small>
                          </div>
                        </div>
                      </div>

                      {/* Image Section */}
                      <div style={{
                        background: 'var(--omnily-gray-50)',
                        padding: 'var(--omnily-spacing-5)',
                        borderRadius: 'var(--omnily-border-radius-lg)',
                        marginBottom: 'var(--omnily-spacing-5)'
                      }}>
                        <h5 style={{ marginTop: 0, marginBottom: 'var(--omnily-spacing-4)', fontSize: 'var(--omnily-font-size-base)', fontWeight: 600 }}>
                          🖼️ Immagine della Sezione
                        </h5>
                        <ImageUploader
                          label=""
                          value={section.image || ''}
                          onChange={(url) => updateCustomSection(index, 'image', url)}
                          folder="custom-sections"
                        />
                        <div className="form-group" style={{ marginTop: 'var(--omnily-spacing-4)' }}>
                          <label>Posizione Immagine</label>
                          <select
                            value={section.imagePosition || 'right'}
                            onChange={(e) => updateCustomSection(index, 'imagePosition', e.target.value)}
                          >
                            <option value="left">⬅️ Sinistra (Testo a destra)</option>
                            <option value="right">➡️ Destra (Testo a sinistra)</option>
                            <option value="background">🖼️ Sfondo (Testo sopra)</option>
                          </select>
                          <small style={{ display: 'block', marginTop: '8px', color: 'var(--omnily-gray-500)', fontSize: 'var(--omnily-font-size-xs)' }}>
                            📐 Scegli dove posizionare l'immagine rispetto al testo
                          </small>
                        </div>

                        {section.imagePosition === 'background' && (
                          <div className="form-group">
                            <label>Opacità Overlay: {Math.round((section.overlayOpacity || 0.5) * 100)}%</label>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={(section.overlayOpacity || 0.5) * 100}
                              onChange={(e) => updateCustomSection(index, 'overlayOpacity', parseFloat(e.target.value) / 100)}
                              style={{ width: '100%', cursor: 'pointer' }}
                            />
                            <small style={{ display: 'block', marginTop: '8px', color: 'var(--omnily-gray-500)', fontSize: 'var(--omnily-font-size-xs)' }}>
                              💡 Regola la trasparenza dello sfondo scuro sopra l'immagine
                            </small>
                          </div>
                        )}
                      </div>

                      {/* Effects Section */}
                      <div style={{
                        background: 'var(--omnily-gray-50)',
                        padding: 'var(--omnily-spacing-5)',
                        borderRadius: 'var(--omnily-border-radius-lg)'
                      }}>
                        <h5 style={{ marginTop: 0, marginBottom: 'var(--omnily-spacing-4)', fontSize: 'var(--omnily-font-size-base)', fontWeight: 600 }}>
                          ✨ Effetti Movimento
                        </h5>
                        <ToggleSwitch
                          checked={section.enableParallax ?? false}
                          onChange={(checked) => updateCustomSection(index, 'enableParallax', checked)}
                          label="🌊 Effetto Parallax"
                          description="Movimento di profondità durante lo scroll - effetto WOW garantito!"
                          primaryColor={primaryColor}
                        />
                      </div>
                    </div>

                    <ToggleSwitch
                      checked={section.visible ?? true}
                      onChange={(checked) => updateCustomSection(index, 'visible', checked)}
                      label="👁️ Sezione Visibile sul Sito"
                      description="Disattiva per nascondere temporaneamente senza eliminare"
                      primaryColor={primaryColor}
                    />

                    <div className="form-group">
                      <label>Ordine nel Menu</label>
                      <div style={{ display: 'flex', gap: 'var(--omnily-spacing-2)', alignItems: 'center' }}>
                        <button
                          onClick={() => moveCustomSection(index, 'up')}
                          disabled={index === 0}
                          className="btn-primary"
                          style={{ padding: 'var(--omnily-spacing-2)', opacity: index === 0 ? 0.5 : 1 }}
                        >
                          ↑ Su
                        </button>
                        <button
                          onClick={() => moveCustomSection(index, 'down')}
                          disabled={index === config.website_custom_sections.length - 1}
                          className="btn-primary"
                          style={{ padding: 'var(--omnily-spacing-2)', opacity: index === config.website_custom_sections.length - 1 ? 0.5 : 1 }}
                        >
                          ↓ Giù
                        </button>
                        <span style={{ marginLeft: 'var(--omnily-spacing-2)', color: 'var(--omnily-gray-600)', fontSize: 'var(--omnily-font-size-sm)' }}>
                          Posizione: {index + 1}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            </div>
          </>
        )}

        {/* Stile Sezioni Tab */}
        {activeTab === 'styling' && (
          <WebsiteStylingTab
            config={config}
            updateConfig={updateConfig}
            primaryColor={primaryColor}
          />
        )}

        {/* Servizi Tab */}
        {activeTab === 'services' && (
          <>
            {/* Info Card Motivante */}
            <InfoCard
              icon={Briefcase}
              title="💼 Presenta i Tuoi Servizi in Modo Professionale"
              description="I clienti vogliono sapere esattamente cosa offri! Descrivi ogni servizio con chiarezza, aggiungi icone accattivanti e immagini che mostrano il valore che porti. Un servizio ben presentato è già metà venduto!"
              primaryColor={primaryColor}
            />

            <div className="config-section" style={{ marginTop: 'var(--omnily-spacing-6)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--omnily-spacing-6)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--omnily-spacing-3)' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: 'var(--omnily-border-radius-lg)',
                    background: `linear-gradient(135deg, ${primaryColor}20, ${primaryColor}10)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Briefcase size={24} style={{ color: primaryColor }} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0 }}>⚡ I Tuoi Servizi</h3>
                    <p style={{ margin: '4px 0 0 0', fontSize: 'var(--omnily-font-size-sm)', color: 'var(--omnily-gray-600)' }}>
                      {config.website_services?.length || 0} {(config.website_services?.length || 0) === 1 ? 'servizio configurato' : 'servizi configurati'}
                    </p>
                  </div>
                </div>
                <button onClick={addService} className="btn-add" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)` }}>
                  <Plus className="w-5 h-5" />
                  Nuovo Servizio
                </button>
              </div>

              {(!config.website_services || config.website_services.length === 0) ? (
                <div className="empty-state">
                  <div style={{
                    width: '100px',
                    height: '100px',
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, ${primaryColor}15, ${primaryColor}05)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto var(--omnily-spacing-6) auto'
                  }}>
                    <Briefcase size={50} style={{ color: primaryColor }} />
                  </div>
                  <h4 style={{ fontSize: 'var(--omnily-font-size-xl)', fontWeight: 700, marginBottom: 'var(--omnily-spacing-3)' }}>
                    Nessun Servizio Configurato
                  </h4>
                  <p style={{ fontSize: 'var(--omnily-font-size-base)', color: 'var(--omnily-gray-600)', marginBottom: 'var(--omnily-spacing-2)' }}>
                    Inizia ad aggiungere i servizi che offri!
                  </p>
                  <p style={{ fontSize: 'var(--omnily-font-size-sm)', color: 'var(--omnily-gray-500)', marginBottom: 'var(--omnily-spacing-6)', maxWidth: '600px', margin: '0 auto var(--omnily-spacing-6) auto' }}>
                    💡 Suggerimento: Spiega chiaramente cosa fai, quali problemi risolvi e perché i clienti dovrebbero scegliere te.
                  </p>
                  <button
                    onClick={addService}
                    className="btn-primary"
                    style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)`, boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)' }}
                  >
                    <Briefcase className="w-5 h-5" />
                    Aggiungi Primo Servizio
                  </button>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: 'var(--omnily-spacing-5)' }}>
                  {config.website_services.map((service: any, index: number) => (
                    <div
                      key={index}
                      className="service-card"
                      style={{
                        background: 'white',
                        borderRadius: 'var(--omnily-border-radius-xl)',
                        padding: 'var(--omnily-spacing-6)',
                        border: '2px solid var(--omnily-border-color)',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
                        transition: 'all 0.3s ease',
                        position: 'relative'
                      }}
                    >
                      {/* Badge numero */}
                      <div style={{
                        position: 'absolute',
                        top: '16px',
                        right: '16px',
                        background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)`,
                        color: 'white',
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '14px',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
                      }}>
                        {index + 1}
                      </div>

                      {/* Preview Live del Servizio */}
                      {(service.title || service.description || service.icon) && (
                        <div style={{
                          padding: 'var(--omnily-spacing-5)',
                          background: `linear-gradient(135deg, ${primaryColor}05, ${primaryColor}02)`,
                          borderRadius: 'var(--omnily-border-radius-lg)',
                          marginBottom: 'var(--omnily-spacing-5)',
                          border: `1px solid ${primaryColor}20`
                        }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--omnily-spacing-4)' }}>
                            {service.icon && (
                              <div style={{
                                width: '56px',
                                height: '56px',
                                borderRadius: 'var(--omnily-border-radius-lg)',
                                background: `linear-gradient(135deg, ${primaryColor}20, ${primaryColor}10)`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                border: `2px solid ${primaryColor}30`
                              }}>
                                <span style={{ fontSize: '28px' }}>
                                  {service.icon === 'Sparkles' ? '✨' :
                                   service.icon === 'Heart' ? '❤️' :
                                   service.icon === 'Star' ? '⭐' :
                                   service.icon === 'Zap' ? '⚡' :
                                   service.icon === 'Trophy' ? '🏆' :
                                   service.icon === 'Target' ? '🎯' :
                                   service.icon === 'Rocket' ? '🚀' :
                                   service.icon === 'Gift' ? '🎁' :
                                   service.icon === 'Shield' ? '🛡️' : '💼'}
                                </span>
                              </div>
                            )}
                            <div style={{ flex: 1 }}>
                              <h4 style={{
                                margin: '0 0 var(--omnily-spacing-2) 0',
                                fontSize: 'var(--omnily-font-size-lg)',
                                fontWeight: 700,
                                color: 'var(--omnily-gray-900)'
                              }}>
                                {service.title || 'Titolo del servizio'}
                              </h4>
                              <p style={{
                                margin: 0,
                                fontSize: 'var(--omnily-font-size-sm)',
                                color: 'var(--omnily-gray-600)',
                                lineHeight: 1.6
                              }}>
                                {service.description || 'Descrizione del servizio...'}
                              </p>
                            </div>
                          </div>
                          {service.image && (
                            <div style={{
                              marginTop: 'var(--omnily-spacing-4)',
                              borderRadius: 'var(--omnily-border-radius)',
                              overflow: 'hidden',
                              height: '120px'
                            }}>
                              <img
                                src={service.image}
                                alt={service.title}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            </div>
                          )}
                        </div>
                      )}

                      {/* Form di modifica */}
                      <div className="form-group">
                        <label>Titolo Servizio</label>
                        <input
                          type="text"
                          value={service.title || ''}
                          onChange={(e) => updateService(index, 'title', e.target.value)}
                          placeholder="es: Consulenza Personalizzata"
                        />
                      </div>

                      <div className="form-group">
                        <label>Descrizione</label>
                        <textarea
                          rows={3}
                          value={service.description || ''}
                          onChange={(e) => updateService(index, 'description', e.target.value)}
                          placeholder="Spiega in dettaglio cosa offri e quali benefici porta..."
                        />
                      </div>

                      <div className="form-group">
                        <label>Icona (Lucide)</label>
                        <input
                          type="text"
                          value={service.icon || ''}
                          onChange={(e) => updateService(index, 'icon', e.target.value)}
                          placeholder="es: Sparkles, Heart, Star, Zap, Trophy, Target, Rocket, Gift, Shield"
                        />
                        <small style={{ color: 'var(--omnily-gray-500)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                          💡 Icone popolari: Sparkles ✨, Heart ❤️, Star ⭐, Zap ⚡, Trophy 🏆, Target 🎯, Rocket 🚀, Gift 🎁, Shield 🛡️
                        </small>
                      </div>

                      <ImageUploader
                        label="Immagine Servizio (opzionale)"
                        value={service.image || ''}
                        onChange={(url) => updateService(index, 'image', url)}
                        folder="services"
                      />

                      <button
                        onClick={() => removeService(index)}
                        className="btn-remove-full"
                        style={{ marginTop: 'var(--omnily-spacing-4)' }}
                      >
                        <Trash2 className="w-4 h-4" />
                        Elimina Servizio
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* CSS per effetti */}
            <style>{`
              .service-card {
                transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
              }

              .service-card:hover {
                transform: translateY(-8px) scale(1.02);
                box-shadow:
                  0 20px 40px rgba(0, 0, 0, 0.15),
                  0 0 0 3px ${primaryColor}20 !important;
                border-color: ${primaryColor} !important;
              }
            `}</style>
          </>
        )}

        {/* Gallery Tab */}
        {activeTab === 'gallery' && (
          <>
            {/* Info Card Motivante */}
            <InfoCard
              icon={Camera}
              title="📸 Mostra il Meglio del Tuo Business"
              description="Una gallery professionale vale più di mille parole! Carica foto di alta qualità dei tuoi prodotti, del tuo locale, del tuo team in azione. Le immagini sono fondamentali per convincere i clienti."
              primaryColor={primaryColor}
            />

            {/* Gallery Effects Section */}
            <div className="config-section" style={{ marginTop: 'var(--omnily-spacing-6)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--omnily-spacing-3)', marginBottom: 'var(--omnily-spacing-6)' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: 'var(--omnily-border-radius-lg)',
                  background: `linear-gradient(135deg, ${primaryColor}20, ${primaryColor}10)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Sparkles size={24} style={{ color: primaryColor }} />
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: 0 }}>✨ Layout e Effetti Gallery</h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: 'var(--omnily-font-size-sm)', color: 'var(--omnily-gray-600)' }}>
                    Scegli come visualizzare le tue foto e personalizza gli effetti
                  </p>
                </div>
              </div>

              {/* Layout Selection */}
              <div className="form-group" style={{ marginBottom: 'var(--omnily-spacing-5)' }}>
                <label className="form-label" style={{ marginBottom: 'var(--omnily-spacing-3)' }}>
                  <LayoutGrid className="w-4 h-4" style={{ color: primaryColor }} />
                  Tipo di Layout
                </label>
                <div style={{ display: 'flex', gap: 'var(--omnily-spacing-3)' }}>
                  {[
                    { value: 'masonry', label: '🧱 Masonry', description: 'Layout dinamico con foto di diverse dimensioni' },
                    { value: 'grid', label: '⬜ Griglia', description: 'Layout uniforme, tutte le foto della stessa dimensione' },
                    { value: 'carousel', label: '🎠 Carosello', description: 'Slideshow con navigazione e thumbnails' },
                  ].map((layoutOption) => (
                    <button
                      key={layoutOption.value}
                      type="button"
                      onClick={() => updateConfig('website_gallery_layout', layoutOption.value)}
                      className="layout-option-btn"
                      style={{
                        flex: 1,
                        padding: 'var(--omnily-spacing-4)',
                        borderRadius: 'var(--omnily-border-radius-lg)',
                        border: '2px solid',
                        borderColor: (config.website_gallery_layout || 'masonry') === layoutOption.value ? primaryColor : 'var(--omnily-border-color)',
                        background: (config.website_gallery_layout || 'masonry') === layoutOption.value ? `${primaryColor}10` : 'white',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        textAlign: 'left',
                      }}
                    >
                      <div style={{ fontSize: 'var(--omnily-font-size-lg)', fontWeight: 700, marginBottom: 'var(--omnily-spacing-2)' }}>
                        {layoutOption.label}
                      </div>
                      <div style={{ fontSize: 'var(--omnily-font-size-sm)', color: 'var(--omnily-gray-600)' }}>
                        {layoutOption.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Effect Toggles */}
              <div className="form-grid">
                <div className="form-group">
                  <ToggleSwitch
                    checked={config.website_gallery_enable_lightbox ?? true}
                    onChange={(checked) => updateConfig('website_gallery_enable_lightbox', checked)}
                    label="Lightbox Fullscreen"
                    description="Apri le foto a schermo intero al click"
                  />
                </div>

                <div className="form-group">
                  <ToggleSwitch
                    checked={config.website_gallery_enable_zoom ?? true}
                    onChange={(checked) => updateConfig('website_gallery_enable_zoom', checked)}
                    label="Effetto Zoom Hover"
                    description="Ingrandisci le foto al passaggio del mouse"
                  />
                </div>

                <div className="form-group">
                  <ToggleSwitch
                    checked={config.website_gallery_enable_captions ?? true}
                    onChange={(checked) => updateConfig('website_gallery_enable_captions', checked)}
                    label="Mostra Didascalie"
                    description="Visualizza titoli e descrizioni delle foto"
                  />
                </div>
              </div>
            </div>

            <div className="config-section" style={{ marginTop: 'var(--omnily-spacing-6)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--omnily-spacing-6)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--omnily-spacing-3)' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: 'var(--omnily-border-radius-lg)',
                    background: `linear-gradient(135deg, ${primaryColor}20, ${primaryColor}10)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Camera size={24} style={{ color: primaryColor }} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0 }}>🖼️ Gallery Fotografica</h3>
                    <p style={{ margin: '4px 0 0 0', fontSize: 'var(--omnily-font-size-sm)', color: 'var(--omnily-gray-600)' }}>
                      {config.website_gallery?.length || 0} {(config.website_gallery?.length || 0) === 1 ? 'foto caricata' : 'foto caricate'}
                    </p>
                  </div>
                </div>
                <button onClick={addGalleryImage} className="btn-add" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)` }}>
                  <Plus className="w-5 h-5" />
                  Nuova Foto
                </button>
              </div>

              {(!config.website_gallery || config.website_gallery.length === 0) ? (
                <div className="empty-state">
                  <div style={{
                    width: '100px',
                    height: '100px',
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, ${primaryColor}15, ${primaryColor}05)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto var(--omnily-spacing-6) auto'
                  }}>
                    <Camera size={50} style={{ color: primaryColor }} />
                  </div>
                  <h4 style={{ fontSize: 'var(--omnily-font-size-xl)', fontWeight: 700, marginBottom: 'var(--omnily-spacing-3)' }}>
                    La Tua Gallery è Vuota
                  </h4>
                  <p style={{ fontSize: 'var(--omnily-font-size-base)', color: 'var(--omnily-gray-600)', marginBottom: 'var(--omnily-spacing-2)' }}>
                    Inizia a caricare le tue foto migliori!
                  </p>
                  <p style={{ fontSize: 'var(--omnily-font-size-sm)', color: 'var(--omnily-gray-500)', marginBottom: 'var(--omnily-spacing-6)', maxWidth: '600px', margin: '0 auto var(--omnily-spacing-6) auto' }}>
                    💡 Suggerimenti: Carica foto nitide, ben illuminate, che mostrano i tuoi prodotti/servizi da angolazioni interessanti. Evita foto sfocate o troppo scure.
                  </p>
                  <button
                    onClick={addGalleryImage}
                    className="btn-primary"
                    style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)`, boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)' }}
                  >
                    <Camera className="w-5 h-5" />
                    Carica Prima Foto
                  </button>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--omnily-spacing-5)' }}>
                  {config.website_gallery.map((image: any, index: number) => (
                    <div
                      key={index}
                      style={{
                        background: 'white',
                        borderRadius: 'var(--omnily-border-radius-xl)',
                        padding: 'var(--omnily-spacing-5)',
                        border: '2px solid var(--omnily-border-color)',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
                        transition: 'all 0.3s ease',
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                      className="gallery-card-hover"
                    >
                      {/* Badge numero */}
                      <div style={{
                        position: 'absolute',
                        top: '12px',
                        left: '12px',
                        background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)`,
                        color: 'white',
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '14px',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                        zIndex: 10
                      }}>
                        {index + 1}
                      </div>

                      {/* Image Uploader */}
                      <ImageUploader
                        label=""
                        value={image.url || ''}
                        onChange={(url) => updateGalleryImage(index, 'url', url)}
                        folder="gallery"
                      />

                      {/* Caption */}
                      <div className="form-group" style={{ marginTop: 'var(--omnily-spacing-4)' }}>
                        <label style={{ fontSize: 'var(--omnily-font-size-sm)', fontWeight: 600, color: 'var(--omnily-gray-700)' }}>
                          💬 Didascalia (Opzionale)
                        </label>
                        <input
                          type="text"
                          value={image.caption || ''}
                          onChange={(e) => updateGalleryImage(index, 'caption', e.target.value)}
                          placeholder="es: Il nostro nuovo prodotto..."
                          style={{
                            padding: 'var(--omnily-spacing-3)',
                            borderRadius: 'var(--omnily-border-radius)',
                            border: '1px solid var(--omnily-border-color)',
                            fontSize: 'var(--omnily-font-size-sm)'
                          }}
                        />
                      </div>

                      {/* Azioni */}
                      <div style={{ display: 'flex', gap: 'var(--omnily-spacing-2)', marginTop: 'var(--omnily-spacing-4)' }}>
                        {/* Sposta Su */}
                        <button
                          onClick={() => moveGalleryImage(index, 'up')}
                          disabled={index === 0}
                          style={{
                            flex: 1,
                            padding: 'var(--omnily-spacing-2)',
                            background: index === 0 ? 'var(--omnily-gray-200)' : 'var(--omnily-gray-100)',
                            border: 'none',
                            borderRadius: 'var(--omnily-border-radius)',
                            cursor: index === 0 ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            fontSize: 'var(--omnily-font-size-sm)',
                            fontWeight: 600,
                            opacity: index === 0 ? 0.5 : 1,
                            transition: 'all 0.2s'
                          }}
                          title="Sposta in alto"
                        >
                          <MoveUp size={16} />
                        </button>

                        {/* Sposta Giù */}
                        <button
                          onClick={() => moveGalleryImage(index, 'down')}
                          disabled={index === config.website_gallery.length - 1}
                          style={{
                            flex: 1,
                            padding: 'var(--omnily-spacing-2)',
                            background: index === config.website_gallery.length - 1 ? 'var(--omnily-gray-200)' : 'var(--omnily-gray-100)',
                            border: 'none',
                            borderRadius: 'var(--omnily-border-radius)',
                            cursor: index === config.website_gallery.length - 1 ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            fontSize: 'var(--omnily-font-size-sm)',
                            fontWeight: 600,
                            opacity: index === config.website_gallery.length - 1 ? 0.5 : 1,
                            transition: 'all 0.2s'
                          }}
                          title="Sposta in basso"
                        >
                          <MoveDown size={16} />
                        </button>

                        {/* Elimina */}
                        <button
                          onClick={() => removeGalleryImage(index)}
                          style={{
                            flex: 1,
                            padding: 'var(--omnily-spacing-2)',
                            background: 'var(--omnily-error)',
                            color: 'white',
                            border: 'none',
                            borderRadius: 'var(--omnily-border-radius)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            fontSize: 'var(--omnily-font-size-sm)',
                            fontWeight: 600,
                            transition: 'all 0.2s'
                          }}
                          title="Elimina foto"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* CSS per effetti spettacolari */}
            <style>{`
              @keyframes galleryFadeIn {
                from {
                  opacity: 0;
                  transform: translateY(20px) scale(0.95);
                }
                to {
                  opacity: 1;
                  transform: translateY(0) scale(1);
                }
              }

              @keyframes badgePulse {
                0%, 100% {
                  transform: scale(1);
                  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
                }
                50% {
                  transform: scale(1.1);
                  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
                }
              }

              @keyframes shimmer {
                0% {
                  background-position: -1000px 0;
                }
                100% {
                  background-position: 1000px 0;
                }
              }

              .gallery-card-hover {
                animation: galleryFadeIn 0.5s ease-out;
                animation-fill-mode: both;
                position: relative;
                overflow: visible !important;
                transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94),
                           box-shadow 0.3s ease,
                           border-color 0.3s ease;
                will-change: transform;
              }

              .gallery-card-hover::before {
                content: '';
                position: absolute;
                top: -2px;
                left: -2px;
                right: -2px;
                bottom: -2px;
                background: linear-gradient(135deg, ${primaryColor}30, transparent, ${primaryColor}30);
                border-radius: var(--omnily-border-radius-xl);
                opacity: 0;
                transition: opacity 0.4s ease;
                z-index: -1;
              }

              .gallery-card-hover::after {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(
                  90deg,
                  transparent,
                  rgba(255, 255, 255, 0.3),
                  transparent
                );
                transition: left 0.5s ease;
                pointer-events: none;
              }

              .gallery-card-hover:hover::before {
                opacity: 1;
              }

              .gallery-card-hover:hover::after {
                left: 100%;
              }

              .gallery-card-hover:hover {
                transform: translateY(-8px) scale(1.02) rotate(-1deg);
                box-shadow:
                  0 20px 40px rgba(0, 0, 0, 0.15),
                  0 0 0 4px ${primaryColor}20,
                  0 0 20px ${primaryColor}30 !important;
                border-color: ${primaryColor} !important;
                z-index: 10;
              }

              .gallery-card-hover:nth-child(even):hover {
                transform: translateY(-8px) scale(1.02) rotate(1deg);
              }

              .gallery-card-hover > div:first-child {
                animation: badgePulse 2s infinite;
                transition: all 0.3s ease;
              }

              .gallery-card-hover:hover > div:first-child {
                transform: scale(1.2) rotate(360deg);
                animation: none;
              }

              .gallery-card-hover button {
                position: relative;
                overflow: hidden;
              }

              .gallery-card-hover button::before {
                content: '';
                position: absolute;
                top: 50%;
                left: 50%;
                width: 0;
                height: 0;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.3);
                transform: translate(-50%, -50%);
                transition: width 0.4s ease, height 0.4s ease;
              }

              .gallery-card-hover button:hover::before {
                width: 200px;
                height: 200px;
              }

              .gallery-card-hover button:hover {
                transform: scale(1.05);
              }

              .gallery-card-hover button:active {
                transform: scale(0.95);
              }

              /* Animazione entrata scaglionata */
              .gallery-card-hover:nth-child(1) { animation-delay: 0.05s; }
              .gallery-card-hover:nth-child(2) { animation-delay: 0.1s; }
              .gallery-card-hover:nth-child(3) { animation-delay: 0.15s; }
              .gallery-card-hover:nth-child(4) { animation-delay: 0.2s; }
              .gallery-card-hover:nth-child(5) { animation-delay: 0.25s; }
              .gallery-card-hover:nth-child(6) { animation-delay: 0.3s; }
              .gallery-card-hover:nth-child(n+7) { animation-delay: 0.35s; }

              /* Effetto focus input caption */
              .gallery-card-hover input:focus {
                transform: scale(1.02);
                box-shadow: 0 0 0 3px ${primaryColor}20, 0 4px 12px rgba(0, 0, 0, 0.1);
                border-color: ${primaryColor} !important;
              }

              /* Effetto immagine hover */
              .gallery-card-hover .image-preview {
                position: relative;
                overflow: hidden;
                transition: all 0.4s ease;
              }

              .gallery-card-hover:hover .image-preview {
                transform: scale(1.05);
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
              }

              .gallery-card-hover .image-preview img {
                transition: transform 0.6s ease, filter 0.3s ease;
              }

              .gallery-card-hover:hover .image-preview img {
                transform: scale(1.1);
                filter: brightness(1.05) contrast(1.05);
              }

              /* Pulsante "Nuova Foto" con effetto gradient animato */
              .btn-add {
                position: relative;
                overflow: hidden;
                background-size: 200% 200%;
                animation: shimmer 3s linear infinite;
              }

              .btn-add::before {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(
                  90deg,
                  transparent,
                  rgba(255, 255, 255, 0.3),
                  transparent
                );
                transition: left 0.5s ease;
              }

              .btn-add:hover::before {
                left: 100%;
              }

              .btn-add:hover {
                transform: translateY(-2px) scale(1.05);
                box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
              }

              .btn-add:active {
                transform: translateY(0) scale(0.98);
              }
            `}</style>
          </>
        )}

        {/* Team Tab */}
        {activeTab === 'team' && (
          <>
            <InfoCard
              icon={Users}
              title="👥 Mostra il Team Dietro al Tuo Successo"
              description="Le persone si fidano delle persone! Presenta il tuo team con foto, ruoli e una breve bio. Un team ben presentato trasmette professionalità e umanizza il tuo brand."
              primaryColor={primaryColor}
            />

            <div className="config-section" style={{ marginTop: 'var(--omnily-spacing-6)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--omnily-spacing-6)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--omnily-spacing-3)' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: 'var(--omnily-border-radius-lg)',
                    background: `linear-gradient(135deg, ${primaryColor}20, ${primaryColor}10)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Users size={24} style={{ color: primaryColor }} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0 }}>👥 Il Nostro Team</h3>
                    <p style={{ margin: '4px 0 0 0', fontSize: 'var(--omnily-font-size-sm)', color: 'var(--omnily-gray-600)' }}>
                      {config.website_team?.length || 0} {(config.website_team?.length || 0) === 1 ? 'membro del team' : 'membri del team'}
                    </p>
                  </div>
                </div>
                <button onClick={addTeamMember} className="btn-add" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)` }}>
                  <Plus className="w-5 h-5" />
                  Nuovo Membro
                </button>
              </div>

              {(!config.website_team || config.website_team.length === 0) ? (
                <div className="empty-state">
                  <div style={{
                    width: '100px',
                    height: '100px',
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, ${primaryColor}15, ${primaryColor}05)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto var(--omnily-spacing-6) auto'
                  }}>
                    <Users size={50} style={{ color: primaryColor }} />
                  </div>
                  <h4 style={{ fontSize: 'var(--omnily-font-size-xl)', fontWeight: 700, marginBottom: 'var(--omnily-spacing-3)' }}>
                    Nessun Membro del Team
                  </h4>
                  <p style={{ fontSize: 'var(--omnily-font-size-base)', color: 'var(--omnily-gray-600)', marginBottom: 'var(--omnily-spacing-2)' }}>
                    Presenta le persone che rendono speciale la tua attività!
                  </p>
                  <p style={{ fontSize: 'var(--omnily-font-size-sm)', color: 'var(--omnily-gray-500)', marginBottom: 'var(--omnily-spacing-6)', maxWidth: '600px', margin: '0 auto var(--omnily-spacing-6) auto' }}>
                    💡 Un team ben presentato aumenta la fiducia del 60%!
                  </p>
                  <button
                    onClick={addTeamMember}
                    className="btn-primary"
                    style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)`, boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)' }}
                  >
                    <Users className="w-5 h-5" />
                    Aggiungi Primo Membro
                  </button>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 'var(--omnily-spacing-5)' }}>
                  {config.website_team.map((member: any, index: number) => (
                    <div
                      key={index}
                      className="team-member-card"
                      style={{
                        background: 'white',
                        borderRadius: 'var(--omnily-border-radius-xl)',
                        padding: 'var(--omnily-spacing-6)',
                        border: '2px solid var(--omnily-border-color)',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      {/* Preview Live del Membro */}
                      {(member.name || member.role || member.image) && (
                        <div style={{
                          padding: 'var(--omnily-spacing-5)',
                          background: `linear-gradient(135deg, ${primaryColor}05, ${primaryColor}02)`,
                          borderRadius: 'var(--omnily-border-radius-lg)',
                          marginBottom: 'var(--omnily-spacing-5)',
                          border: `1px solid ${primaryColor}20`,
                          textAlign: 'center'
                        }}>
                          {/* Avatar */}
                          {member.image ? (
                            <img
                              src={member.image}
                              alt={member.name}
                              style={{
                                width: '100px',
                                height: '100px',
                                borderRadius: '50%',
                                objectFit: 'cover',
                                margin: '0 auto var(--omnily-spacing-4) auto',
                                border: `4px solid ${primaryColor}40`
                              }}
                            />
                          ) : (
                            <div style={{
                              width: '100px',
                              height: '100px',
                              borderRadius: '50%',
                              background: `linear-gradient(135deg, ${primaryColor}30, ${primaryColor}20)`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '40px',
                              fontWeight: 700,
                              color: primaryColor,
                              margin: '0 auto var(--omnily-spacing-4) auto'
                            }}>
                              {member.name ? member.name[0].toUpperCase() : '?'}
                            </div>
                          )}

                          <h4 style={{
                            margin: '0 0 var(--omnily-spacing-2) 0',
                            fontSize: 'var(--omnily-font-size-lg)',
                            fontWeight: 700,
                            color: 'var(--omnily-gray-900)'
                          }}>
                            {member.name || 'Nome Membro'}
                          </h4>
                          <p style={{
                            margin: '0 0 var(--omnily-spacing-3) 0',
                            fontSize: 'var(--omnily-font-size-sm)',
                            color: primaryColor,
                            fontWeight: 600
                          }}>
                            {member.role || 'Ruolo'}
                          </p>
                          {member.bio && (
                            <p style={{
                              margin: 0,
                              fontSize: 'var(--omnily-font-size-sm)',
                              color: 'var(--omnily-gray-600)',
                              lineHeight: 1.6
                            }}>
                              {member.bio}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Form */}
                      <div className="form-group">
                        <label>Nome</label>
                        <input
                          type="text"
                          value={member.name || ''}
                          onChange={(e) => updateTeamMember(index, 'name', e.target.value)}
                          placeholder="es: Mario Rossi"
                        />
                      </div>

                      <div className="form-group">
                        <label>Ruolo</label>
                        <input
                          type="text"
                          value={member.role || ''}
                          onChange={(e) => updateTeamMember(index, 'role', e.target.value)}
                          placeholder="es: CEO & Founder"
                        />
                      </div>

                      <div className="form-group">
                        <label>Biografia</label>
                        <textarea
                          rows={3}
                          value={member.bio || ''}
                          onChange={(e) => updateTeamMember(index, 'bio', e.target.value)}
                          placeholder="Breve biografia del membro del team..."
                        />
                      </div>

                      <ImageUploader
                        label="Foto"
                        value={member.image || ''}
                        onChange={(url) => updateTeamMember(index, 'image', url)}
                        folder="team"
                      />

                      <div className="form-group">
                        <label>LinkedIn (opzionale)</label>
                        <input
                          type="text"
                          value={member.linkedin || ''}
                          onChange={(e) => updateTeamMember(index, 'linkedin', e.target.value)}
                          placeholder="https://linkedin.com/in/..."
                        />
                      </div>

                      <div className="form-group">
                        <label>Email (opzionale)</label>
                        <input
                          type="email"
                          value={member.email || ''}
                          onChange={(e) => updateTeamMember(index, 'email', e.target.value)}
                          placeholder="nome@azienda.com"
                        />
                      </div>

                      <button
                        onClick={() => removeTeamMember(index)}
                        className="btn-remove-full"
                        style={{ marginTop: 'var(--omnily-spacing-4)' }}
                      >
                        <Trash2 className="w-4 h-4" />
                        Rimuovi Membro
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <style>{`
              .team-member-card {
                transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
              }

              .team-member-card:hover {
                transform: translateY(-8px) scale(1.02);
                box-shadow:
                  0 20px 40px rgba(0, 0, 0, 0.15),
                  0 0 0 3px ${primaryColor}20 !important;
                border-color: ${primaryColor} !important;
              }
            `}</style>
          </>
        )}

        {/* Video Tab */}
        {activeTab === 'video' && (
          <>
            <InfoCard
              icon={Video}
              title="🎬 I Video Convertono 80% in Più!"
              description="I video catturano l'attenzione e raccontano la tua storia in modo coinvolgente. Mostra il tuo prodotto in azione, dietro le quinte o tutorial. I visitatori restano più a lungo e convertono di più!"
              primaryColor={primaryColor}
            />

            <div className="config-section" style={{ marginTop: 'var(--omnily-spacing-6)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--omnily-spacing-6)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--omnily-spacing-3)' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: 'var(--omnily-border-radius-lg)',
                    background: `linear-gradient(135deg, ${primaryColor}20, ${primaryColor}10)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Video size={24} style={{ color: primaryColor }} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0 }}>🎬 Video</h3>
                    <p style={{ margin: '4px 0 0 0', fontSize: 'var(--omnily-font-size-sm)', color: 'var(--omnily-gray-600)' }}>
                      {config.website_videos?.length || 0} {(config.website_videos?.length || 0) === 1 ? 'video' : 'video'}
                    </p>
                  </div>
                </div>
                <button onClick={addVideo} className="btn-add" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)` }}>
                  <Plus className="w-5 h-5" />
                  Nuovo Video
                </button>
              </div>

              {(!config.website_videos || config.website_videos.length === 0) ? (
                <div className="empty-state">
                  <div style={{
                    width: '100px',
                    height: '100px',
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, ${primaryColor}15, ${primaryColor}05)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto var(--omnily-spacing-6) auto'
                  }}>
                    <Video size={50} style={{ color: primaryColor }} />
                  </div>
                  <h4 style={{ fontSize: 'var(--omnily-font-size-xl)', fontWeight: 700, marginBottom: 'var(--omnily-spacing-3)' }}>
                    Nessun Video Caricato
                  </h4>
                  <p style={{ fontSize: 'var(--omnily-font-size-base)', color: 'var(--omnily-gray-600)', marginBottom: 'var(--omnily-spacing-2)' }}>
                    Aggiungi video di YouTube, Vimeo o altri servizi!
                  </p>
                  <p style={{ fontSize: 'var(--omnily-font-size-sm)', color: 'var(--omnily-gray-500)', marginBottom: 'var(--omnily-spacing-6)', maxWidth: '600px', margin: '0 auto var(--omnily-spacing-6) auto' }}>
                    💡 I video aumentano il tempo di permanenza del 300% e le conversioni dell'80%!
                  </p>
                  <button
                    onClick={addVideo}
                    className="btn-primary"
                    style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)`, boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)' }}
                  >
                    <Video className="w-5 h-5" />
                    Aggiungi Primo Video
                  </button>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: 'var(--omnily-spacing-5)' }}>
                  {config.website_videos.map((video: any, index: number) => (
                    <div
                      key={index}
                      className="video-card"
                      style={{
                        background: 'white',
                        borderRadius: 'var(--omnily-border-radius-xl)',
                        padding: 'var(--omnily-spacing-6)',
                        border: '2px solid var(--omnily-border-color)',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      {/* Preview Video */}
                      {video.url && (
                        <div style={{
                          position: 'relative',
                          paddingBottom: '56.25%',
                          height: 0,
                          overflow: 'hidden',
                          borderRadius: 'var(--omnily-border-radius-lg)',
                          marginBottom: 'var(--omnily-spacing-5)',
                          border: `2px solid ${primaryColor}20`
                        }}>
                          <iframe
                            src={video.url.replace('watch?v=', 'embed/')}
                            style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '100%',
                              height: '100%',
                              borderRadius: 'var(--omnily-border-radius-lg)'
                            }}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      )}

                      <div className="form-group">
                        <label>Titolo</label>
                        <input
                          type="text"
                          value={video.title || ''}
                          onChange={(e) => updateVideo(index, 'title', e.target.value)}
                          placeholder="es: Presentazione Prodotto 2024"
                        />
                      </div>

                      <div className="form-group">
                        <label>URL Video (YouTube, Vimeo, ecc.)</label>
                        <input
                          type="text"
                          value={video.url || ''}
                          onChange={(e) => updateVideo(index, 'url', e.target.value)}
                          placeholder="https://youtube.com/watch?v=..."
                        />
                        <small style={{ color: 'var(--omnily-gray-500)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                          💡 Copia l'URL completo del video da YouTube o Vimeo
                        </small>
                      </div>

                      <div className="form-group">
                        <label>Descrizione (opzionale)</label>
                        <textarea
                          rows={2}
                          value={video.description || ''}
                          onChange={(e) => updateVideo(index, 'description', e.target.value)}
                          placeholder="Breve descrizione del video..."
                        />
                      </div>

                      <button
                        onClick={() => removeVideo(index)}
                        className="btn-remove-full"
                        style={{ marginTop: 'var(--omnily-spacing-4)' }}
                      >
                        <Trash2 className="w-4 h-4" />
                        Rimuovi Video
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <style>{`
              .video-card {
                transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
              }

              .video-card:hover {
                transform: translateY(-8px) scale(1.02);
                box-shadow:
                  0 20px 40px rgba(0, 0, 0, 0.15),
                  0 0 0 3px ${primaryColor}20 !important;
                border-color: ${primaryColor} !important;
              }
            `}</style>
          </>
        )}

        {/* Testimonials Tab */}
        {activeTab === 'testimonials' && (
          <>
            {/* Info Card Motivante */}
            <InfoCard
              icon={Star}
              title="⭐ Le Recensioni Sono Oro Puro per il Tuo Business"
              description="Il 92% dei clienti legge le recensioni prima di scegliere! Le testimonianze positive costruiscono fiducia, credibilità e convincono i clienti indecisi. Mostra le tue recensioni migliori e guarda le conversioni aumentare!"
              primaryColor={primaryColor}
            />

            <div className="config-section" style={{ marginTop: 'var(--omnily-spacing-6)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--omnily-spacing-6)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--omnily-spacing-3)' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: 'var(--omnily-border-radius-lg)',
                    background: `linear-gradient(135deg, ${primaryColor}20, ${primaryColor}10)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Star size={24} style={{ color: primaryColor }} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0 }}>⭐ Recensioni Clienti</h3>
                    <p style={{ margin: '4px 0 0 0', fontSize: 'var(--omnily-font-size-sm)', color: 'var(--omnily-gray-600)' }}>
                      {config.website_testimonials?.length || 0} {(config.website_testimonials?.length || 0) === 1 ? 'recensione' : 'recensioni'}
                    </p>
                  </div>
                </div>
                <button onClick={addTestimonial} className="btn-add" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)` }}>
                  <Plus className="w-5 h-5" />
                  Nuova Recensione
                </button>
              </div>

              {(!config.website_testimonials || config.website_testimonials.length === 0) ? (
                <div className="empty-state">
                  <div style={{
                    width: '100px',
                    height: '100px',
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, ${primaryColor}15, ${primaryColor}05)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto var(--omnily-spacing-6) auto'
                  }}>
                    <Star size={50} style={{ color: primaryColor }} />
                  </div>
                  <h4 style={{ fontSize: 'var(--omnily-font-size-xl)', fontWeight: 700, marginBottom: 'var(--omnily-spacing-3)' }}>
                    Nessuna Recensione Ancora
                  </h4>
                  <p style={{ fontSize: 'var(--omnily-font-size-base)', color: 'var(--omnily-gray-600)', marginBottom: 'var(--omnily-spacing-2)' }}>
                    Inizia ad aggiungere le recensioni dei tuoi clienti soddisfatti!
                  </p>
                  <p style={{ fontSize: 'var(--omnily-font-size-sm)', color: 'var(--omnily-gray-500)', marginBottom: 'var(--omnily-spacing-6)', maxWidth: '600px', margin: '0 auto var(--omnily-spacing-6) auto' }}>
                    💡 Le recensioni aumentano la fiducia del 70%! Chiedi ai tuoi clienti soddisfatti di condividere la loro esperienza.
                  </p>
                  <button
                    onClick={addTestimonial}
                    className="btn-primary"
                    style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)`, boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)' }}
                  >
                    <Star className="w-5 h-5" />
                    Aggiungi Prima Recensione
                  </button>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(450px, 1fr))', gap: 'var(--omnily-spacing-5)' }}>
                  {config.website_testimonials.map((testimonial: any, index: number) => (
                    <div
                      key={index}
                      className="testimonial-card"
                      style={{
                        background: 'white',
                        borderRadius: 'var(--omnily-border-radius-xl)',
                        padding: 'var(--omnily-spacing-6)',
                        border: '2px solid var(--omnily-border-color)',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
                        transition: 'all 0.3s ease',
                        position: 'relative'
                      }}
                    >
                      {/* Preview Live della Recensione */}
                      {(testimonial.name || testimonial.content || testimonial.rating) && (
                        <div style={{
                          padding: 'var(--omnily-spacing-5)',
                          background: `linear-gradient(135deg, ${primaryColor}05, ${primaryColor}02)`,
                          borderRadius: 'var(--omnily-border-radius-lg)',
                          marginBottom: 'var(--omnily-spacing-5)',
                          border: `1px solid ${primaryColor}20`,
                          position: 'relative'
                        }}>
                          {/* Quote Icon */}
                          <div style={{
                            position: 'absolute',
                            top: '12px',
                            right: '12px',
                            fontSize: '48px',
                            opacity: 0.1,
                            color: primaryColor
                          }}>
                            "
                          </div>

                          {/* Rating Stars */}
                          <div style={{ marginBottom: 'var(--omnily-spacing-3)', display: 'flex', gap: '4px' }}>
                            {[...Array(5)].map((_, i) => (
                              <span key={i} style={{ fontSize: '20px' }}>
                                {i < (testimonial.rating || 5) ? '⭐' : '☆'}
                              </span>
                            ))}
                          </div>

                          {/* Content */}
                          <p style={{
                            margin: '0 0 var(--omnily-spacing-4) 0',
                            fontSize: 'var(--omnily-font-size-base)',
                            color: 'var(--omnily-gray-700)',
                            lineHeight: 1.7,
                            fontStyle: 'italic'
                          }}>
                            "{testimonial.content || 'Scrivi qui la recensione del cliente...'}"
                          </p>

                          {/* Cliente Info */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--omnily-spacing-3)' }}>
                            {testimonial.image ? (
                              <img
                                src={testimonial.image}
                                alt={testimonial.name}
                                style={{
                                  width: '48px',
                                  height: '48px',
                                  borderRadius: '50%',
                                  objectFit: 'cover',
                                  border: `2px solid ${primaryColor}40`
                                }}
                              />
                            ) : (
                              <div style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '50%',
                                background: `linear-gradient(135deg, ${primaryColor}30, ${primaryColor}20)`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '20px',
                                fontWeight: 700,
                                color: primaryColor
                              }}>
                                {testimonial.name ? testimonial.name[0].toUpperCase() : '?'}
                              </div>
                            )}
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 'var(--omnily-font-size-base)', color: 'var(--omnily-gray-900)' }}>
                                {testimonial.name || 'Nome Cliente'}
                              </div>
                              <div style={{ fontSize: 'var(--omnily-font-size-sm)', color: 'var(--omnily-gray-600)' }}>
                                {testimonial.role || 'Ruolo/Azienda'}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Form di modifica */}
                      <div className="form-row">
                        <div className="form-group">
                          <label>Nome Cliente</label>
                          <input
                            type="text"
                            value={testimonial.name || ''}
                            onChange={(e) => updateTestimonial(index, 'name', e.target.value)}
                            placeholder="es: Mario Rossi"
                          />
                        </div>

                        <div className="form-group">
                          <label>Ruolo/Azienda</label>
                          <input
                            type="text"
                            value={testimonial.role || ''}
                            onChange={(e) => updateTestimonial(index, 'role', e.target.value)}
                            placeholder="es: CEO, Azienda XYZ"
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Recensione</label>
                        <textarea
                          rows={4}
                          value={testimonial.content || ''}
                          onChange={(e) => updateTestimonial(index, 'content', e.target.value)}
                          placeholder="Scrivi cosa ha detto il cliente sulla tua attività..."
                        />
                      </div>

                      <div className="form-group">
                        <label>Valutazione (1-5 stelle)</label>
                        <div style={{ display: 'flex', gap: 'var(--omnily-spacing-2)', alignItems: 'center' }}>
                          <input
                            type="number"
                            min="1"
                            max="5"
                            value={testimonial.rating || 5}
                            onChange={(e) =>
                              updateTestimonial(index, 'rating', parseInt(e.target.value))
                            }
                            style={{ width: '80px' }}
                          />
                          <div style={{ display: 'flex', gap: '4px' }}>
                            {[...Array(5)].map((_, i) => (
                              <span
                                key={i}
                                onClick={() => updateTestimonial(index, 'rating', i + 1)}
                                style={{
                                  fontSize: '24px',
                                  cursor: 'pointer',
                                  transition: 'transform 0.2s'
                                }}
                              >
                                {i < (testimonial.rating || 5) ? '⭐' : '☆'}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <ImageUploader
                        label="Foto Cliente (opzionale)"
                        value={testimonial.image || ''}
                        onChange={(url) => updateTestimonial(index, 'image', url)}
                        folder="testimonials"
                      />

                      <button
                        onClick={() => removeTestimonial(index)}
                        className="btn-remove-full"
                        style={{ marginTop: 'var(--omnily-spacing-4)' }}
                      >
                        <Trash2 className="w-4 h-4" />
                        Elimina Recensione
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* CSS per effetti */}
            <style>{`
              .testimonial-card {
                transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
              }

              .testimonial-card:hover {
                transform: translateY(-8px) scale(1.02);
                box-shadow:
                  0 20px 40px rgba(0, 0, 0, 0.15),
                  0 0 0 3px ${primaryColor}20 !important;
                border-color: ${primaryColor} !important;
              }
            `}</style>
          </>
        )}

        {/* Pricing Tab */}
        {activeTab === 'pricing' && (
          <>
            {/* Info Card Motivante */}
            <InfoCard
              icon={DollarSign}
              title="💰 Listino Prezzi: Trasparenza Che Converte"
              description="Un listino chiaro aumenta le conversioni del 40%! Organizza i tuoi servizi per categoria e mostra prezzi trasparenti per convertire visitatori in clienti."
              primaryColor={primaryColor}
            />

            <div className="config-section" style={{ marginTop: 'var(--omnily-spacing-6)' }}>
              {/* Title and Subtitle */}
              <div style={{ marginBottom: 'var(--omnily-spacing-6)', padding: 'var(--omnily-spacing-5)', background: 'white', border: '2px solid var(--omnily-border-color)', borderRadius: 'var(--omnily-border-radius-lg)' }}>
                <h4 style={{ margin: '0 0 var(--omnily-spacing-4) 0', fontSize: 'var(--omnily-font-size-lg)', fontWeight: 700 }}>
                  📝 Titolo Sezione
                </h4>
                <div className="form-group">
                  <label>Titolo Principale</label>
                  <input
                    type="text"
                    value={config.website_pricing_title || 'I Nostri Servizi'}
                    onChange={(e) => updateConfig('website_pricing_title', e.target.value)}
                    placeholder="es: Listino Prezzi, I Nostri Servizi, Tariffe"
                  />
                </div>
                <div className="form-group">
                  <label>Sottotitolo (opzionale)</label>
                  <input
                    type="text"
                    value={config.website_pricing_subtitle || ''}
                    onChange={(e) => updateConfig('website_pricing_subtitle', e.target.value)}
                    placeholder="es: Scopri i nostri servizi e i relativi prezzi"
                  />
                </div>
              </div>

              {/* Layout Selection */}
              <div style={{ marginBottom: 'var(--omnily-spacing-6)', padding: 'var(--omnily-spacing-5)', background: 'var(--omnily-gray-50)', borderRadius: 'var(--omnily-border-radius-lg)' }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: 'var(--omnily-spacing-3)', color: 'var(--omnily-gray-700)' }}>
                  📐 Layout Listino
                </label>
                <div style={{ display: 'flex', gap: 'var(--omnily-spacing-3)' }}>
                  {[
                    { value: 'vertical', label: '📋 Verticale', desc: 'Lista classica, un servizio per riga' },
                    { value: 'horizontal', label: '🗂️ Griglia', desc: 'Servizi affiancati in card' },
                  ].map((layout) => (
                    <button
                      key={layout.value}
                      type="button"
                      onClick={() => updateConfig('website_pricing_layout', layout.value)}
                      style={{
                        flex: 1,
                        padding: 'var(--omnily-spacing-4)',
                        borderRadius: 'var(--omnily-border-radius-lg)',
                        border: '2px solid',
                        borderColor: (config.website_pricing_layout || 'vertical') === layout.value ? primaryColor : 'var(--omnily-border-color)',
                        background: (config.website_pricing_layout || 'vertical') === layout.value ? `${primaryColor}10` : 'white',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.2s',
                      }}
                    >
                      <div style={{ fontSize: 'var(--omnily-font-size-base)', fontWeight: 600, marginBottom: 'var(--omnily-spacing-1)' }}>
                        {layout.label}
                      </div>
                      <div style={{ fontSize: 'var(--omnily-font-size-sm)', color: 'var(--omnily-gray-600)' }}>
                        {layout.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Background & Styling Options */}
              <div style={{ marginBottom: 'var(--omnily-spacing-6)', padding: 'var(--omnily-spacing-5)', background: 'white', border: '2px solid var(--omnily-border-color)', borderRadius: 'var(--omnily-border-radius-lg)' }}>
                <h4 style={{ margin: '0 0 var(--omnily-spacing-4) 0', fontSize: 'var(--omnily-font-size-lg)', fontWeight: 700 }}>
                  🎨 Sfondo e Stile
                </h4>

                {/* Background Type */}
                <div className="form-group">
                  <label>Tipo di Sfondo</label>
                  <select
                    value={config.website_pricing_bg_type || 'gradient'}
                    onChange={(e) => updateConfig('website_pricing_bg_type', e.target.value)}
                  >
                    <option value="color">Colore Solido</option>
                    <option value="gradient">Sfumatura (Gradiente)</option>
                    <option value="image">Immagine</option>
                  </select>
                </div>

                {/* Color Background */}
                {config.website_pricing_bg_type === 'color' && (
                  <div className="form-group">
                    <label>Colore Sfondo</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--omnily-spacing-3)' }}>
                      <input
                        type="color"
                        value={config.website_pricing_bg_color || '#ffffff'}
                        onChange={(e) => updateConfig('website_pricing_bg_color', e.target.value)}
                        style={{ width: '60px', height: '40px', borderRadius: 'var(--omnily-border-radius)', cursor: 'pointer', border: '2px solid var(--omnily-border-color)' }}
                      />
                      <div style={{
                        flex: 1,
                        height: '40px',
                        borderRadius: 'var(--omnily-border-radius)',
                        background: config.website_pricing_bg_color || '#ffffff',
                        border: '2px solid var(--omnily-border-color)',
                        display: 'flex',
                        alignItems: 'center',
                        paddingLeft: 'var(--omnily-spacing-3)',
                        fontFamily: 'monospace',
                        fontSize: 'var(--omnily-font-size-sm)',
                        fontWeight: 600
                      }}>
                        {config.website_pricing_bg_color || '#ffffff'}
                      </div>
                    </div>
                  </div>
                )}

                {/* Gradient Background */}
                {config.website_pricing_bg_type === 'gradient' && (
                  <div className="form-row">
                    <div className="form-group">
                      <label>Colore Inizio</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--omnily-spacing-2)' }}>
                        <input
                          type="color"
                          value={config.website_pricing_bg_gradient_start || '#ffffff'}
                          onChange={(e) => updateConfig('website_pricing_bg_gradient_start', e.target.value)}
                          style={{ width: '50px', height: '40px', borderRadius: 'var(--omnily-border-radius)', cursor: 'pointer', border: '2px solid var(--omnily-border-color)' }}
                        />
                        <div style={{
                          flex: 1,
                          height: '40px',
                          borderRadius: 'var(--omnily-border-radius)',
                          background: config.website_pricing_bg_gradient_start || '#ffffff',
                          border: '2px solid var(--omnily-border-color)',
                          display: 'flex',
                          alignItems: 'center',
                          paddingLeft: 'var(--omnily-spacing-2)',
                          fontFamily: 'monospace',
                          fontSize: 'var(--omnily-font-size-xs)',
                          fontWeight: 600
                        }}>
                          {config.website_pricing_bg_gradient_start || '#ffffff'}
                        </div>
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Colore Fine</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--omnily-spacing-2)' }}>
                        <input
                          type="color"
                          value={config.website_pricing_bg_gradient_end || '#f8fafc'}
                          onChange={(e) => updateConfig('website_pricing_bg_gradient_end', e.target.value)}
                          style={{ width: '50px', height: '40px', borderRadius: 'var(--omnily-border-radius)', cursor: 'pointer', border: '2px solid var(--omnily-border-color)' }}
                        />
                        <div style={{
                          flex: 1,
                          height: '40px',
                          borderRadius: 'var(--omnily-border-radius)',
                          background: config.website_pricing_bg_gradient_end || '#f8fafc',
                          border: '2px solid var(--omnily-border-color)',
                          display: 'flex',
                          alignItems: 'center',
                          paddingLeft: 'var(--omnily-spacing-2)',
                          fontFamily: 'monospace',
                          fontSize: 'var(--omnily-font-size-xs)',
                          fontWeight: 600
                        }}>
                          {config.website_pricing_bg_gradient_end || '#f8fafc'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Image Background */}
                {config.website_pricing_bg_type === 'image' && (
                  <>
                    <div className="form-group">
                      <ImageUploader
                        label="Immagine di Sfondo"
                        value={config.website_pricing_bg_image || ''}
                        onChange={(url) => updateConfig('website_pricing_bg_image', url)}
                        bucket="website-images"
                        folder="pricing-backgrounds"
                        maxSizeMB={5}
                      />
                    </div>

                    {/* Parallax Effect */}
                    <div style={{
                      padding: 'var(--omnily-spacing-4)',
                      background: 'var(--omnily-gray-50)',
                      borderRadius: 'var(--omnily-border-radius-lg)',
                      marginBottom: 'var(--omnily-spacing-4)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontWeight: 600, marginBottom: '4px' }}>✨ Effetto Parallax</div>
                          <div style={{ fontSize: 'var(--omnily-font-size-sm)', color: 'var(--omnily-gray-600)' }}>
                            L'immagine scorre più lentamente creando profondità
                          </div>
                        </div>
                        <ToggleSwitch
                          checked={config.website_pricing_enable_parallax || false}
                          onChange={(checked) => updateConfig('website_pricing_enable_parallax', checked)}
                          activeColor={primaryColor}
                        />
                      </div>
                    </div>

                    {/* Overlay */}
                    <div style={{
                      padding: 'var(--omnily-spacing-4)',
                      background: 'var(--omnily-gray-50)',
                      borderRadius: 'var(--omnily-border-radius-lg)',
                      marginBottom: 'var(--omnily-spacing-4)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: config.website_pricing_enable_overlay ? 'var(--omnily-spacing-4)' : '0' }}>
                        <div>
                          <div style={{ fontWeight: 600, marginBottom: '4px' }}>🎨 Overlay Scuro</div>
                          <div style={{ fontSize: 'var(--omnily-font-size-sm)', color: 'var(--omnily-gray-600)' }}>
                            Oscura l'immagine per migliorare la leggibilità del testo
                          </div>
                        </div>
                        <ToggleSwitch
                          checked={config.website_pricing_enable_overlay || false}
                          onChange={(checked) => updateConfig('website_pricing_enable_overlay', checked)}
                          activeColor={primaryColor}
                        />
                      </div>

                      {config.website_pricing_enable_overlay && (
                        <div style={{ marginTop: 'var(--omnily-spacing-4)', paddingTop: 'var(--omnily-spacing-4)', borderTop: '1px solid var(--omnily-border-color)' }}>
                          <div className="form-group" style={{ marginBottom: 'var(--omnily-spacing-4)' }}>
                            <label>Colore Overlay</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--omnily-spacing-3)' }}>
                              <input
                                type="color"
                                value={config.website_pricing_overlay_color || '#000000'}
                                onChange={(e) => updateConfig('website_pricing_overlay_color', e.target.value)}
                                style={{ width: '60px', height: '40px', borderRadius: 'var(--omnily-border-radius)', cursor: 'pointer', border: '2px solid var(--omnily-border-color)' }}
                              />
                              <div style={{
                                flex: 1,
                                height: '40px',
                                borderRadius: 'var(--omnily-border-radius)',
                                background: config.website_pricing_overlay_color || '#000000',
                                border: '2px solid var(--omnily-border-color)',
                                display: 'flex',
                                alignItems: 'center',
                                paddingLeft: 'var(--omnily-spacing-3)',
                                fontFamily: 'monospace',
                                fontSize: 'var(--omnily-font-size-sm)',
                                fontWeight: 600,
                                color: 'white'
                              }}>
                                {config.website_pricing_overlay_color || '#000000'}
                              </div>
                            </div>
                          </div>

                          <div className="form-group">
                            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--omnily-spacing-2)' }}>
                              <span>Opacità Overlay</span>
                              <span style={{
                                fontWeight: 700,
                                fontSize: 'var(--omnily-font-size-lg)',
                                color: primaryColor,
                                minWidth: '50px',
                                textAlign: 'right'
                              }}>
                                {Math.round((config.website_pricing_overlay_opacity || 0.5) * 100)}%
                              </span>
                            </label>
                            <div style={{ position: 'relative', padding: 'var(--omnily-spacing-2) 0' }}>
                              <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.05"
                                value={config.website_pricing_overlay_opacity || 0.5}
                                onChange={(e) => updateConfig('website_pricing_overlay_opacity', parseFloat(e.target.value))}
                                style={{
                                  background: `linear-gradient(to right, transparent 0%, ${config.website_pricing_overlay_color || '#000000'} 100%)`,
                                  color: primaryColor
                                }}
                              />
                            </div>
                            <div style={{
                              marginTop: 'var(--omnily-spacing-3)',
                              padding: 'var(--omnily-spacing-3)',
                              borderRadius: 'var(--omnily-border-radius)',
                              background: 'white',
                              border: '2px solid var(--omnily-border-color)',
                              position: 'relative',
                              overflow: 'hidden',
                              height: '60px'
                            }}>
                              <div style={{
                                position: 'absolute',
                                inset: 0,
                                background: config.website_pricing_overlay_color || '#000000',
                                opacity: config.website_pricing_overlay_opacity || 0.5
                              }} />
                              <div style={{ position: 'relative', zIndex: 1, color: 'white', fontWeight: 600, textAlign: 'center', lineHeight: '56px' }}>
                                Anteprima Overlay
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* Text Color */}
                <div className="form-group">
                  <label>Colore Testo Principale</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--omnily-spacing-3)', marginBottom: 'var(--omnily-spacing-2)' }}>
                    <input
                      type="color"
                      value={config.website_pricing_text_color || '#1f2937'}
                      onChange={(e) => updateConfig('website_pricing_text_color', e.target.value)}
                      style={{ width: '60px', height: '40px', borderRadius: 'var(--omnily-border-radius)', cursor: 'pointer', border: '2px solid var(--omnily-border-color)' }}
                    />
                    <div style={{
                      flex: 1,
                      height: '40px',
                      borderRadius: 'var(--omnily-border-radius)',
                      background: 'white',
                      border: '2px solid var(--omnily-border-color)',
                      display: 'flex',
                      alignItems: 'center',
                      paddingLeft: 'var(--omnily-spacing-3)',
                      fontFamily: 'monospace',
                      fontSize: 'var(--omnily-font-size-sm)',
                      fontWeight: 600,
                      color: config.website_pricing_text_color || '#1f2937'
                    }}>
                      {config.website_pricing_text_color || '#1f2937'}
                    </div>
                  </div>
                  <small style={{ color: 'var(--omnily-gray-600)', fontSize: 'var(--omnily-font-size-sm)' }}>
                    ⚠️ Assicurati che il testo sia leggibile sullo sfondo scelto
                  </small>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--omnily-spacing-6)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--omnily-spacing-3)' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: 'var(--omnily-border-radius-lg)',
                    background: `linear-gradient(135deg, ${primaryColor}20, ${primaryColor}10)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <DollarSign size={24} style={{ color: primaryColor }} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0 }}>💰 Categorie Listino</h3>
                    <p style={{ margin: '4px 0 0 0', fontSize: 'var(--omnily-font-size-sm)', color: 'var(--omnily-gray-600)' }}>
                      {config.website_price_list_categories?.length || 0} {(config.website_price_list_categories?.length || 0) === 1 ? 'categoria' : 'categorie'}
                    </p>
                  </div>
                </div>
                <button onClick={addPriceListCategory} className="btn-add" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)` }}>
                  <Plus className="w-5 h-5" />
                  Nuova Categoria
                </button>
              </div>

              {(!config.website_price_list_categories || config.website_price_list_categories.length === 0) ? (
                <div className="empty-state">
                  <div style={{
                    width: '100px',
                    height: '100px',
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, ${primaryColor}15, ${primaryColor}05)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto var(--omnily-spacing-6) auto'
                  }}>
                    <DollarSign size={50} style={{ color: primaryColor }} />
                  </div>
                  <h4 style={{ fontSize: 'var(--omnily-font-size-xl)', fontWeight: 700, marginBottom: 'var(--omnily-spacing-3)' }}>
                    Nessuna Categoria Ancora
                  </h4>
                  <p style={{ fontSize: 'var(--omnily-font-size-base)', color: 'var(--omnily-gray-600)', marginBottom: 'var(--omnily-spacing-2)' }}>
                    Inizia ad aggiungere categorie per il tuo listino!
                  </p>
                  <p style={{ fontSize: 'var(--omnily-font-size-sm)', color: 'var(--omnily-gray-500)', marginBottom: 'var(--omnily-spacing-6)', maxWidth: '600px', margin: '0 auto var(--omnily-spacing-6) auto' }}>
                    💡 Organizza i servizi in categorie (es: Tagli, Colorazioni, Trattamenti per un parrucchiere)
                  </p>
                  <button
                    onClick={addPriceListCategory}
                    className="btn-primary"
                    style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)`, boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)' }}
                  >
                    <DollarSign className="w-5 h-5" />
                    Aggiungi Prima Categoria
                  </button>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: 'var(--omnily-spacing-6)' }}>
                  {config.website_price_list_categories.map((category: any, catIndex: number) => (
                    <div
                      key={category.id || catIndex}
                      style={{
                        background: 'white',
                        borderRadius: 'var(--omnily-border-radius-xl)',
                        padding: 'var(--omnily-spacing-6)',
                        border: '2px solid var(--omnily-border-color)',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
                      }}
                    >
                      {/* Category Header */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--omnily-spacing-5)' }}>
                        <div style={{ flex: 1 }}>
                          <div className="form-group">
                            <label>Nome Categoria</label>
                            <input
                              type="text"
                              value={category.name || ''}
                              onChange={(e) => updatePriceListCategory(catIndex, 'name', e.target.value)}
                              placeholder="es: Tagli Capelli"
                              style={{ fontSize: 'var(--omnily-font-size-lg)', fontWeight: 600 }}
                            />
                          </div>
                          <div className="form-group">
                            <label>Descrizione Categoria (opzionale)</label>
                            <input
                              type="text"
                              value={category.description || ''}
                              onChange={(e) => updatePriceListCategory(catIndex, 'description', e.target.value)}
                              placeholder="es: Tagli moderni e personalizzati"
                            />
                          </div>
                        </div>
                        <button
                          onClick={() => removePriceListCategory(catIndex)}
                          style={{
                            background: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: 'var(--omnily-border-radius-md)',
                            padding: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginLeft: 'var(--omnily-spacing-3)',
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      {/* Items */}
                      <div style={{ borderTop: '1px solid var(--omnily-border-color)', paddingTop: 'var(--omnily-spacing-4)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--omnily-spacing-4)' }}>
                          <h4 style={{ margin: 0, fontSize: 'var(--omnily-font-size-base)', color: 'var(--omnily-gray-700)' }}>
                            Servizi / Prodotti ({category.items?.length || 0})
                          </h4>
                          <button
                            onClick={() => addPriceListItem(catIndex)}
                            className="btn-sm"
                            style={{ background: primaryColor, color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}
                          >
                            <Plus size={16} />
                            Aggiungi Servizio
                          </button>
                        </div>

                        {(!category.items || category.items.length === 0) ? (
                          <div style={{ textAlign: 'center', padding: 'var(--omnily-spacing-6)', background: 'var(--omnily-gray-50)', borderRadius: 'var(--omnily-border-radius-md)' }}>
                            <p style={{ margin: 0, color: 'var(--omnily-gray-500)', fontSize: 'var(--omnily-font-size-sm)' }}>
                              Nessun servizio ancora. Clicca "Aggiungi Servizio" per iniziare.
                            </p>
                          </div>
                        ) : (
                          <div style={{ display: 'grid', gap: 'var(--omnily-spacing-4)' }}>
                            {category.items.map((item: any, itemIndex: number) => (
                              <div
                                key={item.id || itemIndex}
                                style={{
                                  background: 'var(--omnily-gray-50)',
                                  borderRadius: 'var(--omnily-border-radius-lg)',
                                  padding: 'var(--omnily-spacing-4)',
                                  border: '1px solid var(--omnily-border-color)',
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--omnily-spacing-3)' }}>
                                  <div style={{ flex: 1, display: 'grid', gap: 'var(--omnily-spacing-3)' }}>
                                    <div className="form-row">
                                      <div className="form-group">
                                        <label>Nome Servizio</label>
                                        <input
                                          type="text"
                                          value={item.name || ''}
                                          onChange={(e) => updatePriceListItem(catIndex, itemIndex, 'name', e.target.value)}
                                          placeholder="es: Taglio Uomo"
                                        />
                                      </div>
                                      <div className="form-group">
                                        <label>Prezzo</label>
                                        <input
                                          type="text"
                                          value={item.price || ''}
                                          onChange={(e) => updatePriceListItem(catIndex, itemIndex, 'price', e.target.value)}
                                          placeholder="es: €25"
                                        />
                                      </div>
                                    </div>
                                    <div className="form-group">
                                      <label>Descrizione (opzionale)</label>
                                      <input
                                        type="text"
                                        value={item.description || ''}
                                        onChange={(e) => updatePriceListItem(catIndex, itemIndex, 'description', e.target.value)}
                                        placeholder="es: Taglio classico con shampoo"
                                      />
                                    </div>
                                    <div className="form-group">
                                      <label>Durata (opzionale)</label>
                                      <input
                                        type="text"
                                        value={item.duration || ''}
                                        onChange={(e) => updatePriceListItem(catIndex, itemIndex, 'duration', e.target.value)}
                                        placeholder="es: 30 min"
                                      />
                                    </div>
                                    <div className="form-group">
                                      <ImageUploader
                                        label="Immagine Servizio (opzionale)"
                                        value={item.image || ''}
                                        onChange={(url) => updatePriceListItem(catIndex, itemIndex, 'image', url)}
                                        bucket="website-images"
                                        folder="price-list"
                                        maxSizeMB={2}
                                      />
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => removePriceListItem(catIndex, itemIndex)}
                                    style={{
                                      background: '#ef4444',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: 'var(--omnily-border-radius-md)',
                                      padding: '8px',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      flexShrink: 0,
                                    }}
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Typography & Colors Tab */}
        {activeTab === 'typography' && (
          <>
            {/* Info Card Motivante */}
            <InfoCard
              icon={Type}
              title="🎨 Tipografia & Colori: Il Tuo Brand, Il Tuo Stile"
              description="La tipografia e i colori sono l'anima del tuo brand! Scegli font da Google Fonts e crea una palette armoniosa. Le impostazioni globali si applicano a tutto il sito, ma ogni sezione può avere il suo stile personalizzato."
              primaryColor={primaryColor}
            />

            <div className="config-section" style={{ marginTop: 'var(--omnily-spacing-6)' }}>
              {/* Typography Section */}
              <div style={{ marginBottom: 'var(--omnily-spacing-6)', padding: 'var(--omnily-spacing-5)', background: 'white', border: '2px solid var(--omnily-border-color)', borderRadius: 'var(--omnily-border-radius-lg)' }}>
                <h4 style={{ margin: '0 0 var(--omnily-spacing-4) 0', fontSize: 'var(--omnily-font-size-lg)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 'var(--omnily-spacing-2)' }}>
                  <Type size={20} style={{ color: primaryColor }} />
                  Font Globali (Google Fonts)
                </h4>
                <p style={{ margin: '0 0 var(--omnily-spacing-4) 0', fontSize: 'var(--omnily-font-size-sm)', color: 'var(--omnily-gray-600)' }}>
                  Seleziona i font che rappresentano il tuo brand. Verranno applicati a tutto il sito.
                </p>

                <div className="form-group">
                  <label>Font per Titoli (Headings)</label>
                  <select
                    value={config.website_font_headings || 'Inter'}
                    onChange={(e) => updateConfig('website_font_headings', e.target.value)}
                  >
                    <optgroup label="✨ Font Consigliati">
                      <option value="Inter">Inter (Moderno e Leggibile)</option>
                      <option value="Poppins">Poppins (Geometrico e Friendly)</option>
                      <option value="Montserrat">Montserrat (Elegante e Versatile)</option>
                      <option value="Playfair Display">Playfair Display (Classico e Sofisticato)</option>
                      <option value="Raleway">Raleway (Pulito e Professionale)</option>
                    </optgroup>
                    <optgroup label="📚 Tutti i Font">
                      <option value="Roboto">Roboto</option>
                      <option value="Open Sans">Open Sans</option>
                      <option value="Lato">Lato</option>
                      <option value="Oswald">Oswald</option>
                      <option value="Source Sans Pro">Source Sans Pro</option>
                      <option value="Merriweather">Merriweather</option>
                      <option value="Nunito">Nunito</option>
                      <option value="Ubuntu">Ubuntu</option>
                      <option value="Quicksand">Quicksand</option>
                      <option value="Work Sans">Work Sans</option>
                      <option value="DM Sans">DM Sans</option>
                      <option value="Archivo">Archivo</option>
                      <option value="Barlow">Barlow</option>
                      <option value="Bebas Neue">Bebas Neue</option>
                      <option value="Cormorant Garamond">Cormorant Garamond</option>
                      <option value="Crimson Text">Crimson Text</option>
                      <option value="EB Garamond">EB Garamond</option>
                      <option value="Fira Sans">Fira Sans</option>
                      <option value="IBM Plex Sans">IBM Plex Sans</option>
                      <option value="Josefin Sans">Josefin Sans</option>
                      <option value="Lexend">Lexend</option>
                      <option value="Libre Baskerville">Libre Baskerville</option>
                      <option value="Lora">Lora</option>
                      <option value="Manrope">Manrope</option>
                      <option value="Noto Sans">Noto Sans</option>
                      <option value="PT Sans">PT Sans</option>
                      <option value="PT Serif">PT Serif</option>
                      <option value="Red Hat Display">Red Hat Display</option>
                      <option value="Rubik">Rubik</option>
                      <option value="Space Grotesk">Space Grotesk</option>
                      <option value="Titillium Web">Titillium Web</option>
                    </optgroup>
                  </select>
                  {/* Font Preview */}
                  <div style={{
                    marginTop: 'var(--omnily-spacing-3)',
                    padding: 'var(--omnily-spacing-4)',
                    background: 'var(--omnily-gray-50)',
                    borderRadius: 'var(--omnily-border-radius)',
                    border: '1px solid var(--omnily-border-color)'
                  }}>
                    <link
                      href={`https://fonts.googleapis.com/css2?family=${(config.website_font_headings || 'Inter').replace(' ', '+')}:wght@400;600;700;900&display=swap`}
                      rel="stylesheet"
                    />
                    <div style={{ fontFamily: `'${config.website_font_headings || 'Inter'}', sans-serif`, fontSize: '24px', fontWeight: 700 }}>
                      Il tuo Titolo
                    </div>
                    <div style={{ fontFamily: `'${config.website_font_headings || 'Inter'}', sans-serif`, fontSize: '18px', fontWeight: 600, color: 'var(--omnily-gray-600)', marginTop: '4px' }}>
                      Sottotitolo di esempio
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label>Font per Testo (Body)</label>
                  <select
                    value={config.website_font_body || 'Inter'}
                    onChange={(e) => updateConfig('website_font_body', e.target.value)}
                  >
                    <optgroup label="✨ Font Consigliati">
                      <option value="Inter">Inter (Moderno e Leggibile)</option>
                      <option value="Poppins">Poppins (Geometrico e Friendly)</option>
                      <option value="Montserrat">Montserrat (Elegante e Versatile)</option>
                      <option value="Open Sans">Open Sans (Neutrale e Professionale)</option>
                      <option value="Lato">Lato (Caldo e Friendly)</option>
                    </optgroup>
                    <optgroup label="📚 Tutti i Font">
                      <option value="Roboto">Roboto</option>
                      <option value="Raleway">Raleway</option>
                      <option value="Oswald">Oswald</option>
                      <option value="Source Sans Pro">Source Sans Pro</option>
                      <option value="Merriweather">Merriweather</option>
                      <option value="Nunito">Nunito</option>
                      <option value="Ubuntu">Ubuntu</option>
                      <option value="Quicksand">Quicksand</option>
                      <option value="Work Sans">Work Sans</option>
                      <option value="DM Sans">DM Sans</option>
                      <option value="Archivo">Archivo</option>
                      <option value="Barlow">Barlow</option>
                      <option value="Cormorant Garamond">Cormorant Garamond</option>
                      <option value="Crimson Text">Crimson Text</option>
                      <option value="EB Garamond">EB Garamond</option>
                      <option value="Fira Sans">Fira Sans</option>
                      <option value="IBM Plex Sans">IBM Plex Sans</option>
                      <option value="Josefin Sans">Josefin Sans</option>
                      <option value="Lexend">Lexend</option>
                      <option value="Libre Baskerville">Libre Baskerville</option>
                      <option value="Lora">Lora</option>
                      <option value="Manrope">Manrope</option>
                      <option value="Noto Sans">Noto Sans</option>
                      <option value="Playfair Display">Playfair Display</option>
                      <option value="PT Sans">PT Sans</option>
                      <option value="PT Serif">PT Serif</option>
                      <option value="Red Hat Display">Red Hat Display</option>
                      <option value="Rubik">Rubik</option>
                      <option value="Space Grotesk">Space Grotesk</option>
                      <option value="Titillium Web">Titillium Web</option>
                    </optgroup>
                  </select>
                  {/* Font Preview */}
                  <div style={{
                    marginTop: 'var(--omnily-spacing-3)',
                    padding: 'var(--omnily-spacing-4)',
                    background: 'var(--omnily-gray-50)',
                    borderRadius: 'var(--omnily-border-radius)',
                    border: '1px solid var(--omnily-border-color)'
                  }}>
                    <link
                      href={`https://fonts.googleapis.com/css2?family=${(config.website_font_body || 'Inter').replace(' ', '+')}:wght@300;400;500;600&display=swap`}
                      rel="stylesheet"
                    />
                    <div style={{ fontFamily: `'${config.website_font_body || 'Inter'}', sans-serif`, fontSize: '16px', lineHeight: 1.6 }}>
                      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Questo è un esempio di testo con il font selezionato. Puoi vedere come appare il testo normale nel tuo sito web.
                    </div>
                  </div>
                </div>
              </div>

              {/* Color Palette Section */}
              <div style={{ marginBottom: 'var(--omnily-spacing-6)', padding: 'var(--omnily-spacing-5)', background: 'white', border: '2px solid var(--omnily-border-color)', borderRadius: 'var(--omnily-border-radius-lg)' }}>
                <h4 style={{ margin: '0 0 var(--omnily-spacing-2) 0', fontSize: 'var(--omnily-font-size-lg)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 'var(--omnily-spacing-2)' }}>
                  <Palette size={20} style={{ color: primaryColor }} />
                  Palette Colori Globale
                </h4>
                <p style={{ margin: '0 0 var(--omnily-spacing-6) 0', fontSize: 'var(--omnily-font-size-sm)', color: 'var(--omnily-gray-600)' }}>
                  Definisci i colori principali del tuo sito. Ogni sezione può sovrascrivere questi colori se necessario.
                </p>

                {/* Testo Primario */}
                <div style={{ marginBottom: 'var(--omnily-spacing-5)' }}>
                  <h5 style={{ margin: '0 0 var(--omnily-spacing-3) 0', fontSize: 'var(--omnily-font-size-base)', fontWeight: 700, color: primaryColor, display: 'flex', alignItems: 'center', gap: 'var(--omnily-spacing-2)' }}>
                    <Palette size={16} />
                    Testo Primario
                  </h5>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--omnily-spacing-3)' }}>
                    <div style={{
                      padding: 'var(--omnily-spacing-4)',
                      borderRadius: 'var(--omnily-border-radius-lg)',
                      border: '2px solid var(--omnily-border-color)',
                      background: '#fafafa',
                      transition: 'all 0.2s',
                      cursor: 'pointer'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--omnily-spacing-3)' }}>
                        <div style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '12px',
                          background: config.website_color_text_primary || '#1F2937',
                          border: '3px solid white',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                        }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 'var(--omnily-font-size-lg)', fontWeight: 700, color: '#1f2937', marginBottom: '2px' }}>
                            {(config.website_color_text_primary || '#1F2937').toUpperCase()}
                          </div>
                          <div style={{ fontSize: 'var(--omnily-font-size-xs)', color: '#6b7280' }}>
                            Usato per titoli e testo importante
                          </div>
                        </div>
                        <input
                          type="color"
                          value={config.website_color_text_primary || '#1F2937'}
                          onChange={(e) => updateConfig('website_color_text_primary', e.target.value)}
                          style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '12px',
                            border: '2px solid var(--omnily-border-color)',
                            cursor: 'pointer'
                          }}
                        />
                      </div>
                    </div>

                    <div style={{
                      padding: 'var(--omnily-spacing-4)',
                      borderRadius: 'var(--omnily-border-radius-lg)',
                      border: '2px solid var(--omnily-border-color)',
                      background: '#fafafa',
                      transition: 'all 0.2s',
                      cursor: 'pointer'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--omnily-spacing-3)' }}>
                        <div style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '12px',
                          background: config.website_color_text_secondary || '#FF2600',
                          border: '3px solid white',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                        }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 'var(--omnily-font-size-lg)', fontWeight: 700, color: '#1f2937', marginBottom: '2px' }}>
                            {(config.website_color_text_secondary || '#FF2600').toUpperCase()}
                          </div>
                          <div style={{ fontSize: 'var(--omnily-font-size-xs)', color: '#6b7280' }}>
                            Usato per testo normale e descrizioni
                          </div>
                        </div>
                        <input
                          type="color"
                          value={config.website_color_text_secondary || '#FF2600'}
                          onChange={(e) => updateConfig('website_color_text_secondary', e.target.value)}
                          style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '12px',
                            border: '2px solid var(--omnily-border-color)',
                            cursor: 'pointer'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Testo Secondario */}
                <div style={{ marginBottom: 'var(--omnily-spacing-5)' }}>
                  <h5 style={{ margin: '0 0 var(--omnily-spacing-3) 0', fontSize: 'var(--omnily-font-size-base)', fontWeight: 700, color: primaryColor, display: 'flex', alignItems: 'center', gap: 'var(--omnily-spacing-2)' }}>
                    <Palette size={16} />
                    Sfondi
                  </h5>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--omnily-spacing-3)' }}>
                    <div style={{
                      padding: 'var(--omnily-spacing-4)',
                      borderRadius: 'var(--omnily-border-radius-lg)',
                      border: '2px solid var(--omnily-border-color)',
                      background: '#fafafa',
                      transition: 'all 0.2s',
                      cursor: 'pointer'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--omnily-spacing-3)' }}>
                        <div style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '12px',
                          background: config.website_color_background_primary || '#FFFFFF',
                          border: '3px solid white',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                        }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 'var(--omnily-font-size-lg)', fontWeight: 700, color: '#1f2937', marginBottom: '2px' }}>
                            {(config.website_color_background_primary || '#FFFFFF').toUpperCase()}
                          </div>
                          <div style={{ fontSize: 'var(--omnily-font-size-xs)', color: '#6b7280' }}>
                            Sfondo principale delle sezioni
                          </div>
                        </div>
                        <input
                          type="color"
                          value={config.website_color_background_primary || '#FFFFFF'}
                          onChange={(e) => updateConfig('website_color_background_primary', e.target.value)}
                          style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '12px',
                            border: '2px solid var(--omnily-border-color)',
                            cursor: 'pointer'
                          }}
                        />
                      </div>
                    </div>

                    <div style={{
                      padding: 'var(--omnily-spacing-4)',
                      borderRadius: 'var(--omnily-border-radius-lg)',
                      border: '2px solid var(--omnily-border-color)',
                      background: '#fafafa',
                      transition: 'all 0.2s',
                      cursor: 'pointer'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--omnily-spacing-3)' }}>
                        <div style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '12px',
                          background: config.website_color_background_secondary || '#F9FAFB',
                          border: '3px solid white',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                        }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 'var(--omnily-font-size-lg)', fontWeight: 700, color: '#1f2937', marginBottom: '2px' }}>
                            {(config.website_color_background_secondary || '#F9FAFB').toUpperCase()}
                          </div>
                          <div style={{ fontSize: 'var(--omnily-font-size-xs)', color: '#6b7280' }}>
                            Sfondo alternativo per contrasto
                          </div>
                        </div>
                        <input
                          type="color"
                          value={config.website_color_background_secondary || '#F9FAFB'}
                          onChange={(e) => updateConfig('website_color_background_secondary', e.target.value)}
                          style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '12px',
                            border: '2px solid var(--omnily-border-color)',
                            cursor: 'pointer'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Color Preview */}
                <div style={{
                  marginTop: 'var(--omnily-spacing-5)',
                  padding: 'var(--omnily-spacing-5)',
                  borderRadius: 'var(--omnily-border-radius-lg)',
                  background: config.website_color_background_primary || '#ffffff',
                  border: '2px solid var(--omnily-border-color)'
                }}>
                  <h5 style={{
                    margin: '0 0 var(--omnily-spacing-3) 0',
                    color: config.website_color_text_primary || '#1f2937',
                    fontFamily: `'${config.website_font_headings || 'Inter'}', sans-serif`,
                    fontSize: '20px',
                    fontWeight: 700
                  }}>
                    Anteprima Palette
                  </h5>
                  <p style={{
                    margin: '0 0 var(--omnily-spacing-4) 0',
                    color: config.website_color_text_secondary || '#6b7280',
                    fontFamily: `'${config.website_font_body || 'Inter'}', sans-serif`,
                    lineHeight: 1.6
                  }}>
                    Questo è un esempio di come appariranno i tuoi colori e font sul sito. Il titolo usa il colore e font primari, mentre questo paragrafo usa il colore e font secondari.
                  </p>
                  <div style={{
                    padding: 'var(--omnily-spacing-3)',
                    background: config.website_color_background_secondary || '#f9fafb',
                    borderRadius: 'var(--omnily-border-radius)',
                    color: config.website_color_text_secondary || '#6b7280',
                    fontFamily: `'${config.website_font_body || 'Inter'}', sans-serif`,
                    fontSize: '14px'
                  }}>
                    Questo è uno sfondo secondario per creare contrasto
                  </div>
                </div>
              </div>

              {/* Button Styling Section */}
              <div style={{ marginBottom: 'var(--omnily-spacing-6)', padding: 'var(--omnily-spacing-5)', background: 'white', border: '2px solid var(--omnily-border-color)', borderRadius: 'var(--omnily-border-radius-lg)' }}>
                <h4 style={{ margin: '0 0 var(--omnily-spacing-4) 0', fontSize: 'var(--omnily-font-size-lg)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 'var(--omnily-spacing-2)' }}>
                  <Zap size={20} style={{ color: primaryColor }} />
                  Stile Pulsanti Globali
                </h4>
                <p style={{ margin: '0 0 var(--omnily-spacing-4) 0', fontSize: 'var(--omnily-font-size-sm)', color: 'var(--omnily-gray-600)' }}>
                  Personalizza l'aspetto di tutti i pulsanti del sito (CTA, form, ecc.)
                </p>

                {/* Button Colors */}
                <div className="form-row">
                  <ColorPicker
                    label="Colore Sfondo"
                    value={config.website_button_bg_color || primaryColor}
                    onChange={(color) => updateConfig('website_button_bg_color', color)}
                    description="Colore di sfondo del pulsante"
                    primaryColor={primaryColor}
                  />

                  <ColorPicker
                    label="Colore Testo"
                    value={config.website_button_text_color || '#ffffff'}
                    onChange={(color) => updateConfig('website_button_text_color', color)}
                    description="Colore del testo del pulsante"
                    primaryColor={primaryColor}
                  />
                </div>

                {/* Hover Colors */}
                <div className="form-row">
                  <ColorPicker
                    label="Colore Sfondo (Hover)"
                    value={config.website_button_hover_bg_color || '#dc2626'}
                    onChange={(color) => updateConfig('website_button_hover_bg_color', color)}
                    description="Colore quando passi sopra col mouse"
                    primaryColor={primaryColor}
                  />

                  <ColorPicker
                    label="Colore Testo (Hover)"
                    value={config.website_button_hover_text_color || '#ffffff'}
                    onChange={(color) => updateConfig('website_button_hover_text_color', color)}
                    description="Colore testo al passaggio del mouse"
                    primaryColor={primaryColor}
                  />
                </div>

                {/* Border Settings */}
                <div className="form-row">
                  <div className="form-group">
                    <label>Spessore Bordo</label>
                    <select
                      value={config.website_button_border_width || '0px'}
                      onChange={(e) => updateConfig('website_button_border_width', e.target.value)}
                    >
                      <option value="0px">Nessuno (0px)</option>
                      <option value="1px">Sottile (1px)</option>
                      <option value="2px">Medio (2px)</option>
                      <option value="3px">Spesso (3px)</option>
                      <option value="4px">Molto Spesso (4px)</option>
                    </select>
                  </div>

                  <ColorPicker
                    label="Colore Bordo"
                    value={config.website_button_border_color || primaryColor}
                    onChange={(color) => updateConfig('website_button_border_color', color)}
                    description="Colore del bordo del pulsante"
                    primaryColor={primaryColor}
                  />
                </div>

                {/* Border Radius & Font Weight */}
                <div className="form-row">
                  <div className="form-group">
                    <label>Arrotondamento Angoli</label>
                    <select
                      value={config.website_button_border_radius || '8px'}
                      onChange={(e) => updateConfig('website_button_border_radius', e.target.value)}
                    >
                      <option value="0px">Quadrato (0px)</option>
                      <option value="4px">Leggermente Arrotondato (4px)</option>
                      <option value="8px">Arrotondato (8px)</option>
                      <option value="12px">Molto Arrotondato (12px)</option>
                      <option value="16px">Extra Arrotondato (16px)</option>
                      <option value="24px">Tondeggiante (24px)</option>
                      <option value="999px">Pillola (999px)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Spessore Font</label>
                    <select
                      value={config.website_button_font_weight || '600'}
                      onChange={(e) => updateConfig('website_button_font_weight', e.target.value)}
                    >
                      <option value="400">Normale (400)</option>
                      <option value="500">Medio (500)</option>
                      <option value="600">Semi-Bold (600)</option>
                      <option value="700">Bold (700)</option>
                      <option value="800">Extra-Bold (800)</option>
                      <option value="900">Black (900)</option>
                    </select>
                  </div>
                </div>

                {/* Padding */}
                <div className="form-group">
                  <label>Spaziatura Interna (Padding)</label>
                  <select
                    value={config.website_button_padding || '12px 24px'}
                    onChange={(e) => updateConfig('website_button_padding', e.target.value)}
                  >
                    <option value="8px 16px">Piccolo (8px 16px)</option>
                    <option value="10px 20px">Medio-Piccolo (10px 20px)</option>
                    <option value="12px 24px">Medio (12px 24px)</option>
                    <option value="14px 28px">Medio-Grande (14px 28px)</option>
                    <option value="16px 32px">Grande (16px 32px)</option>
                    <option value="18px 36px">Molto Grande (18px 36px)</option>
                    <option value="20px 40px">Extra Grande (20px 40px)</option>
                  </select>
                </div>

                {/* Button Preview */}
                <div style={{
                  marginTop: 'var(--omnily-spacing-5)',
                  padding: 'var(--omnily-spacing-5)',
                  borderRadius: 'var(--omnily-border-radius-lg)',
                  background: 'var(--omnily-gray-50)',
                  border: '2px solid var(--omnily-border-color)',
                  textAlign: 'center'
                }}>
                  <h5 style={{ margin: '0 0 var(--omnily-spacing-4) 0', fontSize: 'var(--omnily-font-size-base)', fontWeight: 700 }}>
                    Anteprima Pulsante
                  </h5>
                  <button
                    style={{
                      background: config.website_button_bg_color || primaryColor,
                      color: config.website_button_text_color || '#ffffff',
                      borderRadius: config.website_button_border_radius || '8px',
                      border: `${config.website_button_border_width || '0px'} solid ${config.website_button_border_color || primaryColor}`,
                      padding: config.website_button_padding || '12px 24px',
                      fontWeight: config.website_button_font_weight || '600',
                      fontSize: '16px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      fontFamily: `'${config.website_font_body || 'Inter'}', sans-serif`
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = config.website_button_hover_bg_color || '#dc2626'
                      e.currentTarget.style.color = config.website_button_hover_text_color || '#ffffff'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = config.website_button_bg_color || primaryColor
                      e.currentTarget.style.color = config.website_button_text_color || '#ffffff'
                    }}
                  >
                    Clicca Qui - Esempio Pulsante
                  </button>
                  <p style={{ margin: 'var(--omnily-spacing-3) 0 0 0', fontSize: 'var(--omnily-font-size-sm)', color: 'var(--omnily-gray-600)' }}>
                    Passa il mouse sopra per vedere l'effetto hover
                  </p>
                </div>
              </div>

              {/* Info Box */}
              <div style={{
                padding: 'var(--omnily-spacing-4)',
                background: `${primaryColor}10`,
                borderRadius: 'var(--omnily-border-radius-lg)',
                border: `2px solid ${primaryColor}30`
              }}>
                <div style={{ display: 'flex', alignItems: 'start', gap: 'var(--omnily-spacing-3)' }}>
                  <Lightbulb size={20} style={{ color: primaryColor, flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <h5 style={{ margin: '0 0 var(--omnily-spacing-2) 0', fontSize: 'var(--omnily-font-size-base)', fontWeight: 700, color: primaryColor }}>
                      💡 Suggerimenti per Font e Colori
                    </h5>
                    <ul style={{ margin: 0, paddingLeft: '20px', fontSize: 'var(--omnily-font-size-sm)', color: 'var(--omnily-gray-700)', lineHeight: 1.6 }}>
                      <li>Usa massimo 2 font: uno per i titoli e uno per il testo</li>
                      <li>Assicurati che ci sia abbastanza contrasto tra testo e sfondo</li>
                      <li>I font sans-serif (Inter, Poppins) sono più moderni e leggibili</li>
                      <li>I font serif (Playfair, Merriweather) sono più eleganti e classici</li>
                      <li>I pulsanti devono essere visibili e invitare al click (usa colori vivaci)</li>
                      <li>Il colore hover dovrebbe essere leggermente più scuro o più chiaro dello sfondo normale</li>
                      <li>Puoi sovrascrivere questi colori in ogni singola sezione se necessario</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* GDPR Tab */}
        {activeTab === 'gdpr' && (
          <>
            {/* Info Card Motivante */}
            <InfoCard
              icon={Shield}
              title="🔒 GDPR & Cookie: Conformità e Fiducia"
              description="La conformità GDPR non è solo obbligatoria - dimostra che rispetti i tuoi utenti! Un banner cookie professionale aumenta la fiducia e protegge la tua attività da sanzioni."
              primaryColor={primaryColor}
            />

            <div className="config-section" style={{ marginTop: 'var(--omnily-spacing-6)' }}>
              <div style={{
                background: 'white',
                borderRadius: 'var(--omnily-border-radius-xl)',
                padding: 'var(--omnily-spacing-6)',
                border: '2px solid var(--omnily-border-color)',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
              }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: 'var(--omnily-spacing-5)' }}>
                  <Cookie size={24} style={{ color: primaryColor }} />
                  Configurazione Banner Cookie
                </h3>

                <div className="form-group">
                  <label>
                    <ToggleSwitch
                      checked={config.website_show_gdpr_banner ?? true}
                      onChange={(checked) => updateConfig('website_show_gdpr_banner', checked)}
                      label="Mostra Banner Cookie"
                      primaryColor={primaryColor}
                    />
                  </label>
                  <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
                    ⚠️ Obbligatorio per legge se usi Google Analytics, Facebook Pixel o altri cookie di tracciamento
                  </p>
                </div>

                <div className="form-group">
                  <label>Posizione Banner</label>
                  <select
                    value={config.website_gdpr_banner_position || 'bottom'}
                    onChange={(e) => updateConfig('website_gdpr_banner_position', e.target.value)}
                  >
                    <option value="bottom">In Basso</option>
                    <option value="top">In Alto</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>
                    <ToggleSwitch
                      checked={config.website_gdpr_show_preferences ?? true}
                      onChange={(checked) => updateConfig('website_gdpr_show_preferences', checked)}
                      label="Mostra Pulsante Preferenze"
                      primaryColor={primaryColor}
                    />
                  </label>
                  <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
                    Permette agli utenti di personalizzare le loro preferenze sui cookie
                  </p>
                </div>

                <div className="form-group">
                  <label>URL Privacy Policy</label>
                  <input
                    type="url"
                    value={config.website_privacy_policy_url || ''}
                    onChange={(e) => updateConfig('website_privacy_policy_url', e.target.value)}
                    placeholder="https://tuosito.com/privacy-policy"
                  />
                  <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
                    Link alla tua pagina Privacy Policy (obbligatoria per GDPR)
                  </p>
                </div>

                <div className="form-group">
                  <label>URL Cookie Policy</label>
                  <input
                    type="url"
                    value={config.website_cookie_policy_url || ''}
                    onChange={(e) => updateConfig('website_cookie_policy_url', e.target.value)}
                    placeholder="https://tuosito.com/cookie-policy"
                  />
                  <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
                    Link alla tua pagina Cookie Policy
                  </p>
                </div>

                {/* Info Box */}
                <div style={{
                  marginTop: 'var(--omnily-spacing-6)',
                  padding: 'var(--omnily-spacing-4)',
                  background: `linear-gradient(135deg, ${primaryColor}10, ${primaryColor}05)`,
                  borderRadius: 'var(--omnily-border-radius-lg)',
                  border: `1px solid ${primaryColor}30`
                }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#1f2937' }}>
                    📋 Categorie Cookie Gestite
                  </h4>
                  <ul style={{ margin: 0, paddingLeft: '20px', color: '#4b5563', fontSize: '14px', lineHeight: 1.8 }}>
                    <li><strong>Cookie Necessari:</strong> Sempre attivi (non disabilitabili)</li>
                    <li><strong>Cookie Analitici:</strong> Google Analytics, statistiche</li>
                    <li><strong>Cookie Marketing:</strong> Facebook Pixel, remarketing</li>
                    <li><strong>Cookie Preferenze:</strong> Impostazioni utente</li>
                  </ul>
                </div>

                {/* Warning Box */}
                <div style={{
                  marginTop: 'var(--omnily-spacing-4)',
                  padding: 'var(--omnily-spacing-4)',
                  background: '#fef3c7',
                  borderRadius: 'var(--omnily-border-radius-lg)',
                  border: '1px solid #f59e0b'
                }}>
                  <p style={{ margin: 0, fontSize: '14px', color: '#92400e' }}>
                    ⚠️ <strong>Importante:</strong> Assicurati di avere pagine Privacy Policy e Cookie Policy valide prima di pubblicare il sito. È un requisito legale GDPR!
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* SEO Tab */}
        {activeTab === 'seo' && (
          <>
            {/* Info Card Motivante */}
            <InfoCard
              icon={Search}
              title="🔍 SEO: La Chiave per Essere Trovati su Google"
              description="Un buon SEO può aumentare il traffico del 300%! Ottimizza titolo, descrizione e keywords per posizionarti in cima ai risultati di ricerca. Più visibilità = Più clienti!"
              primaryColor={primaryColor}
            />

            <div className="config-section" style={{ marginTop: 'var(--omnily-spacing-6)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--omnily-spacing-3)', marginBottom: 'var(--omnily-spacing-6)' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: 'var(--omnily-border-radius-lg)',
                  background: `linear-gradient(135deg, ${primaryColor}20, ${primaryColor}10)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Search size={24} style={{ color: primaryColor }} />
                </div>
                <div>
                  <h3 style={{ margin: 0 }}>🔍 SEO - Ottimizzazione per Motori di Ricerca</h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: 'var(--omnily-font-size-sm)', color: 'var(--omnily-gray-600)' }}>
                    Fai trovare il tuo sito da nuovi clienti
                  </p>
                </div>
              </div>

              {/* Google Preview */}
              {(config.website_meta_title || config.website_meta_description) && (
                <div style={{
                  padding: 'var(--omnily-spacing-6)',
                  background: `linear-gradient(135deg, ${primaryColor}08, ${primaryColor}03)`,
                  borderRadius: 'var(--omnily-border-radius-xl)',
                  marginBottom: 'var(--omnily-spacing-6)',
                  border: `2px solid ${primaryColor}20`
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--omnily-spacing-2)', marginBottom: 'var(--omnily-spacing-4)' }}>
                    <span style={{ fontSize: '20px' }}>🔍</span>
                    <h4 style={{ margin: 0, fontSize: 'var(--omnily-font-size-lg)', fontWeight: 700 }}>
                      Anteprima Google
                    </h4>
                  </div>
                  <div style={{
                    padding: 'var(--omnily-spacing-4)',
                    background: 'white',
                    borderRadius: 'var(--omnily-border-radius)',
                    fontFamily: 'Arial, sans-serif'
                  }}>
                    <div style={{ fontSize: '12px', color: '#5f6368', marginBottom: '4px' }}>
                      https://omnilypro.com/{config.website_slug || 'tuo-sito'}
                    </div>
                    <div style={{ fontSize: '20px', color: '#1a0dab', fontWeight: 400, marginBottom: '4px' }}>
                      {config.website_meta_title || 'Il Tuo Titolo SEO Apparirà Qui'}
                    </div>
                    <div style={{ fontSize: '14px', color: '#4d5156', lineHeight: '1.58' }}>
                      {config.website_meta_description || 'La tua descrizione SEO apparirà qui. Spiega chiaramente cosa offri in max 160 caratteri per convincere gli utenti a cliccare!'}
                    </div>
                  </div>
                  <div style={{ marginTop: 'var(--omnily-spacing-3)', fontSize: 'var(--omnily-font-size-sm)', color: 'var(--omnily-gray-600)' }}>
                    💡 Descrizione: {config.website_meta_description?.length || 0}/160 caratteri
                    {config.website_meta_description && config.website_meta_description.length > 160 && (
                      <span style={{ color: 'var(--omnily-error)', fontWeight: 600, marginLeft: '8px' }}>
                        ⚠️ Troppo lunga! Google la taglierà.
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="form-group">
                <label>Titolo SEO</label>
                <input
                  type="text"
                  value={config.website_meta_title || ''}
                  onChange={(e) => updateConfig('website_meta_title', e.target.value)}
                  placeholder="es: I Migliori Gelati Artigianali a Milano | Gelateria Dolce Vita"
                />
                <small style={{ color: 'var(--omnily-gray-500)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                  💡 Inserisci keywords principali + città + nome attività (50-60 caratteri ideali)
                </small>
              </div>

              <div className="form-group">
                <label>Descrizione SEO</label>
                <textarea
                  rows={3}
                  value={config.website_meta_description || ''}
                  onChange={(e) => updateConfig('website_meta_description', e.target.value)}
                  placeholder="Scopri i nostri gelati artigianali fatti con ingredienti freschi e naturali. Oltre 30 gusti unici nel cuore di Milano. Vieni a trovarci!"
                />
                <small style={{ color: 'var(--omnily-gray-500)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                  💡 Spiega cosa fai, i benefici e includi una call-to-action (max 160 caratteri)
                </small>
              </div>

              <div className="form-group">
                <label>Keywords SEO</label>
                <input
                  type="text"
                  value={config.website_meta_keywords || ''}
                  onChange={(e) => updateConfig('website_meta_keywords', e.target.value)}
                  placeholder="gelato artigianale, gelateria milano, gelato naturale, dolci milano"
                />
                <small style={{ color: 'var(--omnily-gray-500)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                  💡 5-10 parole chiave separate da virgola (cosa offri + dove + settore)
                </small>
              </div>

              <div className="form-group">
                <label>Immagine Open Graph (Condivisioni Social)</label>
                <input
                  type="text"
                  value={config.website_og_image || ''}
                  onChange={(e) => updateConfig('website_og_image', e.target.value)}
                  placeholder="URL immagine (1200x630px)"
                />
                {config.website_og_image && (
                  <div style={{
                    marginTop: 'var(--omnily-spacing-3)',
                    borderRadius: 'var(--omnily-border-radius)',
                    overflow: 'hidden',
                    maxWidth: '400px'
                  }}>
                    <img
                      src={config.website_og_image}
                      alt="OG Preview"
                      style={{ width: '100%', height: 'auto', display: 'block' }}
                    />
                  </div>
                )}
                <small style={{ color: 'var(--omnily-gray-500)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                  💡 Questa immagine appare quando condividi il sito su Facebook, WhatsApp, LinkedIn
                </small>
              </div>

              <div className="form-group">
                <label>Favicon URL</label>
                <input
                  type="text"
                  value={config.website_favicon_url || ''}
                  onChange={(e) => updateConfig('website_favicon_url', e.target.value)}
                  placeholder="URL del favicon (32x32px)"
                />
                {config.website_favicon_url && (
                  <div style={{ marginTop: 'var(--omnily-spacing-2)', display: 'flex', alignItems: 'center', gap: 'var(--omnily-spacing-2)' }}>
                    <img
                      src={config.website_favicon_url}
                      alt="Favicon"
                      style={{ width: '32px', height: '32px' }}
                    />
                    <span style={{ fontSize: 'var(--omnily-font-size-sm)', color: 'var(--omnily-gray-600)' }}>
                      Anteprima Favicon
                    </span>
                  </div>
                )}
                <small style={{ color: 'var(--omnily-gray-500)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                  💡 La piccola icona che appare nella tab del browser
                </small>
              </div>
            </div>

            {/* Tracking Section */}
            <div className="config-section" style={{ marginTop: 'var(--omnily-spacing-6)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--omnily-spacing-3)', marginBottom: 'var(--omnily-spacing-6)' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: 'var(--omnily-border-radius-lg)',
                  background: `linear-gradient(135deg, ${primaryColor}20, ${primaryColor}10)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <BarChart size={24} style={{ color: primaryColor }} />
                </div>
                <div>
                  <h3 style={{ margin: 0 }}>📊 Tracking e Analytics</h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: 'var(--omnily-font-size-sm)', color: 'var(--omnily-gray-600)' }}>
                    Monitora visitatori e conversioni
                  </p>
                </div>
              </div>

              <div className="form-group">
                <label>Google Analytics ID</label>
                <input
                  type="text"
                  value={config.website_google_analytics_id || ''}
                  onChange={(e) => updateConfig('website_google_analytics_id', e.target.value)}
                  placeholder="G-XXXXXXXXXX"
                />
                <small style={{ color: 'var(--omnily-gray-500)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                  💡 Traccia visitatori, pagine viste, tempo di permanenza e provenienza traffico
                </small>
              </div>

              <div className="form-group">
                <label>Google Tag Manager ID</label>
                <input
                  type="text"
                  value={config.website_google_tag_manager_id || ''}
                  onChange={(e) => updateConfig('website_google_tag_manager_id', e.target.value)}
                  placeholder="GTM-XXXXXXX"
                />
                <small style={{ color: 'var(--omnily-gray-500)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                  💡 Gestisci tutti i tag di marketing in un unico posto (avanzato)
                </small>
              </div>

              <div className="form-group">
                <label>Facebook Pixel ID</label>
                <input
                  type="text"
                  value={config.website_facebook_pixel_id || ''}
                  onChange={(e) => updateConfig('website_facebook_pixel_id', e.target.value)}
                  placeholder="XXXXXXXXXXXXXXX"
                />
                <small style={{ color: 'var(--omnily-gray-500)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                  💡 Ottimizza le tue campagne pubblicitarie Facebook e crea pubblici personalizzati
                </small>
              </div>
            </div>

            {/* Custom CSS Section */}
            <div className="config-section" style={{ marginTop: 'var(--omnily-spacing-6)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--omnily-spacing-3)', marginBottom: 'var(--omnily-spacing-6)' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: 'var(--omnily-border-radius-lg)',
                  background: `linear-gradient(135deg, ${primaryColor}20, ${primaryColor}10)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Code size={24} style={{ color: primaryColor }} />
                </div>
                <div>
                  <h3 style={{ margin: 0 }}>💻 CSS Personalizzato</h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: 'var(--omnily-font-size-sm)', color: 'var(--omnily-gray-600)' }}>
                    Per personalizzazioni avanzate (opzionale)
                  </p>
                </div>
              </div>

              <div className="form-group">
                <label>CSS Personalizzato</label>
                <textarea
                  rows={8}
                  value={config.website_custom_css || ''}
                  onChange={(e) => updateConfig('website_custom_css', e.target.value)}
                  placeholder="/* Il tuo CSS personalizzato */&#10;.my-class {&#10;  color: red;&#10;}"
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '14px',
                    background: '#1e1e1e',
                    color: '#d4d4d4',
                    padding: 'var(--omnily-spacing-4)',
                    borderRadius: 'var(--omnily-border-radius)'
                  }}
                />
                <small style={{ color: 'var(--omnily-gray-500)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                  ⚠️ Solo per utenti esperti: Aggiungi CSS per personalizzare ulteriormente lo stile del tuo sito
                </small>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Floating Save Button */}
      <div className="floating-save">
        <button onClick={saveConfig} disabled={saving} style={{ backgroundColor: primaryColor }}>
          <Save className="w-5 h-5" />
          {saving ? 'Salvataggio...' : 'Salva Modifiche'}
        </button>
      </div>

      {/* Toast Notifications */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
    </div>
  )
}
