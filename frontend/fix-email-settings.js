// Disabilita la configurazione email con @resend.dev
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://sjvatdnvewohvswfrdiv.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqdmF0ZG52ZXdvaHZzd2ZyZGl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NDM0ODUsImV4cCI6MjA3MjMxOTQ4NX0.310-1eBrnWxaDYVJ2QeEhx9xmqVljTBqSDArLMjFiMk'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function fixEmailSettings() {
  console.log('\n🔧 FIX EMAIL SETTINGS\n')
  console.log('━'.repeat(60))

  try {
    console.log('Disabilito configurazione con @resend.dev...\n')

    const { data, error } = await supabase
      .from('email_settings')
      .update({ enabled: false })
      .eq('id', 'd42a4db4-d22a-4028-a4be-0ad0f33e97db')
      .select()

    if (error) {
      console.error('❌ Errore:', error.message)
      return
    }

    console.log('✅ Configurazione disabilitata con successo!')
    console.log('\nDettagli:')
    console.log('   ID:', data[0].id)
    console.log('   From Email:', data[0].from_email)
    console.log('   Enabled:', data[0].enabled)

    console.log('\n━'.repeat(60))
    console.log('\n✅ FATTO!')
    console.log('\nOra il sistema userà solo le configurazioni con @omnilypro.com')
    console.log('\n🚀 Prova a creare una nuova campagna e inviare!')

  } catch (error) {
    console.error('\n❌ Errore:', error.message)
  }

  console.log('\n' + '━'.repeat(60))
}

fixEmailSettings()
