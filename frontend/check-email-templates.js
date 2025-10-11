import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://sjvatdnvewohvswfrdiv.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqdmF0ZG52ZXdvaHZzd2ZyZGl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NDM0ODUsImV4cCI6MjA3MjMxOTQ4NX0.310-1eBrnWxaDYVJ2QeEhx9xmqVljTBqSDArLMjFiMk'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkEmailTemplates() {
  console.log('🔍 Checking Email Templates and Settings...\n')

  // 1. Check email_templates table
  console.log('📧 EMAIL TEMPLATES:')
  const { data: templates, error: templatesError } = await supabase
    .from('email_templates')
    .select('id, name, template_type, organization_id, is_active, html_body')
    .order('created_at', { ascending: false })

  if (templatesError) {
    console.error('❌ Error loading templates:', templatesError)
  } else {
    console.log(`Found ${templates.length} templates:`)
    templates.forEach(t => {
      const orgId = t.organization_id ? `Org: ${t.organization_id.substring(0, 8)}...` : 'GLOBAL'
      const htmlLen = t.html_body ? t.html_body.length : 0
      console.log(`  ${t.is_active ? '✅' : '❌'} ${t.template_type.padEnd(15)} ${t.name.padEnd(30)} ${orgId.padEnd(20)} HTML: ${htmlLen} chars`)
    })
  }

  // 2. Check receipt template specifically
  console.log('\n📄 RECEIPT TEMPLATES (template_type="receipt"):')
  const { data: receiptTemplates, error: receiptError } = await supabase
    .from('email_templates')
    .select('*')
    .eq('template_type', 'receipt')
    .eq('is_active', true)

  if (receiptError) {
    console.error('❌ Error:', receiptError)
  } else if (receiptTemplates.length === 0) {
    console.log('❌ NO ACTIVE RECEIPT TEMPLATES FOUND!')
  } else {
    console.log(`Found ${receiptTemplates.length} active receipt template(s):`)
    receiptTemplates.forEach(t => {
      const orgId = t.organization_id ? t.organization_id : 'GLOBAL'
      console.log(`  ✅ ${t.name} (${orgId})`)
      console.log(`     HTML body length: ${t.html_body ? t.html_body.length : 0} chars`)
      console.log(`     Subject: ${t.subject}`)
    })
  }

  // 3. Check email_settings
  console.log('\n⚙️ EMAIL SETTINGS:')
  const { data: settings, error: settingsError } = await supabase
    .from('email_settings')
    .select('*')

  if (settingsError) {
    console.error('❌ Error loading settings:', settingsError)
  } else if (settings.length === 0) {
    console.log('❌ NO EMAIL SETTINGS FOUND!')
  } else {
    console.log(`Found ${settings.length} email settings:`)
    settings.forEach(s => {
      const orgId = s.organization_id ? `Org: ${s.organization_id.substring(0, 8)}...` : 'GLOBAL'
      const hasApiKey = s.resend_api_key ? '✅ Has API Key' : '❌ No API Key'
      console.log(`  ${s.enabled ? '✅' : '❌'} ${orgId.padEnd(20)} ${s.from_email.padEnd(30)} ${hasApiKey}`)
      console.log(`     Daily limit: ${s.emails_sent_today}/${s.daily_limit}`)
    })
  }

  // 4. Check RESEND_API_KEY in env (we can't access it from client, but let's check if settings have keys)
  console.log('\n🔑 API KEY CHECK:')
  const hasGlobalKey = settings.some(s => s.organization_id === null && s.resend_api_key)
  console.log(`Global Resend API Key configured: ${hasGlobalKey ? '✅ YES' : '❌ NO'}`)

  console.log('\n✅ Check completed!')
}

checkEmailTemplates().catch(console.error)
