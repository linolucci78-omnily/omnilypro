import React from 'react'
import { Building2, ChevronRight } from 'lucide-react'
import type { Organization } from '../lib/supabase'
import './OrganizationSelectorModal.css'

interface OrganizationSelectorModalProps {
  organizations: Organization[]
  onSelect: (orgId: string) => void
}

const OrganizationSelectorModal: React.FC<OrganizationSelectorModalProps> = ({
  organizations,
  onSelect
}) => {
  return (
    <div className="org-selector-overlay">
      <div className="org-selector-modal">
        <div className="org-selector-header">
          <Building2 size={32} />
          <h2>Seleziona Azienda</h2>
          <p>Hai accesso a più aziende. Seleziona quella con cui vuoi lavorare.</p>
        </div>

        <div className="org-selector-list">
          {organizations.map(org => (
            <button
              key={org.id}
              className="org-selector-item"
              onClick={() => onSelect(org.id)}
              style={{
                borderLeft: `4px solid ${org.primary_color || '#3b82f6'}`
              }}
            >
              <div className="org-selector-item-left">
                {org.logo_url ? (
                  <img src={org.logo_url} alt={org.name} className="org-selector-logo" />
                ) : (
                  <div
                    className="org-selector-logo-placeholder"
                    style={{ backgroundColor: org.primary_color || '#3b82f6' }}
                  >
                    {org.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="org-selector-info">
                  <h3>{org.name}</h3>
                  <p>{org.industry || 'Azienda'}</p>
                </div>
              </div>
              <ChevronRight size={20} className="org-selector-arrow" />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default OrganizationSelectorModal
