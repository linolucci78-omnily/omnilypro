import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Anniversary Emails Cron Job
 *
 * This edge function should be scheduled to run daily via Supabase Cron.
 * It checks for customers with membership anniversaries today and sends them celebration emails
 * if the anniversary automation is enabled for their organization.
 *
 * Schedule: Run daily at 10:00 AM (after birthday emails at 9:00 AM)
 * Cron expression: 0 10 * * *
 */

serve(async (req: Request) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🎉 Starting anniversary emails cron job...')

    // Initialize Supabase client with service role key
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get today's date (day and month only)
    const today = new Date()
    const todayMonth = today.getMonth() + 1 // JavaScript months are 0-indexed
    const todayDay = today.getDate()

    console.log(`📅 Checking for membership anniversaries on ${todayMonth}/${todayDay}...`)

    // Find all active customers
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('id, name, email, points, tier, organization_id, created_at, total_spent, visit_count')
      .not('email', 'is', null)
      .eq('is_active', true)

    if (customersError) {
      console.error('❌ Error fetching customers:', customersError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch customers', details: customersError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Filter customers with anniversaries today (client-side filtering)
    const anniversaryCustomers = customers?.filter(customer => {
      if (!customer.created_at) return false
      const createdDate = new Date(customer.created_at)
      const isAnniversaryToday = createdDate.getMonth() + 1 === todayMonth && createdDate.getDate() === todayDay

      // Calculate years of membership
      const yearsOfMembership = today.getFullYear() - createdDate.getFullYear()

      // Only send for 1+ years (skip if registered today)
      return isAnniversaryToday && yearsOfMembership >= 1
    }) || []

    console.log(`🎊 Found ${anniversaryCustomers.length} customers with anniversaries today`)

    if (anniversaryCustomers.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No anniversaries today',
          sent: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let sentCount = 0
    let skippedCount = 0
    let errorCount = 0

    // Process each anniversary customer
    for (const customer of anniversaryCustomers) {
      try {
        // Calculate years of membership
        const createdDate = new Date(customer.created_at)
        const yearsOfMembership = today.getFullYear() - createdDate.getFullYear()

        console.log(`🎉 Processing ${yearsOfMembership}-year anniversary for ${customer.name} (${customer.email})...`)

        // 1. Check if anniversary automation is enabled for this organization
        const { data: automation, error: automationError } = await supabase
          .from('email_automations')
          .select('*')
          .eq('organization_id', customer.organization_id)
          .eq('automation_type', 'anniversary')
          .eq('enabled', true)
          .single()

        if (automationError || !automation) {
          console.log(`⏭️  Anniversary automation not enabled for org ${customer.organization_id}, skipping`)
          skippedCount++
          continue
        }

        // 2. Get organization details
        const { data: organization, error: orgError } = await supabase
          .from('organizations')
          .select('name, website, points_per_euro, primary_color')
          .eq('id', customer.organization_id)
          .single()

        if (orgError || !organization) {
          console.error(`❌ Organization not found for ${customer.name}`)
          errorCount++
          continue
        }

        // 3. Calculate anniversary bonus points based on years
        // Year 1: 100 points, Year 2: 200 points, Year 3: 300 points, Year 5+: 500 points
        let bonusPoints = 100
        if (yearsOfMembership >= 5) {
          bonusPoints = 500
        } else if (yearsOfMembership >= 3) {
          bonusPoints = 300
        } else if (yearsOfMembership >= 2) {
          bonusPoints = 200
        }

        // 4. Calculate statistics for the past year
        const oneYearAgo = new Date()
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

        // Get transactions from the past year
        const { data: transactions, error: transactionsError } = await supabase
          .from('transactions')
          .select('amount, points_earned')
          .eq('customer_id', customer.id)
          .gte('created_at', oneYearAgo.toISOString())

        let yearlySpent = 0
        let yearlyPointsEarned = 0
        let yearlyVisits = 0

        if (!transactionsError && transactions) {
          yearlySpent = transactions.reduce((sum, t) => sum + (t.amount || 0), 0)
          yearlyPointsEarned = transactions.reduce((sum, t) => sum + (t.points_earned || 0), 0)
          yearlyVisits = transactions.length
        }

        // 5. Get template (org-specific or global default)
        let templateId = automation.template_id

        if (!templateId) {
          const { data: defaultTemplate } = await supabase
            .from('email_templates')
            .select('id')
            .is('organization_id', null)
            .eq('template_type', 'anniversary')
            .eq('is_active', true)
            .single()

          templateId = defaultTemplate?.id
        }

        if (!templateId) {
          console.error(`❌ No anniversary template found for ${customer.name}`)
          errorCount++
          continue
        }

        // 6. Send anniversary email via edge function
        console.log(`📧 Sending ${yearsOfMembership}-year anniversary email to ${customer.email}...`)

        const { data: emailResult, error: emailError } = await supabase.functions.invoke('send-email', {
          body: {
            organization_id: customer.organization_id,
            template_type: 'anniversary',
            to_email: customer.email,
            to_name: customer.name,
            dynamic_data: {
              customer_name: customer.name,
              store_name: organization.name,
              years_of_membership: yearsOfMembership,
              bonus_points: bonusPoints,
              current_points: customer.points,
              tier: customer.tier || 'Bronze',
              total_spent: customer.total_spent?.toFixed(2) || '0.00',
              total_visits: customer.visit_count || 0,
              // Past year statistics
              yearly_spent: yearlySpent.toFixed(2),
              yearly_points_earned: yearlyPointsEarned,
              yearly_visits: yearlyVisits,
              // Branding
              store_url: organization.website || 'https://omnilypro.com',
              primary_color: organization.primary_color || '#dc2626'
            }
          }
        })

        if (emailError) {
          console.error(`❌ Failed to send anniversary email to ${customer.email}:`, emailError)
          errorCount++
          continue
        }

        // 7. Update automation statistics
        await supabase
          .from('email_automations')
          .update({
            total_sent: automation.total_sent + 1,
            last_sent_at: new Date().toISOString()
          })
          .eq('id', automation.id)

        // 8. Add anniversary bonus points to customer
        await supabase
          .from('customers')
          .update({
            points: customer.points + bonusPoints
          })
          .eq('id', customer.id)

        // 9. Log the points activity
        await supabase
          .from('customer_activities')
          .insert({
            customer_id: customer.id,
            organization_id: customer.organization_id,
            type: 'points_added',
            description: `🎊 Bonus anniversario ${yearsOfMembership} ${yearsOfMembership === 1 ? 'anno' : 'anni'}: +${bonusPoints} punti`,
            points: bonusPoints,
            metadata: {
              reason: 'anniversary_bonus',
              years: yearsOfMembership,
              bonus_points: bonusPoints
            }
          })

        console.log(`✅ Anniversary email sent to ${customer.name} (${yearsOfMembership} years, +${bonusPoints} points)`)
        sentCount++

      } catch (customerError) {
        console.error(`❌ Error processing anniversary for ${customer.name}:`, customerError)
        errorCount++
      }
    }

    console.log(`✅ Anniversary cron job completed: ${sentCount} sent, ${skippedCount} skipped, ${errorCount} errors`)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Anniversary emails processed',
        sent: sentCount,
        skipped: skippedCount,
        errors: errorCount,
        total: anniversaryCustomers.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('❌ Error in anniversary-emails-cron function:', errorMessage)

    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
