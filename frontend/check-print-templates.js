// Verifica tabella print_templates
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://sjvatdnvewohvswfrdiv.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqdmF0ZG52ZXdvaHZzd2ZyZGl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NDM0ODUsImV4cCI6MjA3MjMxOTQ4NX0.310-1eBrnWxaDYVJ2QeEhx9xmqVljTBqSDArLMjFiMk'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkPrintTemplates() {
  console.log('🔍 Verifico tabella print_templates...\n')

  // Test 1: Verifica se tabella esiste
  const { data, error, count } = await supabase
    .from('print_templates')
    .select('*', { count: 'exact' })
    .limit(5)

  if (error) {
    console.error('❌ ERRORE:', error.message)
    console.error('Codice:', error.code)
    console.error('Dettagli:', error.details)
    console.log('\n')

    if (error.code === '42P01') {
      console.log('💡 La tabella "print_templates" NON ESISTE!')
      console.log('Devo creare la tabella nel database Supabase.\n')
    } else if (error.code === 'PGRST116') {
      console.log('💡 Problema RLS (Row Level Security)')
      console.log('La tabella esiste ma le policy bloccano l\'accesso.\n')
    }
    return
  }

  console.log('✅ Tabella print_templates ESISTE!')
  console.log(`📊 Totale record: ${count}\n`)

  if (count === 0) {
    console.log('⚠️  La tabella è VUOTA - nessun template trovato')
    console.log('Questo spiega perché non vedi nulla nella dashboard.\n')
  } else {
    console.log('📄 Template trovati:\n')
    data.forEach((template, i) => {
      console.log(`${i + 1}. ${template.name}`)
      console.log(`   Store: ${template.store_name}`)
      console.log(`   Org: ${template.organization_id}`)
      console.log(`   Default: ${template.is_default ? 'SÌ' : 'NO'}`)
      console.log('')
    })
  }
}

checkPrintTemplates()
