import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import LiveTVPage from './pages/TV/LiveTVPage'
import PairingPage from './pages/TV/PairingPage'
import SplashPage from './pages/TV/SplashPage'
import TVControlPage from './pages/Admin/TVControlPage'
import SignageCMSPage from './pages/Admin/SignageCMSPage'
import { Toaster } from 'react-hot-toast'
import './App.css'
import { AuthProvider } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'
import { ThemeProvider } from './contexts/ThemeContext'
// REMOVED: GamingNotificationsProvider - using console.log instead for stability
// import { GamingNotificationsProvider } from './contexts/GamingNotificationsContext'
import { useMDMCommands } from './hooks/useMDMCommands'
import Navbar from './components/Layout/Navbar'
import ProtectedRoute from './components/Auth/ProtectedRoute'
import AdminLayout from './components/Admin/AdminLayout'
import Landing from './pages/Landing'
import LandingTest from './pages/LandingTest'
import Login from './pages/Login'
import ActivateAccount from './pages/ActivateAccount'
import ActivateOrganization from './pages/ActivateOrganization'
import ActivationSuccess from './pages/ActivationSuccess'
import Onboarding from './pages/Onboarding'
import DemoRequestWizard from './components/DemoRequestWizard'
import EnterpriseWizard from './components/Onboarding/EnterpriseWizard'
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
import DemoRequestsDashboard from './components/Admin/DemoRequestsDashboard'
import PendingCustomers from './components/Admin/PendingCustomers'
import UsersManagement from './components/Admin/UsersManagement'
import ProfileSettings from './components/Admin/ProfileSettings'
import ActivityLogDashboard from './components/Admin/ActivityLogDashboard'
import NotificationsDashboard from './components/Admin/NotificationsDashboard'
import EmailTemplatesDashboard from './components/Admin/EmailTemplatesDashboard'
import DatabaseDashboard from './components/Admin/DatabaseDashboard'
import SupportDashboard from './components/Admin/SupportDashboard'
import BrandingDashboard from './components/Admin/BrandingDashboard'
import AdminGiftCertificatesDashboard from './components/Admin/AdminGiftCertificatesDashboard'
import AdminMembershipsDashboard from './components/Admin/AdminMembershipsDashboard'
import SubscriptionFeaturesManager from './components/Admin/SubscriptionFeaturesManagerV2'
import PlanFeaturesManager from './components/Admin/PlanFeaturesManager'
import AdminPlansManager from './components/Admin/AdminPlansManager'
import WebsiteManager from './components/Admin/WebsiteManager'
import WebsiteManagerV2 from './components/Admin/WebsiteManagerV2'
import ContractsDashboard from './components/Admin/ContractsDashboard'
import DocumentationDashboard from './components/Admin/DocumentationDashboard'
import Downloads from './pages/Downloads'
import AdminDomains from './pages/AdminDomains'
import { SubdomainManagementHub } from './components/Admin/SubdomainManagementHub'
import UpdatePassword from './pages/UpdatePassword'
import AuthCallback from './pages/AuthCallback'
import StrapiTest from './pages/StrapiTest'
import PublicSite from './pages/PublicSite'
import SiteRendererPage from './pages/SiteRendererPage'
import { PublicWebsite } from './pages/PublicWebsite'
import { PublicWebsiteSubdomain } from './pages/PublicWebsiteSubdomain'

// Ensure PublicWebsite is included in bundle (prevent tree-shaking)
if (typeof window !== 'undefined') {
  console.log('✅ PublicWebsite component loaded:', typeof PublicWebsite)
  console.log('✅ PublicWebsiteSubdomain component loaded:', typeof PublicWebsiteSubdomain)
}
import DeviceSetup from './pages/DeviceSetup'

const ContractSignature = React.lazy(() => import('./pages/ContractSignature'))

import Z108POSInterface from './components/POS/Z108POSInterface'
import POSDashboardWrapper from './components/POS/POSDashboardWrapper'
import CustomerDisplay from './components/POS/CustomerDisplay'
import WebsiteContentEditor from './components/POS/WebsiteContentEditor'
import ReceiptLayoutEditorPage from './pages/ReceiptLayoutEditorPage'
import GamingTest from './pages/GamingTest'
import LotteryDisplayPage from './pages/LotteryDisplayPage'
import OmnyWalletTestPage from './pages/OmnyWalletTestPage'
import PushNotifications from './pages/PushNotifications'
import AdminOmnyDashboard from './components/Admin/Omny/AdminOmnyDashboard'
import SystemOverview from './components/Admin/SystemOverview'
import RootAccessControl from './components/Admin/RootAccessControl'
import FounderManagement from './components/Admin/FounderManagement'
import StripeConfigDashboard from './components/Admin/StripeConfigDashboard'
import SuperAdminControlCenter from './components/Admin/SuperAdminControlCenter'
import OrganizationAssistant from './components/Admin/OmnyAssistant/OrganizationAssistant'

