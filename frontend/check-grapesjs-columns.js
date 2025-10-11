/**
 * Script per verificare se le colonne GrapeJS esistono nel database
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Carica .env se disponibile
try {
  const envPath = new URL('.env.local', import.meta.url);
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...values] = line.split('=');
    if (key && values.length > 0) {
      process.env[key] = values.join('=');
    }
  });
} catch (err) {
  // .env file non trovato, usa variabili ambiente
}

const supabaseUrl = 'https://sjvatdnvewohvswfrdiv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqdmF0ZG52ZXdvaHZzd2ZyZGl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NDM0ODUsImV4cCI6MjA3MjMxOTQ4NX0.310-1eBrnWxaDYVJ2QeEhx9xmqVljTBqSDArLMjFiMk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
  console.log('🔍 Verifica colonne GrapeJS nel database...\n');

  try {
    // Prova a selezionare le nuove colonne
    const { data, error } = await supabase
      .from('email_templates')
      .select('id, name, css_styles, gjs_components, gjs_styles')
      .limit(1);

    if (error) {
      if (error.message.includes('css_styles') || error.message.includes('gjs_components')) {
        console.log('❌ Le colonne GrapeJS NON esistono ancora!');
        console.log('\n📋 AZIONE RICHIESTA: Applica la migrazione\n');
        console.log('Opzione 1 - Dashboard Supabase:');
        console.log('  1. Vai su https://supabase.com/dashboard');
        console.log('  2. Seleziona il progetto');
        console.log('  3. Vai in SQL Editor');
        console.log('  4. Copia il contenuto di database/migrations/022_add_grapesjs_data.sql');
        console.log('  5. Incolla e clicca RUN\n');
        console.log('Opzione 2 - Supabase CLI:');
        console.log('  supabase db push\n');
        return false;
      }
      throw error;
    }

    console.log('✅ Le colonne GrapeJS esistono!');
    console.log('\n📊 Stato template:');

    const { data: templates, error: templatesError } = await supabase
      .from('email_templates')
      .select('id, name, css_styles, gjs_components, gjs_styles')
      .is('organization_id', null);

    if (templatesError) throw templatesError;

    let withGJS = 0;
    let withoutGJS = 0;

    templates.forEach(t => {
      if (t.gjs_components) {
        withGJS++;
        console.log(`  ✅ ${t.name} - Ha dati GrapeJS`);
      } else {
        withoutGJS++;
        console.log(`  ⚠️  ${t.name} - NO dati GrapeJS (template legacy)`);
      }
    });

    console.log(`\n📈 Riepilogo:`);
    console.log(`  Con dati GrapeJS: ${withGJS}`);
    console.log(`  Senza dati GrapeJS: ${withoutGJS}`);

    if (withoutGJS > 0) {
      console.log('\n💡 Suggerimento:');
      console.log('  I template legacy funzioneranno, ma non manterranno l\'aspetto grafico.');
      console.log('  Modifica e salva ogni template per generare i dati GrapeJS.');
    }

    return true;

  } catch (error) {
    console.error('❌ Errore:', error.message);
    return false;
  }
}

checkColumns();
