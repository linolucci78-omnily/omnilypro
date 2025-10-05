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
    console.log('🔐 Checking user role for:', userId)

    try {
      // PRIMA: Controlla nella tabella users (per admin OMNILY PRO)
      console.log('🔐 Checking users table for userId:', userId)
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role, status, email')
        .eq('id', userId)
        .single()

      console.log('🔐 Users table result:', {
        data: userData,
        error: userError,
        errorDetails: userError?.message,
        errorCode: userError?.code
      })

      // Se trovato nella tabella users, usa quel ruolo
      if (userData && userData.role && !userError) {
        console.log('✅ Admin OMNILY PRO found with role:', userData.role, 'Email:', userData.email)
        setUserRole(userData.role)
        setIsSuperAdmin(userData.role === 'super_admin')
        return
      }

      console.log('⚠️ Not found in users table, checking organization_users...')

      // SECONDA: Se non trovato in users, controlla organization_users
      console.log('🔐 Checking organization_users table...')

      const queryPromise = supabase
        .from('organization_users')
        .select('role, org_id')
        .eq('user_id', userId)

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Role query timeout after 5s')), 5000)
      )

      const { data: allRoles, error: allError } = await Promise.race([
        queryPromise,
        timeoutPromise
      ]) as any

      console.log('🔐 Organization roles:', allRoles, 'Error:', allError)

      // Check specifically for super admin
      const superAdminRole = allRoles?.find((role: any) => role.role === 'super_admin')

      if (superAdminRole) {
        console.log('🔐 Super admin found in organization_users!', superAdminRole)
        setUserRole('super_admin')
        setIsSuperAdmin(true)
        return
      }

      // If no super admin, use first role found
      if (allRoles && allRoles.length > 0) {
        const firstRole = allRoles[0]
        console.log('🔐 Organization role found:', firstRole.role)
        setUserRole(firstRole.role)
        setIsSuperAdmin(firstRole.role === 'super_admin')
      } else {
        console.log('🔐 No roles found for user')
        setUserRole(null)
        setIsSuperAdmin(false)
      }
    } catch (err) {
      console.error('🔐 Error checking user role:', err)

      // If timeout or other error, set defaults but stop loading
      setUserRole(null)
      setIsSuperAdmin(false)

      // Don't stay in loading state forever
      setLoading(false)
    }
  }

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        await checkUserRole(session.user.id)
      }

      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔐 Auth state changed:', event, session?.user?.email)
      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        await checkUserRole(session.user.id)
      } else {
        setUserRole(null)
        setIsSuperAdmin(false)
      }

      setLoading(false)
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