function App() {
  // Registra handler MDM per comandi da Android
  useMDMCommands()

  // Detect if running in POS mode (controlla localStorage prima di tutto)
  // Una volta in modalità POS, rimani SEMPRE in modalità POS
  const isPOSMode = (() => {
    if (typeof window === 'undefined') return false;

    // PRIMA controlla localStorage - se già in POS mode, rimani sempre in POS
    const storedPOSMode = localStorage.getItem('omnily_pos_mode');
    if (storedPOSMode === 'true') {
      return true; // SEMPRE POS, ignora URL
    }

    // Se NON sei in POS mode, controlla se URL vuole attivarla
    const urlHasPOSParam = window.location.search.includes('posomnily=true');
    if (urlHasPOSParam) {
      localStorage.setItem('omnily_pos_mode', 'true');
      return true;
    }

    return false;
  })()

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

  console.log('🌐 Hostname detection:', {
    hostname,
    parts,
    firstPart: parts[0],
    partsLength: parts.length
  });

  // 🧪 TESTING: Force SiteRendererPage mode when accessing /test-public-site
  const isTestingPublicSite = window.location.pathname === '/test-public-site';

  // Exclude Vercel preview domains from public site mode
  const isVercelDomain = hostname.includes('.vercel.app');

  const isPublicSite = !isVercelDomain && parts.length > 1 && !['www', 'localhost', 'app', 'admin'].includes(parts[0]);

  console.log('🔍 Site mode detection:', {
    isVercelDomain,
    isPublicSite,
    isTestingPublicSite,
    willRenderPublicSite: isPublicSite || isTestingPublicSite
  });

  if (isPublicSite || isTestingPublicSite) {
    console.log('✅ PUBLIC SITE MODE - rendering PublicWebsiteSubdomain', {
      isTestingPublicSite,
      subdomain: parts[0]
    });
    return (
      <HelmetProvider>
        <Router>
          <ThemeProvider>
            <AuthProvider>
              <ToastProvider>
                <PublicWebsiteSubdomain />
              </ToastProvider>
            </AuthProvider>
          </ThemeProvider>
        </Router>
      </HelmetProvider>
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
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              <div className="App" style={{ margin: 0, padding: 0 }}>
                <Routes>
                  <Route path="/" element={<Login />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/auth/callback" element={<AuthCallback />} />
                  <Route path="/activate-account" element={<ActivateAccount />} />
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
        </ThemeProvider>
      </Router>
    )
  }

  return (
    <HelmetProvider>
      <Router>
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              <Toaster position="top-center" />
              <div className="App">
                <Routes>
                  {/* TV Display Routes */}
                  <Route path="/tv/splash" element={<SplashPage />} />
                  <Route path="/tv/pair" element={<PairingPage />} />
                  <Route path="/tv/:orgId/live" element={<LiveTVPage />} />
                  <Route path="/tv/live/:orgId" element={<LiveTVPage />} />
                  <Route path="/" element={<Landing />} />
                  <Route path="/landing-test" element={<LandingTest />} />
                  <Route path="/request-demo" element={<DemoRequestWizard onClose={() => window.location.href = '/'} />} />
                  {/* ...tutte le altre route originali... */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/auth/callback" element={<AuthCallback />} />
                  <Route path="/update-password" element={<UpdatePassword />} />
                  <Route path="/activate/:token" element={<ActivateOrganization />} />
                  <Route path="/activation-success" element={<ActivationSuccess />} />
                  <Route path="/strapi-test" element={<StrapiTest />} />
                  <Route path="/test" element={<div style={{ padding: '2rem', textAlign: 'center' }}><h1>TEST ROUTE WORKS! 🎉</h1></div>} />
                  <Route path="/customer-display" element={<div>CUSTOMER DISPLAY TEST</div>} />
                  <Route path="/device-setup" element={<DeviceSetup />} />
                  <Route path="/onboarding" element={<ProtectedRoute><><Navbar /><Onboarding /></></ProtectedRoute>} />
                  <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                  <Route path="/dashboard/customers" element={<ProtectedRoute><><Navbar /><BusinessCustomers /></></ProtectedRoute>} />
                  <Route path="/dashboard/push-notifications" element={<ProtectedRoute><><Navbar /><PushNotifications /></></ProtectedRoute>} />
                  <Route path="/receipt-layout-editor" element={<ProtectedRoute><ReceiptLayoutEditorPage /></ProtectedRoute>} />
                  <Route path="/gaming-test" element={<GamingTest />} />
                  <Route path="/omny-wallet-test" element={<OmnyWalletTestPage />} />
                  <Route path="/lottery/display/:eventId" element={<LotteryDisplayPage />} />
                  <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>} >
                    <Route index element={<AdminDashboard />} />
                    <Route path="tv-control" element={<TVControlPage />} />
                    <Route path="signage-cms" element={<SignageCMSPage />} />
                    <Route path="control-center" element={<SuperAdminControlCenter onBack={() => { }} />} />
                    <Route path="organizations" element={<Admin />} />
                    <Route path="new-organization" element={<EnterpriseWizard mode="admin" />} />
                    <Route path="business-owners" element={<BusinessOwners />} />
                    <Route path="pending-customers" element={<PendingCustomers />} />
                    <Route path="users" element={<UsersManagement />} />
                    <Route path="profile" element={<ProfileSettings />} />
                    <Route path="system-overview" element={<SystemOverview />} />
                    <Route path="root-access" element={<RootAccessControl />} />
                    <Route path="founders" element={<FounderManagement />} />
                    <Route path="crm" element={<CRMLeadsDashboard />} />
                    <Route path="demo-requests" element={<DemoRequestsDashboard />} />
                    <Route path="contracts" element={<ContractsDashboard />} />
                    <Route path="supplier-orders" element={<SupplierOrdersDashboard />} />
                    <Route path="hardware-orders" element={<HardwareOrdersDashboard />} />
                    <Route path="mdm" element={<MDMDashboard />} />
                    <Route path="inventory" element={<InventoryDashboard />} />
                    <Route path="subscriptions" element={<BillingDashboard />} />
                    <Route path="security" element={<SecurityDashboard />} />
                    <Route path="settings" element={<SystemSettings />} />
                    <Route path="subscription-plans" element={<SubscriptionFeaturesManager />} />
                    <Route path="plan-features" element={<PlanFeaturesManager />} />
                    <Route path="omnilypro-plans" element={<AdminPlansManager />} />
                    <Route path="analytics" element={<AnalyticsDashboard />} />
                    <Route path="activity" element={<ActivityLogDashboard />} />
                    <Route path="notifications" element={<NotificationsDashboard />} />
                    <Route path="emails" element={<EmailTemplatesDashboard />} />
                    <Route path="database" element={<DatabaseDashboard />} />
                    <Route path="support" element={<SupportDashboard />} />
                    <Route path="branding" element={<BrandingDashboard />} />
                    <Route path="websites" element={<WebsiteManager />} />
                    <Route path="websites-v2" element={<WebsiteManagerV2 />} />
                    <Route path="domains" element={<SubdomainManagementHub />} />
                    <Route path="gift-certificates" element={<AdminGiftCertificatesDashboard />} />
                    <Route path="memberships" element={<AdminMembershipsDashboard />} />
                    <Route path="docs" element={<DocumentationDashboard />} />
                    <Route path="downloads" element={<Downloads />} />
                    <Route path="omny" element={<AdminOmnyDashboard />} />
                    <Route path="omny-wallet" element={<OmnyWalletTestPage />} />
                    <Route path="omny-assistant" element={<OrganizationAssistant />} />
                    <Route path="stripe-config" element={<StripeConfigDashboard />} />
                  </Route>
                  <Route path="/sign/:signatureId" element={
                    <React.Suspense fallback={<div>Caricamento...</div>}>
                      <ContractSignature />
                    </React.Suspense>
                  } />
                  <Route path="/customer-display" element={<CustomerDisplay />} />
                  <Route path="/sites/:subdomain" element={<PublicSite />} />
                  <Route path="/w/:slug" element={<PublicWebsite />} />
                </Routes>
              </div>
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </Router>
    </HelmetProvider>
  )
}

export default App
// Force rebuild with PublicWebsite component
