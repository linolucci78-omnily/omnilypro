import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://sjvatdnvewohvswfrdiv.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqdmF0ZG52ZXdvaHZzd2ZyZGl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NDM0ODUsImV4cCI6MjA3MjMxOTQ4NX0.310-1eBrnWxaDYVJ2QeEhx9xmqVljTBqSDArLMjFiMk'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function createTestCustomer() {
  const orgId = 'c06a8dcf-b209-40b1-92a5-c80facf2eb29'
  const email = 'test@example.com'
  const password = 'password123'
  const name = 'Mario Rossi'

  console.log('🌱 Creazione cliente test...\n')

  // 1. Crea utente Auth con auto-confirm
  console.log('1️⃣ Creazione utente Supabase Auth...')
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: email,
    password: password,
    options: {
      emailRedirectTo: undefined,
      data: {
        name: name
      }
    }
  })

  if (authError) {
    console.error('❌ Errore Auth:', authError.message)

    // Prova comunque a fare login
    console.log('\n💡 Provo a fare login (forse l\'utente esiste già)...')
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    })

    if (loginError) {
      console.error('❌ Anche il login fallisce:', loginError.message)
      console.log('\n📝 SOLUZIONE MANUALE:')
      console.log('1. Vai su http://localhost:5174/sapori-colori')
      console.log('2. Se non funziona, dobbiamo disabilitare l\'email confirmation in Supabase')
      return
    }

    console.log('✅ Login riuscito! User ID:', loginData.user.id)

    // Controlla se il cliente esiste
    const { data: existing } = await supabase
      .from('customers')
      .select('*')
      .eq('id', loginData.user.id)
      .single()

    if (existing) {
      console.log('\n✅ Cliente già esistente nel database!')
      console.log('\n🎯 CREDENZIALI PER IL TEST:')
      console.log(`📧 Email: ${email}`)
      console.log(`🔑 Password: ${password}`)
      console.log('🌐 URL: http://localhost:5174/sapori-colori')
      return
    }

    // Crea il cliente
    console.log('\n2️⃣ Creazione record cliente...')
    await createCustomerRecord(loginData.user.id, orgId, name, email)
    return
  }

  if (!authData.user) {
    console.error('❌ Nessun utente creato')
    return
  }

  console.log('✅ Utente Auth creato:', authData.user.id)

  // 2. Crea record cliente
  await createCustomerRecord(authData.user.id, orgId, name, email)
}

async function createCustomerRecord(userId, orgId, name, email) {
  console.log('\n2️⃣ Creazione record cliente...')
  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .insert({
      id: userId,
      organization_id: orgId,
      name: name,
      email: email,
      points: 150,
      tier: 'Silver',
      total_spent: 75,
      visits: 3,
      is_active: true,
      notifications_enabled: true
    })
    .select()
    .single()

  if (customerError) {
    console.error('❌ Errore Cliente:', customerError.message)
    console.log('\n💡 L\'utente Auth esiste ma il record cliente potrebbe già esistere o le policy RLS bloccano l\'inserimento.')
  } else {
    console.log('✅ Cliente creato:', customer.id)
  }

  // Riepilogo
  console.log('\n==========================================')
  console.log('🎉 PRONTO PER IL TEST!')
  console.log('==========================================')
  console.log('\n👤 Credenziali:')
  console.log(`   Email: test@example.com`)
  console.log(`   Password: password123`)
  console.log('\n🌐 Customer App:')
  console.log('   http://localhost:5174/sapori-colori')
  console.log('\n🧪 Prova ora:')
  console.log('   1. Apri http://localhost:5174/sapori-colori')
  console.log('   2. Fai login con le credenziali sopra')
  console.log('   3. Naviga e testa tutte le funzionalità!')
  console.log('\n==========================================')
}

createTestCustomer()
