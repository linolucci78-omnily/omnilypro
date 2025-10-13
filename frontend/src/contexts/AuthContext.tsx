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

  // Function to check user role
  const checkUserRole = async (userId: string) => {
    console.log('🔐 [V5] Checking user role for:', userId);
    try {
      // Determine if in POS mode (this needs to be passed in or derived here)
      const urlParams = new URLSearchParams(window.location.search);
      const isPosMode = urlParams.has('pos') || urlParams.has('posomnily') || navigator.userAgent.includes('OMNILY-POS-APP');

      // STEP 1: Check for OMNILY Super Admin in `users` table first.
      // SKIP THIS STEP IF IN POS MODE, as per user's clarification that super_admin is in organization_users for POS
      if (!isPosMode) { // Only check users table if NOT in POS mode
        console.log('🔐 [V5] Checking for Super Admin in users table...');
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('role')
          .eq('id', userId)
          .maybeSingle();

        if (userError) {
          console.error('🔐 [V5] Error checking users table:', userError);
          // Don't stop, fallback to organization_users
        }

        if (userData && (userData.role === 'super_admin' || userData.role === 'sales_agent')) {
          console.log('🔐 [V5] OMNILY Admin role found in users table:', userData.role);
          setUserRole(userData.role);
          setIsSuperAdmin(userData.role === 'super_admin');
          return; // Role found, stop here.n
        }
      } else {
        console.log('🔐 [V5] In POS mode, skipping direct users table check.');
      }

      // STEP 2: Check for organization roles WITH TIMEOUT
      console.log('🔐 [V5] Checking organization_users table...');
      
      const orgUsersPromise = supabase
        .from('organization_users')
        .select('role')
        .eq('user_id', userId);
      
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Organization_users timeout')), 5000)
      );

      let orgRoles, orgError;
      try {
        const result = await Promise.race([orgUsersPromise, timeoutPromise]) as any;
        orgRoles = result.data;
        orgError = result.error;
      } catch (timeoutError) {
        console.error('⚠️ [V5] Organization_users query timeout (5s)!');
        orgError = timeoutError;
      }

      if (orgError) {
        console.error('🔐 [V5] Error or timeout checking organization_users table:', orgError);
        // Permetti l'accesso con ruolo di default invece di bloccare
        console.warn('🔐 [V5] Setting default org_admin role to allow access despite timeout');
        setUserRole('org_admin');
        setIsSuperAdmin(false);
        return;
      }

      if (orgRoles && orgRoles.length > 0) {
        const primaryRole = orgRoles.find(r => r.role === 'super_admin') || orgRoles.find(r => r.role === 'org_admin') || orgRoles[0];
        console.log('🔐 [V5] Organization role found:', primaryRole.role);
        setUserRole(primaryRole.role);
        setIsSuperAdmin(primaryRole.role === 'super_admin');
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
        await checkUserRole(session.user.id)
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
        await checkUserRole(session.user.id)
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
        emailRedirectTo: window.location.origin + '/auth/callback'
      }
    })

    if (error) throw error

    // Log per debug
    console.log('SignUp result:', data)

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
