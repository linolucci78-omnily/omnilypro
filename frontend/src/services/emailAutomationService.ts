/**
 * Email Automation Service
 * Gestisce l'invio automatico di email per eventi specifici
 */

import { supabase } from '../lib/supabase'

export interface SendAutomatedEmailParams {
  organizationId: string
  automationType: 'welcome' | 'tier_upgrade' | 'birthday' | 'special_event' | 'winback' | 'anniversary' | 'review_request'
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

/**
 * Invia email win-back a clienti inattivi
 */
export const sendWinbackEmail = async (
  organizationId: string,
  customer: {
    id: string
    name: string
    email: string
    points: number
    tier: string
    last_visit?: string
  }
): Promise<boolean> => {
  console.log('[EmailAutomation] Sending win-back email to:', customer.email)

  // Get organization settings
  const { data: organizationSettings, error: orgError } = await supabase
    .from('organizations')
    .select('name, primary_color, secondary_color, logo_url, website, winback_days_threshold, winback_bonus_points')
    .eq('id', organizationId)
    .single()

  if (orgError || !organizationSettings) {
    console.error('[EmailAutomation] Error fetching organization:', orgError)
    return false
  }

  // Calculate days since last visit
  const daysSinceLastVisit = customer.last_visit
    ? Math.floor((Date.now() - new Date(customer.last_visit).getTime()) / (1000 * 60 * 60 * 24))
    : organizationSettings.winback_days_threshold || 30

  // Bonus points for win-back
  const bonusPoints = organizationSettings.winback_bonus_points || 50

  // Expiration date (30 days from now)
  const expirationDate = new Date()
  expirationDate.setDate(expirationDate.getDate() + 30)
  const expiryDateFormatted = expirationDate.toLocaleDateString('it-IT')

  return sendAutomatedEmail({
    organizationId,
    automationType: 'winback',
    customerEmail: customer.email,
    customerName: customer.name,
    dynamicData: {
      customer_name: customer.name,
      store_name: organizationSettings.name,
      days_inactive: daysSinceLastVisit,
      bonus_points: bonusPoints,
      current_points: customer.points,
      tier: customer.tier,
      expiry_date: expiryDateFormatted,
      store_url: organizationSettings.website || 'https://omnilypro.com'
    }
  })
}

/**
 * Get win-back campaign statistics
 */
export const getWinbackStats = async (organizationId: string) => {
  try {
    // Get win-back automation configuration (if exists)
    const { data: winbackAutomation, error } = await supabase
      .from('email_automations')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('automation_type', 'winback')
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw error
    }

    // If no winback automation exists, return zeros
    if (!winbackAutomation) {
      return {
        totalSent: 0,
        totalOpened: 0,
        totalClicked: 0,
        customersReturned: 0,
        openRate: '0',
        clickRate: '0',
        returnRate: '0'
      }
    }

    // Use aggregated statistics from automation record
    const totalSent = winbackAutomation.total_sent || 0
    const totalOpened = winbackAutomation.total_opened || 0
    const totalClicked = winbackAutomation.total_clicked || 0

    // For now, estimate return rate at 20% of opened emails
    // TODO: Implement proper tracking when email tracking system is in place
    const customersReturned = Math.floor(totalOpened * 0.2)

    return {
      totalSent,
      totalOpened,
      totalClicked,
      customersReturned,
      openRate: totalSent > 0 ? ((totalOpened / totalSent) * 100).toFixed(1) : '0',
      clickRate: totalSent > 0 ? ((totalClicked / totalSent) * 100).toFixed(1) : '0',
      returnRate: totalSent > 0 ? ((customersReturned / totalSent) * 100).toFixed(1) : '0'
    }
  } catch (error) {
    console.error('[EmailAutomation] Error getting win-back stats:', error)
    return {
      totalSent: 0,
      totalOpened: 0,
      totalClicked: 0,
      customersReturned: 0,
      openRate: '0',
      clickRate: '0',
      returnRate: '0'
    }
  }
}

/**
 * Send anniversary email to customer
 */
