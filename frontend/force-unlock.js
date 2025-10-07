// Script per forzare sblocco dispositivo
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://sjvatdnvewohvswfrdiv.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqdmF0ZG52ZXdvaHZzd2ZyZGl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NDM0ODUsImV4cCI6MjA3MjMxOTQ4NX0.310-1eBrnWxaDYVJ2QeEhx9xmqVljTBqSDArLMjFiMk'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function forceUnlock() {
  try {
    const deviceId = 'f875d87a-fbcd-4975-8e0d-bd53c1602a17' // Pos-roma

    console.log('🔓 Invio comando KIOSK_OFF al dispositivo Pos-roma...\n')

    const { error } = await supabase
      .from('device_commands')
      .insert({
        device_id: deviceId,
        command_type: 'kiosk_off',
        payload: {},
        status: 'pending',
        created_at: new Date().toISOString()
      })

    if (error) {
      console.error('❌ Errore:', error)
      return
    }

    console.log('✅ Comando KIOSK_OFF inviato con successo!')
    console.log('\nIl dispositivo riceverà il comando al prossimo polling (circa 10-30 secondi)')
    console.log('Controlla il dispositivo per verificare lo sblocco.\n')

  } catch (error) {
    console.error('❌ Errore:', error)
  }
}

forceUnlock()
