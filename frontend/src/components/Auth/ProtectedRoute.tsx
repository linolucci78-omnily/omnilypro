import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner">🔄</div>
        <p>Caricamento autenticazione...</p>
      </div>
    )
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

  return <>{children}</>
}

export default ProtectedRoute