// INCOLLA QUESTO NELLA CONSOLE DEL BROWSER (F12) quando sei sulla pagina della gestione template

(async function checkUserPermissions() {
  console.log('🔍 Verifica permessi utente per print_templates\n')

  const { supabase } = window

  if (!supabase) {
    console.error('❌ Supabase non trovato - assicurati di essere sulla pagina dell\'app')
    return
  }

  // 1. Utente corrente
  const { data: { user } } = await supabase.auth.getUser()
  console.log('👤 Utente:', user?.email, `(ID: ${user?.id})`)
  console.log('')

  // 2. Ruoli organizzazione
  const { data: orgUsers, error: orgError } = await supabase
    .from('organization_users')
    .select('org_id, role, organizations(name)')
    .eq('user_id', user?.id)

  if (orgError) {
    console.error('❌ Errore lettura organization_users:', orgError.message)
  } else if (!orgUsers || orgUsers.length === 0) {
    console.error('❌ PROBLEMA: Utente NON trovato in organization_users!')
    console.log('💡 Soluzione: Devi essere aggiunto a un\'organizzazione con ruolo org_admin o manager')
    return
  } else {
    console.log('✅ Organizzazioni utente:')
    orgUsers.forEach(ou => {
      console.log(`   - ${ou.organizations?.name || ou.org_id}`)
      console.log(`     Ruolo: ${ou.role}`)
      console.log(`     Org ID: ${ou.org_id}`)
    })
    console.log('')
  }

  // 3. Test lettura print_templates
  const { data: templates, error: readError } = await supabase
    .from('print_templates')
    .select('id, name, organization_id')
    .limit(5)

  if (readError) {
    console.error('❌ Errore lettura print_templates:', readError.message)
  } else {
    console.log(`✅ Lettura OK - Trovati ${templates?.length || 0} templates`)
    console.log('')
  }

  // 4. Test inserimento (usa la prima org disponibile)
  if (orgUsers && orgUsers.length > 0) {
    const testOrgId = orgUsers[0].org_id
    console.log(`🧪 Test inserimento template per org: ${testOrgId}`)

    const { data: newTemplate, error: insertError } = await supabase
      .from('print_templates')
      .insert([{
        name: `TEST ${Date.now()}`,
        store_name: 'Test Store',
        store_address: 'Test Address',
        store_phone: '123456',
        store_tax: '123456',
        paper_width: 384,
        font_size_normal: 24,
        font_size_large: 32,
        print_density: 3,
        organization_id: testOrgId,
        is_default: false
      }])
      .select()

    if (insertError) {
      console.error('❌ INSERIMENTO FALLITO:', insertError.message)
      console.log('Codice:', insertError.code)
      console.log('Dettagli:', insertError.details)
      console.log('')
      console.log('💡 POSSIBILI CAUSE:')
      console.log('1. Il tuo ruolo non è org_admin o manager')
      console.log('   Ruolo attuale:', orgUsers[0].role)
      console.log('2. Le policy RLS bloccano l\'inserimento')
      console.log('3. Manca un campo obbligatorio')
    } else {
      console.log('✅ INSERIMENTO RIUSCITO!')
      console.log('Template creato:', newTemplate[0])
      console.log('')

      // Elimina template di test
      const deleteResult = await supabase
        .from('print_templates')
        .delete()
        .eq('id', newTemplate[0].id)

      console.log('🗑️  Template di test eliminato')
    }
  }

  console.log('')
  console.log('=' .repeat(50))
  console.log('RIEPILOGO:')
  console.log('Se l\'inserimento è fallito, controlla:')
  console.log('1. Sei in organization_users?', orgUsers?.length > 0 ? 'SÌ' : 'NO')
  console.log('2. Hai il ruolo giusto?', orgUsers?.[0]?.role || 'N/A')
  console.log('   (deve essere: super_admin, org_admin o manager)')
  console.log('=' .repeat(50))
})()
