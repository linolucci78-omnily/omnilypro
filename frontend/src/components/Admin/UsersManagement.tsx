import React, { useState, useEffect } from 'react'
import {
  Users,
  Plus,
  Search,
  Filter,
  Shield,
  UserCheck,
  UserX,
  Edit2,
  Trash2,
  Mail,
  Calendar,
  Activity,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { usersService } from '../../services/usersService'
import type { SystemUser, UserRole } from '../../services/usersService'
import PageLoader from '../UI/PageLoader'
import CreateUserModal from './CreateUserModal'
import EditUserRoleModal from './EditUserRoleModal'
import ConfirmModal from '../UI/ConfirmModal'
import './UsersManagement.css'

const UsersManagement: React.FC = () => {
  console.log('🎯 UsersManagement component mounted')

  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<SystemUser[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRole, setSelectedRole] = useState<string>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    by_role: {} as { [key: string]: number }
  })

  // Modal states
  const [showEditRoleModal, setShowEditRoleModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<SystemUser | null>(null)
  const [showConfirmActivate, setShowConfirmActivate] = useState(false)
  const [showConfirmSuspend, setShowConfirmSuspend] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [showErrorMessage, setShowErrorMessage] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    console.log('🔄 useEffect triggered - loading data...')
    loadData()
  }, [selectedRole, searchTerm])

  const loadData = async () => {
    try {
      setLoading(true)

      const [usersData, statsData] = await Promise.all([
        usersService.getUsers({
          role: selectedRole !== 'all' ? selectedRole as UserRole : undefined,
          search: searchTerm
        }),
        usersService.getUserStats()
      ])

      setUsers(usersData)
      setStats(statsData)
      console.log('📊 Users loaded:', usersData.length, usersData)
    } catch (error) {
      console.error('Error loading users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleActivateUser = async () => {
    if (!selectedUser) return

    try {
      // @ts-ignore - temp_password exists in database but not in type
      const tempPassword = selectedUser.temp_password

      if (!tempPassword) {
        setErrorMessage('Password temporanea non trovata. Ricrea l\'utente.')
        setShowErrorMessage(true)
        return
      }

      await usersService.activateUser(selectedUser.id, selectedUser.email, tempPassword)

      setSuccessMessage(`Account attivato con successo! ${selectedUser.email} può ora accedere al sistema.`)
      setShowSuccessMessage(true)

      // Reload data
      await loadData()
    } catch (error: any) {
      console.error('Error activating user:', error)
      setErrorMessage(error.message || 'Errore durante l\'attivazione dell\'account')
      setShowErrorMessage(true)
    }
  }

  const handleEditUserRole = async (newRole: UserRole) => {
    if (!selectedUser) return

    try {
      await usersService.updateUser(selectedUser.id, { role: newRole })
      setSuccessMessage(`Ruolo aggiornato con successo a: ${getRoleLabel(newRole)}`)
      setShowSuccessMessage(true)
      await loadData()
    } catch (error: any) {
      console.error('Error updating user:', error)
      setErrorMessage(error.message || 'Errore durante l\'aggiornamento del ruolo')
      setShowErrorMessage(true)
    }
  }

  const handleSuspendUser = async () => {
    if (!selectedUser) return

    try {
      await usersService.suspendUser(selectedUser.id)
      setSuccessMessage(`Utente ${selectedUser.email} sospeso con successo`)
      setShowSuccessMessage(true)
      await loadData()
    } catch (error: any) {
      console.error('Error suspending user:', error)
      setErrorMessage(error.message || 'Errore durante la sospensione dell\'utente')
      setShowErrorMessage(true)
    }
  }

  const getRoleLabel = (role: UserRole) => {
    const labels: { [key: string]: string } = {
      'super_admin': 'Super Admin',
      'sales_agent': 'Agente Vendite',
      'account_manager': 'Account Manager',
      'organization_owner': 'Proprietario Org',
      'organization_staff': 'Staff Org'
    }
    return labels[role] || role
  }

  const getRoleColor = (role: UserRole) => {
    const colors: { [key: string]: string } = {
      'super_admin': '#dc2626',
      'sales_agent': '#3b82f6',
      'account_manager': '#8b5cf6',
      'organization_owner': '#059669',
      'organization_staff': '#64748b'
    }
    return colors[role] || '#64748b'
  }

  if (loading) {
    return <PageLoader />
  }

  return (
    <div className="users-management">
      {/* Header */}
      <div className="users-header">
        <div>
          <h1 className="users-title">
            <Users size={32} />
            Gestione Utenti
          </h1>
          <p className="users-subtitle">
            Gestisci account, ruoli e permessi del sistema
          </p>
        </div>

        <button
          className="btn-add-user"
          onClick={() => setShowCreateModal(true)}
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
          Nuovo Utente
        </button>
      </div>

      {/* Stats Cards */}
      <div className="users-stats-grid">
        <div className="user-stat-card">
          <div className="stat-icon" style={{ background: '#dbeafe', color: '#3b82f6' }}>
            <Users size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Utenti Totali</div>
          </div>
        </div>

        <div className="user-stat-card">
          <div className="stat-icon" style={{ background: '#d1fae5', color: '#10b981' }}>
            <UserCheck size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.active}</div>
            <div className="stat-label">Utenti Attivi</div>
          </div>
        </div>

        <div className="user-stat-card">
          <div className="stat-icon" style={{ background: '#dbeafe', color: '#3b82f6' }}>
            <Shield size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.by_role['sales_agent'] || 0}</div>
            <div className="stat-label">Agenti Vendite</div>
          </div>
        </div>

        <div className="user-stat-card">
          <div className="stat-icon" style={{ background: '#fee2e2', color: '#dc2626' }}>
            <Shield size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.by_role['super_admin'] || 0}</div>
            <div className="stat-label">Super Admin</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="users-filters">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Cerca per email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          className="role-filter"
        >
          <option value="all">Tutti i Ruoli</option>
          <option value="super_admin">Super Admin</option>
          <option value="sales_agent">Agente Vendite</option>
          <option value="account_manager">Account Manager</option>
          <option value="organization_owner">Proprietario Org</option>
          <option value="organization_staff">Staff Org</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="users-table-card">
        <table className="users-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Ruolo</th>
              <th>Stato</th>
              <th>Creato</th>
              <th>Ultimo Accesso</th>
              <th>Azioni</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>
                  <div className="user-email-cell">
                    <Mail size={16} />
                    {user.email}
                  </div>
                </td>
                <td>
                  <span
                    className="role-badge"
                    style={{
                      background: `${getRoleColor(user.role)}20`,
                      color: getRoleColor(user.role)
                    }}
                  >
                    {getRoleLabel(user.role)}
                  </span>
                </td>
                <td>
                  {user.is_active ? (
                    <span className="status-badge active">
                      <UserCheck size={14} />
                      Attivo
                    </span>
                  ) : (
                    <span className="status-badge inactive">
                      <UserX size={14} />
                      Inattivo
                    </span>
                  )}
                </td>
                <td>
                  <div className="date-cell">
                    <Calendar size={14} />
                    {new Date(user.created_at).toLocaleDateString('it-IT')}
                  </div>
                </td>
                <td>
                  {user.last_sign_in_at ? (
                    <div className="date-cell">
                      <Activity size={14} />
                      {new Date(user.last_sign_in_at).toLocaleDateString('it-IT')}
                    </div>
                  ) : (
                    <span className="no-data">Mai</span>
                  )}
                </td>
                <td>
                  <div className="action-buttons">
                    {!user.is_active ? (
                      <button
                        className="action-btn activate"
                        title="Attiva Account"
                        onClick={() => {
                          setSelectedUser(user)
                          setShowConfirmActivate(true)
                        }}
                      >
                        <UserCheck size={16} />
                        Attiva
                      </button>
                    ) : (
                      <>
                        <button
                          className="action-btn edit"
                          title="Modifica Ruolo"
                          onClick={() => {
                            setSelectedUser(user)
                            setShowEditRoleModal(true)
                          }}
                        >
                          <Edit2 size={16} />
                          Modifica
                        </button>
                        <button
                          className="action-btn delete"
                          title="Sospendi Utente"
                          onClick={() => {
                            setSelectedUser(user)
                            setShowConfirmSuspend(true)
                          }}
                        >
                          <Trash2 size={16} />
                          Sospendi
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && (
          <div className="empty-state">
            <AlertCircle size={48} />
            <h3>Nessun utente trovato</h3>
            <p>Prova a modificare i filtri di ricerca</p>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      <CreateUserModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={loadData}
      />

      {/* Edit Role Modal */}
      {selectedUser && (
        <EditUserRoleModal
          isOpen={showEditRoleModal}
          onClose={() => {
            setShowEditRoleModal(false)
            setSelectedUser(null)
          }}
          onSave={handleEditUserRole}
          currentEmail={selectedUser.email}
          currentRole={selectedUser.role}
        />
      )}

      {/* Confirm Activate Modal */}
      <ConfirmModal
        isOpen={showConfirmActivate}
        title="Attiva Account"
        message={`Sei sicuro di voler attivare l'account per ${selectedUser?.email}?\n\nVerrà creato l'account Supabase Auth e l'utente potrà fare login con le credenziali impostate.`}
        confirmText="Attiva Account"
        cancelText="Annulla"
        type="info"
        onConfirm={handleActivateUser}
        onCancel={() => {
          setShowConfirmActivate(false)
          setSelectedUser(null)
        }}
      />

      {/* Confirm Suspend Modal */}
      <ConfirmModal
        isOpen={showConfirmSuspend}
        title="Sospendi Utente"
        message={`Sei sicuro di voler sospendere ${selectedUser?.email}?\n\nL'utente non potrà più accedere al sistema.`}
        confirmText="Sospendi"
        cancelText="Annulla"
        type="danger"
        onConfirm={handleSuspendUser}
        onCancel={() => {
          setShowConfirmSuspend(false)
          setSelectedUser(null)
        }}
      />

      {/* Success Message Modal */}
      <ConfirmModal
        isOpen={showSuccessMessage}
        title="Operazione Completata"
        message={successMessage}
        confirmText="OK"
        cancelText=""
        type="info"
        onConfirm={() => {
          setShowSuccessMessage(false)
          setSuccessMessage('')
          setSelectedUser(null)
        }}
        onCancel={() => {
          setShowSuccessMessage(false)
          setSuccessMessage('')
          setSelectedUser(null)
        }}
      />

      {/* Error Message Modal */}
      <ConfirmModal
        isOpen={showErrorMessage}
        title="Errore"
        message={errorMessage}
        confirmText="OK"
        cancelText=""
        type="danger"
        onConfirm={() => {
          setShowErrorMessage(false)
          setErrorMessage('')
          setSelectedUser(null)
        }}
        onCancel={() => {
          setShowErrorMessage(false)
          setErrorMessage('')
          setSelectedUser(null)
        }}
      />
    </div>
  )
}

export default UsersManagement
