// Edge Function: stripe-webhook
// Gestisce i webhook di Stripe per attivare automaticamente le organizzazioni dopo il pagamento

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.5.0?target=deno'

serve(async (req) => {
  try {
    console.log('🔔 Stripe Webhook Event Received')

    // Get Stripe signature
    const signature = req.headers.get('stripe-signature')
    if (!signature) {
      throw new Error('Missing stripe-signature header')
    }

    // Get webhook secret
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
    if (!webhookSecret) {
      throw new Error('Stripe webhook secret not configured')
    }

    // Get Stripe secret key
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeSecretKey) {
      throw new Error('Stripe secret key not configured')
    }

    // Initialize Stripe
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    })

    // Get raw body
    const body = await req.text()

    // Verify webhook signature
    let event: Stripe.Event
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        webhookSecret
      )
    } catch (err) {
      console.error('❌ Webhook signature verification failed:', err.message)
      return new Response(
        JSON.stringify({ error: 'Webhook signature verification failed' }),
        { status: 400 }
      )
    }

    console.log('✅ Webhook verified:', event.type)

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        console.log('🎉 Checkout session completed:', session.id)
        console.log('📋 Metadata:', session.metadata)

        const organizationId = session.metadata?.organization_id
        const activationToken = session.metadata?.activation_token
        const planType = session.metadata?.plan_type

        if (!organizationId) {
          console.error('❌ Missing organization_id in metadata')
          break
        }

        // Get subscription ID
        const subscriptionId = session.subscription as string

        console.log('✅ Payment successful!')
        console.log('   Organization ID:', organizationId)
        console.log('   Subscription ID:', subscriptionId)
        console.log('   Plan Type:', planType)

        // Update organization status to active
        const { error: updateError } = await supabaseClient
          .from('organizations')
          .update({
            status: 'active',
            plan_status: 'active',
            activated_at: new Date().toISOString(),
            stripe_subscription_id: subscriptionId,
            activation_token: null, // Invalidate the token
          })
          .eq('id', organizationId)

        if (updateError) {
          console.error('❌ Error activating organization:', updateError)
          throw updateError
        }

        console.log('✅ Organization activated successfully!')

        // TODO: Send welcome email to business owner with credentials
        console.log('📧 TODO: Send welcome email with credentials')

        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        console.log('🔄 Subscription updated:', subscription.id)

        const organizationId = subscription.metadata?.organization_id
        if (!organizationId) {
          console.error('❌ Missing organization_id in subscription metadata')
          break
        }

        // Check subscription status
        const isActive = subscription.status === 'active'
        const isCanceled = subscription.status === 'canceled'
        const isPastDue = subscription.status === 'past_due'

        let newStatus = 'active'
        let planStatus = 'active'

        if (isCanceled) {
          newStatus = 'cancelled'
          planStatus = 'cancelled'
        } else if (isPastDue) {
          newStatus = 'active' // Keep active but mark plan as past_due
          planStatus = 'past_due'
        }

        console.log('📊 New status:', newStatus, '- Plan status:', planStatus)

        // Update organization
        const { error: updateError } = await supabaseClient
          .from('organizations')
          .update({
            status: newStatus,
            plan_status: planStatus,
          })
          .eq('id', organizationId)

        if (updateError) {
          console.error('❌ Error updating organization:', updateError)
          throw updateError
        }

        console.log('✅ Organization updated successfully!')
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        console.log('❌ Subscription deleted:', subscription.id)

        const organizationId = subscription.metadata?.organization_id
        if (!organizationId) {
          console.error('❌ Missing organization_id in subscription metadata')
          break
        }

        // Update organization to cancelled
        const { error: updateError } = await supabaseClient
          .from('organizations')
          .update({
            status: 'cancelled',
            plan_status: 'cancelled',
            stripe_subscription_id: null,
          })
          .eq('id', organizationId)

        if (updateError) {
          console.error('❌ Error cancelling organization:', updateError)
          throw updateError
        }

        console.log('✅ Organization cancelled successfully!')
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        console.log('💳 Payment failed for invoice:', invoice.id)

        const customerId = invoice.customer as string

        // Find organization by Stripe customer ID
        const { data: organization } = await supabaseClient
          .from('organizations')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (organization) {
          // Update plan status to payment_failed
          await supabaseClient
            .from('organizations')
            .update({ plan_status: 'payment_failed' })
            .eq('id', organization.id)

          console.log('⚠️ Organization marked as payment_failed')

          // TODO: Send email notification
          console.log('📧 TODO: Send payment failed notification email')
        }
        break
      }

      default:
        console.log('ℹ️ Unhandled event type:', event.type)
    }

    // Return success
    return new Response(
      JSON.stringify({ received: true }),
      { status: 200 }
    )

  } catch (error) {
    console.error('❌ Webhook error:', error)

    return new Response(
      JSON.stringify({
        error: error.message
      }),
      { status: 500 }
    )
  }
})
