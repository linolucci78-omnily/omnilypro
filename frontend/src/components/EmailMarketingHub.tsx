import React, { useState } from 'react'
import { Megaphone, FileText, BarChart, Settings, ArrowLeft } from 'lucide-react'
import EmailMarketingPanel from './EmailMarketingPanel'
import './EmailMarketingHub.css'

interface EmailMarketingHubProps {
  organizationId: string
  organizationName: string
  primaryColor: string
  secondaryColor: string
}

type ViewType = 'hub' | 'campaigns' | 'templates' | 'analytics' | 'settings'

const EmailMarketingHub: React.FC<EmailMarketingHubProps> = ({
  organizationId,
  organizationName,
  primaryColor,
  secondaryColor
}) => {
  const [activeView, setActiveView] = useState<ViewType>('hub')

  // Se è selezionata una vista specifica, mostra il panel con il tab corretto
  if (activeView !== 'hub') {
    return (
      <EmailMarketingPanel
        onClose={() => setActiveView('hub')}
        organizationId={organizationId}
        organizationName={organizationName}
        defaultTab={activeView as 'campaigns' | 'templates' | 'logs' | 'settings'}
      />
    )
  }

  // Vista principale con le 4 card
  return (
    <div
      className="email-marketing-hub-container"
      style={{
        '--primary-color': primaryColor,
        '--secondary-color': secondaryColor
      } as React.CSSProperties}
    >
      <div className="email-hub-header">
        <div className="email-hub-header-content">
          <Megaphone size={32} />
          <div>
            <h1>Email Marketing</h1>
            <p>Gestisci campagne, modelli e monitora le performance</p>
          </div>
        </div>
      </div>

      <div className="email-hub-cards">
        {/* Card 1: Campaigns */}
        <div className="email-hub-card" onClick={() => setActiveView('campaigns')}>
          <div className="email-hub-card-icon campaigns">
            <Megaphone size={48} />
          </div>
          <div className="email-hub-card-content">
            <h2>Campagne Email</h2>
            <p>Crea e invia campagne email ai tuoi clienti. Pianifica invii, monitora aperture e click.</p>
            <ul className="email-hub-features">
              <li>Crea nuove campagne</li>
              <li>Segmenta destinatari</li>
              <li>Pianifica invii</li>
              <li>Traccia performance</li>
            </ul>
          </div>
          <div className="email-hub-card-arrow">
            <span>Apri →</span>
          </div>
        </div>

        {/* Card 2: Templates */}
        <div className="email-hub-card" onClick={() => setActiveView('templates')}>
          <div className="email-hub-card-icon templates">
            <FileText size={48} />
          </div>
          <div className="email-hub-card-content">
            <h2>Modelli Email</h2>
            <p>Gestisci template predefiniti per email transazionali e marketing personalizzato.</p>
            <ul className="email-hub-features">
              <li>Template predefiniti</li>
              <li>Editor HTML/Text</li>
              <li>Variabili dinamiche</li>
              <li>Anteprima in tempo reale</li>
            </ul>
          </div>
          <div className="email-hub-card-arrow">
            <span>Apri →</span>
          </div>
        </div>

        {/* Card 3: Analytics */}
        <div className="email-hub-card" onClick={() => setActiveView('analytics')}>
          <div className="email-hub-card-icon analytics">
            <BarChart size={48} />
          </div>
          <div className="email-hub-card-content">
            <h2>Analytics & Report</h2>
            <p>Visualizza statistiche dettagliate su invii, aperture, click e conversioni.</p>
            <ul className="email-hub-features">
              <li>Cronologia completa invii</li>
              <li>Tasso apertura e click</li>
              <li>Email consegnate/fallite</li>
              <li>Performance campagne</li>
            </ul>
          </div>
          <div className="email-hub-card-arrow">
            <span>Apri →</span>
          </div>
        </div>

        {/* Card 4: Settings */}
        <div className="email-hub-card" onClick={() => setActiveView('settings')}>
          <div className="email-hub-card-icon settings">
            <Settings size={48} />
          </div>
          <div className="email-hub-card-content">
            <h2>Configurazione</h2>
            <p>Configura server SMTP, email mittente e impostazioni avanzate per l'invio.</p>
            <ul className="email-hub-features">
              <li>Configurazione SMTP</li>
              <li>Email mittente</li>
              <li>Test connessione</li>
              <li>Limiti e quote</li>
            </ul>
          </div>
          <div className="email-hub-card-arrow">
            <span>Apri →</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EmailMarketingHub
