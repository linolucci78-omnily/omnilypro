/**
 * Script di migrazione: Crea account auth.users per staff_members esistenti
 *
 * Questo script migra automaticamente tutti gli operatori staff che non hanno
 * ancora un account auth collegato, creando per loro:
 * - Account auth.users con email auto-generata
 * - Password random sicura
 * - Record in organization_users con ruolo pos_only_staff
 * - Collegamento user_id in staff_members
 *
 * Esegui da console browser (F12) oppure come script Node.js
 */

import { supabase } from '../lib/supabase'

interface StaffToMigrate {
  staff_id: string
  organization_id: string
  name: string
  email: string | null
  pin_code: string
  role: string
}

async function migrateExistingStaffToAuth() {
  console.log('🔄 Inizio migrazione staff esistenti ad auth.users...')

  try {
    // Step 1: Ottieni tutti gli staff senza user_id
    console.log('📋 Recupero staff members senza auth...')
    const { data: staffToMigrate, error: fetchError } = await supabase
      .rpc('get_staff_members_without_auth')

    if (fetchError) {
      console.error('❌ Errore recupero staff:', fetchError)
      throw fetchError
    }

    if (!staffToMigrate || staffToMigrate.length === 0) {
      console.log('✅ Nessuno staff da migrare! Tutti hanno già account auth.')
      return { success: true, migrated: 0, errors: [] }
    }

    console.log(`📊 Trovati ${staffToMigrate.length} staff da migrare:`)
    staffToMigrate.forEach((staff: StaffToMigrate) => {
      console.log(`   - ${staff.name} (${staff.role}) - Org: ${staff.organization_id}`)
    })

    // Step 2: Migra ogni staff member
    const results = {
      success: 0,
      failed: 0,
      errors: [] as Array<{ staff: string, error: string }>
    }

    for (const staff of staffToMigrate as StaffToMigrate[]) {
      console.log(`\n🔄 Migrando: ${staff.name}...`)

      try {
        // Genera email auto-generata
        const uuid = crypto.randomUUID()
        const authEmail = staff.email?.trim() || `staff-${uuid}@${staff.organization_id}.omnily.local`

        console.log(`   📧 Email: ${authEmail}`)

        // Genera password random sicura
        const randomPassword = Array.from(crypto.getRandomValues(new Uint8Array(48)))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('')

        // Crea auth user
        console.log('   🔐 Creando account auth...')
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
          email: authEmail,
          password: randomPassword,
          email_confirm: true,
          user_metadata: {
            full_name: staff.name,
            organization_id: staff.organization_id,
            is_pos_only: !staff.email, // POS-only se non aveva email
            migrated_from_staff: true
          }
        })

        if (authError) {
          throw new Error(`Auth creation failed: ${authError.message}`)
        }

        console.log(`   ✅ Auth user creato: ${authUser.user.id}`)

        // Determina ruolo
        const orgRole = !staff.email ? 'pos_only_staff' : (
          staff.role === 'admin' ? 'org_admin' :
          staff.role === 'manager' ? 'manager' : 'cashier'
        )

        console.log(`   👔 Ruolo: ${orgRole}`)

        // Aggiungi a organization_users
        const { error: orgUserError } = await supabase
          .from('organization_users')
          .insert({
            user_id: authUser.user.id,
            org_id: staff.organization_id,
            role: orgRole,
            created_at: new Date().toISOString()
          })

        if (orgUserError) {
          // Rollback: elimina auth user
          await supabase.auth.admin.deleteUser(authUser.user.id)
          throw new Error(`Organization link failed: ${orgUserError.message}`)
        }

        console.log('   ✅ Collegato a organization_users')

        // Collega a staff_member
        const { error: linkError } = await supabase
          .rpc('link_auth_to_staff_member', {
            p_staff_id: staff.staff_id,
            p_auth_user_id: authUser.user.id,
            p_email: authEmail
          })

        if (linkError) {
          console.warn('   ⚠️ Warning link:', linkError.message)
          // Non è fatale, continuiamo
        }

        console.log(`   ✅ Staff member aggiornato con user_id`)

        // Aggiorna eventuali operator_nfc_cards da staff_id a user_id
        console.log('   🔄 Aggiornamento operator_nfc_cards...')
        const { error: nfcUpdateError } = await supabase
          .from('operator_nfc_cards')
          .update({ user_id: authUser.user.id })
          .eq('staff_id', staff.staff_id)
          .is('user_id', null)

        if (nfcUpdateError) {
          console.warn('   ⚠️ NFC cards update warning:', nfcUpdateError.message)
        } else {
          console.log('   ✅ NFC cards aggiornate')
        }

        console.log(`   🎉 ${staff.name} migrato con successo!`)
        results.success++

      } catch (error: any) {
        console.error(`   ❌ Errore migrazione ${staff.name}:`, error.message)
        results.failed++
        results.errors.push({
          staff: staff.name,
          error: error.message
        })
      }
    }

    // Riepilogo
    console.log('\n' + '='.repeat(60))
    console.log('📊 RIEPILOGO MIGRAZIONE')
    console.log('='.repeat(60))
    console.log(`✅ Successi: ${results.success}/${staffToMigrate.length}`)
    console.log(`❌ Falliti: ${results.failed}/${staffToMigrate.length}`)

    if (results.errors.length > 0) {
      console.log('\n⚠️ ERRORI:')
      results.errors.forEach(err => {
        console.log(`   - ${err.staff}: ${err.error}`)
      })
    }

    console.log('='.repeat(60))

    return {
      success: results.failed === 0,
      migrated: results.success,
      errors: results.errors
    }

  } catch (error: any) {
    console.error('❌ Errore fatale migrazione:', error)
    throw error
  }
}

// Se eseguito direttamente (non importato)
if (typeof window !== 'undefined') {
  console.log('💡 Per eseguire la migrazione, apri la console (F12) e digita:')
  console.log('   migrateExistingStaffToAuth()')

  // Esponi funzione globalmente per uso da console
  ;(window as any).migrateExistingStaffToAuth = migrateExistingStaffToAuth
}

export { migrateExistingStaffToAuth }
