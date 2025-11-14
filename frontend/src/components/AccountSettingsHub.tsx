import React, { useState } from 'react'
import { Settings, Heart, Layers, Palette, Coins, Gift, ArrowLeft, Trophy } from 'lucide-react'
import AccountSettingsPanel from './AccountSettingsPanel'
import './AccountSettingsHub.css'

interface AccountSettingsHubProps {
  isOpen: boolean
  onClose: () => void
  organizationId: string
  organizationName: string
  primaryColor: string
  secondaryColor: string
  organization: any
  onUpdate: () => void
}

type ViewType = 'hub' | 'details' | 'loyalty' | 'tiers' | 'branding' | 'points' | 'giftcerts' | 'gaming'

const AccountSettingsHub: React.FC<AccountSettingsHubProps> = ({
  isOpen,
  onClose,
  organizationId,
  organizationName,
  primaryColor,
  secondaryColor,
  organization,
  onUpdate
}) => {
  const [activeView, setActiveView] = useState<ViewType>('hub')

  if (!isOpen) return null

  // Se è selezionata una vista specifica, mostra il panel con il tab corretto
  if (activeView !== 'hub') {
    return (
      <AccountSettingsPanel
        isOpen={true}
        onClose={() => setActiveView('hub')}
        organization={organization}
        onUpdate={onUpdate}
        defaultTab={activeView as 'details' | 'loyalty' | 'tiers' | 'branding' | 'points' | 'giftcerts' | 'gaming'}
      />
    )
  }

  // Vista principale con le 7 card
  return (
    <div className="settings-hub-overlay" onClick={onClose}>
      <div
        className="settings-hub-container"
        onClick={(e) => e.stopPropagation()}
        style={{
          '--primary-color': primaryColor,
          '--secondary-color': secondaryColor
        } as React.CSSProperties}
      >
        <div className="settings-hub-header">
          <div className="settings-hub-header-content">
            <Settings size={32} />
            <div>
              <h1>Impostazioni & Configurazione</h1>
              <p>Configura ogni aspetto del tuo sistema fedeltà</p>
            </div>
          </div>
          <button className="settings-hub-close" onClick={onClose}>×</button>
        </div>

        <div className="settings-hub-cards">
          {/* Card 1: Dettagli Account */}
          <div className="settings-hub-card" onClick={() => setActiveView('details')}>
            <div className="settings-hub-card-icon details">
              <Settings size={48} />
            </div>
            <div className="settings-hub-card-content">
              <h2>Dettagli Account</h2>
              <p>Gestisci informazioni aziendali, orari di apertura e contatti del tuo business.</p>
              <ul className="settings-hub-features">
                <li>Nome e descrizione</li>
                <li>Orari di apertura</li>
                <li>Contatti e social</li>
                <li>Informazioni legali</li>
              </ul>
            </div>
            <div className="settings-hub-card-arrow">
              <span>Apri →</span>
            </div>
          </div>

          {/* Card 2: Fedeltà */}
          <div className="settings-hub-card" onClick={() => setActiveView('loyalty')}>
            <div className="settings-hub-card-icon loyalty">
              <Heart size={48} />
            </div>
            <div className="settings-hub-card-content">
              <h2>Programma Fedeltà</h2>
              <p>Configura regole di accumulo punti, validità e meccanismi di reward per i clienti.</p>
              <ul className="settings-hub-features">
                <li>Regole accumulo punti</li>
                <li>Scadenza punti</li>
                <li>Moltiplicatori eventi</li>
                <li>Conversione valuta</li>
              </ul>
            </div>
            <div className="settings-hub-card-arrow">
              <span>Apri →</span>
            </div>
          </div>

          {/* Card 3: Tier e Livelli */}
          <div className="settings-hub-card" onClick={() => setActiveView('tiers')}>
            <div className="settings-hub-card-icon tiers">
              <Layers size={48} />
            </div>
            <div className="settings-hub-card-content">
              <h2>Tier e Livelli</h2>
              <p>Crea livelli di fedeltà personalizzati con vantaggi esclusivi per ogni tier.</p>
              <ul className="settings-hub-features">
                <li>Crea tier personalizzati</li>
                <li>Soglie di accesso</li>
                <li>Benefici per livello</li>
                <li>Colori e icone</li>
              </ul>
            </div>
            <div className="settings-hub-card-arrow">
              <span>Apri →</span>
            </div>
          </div>

          {/* Card 4: Branding */}
          <div className="settings-hub-card" onClick={() => setActiveView('branding')}>
            <div className="settings-hub-card-icon branding">
              <Palette size={48} />
            </div>
            <div className="settings-hub-card-content">
              <h2>Branding e Design</h2>
              <p>Personalizza logo, colori, stile e aspetto dell'interfaccia per il tuo brand.</p>
              <ul className="settings-hub-features">
                <li>Logo aziendale</li>
                <li>Colori brand</li>
                <li>Temi personalizzati</li>
                <li>Anteprima in tempo reale</li>
              </ul>
            </div>
            <div className="settings-hub-card-arrow">
              <span>Apri →</span>
            </div>
          </div>

          {/* Card 5: Gestione Punti */}
          <div className="settings-hub-card" onClick={() => setActiveView('points')}>
            <div className="settings-hub-card-icon points">
              <Coins size={48} />
            </div>
            <div className="settings-hub-card-content">
              <h2>Gestione Punti</h2>
              <p>Configura parametri di assegnazione, scadenza e gestione manuale dei punti.</p>
              <ul className="settings-hub-features">
                <li>Regole di assegnazione</li>
                <li>Aggiustamenti manuali</li>
                <li>Import/Export punti</li>
                <li>Cronologia modifiche</li>
              </ul>
            </div>
            <div className="settings-hub-card-arrow">
              <span>Apri →</span>
            </div>
          </div>

          {/* Card 6: Buoni Regalo */}
          <div className="settings-hub-card" onClick={() => setActiveView('giftcerts')}>
            <div className="settings-hub-card-icon giftcerts">
              <Gift size={48} />
            </div>
            <div className="settings-hub-card-content">
              <h2>Buoni Regalo</h2>
              <p>Configura e gestisci gift certificates, impostazioni e template per i buoni.</p>
              <ul className="settings-hub-features">
                <li>Template buoni</li>
                <li>Valori predefiniti</li>
                <li>Scadenze e validità</li>
                <li>Codici e sicurezza</li>
              </ul>
            </div>
            <div className="settings-hub-card-arrow">
              <span>Apri →</span>
            </div>
          </div>

          {/* Card 7: Gaming Module */}
          <div className="settings-hub-card" onClick={() => setActiveView('gaming')}>
            <div className="settings-hub-card-icon gaming">
              <Trophy size={48} />
            </div>
            <div className="settings-hub-card-content">
              <h2>Gaming Module</h2>
              <p>Configura challenge, badge, ruota della fortuna e gamification per i clienti.</p>
              <ul className="settings-hub-features">
                <li>Challenge e obiettivi</li>
                <li>Badge e traguardi</li>
                <li>Ruota della fortuna</li>
                <li>Statistiche gaming</li>
              </ul>
            </div>
            <div className="settings-hub-card-arrow">
              <span>Apri →</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AccountSettingsHub
