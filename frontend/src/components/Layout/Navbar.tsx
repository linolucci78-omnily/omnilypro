import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

const Navbar: React.FC = () => {
  const { user, signOut, loading } = useAuth()

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Errore logout:', error)
    }
  }

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <img src="https://sjvatdnvewohvswfrdiv.supabase.co/storage/v1/object/public/IMG/OMNILYPRO.png" alt="OMNILY PRO" style={{ height: '40px', border: '2px solid red' }} />
        </Link>
        <div className="navbar-menu">
          {user ? (
            <>
              <Link to="/dashboard" className="navbar-link">Dashboard</Link>
              <div className="navbar-user">
                <span className="user-email">{user.email}</span>
                <button onClick={handleSignOut} className="navbar-link navbar-logout">
                  Logout
                </button>
              </div>
            </>
          ) : (
            <>
              <Link to="/dashboard" className="navbar-link">Demo</Link>
              <Link to="/login" className="navbar-link navbar-login">
                {loading ? '🔄' : 'Login'}
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar