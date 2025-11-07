import React, { useState, useEffect } from 'react'
import { permissionsApi, staffApi, staffMemberPermissionsApi, StaffMember, RolePermission, StaffMemberPermission } from '../lib/supabase'
import { Shield, Save, RotateCcw, Users, Eye, Lock, User, Layers, XCircle } from 'lucide-react'
import './PermissionsManagement.css'

interface PermissionsManagementProps {
  organizationId: string
  primaryColor: string
  secondaryColor: string
}

type PermissionMode = 'role' | 'individual'

const PermissionsManagement: React.FC<PermissionsManagementProps> = ({
  organizationId,
  primaryColor,
  secondaryColor
}) => {
  const [mode, setMode] = useState<PermissionMode>('role')
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([])

  // Role permissions state
  const [selectedRole, setSelectedRole] = useState<string>('admin')
  const [rolePermissions, setRolePermissions] = useState<RolePermission | null>(null)
  const [originalRolePermissions, setOriginalRolePermissions] = useState<RolePermission | null>(null)

  // Individual permissions state
  const [selectedStaffId, setSelectedStaffId] = useState<string>('')
  const [memberPermissions, setMemberPermissions] = useState<Partial<StaffMemberPermission> | null>(null)
  const [originalMemberPermissions, setOriginalMemberPermissions] = useState<Partial<StaffMemberPermission> | null>(null)
  const [roleBasePermissions, setRoleBasePermissions] = useState<RolePermission | null>(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    loadData()
  }, [organizationId])

  useEffect(() => {
    if (mode === 'role' && selectedRole) {
      loadRolePermissions(selectedRole)
    }
  }, [mode, selectedRole, organizationId])

  useEffect(() => {
    if (mode === 'individual' && selectedStaffId) {
      loadMemberPermissions(selectedStaffId)
    }
  }, [mode, selectedStaffId, organizationId])

  const loadData = async () => {
    setLoading(true)
    try {
      const members = await staffApi.getAll(organizationId)
      setStaffMembers(members)

      // Auto-select first member for individual mode
      if (members.length > 0 && mode === 'individual' && !selectedStaffId) {
        setSelectedStaffId(members[0].id)
      }
    } catch (err) {
      console.error('Error loading staff:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadRolePermissions = async (role: string) => {
    setLoading(true)
    try {
      const perms = await permissionsApi.getByRole(organizationId, role)
      setRolePermissions(perms)
      setOriginalRolePermissions(perms)
      setHasChanges(false)
    } catch (err) {
      console.error('Error loading role permissions:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadMemberPermissions = async (staffId: string) => {
    setLoading(true)
    try {
      // Load member's role base permissions
      const member = staffMembers.find(m => m.id === staffId)
      if (member) {
        const rolePerms = await permissionsApi.getByRole(organizationId, member.role)
        setRoleBasePermissions(rolePerms)
      }

      // Load member's custom permissions (overrides)
      const memberPerms = await staffMemberPermissionsApi.get(organizationId, staffId)
      setMemberPermissions(memberPerms || {})
      setOriginalMemberPermissions(memberPerms || {})
      setHasChanges(false)
    } catch (err) {
      console.error('Error loading member permissions:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleRoleToggle = (permission: keyof RolePermission) => {
    if (!rolePermissions) return

    const newPermissions = {
      ...rolePermissions,
      [permission]: !rolePermissions[permission]
    }

    setRolePermissions(newPermissions as RolePermission)
    setHasChanges(true)
  }

  const handleMemberToggle = (permission: keyof StaffMemberPermission) => {
    if (!roleBasePermissions) return

    const currentValue = memberPermissions?.[permission]
    const roleValue = roleBasePermissions[permission as keyof RolePermission]

    // Cycle: null (use role) -> true -> false -> null
    let newValue: boolean | null

    if (currentValue === null || currentValue === undefined) {
      // Currently using role default, set to opposite
      newValue = !roleValue
    } else if (currentValue === roleValue) {
      // Same as role, set to opposite
      newValue = !roleValue
    } else {
      // Different from role, reset to null (use role)
      newValue = null
    }

    const newPermissions = {
      ...memberPermissions,
      [permission]: newValue
    }

    setMemberPermissions(newPermissions)
    setHasChanges(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      if (mode === 'role' && rolePermissions) {
        await permissionsApi.update(organizationId, selectedRole, rolePermissions)
        setOriginalRolePermissions(rolePermissions)
      } else if (mode === 'individual' && selectedStaffId && memberPermissions) {
        await staffMemberPermissionsApi.upsert(organizationId, selectedStaffId, memberPermissions)
        setOriginalMemberPermissions(memberPermissions)
      }

      setHasChanges(false)
      alert('Permessi salvati con successo!')
    } catch (err: any) {
      alert('Errore nel salvataggio: ' + err.message)
      console.error('Error saving permissions:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    if (mode === 'role' && originalRolePermissions) {
      setRolePermissions(originalRolePermissions)
    } else if (mode === 'individual' && originalMemberPermissions !== undefined) {
      setMemberPermissions(originalMemberPermissions)
    }
    setHasChanges(false)
  }

  const handleClearOverrides = async () => {
    if (!selectedStaffId) return
    if (!confirm('Vuoi rimuovere tutti i permessi personalizzati e usare quelli del ruolo?')) return

    try {
      await staffMemberPermissionsApi.clearOverrides(organizationId, selectedStaffId)
      setMemberPermissions({})
      setOriginalMemberPermissions({})
      setHasChanges(false)
      alert('Override rimossi! Ora usa i permessi del ruolo.')
    } catch (err: any) {
      alert('Errore: ' + err.message)
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Amministratore'
      case 'manager': return 'Manager'
      case 'cashier': return 'Cassiere'
      case 'staff': return 'Staff'
      default: return role
    }
  }

  const getRoleCount = (role: string) => {
    return staffMembers.filter(m => m.role === role).length
  }

  const getEffectiveValue = (permission: keyof StaffMemberPermission): boolean => {
    const customValue = memberPermissions?.[permission]
    if (customValue !== null && customValue !== undefined) {
      return customValue
    }
    return roleBasePermissions?.[permission as keyof RolePermission] as boolean || false
  }

  const isOverridden = (permission: keyof StaffMemberPermission): boolean => {
    const customValue = memberPermissions?.[permission]
    return customValue !== null && customValue !== undefined
  }

  const permissionGroups = [
    {
      title: 'Analytics e Dashboard',
      icon: Eye,
      permissions: [
        { key: 'can_view_analytics', label: 'Visualizza Analytics' },
        { key: 'can_view_reports', label: 'Visualizza Report' },
        { key: 'can_export_data', label: 'Esporta Dati' }
      ]
    },
    {
      title: 'Gestione Clienti',
      icon: Users,
      permissions: [
        { key: 'can_view_customers', label: 'Visualizza Clienti' },
        { key: 'can_add_customers', label: 'Aggiungi Clienti' },
        { key: 'can_edit_customers', label: 'Modifica Clienti' },
        { key: 'can_delete_customers', label: 'Elimina Clienti' }
      ]
    },
    {
      title: 'Premi e Reward',
      icon: 'gift',
      permissions: [
        { key: 'can_view_rewards', label: 'Visualizza Premi' },
        { key: 'can_create_rewards', label: 'Crea Premi' },
        { key: 'can_edit_rewards', label: 'Modifica Premi' },
        { key: 'can_delete_rewards', label: 'Elimina Premi' }
      ]
    },
    {
      title: 'Tier e Livelli',
      icon: 'layers',
      permissions: [
        { key: 'can_view_tiers', label: 'Visualizza Tier' },
        { key: 'can_edit_tiers', label: 'Modifica Tier' }
      ]
    },
    {
      title: 'Transazioni e Punti',
      icon: 'activity',
      permissions: [
        { key: 'can_view_transactions', label: 'Visualizza Transazioni' },
        { key: 'can_add_points', label: 'Aggiungi Punti' },
        { key: 'can_redeem_rewards', label: 'Riscatta Premi' },
        { key: 'can_refund', label: 'Rimborsi' }
      ]
    },
    {
      title: 'Marketing e Campagne',
      icon: 'megaphone',
      permissions: [
        { key: 'can_view_marketing', label: 'Visualizza Marketing' },
        { key: 'can_send_campaigns', label: 'Invia Campagne' }
      ]
    },
    {
      title: 'Gestione Team',
      icon: Shield,
      permissions: [
        { key: 'can_view_team', label: 'Visualizza Team' },
        { key: 'can_manage_team', label: 'Gestisci Team' }
      ]
    },
    {
      title: 'Impostazioni',
      icon: 'settings',
      permissions: [
        { key: 'can_view_settings', label: 'Visualizza Impostazioni' },
        { key: 'can_edit_settings', label: 'Modifica Impostazioni' }
      ]
    },
    {
      title: 'Branding',
      icon: 'palette',
      permissions: [
        { key: 'can_view_branding', label: 'Visualizza Branding' },
        { key: 'can_edit_branding', label: 'Modifica Branding' }
      ]
    },
    {
      title: 'Accesso POS',
      icon: 'tablet',
      permissions: [
        { key: 'can_access_pos', label: 'Accesso POS' },
        { key: 'can_process_sales', label: 'Processa Vendite' },
        { key: 'can_void_transactions', label: 'Annulla Transazioni' }
      ]
    }
  ]

  return (
    <div
      className="permissions-management"
      style={{
        '--primary-color': primaryColor,
        '--secondary-color': secondaryColor
      } as React.CSSProperties}
    >
      {/* Header */}
      <div className="permissions-header">
        <div className="permissions-header-title">
          <Shield size={28} />
          <div>
            <h1>Gestione Permessi</h1>
            <p>Configura i permessi di accesso per ruoli o membri individuali</p>
          </div>
        </div>

        {hasChanges && (
          <div className="permissions-actions">
            <button className="btn-reset" onClick={handleReset} disabled={saving}>
              <RotateCcw size={18} />
              <span>Annulla</span>
            </button>
            <button className="btn-save" onClick={handleSave} disabled={saving}>
              <Save size={18} />
              <span>{saving ? 'Salvataggio...' : 'Salva Modifiche'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Mode Tabs */}
      <div className="permissions-mode-tabs">
        <button
          className={`mode-tab ${mode === 'role' ? 'active' : ''}`}
          onClick={() => setMode('role')}
        >
          <Layers size={18} />
          <span>Permessi per Ruolo</span>
        </button>
        <button
          className={`mode-tab ${mode === 'individual' ? 'active' : ''}`}
          onClick={() => setMode('individual')}
        >
          <User size={18} />
          <span>Permessi Individuali</span>
        </button>
      </div>

      <div className="permissions-content">
        {/* Sidebar */}
        <div className="permissions-sidebar">
          {mode === 'role' ? (
            <>
              <h3>Seleziona Ruolo</h3>
              <div className="role-list">
                {['admin', 'manager', 'cashier', 'staff'].map(role => (
                  <div
                    key={role}
                    className={`role-item ${selectedRole === role ? 'active' : ''}`}
                    onClick={() => setSelectedRole(role)}
                  >
                    <div className="role-item-info">
                      <span className="role-name">{getRoleLabel(role)}</span>
                      <span className="role-count">{getRoleCount(role)} membri</span>
                    </div>
                    <div className={`role-badge role-badge-${role}`}>
                      {role.substring(0, 1).toUpperCase()}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <h3>Seleziona Membro</h3>
              <div className="member-list">
                {staffMembers.map(member => (
                  <div
                    key={member.id}
                    className={`member-item ${selectedStaffId === member.id ? 'active' : ''}`}
                    onClick={() => setSelectedStaffId(member.id)}
                  >
                    <div className="member-item-info">
                      <span className="member-name">{member.name}</span>
                      <span className="member-role">{getRoleLabel(member.role)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Main - Permissions Toggles */}
        <div className="permissions-main">
          {loading ? (
            <div className="permissions-loading">
              <div className="spinner"></div>
              <p>Caricamento permessi...</p>
            </div>
          ) : mode === 'role' && rolePermissions ? (
            <>
              <div className="permissions-role-info">
                <h2>Permessi per: {getRoleLabel(selectedRole)}</h2>
                <p>Attiva o disattiva i permessi per questo ruolo utilizzando i toggle</p>
              </div>

              <div className="permissions-groups">
                {permissionGroups.map((group, idx) => (
                  <div key={idx} className="permission-group">
                    <div className="permission-group-header">
                      {typeof group.icon === 'string' ? (
                        <span className="permission-group-icon">{group.icon}</span>
                      ) : (
                        <group.icon size={20} />
                      )}
                      <h3>{group.title}</h3>
                    </div>

                    <div className="permission-items">
                      {group.permissions.map(perm => (
                        <div key={perm.key} className="permission-item">
                          <div className="permission-label">
                            <span>{perm.label}</span>
                          </div>
                          <label className="toggle">
                            <input
                              type="checkbox"
                              checked={rolePermissions[perm.key as keyof RolePermission] as boolean}
                              onChange={() => handleRoleToggle(perm.key as keyof RolePermission)}
                            />
                            <span className="toggle-slider"></span>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : mode === 'individual' && selectedStaffId ? (
            <>
              <div className="permissions-role-info">
                <h2>Permessi per: {staffMembers.find(m => m.id === selectedStaffId)?.name}</h2>
                <p>
                  <strong>Ruolo base:</strong> {getRoleLabel(staffMembers.find(m => m.id === selectedStaffId)?.role || '')}
                  {' • '}
                  Clicca sul toggle per fare override (sfondo arancione = personalizzato)
                </p>
                {Object.values(memberPermissions || {}).some(v => v !== null && v !== undefined) && (
                  <button className="btn-clear-overrides" onClick={handleClearOverrides}>
                    <XCircle size={16} />
                    <span>Rimuovi Override (usa ruolo)</span>
                  </button>
                )}
              </div>

              <div className="permissions-groups">
                {permissionGroups.map((group, idx) => (
                  <div key={idx} className="permission-group">
                    <div className="permission-group-header">
                      {typeof group.icon === 'string' ? (
                        <span className="permission-group-icon">{group.icon}</span>
                      ) : (
                        <group.icon size={20} />
                      )}
                      <h3>{group.title}</h3>
                    </div>

                    <div className="permission-items">
                      {group.permissions.map(perm => (
                        <div
                          key={perm.key}
                          className={`permission-item ${isOverridden(perm.key as keyof StaffMemberPermission) ? 'overridden' : ''}`}
                        >
                          <div className="permission-label">
                            <span>{perm.label}</span>
                            {isOverridden(perm.key as keyof StaffMemberPermission) && (
                              <span className="override-badge">Personalizzato</span>
                            )}
                          </div>
                          <label className="toggle">
                            <input
                              type="checkbox"
                              checked={getEffectiveValue(perm.key as keyof StaffMemberPermission)}
                              onChange={() => handleMemberToggle(perm.key as keyof StaffMemberPermission)}
                            />
                            <span className="toggle-slider"></span>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="permissions-empty">
              <Lock size={48} />
              <p>Seleziona un {mode === 'role' ? 'ruolo' : 'membro'} per gestire i permessi</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PermissionsManagement
