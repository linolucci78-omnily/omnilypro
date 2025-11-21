import React, { createContext, useContext, useEffect, useState, useRef } from 'react'
import { supabase } from '../services/supabase'
import type { Customer } from '../types'
import { useOrganization } from './OrganizationContext'

interface AuthContextType {
  customer: Customer | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshCustomer: () => Promise<void>
  // Sale celebration
  showSaleSuccess: boolean
  setShowSaleSuccess: (show: boolean) => void
  saleData: { pointsEarned: number; amount: number } | null
  coinFountainRef: React.MutableRefObject<any>
}

const AuthContext = createContext<AuthContextType>({
  customer: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
  refreshCustomer: async () => {},
  showSaleSuccess: false,
  setShowSaleSuccess: () => {},
  saleData: null,
  coinFountainRef: { current: null }
})

export const useAuth = () => useContext(AuthContext)

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { organization } = useOrganization()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)

  // Sale celebration state
  const [showSaleSuccess, setShowSaleSuccess] = useState(false)
  const [saleData, setSaleData] = useState<{ pointsEarned: number; amount: number } | null>(null)
  const coinFountainRef = useRef<any>(null)
  const previousPointsRef = useRef<number | null>(null)

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

  // Setup Realtime subscription for sale notifications
  useEffect(() => {
    if (!customer?.id) {
      console.log('🔇 Nessun cliente loggato, subscription non attiva')
      return
    }

    console.log('🔔 Attivazione subscription Realtime per cliente:', customer.id)

    // Imposta i punti iniziali
    previousPointsRef.current = customer.points

    // Subscribe agli aggiornamenti del cliente
    const channel = supabase
      .channel(`customer-${customer.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'customers',
          filter: `id=eq.${customer.id}`
        },
        async (payload) => {
          console.log('🎉 Aggiornamento cliente ricevuto da Realtime!', payload)

          const updatedCustomer = payload.new as any
          const oldPoints = previousPointsRef.current || customer.points
          const newPoints = updatedCustomer.points

          console.log('📊 Punti vecchi:', oldPoints, 'Punti nuovi:', newPoints)

          // Controlla se i punti sono aumentati
          if (newPoints > oldPoints) {
            const pointsEarned = newPoints - oldPoints
            // Usa last_sale_amount per l'importo esatto invece di calcolare la differenza
            const amountSpent = updatedCustomer.last_sale_amount || (updatedCustomer.total_spent - (customer.total_spent || 0))

            console.log(`💰 Nuova vendita! +${pointsEarned} punti, €${amountSpent.toFixed(2)} spesi`)

            // Aggiorna i punti precedenti
            previousPointsRef.current = newPoints

            // Salva i dati della vendita
            setSaleData({ pointsEarned, amount: amountSpent })

            // Suono celebrativo punti
            try {
              const audio = new Audio('/sounds/slot-machine-coin-payout-1-188227.mp3')
              audio.volume = 0.5
              audio.play().catch(err => console.log('Audio play failed:', err))
            } catch (error) {
              console.log('Audio error:', error)
            }

            // Trigger confetti (se disponibile - importeremo dopo)
            if (typeof window !== 'undefined' && (window as any).confetti) {
              (window as any).confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 } })
            }

            // Trigger fontana di monete
            if (coinFountainRef.current) {
              coinFountainRef.current.triggerFountain(pointsEarned)
            }

            // Mostra modal di successo
            setShowSaleSuccess(true)

            // Aggiorna il customer nel context
            setCustomer(updatedCustomer)
          }
        }
      )
      .subscribe()

    console.log('✅ Subscription Realtime attivata!')

    return () => {
      console.log('🔕 Disattivazione subscription Realtime')
      channel.unsubscribe()
    }
  }, [customer?.id])

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
    <AuthContext.Provider value={{
      customer,
      loading,
      login,
      logout,
      refreshCustomer,
      showSaleSuccess,
      setShowSaleSuccess,
      saleData,
      coinFountainRef
    }}>
      {children}
    </AuthContext.Provider>
  )
}
