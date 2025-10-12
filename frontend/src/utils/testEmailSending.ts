/**
 * UTILITY: Test Email Sending
 * Script per testare l'invio email dal frontend
 *
 * Uso:
 * 1. Importa questa funzione dove serve
 * 2. Chiama testEmailCampaign() o testScheduledCampaign()
 * 3. Controlla console e Resend dashboard per risultati
 */

import { supabase } from '../lib/supabase'

/**
 * Test invio immediato campagna
 */
export async function testEmailCampaign(
  organizationId: string,
  customerIds: string[],
  testEmail?: string
) {
  console.log('🧪 Testing email campaign sending...')

  try {
    // 1. Verifica email settings
    console.log('1️⃣ Checking email settings...')
    const { data: settings, error: settingsError } = await supabase
      .from('email_settings')
      .select('*')
      .is('organization_id', null)
      .single()

    if (settingsError || !settings) {
      throw new Error('Email settings not configured. Run setup_resend_config.sql')
    }

    console.log('✅ Email settings found:', {
      from_email: settings.from_email,
      enabled: settings.enabled,
      daily_limit: settings.daily_limit,
      sent_today: settings.emails_sent_today
    })

    // 2. Carica template
    console.log('2️⃣ Loading newsletter template...')
    const { data: template, error: templateError } = await supabase
      .from('email_templates')
      .select('*')
      .is('organization_id', null)
      .eq('template_type', 'newsletter')
      .eq('is_active', true)
      .single()

    if (templateError || !template) {
      throw new Error('Newsletter template not found. Run setup_resend_config.sql')
    }

    console.log('✅ Template loaded:', template.name)

    // 3. Carica clienti
    console.log('3️⃣ Loading customers...')
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('id, name, email')
      .eq('organization_id', organizationId)
      .not('email', 'is', null)
      .in('id', customerIds)

    if (customersError || !customers || customers.length === 0) {
      throw new Error('No customers found with email')
    }

    console.log(`✅ Found ${customers.length} customers:`, customers.map(c => c.email))

    // 4. Crea campagna TEST
    console.log('4️⃣ Creating test campaign...')
    const { data: campaign, error: campaignError } = await supabase
      .from('email_campaigns')
      .insert({
        organization_id: organizationId,
        name: `TEST Campagna ${new Date().toLocaleString('it-IT')}`,
        description: 'Test invio email tramite script',
        template_id: template.id,
        template_type: template.template_type,
        subject: '🧪 Test Email da OmnilyPRO',
        custom_content: `Ciao {{customer_name}},

Questa è una email di test per verificare il sistema di invio.

Se ricevi questa email, tutto funziona correttamente! ✅

Dettagli tecnici:
- Timestamp: ${new Date().toISOString()}
- Template: ${template.name}
- Sistema: OmnilyPRO Email Marketing

Grazie!`,
        status: 'sending', // Invia subito
        total_recipients: customers.length,
        target_filter: { type: 'test', customer_ids: customerIds }
      })
      .select()
      .single()

    if (campaignError) {
      throw new Error(`Failed to create campaign: ${campaignError.message}`)
    }

    console.log('✅ Campaign created:', campaign.id)

    // 5. Crea recipients
    console.log('5️⃣ Creating recipients...')
    const recipients = customers.map(customer => ({
      campaign_id: campaign.id,
      organization_id: organizationId,
      customer_id: customer.id,
      email: customer.email!,
      name: customer.name,
      status: 'pending'
    }))

    const { error: recipientsError } = await supabase
      .from('email_campaign_recipients')
      .insert(recipients)

    if (recipientsError) {
      throw new Error(`Failed to create recipients: ${recipientsError.message}`)
    }

    console.log(`✅ Created ${recipients.length} recipients`)

    // 6. Invoca send-campaign function
    console.log('6️⃣ Invoking send-campaign function...')
    const { data: sendResult, error: sendError } = await supabase.functions.invoke('send-campaign', {
      body: {
        campaign_id: campaign.id,
        batch_size: 50
      }
    })

    if (sendError) {
      throw new Error(`Send campaign failed: ${sendError.message}`)
    }

    console.log('✅ Send campaign invoked:', sendResult)

    // 7. Attendi completamento e verifica
    console.log('7️⃣ Waiting for completion...')
    await new Promise(resolve => setTimeout(resolve, 5000)) // Attendi 5 secondi

    const { data: finalCampaign } = await supabase
      .from('email_campaigns')
      .select('*')
      .eq('id', campaign.id)
      .single()

    console.log('📊 Final campaign stats:', {
      status: finalCampaign?.status,
      sent: finalCampaign?.sent_count,
      failed: finalCampaign?.failed_count,
      total: finalCampaign?.total_recipients
    })

    // 8. Mostra email logs
    const { data: logs } = await supabase
      .from('email_logs')
      .select('to_email, status, resend_email_id, sent_at')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(5)

    console.log('📧 Recent email logs:', logs)

    return {
      success: true,
      campaign_id: campaign.id,
      stats: sendResult,
      message: '✅ Test completed! Check your email and Resend dashboard.'
    }

  } catch (error: any) {
    console.error('❌ Test failed:', error.message)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Test invio programmato (tra 2 minuti)
 */
export async function testScheduledCampaign(
  organizationId: string,
  customerIds: string[]
) {
  console.log('🧪 Testing scheduled campaign...')

  try {
    // Carica template
    const { data: template } = await supabase
      .from('email_templates')
      .select('*')
      .is('organization_id', null)
      .eq('template_type', 'newsletter')
      .eq('is_active', true)
      .single()

    if (!template) throw new Error('Template not found')

    // Carica customers
    const { data: customers } = await supabase
      .from('customers')
      .select('id, name, email')
      .eq('organization_id', organizationId)
      .not('email', 'is', null)
      .in('id', customerIds)

    if (!customers || customers.length === 0) {
      throw new Error('No customers found')
    }

    // Programma tra 2 minuti
    const scheduledFor = new Date()
    scheduledFor.setMinutes(scheduledFor.getMinutes() + 2)

    console.log(`📅 Scheduling for: ${scheduledFor.toLocaleString('it-IT')}`)

    // Crea campagna scheduled
    const { data: campaign, error: campaignError } = await supabase
      .from('email_campaigns')
      .insert({
        organization_id: organizationId,
        name: `TEST Scheduled ${scheduledFor.toLocaleTimeString('it-IT')}`,
        description: 'Test invio programmato',
        template_id: template.id,
        template_type: template.template_type,
        subject: '🧪 Test Scheduled Email',
        custom_content: 'Questa è una email programmata di test.\n\nSe la ricevi, lo scheduler funziona! ✅',
        status: 'scheduled',
        scheduled_for: scheduledFor.toISOString(),
        total_recipients: customers.length,
        target_filter: { type: 'test', customer_ids: customerIds }
      })
      .select()
      .single()

    if (campaignError) throw campaignError

    // Crea recipients
    const recipients = customers.map(c => ({
      campaign_id: campaign.id,
      organization_id: organizationId,
      customer_id: c.id,
      email: c.email!,
      name: c.name,
      status: 'pending'
    }))

    await supabase.from('email_campaign_recipients').insert(recipients)

    console.log('✅ Scheduled campaign created:', campaign.id)
    console.log(`⏰ Will send at: ${scheduledFor.toLocaleString('it-IT')}`)
    console.log('💡 Tip: Call check-scheduled-campaigns after scheduled time')

    return {
      success: true,
      campaign_id: campaign.id,
      scheduled_for: scheduledFor,
      message: `✅ Campaign scheduled for ${scheduledFor.toLocaleString('it-IT')}`
    }

  } catch (error: any) {
    console.error('❌ Test failed:', error.message)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Chiama manualmente lo scheduler
 */
export async function triggerScheduler() {
  console.log('⏰ Triggering scheduler...')

  const { data, error } = await supabase.functions.invoke('check-scheduled-campaigns', {
    body: {}
  })

  if (error) {
    console.error('❌ Scheduler failed:', error)
    return { success: false, error }
  }

  console.log('✅ Scheduler result:', data)
  return data
}

/**
 * Esempio di utilizzo (da console DevTools):
 *
 * // Import:
 * import { testEmailCampaign, testScheduledCampaign, triggerScheduler } from './utils/testEmailSending'
 *
 * // Test invio immediato:
 * await testEmailCampaign('org-id', ['customer-id-1', 'customer-id-2'])
 *
 * // Test invio programmato:
 * await testScheduledCampaign('org-id', ['customer-id-1'])
 *
 * // Dopo 2 minuti, triggerare scheduler:
 * await triggerScheduler()
 */
