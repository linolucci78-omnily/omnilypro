import React, { useState, useEffect } from 'react'
import { HelpCircle } from 'lucide-react'
import AdminTicketsPanel from '../AdminTicketsPanel'
import { organizationsApi } from '../../lib/supabase'
import PageLoader from '../UI/PageLoader'

/**
 * Admin Support Dashboard
 * Mostra tutti i ticket di supporto di tutte le organizzazioni
 */
const SupportDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [primaryColor, setPrimaryColor] = useState('#dc2626')
  const [secondaryColor, setSecondaryColor] = useState('#ef4444')

  useEffect(() => {
    // Carica configurazione colori (opzionale, per ora usa i default)
    const loadConfig = async () => {
      try {
        // In futuro potresti caricare i colori globali del sistema admin
        setLoading(false)
      } catch (error) {
        console.error('Error loading config:', error)
        setLoading(false)
      }
    }

    loadConfig()
  }, [])

  if (loading) {
    return <PageLoader message="Caricamento sistema support..." size="medium" />
  }

  return (
    <div className="admin-dashboard">
      {/* Header with Icon */}
      <div className="dashboard-header" style={{ marginBottom: '2rem' }}>
        <div className="header-content">
          <div className="header-title" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <HelpCircle size={32} style={{ color: primaryColor }} />
            <div>
              <h1 style={{ margin: 0, fontSize: '1.75rem', color: '#1f2937' }}>
                Support Center
              </h1>
              <p style={{ margin: '0.25rem 0 0 0', color: '#6b7280' }}>
                Gestione ticket di supporto di tutte le organizzazioni
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Tickets Panel - Mostra TUTTI i ticket di TUTTE le organizzazioni */}
      <AdminTicketsPanel
        organizationId="all" // "all" significa mostra tutti i ticket di tutte le org
        primaryColor={primaryColor}
        secondaryColor={secondaryColor}
      />
    </div>
  )
}

export default SupportDashboard
