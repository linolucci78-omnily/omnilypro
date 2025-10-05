import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { canAccessRoute, type AdminRole } from '../../utils/adminPermissions'
import PageLoader from '../UI/PageLoader'

interface ProtectedRouteProps {
  children: React.ReactNode
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading, isSuperAdmin, userRole } = useAuth()
  const location = useLocation()

  console.log('🔐 ProtectedRoute Debug:', {
    user: !!user,
    loading,
    pathname: location.pathname,
    userRole,
    isSuperAdmin
  })

  if (loading) {
    return <PageLoader message="Autenticazione in corso..." size="large" />
  }

  if (!user) {
    // Controlla se era in modalità POS (da URL o localStorage)
    const isPOSMode = window.location.search.includes('posomnily=true') || localStorage.getItem('pos-mode') === 'true'
    if (isPOSMode) {
      console.log('🔐 Redirecting to POS login');
      localStorage.removeItem('pos-mode'); // Clean up
      return <Navigate to="/login?posomnily=true" state={{ from: location }} replace />
    }
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Controlla permessi per rotte admin
  if (location.pathname.startsWith('/admin')) {
    const hasAccess = canAccessRoute(userRole as AdminRole, location.pathname)

    if (!hasAccess) {
      console.log('🚫 Access denied to', location.pathname, 'for role', userRole)
      // Redirect alla rotta di default per il ruolo
      const { getAdminPermissions } = require('../../utils/adminPermissions')
      const permissions = getAdminPermissions(userRole as AdminRole)
      return <Navigate to={permissions.defaultRoute} replace />
    }
  }

  return <>{children}</>
}

export default ProtectedRoute