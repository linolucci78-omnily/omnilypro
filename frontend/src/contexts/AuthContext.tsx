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
      // STEP 1: Check users table FIRST (Admin OMNILY PRO: super_admin, sales_agent, account_manager)
      console.log('🔐 Checking users table for OMNILY admin roles...')

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single()

      console.log('🔐 Users table result:', userData, 'Error:', userError)

      // Se trovato nella tabella users, è un admin OMNILY
      if (userData && !userError) {
        const role = userData.role
        console.log('🔐 OMNILY Admin role found:', role)
        setUserRole(role)
        setIsSuperAdmin(role === 'super_admin')
        return // STOP here - admin OMNILY trovato
      }

      // STEP 2: Se non trovato in users, check organization_users (Organization owners/staff)
      console.log('🔐 Checking organization_users table...')

      const { data: allRoles, error: allError } = await supabase
        .from('organization_users')
        .select('role, org_id')
        .eq('user_id', userId)

      console.log('🔐 Organization_users result:', allRoles, 'Error:', allError)

      if (allError) {
        console.error('🔐 Error querying organization_users:', allError)
        setUserRole(null)
        setIsSuperAdmin(false)
        return
      }

      // Check specifically for super admin
      const superAdminRole = allRoles?.find((role: any) => role.role === 'super_admin')

      if (superAdminRole) {
        console.log('🔐 Super admin found!', superAdminRole)
        setUserRole('super_admin')
        setIsSuperAdmin(true)
        return
      }

      // If no super admin, use first role found
      if (allRoles && allRoles.length > 0) {
        const firstRole = allRoles[0]
        console.log('🔐 Regular role found:', firstRole.role)
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
    } finally {
      // Always stop loading at the end
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
