import React, { useState, useEffect } from 'react'
import {
  FileText,
  Plus,
  Send,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  Mail,
  Download,
  Calendar,
  Euro,
  Building2,
  User,
  AlertCircle,
  Loader,
  Search,
  Filter,
  Trash2
} from 'lucide-react'
import {
  contractsService,
  type Contract,
  type ContractSignature
} from '../../services/contractsService'
import { useToast } from '../../contexts/ToastContext'
import { useAuth } from '../../contexts/AuthContext'
import CreateContractModal from './CreateContractModal'
import './ContractsDashboard.css'

const ContractsDashboard: React.FC = () => {
  const { user } = useAuth()
  const toast = useToast()

  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null)
  const [signatures, setSignatures] = useState<ContractSignature[]>([])
  const [showModal, setShowModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadContracts()
  }, [filterStatus])

  const loadContracts = async () => {
    try {
      setLoading(true)
      const filters = filterStatus !== 'all' ? { status: filterStatus } : undefined
      const data = await contractsService.getContracts(filters)
      setContracts(data)
    } catch (error) {
      console.error('Error loading contracts:', error)
      toast.showError('Errore', 'Impossibile caricare i contratti')
    } finally {
      setLoading(false)
    }
  }

  const handleViewContract = async (contract: Contract) => {
    setSelectedContract(contract)
    try {
      const sigs = await contractsService.getContractSignatures(contract.id)
      setSignatures(sigs)
      setShowModal(true)
    } catch (error) {
      console.error('Error loading signatures:', error)
      toast.showError('Errore', 'Impossibile caricare le firme')
    }
  }

  const handleSendContract = async (contractId: string) => {
    try {
      // Get contract details
      const contract = contracts.find(c => c.id === contractId)
      if (!contract) {
        toast.showError('Errore', 'Contratto non trovato')
        return
      }

      // Validate client info
      if (!contract.client_info.email) {
        toast.showError('Errore', 'Email cliente mancante. Modifica il contratto prima di inviarlo.')
        return
      }

      // Check if there are existing signatures
      const existingSignatures = await contractsService.getContractSignatures(contractId)

      let signature
      if (existingSignatures.length > 0) {
        // Rinvia OTP alla signature esistente
        signature = existingSignatures[0]
        console.log('📧 Resending OTP to existing signature:', signature.id)

        // Send OTP to client's email
        await contractsService.sendSignatureOTP(signature.id, 'email')

        toast.showSuccess(
          'Email Reinviata',
          `Il link di firma è stato rinviato a ${contract.client_info.email}`
        )
      } else {
        // Prima volta - crea signature requests per ENTRAMBE le parti
        console.log('📧 Creating signature requests for client AND vendor')

        // Update contract status to sent
        await contractsService.sendContract(contractId)

        // 1. Create signature request for the CLIENT
        const clientSignature = await contractsService.createSignatureRequest({
          contract_id: contractId,
          signer_name: contract.client_info.name,
          signer_email: contract.client_info.email,
          signer_phone: contract.client_info.phone,
          signer_role: 'client',
          signer_company: contract.client_info.company
        })

        // 2. Create signature request for the VENDOR (fornitore)
        await contractsService.createSignatureRequest({
          contract_id: contractId,
          signer_name: contract.vendor_info.name,
          signer_email: contract.vendor_info.email,
          signer_phone: undefined,
          signer_role: 'vendor',
          signer_company: contract.vendor_info.company
        })

        // Send OTP ONLY to client first
        await contractsService.sendSignatureOTP(clientSignature.id, 'email')

        signature = clientSignature

        toast.showSuccess(
          'Contratto Inviato',
          `Il contratto è stato inviato a ${contract.client_info.email}. Dopo la firma del cliente, riceverai notifica per firmare anche tu.`
        )
      }

      // Generate signature link
      const signatureLink = `${window.location.origin}/sign/${signature.id}`
      console.log('📧 Signature link:', signatureLink)

      loadContracts()
    } catch (error: any) {
      console.error('Error sending contract:', error)
      toast.showError('Errore', error.message || 'Impossibile inviare il contratto')
    }
  }

  const handleDeleteContract = async (contractId: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo contratto? Questa azione non può essere annullata.')) {
      return
    }

    try {
      // TODO: Implementare la funzione di eliminazione nel service
      // await contractsService.deleteContract(contractId)
      toast.showError('In Sviluppo', 'Funzione eliminazione contratto in arrivo')
      // loadContracts()
    } catch (error: any) {
      console.error('Error deleting contract:', error)
      toast.showError('Errore', error.message || 'Impossibile eliminare il contratto')
    }
  }

  const getStatusInfo = (status: Contract['status']) => {
    const statusMap = {
      draft: { icon: Clock, color: '#94a3b8', label: 'Bozza' },
      sent: { icon: Send, color: '#3b82f6', label: 'Inviato' },
      viewed: { icon: Eye, color: '#8b5cf6', label: 'Visualizzato' },
      signing_in_progress: { icon: Clock, color: '#f59e0b', label: 'In Firma' },
      signed: { icon: CheckCircle, color: '#10b981', label: 'Firmato' },
      completed: { icon: CheckCircle, color: '#059669', label: 'Completato' },
      rejected: { icon: XCircle, color: '#ef4444', label: 'Rifiutato' },
      expired: { icon: AlertCircle, color: '#dc2626', label: 'Scaduto' },
      cancelled: { icon: XCircle, color: '#6b7280', label: 'Annullato' }
    }
    return statusMap[status] || statusMap.draft
  }

  const filteredContracts = contracts.filter(contract => {
    const matchesSearch =
      contract.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.contract_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.client_info.company.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const stats = {
    total: contracts.length,
    draft: contracts.filter(c => c.status === 'draft').length,
    sent: contracts.filter(c => c.status === 'sent' || c.status === 'viewed' || c.status === 'signing_in_progress').length,
    signed: contracts.filter(c => c.status === 'signed' || c.status === 'completed').length,
    totalValue: contracts
      .filter(c => c.status === 'signed' || c.status === 'completed')
      .reduce((sum, c) => sum + (c.contract_value || 0), 0)
  }

  return (
    <div className="contracts-dashboard">
      <div className="dashboard-header">
        <div>
          <h1>
            <FileText size={32} />
            Gestione Contratti e Firme Digitali
          </h1>
          <p>Sistema di firma digitale conforme eIDAS (EU)</p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
          <Plus size={20} />
          Nuovo Contratto
        </button>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#eff6ff', color: '#3b82f6' }}>
            <FileText size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Totale Contratti</div>
            <div className="stat-value">{stats.total}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#f1f5f9', color: '#64748b' }}>
            <Clock size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Bozze</div>
            <div className="stat-value">{stats.draft}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fef3c7', color: '#f59e0b' }}>
            <Send size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-label">In Attesa Firma</div>
            <div className="stat-value">{stats.sent}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#d1fae5', color: '#10b981' }}>
            <CheckCircle size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Firmati</div>
            <div className="stat-value">{stats.signed}</div>
          </div>
        </div>

        <div className="stat-card stat-card-highlight">
          <div className="stat-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
            <Euro size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Valore Contratti Firmati</div>
            <div className="stat-value">
              {new Intl.NumberFormat('it-IT', {
                style: 'currency',
                currency: 'EUR',
                minimumFractionDigits: 0
              }).format(stats.totalValue)}
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="contracts-filters">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Cerca contratti..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-tabs">
          <button
            className={filterStatus === 'all' ? 'active' : ''}
            onClick={() => setFilterStatus('all')}
          >
            Tutti ({contracts.length})
          </button>
          <button
            className={filterStatus === 'draft' ? 'active' : ''}
            onClick={() => setFilterStatus('draft')}
          >
            Bozze ({stats.draft})
          </button>
          <button
            className={filterStatus === 'sent' ? 'active' : ''}
            onClick={() => setFilterStatus('sent')}
          >
            In Attesa ({stats.sent})
          </button>
          <button
            className={filterStatus === 'signed' ? 'active' : ''}
            onClick={() => setFilterStatus('signed')}
          >
            Firmati ({stats.signed})
          </button>
        </div>
      </div>

      {/* Contracts List */}
      {loading ? (
        <div className="loading-state">
          <Loader className="spinner" size={48} />
          <p>Caricamento contratti...</p>
        </div>
      ) : filteredContracts.length === 0 ? (
        <div className="empty-state">
          <FileText size={64} color="#cbd5e1" />
          <h3>Nessun contratto trovato</h3>
          <p>Crea il tuo primo contratto dalla sezione CRM</p>
        </div>
      ) : (
        <div className="contracts-table">
          <table>
            <thead>
              <tr>
                <th>Numero</th>
                <th>Titolo</th>
                <th>Cliente</th>
                <th>Valore</th>
                <th>Stato</th>
                <th>Data Creazione</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {filteredContracts.map((contract) => {
                const statusInfo = getStatusInfo(contract.status)
                const StatusIcon = statusInfo.icon

                return (
                  <tr key={contract.id}>
                    <td>
                      <span className="contract-number">{contract.contract_number}</span>
                    </td>
                    <td>
                      <div className="contract-title">
                        <FileText size={16} />
                        {contract.title}
                      </div>
                    </td>
                    <td>
                      <div className="client-info">
                        <Building2 size={16} />
                        {contract.client_info.company}
                      </div>
                    </td>
                    <td>
                      {contract.contract_value ? (
                        <span className="contract-value">
                          {new Intl.NumberFormat('it-IT', {
                            style: 'currency',
                            currency: contract.currency
                          }).format(contract.contract_value)}
                        </span>
                      ) : (
                        <span className="no-value">N/D</span>
                      )}
                    </td>
                    <td>
                      <span
                        className="status-badge"
                        style={{ background: `${statusInfo.color}20`, color: statusInfo.color }}
                      >
                        <StatusIcon size={16} />
                        {statusInfo.label}
                      </span>
                    </td>
                    <td>
                      <div className="date-info">
                        <Calendar size={16} />
                        {new Date(contract.created_at).toLocaleDateString('it-IT')}
                      </div>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn-icon btn-view"
                          onClick={() => handleViewContract(contract)}
                          title="Visualizza dettagli"
                        >
                          <Eye size={18} />
                          <span>Visualizza</span>
                        </button>
                        {contract.status === 'draft' && (
                          <button
                            className="btn-icon btn-success"
                            onClick={() => handleSendContract(contract.id)}
                            title="Invia per firma"
                          >
                            <Send size={18} />
                            <span>Invia</span>
                          </button>
                        )}
                        {(contract.status === 'sent' || contract.status === 'viewed' || contract.status === 'expired') && (
                          <button
                            className="btn-icon btn-success"
                            onClick={() => handleSendContract(contract.id)}
                            title="Rinvia email firma"
                          >
                            <Send size={18} />
                            <span>Rinvia</span>
                          </button>
                        )}
                        {(contract.status === 'draft' || contract.status === 'rejected' || contract.status === 'cancelled') && (
                          <button
                            className="btn-icon btn-danger"
                            onClick={() => handleDeleteContract(contract.id)}
                            title="Elimina contratto"
                          >
                            <Trash2 size={18} />
                            <span>Elimina</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Contract Detail Modal */}
      {showModal && selectedContract && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <FileText size={24} />
                Dettagli Contratto
              </h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <XCircle size={24} />
              </button>
            </div>

            <div className="modal-body">
              {/* Contract Info */}
              <div className="info-section">
                <h3>Informazioni Contratto</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Numero</label>
                    <span>{selectedContract.contract_number}</span>
                  </div>
                  <div className="info-item">
                    <label>Titolo</label>
                    <span>{selectedContract.title}</span>
                  </div>
                  <div className="info-item">
                    <label>Tipo</label>
                    <span>{selectedContract.contract_type}</span>
                  </div>
                  <div className="info-item">
                    <label>Stato</label>
                    <span
                      className="status-badge"
                      style={{
                        background: `${getStatusInfo(selectedContract.status).color}20`,
                        color: getStatusInfo(selectedContract.status).color
                      }}
                    >
                      {React.createElement(getStatusInfo(selectedContract.status).icon, { size: 16 })}
                      {getStatusInfo(selectedContract.status).label}
                    </span>
                  </div>
                  {selectedContract.contract_value && (
                    <div className="info-item">
                      <label>Valore</label>
                      <span>
                        {new Intl.NumberFormat('it-IT', {
                          style: 'currency',
                          currency: selectedContract.currency
                        }).format(selectedContract.contract_value)}
                      </span>
                    </div>
                  )}
                  <div className="info-item">
                    <label>Data Creazione</label>
                    <span>{new Date(selectedContract.created_at).toLocaleString('it-IT')}</span>
                  </div>
                  {selectedContract.sent_at && (
                    <div className="info-item">
                      <label>Data Invio</label>
                      <span>{new Date(selectedContract.sent_at).toLocaleString('it-IT')}</span>
                    </div>
                  )}
                  {selectedContract.signed_at && (
                    <div className="info-item">
                      <label>Data Firma</label>
                      <span>{new Date(selectedContract.signed_at).toLocaleString('it-IT')}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Client Info */}
              <div className="info-section">
                <h3>
                  <Building2 size={20} />
                  Cliente
                </h3>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Azienda</label>
                    <span>{selectedContract.client_info.company}</span>
                  </div>
                  <div className="info-item">
                    <label>Nome Contatto</label>
                    <span>{selectedContract.client_info.name}</span>
                  </div>
                  <div className="info-item">
                    <label>Email</label>
                    <span>{selectedContract.client_info.email}</span>
                  </div>
                  {selectedContract.client_info.phone && (
                    <div className="info-item">
                      <label>Telefono</label>
                      <span>{selectedContract.client_info.phone}</span>
                    </div>
                  )}
                  {selectedContract.client_info.vat_number && (
                    <div className="info-item">
                      <label>P.IVA</label>
                      <span>{selectedContract.client_info.vat_number}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Signatures */}
              <div className="info-section">
                <h3>
                  <CheckCircle size={20} />
                  Firme ({signatures.length})
                </h3>
                {signatures.length === 0 ? (
                  <p className="no-signatures">Nessuna firma ancora richiesta</p>
                ) : (
                  <div className="signatures-list">
                    {signatures.map((sig) => (
                      <div key={sig.id} className="signature-item">
                        <div className="signature-info">
                          <User size={18} />
                          <div>
                            <div className="signature-name">{sig.signer_name}</div>
                            <div className="signature-email">{sig.signer_email}</div>
                          </div>
                        </div>
                        <span
                          className="signature-status"
                          style={{
                            background: sig.status === 'signed' ? '#d1fae5' : '#fef3c7',
                            color: sig.status === 'signed' ? '#059669' : '#f59e0b'
                          }}
                        >
                          {sig.status === 'signed' ? (
                            <>
                              <CheckCircle size={16} />
                              Firmato
                            </>
                          ) : (
                            <>
                              <Clock size={16} />
                              In attesa
                            </>
                          )}
                        </span>
                        {sig.signed_at && (
                          <div className="signature-date">
                            {new Date(sig.signed_at).toLocaleString('it-IT')}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Contract Content */}
              <div className="info-section">
                <h3>Contenuto Contratto</h3>
                <div className="contract-content-preview">
                  {selectedContract.content}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              {selectedContract.status === 'draft' && (
                <button
                  className="btn-primary"
                  onClick={() => {
                    handleSendContract(selectedContract.id)
                    setShowModal(false)
                  }}
                >
                  <Send size={20} />
                  Invia per Firma
                </button>
              )}
              <button className="btn-secondary" onClick={() => setShowModal(false)}>
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Contract Modal */}
      <CreateContractModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={loadContracts}
      />
    </div>
  )
}

export default ContractsDashboard
