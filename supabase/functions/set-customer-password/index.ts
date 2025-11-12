import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { customer_id, password } = await req.json()

    if (!customer_id || !password) {
      return new Response(
        JSON.stringify({ error: 'customer_id e password sono obbligatori' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validazione password (minimo 6 caratteri)
    if (password.length < 6) {
      return new Response(
        JSON.stringify({ error: 'La password deve essere di almeno 6 caratteri' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Crea client Supabase con Service Role (Admin)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Recupera il customer dal database
    const { data: customer, error: customerError } = await supabaseAdmin
      .from('customers')
      .select('*')
      .eq('id', customer_id)
      .single()

    if (customerError || !customer) {
      return new Response(
        JSON.stringify({ error: 'Cliente non trovato' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!customer.email) {
      return new Response(
        JSON.stringify({ error: 'Cliente non ha un indirizzo email' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('🔑 Impostazione password per cliente:', customer.email)

    // 2. Cerca se esiste già un utente Auth con questa email
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers()

    let authUserId: string

    if (!listError && users) {
      const existingUser = users.find(u => u.email === customer.email)

      if (existingUser) {
        console.log('✅ Utente Auth esistente trovato, aggiorno la password')

        // Aggiorna la password dell'utente esistente
        const { data: updateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          existingUser.id,
          { password: password }
        )

        if (updateError) {
          console.error('❌ Errore aggiornamento password:', updateError)
          return new Response(
            JSON.stringify({ error: updateError.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        authUserId = existingUser.id
      } else {
        console.log('📝 Utente Auth non esiste, lo creo')

        // Crea nuovo utente Auth
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: customer.email,
          password: password,
          email_confirm: true, // Email già confermata
          user_metadata: {
            name: customer.name,
            customer_id: customer.id
          }
        })

        if (authError) {
          console.error('❌ Errore creazione utente:', authError)
          return new Response(
            JSON.stringify({ error: authError.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        if (!authData.user) {
          return new Response(
            JSON.stringify({ error: 'Errore nella creazione dell\'utente' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        authUserId = authData.user.id
      }
    } else {
      // Se non riusciamo a listare gli utenti, proviamo a creare direttamente
      console.log('📝 Creo nuovo utente Auth')

      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: customer.email,
        password: password,
        email_confirm: true,
        user_metadata: {
          name: customer.name,
          customer_id: customer.id
        }
      })

      if (authError) {
        console.error('❌ Errore creazione utente:', authError)
        return new Response(
          JSON.stringify({ error: authError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (!authData.user) {
        return new Response(
          JSON.stringify({ error: 'Errore nella creazione dell\'utente' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      authUserId = authData.user.id
    }

    // 3. Aggiorna il customer con l'ID dell'utente Auth e attiva l'account
    const { error: updateError } = await supabaseAdmin
      .from('customers')
      .update({
        auth_user_id: authUserId,
        is_activated: true,
        activated_at: new Date().toISOString()
      })
      .eq('id', customer_id)

    if (updateError) {
      console.error('❌ Errore aggiornamento customer:', updateError)
      return new Response(
        JSON.stringify({ error: updateError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 4. Successo!
    console.log('✅ Password impostata con successo per', customer.email)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Password impostata con successo',
        user: {
          id: authUserId,
          email: customer.email
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Errore:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
