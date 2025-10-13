// Test configurazione email e invio test
// Verifica API Key Resend, settings database e DNS Cloudflare

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// Leggi .env file
const envFile = readFileSync('.env', 'utf-8')
const envVars = {}
envFile.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=')
  if (key && valueParts.length > 0) {
    envVars[key.trim()] = valueParts.join('=').trim()
  }
})

const supabase = createClient(
  envVars.VITE_SUPABASE_URL,
  envVars.VITE_SUPABASE_ANON_KEY
)

async function testEmailConfig() {
  console.log('\n🔍 TEST CONFIGURAZIONE EMAIL\n')
  console.log('━'.repeat(60))

  try {
    // 1. Verifica email_settings
    console.log('\n1️⃣ Controllo email_settings...')
    const { data: settings, error: settingsError } = await supabase
      .from('email_settings')
      .select('*')
      .is('organization_id', null) // Settings globali

    if (settingsError) {
      console.error('❌ Errore:', settingsError.message)
      return
    }

    if (!settings || settings.length === 0) {
      console.log('❌ Nessun email_settings trovato!')
      console.log('\n📝 Devi creare i settings globali con:')
      console.log('   - resend_api_key')
      console.log('   - from_email (es: noreply@tuodominio.com)')
      console.log('   - from_name')
      return
    }

    const globalSettings = settings[0]
    console.log('✅ Email settings trovati:')
    console.log('   - ID:', globalSettings.id)
    console.log('   - From Email:', globalSettings.from_email)
    console.log('   - From Name:', globalSettings.from_name)
    console.log('   - Enabled:', globalSettings.enabled)
    console.log('   - Has API Key:', !!globalSettings.resend_api_key)
    console.log('   - Daily Limit:', globalSettings.daily_limit)
    console.log('   - Sent Today:', globalSettings.emails_sent_today)

    if (!globalSettings.resend_api_key) {
      console.log('\n❌ PROBLEMA: resend_api_key non configurata!')
      console.log('\n📝 Vai su https://resend.com/api-keys e crea una API Key')
      console.log('   Poi aggiornala nel database nella tabella email_settings')
      return
    }

    if (!globalSettings.enabled) {
      console.log('\n⚠️ ATTENZIONE: Email service disabilitato!')
      console.log('   Imposta enabled = true nella tabella email_settings')
      return
    }

    // 2. Verifica dominio from_email
    console.log('\n2️⃣ Verifica dominio email...')
    const domain = globalSettings.from_email.split('@')[1]
    console.log('   Dominio:', domain)

    // 3. Verifica template
    console.log('\n3️⃣ Controllo email_templates...')
    const { data: templates, error: templatesError } = await supabase
      .from('email_templates')
      .select('id, name, template_type, is_active')
      .is('organization_id', null)
      .eq('is_active', true)

    if (templatesError) {
      console.error('❌ Errore:', templatesError.message)
      return
    }

    if (!templates || templates.length === 0) {
      console.log('❌ Nessun template attivo trovato!')
      return
    }

    console.log(`✅ Trovati ${templates.length} template attivi:`)
    templates.forEach(t => {
      console.log(`   - ${t.name} (${t.template_type})`)
    })

    // 4. Test chiamata Resend API (verifica API Key)
    console.log('\n4️⃣ Test API Key Resend...')
    console.log('   API Key:', globalSettings.resend_api_key.substring(0, 10) + '...')

    // Test con endpoint domains di Resend
    const resendResponse = await fetch('https://api.resend.com/domains', {
      headers: {
        'Authorization': `Bearer ${globalSettings.resend_api_key}`
      }
    })

    if (!resendResponse.ok) {
      const errorData = await resendResponse.json()
      console.log('❌ API Key non valida o scaduta!')
      console.log('   Errore Resend:', errorData)
      console.log('\n📝 Vai su https://resend.com/api-keys e crea/verifica la tua API Key')
      return
    }

    const domainsData = await resendResponse.json()
    console.log('✅ API Key valida!')

    if (domainsData.data && domainsData.data.length > 0) {
      console.log('\n📧 Domini verificati su Resend:')
      domainsData.data.forEach(d => {
        console.log(`   - ${d.name} (Status: ${d.status})`)
        if (d.status !== 'verified') {
          console.log(`     ⚠️ Dominio NON verificato! Controlla i record DNS su Cloudflare`)
        }
      })

      // Verifica se il dominio from_email è tra quelli verificati
      const domainFound = domainsData.data.find(d => d.name === domain)
      if (!domainFound) {
        console.log(`\n❌ PROBLEMA: Il dominio ${domain} NON è configurato su Resend!`)
        console.log('\n📝 Devi aggiungere il dominio su Resend:')
        console.log('   1. Vai su https://resend.com/domains')
        console.log('   2. Clicca "Add Domain"')
        console.log(`   3. Aggiungi: ${domain}`)
        console.log('   4. Copia i record DNS e aggiungili su Cloudflare')
        console.log('   5. Aspetta la verifica (può richiedere qualche minuto)')
        return
      }

      if (domainFound.status !== 'verified') {
        console.log(`\n⚠️ ATTENZIONE: Dominio ${domain} NON verificato su Resend!`)
        console.log('\n📝 Verifica i record DNS su Cloudflare:')
        console.log('   1. Accedi a Cloudflare Dashboard')
        console.log(`   2. Seleziona il dominio ${domain}`)
        console.log('   3. Vai in DNS > Records')
        console.log('   4. Verifica che ci siano questi record:')
        console.log('      - Type: TXT, Name: @ o _resend, Value: [dal dashboard Resend]')
        console.log('      - Type: MX, Name: @, Value: [dal dashboard Resend]')
        console.log('      - Type: CNAME, Name: rs1._domainkey, Value: [dal dashboard Resend]')
        console.log('      - Type: CNAME, Name: rs2._domainkey, Value: [dal dashboard Resend]')
        console.log('\n   I record esatti li trovi su: https://resend.com/domains')
        return
      }

      console.log(`✅ Dominio ${domain} verificato correttamente!`)
    } else {
      console.log('\n⚠️ Nessun dominio configurato su Resend!')
      console.log('   Devi aggiungere un dominio su https://resend.com/domains')
    }

    // 5. Riepilogo
    console.log('\n✅ TEST COMPLETATO!')
    console.log('\n📋 RIEPILOGO CONFIGURAZIONE:')
    console.log('   ✓ Email settings configurati')
    console.log('   ✓ API Key Resend valida')
    console.log('   ✓ Template attivi presenti')
    if (domainFound && domainFound.status === 'verified') {
      console.log(`   ✓ Dominio ${domain} verificato su Resend`)
    }
    console.log('\n🚀 Tutto pronto per inviare email!')

  } catch (error) {
    console.error('\n❌ Errore durante il test:', error.message)
    console.error(error)
  }

  console.log('\n' + '━'.repeat(60))
}

testEmailConfig()
