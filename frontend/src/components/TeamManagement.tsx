import React, { useState, useEffect } from 'react'
import { staffApi, StaffMember, StaffAccessLog, StaffActivityLog } from '../lib/supabase'
import { UserPlus, Trash2, Edit2, Key, Clock, Activity, BarChart3, X, Search, Filter } from 'lucide-react'
import './TeamManagement.css'

interface TeamManagementProps {
  organizationId: string
  primaryColor: string
  secondaryColor: string
}

type TabType = 'team' | 'access' | 'audit' | 'stats'

const TeamManagement: React.FC<TeamManagementProps> = ({
  organizationId,
  primaryColor = '#dc2626',
  secondaryColor = '#ffffff'
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('team')
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([])
  const [accessLogs, setAccessLogs] = useState<StaffAccessLog[]>([])
  const [activityLogs, setActivityLogs] = useState<StaffActivityLog[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Modal state
  const [showStaffModal, setShowStaffModal] = useState(false)
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null)
  const [staffForm, setStaffForm] = useState({
    name: '',
    email: '',
    role: 'staff' as 'admin' | 'manager' | 'cashier' | 'staff',
    pin_code: ''
  })

  // Filters
  const [accessFilters, setAccessFilters] = useState({
    staffId: '',
    actionType: '',
    days: 7
  })
  const [auditFilters, setAuditFilters] = useState({
    staffId: '',
    action: '',
    days: 7
  })
  const [searchTerm, setSearchTerm] = useState('')

  // Load data based on active tab
  useEffect(() => {
    loadData()
  }, [activeTab, organizationId, accessFilters, auditFilters])

  const loadData = async () => {
    setLoading(true)
    setError(null)

    try {
      switch (activeTab) {
        case 'team':
          const members = await staffApi.getAll(organizationId)
          setStaffMembers(members)
          break

        case 'access':
          const startDate = new Date()
          startDate.setDate(startDate.getDate() - accessFilters.days)

          const logs = await staffApi.getAccessLogs(organizationId, {
            staffId: accessFilters.staffId || undefined,
            actionType: accessFilters.actionType as any || undefined,
            startDate,
            limit: 100
          })
          setAccessLogs(logs)
          break

        case 'audit':
          const auditStartDate = new Date()
          auditStartDate.setDate(auditStartDate.getDate() - auditFilters.days)

          const activities = await staffApi.getActivityLogs(organizationId, {
            staffId: auditFilters.staffId || undefined,
            action: auditFilters.action || undefined,
            startDate: auditStartDate,
            limit: 100
          })
          setActivityLogs(activities)
          break

        case 'stats':
          const statistics = await staffApi.getStats(organizationId)
          setStats(statistics)

          // Also load members for stats display
          const allMembers = await staffApi.getAll(organizationId)
          setStaffMembers(allMembers)
          break
      }
    } catch (err: any) {
      setError(err.message || 'Errore nel caricamento dei dati')
      console.error('Error loading data:', err)
    } finally {
      setLoading(false)
    }
  }

  const openStaffModal = (staff?: StaffMember) => {
    if (staff) {
      setEditingStaff(staff)
      setStaffForm({
        name: staff.name,
        email: staff.email || '',
        role: staff.role,
        pin_code: staff.pin_code
      })
    } else {
      setEditingStaff(null)
      setStaffForm({
        name: '',
        email: '',
        role: 'staff',
        pin_code: generatePin()
      })
    }
    setShowStaffModal(true)
  }

  const closeStaffModal = () => {
    setShowStaffModal(false)
    setEditingStaff(null)
    setStaffForm({
      name: '',
      email: '',
      role: 'staff',
      pin_code: ''
    })
  }

  const generatePin = (): string => {
    return Math.floor(1000 + Math.random() * 9000).toString()
  }

  const handleSaveStaff = async () => {
    try {
      if (!staffForm.name || !staffForm.pin_code) {
        alert('Nome e PIN sono obbligatori')
        return
      }

      if (staffForm.pin_code.length !== 4) {
        alert('Il PIN deve essere di 4 cifre')
        return
      }

      if (editingStaff) {
        // Update existing
        await staffApi.update(editingStaff.id, staffForm)
      } else {
        // Create new
        await staffApi.create({
          ...staffForm,
          organization_id: organizationId,
          is_active: true
        })
      }

      closeStaffModal()
      loadData()
    } catch (err: any) {
      alert(err.message || 'Errore nel salvataggio')
      console.error('Error saving staff:', err)
    }
  }

  const handleDeleteStaff = async (id: string, name: string) => {
    if (!confirm(`Sei sicuro di voler eliminare ${name}?`)) return

    try {
      await staffApi.delete(id)
      loadData()
    } catch (err: any) {
      alert(err.message || 'Errore nella eliminazione')
      console.error('Error deleting staff:', err)
    }
  }

  const toggleStaffActive = async (staff: StaffMember) => {
    try {
      await staffApi.update(staff.id, { is_active: !staff.is_active })
      loadData()
    } catch (err: any) {
      alert(err.message || 'Errore nell\'aggiornamento')
      console.error('Error toggling staff:', err)
    }
  }

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'admin': return 'role-badge-admin'
      case 'manager': return 'role-badge-manager'
      case 'cashier': return 'role-badge-cashier'
      default: return 'role-badge-staff'
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Amministratore'
      case 'manager': return 'Manager'
      case 'cashier': return 'Cassiere'
      default: return 'Staff'
    }
  }

  const getActionTypeLabel = (type: string) => {
    switch (type) {
      case 'login': return 'Login'
      case 'logout': return 'Logout'
      case 'pos_access': return 'Accesso POS'
      case 'desktop_access': return 'Accesso Desktop'
      default: return type
    }
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const filteredStaffMembers = staffMembers.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Render loading state
  if (loading && activeTab !== 'team') {
    return (
      <div className="team-management">
        <div className="team-loading">
          <div className="spinner"></div>
          <p>Caricamento...</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="team-management"
      style={{
        '--primary-color': primaryColor,
        '--secondary-color': secondaryColor
      } as React.CSSProperties}
    >
      {/* Header */}
      <div className="team-header">
        <div className="team-header-title">
          <UserPlus size={28} />
          <h1>Gestione Team</h1>
        </div>
        <p className="team-header-subtitle">
          Controlla accessi, monitora attività e gestisci il personale
        </p>
      </div>

      {/* Tabs */}
      <div className="team-tabs">
        <button
          className={`team-tab ${activeTab === 'team' ? 'active' : ''}`}
          onClick={() => setActiveTab('team')}
        >
          <UserPlus size={18} />
          <span>Team</span>
        </button>
        <button
          className={`team-tab ${activeTab === 'access' ? 'active' : ''}`}
          onClick={() => setActiveTab('access')}
        >
          <Clock size={18} />
          <span>Accessi</span>
        </button>
        <button
          className={`team-tab ${activeTab === 'audit' ? 'active' : ''}`}
          onClick={() => setActiveTab('audit')}
        >
          <Activity size={18} />
          <span>Audit</span>
        </button>
        <button
          className={`team-tab ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          <BarChart3 size={18} />
          <span>Statistiche</span>
        </button>
      </div>

      {/* Content */}
      <div className="team-content">
        {error && (
          <div className="team-error">
            <p>{error}</p>
          </div>
        )}

        {/* TAB 1: TEAM MEMBERS */}
        {activeTab === 'team' && (
          <div className="team-section">
            <div className="team-section-header">
              <div className="team-search">
                <Search size={18} />
                <input
                  type="text"
                  placeholder="Cerca per nome o email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button className="btn-add-staff" onClick={() => openStaffModal()}>
                <UserPlus size={18} />
                <span>Aggiungi Membro</span>
              </button>
            </div>

            <div className="staff-grid">
              {filteredStaffMembers.length === 0 ? (
                <div className="empty-state">
                  <UserPlus size={48} />
                  <p>Nessun membro del team</p>
                  <button className="btn-primary" onClick={() => openStaffModal()}>
                    Aggiungi il primo membro
                  </button>
                </div>
              ) : (
                filteredStaffMembers.map(member => (
                  <div
                    key={member.id}
                    className={`staff-card ${!member.is_active ? 'inactive' : ''}`}
                  >
                    <div className="staff-card-header">
                      <div className="staff-info">
                        <h3>{member.name}</h3>
                        <p className="staff-email">{member.email || 'Nessuna email'}</p>
                      </div>
                      <div className="staff-actions">
                        <button
                          className="btn-icon"
                          onClick={() => openStaffModal(member)}
                          title="Modifica"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          className="btn-icon btn-danger"
                          onClick={() => handleDeleteStaff(member.id, member.name)}
                          title="Elimina"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="staff-card-body">
                      <div className="staff-detail">
                        <span className={`role-badge ${getRoleBadgeClass(member.role)}`}>
                          {getRoleLabel(member.role)}
                        </span>
                      </div>

                      <div className="staff-detail">
                        <Key size={14} />
                        <span className="pin-code">PIN: {member.pin_code}</span>
                      </div>

                      {member.last_login && (
                        <div className="staff-detail">
                          <Clock size={14} />
                          <span className="last-login">
                            Ultimo accesso: {formatDateTime(member.last_login)}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="staff-card-footer">
                      <button
                        className={`btn-toggle ${member.is_active ? 'active' : 'inactive'}`}
                        onClick={() => toggleStaffActive(member)}
                      >
                        {member.is_active ? 'Attivo' : 'Disattivato'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 2: ACCESS LOGS */}
        {activeTab === 'access' && (
          <div className="team-section">
            <div className="team-section-header">
              <h2>Log Accessi</h2>
              <div className="filters">
                <select
                  value={accessFilters.staffId}
                  onChange={(e) => setAccessFilters({ ...accessFilters, staffId: e.target.value })}
                >
                  <option value="">Tutti i membri</option>
                  {staffMembers.map(member => (
                    <option key={member.id} value={member.id}>{member.name}</option>
                  ))}
                </select>

                <select
                  value={accessFilters.actionType}
                  onChange={(e) => setAccessFilters({ ...accessFilters, actionType: e.target.value })}
                >
                  <option value="">Tutte le azioni</option>
                  <option value="login">Login</option>
                  <option value="logout">Logout</option>
                  <option value="pos_access">Accesso POS</option>
                  <option value="desktop_access">Accesso Desktop</option>
                </select>

                <select
                  value={accessFilters.days}
                  onChange={(e) => setAccessFilters({ ...accessFilters, days: Number(e.target.value) })}
                >
                  <option value={7}>Ultimi 7 giorni</option>
                  <option value={30}>Ultimi 30 giorni</option>
                  <option value={90}>Ultimi 90 giorni</option>
                </select>
              </div>
            </div>

            <div className="logs-table-container">
              {accessLogs.length === 0 ? (
                <div className="empty-state">
                  <Clock size={48} />
                  <p>Nessun log di accesso</p>
                </div>
              ) : (
                <table className="logs-table">
                  <thead>
                    <tr>
                      <th>Data/Ora</th>
                      <th>Membro</th>
                      <th>Azione</th>
                      <th>Dispositivo</th>
                      <th>IP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accessLogs.map(log => (
                      <tr key={log.id}>
                        <td>{formatDateTime(log.created_at)}</td>
                        <td>
                          <strong>{(log as any).staff_member?.name || 'Sconosciuto'}</strong>
                        </td>
                        <td>
                          <span className={`action-badge action-${log.action_type}`}>
                            {getActionTypeLabel(log.action_type)}
                          </span>
                        </td>
                        <td>{log.device_info || '-'}</td>
                        <td className="ip-address">{log.ip_address || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: AUDIT TRAIL */}
        {activeTab === 'audit' && (
          <div className="team-section">
            <div className="team-section-header">
              <h2>Audit Trail</h2>
              <div className="filters">
                <select
                  value={auditFilters.staffId}
                  onChange={(e) => setAuditFilters({ ...auditFilters, staffId: e.target.value })}
                >
                  <option value="">Tutti i membri</option>
                  {staffMembers.map(member => (
                    <option key={member.id} value={member.id}>{member.name}</option>
                  ))}
                </select>

                <select
                  value={auditFilters.days}
                  onChange={(e) => setAuditFilters({ ...auditFilters, days: Number(e.target.value) })}
                >
                  <option value={7}>Ultimi 7 giorni</option>
                  <option value={30}>Ultimi 30 giorni</option>
                  <option value={90}>Ultimi 90 giorni</option>
                </select>
              </div>
            </div>

            <div className="logs-table-container">
              {activityLogs.length === 0 ? (
                <div className="empty-state">
                  <Activity size={48} />
                  <p>Nessuna attività registrata</p>
                </div>
              ) : (
                <table className="logs-table">
                  <thead>
                    <tr>
                      <th>Data/Ora</th>
                      <th>Membro</th>
                      <th>Azione</th>
                      <th>Tipo</th>
                      <th>Dettagli</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activityLogs.map(log => (
                      <tr key={log.id}>
                        <td>{formatDateTime(log.created_at)}</td>
                        <td>
                          <strong>{(log as any).staff_member?.name || 'Sconosciuto'}</strong>
                        </td>
                        <td>{log.action}</td>
                        <td>{log.entity_type || '-'}</td>
                        <td className="details-cell">
                          {log.details ? JSON.stringify(log.details).substring(0, 50) + '...' : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: STATISTICS */}
        {activeTab === 'stats' && stats && (
          <div className="team-section">
            <h2>Statistiche</h2>

            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">
                  <Clock size={24} />
                </div>
                <div className="stat-content">
                  <p className="stat-label">Totale Accessi</p>
                  <p className="stat-value">{stats.totalLogins}</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">
                  <Activity size={24} />
                </div>
                <div className="stat-content">
                  <p className="stat-label">Totale Azioni</p>
                  <p className="stat-value">{stats.totalActions}</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">
                  <UserPlus size={24} />
                </div>
                <div className="stat-content">
                  <p className="stat-label">Membri Attivi</p>
                  <p className="stat-value">
                    {staffMembers.filter(m => m.is_active).length}
                  </p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">
                  <BarChart3 size={24} />
                </div>
                <div className="stat-content">
                  <p className="stat-label">Ultimo Accesso</p>
                  <p className="stat-value-small">
                    {stats.lastLogin ? formatDateTime(stats.lastLogin) : 'Mai'}
                  </p>
                </div>
              </div>
            </div>

            {stats.mostActiveStaff && stats.mostActiveStaff.length > 0 && (
              <div className="most-active-section">
                <h3>Staff Più Attivo</h3>
                <div className="most-active-list">
                  {stats.mostActiveStaff.map((staff: any, index: number) => (
                    <div key={staff.staff_id} className="most-active-item">
                      <div className="rank">#{index + 1}</div>
                      <div className="staff-name">{staff.name}</div>
                      <div className="action-count">{staff.action_count} azioni</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL: ADD/EDIT STAFF */}
      {showStaffModal && (
        <div className="modal-overlay" onClick={closeStaffModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingStaff ? 'Modifica Membro' : 'Nuovo Membro'}</h2>
              <button className="modal-close" onClick={closeStaffModal}>
                <X size={24} />
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Nome *</label>
                <input
                  type="text"
                  value={staffForm.name}
                  onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                  placeholder="Nome completo"
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={staffForm.email}
                  onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                  placeholder="email@esempio.com"
                />
              </div>

              <div className="form-group">
                <label>Ruolo *</label>
                <select
                  value={staffForm.role}
                  onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value as any })}
                >
                  <option value="staff">Staff</option>
                  <option value="cashier">Cassiere</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Amministratore</option>
                </select>
              </div>

              <div className="form-group">
                <label>PIN (4 cifre) *</label>
                <div className="pin-input-group">
                  <input
                    type="text"
                    value={staffForm.pin_code}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').substring(0, 4)
                      setStaffForm({ ...staffForm, pin_code: value })
                    }}
                    placeholder="1234"
                    maxLength={4}
                  />
                  <button
                    type="button"
                    className="btn-generate-pin"
                    onClick={() => setStaffForm({ ...staffForm, pin_code: generatePin() })}
                  >
                    <Key size={16} />
                    Genera
                  </button>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={closeStaffModal}>
                Annulla
              </button>
              <button className="btn-primary" onClick={handleSaveStaff}>
                {editingStaff ? 'Salva Modifiche' : 'Crea Membro'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TeamManagement
