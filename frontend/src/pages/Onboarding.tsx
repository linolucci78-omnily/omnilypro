import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { organizationsApi } from '../lib/supabase'
import EnterpriseWizard from '../components/Onboarding/EnterpriseWizard'
import Dashboard from './Dashboard'

const Onboarding: React.FC = () => {
  const { user } = useAuth()
  const [hasOrganizations, setHasOrganizations] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkUserOrganizations()
  }, [user])

  const checkUserOrganizations = async () => {
    if (!user) return

    try {
      setLoading(true)
      
      // Check if user has any organizations
      // For now, we'll check if there are any organizations in the system
      // Later we'll add user-organization relationships
      const organizations = await organizationsApi.getAll()
      
      // For demo: if user email matches organization domain, show dashboard
      // Otherwise show onboarding
      const userDomain = user.email?.split('@')[1]
      const hasMatchingOrg = organizations.some(org => 
        org.slug.includes(user.email?.split('@')[0] || '') ||
        org.domain === userDomain
      )
      
      // TEMP: Force Magic Wizard for testing - change to hasMatchingOrg later
      setHasOrganizations(false)
    } catch (error) {
      console.error('Error checking organizations:', error)
      setHasOrganizations(false)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner">🔄</div>
        <p>Verificando il tuo profilo...</p>
      </div>
    )
  }

  // If user has organizations, show normal dashboard
  if (hasOrganizations) {
    return <Dashboard />
  }

  // If new user without organizations, show Enterprise Wizard
  return <EnterpriseWizard />
}

export default Onboarding