// Test finale logging MDM dopo fix RLS
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://sjvatdnvewohvswfrdiv.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqdmF0ZG52ZXdvaHZzd2ZyZGl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NDM0ODUsImV4cCI6MjA3MjMxOTQ4NX0.310-1eBrnWxaDYVJ2QeEhx9xmqVljTBqSDArLMjFiMk'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function finalTest() {
  const deviceId = 'f875d87a-fbcd-4975-8e0d-bd53c1602a17'

  console.log('🧪 TEST FINALE LOGGING MDM')
  console.log('=' .repeat(60))
  console.log('')

  // 1. Invia comando locate
  console.log('📍 1. Invio comando LOCATE...')
  const { error: cmdError } = await supabase
    .from('device_commands')
    .insert({
      device_id: deviceId,
      command_type: 'locate',
      command_title: 'Test finale logging',
      status: 'pending'
    })

  if (cmdError) {
    console.error('❌ Errore invio comando:', cmdError.message)
    return
  }

  console.log('✅ Comando inviato!')
  console.log('')

  // 2. Aspetta esecuzione
  console.log('⏳ 2. Attendo 30 secondi per esecuzione comando...')
  await new Promise(r => setTimeout(r, 30000))

  // 3. Verifica log
  console.log('📊 3. Verifico i log...')
  console.log('')

  const { data: logs, error: logsError } = await supabase
    .from('mdm_activity_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10)

  if (logsError) {
    console.error('❌ Errore lettura log:', logsError.message)
    return
  }

  console.log('=' .repeat(60))
  if (logs && logs.length > 0) {
    console.log('🎉 SUCCESSO! Trovati ' + logs.length + ' log nel database:\n')
    logs.forEach((log, i) => {
      console.log(`${i + 1}. ${log.activity_type}`)
      console.log(`   📝 Titolo: ${log.activity_title || 'N/A'}`)
      console.log(`   ${log.success ? '✅' : '❌'} Success: ${log.success}`)
      console.log(`   📱 Device: ${log.device_id}`)
      console.log(`   🕐 Creato: ${log.created_at}`)
      console.log('')
    })
    console.log('✅ Il logging MDM funziona correttamente!')
    console.log('✅ Vai nella dashboard MDM → tab "Logs" per vedere i log!')
  } else {
    console.log('⚠️  Nessun log trovato ancora.')
    console.log('Possibili cause:')
    console.log('  - Il dispositivo non ha ancora eseguito il comando (aspetta ancora)')
    console.log('  - Errore nell\'app Android (verifica logcat)')
  }
  console.log('=' .repeat(60))
}

finalTest()
