import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Webhook } from 'https://esm.sh/svix@1.15.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, svix-id, svix-timestamp, svix-signature',
}

interface ResendWebhookEvent {
  type: string
  created_at: string
  data: {
    email_id: string
    from: string
    to: string[]
    subject: string
    created_at?: string
    // Additional fields depending on event type
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('📨 Received Resend webhook')

    // Get the raw body for signature verification
    const body = await req.text()

    // Get Svix headers for verification
    const svixId = req.headers.get('svix-id')
    const svixTimestamp = req.headers.get('svix-timestamp')
    const svixSignature = req.headers.get('svix-signature')

    if (!svixId || !svixTimestamp || !svixSignature) {
      console.error('❌ Missing Svix headers')
      return new Response(
        JSON.stringify({ error: 'Missing Svix headers' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify webhook signature
    const webhookSecret = Deno.env.get('RESEND_WEBHOOK_SECRET')

    if (!webhookSecret) {
      console.error('❌ RESEND_WEBHOOK_SECRET not configured')
      return new Response(
        JSON.stringify({ error: 'Webhook secret not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const wh = new Webhook(webhookSecret)

    let event: ResendWebhookEvent

    try {
      event = wh.verify(body, {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      }) as ResendWebhookEvent

      console.log('✅ Webhook signature verified')
    } catch (err) {
      console.error('❌ Webhook signature verification failed:', err)
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('📋 Event type:', event.type)
    console.log('📧 Email ID:', event.data.email_id)

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Find the email log entry by resend_email_id
    const { data: emailLog, error: findError } = await supabaseClient
      .from('email_logs')
      .select('*')
      .eq('resend_email_id', event.data.email_id)
      .single()

    if (findError || !emailLog) {
      console.warn('⚠️ Email log not found for Resend ID:', event.data.email_id)
      // Return 200 anyway so Resend doesn't retry
      return new Response(
        JSON.stringify({ received: true, warning: 'Email log not found' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('✅ Found email log:', emailLog.id)

    // Prepare update data based on event type
    const updateData: any = {
      last_event: event.type,
      updated_at: new Date().toISOString()
    }

    switch (event.type) {
      case 'email.sent':
        console.log('📤 Email sent')
        updateData.status = 'sent'
        break

      case 'email.delivered':
        console.log('✅ Email delivered')
        updateData.status = 'delivered'
        updateData.delivered_at = event.created_at
        break

      case 'email.delivery_delayed':
        console.log('⏱️ Email delivery delayed')
        updateData.status = 'delayed'
        break

      case 'email.bounced':
        console.log('❌ Email bounced')
        updateData.status = 'bounced'
        updateData.bounced_at = event.created_at
        break

      case 'email.complained':
        console.log('⚠️ Email marked as spam')
        updateData.status = 'complained'
        updateData.complained_at = event.created_at
        break

      case 'email.opened':
        console.log('👀 Email opened')
        // Only set opened_at on first open
        if (!emailLog.opened_at) {
          updateData.opened_at = event.created_at
        }
        // Increment open count
        updateData.open_count = (emailLog.open_count || 0) + 1
        break

      case 'email.clicked':
        console.log('🖱️ Email link clicked')
        // Only set clicked_at on first click
        if (!emailLog.clicked_at) {
          updateData.clicked_at = event.created_at
        }
        // Increment click count
        updateData.click_count = (emailLog.click_count || 0) + 1
        break

      case 'email.received':
        console.log('📥 Email received by server')
        updateData.status = 'received'
        break

      case 'email.failed':
        console.log('💥 Email failed to send')
        updateData.status = 'failed'
        break

      case 'email.scheduled':
        console.log('📅 Email scheduled for later')
        updateData.status = 'scheduled'
        break

      default:
        console.log('ℹ️ Unknown event type:', event.type)
    }

    // Update the email log
    const { error: updateError } = await supabaseClient
      .from('email_logs')
      .update(updateData)
      .eq('id', emailLog.id)

    if (updateError) {
      console.error('❌ Error updating email log:', updateError)
      throw updateError
    }

    console.log('✅ Email log updated successfully')

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Webhook processed successfully',
        event_type: event.type,
        email_id: event.data.email_id
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('❌ Error processing webhook:', error)
    return new Response(
      JSON.stringify({
        error: error.message || String(error),
        success: false
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
