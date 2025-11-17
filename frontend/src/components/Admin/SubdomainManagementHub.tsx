import React, { useState, useEffect } from 'react'
import { Globe, Plus, Trash2, RefreshCw, Copy, Check, AlertCircle, ExternalLink } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import './SubdomainManagementHub.css'

interface Organization {
  id: string
  name: string
  slug: string
  custom_domain: string | null
  website_enabled: boolean
}

interface SubdomainStatus {
  organizationId: string
  status: 'creating' | 'success' | 'error'
  message?: string
}

export const SubdomainManagementHub: React.FC = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [subdomainStatuses, setSubdomainStatuses] = useState<Record<string, SubdomainStatus>>({})
  const [copiedDomain, setCopiedDomain] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadOrganizations()
  }, [])

  const loadOrganizations = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name, slug, custom_domain, website_enabled')
        .order('name')

      if (error) throw error
      setOrganizations(data || [])
    } catch (error) {
      console.error('Error loading organizations:', error)
    } finally {
      setLoading(false)
    }
  }

  const createSubdomain = async (org: Organization) => {
    try {
      setSubdomainStatuses(prev => ({
        ...prev,
        [org.id]: { organizationId: org.id, status: 'creating' }
      }))

      const { data, error } = await supabase.functions.invoke('create-organization-domain', {
        body: {
          organizationSlug: org.slug,
          organizationId: org.id
        }
      })

      if (error) throw error

      setSubdomainStatuses(prev => ({
        ...prev,
        [org.id]: {
          organizationId: org.id,
          status: 'success',
          message: data.message
        }
      }))

      // Reload organizations to get updated custom_domain
      await loadOrganizations()

      // Clear status after 5 seconds
      setTimeout(() => {
        setSubdomainStatuses(prev => {
          const { [org.id]: _, ...rest } = prev
          return rest
        })
      }, 5000)

    } catch (error: any) {
      console.error('Error creating subdomain:', error)
      setSubdomainStatuses(prev => ({
        ...prev,
        [org.id]: {
          organizationId: org.id,
          status: 'error',
          message: error.message || 'Errore durante la creazione del sottodominio'
        }
      }))
    }
  }

  const deleteSubdomain = async (org: Organization) => {
    if (!confirm(`Sei sicuro di voler eliminare il sottodominio per "${org.name}"?`)) {
      return
    }

    try {
      // Update database to remove custom_domain
      const { error } = await supabase
        .from('organizations')
        .update({ custom_domain: null })
        .eq('id', org.id)

      if (error) throw error

      // Note: Cloudflare DNS and Vercel domain should be manually removed
      alert(`Sottodominio rimosso dal database.\n\nRicorda di rimuovere manualmente:\n1. Il record DNS da Cloudflare\n2. Il dominio da Vercel`)

      await loadOrganizations()
    } catch (error) {
      console.error('Error deleting subdomain:', error)
      alert('Errore durante l\'eliminazione del sottodominio')
    }
  }

  const copyToClipboard = (domain: string) => {
    navigator.clipboard.writeText(`https://${domain}`)
    setCopiedDomain(domain)
    setTimeout(() => setCopiedDomain(null), 2000)
  }

  const filteredOrganizations = organizations.filter(org =>
    org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    org.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
    org.custom_domain?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const stats = {
    total: organizations.length,
    withSubdomain: organizations.filter(o => o.custom_domain).length,
    withoutSubdomain: organizations.filter(o => !o.custom_domain).length,
    websiteEnabled: organizations.filter(o => o.website_enabled).length
  }

  if (loading) {
    return (
      <div className="subdomain-hub-container">
        <div className="subdomain-loading">
          <div className="subdomain-spinner"></div>
          <p>Caricamento organizzazioni...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="subdomain-hub-container">
      {/* Header */}
      <div className="subdomain-header">
        <div className="subdomain-header-icon">
          <Globe size={40} />
        </div>
        <div className="subdomain-header-content">
          <h1>Gestione Sottodomini</h1>
          <p>Crea e gestisci sottodomini per i siti web delle organizzazioni</p>
        </div>
      </div>

      {/* Stats */}
      <div className="subdomain-stats">
        <div className="subdomain-stat-card">
          <div className="subdomain-stat-number">{stats.total}</div>
          <div className="subdomain-stat-label">Organizzazioni Totali</div>
        </div>
        <div className="subdomain-stat-card">
          <div className="subdomain-stat-number" style={{ color: '#10b981' }}>{stats.withSubdomain}</div>
          <div className="subdomain-stat-label">Con Sottodominio</div>
        </div>
        <div className="subdomain-stat-card">
          <div className="subdomain-stat-number" style={{ color: '#f59e0b' }}>{stats.withoutSubdomain}</div>
          <div className="subdomain-stat-label">Senza Sottodominio</div>
        </div>
        <div className="subdomain-stat-card">
          <div className="subdomain-stat-number" style={{ color: '#3b82f6' }}>{stats.websiteEnabled}</div>
          <div className="subdomain-stat-label">Sito Abilitato</div>
        </div>
      </div>

      {/* Search */}
      <div className="subdomain-search-bar">
        <input
          type="text"
          placeholder="Cerca organizzazione, slug o dominio..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="subdomain-search-input"
        />
      </div>

      {/* Table */}
      <div className="subdomain-table-container">
        <table className="subdomain-table">
          <thead>
            <tr>
              <th>Organizzazione</th>
              <th>Slug</th>
              <th>Sottodominio</th>
              <th>Sito Web</th>
              <th>Status</th>
              <th>Azioni</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrganizations.map(org => {
              const status = subdomainStatuses[org.id]
              return (
                <tr key={org.id}>
                  <td>
                    <div className="subdomain-org-name">{org.name}</div>
                  </td>
                  <td>
                    <code className="subdomain-slug">{org.slug}</code>
                  </td>
                  <td>
                    {org.custom_domain ? (
                      <div className="subdomain-domain-cell">
                        <a
                          href={`https://${org.custom_domain}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="subdomain-domain-link"
                        >
                          {org.custom_domain}
                          <ExternalLink size={14} />
                        </a>
                        <button
                          onClick={() => copyToClipboard(org.custom_domain!)}
                          className="subdomain-copy-btn"
                          title="Copia URL"
                        >
                          {copiedDomain === org.custom_domain ? (
                            <Check size={14} style={{ color: '#10b981' }} />
                          ) : (
                            <Copy size={14} />
                          )}
                        </button>
                      </div>
                    ) : (
                      <span className="subdomain-no-domain">Nessun dominio</span>
                    )}
                  </td>
                  <td>
                    <span className={`subdomain-badge ${org.website_enabled ? 'subdomain-badge-success' : 'subdomain-badge-inactive'}`}>
                      {org.website_enabled ? 'Abilitato' : 'Disabilitato'}
                    </span>
                  </td>
                  <td>
                    {status ? (
                      <div className="subdomain-status-cell">
                        {status.status === 'creating' && (
                          <span className="subdomain-status subdomain-status-creating">
                            <RefreshCw size={14} className="subdomain-spin" />
                            Creazione...
                          </span>
                        )}
                        {status.status === 'success' && (
                          <span className="subdomain-status subdomain-status-success">
                            <Check size={14} />
                            Creato!
                          </span>
                        )}
                        {status.status === 'error' && (
                          <span className="subdomain-status subdomain-status-error" title={status.message}>
                            <AlertCircle size={14} />
                            Errore
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="subdomain-status-empty">-</span>
                    )}
                  </td>
                  <td>
                    <div className="subdomain-actions">
                      {!org.custom_domain ? (
                        <button
                          onClick={() => createSubdomain(org)}
                          disabled={!!status || !org.website_enabled}
                          className="subdomain-btn subdomain-btn-create"
                          title={!org.website_enabled ? 'Abilita prima il sito web' : 'Crea sottodominio'}
                        >
                          <Plus size={16} />
                          Crea
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => createSubdomain(org)}
                            disabled={!!status}
                            className="subdomain-btn subdomain-btn-refresh"
                            title="Rigenera sottodominio"
                          >
                            <RefreshCw size={16} />
                          </button>
                          <button
                            onClick={() => deleteSubdomain(org)}
                            className="subdomain-btn subdomain-btn-delete"
                            title="Elimina sottodominio"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {filteredOrganizations.length === 0 && (
          <div className="subdomain-empty-state">
            <Globe size={48} style={{ opacity: 0.3 }} />
            <p>Nessuna organizzazione trovata</p>
          </div>
        )}
      </div>
    </div>
  )
}
