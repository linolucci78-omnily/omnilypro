#!/usr/bin/env node

// Script per sistemare organization_id NULL negli utenti
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://sjvatdnvewohvswfrdiv.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqdmF0ZG52ZXdvaHZzd2ZyZGl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NDM0ODUsImV4cCI6MjA3MjMxOTQ4NX0.310-1eBrnWxaDYVJ2QeEhx9xmqVljTBqSDArLMjFiMk'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function fixOrganizations() {
  console.log('🚀 Inizio fix organizzazioni...\n')

  // STEP 1: Verifica organizzazioni esistenti
  console.log('🔍 STEP 1: Verifica organizzazioni esistenti...')
  const { data: orgs, error: orgsError } = await supabase
    .from('organizations')
    .select('id, name, created_at')
    .order('created_at', { ascending: true })

  if (orgsError) {
    console.error('❌ Errore nel recuperare organizzazioni:', orgsError)
    process.exit(1)
  }

  console.log(`✅ Trovate ${orgs.length} organizzazioni:`)
  orgs.forEach((org, i) => {
    console.log(`   ${i + 1}. ${org.name} (ID: ${org.id})`)
  })
  console.log()

  // STEP 2: Verifica utenti senza organizzazione
  console.log('🔍 STEP 2: Verifica utenti senza organizzazione...')
  const { data: usersWithoutOrg, error: usersError } = await supabase
    .from('users')
    .select('id, email, full_name, organization_id, role')
    .is('organization_id', null)

  if (usersError) {
    console.error('❌ Errore nel recuperare utenti:', usersError)
    process.exit(1)
  }

  console.log(`⚠️  Trovati ${usersWithoutOrg.length} utenti senza organizzazione:`)
  usersWithoutOrg.forEach((user, i) => {
    console.log(`   ${i + 1}. ${user.email} (${user.full_name || 'N/A'})`)
  })
  console.log()

  if (usersWithoutOrg.length === 0) {
    console.log('✅ Tutti gli utenti hanno già un\'organizzazione assegnata!')
    return
  }

  // STEP 3: Crea organizzazione se non esiste
  let orgId
  if (orgs.length === 0) {
    console.log('📝 STEP 3: Nessuna organizzazione trovata, ne creo una...')
    const { data: newOrg, error: createError } = await supabase
      .from('organizations')
      .insert([
        { name: 'OmnilyPro Default Organization' }
      ])
      .select()
      .single()

    if (createError) {
      console.error('❌ Errore nella creazione organizzazione:', createError)
      process.exit(1)
    }

    orgId = newOrg.id
    console.log(`✅ Organizzazione creata con ID: ${orgId}\n`)
  } else {
    orgId = orgs[0].id
    console.log(`📝 STEP 3: Uso organizzazione esistente: ${orgs[0].name} (${orgId})\n`)
  }

  // STEP 4: Assegna organizzazione a tutti gli utenti
  console.log('📝 STEP 4: Assegno organizzazione agli utenti...')
  const { data: updatedUsers, error: updateError } = await supabase
    .from('users')
    .update({ organization_id: orgId })
    .is('organization_id', null)
    .select()

  if (updateError) {
    console.error('❌ Errore nell\'aggiornamento utenti:', updateError)
    process.exit(1)
  }

  console.log(`✅ Aggiornati ${updatedUsers.length} utenti:`)
  updatedUsers.forEach((user, i) => {
    console.log(`   ${i + 1}. ${user.email} → Organization: ${user.organization_id}`)
  })
  console.log()

  // STEP 5: Verifica finale
  console.log('🔍 STEP 5: Verifica finale...')
  const { data: allUsers, error: finalError } = await supabase
    .from('users')
    .select(`
      id,
      email,
      full_name,
      organization_id,
      role,
      organizations (name)
    `)
    .order('created_at', { ascending: true })

  if (finalError) {
    console.error('❌ Errore nella verifica finale:', finalError)
    process.exit(1)
  }

  console.log(`✅ Stato finale di tutti gli utenti (${allUsers.length}):`)
  allUsers.forEach((user, i) => {
    const orgName = user.organizations?.name || '❌ NESSUNA ORG'
    const status = user.organization_id ? '✅' : '❌'
    console.log(`   ${status} ${i + 1}. ${user.email} → ${orgName}`)
  })
  console.log()

  const usersStillWithoutOrg = allUsers.filter(u => !u.organization_id).length
  if (usersStillWithoutOrg > 0) {
    console.log(`⚠️  ATTENZIONE: Ci sono ancora ${usersStillWithoutOrg} utenti senza organizzazione!`)
  } else {
    console.log('🎉 SUCCESSO! Tutti gli utenti hanno ora un\'organizzazione assegnata!')
  }
}

fixOrganizations().catch(error => {
  console.error('❌ Errore fatale:', error)
  process.exit(1)
})
