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

interface BrandingData {
  logo_url?: string
  primary_color?: string
  secondary_color?: string
  facebook_url?: string
  instagram_url?: string
  twitter_url?: string
  linkedin_url?: string
  youtube_url?: string
  tiktok_url?: string
  pinterest_url?: string
  telegram_url?: string
  whatsapp_business?: string
  email?: string
  phone?: string
  address?: string
  website_url?: string
  name?: string
}

export class EmailService {

  /**
   * Genera footer email professionale con branding e social links
   */
  private async getEmailFooter(organizationId?: string, organizationName?: string): Promise<string> {
    if (!organizationId) {
      return this.getBasicFooter(organizationName || 'OMNILY PRO')
    }

    try {
      const { data: org, error } = await supabase
        .from('organizations')
        .select('logo_url, primary_color, secondary_color, facebook_url, instagram_url, twitter_url, linkedin_url, youtube_url, tiktok_url, pinterest_url, telegram_url, whatsapp_business, email, phone, address, website_url, name')
        .eq('id', organizationId)
        .single()

      if (error || !org) {
        return this.getBasicFooter(organizationName || 'OMNILY PRO')
      }

      return this.getBrandedFooter(org, organizationName || org.name || 'OMNILY PRO')
    } catch (error) {
      console.error('Error loading branding for email footer:', error)
      return this.getBasicFooter(organizationName || 'OMNILY PRO')
    }
  }

  /**
   * Footer basico (fallback)
   */
  private getBasicFooter(organizationName: string): string {
    return `
      <div style="text-align: center; margin-top: 40px; padding-top: 30px; border-top: 2px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 14px; margin: 10px 0;">Grazie per aver scelto ${organizationName}!</p>
        <p style="color: #9ca3af; font-size: 12px; margin: 5px 0;">Powered by OMNILY PRO</p>
      </div>
    `
  }

