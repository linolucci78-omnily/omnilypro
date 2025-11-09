import React from 'react'
import { ArrowLeft } from 'lucide-react'
import CardManagementPanel from './CardManagementPanel'
import type { Customer } from '../lib/supabase'
import './CardManagementFullPage.css'

interface CardManagementFullPageProps {
  customers: Customer[]
  organizationId: string
  onBack: () => void
  onAssignCard?: (cardId: string, customerId: string) => void
  onReassignCard?: (cardId: string, customerId: string) => void
  onCardRead?: (cardData: any) => void
}

const CardManagementFullPage: React.FC<CardManagementFullPageProps> = ({
  customers,
  organizationId,
  onBack,
  onAssignCard,
  onReassignCard,
  onCardRead
}) => {
  return (
    <div className="card-management-fullpage">
      {/* Header con bottone Indietro */}
      <div className="fullpage-header">
        <button className="back-button" onClick={onBack}>
          <ArrowLeft size={20} />
          Torna alle Impostazioni
        </button>
      </div>

      {/* Wrapper per CardManagementPanel in modalità full page */}
      <div className="fullpage-content">
        <CardManagementPanel
          isOpen={true}
          onClose={onBack}
          customers={customers}
          organizationId={organizationId}
          onAssignCard={onAssignCard}
          onReassignCard={onReassignCard}
          onCardRead={onCardRead}
        />
      </div>
    </div>
  )
}

export default CardManagementFullPage
