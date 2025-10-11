/**
 * Script per testare l'aggiornamento di un template
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://sjvatdnvewohvswfrdiv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqdmF0ZG52ZXdvaHZzd2ZyZGl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NDM0ODUsImV4cCI6MjA3MjMxOTQ4NX0.310-1eBrnWxaDYVJ2QeEhx9xmqVljTBqSDArLMjFiMk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testUpdate() {
  console.log('🧪 Test aggiornamento template...\n');

  try {
    // 1. Prendi un template
    console.log('📋 1. Caricamento template...');
    const { data: templates, error: fetchError } = await supabase
      .from('email_templates')
      .select('*')
      .is('organization_id', null)
      .limit(1);

    if (fetchError) {
      console.error('❌ Errore caricamento:', fetchError);
      return;
    }

    if (!templates || templates.length === 0) {
      console.log('❌ Nessun template trovato');
      return;
    }

    const template = templates[0];
    console.log('✅ Template trovato:', template.id, '-', template.name);

    // 2. Prova ad aggiornare
    console.log('\n📝 2. Tentativo aggiornamento...');
    const testData = {
      css_styles: 'body { color: red; }',
      gjs_components: { type: 'test', content: 'test' },
      gjs_styles: [{ selectors: ['test'], style: { color: 'blue' } }],
      updated_at: new Date().toISOString()
    };

    console.log('   Dati da salvare:', JSON.stringify(testData, null, 2));

    const { data: updated, error: updateError } = await supabase
      .from('email_templates')
      .update(testData)
      .eq('id', template.id)
      .select();

    if (updateError) {
      console.error('\n❌ ERRORE UPDATE:', updateError);
      console.error('   Codice:', updateError.code);
      console.error('   Messaggio:', updateError.message);
      console.error('   Dettagli:', updateError.details);
      console.error('   Hint:', updateError.hint);
      return;
    }

    console.log('✅ Aggiornamento riuscito!');
    console.log('   Dati aggiornati:', updated);

    // 3. Verifica che i dati siano stati salvati
    console.log('\n🔍 3. Verifica salvataggio...');
    const { data: verified, error: verifyError } = await supabase
      .from('email_templates')
      .select('id, name, css_styles, gjs_components, gjs_styles')
      .eq('id', template.id)
      .single();

    if (verifyError) {
      console.error('❌ Errore verifica:', verifyError);
      return;
    }

    console.log('✅ Dati verificati:');
    console.log('   css_styles:', verified.css_styles ? '✓ Presente' : '✗ Assente');
    console.log('   gjs_components:', verified.gjs_components ? '✓ Presente' : '✗ Assente');
    console.log('   gjs_styles:', verified.gjs_styles ? '✓ Presente' : '✗ Assente');

    if (verified.css_styles && verified.gjs_components && verified.gjs_styles) {
      console.log('\n🎉 TEST SUPERATO! Il salvataggio funziona correttamente!');
    } else {
      console.log('\n⚠️ PROBLEMA: Alcuni dati non sono stati salvati');
    }

  } catch (error) {
    console.error('\n❌ Errore generale:', error);
  }
}

testUpdate();