export const sendAnniversaryEmail = async (
  organizationId: string,
  customer: {
    id: string
    name: string
    email: string
    points: number
    tier: string
    created_at: string
    total_spent?: number
    visit_count?: number
  },
  yearlyStats?: {
    spent: number
    pointsEarned: number
    visits: number
  }
): Promise<boolean> => {
  console.log('[EmailAutomation] Sending anniversary email to:', customer.email)

  try {
    // Calculate years of membership
    const createdDate = new Date(customer.created_at)
    const today = new Date()
    const yearsOfMembership = today.getFullYear() - createdDate.getFullYear()

    if (yearsOfMembership < 1) {
      console.log('[EmailAutomation] Customer has less than 1 year of membership, skipping')
      return false
    }

    // Get organization settings
    const { data: organizationSettings, error: orgError } = await supabase
      .from('organizations')
      .select('name, primary_color, secondary_color, logo_url, website')
      .eq('id', organizationId)
      .single()

    if (orgError || !organizationSettings) {
      console.error('[EmailAutomation] Error fetching organization:', orgError)
      return false
    }

    // Calculate bonus points based on years
    let bonusPoints = 100
    if (yearsOfMembership >= 5) {
      bonusPoints = 500
    } else if (yearsOfMembership >= 3) {
      bonusPoints = 300
    } else if (yearsOfMembership >= 2) {
      bonusPoints = 200
    }

    // Use provided yearly stats or defaults
    const stats = yearlyStats || {
      spent: 0,
      pointsEarned: 0,
      visits: 0
    }

    return sendAutomatedEmail({
      organizationId,
      automationType: 'anniversary',
      customerEmail: customer.email,
      customerName: customer.name,
      dynamicData: {
        customer_name: customer.name,
        store_name: organizationSettings.name,
        years_of_membership: yearsOfMembership,
        bonus_points: bonusPoints,
        current_points: customer.points,
        tier: customer.tier || 'Bronze',
        total_spent: customer.total_spent?.toFixed(2) || '0.00',
        total_visits: customer.visit_count || 0,
        yearly_spent: stats.spent.toFixed(2),
        yearly_points_earned: stats.pointsEarned,
        yearly_visits: stats.visits,
        store_url: organizationSettings.website || 'https://omnilypro.com',
        primary_color: organizationSettings.primary_color || '#dc2626'
      }
    })
  } catch (error) {
    console.error('[EmailAutomation] Error sending anniversary email:', error)
    return false
  }
}

/**
 * Get anniversary campaign statistics
 */
export const getAnniversaryStats = async (organizationId: string) => {
  try {
    // Get anniversary automation configuration (if exists)
    const { data: anniversaryAutomation, error } = await supabase
      .from('email_automations')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('automation_type', 'anniversary')
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw error
    }

    // If no anniversary automation exists, return zeros
    if (!anniversaryAutomation) {
      return {
        totalSent: 0,
        totalOpened: 0,
        totalClicked: 0,
        openRate: '0',
        clickRate: '0'
      }
    }

    // Use aggregated statistics from automation record
    const totalSent = anniversaryAutomation.total_sent || 0
    const totalOpened = anniversaryAutomation.total_opened || 0
    const totalClicked = anniversaryAutomation.total_clicked || 0

    return {
      totalSent,
      totalOpened,
      totalClicked,
      openRate: totalSent > 0 ? ((totalOpened / totalSent) * 100).toFixed(1) : '0',
      clickRate: totalSent > 0 ? ((totalClicked / totalSent) * 100).toFixed(1) : '0'
    }
  } catch (error) {
    console.error('[EmailAutomation] Error getting anniversary stats:', error)
    return {
      totalSent: 0,
      totalOpened: 0,
      totalClicked: 0,
      openRate: '0',
      clickRate: '0'
    }
  }
}

/**
 * Send review request email to customer
 */
