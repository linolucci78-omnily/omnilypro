/**
 * Script per applicare la migrazione 022: aggiunge colonne per dati GrapeJS
 * Risolve il problema dei template che perdono l'aspetto grafico nell'editor
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carica configurazione Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Errore: VITE_SUPABASE_URL e SUPABASE_SERVICE_KEY devono essere impostati nelle variabili d\'ambiente');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  console.log('🚀 Applicazione migrazione 022: Colonne GrapeJS...\n');

  try {
    // Leggi il file SQL della migrazione
    const migrationPath = path.join(__dirname, 'database', 'migrations', '022_add_grapesjs_data.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 File migrazione caricato');
    console.log('🔄 Esecuzione migrazione SQL...\n');

    // Esegui la migrazione
    // Nota: Supabase JS client non supporta direttamente l'esecuzione di SQL arbitrario
    // per motivi di sicurezza. Dobbiamo usare le funzioni RPC o fare le alterazioni manualmente.

    // Soluzione: Usa il comando supabase CLI
    console.log('⚠️  ATTENZIONE: Questo script richiede l\'uso del Supabase CLI per eseguire migrazioni SQL.\n');
    console.log('📋 Istruzioni:');
    console.log('   1. Assicurati di avere installato Supabase CLI: https://supabase.com/docs/guides/cli');
    console.log('   2. Collega il progetto: supabase link --project-ref [YOUR_PROJECT_REF]');
    console.log('   3. Esegui la migrazione: supabase db push');
    console.log('\nOppure, copia e incolla il seguente SQL nel SQL Editor di Supabase Dashboard:\n');
    console.log('=' .repeat(80));
    console.log(migrationSQL);
    console.log('=' .repeat(80));

    // Alternativa: Aggiungi le colonne usando il client Supabase (richiede permessi admin)
    console.log('\n🔧 Tentativo di applicare la migrazione via API...\n');

    // Verifica se le colonne esistono già
    const { data: tables, error: tablesError } = await supabase
      .from('email_templates')
      .select('*')
      .limit(1);

    if (tablesError) {
      console.error('❌ Errore nel verificare la tabella:', tablesError.message);
      return;
    }

    if (tables && tables.length > 0) {
      const firstRow = tables[0];
      if ('css_styles' in firstRow && 'gjs_components' in firstRow && 'gjs_styles' in firstRow) {
        console.log('✅ Le colonne esistono già! Migrazione già applicata.');
        return;
      }
    }

    console.log('\n⚠️  Le colonne non esistono ancora. Per applicare la migrazione:');
    console.log('   - Usa il SQL Editor nella dashboard di Supabase');
    console.log('   - Oppure usa il comando: supabase db push');
    console.log('\nMigrazione completata con successo una volta eseguito il SQL sopra! 🎉');

  } catch (error) {
    console.error('❌ Errore durante l\'applicazione della migrazione:', error);
    process.exit(1);
  }
}

applyMigration();
