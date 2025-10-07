// Script per sbloccare dispositivo in kiosk mode
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://sjvatdnvewohvswfrdiv.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqdmF0ZG52ZXdvaHZzd2ZyZGl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NDM0ODUsImV4cCI6MjA3MjMxOTQ4NX0.310-1eBrnWxaDYVJ2QeEhx9xmqVljTBqSDArLMjFiMk'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function unlockKioskMode() {
  try {
    console.log('🔍 Cerco dispositivi con kiosk mode attivo...')

    // Trova dispositivi con kiosk mode attivo
    const { data: devices, error: devicesError } = await supabase
      .from('devices')
      .select('*')
      .eq('kiosk_mode_active', true)
      .order('last_seen', { ascending: false })

    if (devicesError) throw devicesError

    if (!devices || devices.length === 0) {
      console.log('❌ Nessun dispositivo con kiosk mode attivo trovato')
      return
    }

    console.log(`\n📱 Trovati ${devices.length} dispositivi con kiosk mode attivo:\n`)
    devices.forEach((d, i) => {
      console.log(`${i + 1}. ${d.name} (${d.store_location}) - ID: ${d.id}`)
    })

    // Invia comando kiosk_off a tutti i dispositivi
    for (const device of devices) {
      console.log(`\n🔓 Invio comando di sblocco a: ${device.name}...`)

      const { error: commandError } = await supabase
        .from('device_commands')
        .insert({
          device_id: device.id,
          command_type: 'kiosk_off',
          payload: {},
          status: 'pending',
          created_at: new Date().toISOString()
        })

      if (commandError) {
        console.error(`❌ Errore invio comando per ${device.name}:`, commandError)
      } else {
        console.log(`✅ Comando kiosk_off inviato a ${device.name}`)
      }
    }

    console.log('\n✅ Operazione completata!')

  } catch (error) {
    console.error('❌ Errore:', error)
  }
}

unlockKioskMode()
