// Script per verificare dati nelle tabelle MDM
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://sjvatdnvewohvswfrdiv.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqdmF0ZG52ZXdvaHZzd2ZyZGl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NDM0ODUsImV4cCI6MjA3MjMxOTQ4NX0.310-1eBrnWxaDYVJ2QeEhx9xmqVljTBqSDArLMjFiMk'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkAllData() {
  console.log('🔍 Verifica dati nelle tabelle MDM\n')
  console.log('='.repeat(60))

  const tables = [
    'devices',
    'device_commands',
    'mdm_activity_logs',
    'app_repository',
    'print_templates',
    'setup_tokens',
    'store_configs'
  ]

  for (const table of tables) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: false })
        .limit(5)

      if (error) {
        console.log(`\n❌ ${table}: ERRORE - ${error.message}`)
        continue
      }

      console.log(`\n📋 ${table}:`)
      console.log(`   Totale record: ${count || 0}`)

      if (data && data.length > 0) {
        console.log(`   Primi ${data.length} record trovati ✅`)
        if (table === 'mdm_activity_logs') {
          data.forEach((log, i) => {
            console.log(`   ${i + 1}. ${log.activity_type} - ${log.created_at}`)
          })
        } else if (table === 'device_commands') {
          data.forEach((cmd, i) => {
            console.log(`   ${i + 1}. ${cmd.command_type} - ${cmd.status} - ${cmd.created_at}`)
          })
        }
      } else {
        console.log(`   ⚠️  Tabella VUOTA - nessun dato`)
      }
    } catch (err) {
      console.log(`\n❌ ${table}: ERRORE - ${err.message}`)
    }
  }

  console.log('\n' + '='.repeat(60))
}

checkAllData()
