import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { OrganizationProvider } from './contexts/OrganizationContext'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Login from './pages/Login'
import Register from './pages/Register'
import Activate from './pages/Activate'
import Home from './pages/Home'
import Card from './pages/Card'
import Rewards from './pages/Rewards'
import Coupons from './pages/Coupons'
import Profile from './pages/Profile'
import Wallet from './pages/Wallet'
import WalletTransactions from './pages/WalletTransactions'
import Settings from './pages/Settings'
import AccountDetails from './pages/AccountDetails'
import { getCookie } from './utils/cookies'
import NotificationAnimations from './components/NotificationAnimations'
import { useNotificationAnimations } from './hooks/useNotificationAnimations'
import UpdatePrompt from './components/UpdatePrompt'
import CoinFountain from './components/CoinFountain'
import './styles/global.css'

// Root redirect component - redirects to saved org slug
function RootRedirect() {
  // Check COOKIE first (shared between browser and PWA), then localStorage as fallback
  const savedSlug = getCookie('omnily_org_slug') || localStorage.getItem('omnily_org_slug')

  useEffect(() => {
    if (savedSlug) {
      console.log('🔄 PWA Root: Redirecting to saved organization:', savedSlug)
      console.log('📍 Source:', getCookie('omnily_org_slug') ? 'Cookie' : 'LocalStorage')
      // Use window.location.replace for faster, more reliable redirect
      window.location.replace(`/${savedSlug}/home`)
    }
  }, [savedSlug])

  // If we have a saved slug, show loading while redirecting
  if (savedSlug) {
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

  // No saved slug - show instructions
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
        <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>📱 Omnily Loyalty</h1>
        <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
          Per iniziare, visita il link della tua organizzazione:
        </p>
        <code style={{
          display: 'block',
          padding: '1rem',
          background: '#f3f4f6',
          borderRadius: '0.5rem',
          marginBottom: '1rem',
          fontSize: '0.875rem'
        }}>
          card.omnilypro.com/il-tuo-negozio
        </code>
        <p style={{ fontSize: '0.875rem', color: '#9ca3af' }}>
          Dopo il login, potrai installare l'app sulla tua home screen
        </p>
      </div>
    </div>
  )
}

// Global sale success wrapper - MUST be inside AuthProvider
function GlobalSaleSuccess() {
  const { showSaleSuccess, setShowSaleSuccess, saleData, coinFountainRef } = useAuth()

  // Auto-hide sale success modal after 3 seconds
  useEffect(() => {
    if (showSaleSuccess) {
      const timer = setTimeout(() => {
        setShowSaleSuccess(false)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [showSaleSuccess, setShowSaleSuccess])

  return (
    <>
      {/* Sale Success Modal - visible on ALL pages */}
      {showSaleSuccess && saleData && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/70 z-[9999]"></div>

          {/* Modal */}
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 bg-gradient-to-br from-green-500 to-green-600 rounded-3xl shadow-2xl z-[10000] max-w-md mx-auto">
            <div className="p-8 text-center text-white">
              {/* Icona successo con animazione */}
              <div className="flex justify-center mb-6">
                <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center animate-bounce backdrop-blur-sm">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>

              {/* Titolo */}
              <h2 className="text-3xl font-black mb-4">
                Vendita Registrata!
              </h2>

              {/* Importo */}
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 mb-4">
                <p className="text-5xl font-black mb-2">
                  €{saleData.amount.toFixed(2)}
                </p>
              </div>

              {/* Punti guadagnati */}
              <p className="text-2xl font-bold mb-2">
                +{saleData.pointsEarned} punti!
              </p>

              <p className="text-lg opacity-90">
                Continua così! 🎉
              </p>
            </div>
          </div>
        </>
      )}

      {/* Coin Fountain Animation - always mounted, visible on ALL pages */}
      <CoinFountain ref={coinFountainRef} />
    </>
  )
}

// Shared wrapper component
function OrgWrapper() {
  const animations = useNotificationAnimations()

  const handleTriggerAnimation = (type: 'points' | 'confetti' | 'trophy' | 'sparkles', data?: any) => {
    switch (type) {
      case 'points':
        animations.coinFountain(data?.points || 50)
        break
      case 'confetti':
        animations.confetti()
        break
      case 'trophy':
        animations.trophy(data?.tier || 'Gold')
        break
      case 'sparkles':
        animations.sparkles()
        break
    }
  }

  return (
    <OrganizationProvider>
      <AuthProvider>
        <Outlet />
        <GlobalSaleSuccess />
        <NotificationAnimations ref={animations.animationsRef} />
      </AuthProvider>
    </OrganizationProvider>
  )
}

function App() {
  return (
    <BrowserRouter>
      <UpdatePrompt />
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
          <Route path="coupons" element={<Coupons />} />
          <Route path="profile" element={<Profile />} />
          <Route path="wallet" element={<Wallet />} />
          <Route path="wallet/transactions" element={<WalletTransactions />} />
          <Route path="settings" element={<Settings />} />
          <Route path="account" element={<AccountDetails />} />
          <Route path="*" element={<Navigate to="login" replace />} />
        </Route>

        {/* Fallback - redirect to saved slug or show instructions */}
        <Route path="/" element={<RootRedirect />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
