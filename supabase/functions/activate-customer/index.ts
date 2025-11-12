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
    const { token, password } = await req.json()

    if (!token || !password) {
      return new Response(
        JSON.stringify({ error: 'Token e password sono obbligatori' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Crea client Supabase con Service Role (Admin)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Verifica token nel database
    const { data: customer, error: customerError } = await supabaseAdmin
      .from('customers')
      .select('*')
      .eq('activation_token', token)
      .eq('is_activated', false)
      .single()

    if (customerError || !customer) {
      return new Response(
        JSON.stringify({ error: 'Token non valido o già utilizzato' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Prova a cercare l'utente esistente per email
    let userId: string
    let userExists = false

    try {
      const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers()

      if (!listError && users) {
        const existingUser = users.find(u => u.email === customer.email)
        if (existingUser) {
          console.log('Utente Auth già esistente, elimino e ricreo')
          userExists = true
          // Elimina l'utente esistente
          await supabaseAdmin.auth.admin.deleteUser(existingUser.id)
        }
      }
    } catch (err) {
      console.log('Non riesco a verificare utenti esistenti, procedo con la creazione')
    }

    // 3. Crea nuovo utente Auth con email GIÀ confermata
    // IMPORTANTE: Usa l'ID del customer esistente per evitare problemi con foreign keys
    console.log('Creo nuovo utente Auth con ID:', customer.id)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: customer.email,
      password: password,
      email_confirm: true, // Email già confermata!
      user_metadata: {
        name: customer.name,
        customer_id: customer.id // Salvo anche l'ID del customer nei metadata
      }
    })

    if (authError) {
      console.error('Errore creazione utente:', authError)
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

    userId = authData.user.id

    // 4. Aggiorna il customer: attiva (SENZA cambiare l'ID)
    const { error: updateError } = await supabaseAdmin
      .from('customers')
      .update({
        // NON aggiorniamo l'ID per evitare problemi con foreign keys
        is_activated: true,
        activated_at: new Date().toISOString(),
        activation_token: null,
        auth_user_id: userId // Salviamo l'ID dell'utente Auth in un campo separato
      })
      .eq('activation_token', token)

    if (updateError) {
      console.error('Errore aggiornamento customer:', updateError)
      return new Response(
        JSON.stringify({ error: updateError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 4. Successo!
    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: userId,
          email: customer.email
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Errore:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
