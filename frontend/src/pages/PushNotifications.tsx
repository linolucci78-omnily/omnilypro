import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import PushNotificationsHub from '../components/PushNotificationsHub'

export default function PushNotifications() {
  const { user } = useAuth()
  const [organization, setOrganization] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  // Get organization data from user's organization_users
  useEffect(() => {
    const fetchOrganization = async () => {
      if (!user) return

      try {
        // Get user's organization
        const { data: orgUser, error: orgUserError } = await supabase
          .from('organization_users')
          .select('org_id')
          .eq('user_id', user.id)
          .single()

        if (orgUserError || !orgUser) {
          console.error('Error fetching organization user:', orgUserError)
          setLoading(false)
          return
        }

        // Get full organization data
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', orgUser.org_id)
          .single()

        if (orgError || !orgData) {
          console.error('Error fetching organization:', orgError)
          setLoading(false)
          return
        }

        setOrganization(orgData)
        setLoading(false)
      } catch (error) {
        console.error('Error loading organization:', error)
        setLoading(false)
      }
    }

    fetchOrganization()
  }, [user])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Caricamento...</p>
        </div>
      </div>
    )
  }

  if (!organization) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <svg className="w-16 h-16 text-red-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Organizzazione Non Trovata</h2>
          <p className="text-gray-600">
            Non è stata trovata un'organizzazione associata al tuo account.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen overflow-hidden">
      <PushNotificationsHub
        organizationId={organization.id}
        organizationName={organization.name}
        primaryColor={organization.primary_color || '#ef4444'}
        secondaryColor={organization.secondary_color || '#dc2626'}
      />
    </div>
  )
}
