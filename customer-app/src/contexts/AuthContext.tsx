import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../services/supabase'
import type { Customer } from '../types'
import { useOrganization } from './OrganizationContext'

interface AuthContextType {
  customer: Customer | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshCustomer: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  customer: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
  refreshCustomer: async () => {}
})

export const useAuth = () => useContext(AuthContext)

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { organization } = useOrganization()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is already logged in
    checkSession()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadCustomer(session.user.id)
      } else {
        setCustomer(null)
        setLoading(false)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [organization])

  const checkSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()

      if (session?.user) {
        await loadCustomer(session.user.id)
      } else {
        setLoading(false)
      }
    } catch (error) {
      console.error('Error checking session:', error)
      setLoading(false)
    }
  }

  const loadCustomer = async (userId: string) => {
    try {
      if (!organization) {
        console.warn('Organization not loaded yet')
        setLoading(false)
        return
      }

      console.log('🔍 Loading customer data for user:', userId)

      // Prova prima con auth_user_id (utenti attivati via email)
      let { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('auth_user_id', userId)
        .eq('organization_id', organization.id)
        .single()

      // Se non trovato, prova con id (utenti auto-registrati)
      if (error && error.code === 'PGRST116') {
        console.log('🔄 Customer not found by auth_user_id, trying by id...')
        const result = await supabase
          .from('customers')
          .select('*')
          .eq('id', userId)
          .eq('organization_id', organization.id)
          .single()

        data = result.data
        error = result.error
      }

      // Se ancora non trovato, prova con email dell'utente Auth
      if (error && error.code === 'PGRST116') {
        console.log('🔄 Customer not found by id, trying by email...')

        // Ottieni l'email dell'utente Auth
        const { data: { user } } = await supabase.auth.getUser()

        if (user?.email) {
          const result = await supabase
            .from('customers')
            .select('*')
            .eq('email', user.email)
            .eq('organization_id', organization.id)
            .single()

          data = result.data
          error = result.error

          // Se trovato per email, aggiorna auth_user_id per la prossima volta
          if (data && !error) {
            console.log('✅ Customer found by email, updating auth_user_id...')
            await supabase
              .from('customers')
              .update({ auth_user_id: userId })
              .eq('id', data.id)
          }
        }
      }

      if (error) throw error

      console.log('✅ Customer loaded:', data.name)
      setCustomer(data)
    } catch (error) {
      console.error('Error loading customer:', error)
      setCustomer(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    if (!organization) {
      throw new Error('Organization not loaded')
    }

    console.log('🔐 Attempting login for:', email)

    // Sign in with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (authError) throw authError

    console.log('✅ Login successful')

    // Load customer data
    await loadCustomer(authData.user.id)
  }

  const logout = async () => {
    console.log('🚪 Logging out')

    const { error } = await supabase.auth.signOut()

    if (error) throw error

    setCustomer(null)
    console.log('✅ Logout successful')
  }

  const refreshCustomer = async () => {
    const { data: { session } } = await supabase.auth.getSession()

    if (session?.user) {
      await loadCustomer(session.user.id)
    }
  }

  return (
    <AuthContext.Provider value={{ customer, loading, login, logout, refreshCustomer }}>
      {children}
    </AuthContext.Provider>
  )
}
