/**
 * GAMING MODULE MULTI-TENANT SETUP
 * Setup automatico Gaming Module per TUTTE le organizzazioni Pro/Enterprise
 *
 * Usage:
 * npm run setup-gaming-all
 */

import { supabase } from '../lib/supabase'
import { badgeService } from '../services/gaming/badgeService'
import { challengeService } from '../services/gaming/challengeService'
import { spinService } from '../services/gaming/spinService'
import { hasAccess } from '../utils/planPermissions'

interface SetupResult {
  organizationId: string
  organizationName: string
  success: boolean
  error?: string
  stats: {
    badges: number
    challenges: number
    wheelConfigured: boolean
  }
}

async function setupGamingForAllOrganizations() {
  console.log('🎮 GAMING MODULE MULTI-TENANT SETUP')
  console.log('='.repeat(60))
  console.log('Setup automatico per TUTTE le organizzazioni Pro/Enterprise')
  console.log('')

  const results: SetupResult[] = []

  try {
    // 1. Get all organizations
    console.log('1️⃣  Caricamento organizzazioni...')
    const { data: organizations, error: orgError } = await supabase
      .from('organizations')
      .select('id, name, plan_type')
      .order('created_at', { ascending: false })

    if (orgError) throw orgError

    if (!organizations || organizations.length === 0) {
      console.log('   ⚠️  Nessuna organizzazione trovata nel sistema')
      return
    }

    console.log(`   ✅ Trovate ${organizations.length} organizzazioni totali`)
    console.log('')

    // 2. Filter organizations with Gaming access
    const eligibleOrgs = organizations.filter(org => {
      const plan = org.plan_type?.toLowerCase() || 'free'
      return hasAccess(plan, 'gamingModule')
    })

    console.log('2️⃣  Organizzazioni con accesso Gaming Module:')
    console.log(`   ✅ ${eligibleOrgs.length} organizzazioni Pro/Enterprise`)
    console.log(`   ℹ️  ${organizations.length - eligibleOrgs.length} organizzazioni senza accesso (Free/Basic)`)
    console.log('')

    if (eligibleOrgs.length === 0) {
      console.log('⚠️  ATTENZIONE: Nessuna organizzazione ha un piano Pro/Enterprise')
      console.log('   Per testare il Gaming Module, aggiorna il piano di almeno 1 organizzazione')
      console.log('')
      console.log('   Query SQL per aggiornare:')
      console.log('   UPDATE organizations SET subscription_plan = \'pro\' WHERE id = \'YOUR_ORG_ID\';')
      return
    }

    // 3. Setup Gaming for each eligible organization
    console.log('3️⃣  Iniziando setup per ogni organizzazione...')
    console.log('='.repeat(60))
    console.log('')

    for (const org of eligibleOrgs) {
      console.log(`📦 ${org.name} (${org.plan_type})`)
      console.log(`   ID: ${org.id}`)

      const result: SetupResult = {
        organizationId: org.id,
        organizationName: org.name,
        success: false,
        stats: {
          badges: 0,
          challenges: 0,
          wheelConfigured: false
        }
      }

      try {
        // Check if already setup
        const { data: existingBadges } = await supabase
          .from('gaming_badges')
          .select('id')
          .eq('organization_id', org.id)
          .limit(1)

        if (existingBadges && existingBadges.length > 0) {
          console.log(`   ℹ️  Gaming già configurato, skip`)
          result.success = true
          result.stats.badges = 15 // assume all seeded
          result.stats.challenges = 6
          result.stats.wheelConfigured = true
          results.push(result)
          console.log('')
          continue
        }

        // Setup badges
        console.log('   🏆 Seeding badges...')
        await badgeService.seedPredefinedBadges(org.id)
        result.stats.badges = 15
        console.log('      ✅ 15 badge creati')

        // Setup challenges
        console.log('   🎯 Seeding challenges...')
        await challengeService.seedPredefinedChallenges(org.id)
        result.stats.challenges = 6
        console.log('      ✅ 6 challenge templates creati')

        // Setup wheel
        console.log('   🎡 Configurando ruota...')
        await spinService.seedDefaultWheelConfig(org.id)
        result.stats.wheelConfigured = true
        console.log('      ✅ Ruota configurata (8 settori)')

        result.success = true
        console.log(`   ✅ Setup completato per ${org.name}`)

      } catch (error: any) {
        result.error = error.message
        console.log(`   ❌ Errore: ${error.message}`)
      }

      results.push(result)
      console.log('')
    }

    // 4. Summary
    console.log('='.repeat(60))
    console.log('📊 RIEPILOGO SETUP')
    console.log('='.repeat(60))
    console.log('')

    const successful = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success).length

    console.log(`✅ Successo: ${successful}/${results.length}`)
    console.log(`❌ Falliti: ${failed}/${results.length}`)
    console.log('')

    if (successful > 0) {
      console.log('✅ Organizzazioni con Gaming attivo:')
      results
        .filter(r => r.success)
        .forEach(r => {
          console.log(`   - ${r.organizationName}`)
          console.log(`     ${r.stats.badges} badge | ${r.stats.challenges} challenges | Ruota: ${r.stats.wheelConfigured ? 'Si' : 'No'}`)
        })
      console.log('')
    }

    if (failed > 0) {
      console.log('❌ Organizzazioni con errori:')
      results
        .filter(r => !r.success)
        .forEach(r => {
          console.log(`   - ${r.organizationName}`)
          console.log(`     Errore: ${r.error}`)
        })
      console.log('')
    }

    // 5. Generate challenges for existing customers (optional)
    console.log('4️⃣  Generando challenge per customer esistenti...')
    console.log('')

    let totalCustomersProcessed = 0

    for (const org of eligibleOrgs) {
      // Get customers for this org (limit to avoid overload)
      const { data: customers } = await supabase
        .from('customers')
        .select('id, first_name, last_name')
        .eq('organization_id', org.id)
        .limit(20) // Limit to first 20 customers per org

      if (!customers || customers.length === 0) {
        console.log(`   ℹ️  ${org.name}: Nessun customer`)
        continue
      }

      console.log(`   📝 ${org.name}: ${customers.length} customer(s)`)

      for (const customer of customers) {
        try {
          // Generate daily challenges
          await challengeService.generateDailyChallenges(customer.id, org.id)

          // Generate weekly challenges
          await challengeService.generateWeeklyChallenges(customer.id, org.id)

          // Check badge unlocks
          await badgeService.checkAndUnlockBadges(customer.id, org.id)

          totalCustomersProcessed++
        } catch (error) {
          // Silent fail for individual customers
          console.log(`      ⚠️  Errore per ${customer.first_name}: ${error}`)
        }
      }

      console.log(`      ✅ Challenge generate per ${customers.length} customer(s)`)
    }

    console.log('')
    console.log(`   ✅ Totale customer processati: ${totalCustomersProcessed}`)
    console.log('')

    // 6. Final instructions
    console.log('='.repeat(60))
    console.log('✅ SETUP MULTI-TENANT COMPLETATO!')
    console.log('='.repeat(60))
    console.log('')
    console.log('📝 Il Gaming Module è ora disponibile per:')
    console.log(`   • ${successful} organizzazioni Pro/Enterprise`)
    console.log(`   • ${totalCustomersProcessed} customer attivi`)
    console.log('')
    console.log('🎮 Ogni organizzazione ha:')
    console.log('   • 15 badge predefiniti')
    console.log('   • 6 challenge templates')
    console.log('   • Ruota della fortuna configurata (8 settori)')
    console.log('   • Challenge auto-generate per customer esistenti')
    console.log('')
    console.log('🔐 Plan Permissions:')
    console.log('   • Pro/Enterprise: ✅ Accesso completo')
    console.log('   • Free/Basic: ❌ Upgrade prompt')
    console.log('')
    console.log('📊 Prossimi step:')
    console.log('   1. Ogni nuova organizzazione Pro/Enterprise avrà auto-setup al primo accesso')
    console.log('   2. Badge si sbloccano automaticamente in base alle attività customer')
    console.log('   3. Challenge si auto-generano daily/weekly (opzionale: setup cron job)')
    console.log('')
    console.log('💡 Test:')
    console.log('   http://localhost:5173/gaming-test')
    console.log('')
    console.log('='.repeat(60))

  } catch (error) {
    console.error('❌ ERRORE CRITICO:', error)
    process.exit(1)
  }
}

// Run script
setupGamingForAllOrganizations()
  .then(() => {
    console.log('✅ Script completato con successo')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Script fallito:', error)
    process.exit(1)
  })
