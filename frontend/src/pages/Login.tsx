import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Sparkles, Shield, TrendingUp, Users, Moon, Sun, CreditCard, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { getAdminPermissions, type AdminRole } from '../utils/adminPermissions';
import { operatorNFCService, type OperatorAuthResult } from '../services/operatorNFCService';
import { SparklesCore } from '@/components/UI/sparkles';
import styles from './Login.module.css'; // Importa gli stili del modulo

const Login: React.FC = () => {
  const [isPosMode, setIsPosMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'reset'>('login');

  // Dark mode state - sincronizzato con landing page
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('omnily_landing_theme')
      return saved === 'dark'
    }
    return false
  });

  // POS NFC Login states
  const [loginMethod, setLoginMethod] = useState<'nfc' | 'password'>('nfc');
  const [isReadingNFC, setIsReadingNFC] = useState(false);
  const [recognizedOperator, setRecognizedOperator] = useState<OperatorAuthResult | null>(null);
  const nfcCallbackRef = useRef<any>(null);

  const { user, signIn, signUp, signInWithGoogle, resetPassword, isSuperAdmin, userRole, loading: authLoading } = useAuth();
  const { showToast, showSuccess, showError, showWarning, showInfo } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Save theme preference
  useEffect(() => {
    localStorage.setItem('omnily_landing_theme', darkMode ? 'dark' : 'light')
  }, [darkMode])

  const toggleDarkMode = () => setDarkMode(!darkMode)

  useEffect(() => {
    // CORREZIONE: Rileva modalità POS dai parametri URL come in App.tsx
    const urlParams = new URLSearchParams(window.location.search);
    const hasPosParam = urlParams.has('pos') || urlParams.has('posomnily');
    const hasUserAgentPOS = navigator.userAgent.includes('OMNILY-POS-APP');

    if (hasPosParam || hasUserAgentPOS) {
      setIsPosMode(true);
      // Salva in localStorage per persistenza
      localStorage.setItem('pos-mode', 'true');
      console.log('📱 POS Mode attivato:', { hasPosParam, hasUserAgentPOS });
    }
    // IMPORTANTE: Se accedi da desktop (senza parametri POS e senza User-Agent POS)
    // PULISCI il localStorage per evitare che resti in modalità POS
    else {
      const wasInPosMode = localStorage.getItem('pos-mode') === 'true';
      if (wasInPosMode) {
        console.log('🖥️ Desktop mode: pulizia localStorage POS');
        localStorage.removeItem('pos-mode');
      }
      setIsPosMode(false);
    }

    // IMPORTANTE: Aspetta che l'auth sia completamente caricato prima del redirect
    if (user && !authLoading) {
      console.log('🔐 Login useEffect triggered:', {
        user: !!user,
        authLoading,
        isSuperAdmin,
        userRole,
        isPosMode
      });

      let redirectPath = '/dashboard'; // Default per utenti normali

      // 🚨 PRIORITÀ: Se è modalità POS, vai SEMPRE al dashboard aziendale (anche se sei super_admin)
      if (isPosMode) {
        redirectPath = '/dashboard'; // Dashboard aziendale per POS
        console.log('🔐 📱 POS mode redirect (priority over admin roles):', { redirectPath, userRole });
      }
      // Se sei SUPER ADMIN, vai SEMPRE al pannello admin (anche se userRole è null)
      else if (isSuperAdmin) {
        redirectPath = '/admin';
        console.log('🔐 👑 Super admin redirect to admin panel:', { redirectPath, isSuperAdmin });
      }
      // Se NON è POS e sei un admin OMNILY PRO (sales_agent, account_manager, etc.)
      else if (userRole) {
        const permissions = getAdminPermissions(userRole as AdminRole);
        redirectPath = permissions.defaultRoute;
        console.log('🔐 ✅ Admin login redirect:', { userRole, redirectPath, permissions });
      }
      // Se userRole è null = utente normale senza organizzazione → vai all'onboarding
      else if (userRole === null && !isSuperAdmin) {
        redirectPath = '/onboarding';
        console.log('🔐 👤 New user without organization, redirecting to onboarding');
      }

      console.log('🔐 🚀 Final login redirect:', { userRole, isSuperAdmin, redirectPath, authLoading, currentPath: location.pathname });

      const from = (location.state as { from?: { pathname: string } })?.from?.pathname || redirectPath;

      // PREVENZIONE LOOP: Non fare redirect se sei già sulla pagina giusta!
      if (location.pathname === from) {
        console.log('🔐 ⚠️ Already on target page, skipping redirect to prevent loop');
        return;
      }

      navigate(from, { replace: true });
    }
  }, [user, navigate, location.pathname, location.state, isPosMode, isSuperAdmin, userRole]); // RIMOSSO authLoading!

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (authMode === 'signup') {
        await signUp(email, password);
        showSuccess('Registrazione completata', 'Controlla la tua email per confermare l\'account');
      } else {
        await signIn(email, password);
        showSuccess('Login effettuato con successo');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
      if (errorMessage.includes('Invalid login credentials')) {
        showError('Credenziali non valide', 'Email o password non corretti');
      } else if (errorMessage.includes('Email not confirmed')) {
        showError('Email non confermata', 'Controlla la tua email per confermare l\'account');
      } else {
        showError('Errore di autenticazione', errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await resetPassword(email);
      showSuccess('Email inviata', 'Controlla la tua email per il link di reset della password');
    } catch (error) {
      showError('Errore reset password', error instanceof Error ? error.message : 'Errore sconosciuto');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      showError('Errore Google Login', error instanceof Error ? error.message : 'Errore sconosciuto');
    }
  };

  const getTitle = () => {
    if (authMode === 'signup') return 'Registrati';
    if (authMode === 'reset') return 'Recupera Password';
    return 'Accedi';
  };

  // ====================================
  // POS NFC Login Functions
  // ====================================

  useEffect(() => {
    if (!isPosMode || loginMethod !== 'nfc') return;

    // Setup NFC callback (stesso formato di CardManagementPanel)
    const handleNFCRead = async (rawResult: any) => {
      console.log('🔐 NFC Read in Login - Raw:', rawResult);
      console.log('🔐 Type:', typeof rawResult);

      // Handle both string and object results from Android bridge
      let result = rawResult;
      if (typeof rawResult === 'string') {
        try {
          result = JSON.parse(rawResult);
          console.log('🔄 Parsed JSON result:', result);
        } catch (e) {
          console.error('❌ Failed to parse JSON result:', e);
          result = { success: false, error: 'Parse failed' };
        }
      }

      console.log('🔐 NFC CALLBACK - Parsed result:', result);
      setIsReadingNFC(false);

      // Controlla se la lettura è riuscita
      if (!result || !result.success) {
        showError('Errore Lettura NFC', result?.error || 'Lettura fallita o annullata');
        return;
      }

      // Estrai l'UID (stesso formato del CardManagementPanel)
      const nfcUid = result.cardNo || result.rfUid;

      if (!nfcUid) {
        console.error('❌ UID non trovato nel risultato:', result);
        showError('Errore Lettura NFC', 'UID della tessera non rilevato. Riprova avvicinando la tessera.');
        return;
      }

      console.log('✅ NFC SUCCESS - Card UID:', nfcUid);

      // Beep di conferma
      const bridge = (window as any).OmnilyPOS;
      if (bridge?.beep) {
        bridge.beep("1", "150");
      }

      try {
        // Cerca l'operatore nel database
        const operatorAuth = await operatorNFCService.authenticateViaNFC(nfcUid);

        if (!operatorAuth) {
          showWarning('Tessera Non Associata', 'Vai su Impostazioni → Tessere Operatori POS per associare questa tessera ad un operatore');
          return;
        }

        // Mostra l'operatore riconosciuto
        setRecognizedOperator(operatorAuth);

        // Toast visibile e chiaro con nome operatore
        showToast({
          type: 'success',
          title: 'Operatore Riconosciuto',
          message: `${operatorAuth.operator_name} • Login automatico in corso...`,
          duration: 10000 // 10 secondi
        });

        // Attendi 1 secondo per mostrare il riconoscimento
        setTimeout(async () => {
          try {
            console.log('🔐 Tentativo login NFC per:', operatorAuth.user_email);

            // NFC Login automatico con password dell'operatore
            // La password è salvata in modo criptato (base64) nel database

            // Decodifica la password dall'operatore
            const operatorPassword = atob(operatorAuth.encrypted_password);

            await signIn(operatorAuth.user_email, operatorPassword);

            // Log del login
            await operatorNFCService.logLogin({
              operator_card_id: operatorAuth.card_id,
              user_id: operatorAuth.user_id,
              organization_id: operatorAuth.organization_id,
              nfc_uid: nfcUid,
              success: true
            });

            // Il redirect automatico conferma il login
            console.log('✅ Login NFC completato');
          } catch (error) {
            console.error('Errore durante login NFC:', error);
            showError(
              'Configurazione Mancante',
              'Password NFC non configurata. Contatta l\'amministratore per configurare il login NFC.'
            );
            setLoginMethod('password');

            // Log tentativo fallito
            await operatorNFCService.logLogin({
              operator_card_id: operatorAuth.card_id,
              user_id: operatorAuth.user_id,
              organization_id: operatorAuth.organization_id,
              nfc_uid: nfcUid,
              success: false
            });
          } finally {
            setIsReadingNFC(false);
            setRecognizedOperator(null);
          }
        }, 1500);

      } catch (error) {
        console.error('Errore autenticazione NFC:', error);
        showError('Errore', 'Errore durante l\'autenticazione NFC');
        setIsReadingNFC(false);
      }
    };

    // Registra il callback globale (sempre, anche su desktop per testing)
    if (typeof window !== 'undefined') {
      (window as any).loginNFCHandler = handleNFCRead;
      nfcCallbackRef.current = handleNFCRead;
      console.log('✅ Login NFC handler registered', (window as any).OmnilyPOS ? '(Android bridge available)' : '(Desktop mode - use console for testing)');
    }

    return () => {
      // Cleanup
      if (typeof window !== 'undefined') {
        delete (window as any).loginNFCHandler;
        const bridge = (window as any).OmnilyPOS;
        if (bridge && bridge.stopNFCReading) {
          bridge.stopNFCReading();
        }
      }
    };
  }, [isPosMode, loginMethod, showError, showSuccess, signIn]);

  const handleStartNFCReading = () => {
    const bridge = (window as any).OmnilyPOS;
    if (!bridge || !bridge.readNFCCard) {
      // Desktop mode - mostra istruzioni per testing
      showInfo(
        'Modalità Test Desktop',
        'Usa la console (F12) per simulare: window.loginNFCHandler({ uid: "TEST-CARD-001" })'
      );
      console.log('💡 Per testare NFC su desktop, apri la console e usa:');
      console.log('   window.loginNFCHandler({ uid: "TEST-CARD-001" });');
      setIsReadingNFC(true); // Attiva lo stato per mostrare l'animazione
      return;
    }

    setIsReadingNFC(true);
    setRecognizedOperator(null);

    if (bridge.showToast) {
      bridge.showToast('Avvicina la tua tessera operatore...');
    }

    // Avvia la lettura NFC
    bridge.readNFCCard('loginNFCHandler');
    console.log('🔐 NFC Reading started for login');
  };

  const handleStopNFCReading = () => {
    const bridge = (window as any).OmnilyPOS;
    if (bridge && bridge.stopNFCReading) {
      bridge.stopNFCReading();
    }
    setIsReadingNFC(false);
    setRecognizedOperator(null);
  };

  // ====================================
  // Layout specifico per il POS - NUOVO DESIGN MODERNO
  // ====================================
  if (isPosMode) {
    return (
      <div className={`min-h-screen transition-colors duration-500 ${
        darkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-black' : 'bg-gradient-to-br from-orange-50 via-white to-pink-50'
      }`}>
        {/* Animated Background */}
        {darkMode ? (
          <div className="fixed inset-0 pointer-events-none">
            <SparklesCore
              background="transparent"
              minSize={1.2}
              maxSize={3}
              particleDensity={120}
              className="w-full h-full"
              particleColor="#ef4444"
            />
          </div>
        ) : (
          <div className="fixed inset-0 pointer-events-none overflow-hidden">
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-0 -left-4 w-96 h-96 bg-gradient-to-br from-red-200 to-pink-200 rounded-full mix-blend-normal filter blur-3xl animate-blob" />
              <div className="absolute top-0 -right-4 w-96 h-96 bg-gradient-to-br from-pink-200 to-red-100 rounded-full mix-blend-normal filter blur-3xl animate-blob animation-delay-2000" />
              <div className="absolute -bottom-8 left-20 w-96 h-96 bg-gradient-to-br from-red-100 to-pink-100 rounded-full mix-blend-normal filter blur-3xl animate-blob animation-delay-4000" />
            </div>
          </div>
        )}

        {/* Dark Mode Toggle - Fixed Top Right */}
        <div className="fixed top-6 right-6 z-50">
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={toggleDarkMode}
            className={`p-3 rounded-xl transition-all duration-300 shadow-lg ${
              darkMode
                ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
            aria-label="Toggle dark mode"
          >
            {darkMode ? <Sun size={24} /> : <Moon size={24} />}
          </motion.button>
        </div>

        <div className="min-h-screen flex items-center justify-center p-6 relative">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className={`w-full max-w-md p-8 md:p-12 rounded-3xl border backdrop-blur-xl ${
              darkMode
                ? 'bg-white/5 border-white/10'
                : 'bg-white/80 border-gray-200 shadow-2xl'
            }`}
          >
            {/* Logo */}
            <div className="text-center mb-8">
              <img
                src="https://sjvatdnvewohvswfrdiv.supabase.co/storage/v1/object/public/IMG/OMNILYPRO.png"
                alt="OMNILY PRO"
                className="h-16 md:h-20 w-auto mx-auto mb-4"
              />
              <h2 className={`text-2xl md:text-3xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Accesso POS
              </h2>
            </div>

            {/* Toggle Method */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <button
                type="button"
                onClick={() => {
                  setLoginMethod('nfc');
                  if (isReadingNFC) handleStopNFCReading();
                }}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl font-bold transition-all duration-300 ${
                  loginMethod === 'nfc'
                    ? 'bg-gradient-to-r from-red-600 to-pink-600 text-white shadow-lg shadow-red-500/50 scale-105'
                    : darkMode
                    ? 'bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10'
                    : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300'
                }`}
              >
                <CreditCard size={24} />
                <span className="text-sm">Tessera NFC</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginMethod('password');
                  if (isReadingNFC) handleStopNFCReading();
                }}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl font-bold transition-all duration-300 ${
                  loginMethod === 'password'
                    ? 'bg-gradient-to-r from-red-600 to-pink-600 text-white shadow-lg shadow-red-500/50 scale-105'
                    : darkMode
                    ? 'bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10'
                    : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300'
                }`}
              >
                <Lock size={24} />
                <span className="text-sm">Password</span>
              </button>
            </div>

            {/* NFC Mode */}
            {loginMethod === 'nfc' && (
              <div className="space-y-6">
                {!isReadingNFC && !recognizedOperator && (
                  <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    type="button"
                    onClick={handleStartNFCReading}
                    className={`w-full flex flex-col items-center gap-4 p-12 rounded-2xl border-2 border-dashed transition-all duration-300 ${
                      darkMode
                        ? 'border-white/20 bg-white/5 hover:bg-white/10 hover:border-red-500/50'
                        : 'border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-red-500'
                    }`}
                  >
                    <CreditCard size={64} className={darkMode ? 'text-red-400' : 'text-red-600'} />
                    <span className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      Avvicina la Tessera
                    </span>
                  </motion.button>
                )}

                {isReadingNFC && !recognizedOperator && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center space-y-6"
                  >
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="inline-block"
                    >
                      <CreditCard size={80} className="text-red-500" />
                    </motion.div>
                    <p className={`text-lg font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      In attesa della tessera...
                    </p>
                    <button
                      type="button"
                      onClick={handleStopNFCReading}
                      className={`px-6 py-3 rounded-xl font-bold transition-all ${
                        darkMode
                          ? 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
                          : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                      }`}
                    >
                      Annulla
                    </button>
                  </motion.div>
                )}

                {recognizedOperator && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center space-y-4"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200 }}
                      className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500"
                    >
                      <CheckCircle size={48} className="text-white" />
                    </motion.div>
                    <h3 className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      Operatore Riconosciuto
                    </h3>
                    <p className="text-xl font-bold text-green-500">
                      {recognizedOperator.operator_name}
                    </p>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Accesso in corso...
                    </p>
                  </motion.div>
                )}
              </div>
            )}

            {/* Password Mode */}
            {loginMethod === 'password' && (
              <motion.form
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onSubmit={handleAuth}
                className="space-y-6"
              >
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Email Operatore
                  </label>
                  <div className="relative">
                    <Mail size={20} className={`absolute left-4 top-1/2 -translate-y-1/2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email operatore"
                      required
                      className={`w-full pl-12 pr-4 py-3 rounded-xl border transition-all ${
                        darkMode
                          ? 'bg-white/5 border-white/10 text-white placeholder-gray-500 focus:border-red-500 focus:bg-white/10'
                          : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                      } outline-none`}
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Password
                  </label>
                  <div className="relative">
                    <Lock size={20} className={`absolute left-4 top-1/2 -translate-y-1/2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      required
                      className={`w-full pl-12 pr-12 py-3 rounded-xl border transition-all ${
                        darkMode
                          ? 'bg-white/5 border-white/10 text-white placeholder-gray-500 focus:border-red-500 focus:bg-white/10'
                          : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                      } outline-none`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={`absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-all duration-200 ${
                        darkMode
                          ? 'text-gray-500 hover:text-red-400 hover:bg-white/10'
                          : 'text-gray-500 hover:text-red-600'
                      }`}
                      style={{ background: 'transparent' }}
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-xl font-bold shadow-xl shadow-red-500/50 hover:shadow-2xl hover:shadow-red-500/80 hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Accesso...' : 'Entra'}
                  <ArrowRight size={20} />
                </button>
              </motion.form>
            )}
          </motion.div>
        </div>
      </div>
    );
  }

  // Layout standard per il Desktop - NUOVO DESIGN MODERNO
  return (
    <div className={`min-h-screen transition-colors duration-500 ${
      darkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-black' : 'bg-gradient-to-br from-orange-50 via-white to-pink-50'
    }`}>
      {/* Animated Background */}
      {darkMode ? (
        <div className="fixed inset-0 pointer-events-none">
          <SparklesCore
            background="transparent"
            minSize={1.2}
            maxSize={3}
            particleDensity={120}
            className="w-full h-full"
            particleColor="#ef4444"
          />
        </div>
      ) : (
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 -left-4 w-96 h-96 bg-gradient-to-br from-red-200 to-pink-200 rounded-full mix-blend-normal filter blur-3xl animate-blob" />
            <div className="absolute top-0 -right-4 w-96 h-96 bg-gradient-to-br from-pink-200 to-red-100 rounded-full mix-blend-normal filter blur-3xl animate-blob animation-delay-2000" />
            <div className="absolute -bottom-8 left-20 w-96 h-96 bg-gradient-to-br from-red-100 to-pink-100 rounded-full mix-blend-normal filter blur-3xl animate-blob animation-delay-4000" />
          </div>
        </div>
      )}

      {/* Dark Mode Toggle - Fixed Top Right */}
      <div className="fixed top-6 right-6 z-50">
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={toggleDarkMode}
          className={`p-3 rounded-xl transition-all duration-300 shadow-lg ${
            darkMode
              ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
          aria-label="Toggle dark mode"
        >
          {darkMode ? <Sun size={24} /> : <Moon size={24} />}
        </motion.button>
      </div>

      <div className="min-h-screen flex items-center justify-center p-6 relative">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">

          {/* Left Side - Form */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className={`p-8 md:p-12 rounded-3xl border backdrop-blur-xl ${
              darkMode
                ? 'bg-white/5 border-white/10'
                : 'bg-white/80 border-gray-200 shadow-2xl'
            }`}
          >
            {/* Logo */}
            <Link to="/" className="inline-block mb-8">
              <img
                src="https://sjvatdnvewohvswfrdiv.supabase.co/storage/v1/object/public/IMG/OMNILYPRO.png"
                alt="OMNILY PRO"
                className="h-12 md:h-16 w-auto"
              />
            </Link>

            {/* Title */}
            <h1 className={`text-3xl md:text-4xl font-black mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {getTitle()}
            </h1>
            <p className={`text-lg mb-8 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Benvenuto nella piattaforma #1 in Italia
            </p>

            {/* Forms */}
            {authMode === 'reset' ? (
              <form onSubmit={handlePasswordReset} className="space-y-6">
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Email
                  </label>
                  <div className="relative">
                    <Mail size={20} className={`absolute left-4 top-1/2 -translate-y-1/2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="La tua email"
                      required
                      className={`w-full pl-12 pr-4 py-3 rounded-xl border transition-all ${
                        darkMode
                          ? 'bg-white/5 border-white/10 text-white placeholder-gray-500 focus:border-red-500 focus:bg-white/10'
                          : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                      } outline-none`}
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-xl font-bold shadow-xl shadow-red-500/50 hover:shadow-2xl hover:shadow-red-500/80 hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Invio...' : 'Invia Link Reset'}
                  <ArrowRight size={20} />
                </button>
              </form>
            ) : (
              <form onSubmit={handleAuth} className="space-y-6">
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Email
                  </label>
                  <div className="relative">
                    <Mail size={20} className={`absolute left-4 top-1/2 -translate-y-1/2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="La tua email"
                      required
                      className={`w-full pl-12 pr-4 py-3 rounded-xl border transition-all ${
                        darkMode
                          ? 'bg-white/5 border-white/10 text-white placeholder-gray-500 focus:border-red-500 focus:bg-white/10'
                          : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                      } outline-none`}
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Password
                  </label>
                  <div className="relative">
                    <Lock size={20} className={`absolute left-4 top-1/2 -translate-y-1/2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="La tua password"
                      required
                      minLength={6}
                      className={`w-full pl-12 pr-12 py-3 rounded-xl border transition-all ${
                        darkMode
                          ? 'bg-white/5 border-white/10 text-white placeholder-gray-500 focus:border-red-500 focus:bg-white/10'
                          : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                      } outline-none`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={`absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-all duration-200 ${
                        darkMode
                          ? 'text-gray-500 hover:text-red-400 hover:bg-white/10'
                          : 'text-gray-500 hover:text-red-600'
                      }`}
                      style={{ background: 'transparent' }}
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                {authMode === 'login' && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setAuthMode('reset')}
                      className={`group flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                        darkMode
                          ? 'text-red-400 hover:text-red-300 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-red-500/30'
                          : 'text-red-600 hover:text-red-700 bg-gray-50 hover:bg-red-50 border border-gray-200 hover:border-red-300'
                      }`}
                    >
                      <Lock size={14} className="group-hover:rotate-12 transition-transform" />
                      Password dimenticata?
                    </button>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-xl font-bold shadow-xl shadow-red-500/50 hover:shadow-2xl hover:shadow-red-500/80 hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Elaborazione...' : (authMode === 'signup' ? 'Registrati' : 'Accedi')}
                  <ArrowRight size={20} />
                </button>

                <div className="relative my-6">
                  <div className={`absolute inset-0 flex items-center ${darkMode ? 'opacity-20' : ''}`}>
                    <div className={`w-full border-t ${darkMode ? 'border-white/10' : 'border-gray-200'}`}></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className={`px-4 ${darkMode ? 'bg-gray-900/50 text-gray-400' : 'bg-white text-gray-500'}`}>
                      oppure
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className={`w-full flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-bold border-2 transition-all duration-300 ${
                    darkMode
                      ? 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                      : 'bg-white border-gray-200 text-gray-900 hover:border-gray-300 shadow-lg hover:shadow-xl'
                  }`}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continua con Google
                </button>
              </form>
            )}

            {/* Auth Switch */}
            <div className="mt-6 text-center">
              {authMode === 'login' && (
                <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Sei un nuovo cliente?{' '}
                  <Link
                    to="/request-demo"
                    className={`group inline-flex items-center gap-1 font-bold px-3 py-1.5 rounded-xl transition-all ${
                      darkMode
                        ? 'text-red-400 hover:text-red-300 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-red-500/30'
                        : 'text-red-600 hover:text-red-700 bg-gray-50 hover:bg-red-50 border border-gray-200 hover:border-red-300'
                    }`}
                  >
                    Richiedi una Demo
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              )}
              {authMode === 'signup' && (
                <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Hai già un account?{' '}
                  <button
                    type="button"
                    onClick={() => setAuthMode('login')}
                    className={`group inline-flex items-center gap-1 font-bold px-3 py-1.5 rounded-xl transition-all ${
                      darkMode
                        ? 'text-red-400 hover:text-red-300 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-red-500/30'
                        : 'text-red-600 hover:text-red-700 bg-gray-50 hover:bg-red-50 border border-gray-200 hover:border-red-300'
                    }`}
                  >
                    Accedi qui
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              )}
              {authMode === 'reset' && (
                <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Tornare al{' '}
                  <button
                    type="button"
                    onClick={() => setAuthMode('login')}
                    className={`group inline-flex items-center gap-1 font-bold px-3 py-1.5 rounded-xl transition-all ${
                      darkMode
                        ? 'text-red-400 hover:text-red-300 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-red-500/30'
                        : 'text-red-600 hover:text-red-700 bg-gray-50 hover:bg-red-50 border border-gray-200 hover:border-red-300'
                    }`}
                  >
                    Login
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              )}
            </div>
          </motion.div>

          {/* Right Side - Illustration */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="hidden lg:block"
          >
            <div className={`p-12 rounded-3xl ${darkMode ? 'bg-gradient-to-br from-red-600/20 to-pink-600/20 border border-red-500/30' : 'bg-gradient-to-br from-red-500 to-pink-500'}`}>
              {/* Badge */}
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 ${
                darkMode ? 'bg-white/10 border border-white/20' : 'bg-white/20 backdrop-blur-lg'
              }`}>
                <Sparkles size={16} className="text-white" />
                <span className="text-white font-bold text-sm">#1 Loyalty Platform Italia</span>
              </div>

              {/* Title */}
              <h2 className="text-4xl font-black text-white mb-4">
                Trasforma la Customer Loyalty della tua Azienda
              </h2>
              <p className="text-white/90 text-lg mb-8">
                La piattaforma SaaS leader per creare, gestire e ottimizzare programmi di fidelizzazione enterprise con ROI garantito.
              </p>

              {/* Features */}
              <div className="space-y-4">
                {[
                  { icon: TrendingUp, text: '+40% Ritorno Clienti' },
                  { icon: Users, text: '+65% Customer Engagement' },
                  { icon: Shield, text: '-30% Costi Acquisizione' }
                ].map((feature, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.1 }}
                    className="flex items-center gap-4 p-4 rounded-xl bg-white/10 backdrop-blur-lg"
                  >
                    <div className="p-3 rounded-lg bg-white/20">
                      <feature.icon size={24} className="text-white" />
                    </div>
                    <span className="text-white font-semibold text-lg">{feature.text}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Login;