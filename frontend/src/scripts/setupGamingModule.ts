/**
 * GAMING MODULE SETUP SCRIPT
 * Run this script to seed all predefined gaming data
 *
 * Usage:
 * node -r esbuild-register src/scripts/setupGamingModule.ts <organizationId>
 */

import { supabase } from '../lib/supabase'
import { badgeService } from '../services/gaming/badgeService'
import { challengeService } from '../services/gaming/challengeService'
import { spinService } from '../services/gaming/spinService'

async function setupGamingModule(organizationId: string) {
  console.log('🎮 GAMING MODULE SETUP')
  console.log('='.repeat(50))
  console.log(`Organization ID: ${organizationId}`)
  console.log('')

  try {
    // 1. Verify organization exists
    console.log('1️⃣  Verificando organizzazione...')
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id, name, plan_type')
      .eq('id', organizationId)
      .single()

    if (orgError) {
      console.error('   ❌ Errore Supabase:', orgError)
      throw new Error(`❌ Organizzazione non trovata: ${organizationId}. Errore: ${orgError.message}`)
    }

    if (!org) {
      throw new Error(`❌ Organizzazione non trovata: ${organizationId}`)
    }

    console.log(`   ✅ Organizzazione: ${org.name}`)
    console.log(`   📋 Piano: ${org.plan_type}`)
    console.log('')

    // 2. Check if gaming module is accessible
    console.log('2️⃣  Verificando permessi Gaming Module...')
    const plan = org.plan_type?.toLowerCase()
    const hasAccess = plan === 'pro' || plan === 'enterprise' || plan === 'premium' || plan === 'professional'

    if (!hasAccess) {
      console.log(`   ⚠️  ATTENZIONE: Piano "${org.plan_type}" non ha accesso al Gaming Module`)
      console.log(`   ℹ️  Gaming Module richiede piano Pro o Enterprise`)
      console.log(`   ℹ️  Continuo comunque il setup per testing...`)
    } else {
      console.log(`   ✅ Piano ${org.plan_type} ha accesso al Gaming Module`)
    }
    console.log('')

    // 3. Seed Badges
    console.log('3️⃣  Seeding Badge System...')
    try {
      await badgeService.seedPredefinedBadges(organizationId)
      console.log(`   ✅ 15 badge predefiniti creati`)
    } catch (error: any) {
      if (error.message?.includes('già esistono')) {
        console.log(`   ℹ️  Badge già esistenti, skip`)
      } else {
        throw error
      }
    }
    console.log('')

    // 4. Seed Challenges
    console.log('4️⃣  Seeding Challenge Templates...')
    try {
      await challengeService.seedPredefinedChallenges(organizationId)
      console.log(`   ✅ 6 challenge templates creati`)
    } catch (error: any) {
      if (error.message?.includes('già esistono')) {
        console.log(`   ℹ️  Challenge già esistenti, skip`)
      } else {
        throw error
      }
    }
    console.log('')

    // 5. Seed Wheel Config
    console.log('5️⃣  Seeding Spin Wheel Configuration...')
    try {
      await spinService.seedDefaultWheelConfig(organizationId)
      console.log(`   ✅ Ruota della Fortuna configurata (8 settori)`)
    } catch (error: any) {
      if (error.message?.includes('già esiste')) {
        console.log(`   ℹ️  Wheel config già esistente, skip`)
      } else {
        throw error
      }
    }
    console.log('')

    // 6. Get a test customer
    console.log('6️⃣  Cercando customer di test...')
    const { data: customers, error: custError } = await supabase
      .from('customers')
      .select('id, first_name, last_name, email')
      .eq('organization_id', organizationId)
      .limit(5)

    if (custError) throw custError

    if (!customers || customers.length === 0) {
      console.log(`   ⚠️  Nessun customer trovato per questa organizzazione`)
      console.log(`   ℹ️  Crea un customer per testare il Gaming Module`)
    } else {
      console.log(`   ✅ Trovati ${customers.length} customer(s):`)
      customers.forEach((c, i) => {
        console.log(`      ${i + 1}. ${c.first_name} ${c.last_name} (${c.email})`)
      })
      console.log('')

      // Generate test challenges for first customer
      const testCustomer = customers[0]
      console.log(`7️⃣  Generando challenge di test per ${testCustomer.first_name}...`)

      try {
        await challengeService.generateDailyChallenges(testCustomer.id, organizationId)
        console.log(`   ✅ 3 challenge giornaliere generate`)
      } catch (error) {
        console.log(`   ⚠️  Errore generazione daily challenges:`, error)
      }

      try {
        await challengeService.generateWeeklyChallenges(testCustomer.id, organizationId)
        console.log(`   ✅ 2 challenge settimanali generate`)
      } catch (error) {
        console.log(`   ⚠️  Errore generazione weekly challenges:`, error)
      }
      console.log('')

      // Initialize customer badges
      console.log(`8️⃣  Inizializzando badge per ${testCustomer.first_name}...`)
      try {
        const results = await badgeService.checkAndUnlockBadges(testCustomer.id, organizationId)
        const unlocked = results.filter(r => r.unlocked)
        console.log(`   ✅ ${unlocked.length} badge sbloccati automaticamente`)
        unlocked.forEach(r => {
          console.log(`      🏆 ${r.badge?.name}`)
        })
      } catch (error) {
        console.log(`   ⚠️  Errore inizializzazione badge:`, error)
      }
      console.log('')
    }

    // Success summary
    console.log('='.repeat(50))
    console.log('✅ SETUP COMPLETATO!')
    console.log('')
    console.log('📝 Prossimi step:')
    console.log('   1. Integra GamingHubWrapper nel tuo componente')
    console.log('   2. Testa le feature:')
    console.log('      - Badge Gallery')
    console.log('      - Challenges Hub')
    console.log('      - Spin the Wheel')
    console.log('')
    console.log('💡 URL di test suggeriti:')
    if (customers && customers.length > 0) {
      console.log(`   /gaming-test?customerId=${customers[0].id}&organizationId=${organizationId}`)
    }
    console.log('')
    console.log('📚 Documentazione:')
    console.log('   src/components/Gaming/README.md')
    console.log('='.repeat(50))

  } catch (error) {
    console.error('❌ ERRORE DURANTE IL SETUP:', error)
    process.exit(1)
  }
}

// Run script
const organizationId = process.argv[2]

if (!organizationId) {
  console.error('❌ Errore: Organization ID richiesto')
  console.log('')
  console.log('Usage:')
  console.log('  npm run setup-gaming <organizationId>')
  console.log('')
  console.log('Esempio:')
  console.log('  npm run setup-gaming 123e4567-e89b-12d3-a456-426614174000')
  process.exit(1)
}

setupGamingModule(organizationId)
  .then(() => {
    console.log('✅ Script completato')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Script fallito:', error)
    process.exit(1)
  })
