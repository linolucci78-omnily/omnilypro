import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Onboarding from './pages/Onboarding';
import UpdatePassword from './pages/UpdatePassword';
import AuthCallback from './pages/AuthCallback';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import Navbar from './components/Layout/Navbar';
import Landing from './pages/Landing';
import Z108POSInterface from './components/POS/Z108POSInterface';
import AdminLayout from './components/Admin/AdminLayout';
import AdminDashboard from './pages/AdminDashboard';
import Admin from './pages/Admin';
import BusinessOwners from './pages/BusinessOwners';
import BusinessCustomers from './pages/BusinessCustomers';
import POSSimulator from './components/POS/POSSimulator';

function App() {
  useEffect(() => {
    // Controlla se l'app è in esecuzione all'interno della nostra WebView POS
    if (navigator.userAgent.includes('OMNILY-POS-APP')) {
      document.body.classList.add('pos-view');
    }
  }, []);

  // Logica per rilevare la modalità POS tramite parametro URL (mantenuta per flessibilità)
  const isPOSMode = typeof window !== 'undefined' && window.location.search.includes('pos=true');

  // Se siamo in modalità POS (rilevata da URL), usa un layout semplificato
  if (isPOSMode) {
    return (
      <Router>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route
              path="/pos"
              element={
                <ProtectedRoute>
                  <Z108POSInterface />
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </Router>
    );
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
              path="/pos-simulator" 
              element={<POSSimulator />} 
            />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  )
}

export default App;