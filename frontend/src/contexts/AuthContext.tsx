import React, { createContext, useContext, useEffect, useState } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  userRole: string | null
  isSuperAdmin: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<any>
  signOut: () => Promise<void>
  signInWithGoogle: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)

  // Cache per evitare query ripetute
  const roleCache = React.useRef<{ [userId: string]: { role: string, isSuperAdmin: boolean, timestamp: number } }>({})
  const CACHE_DURATION = 5 * 60 * 1000 // 5 minuti

  // Function to check user role
  const checkUserRole = async (userId: string, userSession?: Session | null) => {
    // Check cache first
    const cached = roleCache.current[userId]
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      console.log('🔐 [CACHE] Using cached role:', cached.role)
      setUserRole(cached.role)
      setIsSuperAdmin(cached.isSuperAdmin)
      return
    }
    console.log('🔐 [V5] Checking user role for:', userId);
    try {
      // Determine if in POS mode (this needs to be passed in or derived here)
      const urlParams = new URLSearchParams(window.location.search);
      const isPosMode = urlParams.has('pos') || urlParams.has('posomnily') || navigator.userAgent.includes('OMNILY-POS-APP');

      // STEP 1: Check user metadata for is_super_admin flag (PRIORITÀ MASSIMA)
      // Usiamo i metadati auth invece della tabella users per evitare problemi RLS
      console.log('🔐 [V9] Checking auth metadata for super admin status...');

      // Usa la sessione passata se disponibile, altrimenti prova getSession
      const authUser = userSession?.user;

      console.log('🔐 [V9] Auth user from session:', authUser?.email);
      console.log('🔐 [V9] Auth user metadata:', authUser?.user_metadata);

      // Se è super admin nei metadati, impostal subito e ritorna
      if (authUser?.user_metadata?.is_super_admin === true) {
        console.log('🔐 [V9] ✅ SUPER ADMIN DETECTED from metadata! Setting role and returning.');
        roleCache.current[userId] = {
          role: 'super_admin',
          isSuperAdmin: true,
          timestamp: Date.now()
        };
        setUserRole('super_admin');
        setIsSuperAdmin(true);
        setLoading(false); // IMPORTANTE: ferma il loading!
        return;
      }

      // STEP 2: Se non è super admin, controlla organization_users
      console.log('🔐 [V9] Not super admin, checking organization_users table...');

      let orgRoles: any, orgError: any;

      try {
        console.log('🔐 [V5] Starting query to organization_users...');

        // Add timeout
        const queryPromise = supabase
          .from('organization_users')
          .select('role')
          .eq('user_id', userId);

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Query timeout after 5s')), 5000)
        );

        const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any;

        console.log('🔐 [V5] Query completed. Data:', data, 'Error:', error);

        orgRoles = data;
        orgError = error;

      } catch (error) {
        console.error('🔐 [V5] Error checking organization_users table:', error);
        orgError = error;
      }

      if (orgError) {
        console.error('🔐 [V5] Error checking organization_users table:', orgError);
        // Se c'è un errore/timeout, tratta l'utente come nuovo utente senza organizzazione
        console.warn('✅ [V5] Setting userRole to null (no organization) due to query error/timeout');
        setUserRole(null);
        setIsSuperAdmin(false);
        return;
      }

      if (orgRoles && orgRoles.length > 0) {
        const primaryRole = orgRoles.find((r: any) => r.role === 'super_admin') || orgRoles.find((r: any) => r.role === 'org_admin') || orgRoles[0];
        console.log('🔐 [V5] Organization role found:', primaryRole.role);

        const role = primaryRole.role
        const isSuper = role === 'super_admin'

        // Save to cache
        roleCache.current[userId] = {
          role,
          isSuperAdmin: isSuper,
          timestamp: Date.now()
        }

        setUserRole(role);
        setIsSuperAdmin(isSuper);
        return;
      }

      // STEP 3: No roles found anywhere.
      console.log('🔐 [V5] No roles found for user in any table.');
      setUserRole(null);
      setIsSuperAdmin(false);

    } catch (err) {
      console.error('🔐 [V5] Critical error in checkUserRole:', err);
      setUserRole(null);
      setIsSuperAdmin(false);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Check for POS demo user FIRST (bypass Supabase per demo)
    const posDemoUser = localStorage.getItem('pos-demo-user')
    if (posDemoUser) {
      try {
        const mockUser = JSON.parse(posDemoUser)
        console.log('🚀 POS Demo Mode - User caricato da localStorage:', mockUser.email)
        setUser(mockUser as User)
        setSession({ user: mockUser, access_token: 'demo-token' } as any)
        setUserRole('org_admin') // Demo user ha ruolo admin organizzazione
        setIsSuperAdmin(false)
        setLoading(false)

        // Return empty cleanup per NON registrare onAuthStateChange
        return () => {
          console.log('🚀 POS Demo Mode - cleanup (noop)')
        }
      } catch (err) {
        console.error('❌ Error parsing POS demo user:', err)
        localStorage.removeItem('pos-demo-user')
      }
    }

    // Get initial session from Supabase
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        await checkUserRole(session.user.id, session)
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes (SOLO se NON demo mode)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔐 Auth state changed:', event, session?.user?.email)

      // Ignora se siamo in demo mode
      if (localStorage.getItem('pos-demo-user')) {
        console.log('🚀 POS Demo Mode - ignoro auth state change')
        return
      }

      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        // checkUserRole già chiama setLoading(false) nel finally block
        await checkUserRole(session.user.id, session)
      } else {
        setUserRole(null)
        setIsSuperAdmin(false)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
  }

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin + '/auth/callback',
        // DEVELOPMENT: Auto-confirm email per evitare problemi con email non recapitate
        data: {
          email_confirmed: true
        }
      }
    })

    if (error) throw error

    // Log per debug
    console.log('SignUp result:', data)
    console.log('User email confirmed:', data.user?.email_confirmed_at)

    return data
  }

  const signOut = async () => {
    // Pulisci demo user se presente
    localStorage.removeItem('pos-demo-user')

    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard${window.location.search}`
      }
    })
    if (error) throw error
  }

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    })
    if (error) throw error
  }

  const value = {
    user,
    session,
    loading,
    userRole,
    isSuperAdmin,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
    resetPassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
