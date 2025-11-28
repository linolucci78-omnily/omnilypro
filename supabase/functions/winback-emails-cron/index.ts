// Win-back Email Automation - Supabase Edge Function
// Runs daily to detect inactive customers and send win-back campaigns
// Cron: 0 10 * * * (Every day at 10:00 AM)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface Customer {
  id: string
  organization_id: string
  name: string
  email: string
  phone?: string
  last_visit?: string
  points: number
  tier: string
  is_active: boolean
}

interface Organization {
  id: string
  name: string
  primary_color: string
  secondary_color: string
  logo_url?: string
  enable_email_notifications?: boolean
  winback_enabled?: boolean
  winback_days_threshold?: number
  winback_bonus_points?: number
}

interface WinbackStats {
  totalProcessed: number
  emailsSent: number
  errors: number
  organizationsProcessed: number
}

serve(async (req) => {
  try {
    console.log('🚀 [WIN-BACK CRON] Starting win-back email automation...')

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const stats: WinbackStats = {
      totalProcessed: 0,
      emailsSent: 0,
      errors: 0,
      organizationsProcessed: 0
    }

    // 1. Get all active organizations with win-back enabled
    const { data: organizations, error: orgError } = await supabase
      .from('organizations')
      .select('id, name, primary_color, secondary_color, logo_url, enable_email_notifications, winback_enabled, winback_days_threshold, winback_bonus_points')
      .eq('is_active', true)

    if (orgError) {
      console.error('❌ [WIN-BACK CRON] Error fetching organizations:', orgError)
      throw orgError
    }

    console.log(`📊 [WIN-BACK CRON] Found ${organizations?.length || 0} active organizations`)

    // 2. Process each organization
    for (const org of organizations || []) {
      // Skip if win-back is disabled for this org
      if (org.winback_enabled === false) {
        console.log(`⏭️ [WIN-BACK CRON] Skipping org ${org.name} - win-back disabled`)
        continue
      }

      // Skip if email notifications are disabled
      if (org.enable_email_notifications === false) {
        console.log(`⏭️ [WIN-BACK CRON] Skipping org ${org.name} - email notifications disabled`)
        continue
      }

      stats.organizationsProcessed++

      // Default: 30 days of inactivity
      const daysThreshold = org.winback_days_threshold || 30
      const bonusPoints = org.winback_bonus_points || 50

      console.log(`🏢 [WIN-BACK CRON] Processing org: ${org.name} (${daysThreshold} days threshold, ${bonusPoints} bonus points)`)

      // 3. Find inactive customers
      const thresholdDate = new Date()
      thresholdDate.setDate(thresholdDate.getDate() - daysThreshold)

      const { data: inactiveCustomers, error: customersError } = await supabase
        .from('customers')
        .select('id, organization_id, name, email, phone, last_visit, points, tier, is_active')
        .eq('organization_id', org.id)
        .eq('is_active', true)
        .not('email', 'is', null)
        .lt('last_visit', thresholdDate.toISOString())

      if (customersError) {
        console.error(`❌ [WIN-BACK CRON] Error fetching customers for ${org.name}:`, customersError)
        stats.errors++
        continue
      }

      console.log(`👥 [WIN-BACK CRON] Found ${inactiveCustomers?.length || 0} inactive customers for ${org.name}`)

      // 4. Check if we already sent win-back email to these customers recently
      // (avoid spamming - only send once every 60 days)
      const recentWinbackDate = new Date()
      recentWinbackDate.setDate(recentWinbackDate.getDate() - 60)

      for (const customer of inactiveCustomers || []) {
        stats.totalProcessed++

        // Check if we sent a win-back email in the last 60 days
        const { data: recentWinback, error: winbackCheckError } = await supabase
          .from('email_automations')
          .select('id, sent_at')
          .eq('organization_id', org.id)
          .eq('automation_type', 'winback')
          .eq('recipient_email', customer.email)
          .gte('sent_at', recentWinbackDate.toISOString())
          .limit(1)

        if (winbackCheckError) {
          console.error(`❌ [WIN-BACK CRON] Error checking recent win-back for ${customer.email}:`, winbackCheckError)
          stats.errors++
          continue
        }

        if (recentWinback && recentWinback.length > 0) {
          console.log(`⏭️ [WIN-BACK CRON] Skipping ${customer.email} - win-back sent recently (${recentWinback[0].sent_at})`)
          continue
        }

        // 5. Send win-back email
        try {
          await sendWinbackEmail(supabase, org, customer, bonusPoints, daysThreshold)
          stats.emailsSent++
          console.log(`✅ [WIN-BACK CRON] Win-back email sent to ${customer.email}`)
        } catch (emailError) {
          console.error(`❌ [WIN-BACK CRON] Error sending win-back email to ${customer.email}:`, emailError)
          stats.errors++
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    console.log('🎉 [WIN-BACK CRON] Win-back automation completed!')
    console.log(`📊 [WIN-BACK CRON] Stats:`, stats)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Win-back email automation completed',
        stats
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error: any) {
    console.error('❌ [WIN-BACK CRON] Fatal error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})

/**
 * Send win-back email to inactive customer
 */
async function sendWinbackEmail(
  supabase: any,
  org: Organization,
  customer: Customer,
  bonusPoints: number,
  daysInactive: number
): Promise<void> {
  const daysSinceLastVisit = customer.last_visit
    ? Math.floor((Date.now() - new Date(customer.last_visit).getTime()) / (1000 * 60 * 60 * 24))
    : daysInactive

  // Calculate expiration date (30 days from now)
  const expirationDate = new Date()
  expirationDate.setDate(expirationDate.getDate() + 30)

  // Email subject
  const subject = `${customer.name}, ci manchi! 🎁 ${bonusPoints} punti bonus ti aspettano`

  // Email body with dynamic variables
  const emailBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Win-back Email</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, ${org.primary_color || '#3b82f6'} 0%, ${org.secondary_color || '#06b6d4'} 100%); padding: 40px 20px; text-align: center;">
              ${org.logo_url ? `<img src="${org.logo_url}" alt="${org.name}" style="max-width: 150px; margin-bottom: 20px;">` : ''}
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Ci Manchi! 💙</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #333333; margin: 0 0 20px 0;">Ciao ${customer.name},</h2>

              <p style="color: #666666; line-height: 1.6; margin: 0 0 20px 0;">
                Sono passati <strong>${daysSinceLastVisit} giorni</strong> dalla tua ultima visita da <strong>${org.name}</strong> e non vediamo l'ora di rivederti!
              </p>

              <p style="color: #666666; line-height: 1.6; margin: 0 0 30px 0;">
                Vogliamo darti il benvenuto ancora una volta con un regalo speciale:
              </p>

              <!-- Bonus Points Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, ${org.primary_color || '#3b82f6'} 0%, ${org.secondary_color || '#06b6d4'} 100%); border-radius: 8px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 30px; text-align: center;">
                    <div style="font-size: 48px; margin-bottom: 10px;">🎁</div>
                    <h3 style="color: #ffffff; margin: 0 0 10px 0; font-size: 24px;">${bonusPoints} Punti Bonus</h3>
                    <p style="color: rgba(255,255,255,0.9); margin: 0; font-size: 14px;">
                      Validi sulla tua prossima visita
                    </p>
                  </td>
                </tr>
              </table>

              <div style="background-color: #f8f9fa; border-left: 4px solid ${org.primary_color || '#3b82f6'}; padding: 15px; margin-bottom: 30px;">
                <p style="color: #666666; margin: 0; font-size: 14px;">
                  <strong>Il tuo saldo attuale:</strong> ${customer.points} punti<br>
                  <strong>Tier:</strong> ${customer.tier}<br>
                  <strong>Offerta valida fino al:</strong> ${expirationDate.toLocaleDateString('it-IT')}
                </p>
              </div>

              <p style="color: #666666; line-height: 1.6; margin: 0 0 30px 0;">
                Non perdere questa occasione! Torna a trovarci e ricevi i tuoi ${bonusPoints} punti bonus automaticamente.
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${org.logo_url ? org.logo_url.split('/').slice(0, 3).join('/') : '#'}" style="display: inline-block; background: linear-gradient(135deg, ${org.primary_color || '#3b82f6'} 0%, ${org.secondary_color || '#06b6d4'} 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 6px; font-weight: bold; font-size: 16px;">
                      Visualizza la Mia Card
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="color: #999999; margin: 0 0 10px 0; font-size: 14px;">
                Ti aspettiamo presto da ${org.name}!
              </p>
              <p style="color: #cccccc; margin: 0; font-size: 12px;">
                Questa è una email automatica. Per maggiori informazioni contattaci.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()

  // Send email via Supabase (using configured SMTP or Supabase email service)
  const { error: sendError } = await supabase.functions.invoke('send-campaign', {
    body: {
      to: customer.email,
      subject,
      html: emailBody,
      organizationId: org.id
    }
  })

  if (sendError) {
    console.error(`❌ Error sending email to ${customer.email}:`, sendError)
    throw sendError
  }

  // Log automation in database
  const { error: logError } = await supabase
    .from('email_automations')
    .insert({
      organization_id: org.id,
      automation_type: 'winback',
      recipient_email: customer.email,
      recipient_name: customer.name,
      subject,
      content: emailBody,
      status: 'sent',
      sent_at: new Date().toISOString(),
      metadata: {
        customer_id: customer.id,
        days_inactive: daysSinceLastVisit,
        bonus_points: bonusPoints,
        customer_tier: customer.tier,
        current_points: customer.points
      }
    })

  if (logError) {
    console.warn(`⚠️ Error logging win-back email:`, logError)
    // Don't throw - email was sent successfully
  }
}
