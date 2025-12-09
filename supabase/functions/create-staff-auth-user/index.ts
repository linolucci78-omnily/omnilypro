// Supabase Edge Function: Create Staff Auth User
// Crea account auth.users per staff members usando Service Role Key

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateStaffAuthRequest {
  email: string
  password: string
  fullName: string
  organizationId: string
  isPosOnly: boolean
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get request body
    const { email, password, fullName, organizationId, isPosOnly }: CreateStaffAuthRequest = await req.json()

    // Validate input
    if (!email || !password || !fullName || !organizationId) {
      throw new Error('Missing required fields: email, password, fullName, organizationId')
    }

    // Create Supabase client with Service Role Key (has admin privileges)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    console.log('Creating auth user:', email)

    // Create auth user
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm
      user_metadata: {
        full_name: fullName,
        organization_id: organizationId,
        is_pos_only: isPosOnly
      }
    })

    if (authError) {
      console.error('Auth creation error:', authError)
      throw authError
    }

    console.log('Auth user created successfully:', authUser.user.id)

    return new Response(
      JSON.stringify({
        success: true,
        userId: authUser.user.id,
        email: authUser.user.email
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Function error:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Unknown error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
