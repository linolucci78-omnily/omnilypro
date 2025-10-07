// Script per verificare coordinate GPS dei dispositivi
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://sjvatdnvewohvswfrdiv.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqdmF0ZG52ZXdvaHZzd2ZyZGl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NDM0ODUsImV4cCI6MjA3MjMxOTQ4NX0.310-1eBrnWxaDYVJ2QeEhx9xmqVljTBqSDArLMjFiMk'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkGPS() {
  try {
    console.log('🔍 Verifica coordinate GPS dei dispositivi...\n')

    const { data: devices, error } = await supabase
      .from('devices')
      .select('id, name, store_location, latitude, longitude, location_updated_at')
      .order('name')

    if (error) throw error

    if (!devices || devices.length === 0) {
      console.log('❌ Nessun dispositivo trovato')
      return
    }

    console.log(`📱 Trovati ${devices.length} dispositivi:\n`)

    let withGPS = 0
    let withoutGPS = 0

    devices.forEach((d, i) => {
      console.log(`${i + 1}. ${d.name} (${d.store_location})`)

      if (d.latitude && d.longitude) {
        console.log(`   ✅ GPS: ${d.latitude}, ${d.longitude}`)
        console.log(`   📅 Aggiornato: ${d.location_updated_at || 'mai'}`)
        withGPS++
      } else {
        console.log(`   ❌ Nessuna coordinata GPS`)
        withoutGPS++
      }
      console.log('')
    })

    console.log('\n📊 Riepilogo:')
    console.log(`   Dispositivi con GPS: ${withGPS}`)
    console.log(`   Dispositivi senza GPS: ${withoutGPS}`)

  } catch (error) {
    console.error('❌ Errore:', error)
  }
}

checkGPS()
