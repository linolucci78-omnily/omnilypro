// Script per inviare comando test e verificare logging
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://sjvatdnvewohvswfrdiv.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqdmF0ZG52ZXdvaHZzd2ZyZGl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NDM0ODUsImV4cCI6MjA3MjMxOTQ4NX0.310-1eBrnWxaDYVJ2QeEhx9xmqVljTBqSDArLMjFiMk'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function sendTestCommand() {
  try {
    const deviceId = 'f875d87a-fbcd-4975-8e0d-bd53c1602a17' // Pos-roma

    console.log('📍 Invio comando LOCATE per test logging...\n')

    // Invia comando locate
    const { error: cmdError } = await supabase
      .from('device_commands')
      .insert({
        device_id: deviceId,
        command_type: 'locate',
        command_title: 'Test logging MDM',
        payload: {},
        status: 'pending',
        created_at: new Date().toISOString()
      })

    if (cmdError) throw cmdError

    console.log('✅ Comando LOCATE inviato!')
    console.log('\nAttendi 10-30 secondi che il dispositivo esegua il comando...')
    console.log('Il dispositivo farà BEEP + vibrazione.\n')

    // Aspetta 35 secondi
    console.log('⏳ Attendo 35 secondi per l\'esecuzione...')

    await new Promise(resolve => setTimeout(resolve, 35000))

    console.log('\n📊 Verifico se il log è stato creato...\n')

    // Controlla se ci sono log
    const { data: logs, error: logsError } = await supabase
      .from('mdm_activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)

    if (logsError) throw logsError

    if (logs && logs.length > 0) {
      console.log('🎉 SUCCESSO! Trovati ' + logs.length + ' log:\n')
      logs.forEach((log, i) => {
        console.log(`${i + 1}. ${log.activity_type}`)
        console.log(`   Titolo: ${log.activity_title}`)
        console.log(`   Success: ${log.success}`)
        console.log(`   Device ID: ${log.device_id}`)
        console.log(`   Creato: ${log.created_at}`)
        console.log('')
      })
      console.log('✅ Il logging MDM funziona correttamente!')
      console.log('Ora puoi vedere i log nella dashboard MDM → tab "Logs"')
    } else {
      console.log('❌ Nessun log trovato.')
      console.log('Possibili cause:')
      console.log('  - Il dispositivo non ha eseguito ancora il comando')
      console.log('  - Problema con RLS (Row Level Security)')
      console.log('  - Device UUID non impostato correttamente')
    }

  } catch (error) {
    console.error('❌ Errore:', error.message)
  }
}

sendTestCommand()
