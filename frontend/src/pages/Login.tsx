import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { getAdminPermissions, type AdminRole } from '../utils/adminPermissions';
import { operatorNFCService, type OperatorAuthResult } from '../services/operatorNFCService';
import styles from './Login.module.css'; // Importa gli stili del modulo

const Login: React.FC = () => {
  const [isPosMode, setIsPosMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'reset'>('login');

  // POS NFC Login states
  const [loginMethod, setLoginMethod] = useState<'nfc' | 'password'>('nfc');
  const [isReadingNFC, setIsReadingNFC] = useState(false);
  const [recognizedOperator, setRecognizedOperator] = useState<OperatorAuthResult | null>(null);
  const nfcCallbackRef = useRef<any>(null);

  const { user, signIn, signUp, signInWithGoogle, resetPassword, isSuperAdmin, userRole, loading: authLoading } = useAuth();
  const { showToast, showSuccess, showError, showWarning, showInfo } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // CORREZIONE: Rileva modalità POS dai parametri URL come in App.tsx
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('pos') || urlParams.has('posomnily')) {
      setIsPosMode(true);
    }
    // Fallback: controlla anche User-Agent per compatibilità
    else if (navigator.userAgent.includes('OMNILY-POS-APP')) {
      setIsPosMode(true);
    }

    // IMPORTANTE: Aspetta che l'auth sia completamente caricato prima del redirect
    // Per admin, aspetta anche che userRole sia stato caricato
    if (user && !authLoading) {
      console.log('🔐 Login useEffect triggered:', {
        user: !!user,
        authLoading,
        isSuperAdmin,
        userRole,
        isPosMode
      });

      // CRITICAL: Aspetta sempre che userRole sia caricato, tranne in modalità POS
      if (!userRole && !isPosMode) {
        console.log('🔐 ⏳ Waiting for userRole to be loaded before redirect...');
        return;
      }

      let redirectPath = '/dashboard'; // Default per utenti normali

      // 🚨 PRIORITÀ: Se è modalità POS, vai SEMPRE al dashboard aziendale (anche se sei super_admin)
      if (isPosMode) {
        redirectPath = '/dashboard'; // Dashboard aziendale per POS
        console.log('🔐 📱 POS mode redirect (priority over admin roles):', { redirectPath, userRole });
      }
      // Se NON è POS e sei un admin OMNILY PRO (super_admin, sales_agent, account_manager)
      else if (userRole) {
        const permissions = getAdminPermissions(userRole as AdminRole);
        redirectPath = permissions.defaultRoute;
        console.log('🔐 ✅ Admin login redirect:', { userRole, redirectPath, permissions });
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

    // Setup NFC callback
    const handleNFCRead = async (rawResult: any) => {
      console.log('🔐 NFC Read in Login - Raw:', rawResult);
      console.log('🔐 Type:', typeof rawResult);

      let nfcUid = '';

      // Prova tutti i possibili formati
      if (typeof rawResult === 'string') {
        // Potrebbe essere un JSON string o un UID diretto
        try {
          const parsed = JSON.parse(rawResult);
          console.log('🔐 Parsed JSON:', parsed);
          nfcUid = parsed.uid || parsed.nfcUid || parsed.id || parsed.serialNumber || '';
        } catch {
          // È una stringa diretta (es: "04A1B2C3D4E5F6")
          console.log('🔐 Direct string UID:', rawResult);
          nfcUid = rawResult.trim();
        }
      } else if (rawResult?.uid) {
        console.log('🔐 Object with uid:', rawResult.uid);
        nfcUid = rawResult.uid;
      } else if (rawResult?.nfcUid) {
        console.log('🔐 Object with nfcUid:', rawResult.nfcUid);
        nfcUid = rawResult.nfcUid;
      } else if (rawResult?.id) {
        console.log('🔐 Object with id:', rawResult.id);
        nfcUid = rawResult.id;
      } else if (rawResult?.serialNumber) {
        console.log('🔐 Object with serialNumber:', rawResult.serialNumber);
        nfcUid = rawResult.serialNumber;
      }

      console.log('🔐 Final nfcUid:', nfcUid);

      if (!nfcUid || nfcUid.trim() === '') {
        console.error('❌ UID vuoto! Raw data:', rawResult);
        showError('Errore Lettura NFC', 'UID della tessera non rilevato. Riprova avvicinando la tessera.');
        setIsReadingNFC(false);
        return;
      }

      try {
        // Cerca l'operatore nel database
        const operatorAuth = await operatorNFCService.authenticateViaNFC(nfcUid);

        if (!operatorAuth) {
          showWarning('Tessera Non Associata', 'Vai su Impostazioni → Tessere Operatori POS per associare questa tessera ad un operatore');
          setIsReadingNFC(false);
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
            // Effettua il login con le credenziali dell'operatore
            // Nota: questo richiede che l'operatore abbia un account Supabase Auth
            // In alternativa, potresti generare un token temporaneo
            await signIn(operatorAuth.user_email, ''); // Password vuota, gestita server-side

            // Log del login
            await operatorNFCService.logLogin({
              operator_card_id: operatorAuth.card_id,
              user_id: operatorAuth.user_id,
              organization_id: operatorAuth.organization_id,
              nfc_uid: nfcUid,
              success: true
            });

            // Il redirect automatico conferma il login, no need for toast
          } catch (error) {
            console.error('Errore durante login NFC:', error);
            showError('Errore Login', 'Impossibile effettuare il login. Usa email e password.');
            setLoginMethod('password');
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

    // Registra il callback globale
    if (typeof window !== 'undefined' && (window as any).OmnilyPOS) {
      (window as any).loginNFCHandler = handleNFCRead;
      nfcCallbackRef.current = handleNFCRead;
      console.log('✅ Login NFC handler registered');
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
      showError('Errore', 'Funzione NFC non disponibile');
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
  // Layout specifico per il POS
  // ====================================
  if (isPosMode) {
    return (
      <div className={styles.posWrapper}>
        <div className={styles.posCard}>
          {/* Logo */}
          <div className={styles.logoContainer}>
            <img src="https://sjvatdnvewohvswfrdiv.supabase.co/storage/v1/object/public/IMG/OMNILYPRO.png" alt="OMNILY PRO" />
          </div>
          <h2 className={styles.title}>Accesso POS</h2>

          {/* Toggle Method */}
          <div className={styles.loginMethodToggle}>
            <button
              type="button"
              className={`${styles.toggleButton} ${loginMethod === 'nfc' ? styles.active : ''}`}
              onClick={() => {
                setLoginMethod('nfc');
                if (isReadingNFC) handleStopNFCReading();
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
                <line x1="12" y1="18" x2="12.01" y2="18"/>
              </svg>
              Tessera NFC
            </button>
            <button
              type="button"
              className={`${styles.toggleButton} ${loginMethod === 'password' ? styles.active : ''}`}
              onClick={() => {
                setLoginMethod('password');
                if (isReadingNFC) handleStopNFCReading();
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              Password
            </button>
          </div>

          {/* NFC Mode */}
          {loginMethod === 'nfc' && (
            <div className={styles.nfcMode}>
              {!isReadingNFC && !recognizedOperator && (
                <button
                  type="button"
                  className={styles.nfcStartButton}
                  onClick={handleStartNFCReading}
                >
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
                    <line x1="12" y1="18" x2="12.01" y2="18"/>
                  </svg>
                  <span>Avvicina la Tessera</span>
                </button>
              )}

              {isReadingNFC && !recognizedOperator && (
                <div className={styles.nfcReading}>
                  <div className={styles.nfcPulse}>
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
                      <line x1="12" y1="18" x2="12.01" y2="18"/>
                    </svg>
                  </div>
                  <p>In attesa della tessera...</p>
                  <button
                    type="button"
                    className={styles.cancelButton}
                    onClick={handleStopNFCReading}
                  >
                    Annulla
                  </button>
                </div>
              )}

              {recognizedOperator && (
                <div className={styles.operatorRecognized}>
                  <div className={styles.checkIcon}>
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </div>
                  <h3>Operatore Riconosciuto</h3>
                  <p className={styles.operatorName}>{recognizedOperator.operator_name}</p>
                  <p className={styles.accessingText}>Accesso in corso...</p>
                </div>
              )}
            </div>
          )}

          {/* Password Mode */}
          {loginMethod === 'password' && (
            <form onSubmit={handleAuth} className={styles.form}>
              <input
                type="email"
                placeholder="Email operatore"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <div className={styles.passwordInputContainer}>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className={styles.passwordToggle}
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M3 3L21 21M9.9 4.24C10.5 4.07 11.2 4 12 4C16.5 4 20.4 7.22 21.54 12C21.13 13.37 20.44 14.5 19.56 15.5M14.12 14.12C13.8 14.63 13.25 15 12.6 15C11.45 15 10.5 14.05 10.5 12.9C10.5 12.25 10.87 11.7 11.38 11.38M9.9 19.76C10.5 19.93 11.2 20 12 20C7.5 20 3.6 16.78 2.46 12C3.15 10.22 4.31 8.69 5.81 7.5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M1 12S5 4 12 4S23 12 23 12S19 20 12 20S1 12 1 12Z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx="12" cy="12" r="3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>
              </div>
              <button type="submit" disabled={loading}>
                {loading ? 'Accesso...' : 'Entra'}
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // Layout standard per il Desktop
  return (
    <div className="login-page">
      <div className="login-wrapper">
        <div className="login-container">
        <div className="login-header">
          <Link to="/" className="login-logo">
            <img src="https://sjvatdnvewohvswfrdiv.supabase.co/storage/v1/object/public/IMG/OMNILYPRO.png" alt="OMNILY PRO" style={{ height: '50px', marginBottom: '0.5rem' }} />
          </Link>
          <h1>{getTitle()}</h1>
          <p>Benvenuto nella piattaforma SaaS multi-tenant</p>
        </div>

        {authMode === 'reset' ? (
          <form onSubmit={handlePasswordReset} className="login-form">
            <div className="form-group">
              <label htmlFor="email" className="sr-only">Email</label>
              <div className="input-with-icon">
                <svg className="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
                <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="La tua email" required />
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>{loading ? 'Invio...' : 'Invia link per il reset'}</button>
          </form>
        ) : (
          <form onSubmit={handleAuth} className="login-form">
            <div className="form-group">
              <label htmlFor="email" className="sr-only">Email</label>
              <div className="input-with-icon">
                <svg className="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
                <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="La tua email" required />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="password" className="sr-only">Password</label>
              <div className="input-with-icon password-input-container">
                <svg className="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                <input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="La tua password" required minLength={6} />
                <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)} disabled={loading}>
                  {showPassword ? <svg width="20" height="20" viewBox="0 0 24 24"><path d="M3 3L21 21M9.9 4.24C10.5 4.07 11.2 4 12 4C16.5 4 20.4 7.22 21.54 12C21.13 13.37 20.44 14.5 19.56 15.5M14.12 14.12C13.8 14.63 13.25 15 12.6 15C11.45 15 10.5 14.05 10.5 12.9C10.5 12.25 10.87 11.7 11.38 11.38M9.9 19.76C10.5 19.93 11.2 20 12 20C7.5 20 3.6 16.78 2.46 12C3.15 10.22 4.31 8.69 5.81 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> : <svg width="20" height="20" viewBox="0 0 24 24"><path d="M1 12S5 4 12 4S23 12 23 12S19 20 12 20S1 12 1 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </button>
              </div>
            </div>
            {authMode === 'login' && <div className="auth-extra-links"><button type="button" onClick={() => setAuthMode('reset')} className="link-button">Password dimenticata?</button></div>}
            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>{loading ? 'Elaborazione...' : (authMode === 'signup' ? 'Registrati' : 'Accedi')}</button>
            <div className="auth-divider"><span>oppure</span></div>
            <button type="button" onClick={handleGoogleLogin} className="btn btn-google btn-full">Continua con Google</button>
          </form>
        )}
        <div className="auth-switch">
          {authMode === 'login' && <p>Non hai un account? <button type="button" onClick={() => setAuthMode('signup')} className="link-button">Registrati qui</button></p>}
          {authMode === 'signup' && <p>Hai già un account? <button type="button" onClick={() => setAuthMode('login')} className="link-button">Accedi qui</button></p>}
          {authMode === 'reset' && <p>Tornare al? <button type="button" onClick={() => setAuthMode('login')} className="link-button">Login</button></p>}
        </div>
        </div>

        {/* Right Side - Illustration Panel */}
        <div className="login-illustration">
        <div className="illustration-content">
          <div className="illustration-badge">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            #1 Loyalty Platform Italia
          </div>
          <h2>Trasforma la Customer Loyalty della tua Azienda</h2>
          <p>La piattaforma SaaS leader per creare, gestire e ottimizzare programmi di fidelizzazione enterprise con ROI garantito del +40%.</p>
          <div className="illustration-features">
            <div className="feature-item">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <polyline points="22 4 12 14.01 9 11.01" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>+40% Ritorno Clienti</span>
            </div>
            <div className="feature-item">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <polyline points="22 4 12 14.01 9 11.01" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>+65% Engagement</span>
            </div>
            <div className="feature-item">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <polyline points="22 4 12 14.01 9 11.01" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>-30% Costi Acquisizione</span>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default Login;