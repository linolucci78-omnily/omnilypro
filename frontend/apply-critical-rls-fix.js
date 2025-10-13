#!/usr/bin/env node

/**
 * CRITICAL SECURITY FIX: Apply RLS policies to core tables
 *
 * PROBLEMA GRAVE:
 * - Tabelle organizations, customers, nfc_cards, rewards, customer_activities
 *   NON avevano RLS abilitato
 * - Chiunque autenticato poteva vedere TUTTI i dati di TUTTE le organizzazioni
 *
 * SOLUZIONE:
 * - Abilita RLS su tutte le tabelle critiche
 * - Super admin può vedere tutto
 * - Organization users vedono solo i propri dati
 *
 * ESECUZIONE:
 * 1. Vai su: https://supabase.com/dashboard/project/sjvatdnvewohvswfrdiv/settings/api
 * 2. Copia la "service_role" key (Secret)
 * 3. Esegui: SUPABASE_SERVICE_ROLE_KEY="key" node apply-critical-rls-fix.js
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const SUPABASE_URL = 'https://sjvatdnvewohvswfrdiv.supabase.co'
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('\n🚨 CRITICAL SECURITY FIX: RLS Policies\n')

if (!SERVICE_KEY) {
  console.error('❌ Service key non trovata!\n')
  console.log('Come ottenere la service key:')
  console.log('1. Apri: https://supabase.com/dashboard/project/sjvatdnvewohvswfrdiv/settings/api')
  console.log('2. Copia la "service_role" secret key')
  console.log('3. Esegui questo comando:\n')
  console.log('   SUPABASE_SERVICE_ROLE_KEY="la-tua-key" node apply-critical-rls-fix.js\n')
  process.exit(1)
}

async function applyRLSFix() {
  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

    console.log('📖 Lettura migration file...')
    const sql = readFileSync('./database/migrations/028_critical_rls_fix.sql', 'utf8')

    console.log('🔒 Applicazione RLS policies su tabelle critiche...')
    console.log('   - organizations')
    console.log('   - customers')
    console.log('   - nfc_cards')
    console.log('   - customer_activities')
    console.log('   - rewards')
    console.log('   - usage_tracking')
    console.log('   - loyalty_tiers')
    console.log('')

    // Split SQL in statements individuali
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    let successCount = 0
    let errorCount = 0

    for (const statement of statements) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql_string: statement + ';' })

        if (error) {
          // Se errore è "already exists", è OK
          if (error.message.includes('already exists') ||
              error.message.includes('duplicate')) {
            console.log('⚠️  Policy già esistente (OK)')
            successCount++
          } else {
            console.error(`❌ Errore: ${error.message}`)
            errorCount++
          }
        } else {
          successCount++
        }
      } catch (err) {
        console.error(`❌ Errore esecuzione: ${err.message}`)
        errorCount++
      }
    }

    console.log('\n' + '='.repeat(60))
    console.log('📊 RIEPILOGO:')
    console.log(`   ✅ Statements eseguiti con successo: ${successCount}`)
    console.log(`   ❌ Errori: ${errorCount}`)
    console.log('='.repeat(60))

    if (errorCount === 0) {
      console.log('\n🎉 RLS POLICIES APPLICATE CON SUCCESSO!\n')
      console.log('Sicurezza ripristinata:')
      console.log('✅ Solo super admin vede tutte le organizzazioni')
      console.log('✅ Organization users vedono solo i propri dati')
      console.log('✅ Isolamento multi-tenant garantito\n')
    } else {
      console.log('\n⚠️  Alcune policy potrebbero non essere state applicate.')
      console.log('Verifica gli errori sopra e riprova.\n')
    }

  } catch (error) {
    console.error('\n❌ Errore grave:', error.message)
    process.exit(1)
  }
}

applyRLSFix().then(() => process.exit(0))
