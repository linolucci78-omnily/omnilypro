
// supabase/functions/xogo-trigger/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.0.0"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { orgId, customerId, triggerType } = await req.json()

        console.log(`📡 XOGO REQUEST: ${triggerType} for Customer ${customerId} at Org ${orgId}`)

        // 1. Fetch Org Config to get Xogo API Key & Player ID
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { data: orgConfig, error: configError } = await supabaseClient
            .from('integrations_xogo')
            .select('*')
            .eq('org_id', orgId)
            .single()

        if (!orgConfig || configError) {
            // Fallback or Error (Maybe Xogo not configured)
            console.log('⚠️ Xogo not configured for this org.')
            return new Response(JSON.stringify({ error: 'Xogo not configured' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400
            })
        }

        // 2. Fetch Customer Info
        const { data: customer } = await supabaseClient
            .from('customers')
            .select('first_name, last_name, points_balance, current_tier')
            .eq('id', customerId)
            .single()

        if (!customer) throw new Error('Customer not found')

        // 3. Call Xogo Realtime API
        const xogoResponse = await fetch(`https://manager.xogo.io/api/players/${orgConfig.player_id}/realtime`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${orgConfig.api_key}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                // In a real scenario, we might trigger a specific Content ID that is a dynamic URL
                // Or we trigger a generic "Welcome" asset
                contentId: orgConfig.welcome_content_id,
                interrupt: true
            })
        })

        if (!xogoResponse.ok) {
            throw new Error(`Xogo API Error: ${xogoResponse.statusText}`)
        }

        return new Response(JSON.stringify({ success: true, message: 'TV Triggered' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        })
    }
})
