import React, { createContext, useContext, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../services/supabase'
import type { Organization, LoyaltyTier } from '../types'
import { setCookie } from '../utils/cookies'

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

    // Save slug IMMEDIATELY using cookies (shared between browser and PWA)
    // This ensures it's saved before user installs PWA
    setCookie('omnily_org_slug', slug, 365)
    // Also keep localStorage for backwards compatibility
    localStorage.setItem('omnily_org_slug', slug)

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

      // Save slug to cookie AND localStorage for PWA
      if (slug) {
        setCookie('omnily_org_slug', slug, 365)
        localStorage.setItem('omnily_org_slug', slug)
        console.log('✅ Verify storage - Cookie:', document.cookie.includes('omnily_org_slug'), 'LocalStorage:', localStorage.getItem('omnily_org_slug'))
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

    console.log('🎨 Branding applied:', {
      primary: org.primary_color,
      secondary: org.secondary_color
    })
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
