import React, { createContext, useContext, useEffect, useState, useRef } from 'react'
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

  // Evita chiamate multiple simultanee a checkUserRole
  const isCheckingRole = useRef(false)
  const roleCache = useRef<{ userId: string; role: string | null; isSuperAdmin: boolean } | null>(null)

  // Function to check user role
  const checkUserRole = async (userId: string) => {
    // Se già sta controllando, skip
    if (isCheckingRole.current) {
      console.log('🔐 checkUserRole già in esecuzione, skip')
      return
    }

    // Se abbiamo già il ruolo in cache per questo utente, usalo
    if (roleCache.current && roleCache.current.userId === userId) {
      console.log('🔐 Usando ruolo da cache:', roleCache.current.role)
      setUserRole(roleCache.current.role)
      setIsSuperAdmin(roleCache.current.isSuperAdmin)
      setLoading(false)
      return
    }

    isCheckingRole.current = true
    console.log('🔐 Checking user role for:', userId)

    try {
      // STEP 1: Check users table (Admin OMNILY PRO: super_admin, sales_agent, account_manager)
      // SKIPPED FOR NOW - causing infinite loop, will fix later
      console.log('🔐 Skipping users table check for now...')

      // STEP 2: Check organization_users table (Organization owners/staff)
      console.log('🔐 Checking organization_users table...')

      const { data: allRoles, error: allError } = await supabase
        .from('organization_users')
        .select('role, org_id')
        .eq('user_id', userId)
        .limit(10) // Limita i risultati per velocizzare

      console.log('🔐 Organization_users result:', allRoles, 'Error:', allError)

      // Check specifically for super admin
      const superAdminRole = allRoles?.find((role: any) => role.role === 'super_admin')

      if (superAdminRole) {
        console.log('🔐 Super admin found!', superAdminRole)
        setUserRole('super_admin')
        setIsSuperAdmin(true)
        // Salva in cache
        roleCache.current = { userId, role: 'super_admin', isSuperAdmin: true }
        return
      }

      // If no super admin, use first role found
      if (allRoles && allRoles.length > 0) {
        const firstRole = allRoles[0]
        console.log('🔐 Regular role found:', firstRole.role)
        setUserRole(firstRole.role)
        setIsSuperAdmin(firstRole.role === 'super_admin')
        // Salva in cache
        roleCache.current = { userId, role: firstRole.role, isSuperAdmin: firstRole.role === 'super_admin' }
      } else {
        console.log('🔐 No roles found for user')
        setUserRole(null)
        setIsSuperAdmin(false)
        // Salva in cache anche il null
        roleCache.current = { userId, role: null, isSuperAdmin: false }
      }
    } catch (err) {
      console.error('🔐 Error checking user role:', err)

      // If timeout or other error, set defaults but stop loading
      setUserRole(null)
      setIsSuperAdmin(false)
    } finally {
      // Always stop loading at the end
      setLoading(false)
      isCheckingRole.current = false
    }
  }

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        await checkUserRole(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔐 Auth state changed:', event, session?.user?.email)
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

      // NON chiamare setLoading(false) qui perché checkUserRole lo fa già
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
