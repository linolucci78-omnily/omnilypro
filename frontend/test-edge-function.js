// Test Edge Function send-email localmente
const fetch = require('node-fetch');

const SUPABASE_URL = 'https://sjvatdnvewohvswfrdiv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqdmF0ZG52ZXdvaHZzd2ZyZGl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjgyMTk4ODcsImV4cCI6MjA0Mzc5NTg4N30.VYoxJtK8jU1KH8qpEVGhкойGH3hbUJYVLLl8M7mLdpI';

async function testSendEmail() {
  console.log('🧪 Testing send-email Edge Function...\n');

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        organization_id: '018ed2ce-c1af-7c88-be6f-e7c4b7e16d8a', // Metti il tuo org ID
        template_type: 'contract_otp',
        to_email: 'saporiecolori.b@gmail.com',
        to_name: 'Test Cliente',
        dynamic_data: {
          signer_name: 'Test Cliente',
          contract_title: 'Contratto Test',
          otp_code: '123456'
        }
      })
    });

    const data = await response.json();

    console.log('📊 Response Status:', response.status);
    console.log('📧 Response Data:', JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log('\n✅ Email sent successfully!');
    } else {
      console.log('\n❌ Error sending email');
      console.log('Error details:', data);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testSendEmail();
