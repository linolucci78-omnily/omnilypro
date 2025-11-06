/**
 * Email Automation Service
 * Gestisce l'invio automatico di email per eventi specifici
 */

import { supabase } from '../lib/supabase'

export interface SendAutomatedEmailParams {
  organizationId: string
  automationType: 'welcome' | 'tier_upgrade' | 'birthday' | 'special_event'
  customerEmail: string
  customerName: string
  dynamicData: Record<string, any>
}

/**
 * Controlla se un'automazione è abilitata per l'organizzazione
 */
export const isAutomationEnabled = async (
  organizationId: string,
  automationType: string
): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('email_automations')
      .select('enabled')
      .eq('organization_id', organizationId)
      .eq('automation_type', automationType)
      .eq('enabled', true)
      .single()

    if (error) {
      console.log(`[EmailAutomation] No automation configured for ${automationType}`)
      return false
    }

    return data?.enabled || false
  } catch (error) {
    console.error('[EmailAutomation] Error checking automation:', error)
    return false
  }
}

/**
 * Invia un'email automatica
 */
export const sendAutomatedEmail = async (params: SendAutomatedEmailParams): Promise<boolean> => {
  const { organizationId, automationType, customerEmail, customerName, dynamicData } = params

  try {
    console.log(`[EmailAutomation] 📧 Checking ${automationType} automation for org ${organizationId}`)

    // 1. Controlla se l'automazione è abilitata
    const enabled = await isAutomationEnabled(organizationId, automationType)
    if (!enabled) {
      console.log(`[EmailAutomation] ⏭️  ${automationType} automation is disabled, skipping`)
      return false
    }

    // 2. Ottieni la configurazione dell'automazione
    const { data: automation, error: automationError } = await supabase
      .from('email_automations')
      .select('*, template_id')
      .eq('organization_id', organizationId)
      .eq('automation_type', automationType)
      .single()

    if (automationError || !automation) {
      console.error('[EmailAutomation] ❌ Automation not found:', automationError)
      return false
    }

    // 3. Ottieni il template (usa quello specifico o fallback a default globale)
    let templateId = automation.template_id

    // Se non c'è template_id specifico, usa quello globale di default
    if (!templateId) {
      const { data: defaultTemplate } = await supabase
        .from('email_templates')
        .select('id')
        .is('organization_id', null)
        .eq('template_type', automationType)
        .eq('is_active', true)
        .single()

      templateId = defaultTemplate?.id
    }

    if (!templateId) {
      console.error('[EmailAutomation] ❌ No template found for', automationType)
      return false
    }

    console.log(`[EmailAutomation] ✅ Automation enabled, sending ${automationType} email to ${customerEmail}`)

    // 4. Invia email tramite edge function
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: {
        organization_id: organizationId,
        template_type: automationType,
        to_email: customerEmail,
        to_name: customerName,
        dynamic_data: dynamicData
      }
    })

    if (error) {
      console.error('[EmailAutomation] ❌ Error sending email:', error)
      return false
    }

    // 5. Aggiorna statistiche dell'automazione
    await supabase
      .from('email_automations')
      .update({
        total_sent: automation.total_sent + 1,
        last_sent_at: new Date().toISOString()
      })
      .eq('id', automation.id)

    console.log(`[EmailAutomation] ✅ ${automationType} email sent successfully!`, data)
    return true

  } catch (error) {
    console.error('[EmailAutomation] ❌ Unexpected error:', error)
    return false
  }
}

/**
 * Invia email di benvenuto quando un cliente si registra
 */
export const sendWelcomeEmail = async (
  organizationId: string,
  customer: {
    email: string
    name: string
    points: number
    tier: string
  },
  organizationSettings: {
    name: string
    pointsPerEuro: number
    website?: string
  }
): Promise<void> => {
  if (!customer.email) {
    console.log('[EmailAutomation] No email provided for customer, skipping welcome email')
    return
  }

  await sendAutomatedEmail({
    organizationId,
    automationType: 'welcome',
    customerEmail: customer.email,
    customerName: customer.name,
    dynamicData: {
      store_name: organizationSettings.name,
      customer_name: customer.name,
      tier: customer.tier || 'Bronze',
      current_points: customer.points || 0,
      points_per_euro: organizationSettings.pointsPerEuro || 1,
      store_url: organizationSettings.website || 'https://omnilypro.com',
      reply_to_email: 'support@omnilypro.com'
    }
  })
}

/**
 * Invia email quando un cliente sale di tier
 */
export const sendTierUpgradeEmail = async (
  organizationId: string,
  customer: {
    email: string
    name: string
    points: number
  },
  tierUpgrade: {
    oldTier: string
    oldTierIcon: string
    newTier: string
    newTierIcon: string
    newTierColor: string
    multiplier: number
    totalSpent: number
  },
  organizationName: string
): Promise<void> => {
  if (!customer.email) {
    console.log('[EmailAutomation] No email provided for customer, skipping tier upgrade email')
    return
  }

  await sendAutomatedEmail({
    organizationId,
    automationType: 'tier_upgrade',
    customerEmail: customer.email,
    customerName: customer.name,
    dynamicData: {
      customer_name: customer.name,
      old_tier: tierUpgrade.oldTier,
      old_tier_icon: tierUpgrade.oldTierIcon,
      new_tier: tierUpgrade.newTier,
      new_tier_icon: tierUpgrade.newTierIcon,
      new_tier_color: tierUpgrade.newTierColor,
      current_points: customer.points,
      multiplier: tierUpgrade.multiplier,
      total_spent: tierUpgrade.totalSpent.toFixed(2),
      store_name: organizationName
    }
  })
}

/**
 * Invia email di compleanno
 */
export const sendBirthdayEmail = async (
  organizationId: string,
  customer: {
    email: string
    name: string
    points: number
    tier: string
    createdAt: string
  },
  birthdayBonus: {
    bonusPoints: number
    expiryDate: string
  },
  organizationSettings: {
    name: string
    website?: string
  }
): Promise<void> => {
  if (!customer.email) {
    console.log('[EmailAutomation] No email provided for customer, skipping birthday email')
    return
  }

  const memberSince = new Date(customer.createdAt).toLocaleDateString('it-IT', {
    month: 'long',
    year: 'numeric'
  })

  await sendAutomatedEmail({
    organizationId,
    automationType: 'birthday',
    customerEmail: customer.email,
    customerName: customer.name,
    dynamicData: {
      customer_name: customer.name,
      store_name: organizationSettings.name,
      bonus_points: birthdayBonus.bonusPoints,
      expiry_date: birthdayBonus.expiryDate,
      current_points: customer.points,
      tier: customer.tier,
      member_since: memberSince,
      store_url: organizationSettings.website || 'https://omnilypro.com'
    }
  })
}
