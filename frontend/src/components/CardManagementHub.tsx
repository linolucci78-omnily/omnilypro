import React, { useState } from 'react'
import { CreditCard, BarChart3, ArrowLeft } from 'lucide-react'
import './CardManagementHub.css'

interface CardManagementHubProps {
  organizationId: string
  primaryColor: string
  secondaryColor: string
  onOpenManagement: () => void
}

type ViewType = 'hub' | 'statistics'

const CardManagementHub: React.FC<CardManagementHubProps> = ({
  organizationId,
  primaryColor,
  secondaryColor,
  onOpenManagement
}) => {
  const [activeView, setActiveView] = useState<ViewType>('hub')

  // Vista principale con le 2 card
  return (
    <div
      className="card-hub"
      style={{
        '--primary-color': primaryColor,
        '--secondary-color': secondaryColor
      } as React.CSSProperties}
    >
      <div className="card-hub-header">
        <h1>Gestione Tessere Punti</h1>
        <p>Crea, personalizza e gestisci le tessere punti per i tuoi clienti</p>
      </div>

      <div className="card-hub-cards">
        {/* Card 1: Configura Tessere */}
        <div className="card-hub-card" onClick={onOpenManagement}>
          <div className="card-hub-card-icon management">
            <CreditCard size={48} />
            </div>
            <div className="card-hub-card-content">
              <h2>Configura Tessere</h2>
              <p>Gestisci le tessere NFC e QR Code, assegna ai clienti e monitora l'uso.</p>
              <ul className="card-hub-features">
                <li>Lettura NFC e QR Code</li>
                <li>Assegnazione tessere</li>
                <li>Lista tessere attive</li>
                <li>Gestione completa</li>
              </ul>
            </div>
            <div className="card-hub-card-arrow">
              <span>Apri →</span>
            </div>
          </div>

        {/* Card 2: Statistiche Punti */}
        <div className="card-hub-card" onClick={() => alert('Statistiche in arrivo!')}>
          <div className="card-hub-card-icon statistics">
            <BarChart3 size={48} />
          </div>
          <div className="card-hub-card-content">
            <h2>Statistiche Punti</h2>
            <p>Visualizza le performance delle tessere punti e analizza i dati di utilizzo.</p>
            <ul className="card-hub-features">
              <li>Tessere totali attive</li>
              <li>Utilizzo per periodo</li>
              <li>Clienti con tessera</li>
              <li>Report dettagliati</li>
            </ul>
          </div>
          <div className="card-hub-card-arrow">
            <span>Apri →</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CardManagementHub
