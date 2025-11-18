import { supabase } from '../lib/supabase'

export interface DemoRequestNotification {
  companyName: string
  contactName: string
  contactEmail: string
  contactPhone: string
  industry?: string
  timeline?: string
  budgetRange?: string
}

/**
 * Send email notification when a new demo request is submitted
 */
export const sendDemoRequestNotification = async (data: DemoRequestNotification): Promise<void> => {
  try {
    // Call Supabase Edge Function to send email via Resend
    const { data: result, error } = await supabase.functions.invoke('send-demo-notification', {
      body: {
        to: 'sales@omnilypro.com', // Your sales team email
        subject: `🚀 Nuova Richiesta Demo da ${data.companyName}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
                color: white;
                padding: 30px;
                border-radius: 10px 10px 0 0;
                text-align: center;
              }
              .header h1 {
                margin: 0;
                font-size: 24px;
              }
              .content {
                background: #f9fafb;
                padding: 30px;
                border-radius: 0 0 10px 10px;
              }
              .info-block {
                background: white;
                padding: 20px;
                border-radius: 8px;
                margin-bottom: 20px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              }
              .info-row {
                display: flex;
                padding: 8px 0;
                border-bottom: 1px solid #e5e7eb;
              }
              .info-row:last-child {
                border-bottom: none;
              }
              .info-label {
                font-weight: 600;
                color: #6b7280;
                width: 140px;
                flex-shrink: 0;
              }
              .info-value {
                color: #1f2937;
                flex: 1;
              }
              .cta-button {
                display: inline-block;
                background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
                color: white;
                text-decoration: none;
                padding: 12px 30px;
                border-radius: 8px;
                font-weight: 600;
                margin-top: 20px;
              }
              .footer {
                text-align: center;
                color: #6b7280;
                font-size: 14px;
                margin-top: 20px;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>🚀 Nuova Richiesta Demo!</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Un potenziale cliente vuole conoscere OmnilyPro</p>
            </div>

            <div class="content">
              <div class="info-block">
                <h2 style="margin-top: 0; color: #1f2937; font-size: 18px;">Informazioni Azienda</h2>
                <div class="info-row">
                  <span class="info-label">Azienda:</span>
                  <span class="info-value"><strong>${data.companyName}</strong></span>
                </div>
                ${data.industry ? `
                <div class="info-row">
                  <span class="info-label">Settore:</span>
                  <span class="info-value">${data.industry}</span>
                </div>
                ` : ''}
              </div>

              <div class="info-block">
                <h2 style="margin-top: 0; color: #1f2937; font-size: 18px;">Contatti</h2>
                <div class="info-row">
                  <span class="info-label">Nome:</span>
                  <span class="info-value"><strong>${data.contactName}</strong></span>
                </div>
                <div class="info-row">
                  <span class="info-label">Email:</span>
                  <span class="info-value"><a href="mailto:${data.contactEmail}" style="color: #dc2626;">${data.contactEmail}</a></span>
                </div>
                <div class="info-row">
                  <span class="info-label">Telefono:</span>
                  <span class="info-value"><a href="tel:${data.contactPhone}" style="color: #dc2626;">${data.contactPhone}</a></span>
                </div>
              </div>

              ${data.timeline || data.budgetRange ? `
              <div class="info-block">
                <h2 style="margin-top: 0; color: #1f2937; font-size: 18px;">Dettagli Richiesta</h2>
                ${data.timeline ? `
                <div class="info-row">
                  <span class="info-label">Timeline:</span>
                  <span class="info-value">${data.timeline}</span>
                </div>
                ` : ''}
                ${data.budgetRange ? `
                <div class="info-row">
                  <span class="info-label">Budget:</span>
                  <span class="info-value">${data.budgetRange}</span>
                </div>
                ` : ''}
              </div>
              ` : ''}

              <div style="text-align: center; margin-top: 30px;">
                <a href="${process.env.VITE_APP_URL || 'https://app.omnilypro.com'}/admin/demo-requests" class="cta-button">
                  Vai al Pannello Admin
                </a>
              </div>

              <div class="footer">
                <p>Ricevuto tramite il wizard di qualificazione OmnilyPro</p>
                <p>Rispondi entro 24 ore per massimizzare le probabilità di conversione! ⚡</p>
              </div>
            </div>
          </body>
          </html>
        `
      }
    })

    if (error) {
      console.error('Error sending demo notification email:', error)
      // Non bloccare il flusso se l'email fallisce
      return
    }

    console.log('✅ Demo notification email sent successfully')
  } catch (error) {
    console.error('Error in sendDemoRequestNotification:', error)
    // Non bloccare il flusso se l'email fallisce
  }
}

/**
 * Send confirmation email to the person who requested the demo
 */
export const sendDemoConfirmationEmail = async (data: DemoRequestNotification): Promise<void> => {
  try {
    const { data: result, error } = await supabase.functions.invoke('send-demo-confirmation', {
      body: {
        to: data.contactEmail,
        subject: `✅ Richiesta Demo Ricevuta - ${data.companyName}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
                color: white;
                padding: 40px 30px;
                border-radius: 10px 10px 0 0;
                text-align: center;
              }
              .header h1 {
                margin: 0 0 10px 0;
                font-size: 28px;
              }
              .content {
                background: white;
                padding: 40px 30px;
                border-radius: 0 0 10px 10px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
              }
              .highlight {
                background: #fef2f2;
                padding: 20px;
                border-left: 4px solid #dc2626;
                border-radius: 4px;
                margin: 20px 0;
              }
              .footer {
                text-align: center;
                color: #6b7280;
                font-size: 14px;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>✅ Richiesta Ricevuta!</h1>
              <p style="margin: 0; opacity: 0.9; font-size: 16px;">Grazie per l'interesse in OmnilyPro</p>
            </div>

            <div class="content">
              <p>Ciao <strong>${data.contactName}</strong>,</p>

              <p>Grazie per aver richiesto una demo di <strong>OmnilyPro</strong> per <strong>${data.companyName}</strong>!</p>

              <div class="highlight">
                <p style="margin: 0;"><strong>🎯 Cosa succede adesso?</strong></p>
                <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                  <li>Il nostro team analizzerà la tua richiesta</li>
                  <li>Ti contatteremo entro <strong>24 ore</strong></li>
                  <li>Programmeremo una demo personalizzata per te</li>
                  <li>Risponderemo a tutte le tue domande</li>
                </ul>
              </div>

              <p>Nel frattempo, se hai domande urgenti puoi rispondere direttamente a questa email o chiamarci al <strong>+39 XXX XXX XXXX</strong>.</p>

              <p style="margin-top: 30px;">A presto!</p>
              <p><strong>Il Team OmnilyPro</strong></p>

              <div class="footer">
                <p>OmnilyPro - La piattaforma loyalty all-in-one</p>
                <p><a href="https://omnilypro.com" style="color: #dc2626; text-decoration: none;">www.omnilypro.com</a></p>
              </div>
            </div>
          </body>
          </html>
        `
      }
    })

    if (error) {
      console.error('Error sending confirmation email:', error)
      return
    }

    console.log('✅ Confirmation email sent to customer')
  } catch (error) {
    console.error('Error in sendDemoConfirmationEmail:', error)
  }
}
