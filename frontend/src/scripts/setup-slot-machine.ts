/**
 * Script temporaneo per configurare la slot machine per un'organizzazione esistente
 */
import { createClient } from '@supabase/supabase-js'

const ORGANIZATION_ID = 'c06a8dcf-b209-40b1-92a5-c80facf2eb29'

// Crea client Supabase con service_role per bypassare RLS
const supabase = createClient(
  'https://sjvatdnvewohvswfrdiv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqdmF0ZG52ZXdvaHZzd2ZyZGl2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Njc0MzQ4NSwiZXhwIjoyMDcyMzE5NDg1fQ.eanhNpi6BDEoimdB4c2IO51wIpPay6GNPkYKwynru40'
)

async function setupSlotMachine() {
  console.log('🎰 Checking Slot Machine configuration...')

  // First, check existing config
  const { data: existing, error: fetchError } = await supabase
    .from('slot_machine_config')
    .select('*')
    .eq('organization_id', ORGANIZATION_ID)
    .single()

  if (fetchError && fetchError.code !== 'PGRST116') {
    console.error('❌ Error fetching config:', fetchError)
    return
  }

  console.log('📋 Current config:', existing)

  const slotConfig = {
    name: 'Slot Machine Fortuna',
    symbols: [
      { symbol: '🍒', weight: 30 },
      { symbol: '🍋', weight: 25 },
      { symbol: '🍊', weight: 20 },
      { symbol: '🍉', weight: 15 },
      { symbol: '⭐', weight: 5 },
      { symbol: '💎', weight: 3 },
      { symbol: '7️⃣', weight: 2 }
    ],
    winning_combinations: [
      {
        pattern: 'jackpot',
        symbols: ['7️⃣'],
        prize: { type: 'points', value: 1000, label: 'JACKPOT! 1000 Punti' },
        probability: 1
      },
      {
        pattern: 'three_match',
        symbols: ['💎'],
        prize: { type: 'points', value: 500, label: 'Tre Diamanti! 500 Punti' },
        probability: 3
      },
      {
        pattern: 'three_match',
        symbols: ['⭐'],
        prize: { type: 'points', value: 300, label: 'Tre Stelle! 300 Punti' },
        probability: 5
      },
      {
        pattern: 'three_match',
        prize: { type: 'points', value: 100, label: 'Tre uguali! 100 Punti' },
        probability: 15
      },
      {
        pattern: 'two_match',
        prize: { type: 'points', value: 20, label: 'Due uguali! 20 Punti' },
        probability: 30
      },
      {
        pattern: 'any_diamond',
        prize: { type: 'points', value: 50, label: 'Diamante! 50 Punti' },
        probability: 10
      }
    ],
    max_spins_per_day: 3,
    is_active: true
  }

  if (existing) {
    console.log('🔄 Updating existing configuration...')
    const { data, error } = await supabase
      .from('slot_machine_config')
      .update(slotConfig)
      .eq('organization_id', ORGANIZATION_ID)
      .select()

    if (error) {
      console.error('❌ Error updating:', error)
      return
    }

    console.log('✅ Slot Machine updated successfully!')
    console.log('📊 Updated config:', data)
  } else {
    console.log('➕ Creating new configuration...')
    const { data, error } = await supabase
      .from('slot_machine_config')
      .insert({ ...slotConfig, organization_id: ORGANIZATION_ID })
      .select()

    if (error) {
      console.error('❌ Error creating:', error)
      return
    }

    console.log('✅ Slot Machine created successfully!')
    console.log('📊 New config:', data)
  }
}

setupSlotMachine()
