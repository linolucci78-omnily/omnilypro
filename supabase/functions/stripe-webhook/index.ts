import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14.14.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
    apiVersion: '2023-10-16',
})

serve(async (req) => {
    const signature = req.headers.get('stripe-signature')
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

    if (!signature || !webhookSecret) {
        return new Response('Webhook signature or secret missing', { status: 400 })
    }

    try {
        const body = await req.text()
        const event = await stripe.webhooks.constructEventAsync(
            body,
            signature,
            webhookSecret
        )

        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        console.log('Webhook event:', event.type)

        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session
                const organizationId = session.metadata?.organization_id

                if (!organizationId) {
                    console.error('No organization_id in session metadata')
                    break
                }

                const subscription = await stripe.subscriptions.retrieve(session.subscription as string)

                // Create subscription in database
                const { error } = await supabase
                    .from('subscriptions')
                    .insert({
                        organization_id: organizationId,
                        stripe_subscription_id: subscription.id,
                        stripe_customer_id: subscription.customer as string,
                        status: subscription.status,
                        plan_type: subscription.items.data[0].price.lookup_key || 'basic',
                        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
                        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                        amount_monthly: subscription.items.data[0].price.unit_amount! / 100,
                        currency: subscription.currency.toUpperCase(),
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    })

                if (error) {
                    console.error('Error creating subscription:', error)
                } else {
                    console.log('Subscription created successfully for org:', organizationId)
                }

                // Update organization status
                await supabase
                    .from('organizations')
                    .update({
                        is_active: true,
                        plan_status: 'active',
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', organizationId)

                break
            }

            case 'customer.subscription.updated': {
                const subscription = event.data.object as Stripe.Subscription
                const organizationId = subscription.metadata?.organization_id

                if (!organizationId) {
                    console.error('No organization_id in subscription metadata')
                    break
                }

                // Update subscription in database
                await supabase
                    .from('subscriptions')
                    .update({
                        status: subscription.status,
                        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
                        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                        updated_at: new Date().toISOString()
                    })
                    .eq('stripe_subscription_id', subscription.id)

                // Update organization status based on subscription status
                const isActive = ['active', 'trialing'].includes(subscription.status)
                await supabase
                    .from('organizations')
                    .update({
                        is_active: isActive,
                        plan_status: subscription.status,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', organizationId)

                break
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription
                const organizationId = subscription.metadata?.organization_id

                if (!organizationId) {
                    console.error('No organization_id in subscription metadata')
                    break
                }

                // Update subscription status to canceled
                await supabase
                    .from('subscriptions')
                    .update({
                        status: 'canceled',
                        updated_at: new Date().toISOString()
                    })
                    .eq('stripe_subscription_id', subscription.id)

                // Deactivate organization
                await supabase
                    .from('organizations')
                    .update({
                        is_active: false,
                        plan_status: 'canceled',
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', organizationId)

                break
            }

            case 'invoice.payment_succeeded': {
                const invoice = event.data.object as Stripe.Invoice
                const subscriptionId = invoice.subscription as string

                // Log successful payment
                console.log('Payment succeeded for subscription:', subscriptionId)

                // You can store invoice data if needed
                break
            }

            case 'invoice.payment_failed': {
                const invoice = event.data.object as Stripe.Invoice
                const subscriptionId = invoice.subscription as string

                // Update subscription status to past_due
                await supabase
                    .from('subscriptions')
                    .update({
                        status: 'past_due',
                        updated_at: new Date().toISOString()
                    })
                    .eq('stripe_subscription_id', subscriptionId)

                console.log('Payment failed for subscription:', subscriptionId)
                // TODO: Send email notification to organization
                break
            }

            default:
                console.log('Unhandled event type:', event.type)
        }

        return new Response(JSON.stringify({ received: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        })

    } catch (err) {
        console.error('Webhook error:', err.message)
        return new Response(
            JSON.stringify({ error: err.message }),
            { status: 400 }
        )
    }
})
