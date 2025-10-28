// Edge Function: send-email
// Invia email usando Resend API con template personalizzati

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Handlebars from 'https://esm.sh/handlebars@4.7.8'

const RESEND_API_URL = 'https://api.resend.com/emails'

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailRequest {
  organization_id: string
  template_type: string // 'receipt', 'welcome', 'notification', ecc.
  to_email: string
  to_name?: string
  dynamic_data: Record<string, any> // Dati per sostituire variabili nel template
}

interface EmailSettings {
  resend_api_key: string | null
  from_name: string
  from_email: string
  reply_to_email: string | null
  primary_color: string
  secondary_color: string
  logo_url: string | null
  enabled: boolean
  emails_sent_today: number
  daily_limit: number
}

interface EmailTemplate {
  id: string
  subject: string
  html_body: string
  text_body: string | null
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse request body
    const requestBody: EmailRequest = await req.json()
    const { organization_id, template_type, to_email, to_name, dynamic_data } = requestBody

    console.log('📧 Send Email Request:', {
      organization_id,
      template_type,
      to_email,
      to_name
    })

    // Validate required fields
    if (!organization_id || !template_type || !to_email) {
      throw new Error('Missing required fields: organization_id, template_type, to_email')
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

    // 1. Carica email_settings dell'organizzazione
    console.log('📋 Loading email settings for org:', organization_id)
    const { data: settings, error: settingsError } = await supabaseClient
      .from('email_settings')
      .select('*')
      .eq('organization_id', organization_id)
      .single()

    let emailSettings: EmailSettings

    if (settingsError || !settings) {
      // Fallback a settings globali
      console.log('⚠️ Org settings not found, using global settings')
      const { data: globalSettingsList, error: globalError } = await supabaseClient
        .from('email_settings')
        .select('*')
        .is('organization_id', null)

      if (globalError || !globalSettingsList || globalSettingsList.length === 0) {
        throw new Error('No email settings found (neither org nor global)')
      }

      // Priorità: settings con API Key configurata
      const settingsWithKey = globalSettingsList.find((s: EmailSettings) => s.resend_api_key)
      emailSettings = settingsWithKey || globalSettingsList[0]

      console.log('✅ Using global settings:', {
        from_email: emailSettings.from_email,
        has_api_key: !!emailSettings.resend_api_key
      })
    } else {
      emailSettings = settings
    }

    console.log('✅ Email settings loaded:', {
      from_name: emailSettings.from_name,
      from_email: emailSettings.from_email,
      enabled: emailSettings.enabled,
      daily_limit: emailSettings.daily_limit,
      sent_today: emailSettings.emails_sent_today
    })

    // 2. Verifica se email service è abilitato
    if (!emailSettings.enabled) {
      throw new Error('Email service is disabled for this organization')
    }

    // 3. Verifica limite giornaliero
    if (emailSettings.emails_sent_today >= emailSettings.daily_limit) {
      throw new Error(`Daily email limit reached: ${emailSettings.daily_limit}`)
    }

    // 4. Carica template
    console.log('📄 Loading template:', template_type)
    const { data: template, error: templateError } = await supabaseClient
      .from('email_templates')
      .select('*')
      .eq('organization_id', organization_id)
      .eq('template_type', template_type)
      .eq('is_active', true)
      .single()

    let emailTemplate: EmailTemplate

    if (templateError || !template) {
      // Fallback a template globale
      console.log('⚠️ Org template not found, using global template')
      const { data: globalTemplates, error: globalTemplateError } = await supabaseClient
        .from('email_templates')
        .select('*')
        .is('organization_id', null)
        .eq('template_type', template_type)
        .eq('is_active', true)
        .order('is_default', { ascending: false })
        .limit(1)

      if (globalTemplateError || !globalTemplates || globalTemplates.length === 0) {
        throw new Error(`Template not found: ${template_type}`)
      }

      emailTemplate = globalTemplates[0]
    } else {
      emailTemplate = template
    }

    console.log('✅ Template loaded:', emailTemplate.id)

    // 5. Sostituisci variabili nel template con Handlebars
    console.log('🔄 Replacing template variables with Handlebars...')

    // Aggiungi colori del branding alle variabili
    const allVariables = {
      ...dynamic_data,
      primary_color: emailSettings.primary_color,
      secondary_color: emailSettings.secondary_color,
      logo_url: emailSettings.logo_url || ''
    }

    console.log('📊 Template variables:', Object.keys(allVariables))

    // Compila i template con Handlebars
    const subjectTemplate = Handlebars.compile(emailTemplate.subject)
    const htmlTemplate = Handlebars.compile(emailTemplate.html_body)
    const textTemplate = Handlebars.compile(emailTemplate.text_body || '')

    // Applica le variabili
    const subject = subjectTemplate(allVariables)
    const html_body = htmlTemplate(allVariables)
    const text_body = textTemplate(allVariables)

    console.log('✅ Variables replaced with Handlebars')

    // 6. Ottieni API Key Resend (org o globale)
    const resendApiKey = emailSettings.resend_api_key || Deno.env.get('RESEND_API_KEY')

    if (!resendApiKey) {
      throw new Error('Resend API Key not configured')
    }

    // 7. Invia email via Resend
    console.log('📤 Sending email via Resend...')

    // Check if qr_code_url is a data URL and convert to attachment
    const attachments: any[] = []
    let finalHtmlBody = html_body

    if (dynamic_data.qr_code_url && dynamic_data.qr_code_url.startsWith('data:')) {
      console.log('📎 Converting QR code data URL to inline attachment...')
      try {
        // Extract base64 data from data URL
        const matches = dynamic_data.qr_code_url.match(/^data:([^;]+);base64,(.+)$/)
        if (matches) {
          const mimeType = matches[1]
          const base64Data = matches[2]

          // Add as inline attachment with CID
          // NOTE: Resend uses filename as CID reference, not a separate 'id' field
          attachments.push({
            filename: 'qrcode.png',
            content: base64Data,
            content_type: mimeType,
            disposition: 'inline'
          })

          // Replace data URL in HTML with cid reference using filename
          finalHtmlBody = html_body.replace(
            dynamic_data.qr_code_url,
            'cid:qrcode.png'
          )

          console.log('✅ QR code converted to inline attachment')
        }
      } catch (error) {
        console.error('⚠️ Error converting QR code to attachment:', error)
        // Continue without QR code
      }
    }

    const resendPayload: any = {
      from: `${emailSettings.from_name} <${emailSettings.from_email}>`,
      to: [to_email],
      subject: subject,
      html: finalHtmlBody,
      ...(text_body && { text: text_body }),
      ...(emailSettings.reply_to_email && { reply_to: emailSettings.reply_to_email }),
      ...(attachments.length > 0 && { attachments })
    }

    console.log('📧 Resend payload:', {
      from: resendPayload.from,
      to: resendPayload.to,
      subject: resendPayload.subject,
      has_html: !!finalHtmlBody,
      has_text: !!text_body,
      has_attachments: attachments.length > 0
    })

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
      console.error('❌ Resend error:', resendData)
      throw new Error(`Resend API error: ${JSON.stringify(resendData)}`)
    }

    console.log('✅ Email sent via Resend:', resendData.id)

    // 8. Log invio nel database
    console.log('📝 Logging email send...')
    const { error: logError } = await supabaseClient.from('email_logs').insert({
      organization_id,
      template_id: emailTemplate.id,
      template_type,
      to_email,
      to_name,
      subject,
      from_email: emailSettings.from_email,
      from_name: emailSettings.from_name,
      status: 'sent',
      resend_email_id: resendData.id,
      sent_at: new Date().toISOString(),
      payload: dynamic_data,
    })

    if (logError) {
      console.error('⚠️ Error logging email:', logError)
      // Non bloccare se il log fallisce
    }

    // 9. Incrementa counter giornaliero
    console.log('📊 Incrementing daily counter...')
    const { error: counterError } = await supabaseClient.rpc('increment_email_counter', {
      org_id: organization_id
    })

    if (counterError) {
      console.error('⚠️ Error incrementing counter:', counterError)
      // Non bloccare se il counter fallisce
    }

    console.log('🎉 Email sent successfully!')

    // Success response
    return new Response(
      JSON.stringify({
        success: true,
        email_id: resendData.id,
        message: 'Email sent successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('❌ Error sending email:', error)

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
