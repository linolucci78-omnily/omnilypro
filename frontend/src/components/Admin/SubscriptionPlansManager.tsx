import React, { useState, useEffect } from 'react'
import { Eye, EyeOff, Zap, Globe, Edit } from 'lucide-react'
import { omnilyProPlansService, type OmnilyProPlan } from '../../services/omnilyProPlansService'
import { useToast } from '../../contexts/ToastContext'
import PageLoader from '../UI/PageLoader'

/**
 * Componente per gestire la visibilità dei piani abbonamento
 * Permette di attivare/disattivare i piani nel wizard e nella landing
 */
export const SubscriptionPlansManager: React.FC = () => {
  const [plans, setPlans] = useState<OmnilyProPlan[]>([])
  const [loading, setLoading] = useState(true)
  const { showSuccess, showError } = useToast()

  useEffect(() => {
    loadPlans()
  }, [])

  const loadPlans = async () => {
    try {
      setLoading(true)
      const data = await omnilyProPlansService.getAllPlans()
      setPlans(data)
    } catch (error: any) {
      showError('Errore caricamento', error.message)
    } finally {
      setLoading(false)
    }
  }

  const toggleWizardVisibility = async (planId: string, currentValue: boolean) => {
    try {
      await omnilyProPlansService.updatePlan(planId, {
        show_in_wizard: !currentValue
      })
      await loadPlans()
      showSuccess(
        'Aggiornato',
        !currentValue ? 'Piano visibile nel wizard' : 'Piano nascosto dal wizard'
      )
    } catch (error: any) {
      showError('Errore', error.message)
    }
  }

  const toggleLandingVisibility = async (planId: string, currentValue: boolean) => {
    try {
      await omnilyProPlansService.updatePlan(planId, {
        show_in_landing: !currentValue
      })
      await loadPlans()
      showSuccess(
        'Aggiornato',
        !currentValue ? 'Piano visibile nella landing' : 'Piano nascosto dalla landing'
      )
    } catch (error: any) {
      showError('Errore', error.message)
    }
  }

  if (loading) {
    return <PageLoader message="Caricamento piani..." />
  }

  return (
    <div style={{ padding: '1.5rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem' }}>
          Gestione Abbonamenti
        </h2>
        <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
          Controlla dove i tuoi piani sono visibili: wizard di creazione organizzazione o landing page pubblica
        </p>
      </div>

      <div style={{
        display: 'grid',
        gap: '1rem',
        gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))'
      }}>
        {plans.map((plan) => (
          <div
            key={plan.id}
            style={{
              border: `2px solid ${plan.is_active ? plan.color : '#e2e8f0'}`,
              borderRadius: '12px',
              padding: '1.25rem',
              background: plan.is_active ? '#fff' : '#f9fafb',
              position: 'relative',
              transition: 'all 0.2s',
              opacity: plan.is_active ? 1 : 0.6
            }}
          >
            {/* Header */}
            <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <div
                    style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      background: plan.color
                    }}
                  />
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>
                    {plan.name}
                  </h3>
                  {plan.badge_text && (
                    <span style={{
                      fontSize: '0.7rem',
                      padding: '0.125rem 0.5rem',
                      background: plan.color,
                      color: 'white',
                      borderRadius: '999px',
                      fontWeight: 600
                    }}>
                      {plan.badge_text}
                    </span>
                  )}
                </div>
                <p style={{ color: '#64748b', fontSize: '0.875rem', margin: 0 }}>
                  {plan.description || 'Nessuna descrizione'}
                </p>
              </div>
              {!plan.is_active && (
                <span style={{
                  fontSize: '0.7rem',
                  padding: '0.25rem 0.5rem',
                  background: '#ef4444',
                  color: 'white',
                  borderRadius: '4px',
                  fontWeight: 600
                }}>
                  INATTIVO
                </span>
              )}
            </div>

            {/* Pricing */}
            <div style={{ marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                <span style={{ fontSize: '2rem', fontWeight: 700, color: '#1e293b' }}>
                  €{plan.price_monthly}
                </span>
                <span style={{ color: '#64748b', fontSize: '0.875rem' }}>/mese</span>
              </div>
              {plan.price_yearly > 0 && (
                <div style={{ marginTop: '0.25rem', color: '#64748b', fontSize: '0.75rem' }}>
                  €{plan.price_yearly}/anno
                  {plan.price_yearly < plan.price_monthly * 12 && (
                    <span style={{ color: '#10b981', marginLeft: '0.5rem', fontWeight: 600 }}>
                      Risparmia €{((plan.price_monthly * 12) - plan.price_yearly).toFixed(0)}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Toggle Controls */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {/* Wizard Toggle */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem',
                background: plan.show_in_wizard ? '#f0f9ff' : '#f9fafb',
                border: `1px solid ${plan.show_in_wizard ? '#3b82f6' : '#e2e8f0'}`,
                borderRadius: '8px',
                transition: 'all 0.2s'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                  <Zap size={18} color={plan.show_in_wizard ? '#3b82f6' : '#94a3b8'} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#1e293b' }}>
                      Visibile nel Wizard
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                      Appare durante creazione organizzazione
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => toggleWizardVisibility(plan.id, plan.show_in_wizard)}
                  style={{
                    position: 'relative',
                    width: '44px',
                    height: '24px',
                    borderRadius: '999px',
                    border: 'none',
                    background: plan.show_in_wizard ? '#3b82f6' : '#cbd5e1',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    padding: 0
                  }}
                >
                  <div style={{
                    position: 'absolute',
                    top: '2px',
                    left: plan.show_in_wizard ? '22px' : '2px',
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: 'white',
                    transition: 'all 0.2s',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }} />
                </button>
              </div>

              {/* Landing Toggle */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem',
                background: plan.show_in_landing ? '#f0fdf4' : '#f9fafb',
                border: `1px solid ${plan.show_in_landing ? '#10b981' : '#e2e8f0'}`,
                borderRadius: '8px',
                transition: 'all 0.2s'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                  <Globe size={18} color={plan.show_in_landing ? '#10b981' : '#94a3b8'} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#1e293b' }}>
                      Visibile nella Landing
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                      Appare nella pagina prezzi pubblica
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => toggleLandingVisibility(plan.id, plan.show_in_landing)}
                  style={{
                    position: 'relative',
                    width: '44px',
                    height: '24px',
                    borderRadius: '999px',
                    border: 'none',
                    background: plan.show_in_landing ? '#10b981' : '#cbd5e1',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    padding: 0
                  }}
                >
                  <div style={{
                    position: 'absolute',
                    top: '2px',
                    left: plan.show_in_landing ? '22px' : '2px',
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: 'white',
                    transition: 'all 0.2s',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }} />
                </button>
              </div>
            </div>

            {/* Features Count */}
            <div style={{
              marginTop: '1rem',
              paddingTop: '1rem',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                {Object.values(plan.features).filter(Boolean).length} features abilitate
              </span>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  // Qui potremmo aprire AdminPlansManager per modificare il piano
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  fontSize: '0.75rem',
                  color: '#3b82f6',
                  textDecoration: 'none',
                  fontWeight: 600
                }}
              >
                <Edit size={14} />
                Modifica piano
              </a>
            </div>
          </div>
        ))}
      </div>

      {plans.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          color: '#64748b'
        }}>
          <p>Nessun piano trovato. Crea il tuo primo piano!</p>
        </div>
      )}
    </div>
  )
}

export default SubscriptionPlansManager
