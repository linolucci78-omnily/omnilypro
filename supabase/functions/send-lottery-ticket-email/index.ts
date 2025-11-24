import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface LotteryTicketEmailRequest {
  to: string
  ticketNumber: string
  customerName: string
  eventName: string
  extractionDate: string
  pdfBase64: string // PDF file as base64 string
  organizationId: string
}

serve(async (req: Request) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const {
      to,
      ticketNumber,
      customerName,
      eventName,
      extractionDate,
      pdfBase64,
      organizationId
    }: LotteryTicketEmailRequest = await req.json()

    // Validate required fields
    if (!to || !ticketNumber || !customerName || !eventName || !pdfBase64 || !organizationId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('🎫 Sending lottery ticket email to:', to)

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get email settings
    const { data: settings, error: settingsError } = await supabase
      .from('email_settings')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('enabled', true)
      .limit(1)
      .single()

    if (settingsError || !settings || !settings.resend_api_key) {
      console.error('❌ Email settings not found or API key missing')
      return new Response(
        JSON.stringify({ error: 'Email settings not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Format extraction date
    const extractionDateObj = new Date(extractionDate)
    const extractionDateFormatted = extractionDateObj.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })

    // Create beautiful HTML email
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      margin: 0;
      padding: 40px 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: white;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }
    .header {
      background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
      color: white;
      padding: 40px 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0 0 10px 0;
      font-size: 32px;
      font-weight: bold;
    }
    .header p {
      margin: 0;
      font-size: 18px;
      opacity: 0.9;
    }
    .content {
      padding: 40px 30px;
    }
    .greeting {
      font-size: 20px;
      color: #2c3e50;
      margin-bottom: 20px;
    }
    .ticket-box {
      background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%);
      border-radius: 12px;
      padding: 30px;
      text-align: center;
      margin: 30px 0;
      box-shadow: 0 10px 30px rgba(243, 156, 18, 0.3);
    }
    .ticket-label {
      color: white;
      font-size: 14px;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-bottom: 10px;
    }
    .ticket-number {
      color: white;
      font-size: 42px;
      font-weight: bold;
      font-family: 'Courier New', monospace;
      letter-spacing: 4px;
      text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
    }
    .info-box {
      background: #f8f9fa;
      border-left: 4px solid #e74c3c;
      padding: 20px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .info-box strong {
      color: #e74c3c;
      display: block;
      margin-bottom: 5px;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
      color: white;
      text-decoration: none;
      padding: 16px 40px;
      border-radius: 50px;
      font-weight: bold;
      font-size: 16px;
      margin: 20px 0;
      box-shadow: 0 10px 30px rgba(231, 76, 60, 0.4);
      transition: transform 0.3s;
    }
    .footer {
      background: #2c3e50;
      color: white;
      padding: 30px;
      text-align: center;
      font-size: 14px;
    }
    .footer a {
      color: #3498db;
      text-decoration: none;
    }
    .emoji {
      font-size: 48px;
      margin-bottom: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="emoji">🎫</div>
      <h1>Il Tuo Biglietto della Lotteria</h1>
      <p>${eventName}</p>
    </div>

    <div class="content">
      <p class="greeting">
        Ciao <strong>${customerName}</strong>!
      </p>

      <p>
        Grazie per aver partecipato alla nostra lotteria! 🎉
      </p>

      <p>
        Il tuo biglietto è stato generato con successo. Trovi il PDF in allegato con tutti i dettagli.
      </p>

      <div class="ticket-box">
        <div class="ticket-label">Il Tuo Numero</div>
        <div class="ticket-number">${ticketNumber}</div>
      </div>

      <div class="info-box">
        <strong>📅 Data Estrazione</strong>
        ${extractionDateFormatted}
      </div>

      <p>
        <strong>Cosa fare ora?</strong>
      </p>
      <ul>
        <li>📥 Scarica il PDF allegato e conservalo</li>
        <li>📱 Scansiona il QR code sul biglietto per verificarne l'autenticità</li>
        <li>📅 Segna la data dell'estrazione sul tuo calendario</li>
        <li>🍀 Incrocia le dita e preparati a vincere!</li>
      </ul>

      <p style="text-align: center; margin-top: 40px;">
        <strong>In bocca al lupo! 🍀</strong>
      </p>
    </div>

    <div class="footer">
      <p>
        Questo è un messaggio automatico. Per assistenza, contattaci.
      </p>
      <p style="margin-top: 20px; color: #95a5a6; font-size: 12px;">
        © ${new Date().getFullYear()} - Tutti i diritti riservati
      </p>
    </div>
  </div>
</body>
</html>
    `

    const fromEmail = settings.from_email
    const fromName = settings.from_name || 'OMNILY PRO'

    // Prepare email data with PDF attachment
    const emailData = {
      from: `${fromName} <${fromEmail}>`,
      to: [to],
      subject: `🎫 Il Tuo Biglietto della Lotteria - ${ticketNumber}`,
      html: html,
      reply_to: settings.reply_to_email || fromEmail,
      attachments: [
        {
          filename: `biglietto-${ticketNumber}.pdf`,
          content: pdfBase64,
          type: 'application/pdf',
        }
      ]
    }

    console.log('📤 Sending via Resend with PDF attachment')

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
        organization_id: organizationId,
        to_email: to,
        from_email: fromEmail,
        subject: emailData.subject,
        status: 'failed',
        error_message: JSON.stringify(resendData),
        sent_at: new Date().toISOString()
      })

      return new Response(
        JSON.stringify({ error: 'Failed to send email', details: resendData }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('✅ Lottery ticket email sent successfully! Resend ID:', resendData.id)

    // Log successful email
    await supabase.from('email_logs').insert({
      organization_id: organizationId,
      to_email: to,
      from_email: fromEmail,
      subject: emailData.subject,
      status: 'sent',
      resend_email_id: resendData.id,
      sent_at: new Date().toISOString()
    })

    return new Response(
      JSON.stringify({
        success: true,
        emailId: resendData.id,
        message: 'Lottery ticket email sent successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('❌ Error in send-lottery-ticket-email function:', errorMessage)

    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
