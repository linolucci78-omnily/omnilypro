import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14.14.0?target=deno'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
            apiVersion: '2023-10-16',
        })

        const { priceId, organizationId, organizationName, organizationEmail, successUrl, cancelUrl } = await req.json()

        if (!priceId || !organizationId) {
            return new Response(
                JSON.stringify({ error: 'Missing required fields: priceId, organizationId' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Create or retrieve Stripe customer
        const customers = await stripe.customers.list({
            email: organizationEmail,
            limit: 1
        })

        let customerId: string

        if (customers.data.length > 0) {
            customerId = customers.data[0].id
        } else {
            const customer = await stripe.customers.create({
                email: organizationEmail,
                name: organizationName,
                metadata: {
                    organization_id: organizationId
                }
            })
            customerId = customer.id
        }

        // Create checkout session
        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            mode: 'subscription',
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            success_url: successUrl || `${req.headers.get('origin')}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: cancelUrl || `${req.headers.get('origin')}/pricing`,
            metadata: {
                organization_id: organizationId,
                organization_name: organizationName
            },
            subscription_data: {
                metadata: {
                    organization_id: organizationId
                }
            }
        })

        return new Response(
            JSON.stringify({
                sessionId: session.id,
                url: session.url,
                customerId: customerId
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            },
        )
    } catch (error) {
        console.error('Error creating checkout session:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 500,
            },
        )
    }
})
