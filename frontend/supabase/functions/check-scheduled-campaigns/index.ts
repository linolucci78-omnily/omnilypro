// Edge Function: check-scheduled-campaigns
// Controlla campagne scheduled e avvia invio se scheduled_for <= NOW()
// Da chiamare periodicamente tramite cron job
// Data: 2025-01-12

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('⏰ Checking for scheduled campaigns...')

    // Initialize Supabase client con Service Role Key (bypass RLS)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Query campagne scheduled con scheduled_for <= NOW()
    const { data: campaigns, error: campaignsError } = await supabaseClient
      .from('email_campaigns')
      .select('id, name, scheduled_for, organization_id')
      .eq('status', 'scheduled')
      .lte('scheduled_for', new Date().toISOString())
      .order('scheduled_for', { ascending: true })

    if (campaignsError) {
      throw new Error(`Failed to query campaigns: ${campaignsError.message}`)
    }

    if (!campaigns || campaigns.length === 0) {
      console.log('ℹ️ No scheduled campaigns found')
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No scheduled campaigns to process',
          processed: 0
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      )
    }

    console.log(`✅ Found ${campaigns.length} scheduled campaign(s) ready to send`)

    const results = []

    // Process each campaign
    for (const campaign of campaigns) {
      try {
        console.log(`📧 Processing campaign: ${campaign.name} (${campaign.id})`)
        console.log(`   Scheduled for: ${campaign.scheduled_for}`)

        // Chiama send-campaign function per avviare invio
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
        const sendResponse = await fetch(`${supabaseUrl}/functions/v1/send-campaign`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          },
          body: JSON.stringify({
            campaign_id: campaign.id,
            batch_size: 50
          })
        })

        const sendData = await sendResponse.json()

        if (!sendResponse.ok) {
          throw new Error(`Send campaign failed: ${JSON.stringify(sendData)}`)
        }

        console.log(`✅ Campaign ${campaign.id} started successfully`)

        results.push({
          campaign_id: campaign.id,
          campaign_name: campaign.name,
          success: true,
          message: sendData.message || 'Campaign started'
        })

      } catch (error: any) {
        console.error(`❌ Failed to process campaign ${campaign.id}:`, error.message)

        results.push({
          campaign_id: campaign.id,
          campaign_name: campaign.name,
          success: false,
          error: error.message
        })

        // Marca campagna come failed
        await supabaseClient
          .from('email_campaigns')
          .update({
            status: 'failed',
            error_message: error.message
          })
          .eq('id', campaign.id)
      }
    }

    console.log('🎉 Scheduled campaigns check completed')

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${campaigns.length} scheduled campaign(s)`,
        processed: campaigns.length,
        results: results
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error: any) {
    console.error('❌ Error checking scheduled campaigns:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
