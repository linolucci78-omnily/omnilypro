import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailRequest {
  to: string
  subject: string
  html: string
  from?: string
  organizationId?: string
}

serve(async (req: Request) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse request body
    const { to, subject, html, from, organizationId }: EmailRequest = await req.json()

    // Validate required fields
    if (!to || !subject || !html) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, subject, html' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('📧 Sending email to:', to, 'Subject:', subject)

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get email settings from database
    let query = supabase
      .from('email_settings')
      .select('*')
      .eq('enabled', true)

    // Try organization-specific settings first, fallback to global
    if (organizationId) {
      query = query.eq('organization_id', organizationId)
    } else {
      query = query.is('organization_id', null)
    }

    const { data: settings, error: settingsError } = await query.limit(1).single()

    if (settingsError || !settings) {
      console.error('❌ Email settings not found:', settingsError)
      return new Response(
        JSON.stringify({ error: 'Email settings not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!settings.resend_api_key) {
      console.error('❌ Resend API key not found in settings')
      return new Response(
        JSON.stringify({ error: 'Resend API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Prepare email data for Resend
    const fromEmail = from || settings.from_email
    const fromName = settings.from_name || 'OMNILY PRO'

    const emailData = {
      from: `${fromName} <${fromEmail}>`,
      to: [to],
      subject: subject,
      html: html,
      reply_to: settings.reply_to_email || fromEmail
    }

    console.log('📤 Sending via Resend:', { to: emailData.to, from: emailData.from })

    // Send email via Resend API
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${settings.resend_api_key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailData)
    })

    const resendData = await resendResponse.json()

    if (!resendResponse.ok) {
      console.error('❌ Resend API error:', resendData)

      // Log failed email
      await supabase.from('email_logs').insert({
        organization_id: organizationId || null,
        to_email: to,
        from_email: fromEmail,
        subject: subject,
        status: 'failed',
        error_message: JSON.stringify(resendData),
        sent_at: new Date().toISOString()
      })

      return new Response(
        JSON.stringify({ error: 'Failed to send email', details: resendData }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('✅ Email sent successfully! Resend ID:', resendData.id)

    // Log successful email
    await supabase.from('email_logs').insert({
      organization_id: organizationId || null,
      to_email: to,
      from_email: fromEmail,
      subject: subject,
      status: 'sent',
      resend_email_id: resendData.id,
      sent_at: new Date().toISOString()
    })

    return new Response(
      JSON.stringify({
        success: true,
        emailId: resendData.id,
        message: 'Email sent successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('❌ Error in send-email function:', errorMessage)

    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
