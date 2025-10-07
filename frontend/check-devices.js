// Script per verificare tutti i dispositivi
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://sjvatdnvewohvswfrdiv.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqdmF0ZG52ZXdvaHZzd2ZyZGl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NDM0ODUsImV4cCI6MjA3MjMxOTQ4NX0.310-1eBrnWxaDYVJ2QeEhx9xmqVljTBqSDArLMjFiMk'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkDevices() {
  try {
    console.log('🔍 Recupero tutti i dispositivi...\n')

    const { data: devices, error } = await supabase
      .from('devices')
      .select('*')
      .order('last_seen', { ascending: false })

    if (error) throw error

    if (!devices || devices.length === 0) {
      console.log('❌ Nessun dispositivo trovato nel database')
      return
    }

    console.log(`📱 Trovati ${devices.length} dispositivi:\n`)
    devices.forEach((d, i) => {
      console.log(`${i + 1}. ${d.name || 'N/A'}`)
      console.log(`   ID: ${d.id}`)
      console.log(`   Android ID: ${d.android_id || 'N/A'}`)
      console.log(`   Store: ${d.store_location || 'N/A'}`)
      console.log(`   Status: ${d.status}`)
      console.log(`   Kiosk Active: ${d.kiosk_mode_active}`)
      console.log(`   Last Seen: ${d.last_seen}`)
      console.log('')
    })

    // Verifica comandi recenti
    console.log('\n📋 Ultimi comandi inviati:\n')
    const { data: commands, error: cmdError } = await supabase
      .from('device_commands')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    if (cmdError) {
      console.log('⚠️  Errore recupero comandi:', cmdError.message)
    } else if (commands && commands.length > 0) {
      commands.forEach((cmd, i) => {
        console.log(`${i + 1}. ${cmd.command_type} - ${cmd.status}`)
        console.log(`   Device ID: ${cmd.device_id}`)
        console.log(`   Created: ${cmd.created_at}`)
        console.log('')
      })
    } else {
      console.log('Nessun comando trovato')
    }

  } catch (error) {
    console.error('❌ Errore:', error.message)
  }
}

checkDevices()
