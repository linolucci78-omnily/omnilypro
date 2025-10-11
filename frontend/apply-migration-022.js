/**
 * Applica migrazione 022 - Aggiunge colonne GrapeJS
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://sjvatdnvewohvswfrdiv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqdmF0ZG52ZXdvaHZzd2ZyZGl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NDM0ODUsImV4cCI6MjA3MjMxOTQ4NX0.310-1eBrnWxaDYVJ2QeEhx9xmqVljTBqSDArLMjFiMk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  console.log('🔧 Applicazione Migrazione 022...\n');

  try {
    // Tenta di leggere un template per vedere se le colonne esistono già
    console.log('📋 Verifica colonne esistenti...');
    const { data: testData, error: testError } = await supabase
      .from('email_templates')
      .select('id, css_styles, gjs_components, gjs_styles')
      .limit(1);

    if (!testError) {
      console.log('✅ Le colonne esistono già!');
      console.log('   css_styles:', testData?.[0]?.css_styles !== undefined ? '✓' : '✗');
      console.log('   gjs_components:', testData?.[0]?.gjs_components !== undefined ? '✓' : '✗');
      console.log('   gjs_styles:', testData?.[0]?.gjs_styles !== undefined ? '✓' : '✗');
      return;
    }

    console.log('\n⚠️  Le colonne NON esistono ancora.');
    console.log('❌ Non posso applicare ALTER TABLE via JS client.\n');
    console.log('📋 DEVI applicare manualmente via SQL Editor:\n');
    console.log('='.repeat(80));
    console.log(`
ALTER TABLE email_templates
ADD COLUMN IF NOT EXISTS css_styles TEXT,
ADD COLUMN IF NOT EXISTS gjs_components JSONB,
ADD COLUMN IF NOT EXISTS gjs_styles JSONB;
    `);
    console.log('='.repeat(80));
    console.log('\n1. Vai su https://supabase.com/dashboard/project/sjvatdnvewohvswfrdiv');
    console.log('2. SQL Editor → New Query');
    console.log('3. Incolla il SQL sopra');
    console.log('4. Clicca RUN\n');

  } catch (error) {
    console.error('❌ Errore:', error.message);
  }
}

applyMigration();
