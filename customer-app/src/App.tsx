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

// Root redirect component - redirects to saved org slug
function RootRedirect() {
  const navigate = useNavigate()

  useEffect(() => {
    // Check if we have a saved organization slug
    const savedSlug = localStorage.getItem('omnily_org_slug')

    if (savedSlug) {
      console.log('🔄 PWA: Redirecting to saved organization:', savedSlug)
      navigate(`/${savedSlug}/home`, { replace: true })
    }
  }, [navigate])

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '2rem',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      textAlign: 'center'
    }}>
      <div>
        <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>👋 Welcome!</h1>
        <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
          Please access your organization's app using:
        </p>
        <code style={{
          display: 'block',
          padding: '1rem',
          background: '#f3f4f6',
          borderRadius: '0.5rem',
          marginBottom: '1.5rem'
        }}>
          /your-organization-slug
        </code>
        <p style={{ fontSize: '0.875rem', color: '#9ca3af' }}>
          Example: /pizzeria-rossi
        </p>
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
