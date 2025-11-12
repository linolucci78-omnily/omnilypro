import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://sjvatdnvewohvswfrdiv.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqdmF0ZG52ZXdvaHZzd2ZyZGl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NDM0ODUsImV4cCI6MjA3MjMxOTQ4NX0.310-1eBrnWxaDYVJ2QeEhx9xmqVljTBqSDArLMjFiMk'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function createTestCustomer() {
  const orgId = 'c06a8dcf-b209-40b1-92a5-c80facf2eb29'
  const email = 'mario.rossi@test.com'
  const password = 'customer123'
  const name = 'Mario Rossi'

  console.log('🌱 Creazione cliente test...\n')

  // 1. Crea utente Auth
  console.log('1️⃣ Creazione utente Supabase Auth...')
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: email,
    password: password
  })

  if (authError) {
    console.error('❌ Errore Auth:', authError.message)
    if (authError.message.includes('already registered')) {
      console.log('💡 Email già registrata! Prova a fare login con:')
      console.log(`   Email: ${email}`)
      console.log(`   Password: ${password}`)
      console.log('\n🌐 Customer App: http://localhost:5174/sapori-colori')
      return
    }
    return
  }

  console.log('✅ Utente Auth creato:', authData.user.id)

  // 2. Crea record cliente
  console.log('\n2️⃣ Creazione record cliente...')
  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .insert({
      id: authData.user.id,
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
    console.log('💡 Ma l\'utente Auth è stato creato! Puoi provare a fare login.')
    console.log(`\n📧 Email: ${email}`)
    console.log(`🔑 Password: ${password}`)
    console.log('🌐 URL: http://localhost:5174/sapori-colori')
    return
  }

  console.log('✅ Cliente creato:', customer.id)

  // Riepilogo
  console.log('\n==========================================')
  console.log('🎉 CLIENTE TEST CREATO CON SUCCESSO!')
  console.log('==========================================')
  console.log('\n👤 Credenziali:')
  console.log(`   Nome: ${name}`)
  console.log(`   Email: ${email}`)
  console.log(`   Password: ${password}`)
  console.log(`   Punti: 150`)
  console.log(`   Tier: Silver`)
  console.log('\n🌐 Customer App:')
  console.log('   http://localhost:5174/sapori-colori')
  console.log('\n🧪 Cosa testare:')
  console.log('   1. Vai su http://localhost:5174/sapori-colori')
  console.log('   2. Fai login con le credenziali sopra')
  console.log('   3. Naviga tra: Home → Card → Premi → Profilo')
  console.log('   4. Verifica il QR code nella sezione Card')
  console.log('\n==========================================')
}

createTestCustomer()
