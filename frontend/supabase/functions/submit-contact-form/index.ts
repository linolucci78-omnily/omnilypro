import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get request body
    const { organizationId, name, email, phone, message } = await req.json()

    // Validate input
    if (!organizationId || !name || !email || !message) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase client with SERVICE ROLE (bypasses RLS)
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

    // Insert contact form submission (bypasses RLS)
    const { data: submission, error: submissionError } = await supabaseAdmin
      .from('contact_form_submissions')
      .insert({
        organization_id: organizationId,
        name: name,
        email: email,
        phone: phone || null,
        message: message,
        submitted_at: new Date().toISOString(),
        status: 'new'
      })
      .select()
      .single()

    if (submissionError) {
      console.error('❌ Error inserting contact form:', submissionError)
      return new Response(
        JSON.stringify({ error: submissionError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('✅ Contact form submission created:', submission.id)

    // Get organization details for email notification
    const { data: org, error: orgError } = await supabaseAdmin
      .from('organizations')
      .select('name, website_contact_form_email, email')
      .eq('id', organizationId)
      .single()

    if (orgError) {
      console.error('⚠️ Could not load organization for email:', orgError)
    }

    // TODO: Send email notification here if needed
    // For now, just return success

    return new Response(
      JSON.stringify({
        success: true,
        submissionId: submission.id,
        message: 'Contact form submitted successfully'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('❌ Exception in submit-contact-form:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
