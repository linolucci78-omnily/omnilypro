import React, { createContext, useContext, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../services/supabase'
import type { Organization, LoyaltyTier } from '../types'

interface OrganizationContextType {
  organization: Organization | null
  loyaltyTiers: LoyaltyTier[]
  loading: boolean
  error: string | null
}

const OrganizationContext = createContext<OrganizationContextType>({
  organization: null,
  loyaltyTiers: [],
  loading: true,
  error: null
})

export const useOrganization = () => useContext(OrganizationContext)

interface OrganizationProviderProps {
  children: React.ReactNode
}

export const OrganizationProvider: React.FC<OrganizationProviderProps> = ({ children }) => {
  const { slug } = useParams<{ slug: string }>()
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [loyaltyTiers, setLoyaltyTiers] = useState<LoyaltyTier[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) {
      setError('Organization slug is missing')
      setLoading(false)
      return
    }

    loadOrganization()
  }, [slug])

  const loadOrganization = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('🔍 Loading organization:', slug)

      // Load organization by slug
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('slug', slug)
        .single()

      if (orgError) throw orgError
      if (!orgData) throw new Error('Organization not found')

      console.log('✅ Organization loaded:', orgData.name)

      setOrganization(orgData)

      // Save slug to localStorage for PWA
      if (slug) {
        localStorage.setItem('omnily_org_slug', slug)
        console.log('💾 Slug saved to localStorage:', slug)
        console.log('✅ Verify localStorage:', localStorage.getItem('omnily_org_slug'))
      }

      // Load loyalty tiers for this organization
      const tiers = orgData.loyalty_tiers as LoyaltyTier[] || []
      setLoyaltyTiers(tiers)

      // Apply branding CSS variables
      applyBranding(orgData)

    } catch (err: any) {
      console.error('❌ Error loading organization:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const applyBranding = (org: Organization) => {
    const root = document.documentElement

    // Apply CSS variables for dynamic branding
    root.style.setProperty('--primary', org.primary_color)
    root.style.setProperty('--secondary', org.secondary_color)

    // Update theme color meta tag for browser chrome
    const themeColorMeta = document.querySelector('meta[name="theme-color"]')
    if (themeColorMeta) {
      themeColorMeta.setAttribute('content', org.primary_color)
    }

    // Update title
    document.title = `${org.name} - Loyalty App`

    // Update PWA manifest with organization slug
    updateManifest(org)

    console.log('🎨 Branding applied:', {
      primary: org.primary_color,
      secondary: org.secondary_color
    })
  }

  const updateManifest = (org: Organization) => {
    // Remove existing manifest link
    const existingManifest = document.querySelector('link[rel="manifest"]')
    if (existingManifest) {
      existingManifest.remove()
    }

    // Create dynamic manifest
    const manifest = {
      name: `${org.name} - Loyalty`,
      short_name: org.name,
      description: 'Your loyalty card, always with you',
      theme_color: org.primary_color,
      background_color: '#ffffff',
      display: 'standalone',
      orientation: 'portrait',
      scope: '/',
      start_url: `/${slug}`,
      icons: [
        {
          src: org.logo_url || '/pwa-192x192.png',
          sizes: '192x192',
          type: 'image/png'
        },
        {
          src: org.logo_url || '/pwa-512x512.png',
          sizes: '512x512',
          type: 'image/png'
        },
        {
          src: org.logo_url || '/pwa-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any maskable'
        }
      ]
    }

    // Create blob URL for manifest
    const manifestBlob = new Blob([JSON.stringify(manifest)], { type: 'application/json' })
    const manifestURL = URL.createObjectURL(manifestBlob)

    // Add new manifest link
    const manifestLink = document.createElement('link')
    manifestLink.rel = 'manifest'
    manifestLink.href = manifestURL
    document.head.appendChild(manifestLink)

    console.log('📱 PWA Manifest updated with start_url:', `/${slug}`)
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f4f6',
            borderTopColor: '#3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          <p style={{ color: '#6b7280' }}>Caricamento...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '2rem',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{ textAlign: 'center', maxWidth: '400px' }}>
          <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>😕</h1>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: '#1f2937' }}>
            Organization Not Found
          </h2>
          <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
            {error}
          </p>
          <p style={{ fontSize: '0.875rem', color: '#9ca3af' }}>
            Please check the URL and try again
          </p>
        </div>
      </div>
    )
  }

  return (
    <OrganizationContext.Provider value={{ organization, loyaltyTiers, loading, error }}>
      {children}
    </OrganizationContext.Provider>
  )
}