export const sendReviewRequestEmail = async (
  organizationId: string,
  customer: {
    id: string
    name: string
    email: string
  },
  transaction: {
    id: string
    amount: number
    points_earned: number
    created_at: string
  }
): Promise<boolean> => {
  console.log('[EmailAutomation] Sending review request email to:', customer.email)

  try {
    // Get organization settings
    const { data: organizationSettings, error: orgError } = await supabase
      .from('organizations')
      .select('name, primary_color, website, review_request_bonus_points')
      .eq('id', organizationId)
      .single()

    if (orgError || !organizationSettings) {
      console.error('[EmailAutomation] Error fetching organization:', orgError)
      return false
    }

    // Get total reviews count for social proof
    const { count: totalReviews } = await supabase
      .from('customer_reviews')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('is_public', true)

    // Generate review URL
    const reviewUrl = `${process.env.REACT_APP_SUPABASE_URL}/functions/v1/submit-review?org=${organizationId}&customer=${customer.id}&transaction=${transaction.id}`

    return sendAutomatedEmail({
      organizationId,
      automationType: 'review_request',
      customerEmail: customer.email,
      customerName: customer.name,
      dynamicData: {
        customer_name: customer.name,
        store_name: organizationSettings.name,
        purchase_date: new Date(transaction.created_at).toLocaleDateString('it-IT'),
        purchase_amount: transaction.amount.toFixed(2),
        points_earned: transaction.points_earned || 0,
        bonus_points: organizationSettings.review_request_bonus_points || 50,
        review_url: reviewUrl,
        store_url: organizationSettings.website || 'https://omnilypro.com',
        primary_color: organizationSettings.primary_color || '#dc2626',
        total_reviews: totalReviews || 0
      }
    })
  } catch (error) {
    console.error('[EmailAutomation] Error sending review request email:', error)
    return false
  }
}

/**
 * Get review request campaign statistics
 */
export const getReviewRequestStats = async (organizationId: string) => {
  try {
    // Get review request automation configuration (if exists)
    const { data: reviewAutomation, error } = await supabase
      .from('email_automations')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('automation_type', 'review_request')
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw error
    }

    // Get total reviews count
    const { count: totalReviews } = await supabase
      .from('customer_reviews')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)

    // Get average rating
    const { data: reviews } = await supabase
      .from('customer_reviews')
      .select('rating')
      .eq('organization_id', organizationId)

    let averageRating = 0
    if (reviews && reviews.length > 0) {
      const sum = reviews.reduce((acc, r) => acc + r.rating, 0)
      averageRating = sum / reviews.length
    }

    // If no review automation exists, return basic stats
    if (!reviewAutomation) {
      return {
        totalSent: 0,
        totalOpened: 0,
        totalClicked: 0,
        totalReviews: totalReviews || 0,
        averageRating: averageRating.toFixed(1),
        conversionRate: '0',
        openRate: '0',
        clickRate: '0'
      }
    }

    // Use aggregated statistics from automation record
    const totalSent = reviewAutomation.total_sent || 0
    const totalOpened = reviewAutomation.total_opened || 0
    const totalClicked = reviewAutomation.total_clicked || 0

    return {
      totalSent,
      totalOpened,
      totalClicked,
      totalReviews: totalReviews || 0,
      averageRating: averageRating.toFixed(1),
      conversionRate: totalSent > 0 ? (((totalReviews || 0) / totalSent) * 100).toFixed(1) : '0',
      openRate: totalSent > 0 ? ((totalOpened / totalSent) * 100).toFixed(1) : '0',
      clickRate: totalSent > 0 ? ((totalClicked / totalSent) * 100).toFixed(1) : '0'
    }
  } catch (error) {
    console.error('[EmailAutomation] Error getting review request stats:', error)
    return {
      totalSent: 0,
      totalOpened: 0,
      totalClicked: 0,
      totalReviews: 0,
      averageRating: '0',
      conversionRate: '0',
      openRate: '0',
      clickRate: '0'
    }
  }
}

/**
 * Get recent reviews for organization
 */
export const getRecentReviews = async (organizationId: string, limit: number = 10) => {
  try {
    const { data: reviews, error } = await supabase
      .from('customer_reviews')
      .select(`
        id,
        rating,
        comment,
        platform,
        created_at,
        customers (
          name,
          email
        )
      `)
      .eq('organization_id', organizationId)
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('[EmailAutomation] Error fetching reviews:', error)
      return []
    }

    return reviews || []
  } catch (error) {
    console.error('[EmailAutomation] Error getting recent reviews:', error)
    return []
  }
}
