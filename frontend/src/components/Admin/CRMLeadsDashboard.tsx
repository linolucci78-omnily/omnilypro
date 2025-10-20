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
  Target,
  LayoutDashboard,
  Kanban,
  FileText
} from 'lucide-react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragStartEvent,
  type DragEndEvent
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { crmLeadsService } from '../../services/crmLeadsService'
import { contractsService } from '../../services/contractsService'
import type { CRMLead, LeadStats, CRMLeadInput } from '../../services/crmLeadsService'
import PageLoader from '../UI/PageLoader'
import LeadModal from './LeadModal'
import LeadDetailModal from './LeadDetailModal'
import CreateContractModal from './CreateContractModal'
import AgentDashboard from './AgentDashboard'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import './CRMLeadsDashboard.css'

const CRMLeadsDashboard: React.FC = () => {
  const { isSuperAdmin } = useAuth()
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [leads, setLeads] = useState<CRMLead[]>([])
  const [stats, setStats] = useState<LeadStats | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStage, setSelectedStage] = useState('all')
  const [viewMode, setViewMode] = useState<'pipeline' | 'list'>('pipeline')
  const [dashboardView, setDashboardView] = useState<'agent' | 'full'>('agent') // New: agent dashboard vs full Kanban
  const [showLeadModal, setShowLeadModal] = useState(false)
  const [selectedLead, setSelectedLead] = useState<CRMLead | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [activeDragId, setActiveDragId] = useState<string | null>(null)
  const [showContractModal, setShowContractModal] = useState(false)
  const [contractLeadId, setContractLeadId] = useState<string | null>(null)

  // Drag & Drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  )

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
      console.log('🔃 Loading CRM data...')
      setLoading(true)

      const [leadsData, statsData] = await Promise.all([
        crmLeadsService.getLeads({
          stage: selectedStage,
          search: searchTerm
        }),
        crmLeadsService.getLeadStats()
      ])

      console.log(`✅ Loaded ${leadsData.length} leads`)
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
    // Apre modal per creare contratto con lead pre-selezionato
    console.log('📝 Opening contract modal for lead:', leadId)
    setContractLeadId(leadId)
    setShowContractModal(true)
  }

  const handleContractCreated = async () => {
    // Dopo creazione contratto, chiudi modal e reload leads
    setShowContractModal(false)
    setContractLeadId(null)
    toast.showSuccess('Successo', 'Contratto creato! Ora vai in "Contratti e Firma" per inviarlo al cliente.')
    await loadData()
  }

  const handleFixCorruptedData = async () => {
    if (!confirm('Questa operazione cercherà e correggerà i lead con stage corrotto (UUID invece di nome stage). Vuoi continuare?')) {
      return
    }

    try {
      console.log('🔧 Searching for corrupted leads...')

      // Find all leads with UUID-like stage (contains dashes in UUID pattern)
      const corruptedLeads = leads.filter(lead =>
        lead.stage && lead.stage.includes('-') && lead.stage.length > 30
      )

      console.log(`Found ${corruptedLeads.length} corrupted leads:`, corruptedLeads.map(l => ({ id: l.id, company: l.company_name, stage: l.stage })))

      if (corruptedLeads.length === 0) {
        alert('✅ Nessun lead corrotto trovato!')
        return
      }

      // Fix each corrupted lead by setting stage to 'lead'
      let fixed = 0
      for (const lead of corruptedLeads) {
        try {
          await crmLeadsService.moveLeadToStage(lead.id, 'lead')
          console.log(`✅ Fixed lead: ${lead.company_name}`)
          fixed++
        } catch (error) {
          console.error(`❌ Error fixing lead ${lead.id}:`, error)
        }
      }

      alert(`✅ Corretti ${fixed} lead su ${corruptedLeads.length}!`)

      // Reload data
      await loadData()
    } catch (error: any) {
      console.error('❌ Error fixing corrupted data:', error)
      alert(`❌ Errore durante la correzione: ${error.message}`)
    }
  }

  // Drag & Drop handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id as string)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    console.log('🎯 DragEnd event:', { active: active.id, over: over?.id })

    setActiveDragId(null)

    if (!over) {
      console.log('⚠️ No drop target')
      return
    }

    const leadId = active.id as string
    const newStage = over.id as string

    console.log('📌 Lead ID:', leadId, 'New Stage:', newStage)

    // Find the lead that was dragged
    const lead = leads.find(l => l.id === leadId)

    if (!lead) {
      console.error('❌ Lead not found:', leadId)
      return
    }

    if (lead.stage === newStage) {
      console.log('ℹ️ Same stage, no update needed')
      return
    }

    try {
      console.log(`📦 Moving lead "${lead.company_name}" from ${lead.stage} to ${newStage}`)

      // Update in database FIRST
      await crmLeadsService.moveLeadToStage(leadId, newStage)

      console.log('✅ Lead moved successfully in database')

      // Reload ALL data to ensure consistency
      await loadData()

      console.log('✅ Data reloaded successfully')

    } catch (error) {
      console.error('❌ Error moving lead:', error)
      alert('Errore nello spostamento del lead')
      // Reload data anyway
      await loadData()
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
      'sign_contract': '#16a34a',  // Verde scuro per firma
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
      'sign_contract': 'Firma Contratto',  // NUOVO
      'won': 'Vinto',
      'lost': 'Perso'
    }
    return labels[stage] || stage
  }

  const stages = [
    'lead',
    'contacted',
    'demo_scheduled',
    'demo_completed',
    'proposal_sent',
    'negotiation',
    'contract_ready',
    'sign_contract',  // Stage finale per firma contratto
    'won',  // Deal vinti - colonna finale celebrativa!
    'lost'  // Deal persi - per tracciamento
  ]

  // Group leads by stage for Kanban view - MUST be recalculated when leads change
  const leadsByStage = React.useMemo(() => {
    const grouped = leads.reduce((acc, lead) => {
      if (!acc[lead.stage]) {
        acc[lead.stage] = []
      }
      acc[lead.stage].push(lead)
      return acc
    }, {} as { [key: string]: CRMLead[] })

    console.log('🔄 Leads grouped by stage:', Object.keys(grouped).map(stage => `${stage}: ${grouped[stage].length}`))
    return grouped
  }, [leads])

  // Droppable Column Component
  const DroppableColumn = ({ stage, children }: { stage: string; children: React.ReactNode }) => {
    const { setNodeRef, isOver } = useDroppable({ id: stage })

    return (
      <div
        ref={setNodeRef}
        className="column-content"
        style={{
          minHeight: '100px',
          background: isOver ? '#f0f9ff' : 'transparent',
          transition: 'background 0.2s ease'
        }}
      >
        {children}
      </div>
    )
  }

  // Draggable Lead Card Component
  const DraggableLeadCard = ({ lead, stage }: { lead: CRMLead; stage: string }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging
    } = useSortable({ id: lead.id })

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1
    }

    return (
      <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
        <div className="lead-card" onClick={() => setSelectedLead(lead)} style={{ cursor: 'pointer' }}>
          <div className="lead-card-header">
            <h4>{lead.company_name}</h4>
            <button className="card-menu-btn" onClick={(e) => e.stopPropagation()}>
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
              onClick={async (e) => {
                e.stopPropagation()
                // Sposta il lead allo stage "Firma Contratto"
                try {
                  await crmLeadsService.moveLeadToStage(lead.id, 'sign_contract')
                  await loadData()
                } catch (error) {
                  console.error('Error moving to sign_contract stage:', error)
                }
              }}
            >
              <CheckCircle size={16} />
              Procedi a Firma
            </button>
          )}

          {stage === 'sign_contract' && (
            <button
              className="btn-sign-contract"
              style={{ background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)' }}
              onClick={(e) => {
                e.stopPropagation()
                handleSignContract(lead.id)
              }}
            >
              <CheckCircle size={16} />
              Firma Contratto OTP
            </button>
          )}
        </div>
      </div>
    )
  }

  if (loading) {
    return <PageLoader />
  }

  const activeLead = leads.find(l => l.id === activeDragId)

  return (
    <div className="crm-leads-dashboard" style={{ width: '100%', maxWidth: '100vw', overflow: 'hidden', padding: dashboardView === 'agent' ? '0' : '2rem', boxSizing: 'border-box' }}>
      {/* Header - Sempre visibile */}
      <div className="crm-leads-header" style={{ width: '100%', maxWidth: '100%', display: 'flex', justifyContent: 'space-between', marginBottom: dashboardView === 'agent' ? '0' : '2rem', padding: dashboardView === 'agent' ? '2rem 2rem 0 2rem' : '0', boxSizing: 'border-box' }}>
        <div>
          <h1 className="crm-leads-title">
            <Briefcase size={32} />
            CRM - Pipeline Vendite
          </h1>
          <p className="crm-leads-subtitle">
            Gestisci lead e trattative commerciali
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {/* Dashboard / Kanban Toggle */}
          <div className="view-toggle" style={{ marginRight: '0.5rem' }}>
            <button
              className={dashboardView === 'agent' ? 'active' : ''}
              onClick={() => setDashboardView('agent')}
            >
              <div className="tab-content">
                <span className="tab-title">La Mia Dashboard</span>
                <span className="tab-subtitle">I miei task e lead</span>
              </div>
            </button>
            <button
              className={dashboardView === 'full' ? 'active' : ''}
              onClick={() => setDashboardView('full')}
            >
              <div className="tab-content">
                <span className="tab-title">Kanban Completo</span>
                <span className="tab-subtitle">Pipeline vendite</span>
              </div>
            </button>
          </div>

          {dashboardView === 'full' && isSuperAdmin && (
            <button
              className="btn-fix-data"
              onClick={handleFixCorruptedData}
              title="Correggi dati corrotti nel database"
            >
              <div className="btn-content">
                <span className="btn-title">🔧 Fix Data</span>
                <span className="btn-subtitle">Correggi errori</span>
              </div>
            </button>
          )}
          <button
            className="btn-add-lead"
            onClick={() => setShowLeadModal(true)}
          >
            <div className="btn-content">
              <Plus size={18} />
              <div>
                <span className="btn-title">Nuovo Lead</span>
                <span className="btn-subtitle">Aggiungi contatto</span>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Agent Dashboard View - SOLO questa vista */}
      {dashboardView === 'agent' && (
        <AgentDashboard />
      )}

      {/* Full Kanban View - SOLO questa vista */}
      {dashboardView === 'full' && (
        <div>

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
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
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

                <SortableContext
                  id={stage}
                  items={leadsByStage[stage]?.map(l => l.id) || []}
                  strategy={verticalListSortingStrategy}
                >
                  <DroppableColumn stage={stage}>
                    {leadsByStage[stage]?.map((lead) => (
                      <DraggableLeadCard key={lead.id} lead={lead} stage={stage} />
                    ))}

                    {(!leadsByStage[stage] || leadsByStage[stage].length === 0) && (
                      <div className="empty-column">
                        Nessun lead in questo stage
                      </div>
                    )}
                  </DroppableColumn>
                </SortableContext>
              </div>
            ))}
          </div>

          <DragOverlay>
            {activeLead ? (
              <div className="lead-card" style={{ opacity: 0.8, cursor: 'grabbing' }}>
                <div className="lead-card-header">
                  <h4>{activeLead.company_name}</h4>
                </div>
                <div className="lead-card-contact">
                  <Users size={14} />
                  {activeLead.contact_name}
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
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
        </div>
      )}

      {/* Lead Modal - Always visible regardless of view */}
      <LeadModal
        isOpen={showLeadModal}
        onClose={() => setShowLeadModal(false)}
        onSave={handleSaveLead}
      />

      {/* Lead Detail Modal - Always visible regardless of view */}
      {selectedLead && (
        <LeadDetailModal
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onUpdate={loadData}
        />
      )}

      {/* Contract Modal - Opens when clicking "Firma Contratto OTP" */}
      <CreateContractModal
        isOpen={showContractModal}
        onClose={() => {
          setShowContractModal(false)
          setContractLeadId(null)
        }}
        onSuccess={handleContractCreated}
        preSelectedLeadId={contractLeadId || undefined}
      />
    </div>
  )
}

export default CRMLeadsDashboard
