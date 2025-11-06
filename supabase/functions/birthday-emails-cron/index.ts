import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Birthday Emails Cron Job
 *
 * This edge function should be scheduled to run daily via Supabase Cron.
 * It checks for customers with birthdays today and sends them birthday emails
 * if the birthday automation is enabled for their organization.
 *
 * Schedule: Run daily at 9:00 AM
 * Cron expression: 0 9 * * *
 */

serve(async (req: Request) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🎂 Starting birthday emails cron job...')

    // Initialize Supabase client with service role key
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get today's date (day and month only)
    const today = new Date()
    const todayMonth = today.getMonth() + 1 // JavaScript months are 0-indexed
    const todayDay = today.getDate()

    console.log(`📅 Checking for birthdays on ${todayMonth}/${todayDay}...`)

    // Find all customers with birthdays today
    // PostgreSQL: EXTRACT(MONTH FROM birth_date) = todayMonth AND EXTRACT(DAY FROM birth_date) = todayDay
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('id, name, email, birth_date, points, tier, organization_id, created_at')
      .not('birth_date', 'is', null)
      .not('email', 'is', null)
      .eq('is_active', true)

    if (customersError) {
      console.error('❌ Error fetching customers:', customersError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch customers', details: customersError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Filter customers with birthdays today (client-side filtering)
    const birthdayCustomers = customers?.filter(customer => {
      if (!customer.birth_date) return false
      const birthDate = new Date(customer.birth_date)
      return birthDate.getMonth() + 1 === todayMonth && birthDate.getDate() === todayDay
    }) || []

    console.log(`🎉 Found ${birthdayCustomers.length} customers with birthdays today`)

    if (birthdayCustomers.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No birthdays today',
          sent: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let sentCount = 0
    let skippedCount = 0
    let errorCount = 0

    // Process each birthday customer
    for (const customer of birthdayCustomers) {
      try {
        console.log(`🎂 Processing birthday for ${customer.name} (${customer.email})...`)

        // 1. Check if birthday automation is enabled for this organization
        const { data: automation, error: automationError } = await supabase
          .from('email_automations')
          .select('*')
          .eq('organization_id', customer.organization_id)
          .eq('automation_type', 'birthday')
          .eq('enabled', true)
          .single()

        if (automationError || !automation) {
          console.log(`⏭️  Birthday automation not enabled for org ${customer.organization_id}, skipping`)
          skippedCount++
          continue
        }

        // 2. Get organization details
        const { data: organization, error: orgError } = await supabase
          .from('organizations')
          .select('name, website, points_per_euro')
          .eq('id', customer.organization_id)
          .single()

        if (orgError || !organization) {
          console.error(`❌ Organization not found for ${customer.name}`)
          errorCount++
          continue
        }

        // 3. Calculate birthday bonus points (configurable via automation settings or default 50)
        const bonusPoints = 50 // Default bonus - could be made configurable
        const expiryDate = new Date()
        expiryDate.setMonth(expiryDate.getMonth() + 1) // Expires in 1 month

        // 4. Calculate member since
        const memberSince = new Date(customer.created_at).toLocaleDateString('it-IT', {
          month: 'long',
          year: 'numeric'
        })

        // 5. Get template (org-specific or global default)
        let templateId = automation.template_id

        if (!templateId) {
          const { data: defaultTemplate } = await supabase
            .from('email_templates')
            .select('id')
            .is('organization_id', null)
            .eq('template_type', 'birthday')
            .eq('is_active', true)
            .single()

          templateId = defaultTemplate?.id
        }

        if (!templateId) {
          console.error(`❌ No birthday template found for ${customer.name}`)
          errorCount++
          continue
        }

        // 6. Send birthday email via edge function
        console.log(`📧 Sending birthday email to ${customer.email}...`)

        const { data: emailResult, error: emailError } = await supabase.functions.invoke('send-email', {
          body: {
            organization_id: customer.organization_id,
            template_type: 'birthday',
            to_email: customer.email,
            to_name: customer.name,
            dynamic_data: {
              customer_name: customer.name,
              store_name: organization.name,
              bonus_points: bonusPoints,
              expiry_date: expiryDate.toLocaleDateString('it-IT'),
              current_points: customer.points,
              tier: customer.tier,
              member_since: memberSince,
              store_url: organization.website || 'https://omnilypro.com'
            }
          }
        })

        if (emailError) {
          console.error(`❌ Failed to send birthday email to ${customer.email}:`, emailError)
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

        // 8. Optional: Add birthday bonus points to customer
        // Uncomment if you want to automatically add bonus points
        /*
        await supabase
          .from('customers')
          .update({
            points: customer.points + bonusPoints
          })
          .eq('id', customer.id)

        // Log the points activity
        await supabase
          .from('customer_activities')
          .insert({
            customer_id: customer.id,
            organization_id: customer.organization_id,
            type: 'points_added',
            description: `🎂 Bonus compleanno: +${bonusPoints} punti`,
            points: bonusPoints
          })
        */

        console.log(`✅ Birthday email sent to ${customer.name}`)
        sentCount++

      } catch (customerError) {
        console.error(`❌ Error processing birthday for ${customer.name}:`, customerError)
        errorCount++
      }
    }

    console.log(`✅ Birthday cron job completed: ${sentCount} sent, ${skippedCount} skipped, ${errorCount} errors`)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Birthday emails processed',
        sent: sentCount,
        skipped: skippedCount,
        errors: errorCount,
        total: birthdayCustomers.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('❌ Error in birthday-emails-cron function:', errorMessage)

    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
