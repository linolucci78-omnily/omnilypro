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
   * Ottiene l'URL base corretto per i link nelle email
   * Usa sempre l'URL di produzione dalle variabili d'ambiente
   */
  private getBaseUrl(): string {
    return import.meta.env.VITE_APP_URL || window.location.origin
  }

  /**
   * Ottiene l'URL dell'app clienti per i link nelle email
   */
  private getCustomerAppUrl(): string {
    return import.meta.env.VITE_CUSTOMER_APP_URL || window.location.origin.replace('dashboard', 'app')
  }

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
            ${branding.phone ? `
            <p style="color: white; font-size: 15px; margin: 8px 0; display: flex; align-items: center; justify-content: center; gap: 8px;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; vertical-align: middle;">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
              </svg>
              <a href="tel:${branding.phone}" style="color: white; text-decoration: none;">${branding.phone}</a>
            </p>
            ` : ''}
            ${branding.email ? `
            <p style="color: white; font-size: 15px; margin: 8px 0; display: flex; align-items: center; justify-content: center; gap: 8px;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; vertical-align: middle;">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
              <a href="mailto:${branding.email}" style="color: white; text-decoration: none;">${branding.email}</a>
            </p>
            ` : ''}
            ${branding.address ? `
            <p style="color: rgba(255,255,255,0.9); font-size: 14px; margin: 8px 0; display: flex; align-items: center; justify-content: center; gap: 8px;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; vertical-align: middle;">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              <span>${branding.address}</span>
            </p>
            ` : ''}
            ${branding.whatsapp_business ? `
            <p style="color: white; font-size: 15px; margin: 8px 0; display: flex; align-items: center; justify-content: center; gap: 8px;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; vertical-align: middle;">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
              <a href="https://wa.me/${branding.whatsapp_business.replace(/[^0-9]/g, '')}" style="color: white; text-decoration: none;">WhatsApp</a>
            </p>
            ` : ''}
          </td>
        </tr>

        ${branding.website_url ? `
        <tr>
          <td style="text-align: center; padding: 20px 0;">
            <a href="${branding.website_url}" style="display: inline-block; background: white; color: ${primaryColor}; padding: 12px 30px; border-radius: 25px; text-decoration: none; font-weight: 600; font-size: 14px;">Visita il nostro sito</a>
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
          <meta name="color-scheme" content="light dark">
          <meta name="supported-color-schemes" content="light dark">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #667eea; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
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
          <meta name="color-scheme" content="light dark">
          <meta name="supported-color-schemes" content="light dark">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: ${newTierColor}; background: linear-gradient(135deg, ${newTierColor} 0%, #764ba2 100%); color: white; padding: 40px; text-align: center; border-radius: 10px 10px 0 0; }
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
    const activationLink = `${this.getCustomerAppUrl()}/${organizationSlug}/activate?token=${activationToken}`

    // Carica i dati dell'organizzazione per il colore primario e logo
    let primaryColor = '#dc2626'
    let logoUrl = ''

    try {
      const { data: org } = await supabase
        .from('organizations')
        .select('primary_color, logo_url')
        .eq('id', organizationId)
        .single()

      if (org?.primary_color) primaryColor = org.primary_color
      if (org?.logo_url) logoUrl = org.logo_url
    } catch (error) {
      console.error('Error loading organization for email:', error)
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="color-scheme" content="light dark">
        <meta name="supported-color-schemes" content="light dark">
        <style>
          @keyframes twinkle {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 1; }
          }
          .star {
            position: absolute;
            background: white;
            border-radius: 50%;
            animation: twinkle 3s ease-in-out infinite;
          }
        </style>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f172a;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #0f172a; background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%); padding: 60px 20px; position: relative;">
          <tr>
            <td align="center">
              <!-- Logo -->
              ${logoUrl ? `
              <div style="text-align: center; margin-bottom: 40px;">
                <img src="${logoUrl}" alt="${organizationName}" style="max-width: 180px; height: auto; filter: drop-shadow(0 8px 16px rgba(0,0,0,0.4));" />
              </div>
              ` : ''}

              <!-- Main Card -->
              <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #1e293b; background: linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%); border-radius: 20px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.5); border: 1px solid rgba(59, 130, 246, 0.2); backdrop-filter: blur(20px);">

                <!-- Header with Icon -->
                <tr>
                  <td style="padding: 40px 40px 30px 40px; text-align: center;">
                    <div style="width: 64px; height: 64px; background-color: ${primaryColor}; background: linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px; box-shadow: 0 4px 12px ${primaryColor}40;">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <circle cx="12" cy="7" r="4" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                    </div>
                    <h1 style="margin: 0 0 10px 0; font-size: 32px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px; text-shadow: 0 2px 10px rgba(0,0,0,0.3);">Attiva il tuo Account</h1>
                    <p style="margin: 0; font-size: 16px; color: #e2e8f0; line-height: 1.5;">Benvenuto <strong style="color: #60a5fa; font-weight: 600;">${customerName}</strong></p>
                    <p style="margin: 5px 0 0 0; font-size: 14px; color: #94a3b8;">Imposta una password sicura per proteggere il tuo account</p>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 0 40px 40px 40px;">
                    <p style="margin: 0 0 25px 0; font-size: 15px; color: #cbd5e1; line-height: 1.6; text-align: center;">
                      Sei stato registrato nel programma fedeltà di <strong style="color: #ffffff;">${organizationName}</strong>!<br/>
                      Per completare la registrazione, imposta la tua password.
                    </p>

                    <!-- CTA Button -->
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td align="center" style="padding: 10px 0 30px 0;">
                          <a href="${activationLink}" style="display: inline-block; background-color: ${primaryColor}; background: linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%); color: white; padding: 16px 48px; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 15px; letter-spacing: 0.5px; text-transform: uppercase; box-shadow: 0 8px 20px ${primaryColor}40; transition: all 0.3s;">
                            Attiva Account
                          </a>
                        </td>
                      </tr>
                    </table>

                    <p style="margin: 0 0 15px 0; font-size: 13px; color: #94a3b8; line-height: 1.6; text-align: center;">
                      Oppure copia e incolla questo link nel tuo browser:
                    </p>

                    <p style="margin: 0 0 30px 0; padding: 12px; background-color: #0f172a; background: rgba(15, 23, 42, 0.6); border-radius: 8px; border: 1px solid rgba(59, 130, 246, 0.3); font-size: 12px; color: #60a5fa; word-break: break-all; font-family: monospace; text-align: center;">
                      ${activationLink}
                    </p>

                    <!-- Benefits Box -->
                    <div style="margin: 0; padding: 25px; background-color: #1e3a8a; background: rgba(59, 130, 246, 0.1); border-left: 4px solid ${primaryColor}; border-radius: 8px; border: 1px solid rgba(59, 130, 246, 0.2);">
                      <h3 style="margin: 0 0 15px 0; font-size: 16px; font-weight: 700; color: #60a5fa; text-transform: uppercase; letter-spacing: 0.5px;">Cosa puoi fare dopo l'attivazione:</h3>
                      <ul style="margin: 0; padding-left: 20px; color: #e2e8f0; font-size: 14px; line-height: 2;">
                        <li>Accumula punti ad ogni acquisto</li>
                        <li>Sblocca premi esclusivi</li>
                        <li>Raggiungi livelli superiori per vantaggi speciali</li>
                        <li>Ricevi offerte personalizzate</li>
                      </ul>
                    </div>

                    <p style="margin: 25px 0 0 0; font-size: 12px; color: #64748b; line-height: 1.6; text-align: center; font-style: italic;">
                      Questo link è valido per 48 ore. Se non hai richiesto questa registrazione, ignora questa email.
                    </p>
                  </td>
                </tr>

                <!-- Powered by -->
                <tr>
                  <td style="padding: 0 0 30px 0; text-align: center;">
                    <p style="margin: 0; font-size: 13px; color: #64748b; font-weight: 500;">
                      Powered by <span style="color: #94a3b8; font-weight: 600;">OmnilyPro</span>
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
      subject: `Attiva il tuo account - ${organizationName}`,
      html: htmlWithBrandedFooter,
      organizationId
    })
  }

  /**
   * Invia email invito business owner con link pagamento
   */
  async sendBusinessInviteEmail(
    email: string,
    planType: 'basic' | 'premium' | 'enterprise',
    inviteToken: string
  ): Promise<{ success: boolean; error?: string }> {
    const planDetails = {
      basic: { name: 'Basic', price: '€49', color: '#3b82f6', features: ['POS essenziale', 'Fino a 5 utenti', 'Report base'] },
      premium: { name: 'Premium', price: '€99', color: '#8b5cf6', features: ['POS completo', 'Utenti illimitati', 'Report avanzati', 'App mobile'] },
      enterprise: { name: 'Enterprise', price: '€199', color: '#f59e0b', features: ['Tutte le funzioni Premium', 'Multi-sede', 'API dedicate', 'Supporto prioritario'] }
    }

    const plan = planDetails[planType]
    const registerLink = `${this.getBaseUrl()}/activate/${inviteToken}`

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="color-scheme" content="light dark">
        <meta name="supported-color-schemes" content="light dark">
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f5; padding: 40px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr>
                  <td style="background-color: ${plan.color}; background: linear-gradient(135deg, ${plan.color} 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                    <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: white; letter-spacing: 0.5px;">🎉 Benvenuto in OMNILY PRO!</h1>
                    <p style="margin: 15px 0 0 0; font-size: 16px; color: rgba(255,255,255,0.9);">Il tuo sistema POS completo</p>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <p style="margin: 0 0 20px 0; font-size: 16px; color: #333; line-height: 1.6;">
                      Sei stato invitato ad unirti a <strong>OMNILY PRO</strong> con il piano <strong>${plan.name}</strong>!
                    </p>

                    <!-- Piano selezionato -->
                    <div style="margin: 30px 0; padding: 25px; background-color: ${plan.color}10; background: linear-gradient(135deg, ${plan.color}10 0%, ${plan.color}05 100%); border-left: 4px solid ${plan.color}; border-radius: 8px;">
                      <h2 style="margin: 0 0 15px 0; font-size: 24px; color: ${plan.color};">Piano ${plan.name}</h2>
                      <p style="margin: 0 0 15px 0; font-size: 32px; font-weight: 700; color: #333;">${plan.price}<span style="font-size: 16px; font-weight: 400; color: #666;">/mese</span></p>
                      <h3 style="margin: 20px 0 10px 0; font-size: 16px; color: #333;">✨ Caratteristiche incluse:</h3>
                      <ul style="margin: 0; padding-left: 20px; color: #333; font-size: 14px; line-height: 1.8;">
                        ${plan.features.map(f => `<li>${f}</li>`).join('')}
                      </ul>
                    </div>

                    <p style="margin: 0 0 30px 0; font-size: 16px; color: #333; line-height: 1.6;">
                      Per completare la registrazione e attivare il tuo account, clicca sul pulsante qui sotto:
                    </p>

                    <!-- CTA Button -->
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td align="center" style="padding: 20px 0;">
                          <a href="${registerLink}" style="display: inline-block; background-color: ${plan.color}; background: linear-gradient(135deg, ${plan.color} 0%, #764ba2 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);">
                            Registrati e Paga
                          </a>
                        </td>
                      </tr>
                    </table>

                    <p style="margin: 30px 0 20px 0; font-size: 14px; color: #666; line-height: 1.6;">
                      Oppure copia e incolla questo link nel tuo browser:
                    </p>

                    <p style="margin: 0 0 30px 0; padding: 15px; background: #f8f9fa; border-radius: 6px; font-size: 13px; color: ${plan.color}; word-break: break-all; font-family: monospace;">
                      ${registerLink}
                    </p>

                    <div style="margin: 30px 0 0 0; padding: 20px; background: #f0f9ff; border-left: 4px solid #3b82f6; border-radius: 6px;">
                      <h3 style="margin: 0 0 10px 0; font-size: 16px; color: #1e40af;">💳 Cosa succede dopo:</h3>
                      <ol style="margin: 10px 0 0 0; padding-left: 20px; color: #333; font-size: 14px; line-height: 1.8;">
                        <li>Completa la registrazione con i tuoi dati</li>
                        <li>Effettua il pagamento sicuro tramite Stripe</li>
                        <li>Accedi immediatamente alla tua dashboard</li>
                        <li>Configura il tuo sistema POS</li>
                      </ol>
                    </div>

                    <p style="margin: 30px 0 0 0; font-size: 13px; color: #999; line-height: 1.6;">
                      <em>Questo link è valido per 7 giorni. Se non hai richiesto questa registrazione, ignora questa email.</em>
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: ${plan.color}; background: linear-gradient(135deg, ${plan.color} 0%, #764ba2 100%); padding: 30px; text-align: center;">
                    <p style="color: white; font-size: 16px; font-weight: 600; margin: 0 0 10px 0;">Grazie per aver scelto OMNILY PRO!</p>
                    <p style="color: rgba(255,255,255,0.8); font-size: 12px; margin: 0;">Il sistema POS che fa crescere il tuo business</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `

    return this.sendEmail({
      to: email,
      subject: `🎉 Sei stato invitato ad OMNILY PRO - Piano ${plan.name}`,
      html,
      from: 'OMNILY PRO <noreply@omnilypro.com>'
    })
  }

  /**
   * Invia email reset password
   */
  async sendPasswordResetEmail(
    email: string,
    resetToken: string
  ): Promise<{ success: boolean; error?: string }> {
    // Usa URL di produzione se siamo in sviluppo
    const baseUrl = window.location.hostname === 'localhost'
      ? 'https://omnilypro.com'
      : window.location.origin
    const resetLink = `${baseUrl}/reset-password?token=${resetToken}`

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
                  <td style="background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); padding: 40px 30px; text-align: center;">
                    <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: white; letter-spacing: 0.5px;">🔐 Reset Password</h1>
                    <p style="margin: 15px 0 0 0; font-size: 16px; color: rgba(255,255,255,0.9);">OMNILY PRO</p>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <p style="margin: 0 0 20px 0; font-size: 16px; color: #333; line-height: 1.6;">
                      Hai richiesto il reset della password per il tuo account <strong>OMNILY PRO</strong>.
                    </p>

                    <div style="margin: 30px 0; padding: 20px; background: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 8px;">
                      <p style="margin: 0; font-size: 14px; color: #1e40af; line-height: 1.6;">
                        ℹ️ <strong>Importante:</strong> Questo link è valido per <strong>24 ore</strong>. Se non hai richiesto questo reset, puoi ignorare questa email in sicurezza.
                      </p>
                    </div>

                    <p style="margin: 0 0 30px 0; font-size: 16px; color: #333; line-height: 1.6;">
                      Per reimpostare la tua password, clicca sul pulsante qui sotto:
                    </p>

                    <!-- CTA Button -->
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td align="center" style="padding: 20px 0;">
                          <a href="${resetLink}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); color: white; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);">
                            🔑 Reimposta Password
                          </a>
                        </td>
                      </tr>
                    </table>

                    <p style="margin: 30px 0 0 0; font-size: 14px; color: #666; line-height: 1.6;">
                      Se il pulsante non funziona, copia e incolla questo link nel tuo browser:
                    </p>
                    <p style="margin: 10px 0 0 0; font-size: 12px; color: #999; word-break: break-all; padding: 10px; background: #f5f5f5; border-radius: 4px;">
                      ${resetLink}
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 30px; text-align: center;">
                    <p style="color: white; font-size: 18px; font-weight: 600; margin: 0 0 10px 0;">OMNILY PRO</p>
                    <p style="color: rgba(255,255,255,0.8); font-size: 12px; margin: 0;">Il sistema POS che fa crescere il tuo business</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `

    return this.sendEmail({
      to: email,
      subject: '🔐 Reset Password - OMNILY PRO',
      html,
      from: 'OMNILY PRO <noreply@omnilypro.com>'
    })
  }
}

export const emailService = new EmailService()
