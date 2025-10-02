import React, { useState, useEffect } from 'react'
import {
  Briefcase,
  Users,
  TrendingUp,
  DollarSign,
  Phone,
  Mail,
  Calendar,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  Target
} from 'lucide-react'
import { crmLeadsService } from '../../services/crmLeadsService'
import type { CRMLead, LeadStats, CRMLeadInput } from '../../services/crmLeadsService'
import PageLoader from '../UI/PageLoader'
import LeadModal from './LeadModal'
import { supabase } from '../../lib/supabase'
import './CRMLeadsDashboard.css'

const CRMLeadsDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [leads, setLeads] = useState<CRMLead[]>([])
  const [stats, setStats] = useState<LeadStats | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStage, setSelectedStage] = useState('all')
  const [viewMode, setViewMode] = useState<'pipeline' | 'list'>('pipeline')
  const [showLeadModal, setShowLeadModal] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  // Get current user ID
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setCurrentUserId(user.id)
      }
    }
    getCurrentUser()
  }, [])

  // Load leads and stats
  useEffect(() => {
    if (currentUserId) {
      loadData()
    }
  }, [selectedStage, searchTerm, currentUserId])

  const loadData = async () => {
    try {
      setLoading(true)

      const [leadsData, statsData] = await Promise.all([
        crmLeadsService.getLeads({
          stage: selectedStage,
          search: searchTerm
        }),
        crmLeadsService.getLeadStats()
      ])

      setLeads(leadsData)
      setStats(statsData)
    } catch (error) {
      console.error('Error loading CRM data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveLead = async (leadData: CRMLeadInput) => {
    if (!currentUserId) {
      throw new Error('User not authenticated')
    }

    try {
      console.log('💾 Creating new lead...', leadData)
      const newLead = await crmLeadsService.createLead(leadData, currentUserId)
      console.log('✅ Lead created:', newLead)

      // Reload data
      await loadData()
    } catch (error) {
      console.error('❌ Error creating lead:', error)
      throw error
    }
  }

  const handleSignContract = async (leadId: string) => {
    if (!confirm('Sei sicuro di voler firmare il contratto per questo lead? Verrà creato un nuovo customer con stato PENDING in attesa di attivazione.')) {
      return
    }

    try {
      console.log('📝 Signing contract for lead:', leadId)
      const result = await crmLeadsService.signContract(leadId)
      console.log('✅ Contract signed! Customer ID:', result.customerId)

      alert(`✅ Contratto firmato!\n\nCustomer ID: ${result.customerId}\n\nIl cliente è ora in stato PENDING e apparirà nella sezione "Clienti da Attivare" dell'admin.`)

      // Reload data
      await loadData()
    } catch (error: any) {
      console.error('❌ Error signing contract:', error)
      alert(`❌ Errore durante la firma del contratto: ${error.message}`)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const getStageColor = (stage: string) => {
    const colors: { [key: string]: string } = {
      'lead': '#94a3b8',
      'contacted': '#60a5fa',
      'demo_scheduled': '#3b82f6',
      'demo_completed': '#8b5cf6',
      'proposal_sent': '#a855f7',
      'negotiation': '#ec4899',
      'contract_ready': '#f59e0b',
      'won': '#10b981',
      'lost': '#ef4444'
    }
    return colors[stage] || '#94a3b8'
  }

  const getStageLabel = (stage: string) => {
    const labels: { [key: string]: string } = {
      'lead': 'Lead',
      'contacted': 'Contattato',
      'demo_scheduled': 'Demo Fissata',
      'demo_completed': 'Demo Completata',
      'proposal_sent': 'Proposta Inviata',
      'negotiation': 'Negoziazione',
      'contract_ready': 'Contratto Pronto',
      'won': 'Vinto',
      'lost': 'Perso'
    }
    return labels[stage] || stage
  }

  // Group leads by stage for Kanban view
  const leadsByStage = leads.reduce((acc, lead) => {
    if (!acc[lead.stage]) {
      acc[lead.stage] = []
    }
    acc[lead.stage].push(lead)
    return acc
  }, {} as { [key: string]: CRMLead[] })

  const stages = [
    'lead',
    'contacted',
    'demo_scheduled',
    'demo_completed',
    'proposal_sent',
    'negotiation',
    'contract_ready'
  ]

  if (loading) {
    return <PageLoader />
  }

  return (
    <div className="crm-leads-dashboard" style={{ width: '100%', maxWidth: '100%', overflow: 'visible' }}>
      {/* Header */}
      <div className="crm-leads-header" style={{ width: '100%', display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <h1 className="crm-leads-title">
            <Briefcase size={32} />
            CRM - Pipeline Vendite
          </h1>
          <p className="crm-leads-subtitle">
            Gestisci lead e trattative commerciali
          </p>
        </div>

        <button
          className="btn-add-lead"
          onClick={() => setShowLeadModal(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.875rem 1.5rem',
            background: '#1e40af',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          <Plus size={18} />
          Nuovo Lead
        </button>
      </div>

      {/* Stats Cards */}
      <div className="crm-stats-grid">
        <div className="crm-stat-card">
          <div className="stat-icon" style={{ background: '#dbeafe', color: '#3b82f6' }}>
            <Users size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats?.active_leads || 0}</div>
            <div className="stat-label">Lead Attivi</div>
          </div>
        </div>

        <div className="crm-stat-card">
          <div className="stat-icon" style={{ background: '#d1fae5', color: '#10b981' }}>
            <CheckCircle size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats?.won_this_month || 0}</div>
            <div className="stat-label">Vinti Questo Mese</div>
          </div>
        </div>

        <div className="crm-stat-card">
          <div className="stat-icon" style={{ background: '#fef3c7', color: '#f59e0b' }}>
            <DollarSign size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{formatCurrency(stats?.pipeline_value || 0)}</div>
            <div className="stat-label">Valore Pipeline</div>
          </div>
        </div>

        <div className="crm-stat-card">
          <div className="stat-icon" style={{ background: '#e0e7ff', color: '#6366f1' }}>
            <TrendingUp size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats?.conversion_rate.toFixed(1) || 0}%</div>
            <div className="stat-label">Tasso Conversione</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="crm-filters">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Cerca azienda, contatto, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          value={selectedStage}
          onChange={(e) => setSelectedStage(e.target.value)}
          className="stage-filter"
        >
          <option value="all">Tutti gli Stage</option>
          <option value="lead">Lead</option>
          <option value="contacted">Contattato</option>
          <option value="demo_scheduled">Demo Fissata</option>
          <option value="proposal_sent">Proposta Inviata</option>
          <option value="contract_ready">Contratto Pronto</option>
        </select>

        <div className="view-toggle">
          <button
            className={viewMode === 'pipeline' ? 'active' : ''}
            onClick={() => setViewMode('pipeline')}
          >
            Pipeline
          </button>
          <button
            className={viewMode === 'list' ? 'active' : ''}
            onClick={() => setViewMode('list')}
          >
            Lista
          </button>
        </div>
      </div>

      {/* Pipeline Kanban View */}
      {viewMode === 'pipeline' && (
        <div className="pipeline-kanban">
          {stages.map((stage) => (
            <div key={stage} className="kanban-column">
              <div
                className="column-header"
                style={{ borderTopColor: getStageColor(stage) }}
              >
                <h3>{getStageLabel(stage)}</h3>
                <span className="column-count">
                  {leadsByStage[stage]?.length || 0}
                </span>
              </div>

              <div className="column-content">
                {leadsByStage[stage]?.map((lead) => (
                  <div key={lead.id} className="lead-card">
                    <div className="lead-card-header">
                      <h4>{lead.company_name}</h4>
                      <button className="card-menu-btn">
                        <MoreVertical size={16} />
                      </button>
                    </div>

                    <div className="lead-card-contact">
                      <Users size={14} />
                      {lead.contact_name}
                    </div>

                    {lead.email && (
                      <div className="lead-card-email">
                        <Mail size={14} />
                        {lead.email}
                      </div>
                    )}

                    <div className="lead-card-value">
                      <DollarSign size={14} />
                      {formatCurrency(lead.estimated_monthly_value)}/mese
                    </div>

                    <div className="lead-card-footer">
                      <div
                        className="probability-badge"
                        style={{ background: `${getStageColor(stage)}20`, color: getStageColor(stage) }}
                      >
                        {lead.probability}%
                      </div>

                      {lead.next_action_date && (
                        <div className="next-action">
                          <Clock size={12} />
                          {new Date(lead.next_action_date).toLocaleDateString('it-IT')}
                        </div>
                      )}
                    </div>

                    {stage === 'contract_ready' && (
                      <button
                        className="btn-sign-contract"
                        onClick={() => handleSignContract(lead.id)}
                      >
                        <CheckCircle size={16} />
                        Firma Contratto
                      </button>
                    )}
                  </div>
                ))}

                {(!leadsByStage[stage] || leadsByStage[stage].length === 0) && (
                  <div className="empty-column">
                    Nessun lead in questo stage
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="leads-table-card">
          <table className="leads-table">
            <thead>
              <tr>
                <th>Azienda</th>
                <th>Contatto</th>
                <th>Stage</th>
                <th>Probabilità</th>
                <th>Valore</th>
                <th>Prossima Azione</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id}>
                  <td>
                    <div className="company-cell">
                      <div className="company-name">{lead.company_name}</div>
                      {lead.city && (
                        <div className="company-location">{lead.city}</div>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="contact-cell">
                      <div>{lead.contact_name}</div>
                      {lead.email && (
                        <div className="contact-email">{lead.email}</div>
                      )}
                    </div>
                  </td>
                  <td>
                    <span
                      className="stage-badge"
                      style={{
                        background: `${getStageColor(lead.stage)}20`,
                        color: getStageColor(lead.stage)
                      }}
                    >
                      {getStageLabel(lead.stage)}
                    </span>
                  </td>
                  <td>
                    <div className="probability-bar">
                      <div
                        className="probability-fill"
                        style={{
                          width: `${lead.probability}%`,
                          background: getStageColor(lead.stage)
                        }}
                      />
                      <span>{lead.probability}%</span>
                    </div>
                  </td>
                  <td className="value-cell">
                    {formatCurrency(lead.estimated_monthly_value)}
                  </td>
                  <td>
                    {lead.next_action && (
                      <div className="next-action-cell">
                        <div>{lead.next_action}</div>
                        {lead.next_action_date && (
                          <div className="action-date">
                            {new Date(lead.next_action_date).toLocaleDateString('it-IT')}
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="action-btn">
                        <Eye size={16} />
                      </button>
                      <button className="action-btn">
                        <Edit2 size={16} />
                      </button>
                      <button className="action-btn">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Lead Modal */}
      <LeadModal
        isOpen={showLeadModal}
        onClose={() => setShowLeadModal(false)}
        onSave={handleSaveLead}
      />
    </div>
  )
}

export default CRMLeadsDashboard
