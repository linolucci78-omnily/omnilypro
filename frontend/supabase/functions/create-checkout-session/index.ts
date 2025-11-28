// Edge Function: create-checkout-session
// Crea una Stripe Checkout Session per il pagamento dell'organizzazione

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.5.0?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CheckoutRequest {
  activation_token: string
}

// Plan prices in cents (for Stripe)
const PLAN_PRICES = {
  basic: 2900,      // €29.00
  pro: 9900,        // €99.00
  enterprise: 29900 // €299.00
}

const PLAN_NAMES = {
  basic: 'Piano Basic',
  pro: 'Piano Pro',
  enterprise: 'Piano Enterprise'
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🛒 Create Checkout Session Request')

    // Parse request body
    const { activation_token }: CheckoutRequest = await req.json()

    if (!activation_token) {
      throw new Error('Missing activation_token')
    }

    console.log('🔑 Activation token:', activation_token.substring(0, 8) + '...')

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

    // Load organization by activation token
    console.log('📋 Loading organization...')
    const { data: organization, error: orgError } = await supabaseClient
      .from('organizations')
      .select('*')
      .eq('activation_token', activation_token)
      .eq('status', 'pending_payment')
      .single()

    if (orgError || !organization) {
      console.error('❌ Organization not found:', orgError)
      throw new Error('Invalid or expired activation token')
    }

    console.log('✅ Organization loaded:', organization.name)
    console.log('📊 Plan type:', organization.plan_type)

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

    console.log('💳 Initializing Stripe...')

    // Get plan price
    const planType = organization.plan_type || 'basic'
    const priceInCents = PLAN_PRICES[planType as keyof typeof PLAN_PRICES] || PLAN_PRICES.basic
    const planName = PLAN_NAMES[planType as keyof typeof PLAN_NAMES] || PLAN_NAMES.basic

    console.log('💰 Price:', priceInCents / 100, 'EUR')

    // Create Stripe customer
    console.log('👤 Creating Stripe customer...')
    const customer = await stripe.customers.create({
      email: organization.owner_email || organization.business_email,
      name: organization.owner_name || organization.name,
      metadata: {
        organization_id: organization.id,
        organization_name: organization.name,
        plan_type: planType
      }
    })

    console.log('✅ Stripe customer created:', customer.id)

    // Update organization with Stripe customer ID
    await supabaseClient
      .from('organizations')
      .update({ stripe_customer_id: customer.id })
      .eq('id', organization.id)

    // Get app URL for redirect
    const appUrl = Deno.env.get('APP_URL') || 'https://omnilypro.app'

    // Create Checkout Session
    console.log('🔐 Creating Stripe Checkout Session...')
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `OmnilyPro - ${planName}`,
              description: `Abbonamento mensile ${planName.toLowerCase()}`,
              images: ['https://omnilypro.app/logo.png'], // TODO: Add real logo URL
            },
            recurring: {
              interval: 'month',
            },
            unit_amount: priceInCents,
          },
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/activation-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/activate/${activation_token}`,
      metadata: {
        organization_id: organization.id,
        activation_token: activation_token,
        plan_type: planType
      },
      subscription_data: {
        metadata: {
          organization_id: organization.id,
          plan_type: planType
        }
      }
    })

    console.log('✅ Checkout session created:', session.id)
    console.log('🔗 Checkout URL:', session.url)

    // Return checkout URL
    return new Response(
      JSON.stringify({
        success: true,
        checkout_url: session.url,
        session_id: session.id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('❌ Error creating checkout session:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