  /**
   * Footer branded con social e contatti
   */
  private getBrandedFooter(branding: BrandingData, organizationName: string): string {
    const primaryColor = branding.primary_color || '#dc2626'
    const secondaryColor = branding.secondary_color || '#ef4444'

    // Social links (solo quelli presenti)
    const socialLinks = []

    if (branding.facebook_url) {
      socialLinks.push(`<a href="${branding.facebook_url}" style="text-decoration: none; margin: 0 8px;"><img src="https://cdn-icons-png.flaticon.com/512/733/733547.png" alt="Facebook" style="width: 32px; height: 32px;" /></a>`)
    }
    if (branding.instagram_url) {
      socialLinks.push(`<a href="${branding.instagram_url}" style="text-decoration: none; margin: 0 8px;"><img src="https://cdn-icons-png.flaticon.com/512/2111/2111463.png" alt="Instagram" style="width: 32px; height: 32px;" /></a>`)
    }
    if (branding.twitter_url) {
      socialLinks.push(`<a href="${branding.twitter_url}" style="text-decoration: none; margin: 0 8px;"><img src="https://cdn-icons-png.flaticon.com/512/733/733579.png" alt="Twitter" style="width: 32px; height: 32px;" /></a>`)
    }
    if (branding.linkedin_url) {
      socialLinks.push(`<a href="${branding.linkedin_url}" style="text-decoration: none; margin: 0 8px;"><img src="https://cdn-icons-png.flaticon.com/512/733/733561.png" alt="LinkedIn" style="width: 32px; height: 32px;" /></a>`)
    }
    if (branding.youtube_url) {
      socialLinks.push(`<a href="${branding.youtube_url}" style="text-decoration: none; margin: 0 8px;"><img src="https://cdn-icons-png.flaticon.com/512/733/733646.png" alt="YouTube" style="width: 32px; height: 32px;" /></a>`)
    }
    if (branding.tiktok_url) {
      socialLinks.push(`<a href="${branding.tiktok_url}" style="text-decoration: none; margin: 0 8px;"><img src="https://cdn-icons-png.flaticon.com/512/3046/3046126.png" alt="TikTok" style="width: 32px; height: 32px;" /></a>`)
    }
    if (branding.pinterest_url) {
      socialLinks.push(`<a href="${branding.pinterest_url}" style="text-decoration: none; margin: 0 8px;"><img src="https://cdn-icons-png.flaticon.com/512/733/733614.png" alt="Pinterest" style="width: 32px; height: 32px;" /></a>`)
    }
    if (branding.telegram_url) {
      socialLinks.push(`<a href="${branding.telegram_url}" style="text-decoration: none; margin: 0 8px;"><img src="https://cdn-icons-png.flaticon.com/512/2111/2111646.png" alt="Telegram" style="width: 32px; height: 32px;" /></a>`)
    }

    // Contatti (solo quelli presenti)
    const contacts = []

    if (branding.email) {
      contacts.push(`<a href="mailto:${branding.email}" style="color: ${primaryColor}; text-decoration: none; margin: 0 12px; font-size: 14px;">✉️ ${branding.email}</a>`)
    }
    if (branding.phone) {
      contacts.push(`<a href="tel:${branding.phone}" style="color: ${primaryColor}; text-decoration: none; margin: 0 12px; font-size: 14px;">📞 ${branding.phone}</a>`)
    }
    if (branding.whatsapp_business) {
      contacts.push(`<a href="https://wa.me/${branding.whatsapp_business.replace(/[^0-9]/g, '')}" style="color: ${primaryColor}; text-decoration: none; margin: 0 12px; font-size: 14px;">💬 WhatsApp</a>`)
    }
    if (branding.address) {
      contacts.push(`<span style="color: #6b7280; margin: 0 12px; font-size: 14px;">📍 ${branding.address}</span>`)
    }

    return `
      <div style="background: linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%); padding: 40px 20px; margin-top: 40px; border-radius: 0 0 10px 10px; text-align: center;">
        ${branding.logo_url ? `
          <div style="margin-bottom: 20px;">
            <img src="${branding.logo_url}" alt="${organizationName}" style="max-width: 150px; max-height: 60px; object-fit: contain;" />
          </div>
        ` : ''}

        ${socialLinks.length > 0 ? `
          <div style="margin: 20px 0;">
            <p style="color: white; font-size: 14px; font-weight: 600; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 1px;">Seguici Su</p>
            <div style="display: flex; justify-content: center; align-items: center; flex-wrap: wrap; gap: 10px;">
              ${socialLinks.join('')}
            </div>
          </div>
        ` : ''}

        ${contacts.length > 0 ? `
          <div style="margin: 25px 0; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.3);">
            <div style="display: flex; justify-content: center; align-items: center; flex-wrap: wrap; gap: 10px;">
              ${contacts.join('')}
            </div>
          </div>
        ` : ''}

        ${branding.website_url ? `
          <div style="margin-top: 20px;">
            <a href="${branding.website_url}" style="display: inline-block; background: white; color: ${primaryColor}; padding: 10px 24px; border-radius: 25px; text-decoration: none; font-weight: 600; font-size: 14px;">🌐 Visita il nostro sito</a>
          </div>
        ` : ''}

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.3);">
          <p style="color: rgba(255,255,255,0.9); font-size: 16px; font-weight: 600; margin: 5px 0;">Grazie per aver scelto ${organizationName}!</p>
          <p style="color: rgba(255,255,255,0.7); font-size: 11px; margin: 5px 0; text-transform: uppercase; letter-spacing: 1px;">Powered by OMNILY PRO</p>
        </div>
      </div>
    `
  }

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
   * Invia email benvenuto nuovo cliente (con footer branded)
   */
  async sendWelcomeEmail(
    customerEmail: string,
    customerName: string,
    organizationId: string,
    organizationName: string,
    pointsName: string = 'Punti'
  ): Promise<{ success: boolean; error?: string }> {
    const template = this.getWelcomeEmailTemplate(customerName, organizationName, pointsName)
    const footer = await this.getEmailFooter(organizationId, organizationName)

    // Sostituisci il vecchio footer con quello branded
    const htmlWithBrandedFooter = template.html.replace(
      /<div class="footer">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/,
      footer + '</div></div>'
    )

    return this.sendEmail({
      to: customerEmail,
      subject: template.subject,
      html: htmlWithBrandedFooter,
      organizationId
    })
  }

  /**
   * Invia email cambio tier (con footer branded)
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

    const footer = await this.getEmailFooter(organizationId, organizationName)

    // Sostituisci il vecchio footer con quello branded
    const htmlWithBrandedFooter = template.html.replace(
      /<div class="footer">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/,
      footer + '</div></div>'
    )

    return this.sendEmail({
      to: customerEmail,
      subject: template.subject,
      html: htmlWithBrandedFooter,
      organizationId
    })
  }
}

export const emailService = new EmailService()
