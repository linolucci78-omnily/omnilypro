import { supabase } from '../lib/supabase'

export interface CreateDomainResult {
  success: boolean
  domain?: string
  cloudflareRecordId?: string
  message?: string
  error?: string
}

/**
 * Crea automaticamente un sottodominio per un'organizzazione
 * - Crea record DNS su Cloudflare
 * - Aggiunge dominio su Vercel
 * - Aggiorna database Supabase
 */
export async function createOrganizationDomain(
  organizationSlug: string,
  organizationId: string
): Promise<CreateDomainResult> {
  try {
    console.log(`🚀 Creating domain for ${organizationSlug}...`)

    // Chiama la Edge Function
    const response = await supabase.functions.invoke('create-organization-domain', {
      body: {
        organizationSlug,
        organizationId
      }
    })

    console.log('📦 Full response:', response)

    // Se c'è un errore nella risposta HTTP
    if (response.error) {
      console.error('❌ Edge Function error:', response.error)

      // Prova a leggere i dettagli dall'errore
      return {
        success: false,
        error: response.error.message || 'Edge Function error',
        message: JSON.stringify(response.error)
      }
    }

    const data = response.data

    if (!data) {
      return {
        success: false,
        error: 'No data received from Edge Function'
      }
    }

    if (!data.success) {
      console.error('❌ Domain creation failed:', data.error)
      console.error('📋 Error details:', data.details)
      return {
        success: false,
        error: data.error || 'Failed to create domain',
        message: data.details || data.message
      }
    }

    console.log(`✅ Domain created successfully: ${data.domain}`)

    return {
      success: true,
      domain: data.domain,
      cloudflareRecordId: data.cloudflareRecordId,
      message: data.message
    }

  } catch (error: any) {
    console.error('❌ Error creating domain:', error)
    return {
      success: false,
      error: error.message || 'Unknown error occurred'
    }
  }
}

/**
 * Verifica se un dominio è già configurato
 */
export async function checkDomainStatus(domain: string): Promise<{
  configured: boolean
  vercelStatus?: string
}> {
  try {
    // Verifica DNS
    const dnsCheck = await fetch(`https://dns.google/resolve?name=${domain}&type=CNAME`)
    const dnsData = await dnsCheck.json()

    const configured = dnsData.Answer?.some((a: any) =>
      a.data?.includes('vercel-dns')
    ) || false

    return { configured }
  } catch (error) {
    console.error('Error checking domain status:', error)
    return { configured: false }
  }
}
