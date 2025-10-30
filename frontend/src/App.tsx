import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './App.css'
import { AuthProvider } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'
import { useMDMCommands } from './hooks/useMDMCommands'
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
import MDMDashboard from './components/Admin/MDMDashboard'
import BillingDashboard from './components/Admin/BillingDashboardReal'
import SecurityDashboard from './components/Admin/SecurityDashboardSafe'
import SystemSettings from './components/Admin/SystemSettingsSafe'
import AnalyticsDashboard from './components/Admin/AnalyticsDashboard'
import HardwareOrdersDashboard from './components/Admin/HardwareOrdersDashboard'
import SupplierOrdersDashboard from './components/Admin/SupplierOrdersDashboard'
import InventoryDashboard from './components/Admin/InventoryDashboard'
import CRMLeadsDashboard from './components/Admin/CRMLeadsDashboard'
import PendingCustomers from './components/Admin/PendingCustomers'
import UsersManagement from './components/Admin/UsersManagement'
import ActivityLogDashboard from './components/Admin/ActivityLogDashboard'
import NotificationsDashboard from './components/Admin/NotificationsDashboard'
import EmailTemplatesDashboard from './components/Admin/EmailTemplatesDashboard'
import DatabaseDashboard from './components/Admin/DatabaseDashboard'
import SupportDashboard from './components/Admin/SupportDashboard'
import BrandingDashboard from './components/Admin/BrandingDashboard'
import AdminGiftCertificatesDashboard from './components/Admin/AdminGiftCertificatesDashboard'
import AdminMembershipsDashboard from './components/Admin/AdminMembershipsDashboard'
import WebsiteManager from './components/Admin/WebsiteManager'
import WebsiteManagerV2 from './components/Admin/WebsiteManagerV2'
import ContractsDashboard from './components/Admin/ContractsDashboard'
import UpdatePassword from './pages/UpdatePassword'
import AuthCallback from './pages/AuthCallback'
import StrapiTest from './pages/StrapiTest'
import PublicSite from './pages/PublicSite'
import SiteRendererPage from './pages/SiteRendererPage'
import DeviceSetup from './pages/DeviceSetup'

const ContractSignature = React.lazy(() => import('./pages/ContractSignature'))

import Z108POSInterface from './components/POS/Z108POSInterface'
import POSDashboardWrapper from './components/POS/POSDashboardWrapper'
import CustomerDisplay from './components/POS/CustomerDisplay'
import WebsiteContentEditor from './components/POS/WebsiteContentEditor'

function App() {
  // Registra handler MDM per comandi da Android
  useMDMCommands()

  // Detect if running in POS mode (only posomnily=true)
  const isPOSMode = typeof window !== 'undefined' &&
    window.location.search.includes('posomnily=true')

  // Check if this should be customer display
  // IMPORTANTE: Solo se ESPLICITAMENTE customer=true nell'URL iniziale
  const isCustomerDisplay = typeof window !== 'undefined' && isPOSMode &&
    window.location.search.includes('customer=true')

  console.log('🔍 DEBUG App.tsx:', {
    isPOSMode,
    isCustomerDisplay,
    search: typeof window !== 'undefined' ? window.location.search : 'undefined',
    pathname: typeof window !== 'undefined' ? window.location.pathname : 'undefined',
    hash: typeof window !== 'undefined' ? window.location.hash : 'undefined',
    hasCustomerParam: typeof window !== 'undefined' ? window.location.search.includes('customer=true') : false,
    hasPosParam: typeof window !== 'undefined' ? window.location.search.includes('posomnily=true') : false
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
    console.log('✅ CUSTOMER DISPLAY ATTIVATO - rendering CustomerDisplay component');
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

  // Check for public site rendering mode
  const hostname = window.location.hostname;
  const parts = hostname.split('.');

  // 🧪 TESTING: Force SiteRendererPage mode when accessing /test-public-site
  const isTestingPublicSite = window.location.pathname === '/test-public-site';

  const isPublicSite = parts.length > 1 && !['www', 'localhost', 'app', 'admin'].includes(parts[0]);

  if (isPublicSite || isTestingPublicSite) {
    console.log('✅ PUBLIC SITE MODE - rendering SiteRendererPage', { isTestingPublicSite });
    return (
      <Router>
        <AuthProvider>
          <ToastProvider>
            <SiteRendererPage />
          </ToastProvider>
        </AuthProvider>
      </Router>
    );
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
          <ToastProvider>
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
          </ToastProvider>
        </AuthProvider>
      </Router>
    )
  }

  return (
    <Router>
      <AuthProvider>
        <ToastProvider>
          <div className="App">
          <Routes>
            <Route path="/" element={<><Navbar /><Landing /></>} />
            {/* ...tutte le altre route originali... */}
            <Route path="/login" element={<Login />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/update-password" element={<UpdatePassword />} />
            <Route path="/strapi-test" element={<StrapiTest />} />
            <Route path="/test" element={<div style={{padding: '2rem', textAlign: 'center'}}><h1>TEST ROUTE WORKS! 🎉</h1></div>} />
            <Route path="/customer-display" element={<div>CUSTOMER DISPLAY TEST</div>} />
            <Route path="/device-setup" element={<DeviceSetup />} />
            <Route path="/onboarding" element={<ProtectedRoute><><Navbar /><Onboarding /></></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/dashboard/customers" element={<ProtectedRoute><><Navbar /><BusinessCustomers /></></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>} >
              <Route index element={<AdminDashboard />} />
              <Route path="organizations" element={<Admin />} />
              <Route path="business-owners" element={<BusinessOwners />} />
              <Route path="pending-customers" element={<PendingCustomers />} />
              <Route path="users" element={<UsersManagement />} />
              <Route path="crm" element={<CRMLeadsDashboard />} />
              <Route path="contracts" element={<ContractsDashboard />} />
              <Route path="supplier-orders" element={<SupplierOrdersDashboard />} />
              <Route path="hardware-orders" element={<HardwareOrdersDashboard />} />
              <Route path="mdm" element={<MDMDashboard />} />
              <Route path="inventory" element={<InventoryDashboard />} />
              <Route path="subscriptions" element={<BillingDashboard />} />
              <Route path="security" element={<SecurityDashboard />} />
              <Route path="settings" element={<SystemSettings />} />
              <Route path="analytics" element={<AnalyticsDashboard />} />
              <Route path="activity" element={<ActivityLogDashboard />} />
              <Route path="notifications" element={<NotificationsDashboard />} />
              <Route path="emails" element={<EmailTemplatesDashboard />} />
              <Route path="database" element={<DatabaseDashboard />} />
              <Route path="support" element={<SupportDashboard />} />
              <Route path="branding" element={<BrandingDashboard />} />
              <Route path="websites" element={<WebsiteManager />} />
              <Route path="websites-v2" element={<WebsiteManagerV2 />} />
              <Route path="gift-certificates" element={<AdminGiftCertificatesDashboard />} />
              <Route path="memberships" element={<AdminMembershipsDashboard />} />
            </Route>
            <Route path="/sign/:signatureId" element={
              <React.Suspense fallback={<div>Caricamento...</div>}>
                <ContractSignature />
              </React.Suspense>
            } />
            <Route path="/customer-display" element={<CustomerDisplay />} />
            <Route path="/sites/:subdomain" element={<PublicSite />} />
          </Routes>
        </div>
        </ToastProvider>
      </AuthProvider>
    </Router>
  )
}

export default App
// Force deploy 1759947521
