// Edge Function: send-campaign
// Invia campagne email in batch con rate limiting e retry logic
// Data: 2025-01-11

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_URL = 'https://api.resend.com/emails'
const BATCH_SIZE = 50 // Max email da processare per chiamata
const MAX_RETRY = 3 // Max tentativi per email fallita

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SendCampaignRequest {
  campaign_id: string
  batch_size?: number // Override batch size (default 50)
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const requestBody: SendCampaignRequest = await req.json()
    const { campaign_id, batch_size = BATCH_SIZE } = requestBody

    console.log('📧 Send Campaign Request:', { campaign_id, batch_size })

    if (!campaign_id) {
      throw new Error('Missing required field: campaign_id')
    }

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

    // 1. Carica campagna
    console.log('📋 Loading campaign:', campaign_id)
    const { data: campaign, error: campaignError } = await supabaseClient
      .from('email_campaigns')
      .select('*')
      .eq('id', campaign_id)
      .single()

    if (campaignError || !campaign) {
      throw new Error(`Campaign not found: ${campaign_id}`)
    }

    console.log('✅ Campaign loaded:', {
      name: campaign.name,
      status: campaign.status,
      total_recipients: campaign.total_recipients,
      sent_count: campaign.sent_count
    })

    // 2. Verifica stato campagna
    if (campaign.status === 'completed') {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Campaign already completed',
          campaign_id,
          stats: {
            total: campaign.total_recipients,
            sent: campaign.sent_count,
            failed: campaign.failed_count
          }
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      )
    }

    if (campaign.status === 'paused') {
      throw new Error('Campaign is paused')
    }

    // 3. Marca campagna come "sending" se era draft/scheduled
    if (campaign.status === 'draft' || campaign.status === 'scheduled') {
      await supabaseClient
        .from('email_campaigns')
        .update({
          status: 'sending',
          started_at: new Date().toISOString()
        })
        .eq('id', campaign_id)

      console.log('✅ Campaign status updated to: sending')
    }

    // 4. Carica email_settings dell'organizzazione
    console.log('📋 Loading email settings for org:', campaign.organization_id)
    const { data: settings, error: settingsError } = await supabaseClient
      .from('email_settings')
      .select('*')
      .eq('organization_id', campaign.organization_id)
      .single()

    let emailSettings
    if (settingsError || !settings) {
      // Fallback a settings globali
      const { data: globalSettingsList, error: globalError } = await supabaseClient
        .from('email_settings')
        .select('*')
        .is('organization_id', null)

      if (globalError || !globalSettingsList || globalSettingsList.length === 0) {
        throw new Error('No email settings found')
      }

      emailSettings = globalSettingsList.find((s: any) => s.resend_api_key) || globalSettingsList[0]
    } else {
      emailSettings = settings
    }

    if (!emailSettings.enabled) {
      throw new Error('Email service is disabled for this organization')
    }

    const resendApiKey = emailSettings.resend_api_key || Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      throw new Error('Resend API Key not configured')
    }

    // 5. Carica template
    console.log('📄 Loading template:', campaign.template_id)
    const { data: template, error: templateError } = await supabaseClient
      .from('email_templates')
      .select('*')
      .eq('id', campaign.template_id)
      .single()

    if (templateError || !template) {
      throw new Error(`Template not found: ${campaign.template_id}`)
    }

    console.log('✅ Template loaded:', template.name)

    // 6. Carica batch di recipient pending
    console.log(`📋 Loading batch of ${batch_size} pending recipients...`)
    const { data: recipients, error: recipientsError } = await supabaseClient
      .from('email_campaign_recipients')
      .select('*')
      .eq('campaign_id', campaign_id)
      .eq('status', 'pending')
      .limit(batch_size)

    if (recipientsError) {
      throw new Error(`Failed to load recipients: ${recipientsError.message}`)
    }

    if (!recipients || recipients.length === 0) {
      console.log('ℹ️ No pending recipients found')

      // Marca campagna come completed
      await supabaseClient
        .from('email_campaigns')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', campaign_id)

      return new Response(
        JSON.stringify({
          success: true,
          message: 'No pending recipients, campaign completed',
          campaign_id,
          processed: 0
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      )
    }

    console.log(`✅ Loaded ${recipients.length} pending recipients`)

    // 7. Invia email a tutti i recipient del batch
    let successCount = 0
    let failedCount = 0

    for (const recipient of recipients) {
      try {
        console.log(`📤 Sending to: ${recipient.email}`)

        // Prepara variabili dinamiche
        const dynamicData: Record<string, any> = {
          customer_name: recipient.name || 'Cliente',
          customer_email: recipient.email,
          organization_name: emailSettings.from_name,
          store_name: emailSettings.from_name,
          primary_color: emailSettings.primary_color,
          secondary_color: emailSettings.secondary_color,
          logo_url: emailSettings.logo_url || ''
        }

        // Costruisci HTML body
        let htmlBody: string
        let textBody = template.text_body || ''
        let subject = campaign.subject // Usa l'oggetto della campagna

        // Se c'è custom_content, costruisci email con layout template + contenuto personalizzato
        if (campaign.custom_content && campaign.custom_content.trim().length > 0) {
          // Sostituisci variabili nel custom content
          let customContent = campaign.custom_content
          Object.keys(dynamicData).forEach(key => {
            const regex = new RegExp(`{{${key}}}`, 'g')
            const value = String(dynamicData[key] || '')
            customContent = customContent.replace(regex, value)
          })

          // Carica dati organizzazione per footer
          const { data: orgData } = await supabaseClient
            .from('organizations')
            .select('name, email, phone, address, website, logo_url')
            .eq('id', campaign.organization_id)
            .single()

          // Costruisci HTML completo con layout
          htmlBody = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    <!-- Header -->
    <div style="background: ${dynamicData.primary_color}; color: white; padding: 30px; text-align: center;">
      ${orgData?.logo_url ? `<img src="${orgData.logo_url}" alt="${dynamicData.organization_name}" style="max-width: 150px; max-height: 80px; margin-bottom: 16px; object-fit: contain;">` : `<h2 style="margin: 0; font-size: 28px; font-weight: 700;">${dynamicData.organization_name}</h2>`}
    </div>

    <!-- Content -->
    <div style="background: white; padding: 40px 30px; font-size: 16px; line-height: 1.8; color: #374151;">
      ${customContent.replace(/\n/g, '<br>')}
    </div>

    <!-- Footer -->
    <div style="background: #f9fafb; padding: 30px; text-align: center; border-top: 2px solid #e5e7eb; font-size: 14px; color: #6b7280;">
      <p style="margin: 0 0 8px 0;"><strong>${orgData?.name || dynamicData.organization_name}</strong></p>
      ${orgData?.address ? `<p style="margin: 0 0 4px 0;">${orgData.address}</p>` : ''}
      ${orgData?.phone ? `<p style="margin: 0 0 4px 0;">Tel: ${orgData.phone}</p>` : ''}
      ${orgData?.email ? `<p style="margin: 0 0 4px 0;">Email: ${orgData.email}</p>` : ''}
      ${orgData?.website ? `<p style="margin: 0 0 4px 0;">Web: ${orgData.website}</p>` : ''}
      <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
        <p style="margin: 0; font-size: 12px; color: #9ca3af;">
          Hai ricevuto questa email perché sei registrato al nostro programma fedeltà
        </p>
      </div>
    </div>
  </div>
</body>
</html>`

          // Text body dal custom content
          textBody = customContent.replace(/<br>/g, '\n')
        } else {
          // Usa template standard
          htmlBody = template.html_body
          textBody = template.text_body || ''

          Object.keys(dynamicData).forEach(key => {
            const regex = new RegExp(`{{${key}}}`, 'g')
            const value = String(dynamicData[key] || '')
            htmlBody = htmlBody.replace(regex, value)
            textBody = textBody.replace(regex, value)
          })
        }

        // Sostituisci variabili nell'oggetto
        Object.keys(dynamicData).forEach(key => {
          const regex = new RegExp(`{{${key}}}`, 'g')
          const value = String(dynamicData[key] || '')
          subject = subject.replace(regex, value)
        })

        // Invia via Resend
        const resendPayload = {
          from: `${emailSettings.from_name} <${emailSettings.from_email}>`,
          to: [recipient.email],
          subject: subject,
          html: htmlBody,
          ...(textBody && { text: textBody }),
          ...(emailSettings.reply_to_email && { reply_to: emailSettings.reply_to_email })
        }

        const resendResponse = await fetch(RESEND_API_URL, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(resendPayload),
        })

        const resendData = await resendResponse.json()

        if (!resendResponse.ok) {
          throw new Error(`Resend API error: ${JSON.stringify(resendData)}`)
        }

        console.log(`✅ Email sent to ${recipient.email}:`, resendData.id)

        // Log invio nel database
        const { data: emailLog } = await supabaseClient.from('email_logs').insert({
          organization_id: campaign.organization_id,
          template_id: template.id,
          template_type: campaign.template_type,
          to_email: recipient.email,
          to_name: recipient.name,
          subject: subject,
          from_email: emailSettings.from_email,
          from_name: emailSettings.from_name,
          status: 'sent',
          resend_email_id: resendData.id,
          sent_at: new Date().toISOString(),
          payload: dynamicData,
        }).select().single()

        // Aggiorna recipient status a 'sent'
        await supabaseClient
          .from('email_campaign_recipients')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
            email_log_id: emailLog?.id || null
          })
          .eq('id', recipient.id)

        // Incrementa counter giornaliero
        await supabaseClient.rpc('increment_email_counter', {
          org_id: campaign.organization_id
        })

        successCount++

        // Rate limiting: pausa 100ms tra un invio e l'altro
        await new Promise(resolve => setTimeout(resolve, 100))

      } catch (error: any) {
        console.error(`❌ Failed to send to ${recipient.email}:`, error.message)

        // Incrementa retry count
        const newRetryCount = (recipient.retry_count || 0) + 1

        // Se supera MAX_RETRY, marca come failed definitivamente
        const newStatus = newRetryCount >= MAX_RETRY ? 'failed' : 'pending'

        await supabaseClient
          .from('email_campaign_recipients')
          .update({
            status: newStatus,
            retry_count: newRetryCount,
            error_message: error.message
          })
          .eq('id', recipient.id)

        failedCount++
      }
    }

    console.log('🎉 Batch processing completed:', {
      success: successCount,
      failed: failedCount,
      total: recipients.length
    })

    // 8. Aggiorna statistiche campagna (trigger automatico)
    // Trigger update_campaign_stats si occupa di aggiornare le stats

    // 9. Controlla se campagna è completata
    const { data: remainingRecipients } = await supabaseClient
      .from('email_campaign_recipients')
      .select('id', { count: 'exact', head: true })
      .eq('campaign_id', campaign_id)
      .eq('status', 'pending')

    const hasMorePending = (remainingRecipients as any)?.count > 0

    console.log(`📊 Remaining pending recipients: ${(remainingRecipients as any)?.count || 0}`)

    // Risposta successo
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Batch processed successfully',
        campaign_id,
        processed: recipients.length,
        success_count: successCount,
        failed_count: failedCount,
        has_more_pending: hasMorePending,
        stats: {
          sent: campaign.sent_count + successCount,
          failed: campaign.failed_count + failedCount,
          total: campaign.total_recipients
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error: any) {
    console.error('❌ Error sending campaign:', error)

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
