import React, { useState, useEffect } from 'react'
import {
  Crown, Shield, UserPlus, UserMinus, AlertTriangle, CheckCircle,
  Mail, Calendar, Lock, Unlock, Eye, Search, Filter, X
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { supabase } from '../../lib/supabase'
import './FounderManagement.css'

interface Founder {
  id: string
  email: string
  full_name: string
  granted_at: Date
  granted_by: string
  is_active: boolean
  last_login: Date | null
}

interface AdminUser {
  id: string
  email: string
  role: string
}

const FounderManagement: React.FC = () => {
  const { user, isSuperAdmin } = useAuth()
  const { showSuccess, showError, showInfo } = useToast()
  const [loading, setLoading] = useState(false)
  const [founders, setFounders] = useState<Founder[]>([])
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedEmail, setSelectedEmail] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterActive, setFilterActive] = useState<boolean | null>(null)

  useEffect(() => {
    if (!isSuperAdmin) {
      showError('Accesso negato: Solo super amministratori possono gestire i Founders')
      return
    }
    loadFounders()
    loadAdminUsers()
  }, [isSuperAdmin])

  const loadFounders = async () => {
    try {
      setLoading(true)

      // Check if founder_users table exists, if not use metadata approach
      const { data, error } = await supabase
        .from('founder_users')
        .select(`
          id,
          user_id,
          granted_at,
          granted_by,
          is_active
        `)
        .order('granted_at', { ascending: false })

      if (error && error.code === '42P01') {
        // Table doesn't exist yet - show empty state
        console.warn('founder_users table not found, showing empty state')
        setFounders([])
        return
      }

      if (error) throw error

      // Enrich with user data from auth.users
      if (data) {
        const enrichedFounders = await Promise.all(
          data.map(async (f) => {
            const { data: userData } = await supabase.auth.admin.getUserById(f.user_id)
            return {
              id: f.user_id,
              email: userData?.user?.email || 'Unknown',
              full_name: userData?.user?.user_metadata?.full_name || 'N/A',
              granted_at: new Date(f.granted_at),
              granted_by: f.granted_by,
              is_active: f.is_active,
              last_login: userData?.user?.last_sign_in_at ? new Date(userData.user.last_sign_in_at) : null
            }
          })
        )
        setFounders(enrichedFounders)
      }
    } catch (err: any) {
      console.error('Error loading founders:', err)
      showError('Errore nel caricamento dei Founders: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const loadAdminUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('organization_users')
        .select('user_id, role')
        .eq('role', 'super_admin')

      if (error) throw error

      if (data) {
        const enrichedUsers = await Promise.all(
          data.map(async (u) => {
            const { data: userData } = await supabase.auth.admin.getUserById(u.user_id)
            return {
              id: u.user_id,
              email: userData?.user?.email || 'Unknown',
              role: u.role
            }
          })
        )
        setAdminUsers(enrichedUsers)
      }
    } catch (err: any) {
      console.error('Error loading admin users:', err)
    }
  }

  const grantFounderAccess = async () => {
    if (!selectedEmail) {
      showError('Seleziona un utente admin')
      return
    }

    try {
      setLoading(true)

      // Find user by email
      const selectedUser = adminUsers.find(u => u.email === selectedEmail)
      if (!selectedUser) {
        showError('Utente non trovato')
        return
      }

      // Insert into founder_users table
      const { error: insertError } = await supabase
        .from('founder_users')
        .insert({
          user_id: selectedUser.id,
          granted_by: user!.id,
          is_active: true
        })

      if (insertError) throw insertError

      // Update user metadata to include is_founder flag
      const { error: metadataError } = await supabase.auth.admin.updateUserById(
        selectedUser.id,
        {
          user_metadata: {
            is_founder: true,
            is_super_admin: true
          }
        }
      )

      if (metadataError) throw metadataError

      showSuccess(`Accesso Founder concesso a ${selectedEmail}`)
      setShowAddModal(false)
      setSelectedEmail('')
      loadFounders()
    } catch (err: any) {
      console.error('Error granting founder access:', err)
      showError('Errore: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const revokeFounderAccess = async (founderId: string, founderEmail: string) => {
    if (!window.confirm(`Sei sicuro di voler revocare l'accesso Founder a ${founderEmail}?`)) {
      return
    }

    try {
      setLoading(true)

      // Deactivate in founder_users table
      const { error: updateError } = await supabase
        .from('founder_users')
        .update({ is_active: false })
        .eq('user_id', founderId)

      if (updateError) throw updateError

      // Remove is_founder from user metadata
      const { error: metadataError } = await supabase.auth.admin.updateUserById(
        founderId,
        {
          user_metadata: {
            is_founder: false
          }
        }
      )

      if (metadataError) throw metadataError

      showSuccess(`Accesso Founder revocato per ${founderEmail}`)
      loadFounders()
    } catch (err: any) {
      console.error('Error revoking founder access:', err)
      showError('Errore: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const toggleFounderStatus = async (founderId: string, currentStatus: boolean) => {
    try {
      setLoading(true)

      const { error } = await supabase
        .from('founder_users')
        .update({ is_active: !currentStatus })
        .eq('user_id', founderId)

      if (error) throw error

      // Update metadata
      await supabase.auth.admin.updateUserById(
        founderId,
        {
          user_metadata: {
            is_founder: !currentStatus
          }
        }
      )

      showSuccess(`Founder ${!currentStatus ? 'attivato' : 'disattivato'}`)
      loadFounders()
    } catch (err: any) {
      console.error('Error toggling founder status:', err)
      showError('Errore: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const filteredFounders = founders.filter(f => {
    const matchesSearch = f.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.full_name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterActive === null || f.is_active === filterActive
    return matchesSearch && matchesFilter
  })

  if (!isSuperAdmin) {
    return (
      <div className="access-denied">
        <Shield size={64} className="denied-icon" />
        <h2>Accesso Negato</h2>
        <p>Questa sezione è accessibile solo ai super amministratori</p>
      </div>
    )
  }

  return (
    <div className="founder-management">
      {/* Header */}
      <div className="founder-header">
        <div>
          <h1 className="founder-title">
            <Crown size={28} className="crown-icon" />
            Founder Management
          </h1>
          <p className="founder-subtitle">
            Gestisci gli utenti Founder con accesso illimitato al sistema OmnilyPro
          </p>
        </div>
        <button className="btn-add-founder" onClick={() => setShowAddModal(true)}>
          <UserPlus size={20} />
          Aggiungi Founder
        </button>
      </div>

      {/* Stats Cards */}
      <div className="founder-stats">
        <div className="stat-card">
          <div className="stat-icon active">
            <Crown size={24} />
          </div>
          <div>
            <div className="stat-value">{founders.filter(f => f.is_active).length}</div>
            <div className="stat-label">Founders Attivi</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon inactive">
            <Lock size={24} />
          </div>
          <div>
            <div className="stat-value">{founders.filter(f => !f.is_active).length}</div>
            <div className="stat-label">Founders Disattivati</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon total">
            <Shield size={24} />
          </div>
          <div>
            <div className="stat-value">{founders.length}</div>
            <div className="stat-label">Totale Founders</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="founder-filters">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Cerca per email o nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-buttons">
          <button
            className={`filter-btn ${filterActive === null ? 'active' : ''}`}
            onClick={() => setFilterActive(null)}
          >
            Tutti
          </button>
          <button
            className={`filter-btn ${filterActive === true ? 'active' : ''}`}
            onClick={() => setFilterActive(true)}
          >
            <CheckCircle size={16} />
            Attivi
          </button>
          <button
            className={`filter-btn ${filterActive === false ? 'active' : ''}`}
            onClick={() => setFilterActive(false)}
          >
            <Lock size={16} />
            Disattivati
          </button>
        </div>
      </div>

      {/* Founders Table */}
      <div className="founders-table-container">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Caricamento Founders...</p>
          </div>
        ) : filteredFounders.length === 0 ? (
          <div className="empty-state">
            <Crown size={48} />
            <h3>Nessun Founder trovato</h3>
            <p>
              {searchTerm || filterActive !== null
                ? 'Prova a modificare i filtri di ricerca'
                : 'Aggiungi il primo Founder per concedere accesso illimitato al sistema'}
            </p>
          </div>
        ) : (
          <table className="founders-table">
            <thead>
              <tr>
                <th>Founder</th>
                <th>Email</th>
                <th>Concesso il</th>
                <th>Ultimo Login</th>
                <th>Stato</th>
                <th className="text-center">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {filteredFounders.map((founder) => (
                <tr key={founder.id}>
                  <td>
                    <div className="founder-info">
                      <div className={`founder-avatar ${founder.is_active ? 'active' : 'inactive'}`}>
                        <Crown size={18} />
                      </div>
                      <div>
                        <div className="founder-name">{founder.full_name}</div>
                        <div className="founder-id">ID: {founder.id.substring(0, 8)}...</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="email-cell">
                      <Mail size={16} />
                      {founder.email}
                    </div>
                  </td>
                  <td>
                    <div className="date-cell">
                      <Calendar size={16} />
                      {founder.granted_at.toLocaleDateString('it-IT')}
                    </div>
                  </td>
                  <td>
                    <div className="date-cell">
                      {founder.last_login ? (
                        <>
                          <Calendar size={16} />
                          {founder.last_login.toLocaleDateString('it-IT')}
                        </>
                      ) : (
                        <span className="text-muted">Mai</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge ${founder.is_active ? 'active' : 'inactive'}`}>
                      {founder.is_active ? (
                        <>
                          <CheckCircle size={14} />
                          Attivo
                        </>
                      ) : (
                        <>
                          <Lock size={14} />
                          Disattivato
                        </>
                      )}
                    </span>
                  </td>
                  <td className="text-center">
                    <div className="action-buttons">
                      <button
                        className={`action-btn ${founder.is_active ? 'warning' : 'success'}`}
                        onClick={() => toggleFounderStatus(founder.id, founder.is_active)}
                        title={founder.is_active ? 'Disattiva' : 'Attiva'}
                      >
                        {founder.is_active ? <Lock size={16} /> : <Unlock size={16} />}
                      </button>
                      <button
                        className="action-btn danger"
                        onClick={() => revokeFounderAccess(founder.id, founder.email)}
                        title="Revoca accesso"
                      >
                        <UserMinus size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Founder Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <UserPlus size={24} />
                Aggiungi Nuovo Founder
              </h3>
              <button className="btn-close" onClick={() => setShowAddModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="info-box warning">
                <AlertTriangle size={20} />
                <div>
                  <strong>Attenzione:</strong> I Founders hanno accesso illimitato a TUTTE le funzionalità
                  del sistema, incluse quelle di sicurezza critica. Concedi questo privilegio solo a persone
                  di massima fiducia.
                </div>
              </div>

              <div className="form-group">
                <label>Seleziona Super Admin</label>
                <select
                  value={selectedEmail}
                  onChange={(e) => setSelectedEmail(e.target.value)}
                  className="form-select"
                >
                  <option value="">-- Seleziona un utente --</option>
                  {adminUsers
                    .filter(u => !founders.some(f => f.email === u.email))
                    .map(u => (
                      <option key={u.id} value={u.email}>
                        {u.email}
                      </option>
                    ))}
                </select>
                <small className="form-hint">
                  Solo gli utenti con ruolo Super Admin possono diventare Founders
                </small>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowAddModal(false)}>
                Annulla
              </button>
              <button
                className="btn-primary"
                onClick={grantFounderAccess}
                disabled={!selectedEmail || loading}
              >
                {loading ? 'Elaborazione...' : 'Concedi Accesso Founder'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FounderManagement
