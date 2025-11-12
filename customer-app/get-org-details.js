import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://sjvatdnvewohvswfrdiv.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqdmF0ZG52ZXdvaHZzd2ZyZGl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NDM0ODUsImV4cCI6MjA3MjMxOTQ4NX0.310-1eBrnWxaDYVJ2QeEhx9xmqVljTBqSDArLMjFiMk'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function getOrgDetails() {
  const orgId = 'c06a8dcf-b209-40b1-92a5-c80facf2eb29'

  console.log('🔍 Cercando organizzazione:', orgId, '\n')

  const { data, error } = await supabase
    .from('organizations')
    .select('id, slug, name, primary_color, secondary_color, logo_url, loyalty_tiers')
    .eq('id', orgId)
    .single()

  if (error) {
    console.error('❌ Errore:', error.message)
    console.log('\n💡 Probabilmente RLS policy. Prova a cercare nel merchant dashboard!')
    return
  }

  if (!data) {
    console.log('❌ Organizzazione non trovata!')
    return
  }

  console.log('✅ ORGANIZZAZIONE TROVATA!\n')
  console.log('==========================================')
  console.log('📋 Dettagli Organizzazione:')
  console.log('==========================================')
  console.log(`Nome: ${data.name}`)
  console.log(`Slug: ${data.slug}`)
  console.log(`Colori: ${data.primary_color} / ${data.secondary_color}`)
  console.log(`Logo: ${data.logo_url || 'Nessuno'}`)
  console.log('\n🌐 URL Customer App:')
  console.log(`   http://localhost:5174/${data.slug}`)
  console.log('\n==========================================')

  // Cerca anche i clienti
  const { data: customers, error: custError } = await supabase
    .from('customers')
    .select('id, name, email, points, tier')
    .eq('organization_id', orgId)
    .limit(5)

  if (!custError && customers && customers.length > 0) {
    console.log('\n👥 Clienti trovati:')
    customers.forEach((c, i) => {
      console.log(`\n${i + 1}. ${c.name}`)
      console.log(`   Email: ${c.email}`)
      console.log(`   Punti: ${c.points || 0}`)
      console.log(`   Tier: ${c.tier || 'Base'}`)
    })
    console.log('\n💡 Usa una di queste email per testare il login!')
  } else {
    console.log('\n⚠️  Nessun cliente trovato.')
    console.log('💡 Crea un cliente nel merchant dashboard!')
  }

  console.log('\n==========================================')
}

getOrgDetails()
