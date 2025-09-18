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
    // Mantieni parametro POS se presente
    const isPOSMode = window.location.search.includes('posomnily=true')
    const loginPath = isPOSMode ? '/login?posomnily=true' : '/login'
    return <Navigate to={loginPath} state={{ from: location }} replace />
  }

  return <>{children}</>
}

export default ProtectedRoute