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
  AlertCircle
} from 'lucide-react'
import { usersService } from '../../services/usersService'
import type { SystemUser, UserRole } from '../../services/usersService'
import PageLoader from '../UI/PageLoader'
import CreateUserModal from './CreateUserModal'
import './UsersManagement.css'

const UsersManagement: React.FC = () => {
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

  useEffect(() => {
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
    } catch (error) {
      console.error('Error loading users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleActivateUser = async (user: SystemUser) => {
    if (!confirm(`Sei sicuro di voler attivare l'account per ${user.email}?\n\nVerrà creato l'account Supabase Auth e l'utente potrà fare login.`)) {
      return
    }

    try {
      // @ts-ignore - temp_password exists in database but not in type
      const tempPassword = user.temp_password

      if (!tempPassword) {
        alert('Errore: Password temporanea non trovata. Ricrea l\'utente.')
        return
      }

      await usersService.activateUser(user.id, user.email, tempPassword)

      alert(`✅ Account attivato!\n\nEmail: ${user.email}\n\nL'utente può ora fare login con le credenziali impostate.`)

      // Reload data
      await loadData()
    } catch (error: any) {
      console.error('Error activating user:', error)
      alert(`❌ Errore durante l'attivazione: ${error.message}`)
    }
  }

  const handleEditUser = async (user: SystemUser) => {
    const newRole = prompt(
      `Modifica ruolo per ${user.email}\n\nRuolo attuale: ${getRoleLabel(user.role)}\n\nInserisci nuovo ruolo:\n- super_admin\n- sales_agent\n- account_manager\n- organization_owner\n- organization_staff`,
      user.role
    )

    if (!newRole || newRole === user.role) {
      return
    }

    const validRoles = ['super_admin', 'sales_agent', 'account_manager', 'organization_owner', 'organization_staff']
    if (!validRoles.includes(newRole)) {
      alert('❌ Ruolo non valido!')
      return
    }

    try {
      await usersService.updateUser(user.id, { role: newRole as UserRole })
      alert(`✅ Ruolo aggiornato a: ${getRoleLabel(newRole as UserRole)}`)
      await loadData()
    } catch (error: any) {
      console.error('Error updating user:', error)
      alert(`❌ Errore durante l'aggiornamento: ${error.message}`)
    }
  }

  const handleSuspendUser = async (user: SystemUser) => {
    if (!confirm(`Sei sicuro di voler sospendere ${user.email}?\n\nL'utente non potrà più accedere al sistema.`)) {
      return
    }

    try {
      await usersService.suspendUser(user.id)
      alert(`✅ Utente sospeso: ${user.email}`)
      await loadData()
    } catch (error: any) {
      console.error('Error suspending user:', error)
      alert(`❌ Errore durante la sospensione: ${error.message}`)
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
                        onClick={() => handleActivateUser(user)}
                      >
                        <UserCheck size={16} />
                      </button>
                    ) : (
                      <>
                        <button
                          className="action-btn"
                          title="Modifica"
                          onClick={() => handleEditUser(user)}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          className="action-btn delete"
                          title="Sospendi"
                          onClick={() => handleSuspendUser(user)}
                        >
                          <Trash2 size={16} />
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
    </div>
  )
}

export default UsersManagement
