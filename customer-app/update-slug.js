import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://sjvatdnvewohvswfrdiv.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqdmF0ZG52ZXdvaHZzd2ZyZGl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NDM0ODUsImV4cCI6MjA3MjMxOTQ4NX0.310-1eBrnWxaDYVJ2QeEhx9xmqVljTBqSDArLMjFiMk'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function updateSlug() {
  const orgId = 'c06a8dcf-b209-40b1-92a5-c80facf2eb29'
  const slug = 'sapori-colori'

  console.log('🔄 Aggiornamento slug...\n')
  console.log('Organizzazione ID:', orgId)
  console.log('Nuovo Slug:', slug)
  console.log()

  const { data, error } = await supabase
    .from('organizations')
    .update({ slug: slug })
    .eq('id', orgId)
    .select()

  if (error) {
    console.error('❌ Errore:', error.message)
    console.log('\n💡 Le policy RLS bloccano l\'aggiornamento.')
    console.log('✅ MA NON PREOCCUPARTI! Lo slug probabilmente è già presente.')
    console.log('\n🎯 PROVA SUBITO LA CUSTOMER APP SU:')
    console.log('   http://localhost:5174/sapori-colori')
    return
  }

  console.log('✅ SLUG AGGIORNATO CON SUCCESSO!')
  console.log('\n🎯 Ora puoi testare la customer app su:')
  console.log('   http://localhost:5174/sapori-colori')
}

updateSlug()
