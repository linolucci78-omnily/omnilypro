import React, { useState } from 'react'
import {
  Globe,
  Zap,
  Smartphone,
  ShoppingCart,
  MessageCircle,
  Send,
  Mail,
  Database,
  Share2,
  DollarSign,
  Instagram,
  Facebook,
  TrendingUp,
  CheckCircle,
  XCircle,
  Settings,
  ExternalLink,
  AlertCircle
} from 'lucide-react'
import './ChannelsHub.css'

interface ChannelsHubProps {
  organization: any
}

const ChannelsHub: React.FC<ChannelsHubProps> = ({ organization }) => {
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // Canali interni (già configurati dall'organizzazione)
  const internalChannels = [
    {
      id: 'pos',
      icon: Zap,
      name: 'POS - Punto Vendita',
      description: 'Sistema punto vendita fisico e hardware POS',
      enabled: organization?.enable_pos || false,
      type: organization?.pos_type || null,
      gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
      features: [
        'Vendita in negozio fisico',
        'Scanner barcode/QR',
        'Stampante ricevute',
        'Customer display'
      ]
    },
    {
      id: 'ecommerce',
      icon: ShoppingCart,
      name: 'E-commerce',
      description: 'Negozio online e vendita digitale',
      enabled: organization?.enable_ecommerce || false,
      type: organization?.ecommerce_platform || null,
      gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      features: [
        'Vendita online 24/7',
        'Catalogo prodotti',
        'Carrello e checkout',
        'Gestione ordini'
      ]
    },
    {
      id: 'app',
      icon: Smartphone,
      name: 'App Mobile',
      description: 'Applicazione mobile per i tuoi clienti',
      enabled: organization?.enable_app || false,
      type: null,
      gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
      features: [
        'App iOS e Android',
        'Notifiche push',
        'Carta fedeltà digitale',
        'Prenotazioni e ordini'
      ]
    }
  ]

  // Integrazioni esterne
  const externalIntegrations = [
    {
      id: 'shopify',
      icon: ShoppingCart,
      name: 'Shopify',
      description: 'Sincronizza punti fedeltà con il tuo store Shopify',
      gradient: 'linear-gradient(135deg, #96bf48 0%, #7ab55c 100%)',
      status: 'available',
      comingSoon: true
    },
    {
      id: 'woocommerce',
      icon: ShoppingCart,
      name: 'WooCommerce',
      description: 'Integra WordPress/WooCommerce con il programma fedeltà',
      gradient: 'linear-gradient(135deg, #96588a 0%, #7f4a7a 100%)',
      status: 'available',
      comingSoon: true
    },
    {
      id: 'whatsapp',
      icon: MessageCircle,
      name: 'WhatsApp Business',
      description: 'Invia notifiche, promozioni e aggiornamenti via WhatsApp',
      gradient: 'linear-gradient(135deg, #25d366 0%, #128c7e 100%)',
      status: 'available',
      comingSoon: true
    },
    {
      id: 'mailchimp',
      icon: Mail,
      name: 'Mailchimp',
      description: 'Sincronizza clienti con Mailchimp per email marketing avanzato',
      gradient: 'linear-gradient(135deg, #ffe01b 0%, #ffc300 100%)',
      status: 'available',
      comingSoon: true
    },
    {
      id: 'sendgrid',
      icon: Send,
      name: 'SendGrid',
      description: 'Email transazionali professionali con SendGrid',
      gradient: 'linear-gradient(135deg, #1a82e2 0%, #0e5bb5 100%)',
      status: 'available',
      comingSoon: true
    },
    {
      id: 'zapier',
      icon: Share2,
      name: 'Zapier',
      description: 'Automatizza workflow connettendo 5000+ app',
      gradient: 'linear-gradient(135deg, #ff4a00 0%, #e63900 100%)',
      status: 'available',
      comingSoon: true
    },
    {
      id: 'make',
      icon: Database,
      name: 'Make (Integromat)',
      description: 'Automazioni avanzate e workflow complessi',
      gradient: 'linear-gradient(135deg, #6c00fa 0%, #5500c7 100%)',
      status: 'available',
      comingSoon: true
    },
    {
      id: 'google-sheets',
      icon: Database,
      name: 'Google Sheets',
      description: 'Export automatico clienti e transazioni su Google Sheets',
      gradient: 'linear-gradient(135deg, #0f9d58 0%, #0b7a43 100%)',
      status: 'available',
      comingSoon: true
    },
    {
      id: 'stripe',
      icon: DollarSign,
      name: 'Stripe',
      description: 'Pagamenti online e ricariche gift certificate',
      gradient: 'linear-gradient(135deg, #635bff 0%, #5469d4 100%)',
      status: 'available',
      comingSoon: true
    },
    {
      id: 'facebook',
      icon: Facebook,
      name: 'Facebook & Instagram',
      description: 'Campagne ads e sincronizzazione clienti con Meta',
      gradient: 'linear-gradient(135deg, #1877f2 0%, #0a5cc5 100%)',
      status: 'available',
      comingSoon: true
    },
    {
      id: 'google-analytics',
      icon: TrendingUp,
      name: 'Google Analytics',
      description: 'Tracking avanzato e analytics del programma fedeltà',
      gradient: 'linear-gradient(135deg, #e37400 0%, #b85a00 100%)',
      status: 'available',
      comingSoon: true
    }
  ]

  return (
    <div className="channels-hub">
      {/* Header */}
      <div className="channels-hub-header">
        <div className="channels-hub-header-content">
          <div className="channels-hub-icon">
            <Globe size={48} />
          </div>
          <div>
            <h1>Canali & Integrazioni</h1>
            <p className="channels-hub-subtitle">
              I tuoi canali di vendita e le integrazioni con servizi esterni
            </p>
          </div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`channels-message ${message.type}`}>
          <AlertCircle size={20} />
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)}>×</button>
        </div>
      )}

      {/* Sezione 1: I Tuoi Canali */}
      <div className="channels-section">
        <div className="channels-section-header">
          <h2>I Tuoi Canali di Vendita</h2>
          <p>Canali configurati durante la registrazione e attivi per il tuo business</p>
        </div>

        <div className="channels-grid">
          {internalChannels.map((channel) => (
            <div key={channel.id} className={`channel-card ${channel.enabled ? 'enabled' : 'disabled'}`}>
              <div className="channel-card-header" style={{ background: channel.gradient }}>
                <channel.icon size={40} />
              </div>

              <div className="channel-card-content">
                <div className="channel-card-title">
                  <h3>{channel.name}</h3>
                  <div className={`channel-badge ${channel.enabled ? 'active' : 'inactive'}`}>
                    {channel.enabled ? (
                      <>
                        <CheckCircle size={16} />
                        <span>Abilitato</span>
                      </>
                    ) : (
                      <>
                        <XCircle size={16} />
                        <span>Disabilitato</span>
                      </>
                    )}
                  </div>
                </div>

                <p className="channel-card-description">{channel.description}</p>

                {channel.type && (
                  <div className="channel-type">
                    <strong>Tipo:</strong> {channel.type}
                  </div>
                )}

                <ul className="channel-features">
                  {channel.features.map((feature, index) => (
                    <li key={index}>{feature}</li>
                  ))}
                </ul>

                <button
                  className="channel-settings-btn"
                  onClick={() => setMessage({
                    type: 'error',
                    text: 'Configurazione canali disponibile dalla sezione Impostazioni'
                  })}
                >
                  <Settings size={18} />
                  Configura
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sezione 2: Integrazioni Esterne */}
      <div className="channels-section">
        <div className="channels-section-header">
          <h2>Integrazioni Esterne</h2>
          <p>Connetti servizi e piattaforme esterne per potenziare il tuo programma fedeltà</p>
        </div>

        <div className="integrations-grid">
          {externalIntegrations.map((integration) => (
            <div
              key={integration.id}
              className="integration-card"
              onClick={() =>
                setMessage({
                  type: 'error',
                  text: `Integrazione ${integration.name} in arrivo prossimamente!`
                })
              }
            >
              <div className="integration-icon" style={{ background: integration.gradient }}>
                <integration.icon size={32} />
              </div>

              <div className="integration-content">
                <h4>{integration.name}</h4>
                <p>{integration.description}</p>
              </div>

              {integration.comingSoon && (
                <div className="integration-badge coming-soon">
                  Prossimamente
                </div>
              )}

              <div className="integration-arrow">
                <ExternalLink size={18} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Info Footer */}
      <div className="channels-footer-info">
        <div className="info-card">
          <Globe size={24} />
          <div>
            <strong>Hai bisogno di un'integrazione specifica?</strong>
            <p>Contatta il supporto per richiedere nuove integrazioni personalizzate</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChannelsHub
