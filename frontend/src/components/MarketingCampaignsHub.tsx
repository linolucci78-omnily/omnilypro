import React, { useState } from 'react'
import { Mail, Send, Bell, ArrowLeft, TrendingUp, Users, Zap, Eye, BarChart3, Award, Cake, Gift, FileText, Settings, Database } from 'lucide-react'
import EmailAutomationsHub from './EmailAutomationsHub'
import EmailMarketingPanel from './EmailMarketingPanel'
import './MarketingCampaignsHub.css'

interface MarketingCampaignsHubProps {
  organizationId: string
  organizationName: string
  primaryColor: string
  secondaryColor: string
  onOpenEmailMarketingPanel?: () => void
}

type ViewType = 'hub' | 'email-automations' | 'push-notifications' | 'email-campaigns' | 'email-templates' | 'email-logs' | 'email-settings'

const MarketingCampaignsHub: React.FC<MarketingCampaignsHubProps> = ({
  organizationId,
  organizationName,
  primaryColor,
  secondaryColor,
  onOpenEmailMarketingPanel
}) => {
  const [activeView, setActiveView] = useState<ViewType>('hub')

  // Email Campaigns
  if (activeView === 'email-campaigns') {
    return (
      <EmailMarketingPanel
        onClose={() => setActiveView('hub')}
        organizationId={organizationId}
        organizationName={organizationName}
        primaryColor={primaryColor}
        secondaryColor={secondaryColor}
        defaultTab="campaigns"
      />
    )
  }

  // Email Templates
  if (activeView === 'email-templates') {
    return (
      <EmailMarketingPanel
        onClose={() => setActiveView('hub')}
        organizationId={organizationId}
        organizationName={organizationName}
        primaryColor={primaryColor}
        secondaryColor={secondaryColor}
        defaultTab="templates"
      />
    )
  }

  // Email Logs
  if (activeView === 'email-logs') {
    return (
      <EmailMarketingPanel
        onClose={() => setActiveView('hub')}
        organizationId={organizationId}
        organizationName={organizationName}
        primaryColor={primaryColor}
        secondaryColor={secondaryColor}
        defaultTab="logs"
      />
    )
  }

  // Email Settings
  if (activeView === 'email-settings') {
    return (
      <EmailMarketingPanel
        onClose={() => setActiveView('hub')}
        organizationId={organizationId}
        organizationName={organizationName}
        primaryColor={primaryColor}
        secondaryColor={secondaryColor}
        defaultTab="settings"
      />
    )
  }

  // Email Automations
  if (activeView === 'email-automations') {
    return (
      <div>
        <button
          className="back-button"
          onClick={() => setActiveView('hub')}
          style={{ color: primaryColor }}
        >
          <ArrowLeft size={20} />
          <span>Torna a Campagne Marketing</span>
        </button>
        <EmailAutomationsHub
          organizationId={organizationId}
          organizationName={organizationName}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
        />
      </div>
    )
  }

  // Push Notifications (da implementare)
  if (activeView === 'push-notifications') {
    return (
      <div>
        <button
          className="back-button"
          onClick={() => setActiveView('hub')}
          style={{ color: primaryColor }}
        >
          <ArrowLeft size={20} />
          <span>Torna a Campagne Marketing</span>
        </button>
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <Bell size={64} style={{ margin: '0 auto 1rem', color: '#9ca3af' }} />
          <h2 style={{ fontSize: '2rem', fontWeight: 700, color: '#1f2937', margin: '0 0 0.5rem 0' }}>
            Notifiche Push
          </h2>
          <p style={{ fontSize: '1.125rem', color: '#6b7280' }}>
            Funzionalità in arrivo - Integrazione OneSignal
          </p>
        </div>
      </div>
    )
  }

  // Vista principale Hub
  return (
    <div
      className="marketing-campaigns-hub"
      style={{
        '--primary-color': primaryColor,
        '--secondary-color': secondaryColor
      } as React.CSSProperties}
    >
      <div className="marketing-campaigns-hub-header">
        <div className="marketing-campaigns-hub-header-content">
          <div className="marketing-campaigns-hub-icon">
            <Mail size={48} />
          </div>
          <div>
            <h1>Centro Campagne Marketing</h1>
            <p>Gestisci email marketing, automazioni e notifiche push</p>
          </div>
        </div>
      </div>

      {/* Card Campagne */}
      <div className="marketing-campaigns-hub-cards">
        {/* Card: Campagne Email */}
        <div
          className="marketing-campaigns-hub-card marketing-campaigns-hub-card-primary"
          onClick={() => setActiveView('email-campaigns')}
        >
          <div className="marketing-campaigns-hub-card-icon">
            <Send size={32} />
          </div>
          <div className="marketing-campaigns-hub-card-content">
            <h3>Campagne Email</h3>
            <p>Crea e invia campagne email ai tuoi clienti</p>
            <ul className="marketing-campaigns-hub-card-features">
              <li><Send size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />Crea campagne</li>
              <li><Users size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />Segmenta destinatari</li>
              <li><BarChart3 size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />Monitora performance</li>
              <li><Eye size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />Preview in tempo reale</li>
            </ul>
          </div>
          <div className="marketing-campaigns-hub-card-arrow">→</div>
        </div>

        {/* Card: Template Email */}
        <div
          className="marketing-campaigns-hub-card marketing-campaigns-hub-card-primary"
          onClick={() => setActiveView('email-templates')}
        >
          <div className="marketing-campaigns-hub-card-icon">
            <FileText size={32} />
          </div>
          <div className="marketing-campaigns-hub-card-content">
            <h3>Template Email</h3>
            <p>Gestisci modelli predefiniti per le email</p>
            <ul className="marketing-campaigns-hub-card-features">
              <li><FileText size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />Template predefiniti</li>
              <li><Eye size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />Editor HTML/Testo</li>
              <li><Users size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />Variabili dinamiche</li>
              <li><BarChart3 size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />Anteprima live</li>
            </ul>
          </div>
          <div className="marketing-campaigns-hub-card-arrow">→</div>
        </div>

        {/* Card: Log & Analytics Email */}
        <div
          className="marketing-campaigns-hub-card marketing-campaigns-hub-card-primary"
          onClick={() => setActiveView('email-logs')}
        >
          <div className="marketing-campaigns-hub-card-icon">
            <Database size={32} />
          </div>
          <div className="marketing-campaigns-hub-card-content">
            <h3>Log & Analytics</h3>
            <p>Visualizza statistiche e cronologia invii email</p>
            <ul className="marketing-campaigns-hub-card-features">
              <li><Database size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />Cronologia completa</li>
              <li><BarChart3 size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />Tasso apertura/click</li>
              <li><TrendingUp size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />Email consegnate</li>
              <li><Eye size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />Test invii email</li>
            </ul>
          </div>
          <div className="marketing-campaigns-hub-card-arrow">→</div>
        </div>

        {/* Card: Impostazioni Email */}
        <div
          className="marketing-campaigns-hub-card marketing-campaigns-hub-card-primary"
          onClick={() => setActiveView('email-settings')}
        >
          <div className="marketing-campaigns-hub-card-icon">
            <Settings size={32} />
          </div>
          <div className="marketing-campaigns-hub-card-content">
            <h3>Impostazioni Email</h3>
            <p>Configura SMTP, mittente e branding email</p>
            <ul className="marketing-campaigns-hub-card-features">
              <li><Settings size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />Configurazione SMTP</li>
              <li><Mail size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />Email mittente</li>
              <li><Eye size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />Colori e logo</li>
              <li><BarChart3 size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />Limiti e quote</li>
            </ul>
          </div>
          <div className="marketing-campaigns-hub-card-arrow">→</div>
        </div>

        {/* Card: Email Automations */}
        <div
          className="marketing-campaigns-hub-card marketing-campaigns-hub-card-secondary"
          onClick={() => setActiveView('email-automations')}
        >
          <div className="marketing-campaigns-hub-card-icon">
            <Zap size={32} />
          </div>
          <div className="marketing-campaigns-hub-card-content">
            <h3>Email Automations</h3>
            <p>Configura email automatiche per eventi specifici</p>
            <ul className="marketing-campaigns-hub-card-features">
              <li><Mail size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />Email di benvenuto</li>
              <li><Award size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />Upgrade livello fedeltà</li>
              <li><Cake size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />Auguri compleanno</li>
              <li><Gift size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />Eventi speciali</li>
            </ul>
          </div>
          <div className="marketing-campaigns-hub-card-arrow">→</div>
        </div>

        {/* Card: Notifiche Push */}
        <div
          className="marketing-campaigns-hub-card marketing-campaigns-hub-card-tertiary"
          onClick={() => setActiveView('push-notifications')}
        >
          <div className="marketing-campaigns-hub-card-icon">
            <Bell size={32} />
          </div>
          <div className="marketing-campaigns-hub-card-content">
            <h3>Notifiche Push</h3>
            <p>Invia notifiche push ai tuoi clienti (OneSignal)</p>
            <ul className="marketing-campaigns-hub-card-features">
              <li><Bell size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />Notifiche istantanee</li>
              <li><Users size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />Segmentazione utenti</li>
              <li><TrendingUp size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />Analytics engagement</li>
              <li><Zap size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />Automazioni push</li>
            </ul>
            <div className="coming-soon-badge">In Arrivo</div>
          </div>
          <div className="marketing-campaigns-hub-card-arrow">→</div>
        </div>
      </div>
    </div>
  )
}

export default MarketingCampaignsHub
