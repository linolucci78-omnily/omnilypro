// Supabase Edge Function: Update User Password
// Aggiorna la password di un utente usando Service Role Key

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface UpdatePasswordRequest {
  userId: string
  newPassword: string
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🔵 Update password function called')

    // Get request body
    const { userId, newPassword }: UpdatePasswordRequest = await req.json()

    console.log('📥 Received request:', { userId, passwordLength: newPassword?.length })

    // Validate input
    if (!userId || !newPassword) {
      throw new Error('Missing required fields: userId, newPassword')
    }

    console.log('✅ Validation passed')

    // Create Supabase client with Service Role Key (has admin privileges)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    const supabaseAdmin = createClient(
      supabaseUrl ?? '',
      supabaseKey ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    console.log('🔐 Updating password for user:', userId)

    // Update user password
    const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    )

    if (updateError) {
      console.error('❌ Password update error:', updateError)
      throw new Error(`Password update failed: ${updateError.message || JSON.stringify(updateError)}`)
    }

    console.log('✅ Password updated successfully for user:', userId)

    return new Response(
      JSON.stringify({
        success: true,
        userId: updatedUser.user.id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('❌ Function error:', error)

    // ⚠️ IMPORTANTE: Ritorna sempre status 200 anche in caso di errore
    // perché il client Supabase scarta il body se status !== 2xx
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Unknown error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  }
})
