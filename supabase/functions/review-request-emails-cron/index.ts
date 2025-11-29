import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Review Request Emails Cron Job
 *
 * This edge function should be scheduled to run daily via Supabase Cron.
 * It checks for transactions that occurred N days ago (default: 7) and sends
 * review request emails if the automation is enabled for their organization.
 *
 * Schedule: Run daily at 11:00 AM
 * Cron expression: 0 11 * * *
 */

serve(async (req: Request) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('⭐ Starting review request emails cron job...')

    // Initialize Supabase client with service role key
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get all organizations with review request enabled
    const { data: organizations, error: orgsError } = await supabase
      .from('organizations')
      .select('id, name, website, primary_color, review_request_enabled, review_request_days_after_purchase, review_request_min_amount, review_request_bonus_points')
      .eq('is_active', true)
      .eq('review_request_enabled', true)

    if (orgsError) {
      console.error('❌ Error fetching organizations:', orgsError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch organizations', details: orgsError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!organizations || organizations.length === 0) {
      console.log('⏭️  No organizations with review request enabled')
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No organizations with review request enabled',
          sent: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`📋 Processing ${organizations.length} organizations with review request enabled`)

    let totalSent = 0
    let totalSkipped = 0
    let totalErrors = 0

    // Process each organization
    for (const org of organizations) {
      try {
        console.log(`\n🏢 Processing organization: ${org.name}`)

        // Check if automation is enabled
        const { data: automation, error: automationError } = await supabase
          .from('email_automations')
          .select('*')
          .eq('organization_id', org.id)
          .eq('automation_type', 'review_request')
          .eq('enabled', true)
          .single()

        if (automationError || !automation) {
          console.log(`⏭️  Review request automation not enabled for ${org.name}, skipping`)
          totalSkipped++
          continue
        }

        // Calculate target date (N days ago)
        const daysAgo = org.review_request_days_after_purchase || 7
        const targetDate = new Date()
        targetDate.setDate(targetDate.getDate() - daysAgo)
        targetDate.setHours(0, 0, 0, 0)

        const nextDay = new Date(targetDate)
        nextDay.setDate(nextDay.getDate() + 1)

        console.log(`📅 Looking for purchase activities between ${targetDate.toISOString()} and ${nextDay.toISOString()}`)

        // Find purchase activities from target date (using customer_activities table)
        const { data: activities, error: activitiesError } = await supabase
          .from('customer_activities')
          .select('id, customer_id, metadata, created_at')
          .eq('organization_id', org.id)
          .eq('type', 'purchase')
          .gte('created_at', targetDate.toISOString())
          .lt('created_at', nextDay.toISOString())
          .order('created_at', { ascending: false })

        if (activitiesError) {
          console.error(`❌ Error fetching activities for ${org.name}:`, activitiesError)
          totalErrors++
          continue
        }

        // Filter activities by minimum amount (from metadata)
        const eligibleActivities = activities?.filter(activity => {
          const amount = activity.metadata?.amount || 0
          return amount >= (org.review_request_min_amount || 30)
        }) || []

        if (eligibleActivities.length === 0) {
          console.log(`📭 No eligible purchase activities found for ${org.name}`)
          continue
        }

        console.log(`📦 Found ${eligibleActivities.length} eligible purchase activities for ${org.name}`)

        // Process each purchase activity
        for (const activity of eligibleActivities) {
          try {
            // Extract data from metadata
            const amount = activity.metadata?.amount || 0
            const pointsEarned = activity.metadata?.points_earned || 0

            // Check if customer already left a review for this activity
            const { data: existingReview } = await supabase
              .from('customer_reviews')
              .select('id')
              .eq('transaction_id', activity.id)
              .single()

            if (existingReview) {
              console.log(`⏭️  Customer already reviewed activity ${activity.id}, skipping`)
              totalSkipped++
              continue
            }

            // Get customer details
            const { data: customer, error: customerError } = await supabase
              .from('customers')
              .select('id, name, email, is_active')
              .eq('id', activity.customer_id)
              .single()

            if (customerError || !customer || !customer.is_active || !customer.email) {
              console.log(`⏭️  Customer not found or inactive for activity ${activity.id}, skipping`)
              totalSkipped++
              continue
            }

            // Check if customer already received review request in last 30 days
            const thirtyDaysAgo = new Date()
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

            const { data: recentReviewRequests, error: recentError } = await supabase
              .from('customer_reviews')
              .select('id')
              .eq('customer_id', customer.id)
              .eq('organization_id', org.id)
              .gte('created_at', thirtyDaysAgo.toISOString())

            if (recentError) {
              console.error(`❌ Error checking recent reviews for customer ${customer.id}:`, recentError)
              continue
            }

            if (recentReviewRequests && recentReviewRequests.length > 0) {
              console.log(`⏭️  Customer ${customer.name} already left a review recently, skipping`)
              totalSkipped++
              continue
            }

            // Count total reviews for this organization (for social proof)
            const { count: totalReviews } = await supabase
              .from('customer_reviews')
              .select('*', { count: 'exact', head: true })
              .eq('organization_id', org.id)
              .eq('is_public', true)

            // Generate review URL
            const reviewUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/submit-review?org=${org.id}&customer=${customer.id}&activity=${activity.id}`

            // Send review request email
            console.log(`📧 Sending review request email to ${customer.email}...`)

            const { data: emailResult, error: emailError } = await supabase.functions.invoke('send-email', {
              body: {
                organization_id: org.id,
                template_type: 'review_request',
                to_email: customer.email,
                to_name: customer.name,
                dynamic_data: {
                  customer_name: customer.name,
                  store_name: org.name,
                  purchase_date: new Date(activity.created_at).toLocaleDateString('it-IT'),
                  purchase_amount: amount.toFixed(2),
                  points_earned: pointsEarned,
                  bonus_points: org.review_request_bonus_points || 50,
                  review_url: reviewUrl,
                  store_url: org.website || 'https://omnilypro.com',
                  primary_color: org.primary_color || '#dc2626',
                  total_reviews: totalReviews || 0
                }
              }
            })

            if (emailError) {
              console.error(`❌ Failed to send review request to ${customer.email}:`, emailError)
              totalErrors++
              continue
            }

            // Update automation statistics
            await supabase
              .from('email_automations')
              .update({
                total_sent: automation.total_sent + 1,
                last_sent_at: new Date().toISOString()
              })
              .eq('id', automation.id)

            console.log(`✅ Review request email sent to ${customer.name}`)
            totalSent++

          } catch (activityError) {
            console.error(`❌ Error processing activity ${activity.id}:`, activityError)
            totalErrors++
          }
        }

      } catch (orgError) {
        console.error(`❌ Error processing organization ${org.name}:`, orgError)
        totalErrors++
      }
    }

    console.log(`\n✅ Review request cron job completed: ${totalSent} sent, ${totalSkipped} skipped, ${totalErrors} errors`)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Review request emails processed',
        sent: totalSent,
        skipped: totalSkipped,
        errors: totalErrors,
        organizations_processed: organizations.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('❌ Error in review-request-emails-cron function:', errorMessage)

    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
