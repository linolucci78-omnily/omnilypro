import React, { useEffect, useState } from 'react'
import { PublicWebsiteLayout } from '../components/PublicWebsite/PublicWebsiteLayout'
import { MaintenancePage } from '../components/PublicWebsite/MaintenancePage'
import { websiteService, OrganizationWebsite } from '../services/websiteService'

export const PublicWebsiteSubdomain: React.FC = () => {
  const [organization, setOrganization] = useState<OrganizationWebsite | null>(null)
  const [featuredRewards, setFeaturedRewards] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadWebsite()
  }, [])

  const loadWebsite = async () => {
    try {
      setLoading(true)

      // Get subdomain from hostname
      const hostname = window.location.hostname
      const subdomain = hostname.split('.')[0]

      console.log('🌐 Loading website for subdomain:', subdomain)

      if (!subdomain || subdomain === 'www' || subdomain === 'localhost' || subdomain === 'app' || subdomain === 'admin') {
        setError('Sottodominio non valido')
        setLoading(false)
        return
      }

      const data = await websiteService.getPublicWebsite(subdomain)

      if (!data) {
        setError('Sito non trovato')
        setLoading(false)
        return
      }

      setOrganization(data)

      // Load featured rewards if configured
      if (data.websiteConfig.website_featured_rewards && data.websiteConfig.website_featured_rewards.length > 0) {
        const rewards = await websiteService.getFeaturedRewards(
          data.id,
          data.websiteConfig.website_featured_rewards
        )
        setFeaturedRewards(rewards)
      }

      setLoading(false)
    } catch (err) {
      console.error('Error loading website:', err)
      setError('Errore nel caricamento del sito')
      setLoading(false)
    }
  }

  const handleContactSubmit = async (formData: any) => {
    if (!organization) return

    try {
      await websiteService.submitContactForm(organization.id, formData)
    } catch (error) {
      console.error('Error submitting contact form:', error)
      throw error
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-gray-900 mx-auto mb-4"></div>
          <p className="text-xl text-gray-700">Caricamento...</p>
        </div>
      </div>
    )
  }

  if (error || !organization) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-gray-800 mb-4">404</h1>
          <p className="text-2xl text-gray-600 mb-8">
            {error || 'Sito non trovato'}
          </p>
          <a
            href="/"
            className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Torna alla Home
          </a>
        </div>
      </div>
    )
  }

  // Show maintenance page if maintenance mode is enabled
  if (organization.websiteConfig.website_maintenance_mode) {
    return (
      <MaintenancePage
        organizationName={organization.name}
        message={organization.websiteConfig.website_maintenance_message}
        estimatedReturn={organization.websiteConfig.website_maintenance_until}
        logoUrl={organization.logo_url}
        primaryColor={organization.primary_color}
        secondaryColor={organization.secondary_color}
        email={organization.email}
        phone={organization.phone}
        address={organization.address}
      />
    )
  }

  return (
    <PublicWebsiteLayout
      organization={organization}
      featuredRewards={featuredRewards}
      onSubmitContact={handleContactSubmit}
    />
  )
}
