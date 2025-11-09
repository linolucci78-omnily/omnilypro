import React, { useState } from 'react'
import {
  HelpCircle,
  Search,
  MessageCircle,
  FileText,
  BookOpen,
  Video,
  Download,
  Mail,
  Phone,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Users,
  Zap,
  Globe,
  PlayCircle,
  ExternalLink,
  Send,
  Calendar,
  Star,
  Award,
  Shield
} from 'lucide-react'
import OpenTicketModal from './OpenTicketModal'
import './SupportHub.css'

interface SupportHubProps {
  organizationId: string
  organizationName: string
  primaryColor?: string
  secondaryColor?: string
  onNavigateToTickets?: () => void
}

const SupportHub: React.FC<SupportHubProps> = ({
  organizationId,
  organizationName,
  primaryColor,
  secondaryColor,
  onNavigateToTickets
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [showOpenTicketModal, setShowOpenTicketModal] = useState(false)

  // Quick Actions
  const quickActions = [
    ...(onNavigateToTickets ? [{
      id: 'tickets',
      icon: FileText,
      title: 'I Miei Ticket',
      description: 'Visualizza i ticket inviati e le risposte',
      gradient: `linear-gradient(135deg, ${primaryColor || '#dc2626'} 0%, ${secondaryColor || '#ef4444'} 100%)`,
      badge: null,
      onClick: onNavigateToTickets
    }] : []),
    {
      id: 'chat',
      icon: MessageCircle,
      title: 'Live Chat',
      description: 'Chatta con il supporto ora',
      gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      badge: 'Online',
      onClick: () => setMessage({ type: 'error', text: 'Live Chat disponibile Lun-Ven 9:00-18:00' })
    },
    {
      id: 'ticket',
      icon: FileText,
      title: 'Apri Ticket',
      description: 'Richiesta assistenza prioritaria',
      gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
      badge: null,
      onClick: () => setShowOpenTicketModal(true)
    },
    {
      id: 'docs',
      icon: BookOpen,
      title: 'Documentazione',
      description: 'Guide complete e API docs',
      gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
      badge: '120+ Guide',
      onClick: () => setMessage({ type: 'error', text: 'Centro documentazione in costruzione' })
    },
    {
      id: 'videos',
      icon: Video,
      title: 'Video Tutorial',
      description: 'Impara guardando i video',
      gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      badge: '50+ Video',
      onClick: () => setMessage({ type: 'error', text: 'Libreria video in arrivo prossimamente' })
    }
  ]

  // FAQ Categories
  const faqCategories = [
    {
      id: 'getting-started',
      icon: Zap,
      title: 'Getting Started',
      count: 15,
      color: '#10b981',
      articles: [
        'Come creare la prima tessera punti',
        'Configurare il programma fedeltà',
        'Impostare livelli e premi',
        'Invitare il primo cliente'
      ]
    },
    {
      id: 'features',
      icon: Star,
      title: 'Funzionalità',
      count: 28,
      color: '#f59e0b',
      articles: [
        'Come funzionano i tier di fedeltà',
        'Gestire gift certificates',
        'Email automations setup',
        'Integrare il POS'
      ]
    },
    {
      id: 'troubleshooting',
      icon: AlertCircle,
      title: 'Troubleshooting',
      count: 12,
      color: '#ef4444',
      articles: [
        'I punti non si accumulano',
        'Email non arrivano ai clienti',
        'Problemi login POS',
        'Reset password clienti'
      ]
    },
    {
      id: 'api',
      icon: Globe,
      title: 'API & Integrazioni',
      count: 8,
      color: '#3b82f6',
      articles: [
        'Autenticazione API',
        'Webhook configuration',
        'Rate limits e quote',
        'Errori comuni API'
      ]
    }
  ]

  // Video Tutorials
  const videoTutorials = [
    {
      id: 'setup',
      title: 'Setup Completo in 10 Minuti',
      duration: '10:24',
      views: '2.5K',
      thumbnail: 'https://via.placeholder.com/400x225/dc2626/ffffff?text=Setup+Tutorial'
    },
    {
      id: 'loyalty',
      title: 'Configurare Livelli Fedeltà',
      duration: '8:15',
      views: '1.8K',
      thumbnail: 'https://via.placeholder.com/400x225/3b82f6/ffffff?text=Loyalty+Tutorial'
    },
    {
      id: 'pos',
      title: 'Integrare il POS Hardware',
      duration: '12:30',
      views: '1.2K',
      thumbnail: 'https://via.placeholder.com/400x225/10b981/ffffff?text=POS+Tutorial'
    },
    {
      id: 'email',
      title: 'Email Automations Avanzate',
      duration: '15:45',
      views: '980',
      thumbnail: 'https://via.placeholder.com/400x225/f59e0b/ffffff?text=Email+Tutorial'
    }
  ]

  // Downloadable Resources
  const resources = [
    {
      id: 'quickstart',
      title: 'Guida Quick Start PDF',
      description: 'Setup iniziale in 5 passi',
      icon: Download,
      size: '2.4 MB',
      downloads: '1.5K'
    },
    {
      id: 'checklist',
      title: 'Checklist Lancio Programma',
      description: 'Tutti i passi per andare live',
      icon: Download,
      size: '850 KB',
      downloads: '980'
    },
    {
      id: 'templates',
      title: 'Email Templates Pack',
      description: '20 template email pronti',
      icon: Download,
      size: '1.2 MB',
      downloads: '750'
    }
  ]

  // System Status
  const systemStatus = {
    overall: 'operational',
    services: [
      { name: 'API REST', status: 'operational', uptime: '99.9%' },
      { name: 'Dashboard Web', status: 'operational', uptime: '99.8%' },
      { name: 'Email Service', status: 'operational', uptime: '99.7%' },
      { name: 'POS Integration', status: 'operational', uptime: '99.5%' }
    ]
  }

  // Support Stats
  const supportStats = [
    {
      icon: FileText,
      label: 'Ticket Aperti',
      value: '0',
      subtext: 'Nessun ticket attivo'
    },
    {
      icon: Clock,
      label: 'Tempo Risposta',
      value: '< 2h',
      subtext: 'Media ultimo mese'
    },
    {
      icon: Award,
      label: 'Soddisfazione',
      value: '98%',
      subtext: 'Rating supporto'
    }
  ]

  return (
    <div className="support-hub">
      {/* Header with Search */}
      <div className="support-hub-header">
        <div className="support-hub-header-content">
          <div className="support-hub-icon">
            <HelpCircle size={48} />
          </div>
          <div className="support-hub-title-section">
            <h1>Centro Assistenza</h1>
            <p className="support-hub-subtitle">
              Trova risposte, guide e supporto per {organizationName}
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="support-search-bar">
          <Search size={24} />
          <input
            type="text"
            placeholder="Cerca guide, FAQ, tutorial..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button className="search-btn">Cerca</button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`support-message ${message.type}`}>
          <AlertCircle size={20} />
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)}>×</button>
        </div>
      )}

      {/* Support Stats */}
      <div className="support-stats">
        {supportStats.map((stat) => (
          <div key={stat.label} className="support-stat-card">
            <stat.icon size={32} />
            <div className="support-stat-content">
              <div className="support-stat-value">{stat.value}</div>
              <div className="support-stat-label">{stat.label}</div>
              <div className="support-stat-subtext">{stat.subtext}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="quick-actions-section">
        <h2>Azioni Rapide</h2>
        <div className="quick-actions-grid">
          {quickActions.map((action) => (
            <div
              key={action.id}
              className="quick-action-card"
              onClick={action.onClick}
            >
              <div className="quick-action-icon" style={{ background: action.gradient }}>
                <action.icon size={32} />
              </div>
              <div className="quick-action-content">
                <h3>{action.title}</h3>
                <p>{action.description}</p>
              </div>
              {action.badge && (
                <div className="quick-action-badge">{action.badge}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* FAQ Categories */}
      <div className="faq-section">
        <h2>Categorie FAQ</h2>
        <div className="faq-categories-grid">
          {faqCategories.map((category) => (
            <div
              key={category.id}
              className="faq-category-card"
              onClick={() => setMessage({ type: 'error', text: 'FAQ dettagliate in costruzione' })}
            >
              <div className="faq-category-header">
                <div className="faq-category-icon" style={{ background: category.color }}>
                  <category.icon size={28} />
                </div>
                <div className="faq-category-count">{category.count} articoli</div>
              </div>
              <h3>{category.title}</h3>
              <ul className="faq-articles-preview">
                {category.articles.map((article, index) => (
                  <li key={index}>{article}</li>
                ))}
              </ul>
              <div className="faq-category-arrow">
                Esplora →
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Video Tutorials */}
      <div className="video-section">
        <div className="video-section-header">
          <h2>Video Tutorial</h2>
          <button
            className="view-all-btn"
            onClick={() => setMessage({ type: 'error', text: 'Libreria video completa in arrivo' })}
          >
            Vedi Tutti <ExternalLink size={16} />
          </button>
        </div>
        <div className="video-grid">
          {videoTutorials.map((video) => (
            <div
              key={video.id}
              className="video-card"
              onClick={() => setMessage({ type: 'error', text: 'Video player in arrivo prossimamente' })}
            >
              <div className="video-thumbnail">
                <img src={video.thumbnail} alt={video.title} />
                <div className="video-play-overlay">
                  <PlayCircle size={48} />
                </div>
                <div className="video-duration">{video.duration}</div>
              </div>
              <div className="video-info">
                <h4>{video.title}</h4>
                <div className="video-meta">
                  <span>{video.views} visualizzazioni</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Downloadable Resources */}
      <div className="resources-section">
        <h2>Risorse Scaricabili</h2>
        <div className="resources-grid">
          {resources.map((resource) => (
            <div
              key={resource.id}
              className="resource-card"
              onClick={() => setMessage({ type: 'error', text: 'Download disponibile prossimamente' })}
            >
              <resource.icon size={40} className="resource-icon" />
              <div className="resource-content">
                <h4>{resource.title}</h4>
                <p>{resource.description}</p>
                <div className="resource-meta">
                  <span>{resource.size}</span>
                  <span>•</span>
                  <span>{resource.downloads} download</span>
                </div>
              </div>
              <button className="resource-download-btn">
                <Download size={20} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* System Status */}
      <div className="status-section">
        <div className="status-header">
          <h2>Stato Sistema</h2>
          <div className="status-overall">
            <CheckCircle size={20} />
            <span>Tutti i sistemi operativi</span>
          </div>
        </div>
        <div className="status-services">
          {systemStatus.services.map((service) => (
            <div key={service.name} className="status-service">
              <div className="status-service-info">
                <div className={`status-indicator ${service.status}`}></div>
                <span className="status-service-name">{service.name}</span>
              </div>
              <div className="status-uptime">
                <TrendingUp size={16} />
                <span>{service.uptime} uptime</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Contact Team */}
      <div className="contact-section">
        <h2>Contatta il Team</h2>
        <div className="contact-grid">
          <div className="contact-card">
            <Mail size={32} />
            <h3>Email Support</h3>
            <p>support@omnilypro.com</p>
            <p className="contact-time">Risposta entro 24h</p>
            <button
              className="contact-btn"
              onClick={() => setMessage({ type: 'success', text: 'Email: support@omnilypro.com' })}
            >
              <Send size={18} />
              Invia Email
            </button>
          </div>

          <div className="contact-card">
            <MessageCircle size={32} />
            <h3>Live Chat</h3>
            <p>Chat in tempo reale</p>
            <p className="contact-time">Lun-Ven 9:00-18:00</p>
            <button
              className="contact-btn"
              onClick={() => setMessage({ type: 'error', text: 'Live chat disponibile in orario ufficio' })}
            >
              <MessageCircle size={18} />
              Apri Chat
            </button>
          </div>

          <div className="contact-card">
            <Phone size={32} />
            <h3>Telefono</h3>
            <p>+39 02 1234 5678</p>
            <p className="contact-time">Lun-Ven 9:00-18:00</p>
            <button
              className="contact-btn"
              onClick={() => setMessage({ type: 'success', text: 'Tel: +39 02 1234 5678' })}
            >
              <Phone size={18} />
              Chiama Ora
            </button>
          </div>

          <div className="contact-card">
            <Calendar size={32} />
            <h3>Prenota Chiamata</h3>
            <p>Consulenza personalizzata</p>
            <p className="contact-time">Sessioni da 30min</p>
            <button
              className="contact-btn"
              onClick={() => setMessage({ type: 'error', text: 'Sistema prenotazioni in arrivo' })}
            >
              <Calendar size={18} />
              Prenota
            </button>
          </div>
        </div>
      </div>

      {/* Open Ticket Modal */}
      {showOpenTicketModal && (
        <OpenTicketModal
          organizationId={organizationId}
          organizationName={organizationName}
          onClose={() => setShowOpenTicketModal(false)}
          onSuccess={(ticketNumber) => {
            setMessage({
              type: 'success',
              text: `Ticket ${ticketNumber} creato con successo! Riceverai una risposta a breve.`
            })
          }}
        />
      )}
    </div>
  )
}

export default SupportHub
