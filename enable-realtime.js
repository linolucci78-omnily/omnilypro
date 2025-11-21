const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://sjvatdnvewohvswfrdiv.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.argv[2]

if (!supabaseServiceKey) {
  console.error('❌ Errore: SUPABASE_SERVICE_ROLE_KEY non trovata!')
  console.log('Usage: node enable-realtime.js <SERVICE_ROLE_KEY>')
  console.log('Oppure: SUPABASE_SERVICE_ROLE_KEY=xxx node enable-realtime.js')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function enableRealtime() {
  console.log('🔌 Abilitazione Realtime sulla tabella customers...\n')

  try {
    // Esegui SQL per abilitare Realtime
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: `
        -- Enable Realtime for customers table
        ALTER PUBLICATION supabase_realtime ADD TABLE customers;
      `
    })

    if (error) {
      console.log('⚠️  Errore durante ALTER PUBLICATION (potrebbe essere già abilitato):', error.message)
    } else {
      console.log('✅ Realtime abilitato con successo!')
    }

    // Verifica che sia abilitato
    const { data: verification, error: verifyError } = await supabase
      .from('pg_publication_tables')
      .select('*')
      .eq('pubname', 'supabase_realtime')
      .eq('tablename', 'customers')

    if (verifyError) {
      console.log('\n📋 Verifica manuale richiesta.')
      console.log('Esegui questo SQL su Supabase Dashboard > SQL Editor:')
      console.log(`
SELECT schemaname, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
AND tablename = 'customers';
      `)
    } else if (verification && verification.length > 0) {
      console.log('\n✅ VERIFICATO: Realtime è attivo sulla tabella customers!')
      console.log('Tabella:', verification[0])
    } else {
      console.log('\n⚠️  Realtime NON sembra essere attivo. Prova manualmente:')
      console.log('1. Vai su Supabase Dashboard > Database > Publications')
      console.log('2. Aggiungi "customers" alla publication "supabase_realtime"')
    }

    console.log('\n🎉 Fatto! Ora ricarica la Customer App sul dispositivo.')

  } catch (err) {
    console.error('❌ Errore:', err)
  }
}

enableRealtime()
