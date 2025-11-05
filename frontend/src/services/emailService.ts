import { supabase } from '../lib/supabase'

/**
 * Email Service - Gestione invio email tramite Supabase Edge Function + Resend
 */

export interface SendEmailParams {
  to: string
  subject: string
  html: string
  from?: string
  organizationId?: string
}

export interface EmailTemplate {
  subject: string
  html: string
}

export class EmailService {

  /**
   * Invia email tramite Supabase Edge Function (che usa Resend)
   */
  async sendEmail(params: SendEmailParams): Promise<{ success: boolean; emailId?: string; error?: string }> {
    try {
      console.log('📧 EmailService: Sending email to', params.to)

      const { data, error } = await supabase.functions.invoke('send-email', {
        body: params
      })

      if (error) {
        console.error('❌ Error calling send-email function:', error)
        return { success: false, error: error.message }
      }

      if (!data.success) {
        console.error('❌ Email sending failed:', data.error)
        return { success: false, error: data.error }
      }

      console.log('✅ Email sent successfully!', data.emailId)
      return { success: true, emailId: data.emailId }

    } catch (error) {
      console.error('❌ EmailService error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Email benvenuto nuovo cliente
   */
  getWelcomeEmailTemplate(customerName: string, organizationName: string, pointsName: string = 'Punti'): EmailTemplate {
    return {
      subject: `🎉 Benvenuto nel programma fedeltà ${organizationName}!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Benvenuto ${customerName}!</h1>
            </div>
            <div class="content">
              <p>Ciao <strong>${customerName}</strong>,</p>
              <p>Siamo felicissimi di darti il benvenuto nel programma fedeltà di <strong>${organizationName}</strong>!</p>

              <h3>🎁 Cosa puoi fare ora:</h3>
              <ul>
                <li>✅ Accumula ${pointsName} ad ogni acquisto</li>
                <li>🎯 Sblocca premi esclusivi</li>
                <li>⭐ Raggiungi livelli superiori per vantaggi speciali</li>
              </ul>

              <p>Ad ogni acquisto, i tuoi ${pointsName} cresceranno e potrai riscattare fantastici premi!</p>

              <p style="margin-top: 30px;">
                <strong>Inizia subito a raccogliere ${pointsName}!</strong>
              </p>

              <div class="footer">
                <p>Grazie per aver scelto ${organizationName}!</p>
                <p style="color: #999; font-size: 12px;">Powered by OMNILY PRO</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    }
  }

  /**
   * Email cambio tier (livello fedeltà)
   */
  getTierUpgradeEmailTemplate(
    customerName: string,
    organizationName: string,
    newTierName: string,
    newTierColor: string,
    pointsName: string = 'Punti'
  ): EmailTemplate {
    return {
      subject: `🎊 Congratulazioni! Hai raggiunto il livello ${newTierName}!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, ${newTierColor} 0%, #764ba2 100%); color: white; padding: 40px; text-align: center; border-radius: 10px 10px 0 0; }
            .badge { font-size: 80px; margin: 20px 0; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
            .tier-badge { display: inline-block; background: ${newTierColor}; color: white; padding: 10px 20px; border-radius: 20px; font-weight: bold; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="badge">🏆</div>
              <h1>Congratulazioni ${customerName}!</h1>
              <p style="font-size: 18px;">Hai raggiunto il livello</p>
              <h2 style="font-size: 36px; margin: 10px 0;">${newTierName}</h2>
            </div>
            <div class="content">
              <p>Fantastico <strong>${customerName}</strong>!</p>
              <p>Grazie alla tua fedeltà verso <strong>${organizationName}</strong>, hai raggiunto il prestigioso livello <span class="tier-badge">${newTierName}</span>!</p>

              <h3>✨ I tuoi nuovi vantaggi:</h3>
              <ul>
                <li>🎁 Accesso a premi esclusivi</li>
                <li>⭐ Vantaggi speciali riservati</li>
                <li>🚀 Maggiori ${pointsName} per i tuoi acquisti</li>
              </ul>

              <p>Continua così! Ogni acquisto ti avvicina a premi sempre più esclusivi.</p>

              <div class="footer">
                <p>Grazie per essere un cliente speciale di ${organizationName}!</p>
                <p style="color: #999; font-size: 12px;">Powered by OMNILY PRO</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    }
  }

  /**
   * Invia email benvenuto nuovo cliente
   */
  async sendWelcomeEmail(
    customerEmail: string,
    customerName: string,
    organizationId: string,
    organizationName: string,
    pointsName: string = 'Punti'
  ): Promise<{ success: boolean; error?: string }> {
    const template = this.getWelcomeEmailTemplate(customerName, organizationName, pointsName)

    return this.sendEmail({
      to: customerEmail,
      subject: template.subject,
      html: template.html,
      organizationId
    })
  }

  /**
   * Invia email cambio tier
   */
  async sendTierUpgradeEmail(
    customerEmail: string,
    customerName: string,
    organizationId: string,
    organizationName: string,
    newTierName: string,
    newTierColor: string,
    pointsName: string = 'Punti'
  ): Promise<{ success: boolean; error?: string }> {
    const template = this.getTierUpgradeEmailTemplate(
      customerName,
      organizationName,
      newTierName,
      newTierColor,
      pointsName
    )

    return this.sendEmail({
      to: customerEmail,
      subject: template.subject,
      html: template.html,
      organizationId
    })
  }
}

export const emailService = new EmailService()
