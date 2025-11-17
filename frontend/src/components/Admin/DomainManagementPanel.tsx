import React, { useState, useEffect } from 'react'
import { Globe, Plus, Check, X, Loader, Building2 } from 'lucide-react'
import { createOrganizationDomain, checkDomainStatus } from '../../services/domainService'
import { supabase } from '../../lib/supabase'

interface Organization {
  id: string
  name: string
  custom_domain?: string
}

interface DomainManagementPanelProps {
  organizationId?: string
  organizationSlug?: string
}

const DomainManagementPanel: React.FC<DomainManagementPanelProps> = ({
  organizationId: propOrgId,
  organizationSlug: propOrgSlug
}) => {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null)
  const [loadingOrgs, setLoadingOrgs] = useState(true)
  const [slug, setSlug] = useState(propOrgSlug || '')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message?: string
    domain?: string
    error?: string
  } | null>(null)

  // Carica organizzazioni dal database
  useEffect(() => {
    loadOrganizations()
  }, [])

  const loadOrganizations = async () => {
    try {
      setLoadingOrgs(true)
      console.log('🔍 Loading organizations...')

      const { data, error } = await supabase
        .from('organizations')
        .select('id, name')
        .order('name')

      if (error) {
        console.error('❌ Error loading organizations:', error)
        throw error
      }

      console.log('✅ Organizations loaded:', data?.length || 0, data)
      setOrganizations(data || [])
    } catch (error) {
      console.error('Error loading organizations:', error)
    } finally {
      setLoadingOrgs(false)
    }
  }

  const handleOrgSelect = (org: Organization) => {
    console.log('📋 Organization selected:', org.name, org.id)
    setSelectedOrg(org)
    // Se ha già un dominio, mostra il sottodominio nel campo
    if (org.custom_domain) {
      const subdomain = org.custom_domain.split('.')[0]
      setSlug(subdomain)
    } else {
      // Altrimenti lascia il campo vuoto per input manuale
      setSlug('')
    }
  }

  const handleCreateDomain = async () => {
    if (!slug || !selectedOrg) {
      setResult({
        success: false,
        error: 'Seleziona un\'organizzazione'
      })
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const response = await createOrganizationDomain(slug, selectedOrg.id)
      setResult(response)

      if (response.success) {
        // Reload organizations to show updated custom_domain
        await loadOrganizations()

        // Check domain status after creation
        setTimeout(async () => {
          const status = await checkDomainStatus(response.domain!)
          console.log('Domain status:', status)
        }, 3000)
      }
    } catch (error: any) {
      setResult({
        success: false,
        error: error.message
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '24px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      maxWidth: '600px',
      margin: '20px auto'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <Globe size={28} color="#667eea" />
        <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>
          Gestione Domini Organizzazioni
        </h2>
      </div>

      <p style={{ color: '#64748b', marginBottom: '24px' }}>
        Crea automaticamente un sottodominio per un'organizzazione. Il sistema configurerà:
        <br />• Record DNS su Cloudflare
        <br />• Dominio su Vercel
        <br />• Database Supabase
      </p>

      {loadingOrgs ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
          <Loader size={32} className="spin" style={{ margin: '0 auto 12px' }} />
          <p>Caricamento organizzazioni...</p>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontWeight: '600',
              marginBottom: '8px',
              fontSize: '14px'
            }}>
              Seleziona Organizzazione *
            </label>
            <select
              value={selectedOrg?.id || ''}
              onChange={(e) => {
                const org = organizations.find(o => o.id === e.target.value)
                if (org) handleOrgSelect(org)
              }}
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                background: 'white',
                color: '#1e293b',
                display: 'block',
                visibility: 'visible',
                opacity: 1,
                zIndex: 10,
                cursor: 'pointer'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            >
              <option value="">-- Seleziona un'organizzazione --</option>
              {organizations.map(org => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontWeight: '600',
              marginBottom: '8px',
              fontSize: '14px'
            }}>
              Nome Sito (Sottodominio) *
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              placeholder="es: pizzeria-roma, salone-bellezza, palestra-fitness"
              disabled={!selectedOrg}
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                background: !selectedOrg ? '#f1f5f9' : 'white',
                color: '#1e293b',
                cursor: !selectedOrg ? 'not-allowed' : 'text'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            />
            <small style={{ color: '#64748b', fontSize: '12px' }}>
              Il dominio sarà: <strong>{slug || 'slug'}.omnilypro.com</strong>
            </small>
          </div>
        </>
      )}

      <button
        onClick={handleCreateDomain}
        disabled={loading || !slug || !selectedOrg || loadingOrgs}
        style={{
          width: '100%',
          padding: '14px',
          background: loading ? '#cbd5e1' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '16px',
          fontWeight: '600',
          cursor: loading ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          transition: 'transform 0.2s'
        }}
        onMouseOver={(e) => !loading && (e.currentTarget.style.transform = 'translateY(-2px)')}
        onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
      >
        {loading ? (
          <>
            <Loader size={20} className="spin" />
            Creazione in corso...
          </>
        ) : (
          <>
            <Plus size={20} />
            Crea Dominio
          </>
        )}
      </button>

      {result && (
        <div style={{
          marginTop: '20px',
          padding: '16px',
          borderRadius: '8px',
          background: result.success ? '#ecfdf5' : '#fef2f2',
          border: `2px solid ${result.success ? '#10b981' : '#ef4444'}`
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '8px'
          }}>
            {result.success ? (
              <Check size={20} color="#10b981" />
            ) : (
              <X size={20} color="#ef4444" />
            )}
            <strong style={{
              color: result.success ? '#10b981' : '#ef4444',
              fontSize: '16px'
            }}>
              {result.success ? 'Successo!' : 'Errore'}
            </strong>
          </div>

          <p style={{
            margin: '8px 0',
            color: result.success ? '#047857' : '#dc2626',
            fontSize: '14px'
          }}>
            {result.message || result.error}
          </p>

          {result.domain && (
            <div style={{
              marginTop: '12px',
              padding: '12px',
              background: 'white',
              borderRadius: '6px',
              border: '1px solid #d1fae5'
            }}>
              <strong style={{ fontSize: '14px' }}>Dominio creato:</strong>
              <br />
              <a
                href={`https://${result.domain}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: '#667eea',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                {result.domain}
              </a>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  )
}

export default DomainManagementPanel
