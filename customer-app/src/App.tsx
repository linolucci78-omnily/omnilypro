import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { OrganizationProvider } from './contexts/OrganizationContext'
import { AuthProvider } from './contexts/AuthContext'
import Login from './pages/Login'
import Register from './pages/Register'
import Activate from './pages/Activate'
import Home from './pages/Home'
import Card from './pages/Card'
import Rewards from './pages/Rewards'
import Profile from './pages/Profile'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './styles/global.css'

// Root redirect component - redirects to saved org slug or default
function RootRedirect() {
  const navigate = useNavigate()

  useEffect(() => {
    // Check if we have a saved organization slug
    const savedSlug = localStorage.getItem('omnily_org_slug')

    if (savedSlug) {
      console.log('🔄 PWA: Redirecting to saved organization:', savedSlug)
      navigate(`/${savedSlug}/home`, { replace: true })
    } else {
      // Default to 'omnilypro' organization if no saved slug
      console.log('🔄 PWA: Redirecting to default organization: omnilypro')
      navigate('/omnilypro/home', { replace: true })
    }
  }, [navigate])

  // Show loading while redirecting
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #f3f4f6',
          borderTopColor: '#dc2626',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 1rem'
        }}></div>
        <p style={{ color: '#6b7280' }}>Caricamento...</p>
      </div>
    </div>
  )
}

// Shared wrapper component
function OrgWrapper() {
  return (
    <OrganizationProvider>
      <AuthProvider>
        <Outlet />
      </AuthProvider>
    </OrganizationProvider>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Organization routes */}
        <Route path="/:slug" element={<OrgWrapper />}>
          <Route index element={<Navigate to="login" replace />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="activate" element={<Activate />} />
          <Route path="home" element={<Home />} />
          <Route path="card" element={<Card />} />
          <Route path="rewards" element={<Rewards />} />
          <Route path="profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="login" replace />} />
        </Route>

        {/* Fallback - redirect to saved slug or show instructions */}
        <Route path="/" element={<RootRedirect />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
