// Test logging dopo update app
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://sjvatdnvewohvswfrdiv.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqdmF0ZG52ZXdvaHZzd2ZyZGl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NDM0ODUsImV4cCI6MjA3MjMxOTQ4NX0.310-1eBrnWxaDYVJ2QeEhx9xmqVljTBqSDArLMjFiMk'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

console.log('📊 Verifica log attività MDM...\n')

async function checkLogs() {
  const { data, error } = await supabase
    .from('mdm_activity_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) {
    console.error('❌ Errore:', error.message)
    return
  }

  console.log(`Trovati ${data?.length || 0} log:\n`)

  if (data && data.length > 0) {
    data.forEach((log, i) => {
      console.log(`${i + 1}. ${log.activity_type} - ${log.activity_title}`)
      console.log(`   Success: ${log.success ? '✅' : '❌'}`)
      console.log(`   Device: ${log.device_id}`)
      console.log(`   Data: ${log.created_at}`)
      console.log('')
    })
  } else {
    console.log('⚠️  Nessun log trovato')
  }
}

checkLogs()
