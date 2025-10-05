/**
 * Admin Permissions System
 * Gestisce i permessi per i diversi ruoli admin di OMNILY PRO
 */

export type AdminRole = 'super_admin' | 'sales_agent' | 'account_manager'

export interface AdminPermissions {
  canViewDashboard: boolean
  canViewCRM: boolean
  canViewCustomers: boolean
  canViewAnalytics: boolean
  canViewSettings: boolean
  canManageUsers: boolean
  canManageOrganizations: boolean
  canViewAllSections: boolean
  defaultRoute: string
}

/**
 * Ottiene i permessi per un ruolo specifico
 */
export const getAdminPermissions = (role: AdminRole | null): AdminPermissions => {
  switch (role) {
    case 'super_admin':
      return {
        canViewDashboard: true,
        canViewCRM: true,
        canViewCustomers: true,
        canViewAnalytics: true,
        canViewSettings: true,
        canManageUsers: true,
        canManageOrganizations: true,
        canViewAllSections: true,
        defaultRoute: '/admin'
      }

    case 'sales_agent':
      return {
        canViewDashboard: false,
        canViewCRM: true,
        canViewCustomers: false,
        canViewAnalytics: false,
        canViewSettings: false,
        canManageUsers: false,
        canManageOrganizations: false,
        canViewAllSections: false,
        defaultRoute: '/admin/crm'
      }

    case 'account_manager':
      return {
        canViewDashboard: false,
        canViewCRM: true,
        canViewCustomers: true,
        canViewAnalytics: true,
        canViewSettings: false,
        canManageUsers: false,
        canManageOrganizations: false,
        canViewAllSections: false,
        defaultRoute: '/admin/customers'
      }

    default:
      return {
        canViewDashboard: false,
        canViewCRM: false,
        canViewCustomers: false,
        canViewAnalytics: false,
        canViewSettings: false,
        canManageUsers: false,
        canManageOrganizations: false,
        canViewAllSections: false,
        defaultRoute: '/admin'
      }
  }
}

/**
 * Verifica se un ruolo ha accesso a una specifica rotta
 */
export const canAccessRoute = (role: AdminRole | null, route: string): boolean => {
  const permissions = getAdminPermissions(role)

  // Super admin può accedere a tutto
  if (permissions.canViewAllSections) return true

  // Mappa delle rotte e permessi richiesti
  const routePermissions: { [key: string]: keyof AdminPermissions } = {
    '/admin': 'canViewDashboard',
    '/admin/dashboard': 'canViewDashboard',
    '/admin/crm': 'canViewCRM',
    '/admin/customers': 'canViewCustomers',
    '/admin/analytics': 'canViewAnalytics',
    '/admin/settings': 'canViewSettings',
    '/admin/users': 'canManageUsers',
    '/admin/organizations': 'canManageOrganizations'
  }

  // Trova la rotta corrispondente
  for (const [path, permission] of Object.entries(routePermissions)) {
    if (route.startsWith(path)) {
      return permissions[permission] as boolean
    }
  }

  return false
}
