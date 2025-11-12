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
  slogan?: string
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
      console.log('⚠️ No organizationId provided, using basic footer')
      return this.getBasicFooter(organizationName || 'OMNILY PRO')
    }

    try {
      console.log('📧 Loading branding data for organization:', organizationId)
      const { data: org, error } = await supabase
        .from('organizations')
        .select('logo_url, primary_color, secondary_color, slogan, facebook_url, instagram_url, twitter_url, linkedin_url, youtube_url, tiktok_url, pinterest_url, telegram_url, whatsapp_business, email, phone, address, website_url, name')
        .eq('id', organizationId)
        .single()

      if (error) {
        console.error('❌ Error loading organization:', error)
        return this.getBasicFooter(organizationName || 'OMNILY PRO')
      }

      if (!org) {
        console.log('⚠️ Organization not found')
        return this.getBasicFooter(organizationName || 'OMNILY PRO')
      }

      console.log('✅ Organization data loaded:', {
        name: org.name,
        hasLogo: !!org.logo_url,
        hasFacebook: !!org.facebook_url,
        hasInstagram: !!org.instagram_url,
        hasPhone: !!org.phone,
        hasEmail: !!org.email,
        hasAddress: !!org.address
      })

      return this.getBrandedFooter(org, organizationName || org.name || 'OMNILY PRO')
    } catch (error) {
      console.error('❌ Error loading branding for email footer:', error)
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
   * Footer branded con social e contatti (table-based per compatibilità email)
   */
  private getBrandedFooter(branding: BrandingData, organizationName: string): string {
    const primaryColor = branding.primary_color || '#dc2626'
    const secondaryColor = branding.secondary_color || '#ef4444'

    // Social links (solo quelli presenti)
    const socialLinks = []

    if (branding.facebook_url) {
      socialLinks.push(`<td style="padding: 0 5px;"><a href="${branding.facebook_url}"><img src="https://cdn-icons-png.flaticon.com/512/733/733547.png" alt="Facebook" width="32" height="32" style="display: block;" /></a></td>`)
    }
    if (branding.instagram_url) {
      socialLinks.push(`<td style="padding: 0 5px;"><a href="${branding.instagram_url}"><img src="https://cdn-icons-png.flaticon.com/512/2111/2111463.png" alt="Instagram" width="32" height="32" style="display: block;" /></a></td>`)
    }
    if (branding.twitter_url) {
      socialLinks.push(`<td style="padding: 0 5px;"><a href="${branding.twitter_url}"><img src="https://cdn-icons-png.flaticon.com/512/733/733579.png" alt="Twitter" width="32" height="32" style="display: block;" /></a></td>`)
    }
    if (branding.linkedin_url) {
      socialLinks.push(`<td style="padding: 0 5px;"><a href="${branding.linkedin_url}"><img src="https://cdn-icons-png.flaticon.com/512/733/733561.png" alt="LinkedIn" width="32" height="32" style="display: block;" /></a></td>`)
    }
    if (branding.youtube_url) {
      socialLinks.push(`<td style="padding: 0 5px;"><a href="${branding.youtube_url}"><img src="https://cdn-icons-png.flaticon.com/512/733/733646.png" alt="YouTube" width="32" height="32" style="display: block;" /></a></td>`)
    }

    return `
<table width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td style="background: linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%); padding: 40px 20px; text-align: center;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        ${socialLinks.length > 0 ? `
        <tr>
          <td style="text-align: center; padding: 20px 0;">
            <p style="color: white; font-size: 14px; font-weight: 600; margin: 0 0 15px 0; text-transform: uppercase; letter-spacing: 1px;">Seguici Su</p>
            <table cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
              <tr>
                ${socialLinks.join('')}
              </tr>
            </table>
          </td>
        </tr>
        ` : ''}

        <tr>
          <td style="text-align: center; padding: 20px 0; border-top: 1px solid rgba(255,255,255,0.3);">
            ${branding.phone ? `<p style="color: white; font-size: 15px; margin: 8px 0;">📞 <a href="tel:${branding.phone}" style="color: white; text-decoration: none;">${branding.phone}</a></p>` : ''}
            ${branding.email ? `<p style="color: white; font-size: 15px; margin: 8px 0;">✉️ <a href="mailto:${branding.email}" style="color: white; text-decoration: none;">${branding.email}</a></p>` : ''}
            ${branding.address ? `<p style="color: rgba(255,255,255,0.9); font-size: 14px; margin: 8px 0;">📍 ${branding.address}</p>` : ''}
            ${branding.whatsapp_business ? `<p style="color: white; font-size: 15px; margin: 8px 0;">💬 <a href="https://wa.me/${branding.whatsapp_business.replace(/[^0-9]/g, '')}" style="color: white; text-decoration: none;">WhatsApp</a></p>` : ''}
          </td>
        </tr>

        ${branding.website_url ? `
        <tr>
          <td style="text-align: center; padding: 20px 0;">
            <a href="${branding.website_url}" style="display: inline-block; background: white; color: ${primaryColor}; padding: 12px 30px; border-radius: 25px; text-decoration: none; font-weight: 600; font-size: 14px;">🌐 Visita il nostro sito</a>
          </td>
        </tr>
        ` : ''}

        <tr>
          <td style="text-align: center; padding: 20px 0; border-top: 1px solid rgba(255,255,255,0.3);">
            <p style="color: white; font-size: 18px; font-weight: 600; margin: 5px 0;">Grazie per aver scelto ${organizationName}!</p>
            <p style="color: rgba(255,255,255,0.8); font-size: 12px; margin: 10px 0; text-transform: uppercase; letter-spacing: 1px;">Powered by OMNILY PRO</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
    `
  }

  /**
   * Wrappa l'HTML dell'email con logo nell'header e footer branded
   */
  async wrapEmailWithFooter(html: string, organizationId?: string, organizationName?: string): Promise<string> {
    // Carica dati organizzazione
    let logoUrl = ''
    let slogan = ''

    if (organizationId) {
      try {
        const { data: org } = await supabase
          .from('organizations')
          .select('logo_url, slogan')
          .eq('id', organizationId)
          .single()

        if (org?.logo_url) {
          logoUrl = org.logo_url
        }
        if (org?.slogan) {
          slogan = org.slogan
        }
      } catch (error) {
        console.error('Error loading logo for header:', error)
      }
    }

    // Sostituisci il logo nell'header
    const sloganHtml = slogan ? `<p style="margin: 12px 0 0 0; font-size: 16px; font-weight: 500; color: white; text-align: center; line-height: 1.4;">${slogan}</p>` : ''

    const logoHtml = logoUrl
      ? `<img src="${logoUrl}" alt="${organizationName || 'Logo'}" style="max-width: 240px; max-height: 80px; height: auto; width: auto; display: block; margin: 0 auto 12px auto;" />
         <h2 style="margin: 0 0 ${slogan ? '8px' : '0'} 0; font-size: 24px; font-weight: 700; color: white; text-align: center; letter-spacing: 0.5px;">${organizationName || 'OMNILY PRO'}</h2>
         ${sloganHtml}`
      : `<h1 style="margin: 0 0 ${slogan ? '8px' : '0'} 0; font-size: 26px; font-weight: 700; color: white; letter-spacing: 0.5px;">${organizationName || 'OMNILY PRO'}</h1>
         ${sloganHtml}`

    let htmlWithLogo = html.replace('<!-- LOGO PLACEHOLDER -->', logoHtml)

    // Aggiungi footer in basso
    const footer = await this.getEmailFooter(organizationId, organizationName)

    return htmlWithLogo.replace('<!-- FOOTER PLACEHOLDER -->', `
    <!-- FOOTER -->
    <tr>
      <td style="padding: 0;">
        ${footer}
      </td>
    </tr>`)
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

  /**
   * Invia email di attivazione account
   */
  async sendActivationEmail(
    customerEmail: string,
    customerName: string,
    organizationId: string,
    organizationName: string,
    activationToken: string,
    organizationSlug: string
  ): Promise<{ success: boolean; error?: string }> {
    // Determina l'URL base (usa quello della customer app)
    const baseUrl = window.location.origin.includes('localhost')
      ? 'http://localhost:5174'
      : window.location.origin.replace('dashboard', 'app') // Sostituisci dashboard con app per produzione

    const activationLink = `${baseUrl}/${organizationSlug}/activate?token=${activationToken}`

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f5; padding: 40px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                    <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: white; letter-spacing: 0.5px;">🎉 Benvenuto!</h1>
                    <p style="margin: 15px 0 0 0; font-size: 16px; color: rgba(255,255,255,0.9);">Attiva il tuo account ${organizationName}</p>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <p style="margin: 0 0 20px 0; font-size: 16px; color: #333; line-height: 1.6;">Ciao <strong>${customerName}</strong>,</p>

                    <p style="margin: 0 0 20px 0; font-size: 16px; color: #333; line-height: 1.6;">
                      Sei stato registrato nel programma fedeltà di <strong>${organizationName}</strong>! 🎊
                    </p>

                    <p style="margin: 0 0 30px 0; font-size: 16px; color: #333; line-height: 1.6;">
                      Per completare la registrazione e accedere al tuo account, clicca sul pulsante qui sotto per impostare la tua password:
                    </p>

                    <!-- CTA Button -->
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td align="center" style="padding: 20px 0;">
                          <a href="${activationLink}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);">
                            Attiva il tuo Account
                          </a>
                        </td>
                      </tr>
                    </table>

                    <p style="margin: 30px 0 20px 0; font-size: 14px; color: #666; line-height: 1.6;">
                      Oppure copia e incolla questo link nel tuo browser:
                    </p>

                    <p style="margin: 0 0 30px 0; padding: 15px; background: #f8f9fa; border-radius: 6px; font-size: 13px; color: #667eea; word-break: break-all; font-family: monospace;">
                      ${activationLink}
                    </p>

                    <div style="margin: 30px 0 0 0; padding: 20px; background: #f0f9ff; border-left: 4px solid #667eea; border-radius: 6px;">
                      <h3 style="margin: 0 0 10px 0; font-size: 16px; color: #1e40af;">✨ Cosa puoi fare dopo l'attivazione:</h3>
                      <ul style="margin: 10px 0 0 0; padding-left: 20px; color: #333; font-size: 14px; line-height: 1.8;">
                        <li>Accumula punti ad ogni acquisto</li>
                        <li>Sblocca premi esclusivi</li>
                        <li>Raggiungi livelli superiori per vantaggi speciali</li>
                        <li>Ricevi offerte personalizzate</li>
                      </ul>
                    </div>

                    <p style="margin: 30px 0 0 0; font-size: 13px; color: #999; line-height: 1.6;">
                      <em>Questo link è valido per 48 ore. Se non hai richiesto questa registrazione, ignora questa email.</em>
                    </p>
                  </td>
                </tr>

                <!-- Footer Placeholder -->
                <!-- FOOTER PLACEHOLDER -->
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `

    const footer = await this.getEmailFooter(organizationId, organizationName)
    const htmlWithBrandedFooter = html.replace('<!-- FOOTER PLACEHOLDER -->', `
      <tr>
        <td style="padding: 0;">
          ${footer}
        </td>
      </tr>
    `)

    return this.sendEmail({
      to: customerEmail,
      subject: `🎉 Attiva il tuo account ${organizationName}`,
      html: htmlWithBrandedFooter,
      organizationId
    })
  }
}

export const emailService = new EmailService()
