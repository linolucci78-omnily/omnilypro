import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './App.css'
import { AuthProvider } from './contexts/AuthContext'
import Navbar from './components/Layout/Navbar'
import ProtectedRoute from './components/Auth/ProtectedRoute'
import AdminLayout from './components/Admin/AdminLayout'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import AdminDashboard from './pages/AdminDashboard'
import Admin from './pages/Admin'
import BusinessCustomers from './pages/BusinessCustomers'
import BusinessOwners from './pages/BusinessOwners'
import UpdatePassword from './pages/UpdatePassword'
import AuthCallback from './pages/AuthCallback'

import Z108POSInterface from './components/POS/Z108POSInterface'
import POSDashboardWrapper from './components/POS/POSDashboardWrapper'
import CustomerDisplay from './components/POS/CustomerDisplay'

function App() {
  // Detect if running in POS mode (only posomnily=true)
  const isPOSMode = typeof window !== 'undefined' &&
    window.location.search.includes('posomnily=true')

  // Check if this should be customer display
  const isCustomerDisplay = typeof window !== 'undefined' && (
    (window.location.hash === '#customer-display' && isPOSMode) ||
    (window.location.search.includes('customer=true') && isPOSMode)
  )

  console.log('🔍 DEBUG App.tsx:', {
    isPOSMode,
    isCustomerDisplay,
    search: typeof window !== 'undefined' ? window.location.search : 'undefined',
    pathname: typeof window !== 'undefined' ? window.location.pathname : 'undefined',
    hash: typeof window !== 'undefined' ? window.location.hash : 'undefined',
    hasOpener: typeof window !== 'undefined' ? window.opener !== null : 'undefined',
    isPopup: typeof window !== 'undefined' && window.opener !== null,
    shouldShowCustomerDisplay: typeof window !== 'undefined' && window.location.hash === '#customer-display' && isPOSMode
  })

  // Check if we should redirect to /pos from hash
  const shouldRedirectToPOS = typeof window !== 'undefined' && 
    window.location.hash === '#/pos' && isPOSMode

  // Handle hash-based routing for POS
  if (shouldRedirectToPOS && window.location.pathname !== '/pos') {
    const posParam = window.location.search.includes('posomnily=true') ? 'posomnily=true' : 'pos=true'
    window.history.replaceState(null, '', `/pos?${posParam}`)
  }

  // Customer Display Mode - Direct render
  if (isCustomerDisplay) {
    document.body.style.margin = '0'
    document.body.style.padding = '0'
    document.body.style.overflow = 'hidden'

    return <CustomerDisplay />
  }

  // Direct customer display route access
  if (isPOSMode && window.location.pathname === '/customer-display') {
    document.body.style.margin = '0'
    document.body.style.padding = '0'
    document.body.style.overflow = 'hidden'

    return <CustomerDisplay />
  }

  // POS Mode - Handle both login and POS interface routes
  if (isPOSMode) {
    // Remove all margins/padding for POS mode
    document.body.style.margin = '0'
    document.body.style.padding = '0'
    document.body.style.overflow = 'auto'

    return (
      <Router>
        <AuthProvider>
          <div className="App" style={{ margin: 0, padding: 0 }}>
            <Routes>
              <Route path="/" element={<Login />} />
              <Route path="/login" element={<Login />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <POSDashboardWrapper />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/pos"
                element={
                  <ProtectedRoute>
                    <Z108POSInterface />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/customer-display"
                element={<CustomerDisplay />}
              />
              <Route path="*" element={<Login />} />
            </Routes>
          </div>
        </AuthProvider>
      </Router>
    )
  }

  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <Navbar />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/update-password" element={<UpdatePassword />} />
            <Route path="/test" element={<div style={{padding: '2rem', textAlign: 'center'}}><h1>TEST ROUTE WORKS! 🎉</h1></div>} />
            <Route path="/customer-display" element={<div>CUSTOMER DISPLAY TEST</div>} />
            <Route 
              path="/onboarding" 
              element={
                <ProtectedRoute>
                  <Onboarding />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/customers" 
              element={
                <ProtectedRoute>
                  <BusinessCustomers />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/*" 
              element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="organizations" element={<Admin />} />
              <Route path="business-owners" element={<BusinessOwners />} />
            </Route>
            <Route
              path="/customer-display"
              element={<CustomerDisplay />}
            />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  )
}

export default App
