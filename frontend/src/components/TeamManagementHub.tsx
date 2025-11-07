import React, { useState } from 'react'
import { Users, Shield, ArrowLeft } from 'lucide-react'
import TeamManagement from './TeamManagement'
import PermissionsManagement from './PermissionsManagement'
import './TeamManagementHub.css'

interface TeamManagementHubProps {
  organizationId: string
  primaryColor: string
  secondaryColor: string
}

type ViewType = 'hub' | 'team' | 'permissions'

const TeamManagementHub: React.FC<TeamManagementHubProps> = ({
  organizationId,
  primaryColor,
  secondaryColor
}) => {
  const [activeView, setActiveView] = useState<ViewType>('hub')

  // Se è selezionata una vista specifica, mostra il componente
  if (activeView === 'team') {
    return (
      <div>
        <button
          className="back-button"
          onClick={() => setActiveView('hub')}
          style={{ color: primaryColor }}
        >
          <ArrowLeft size={20} />
          <span>Torna a Gestione Team</span>
        </button>
        <TeamManagement
          organizationId={organizationId}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
        />
      </div>
    )
  }

  if (activeView === 'permissions') {
    return (
      <div>
        <button
          className="back-button"
          onClick={() => setActiveView('hub')}
          style={{ color: primaryColor }}
        >
          <ArrowLeft size={20} />
          <span>Torna a Gestione Team</span>
        </button>
        <PermissionsManagement
          organizationId={organizationId}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
        />
      </div>
    )
  }

  // Vista principale con le 2 card
  return (
    <div
      className="team-hub"
      style={{
        '--primary-color': primaryColor,
        '--secondary-color': secondaryColor
      } as React.CSSProperties}
    >
      <div className="team-hub-header">
        <h1>Gestione Team e Permessi</h1>
        <p>Gestisci il tuo team e controlla gli accessi alle diverse sezioni</p>
      </div>

      <div className="team-hub-cards">
        {/* Card 1: Gestisci Team */}
        <div
          className="team-hub-card"
          onClick={() => setActiveView('team')}
        >
          <div className="team-hub-card-icon">
            <Users size={48} />
          </div>
          <div className="team-hub-card-content">
            <h2>Gestisci Team</h2>
            <p>Aggiungi membri, assegna ruoli e PIN, monitora accessi e attività del personale</p>
            <ul className="team-hub-features">
              <li>Crea e modifica membri</li>
              <li>Assegna ruoli e PIN</li>
              <li>Log accessi e audit trail</li>
              <li>Statistiche e report</li>
            </ul>
          </div>
          <div className="team-hub-card-arrow">
            <span>Apri →</span>
          </div>
        </div>

        {/* Card 2: Gestisci Accessi */}
        <div
          className="team-hub-card"
          onClick={() => setActiveView('permissions')}
        >
          <div className="team-hub-card-icon">
            <Shield size={48} />
          </div>
          <div className="team-hub-card-content">
            <h2>Gestisci Accessi</h2>
            <p>Configura i permessi per ogni membro del team e controlla l'accesso alle sezioni</p>
            <ul className="team-hub-features">
              <li>Permessi granulari per ruolo</li>
              <li>Toggle on/off per ogni sezione</li>
              <li>Protezione aree sensibili</li>
              <li>Controllo completo accessi</li>
            </ul>
          </div>
          <div className="team-hub-card-arrow">
            <span>Apri →</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TeamManagementHub
