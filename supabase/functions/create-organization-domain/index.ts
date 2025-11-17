import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  organizationSlug: string
  organizationId: string
  vercelProjectId?: string
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🔧 Checking environment variables...')

    // Get environment variables
    const CLOUDFLARE_API_TOKEN = Deno.env.get('CLOUDFLARE_API_TOKEN')
    const CLOUDFLARE_ZONE_ID = Deno.env.get('CLOUDFLARE_ZONE_ID')
    const VERCEL_API_TOKEN = Deno.env.get('VERCEL_API_TOKEN')
    const VERCEL_PROJECT_ID = Deno.env.get('VERCEL_PROJECT_ID')
    const VERCEL_TEAM_ID = Deno.env.get('VERCEL_TEAM_ID')

    console.log('CLOUDFLARE_API_TOKEN:', CLOUDFLARE_API_TOKEN ? '✅ SET' : '❌ MISSING')
    console.log('CLOUDFLARE_ZONE_ID:', CLOUDFLARE_ZONE_ID ? '✅ SET' : '❌ MISSING')
    console.log('VERCEL_API_TOKEN:', VERCEL_API_TOKEN ? '✅ SET' : '❌ MISSING')
    console.log('VERCEL_PROJECT_ID:', VERCEL_PROJECT_ID ? '✅ SET' : '❌ MISSING')
    console.log('VERCEL_TEAM_ID:', VERCEL_TEAM_ID ? '✅ SET' : '❌ MISSING')

    if (!CLOUDFLARE_API_TOKEN || !CLOUDFLARE_ZONE_ID || !VERCEL_API_TOKEN) {
      const missing = []
      if (!CLOUDFLARE_API_TOKEN) missing.push('CLOUDFLARE_API_TOKEN')
      if (!CLOUDFLARE_ZONE_ID) missing.push('CLOUDFLARE_ZONE_ID')
      if (!VERCEL_API_TOKEN) missing.push('VERCEL_API_TOKEN')

      throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
    }

    // Parse request body
    const { organizationSlug, organizationId, vercelProjectId }: RequestBody = await req.json()

    if (!organizationSlug || !organizationId) {
      return new Response(
        JSON.stringify({ error: 'organizationSlug and organizationId are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`📝 Creating domain for organization: ${organizationSlug}`)

    // ========================================
    // STEP 1: Create DNS record on Cloudflare
    // ========================================
    console.log('🌐 Creating Cloudflare DNS record...')

    const cloudflareResponse = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/dns_records`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'CNAME',
          name: organizationSlug,
          content: '6dd8d5bf6768e14c.vercel-dns-017.com',
          ttl: 1, // Automatic
          proxied: false, // DNS Only (grigio)
        }),
      }
    )

    const cloudflareData = await cloudflareResponse.json()

    if (!cloudflareResponse.ok) {
      // Check if record already exists
      const errorMessage = cloudflareData.errors?.[0]?.message || ''

      if (errorMessage.includes('already exists')) {
        console.log('ℹ️  DNS record already exists on Cloudflare - skipping creation')
        // Continue anyway - we'll still add to Vercel and update DB
      } else {
        console.error('❌ Cloudflare error:', cloudflareData)
        throw new Error(`Cloudflare API error: ${errorMessage}`)
      }
    } else {
      console.log('✅ Cloudflare DNS record created:', cloudflareData.result?.id)
    }

    // ========================================
    // STEP 2: Add domain to Vercel project
    // ========================================
    console.log('🚀 Adding domain to Vercel...')

    const domain = `${organizationSlug}.omnilypro.com`
    const projectId = vercelProjectId || VERCEL_PROJECT_ID

    if (!projectId) {
      throw new Error('No Vercel project ID provided')
    }

    const vercelUrl = VERCEL_TEAM_ID
      ? `https://api.vercel.com/v10/projects/${projectId}/domains?teamId=${VERCEL_TEAM_ID}`
      : `https://api.vercel.com/v10/projects/${projectId}/domains`

    const vercelResponse = await fetch(vercelUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VERCEL_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: domain,
      }),
    })

    const vercelData = await vercelResponse.json()

    if (!vercelResponse.ok) {
      console.error('❌ Vercel error:', vercelData)

      // If domain already exists, that's okay
      if (vercelData.error?.code === 'domain_already_in_use' ||
          vercelData.error?.code === 'domain_already_exists') {
        console.log('ℹ️  Domain already exists on Vercel - skipping creation')
      } else {
        throw new Error(`Vercel API error: ${vercelData.error?.message || 'Unknown error'}`)
      }
    } else {
      console.log('✅ Vercel domain added:', domain)
    }

    // ========================================
    // STEP 3: Update organization in Supabase
    // ========================================
    console.log('💾 Updating organization in database...')

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { error: updateError } = await supabaseClient
      .from('organizations')
      .update({
        custom_domain: domain,
        updated_at: new Date().toISOString()
      })
      .eq('id', organizationId)

    if (updateError) {
      console.error('❌ Database update error:', updateError)
      throw updateError
    }

    console.log('✅ Organization updated in database')

    // ========================================
    // SUCCESS
    // ========================================
    return new Response(
      JSON.stringify({
        success: true,
        domain,
        cloudflareRecordId: cloudflareData.result.id,
        message: `Domain ${domain} created successfully!`,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('❌ Error:', error)
    return new Response(
      JSON.stringify({
        error: error.message || String(error),
        details: error.stack || 'No stack trace',
        success: false
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
