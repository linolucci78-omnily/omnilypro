import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://sjvatdnvewohvswfrdiv.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqdmF0ZG52ZXdvaHZzd2ZyZGl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NDM0ODUsImV4cCI6MjA3MjMxOTQ4NX0.310-1eBrnWxaDYVJ2QeEhx9xmqVljTBqSDArLMjFiMk'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testSendEmail() {
  console.log('🚀 Testing send-email Edge Function...\n')

  try {
    const testPayload = {
      organization_id: 'test-org-id', // usa un org ID reale se ne hai uno
      template_type: 'receipt',
      to_email: 'linolucci78@gmail.com', // email proprietario Resend account
      to_name: 'Test Cliente',
      dynamic_data: {
        store_name: 'Test Store',
        receipt_number: 'TEST-' + Date.now(),
        timestamp: new Date().toLocaleString('it-IT'),
        total: '99.99',
        items_html: '<div style="padding: 8px; border-bottom: 1px solid #e5e7eb;">Prodotto Test - €99.99</div>'
      }
    }

    console.log('📤 Sending request with payload:')
    console.log(JSON.stringify(testPayload, null, 2))
    console.log()

    const response = await supabase.functions.invoke('send-email', {
      body: testPayload
    })

    if (response.error) {
      console.error('❌ ERROR from Edge Function:')
      console.error('Status:', response.error.status)
      console.error('Message:', response.error.message)

      // Prova a leggere il body della response
      if (response.error.context && response.error.context.body) {
        try {
          const reader = response.error.context.body.getReader()
          const { value } = await reader.read()
          const text = new TextDecoder().decode(value)
          console.error('Response body:', text)
          const json = JSON.parse(text)
          console.error('Parsed error:', json)
        } catch (e) {
          console.error('Could not read response body:', e)
        }
      }
      return
    }

    console.log('✅ SUCCESS! Response:')
    console.log(JSON.stringify(response.data, null, 2))

  } catch (err) {
    console.error('❌ EXCEPTION:', err)
  }
}

testSendEmail()
