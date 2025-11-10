/**
 * Script di migrazione per creare la tabella referral_settings
 * Esegue la migrazione 056_create_referral_settings.sql
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Carica le variabili d'ambiente
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://sjvatdnvewohvswfrdiv.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqdmF0ZG52ZXdvaHZzd2ZyZGl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NDM0ODUsImV4cCI6MjA3MjMxOTQ4NX0.310-1eBrnWxaDYVJ2QeEhx9xmqVljTBqSDArLMjFiMk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateReferralSettings() {
  console.log('🚀 Inizio migrazione referral_settings...\n');

  try {
    // Leggi il file SQL
    const migrationPath = path.join(__dirname, '../../database/migrations/056_create_referral_settings.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 File SQL caricato:', migrationPath);
    console.log('📏 Dimensione SQL:', sql.length, 'caratteri\n');

    // Nota: Supabase client anon key non ha permessi per eseguire DDL direttamente
    // Dobbiamo usare il service role key o eseguire tramite dashboard
    console.log('⚠️  IMPORTANTE: Per eseguire questa migrazione, hai due opzioni:\n');
    console.log('1. Esegui il SQL direttamente nel Dashboard Supabase:');
    console.log('   - Vai su https://supabase.com/dashboard/project/sjvatdnvewohvswfrdiv/sql');
    console.log('   - Copia il contenuto del file: frontend/database/migrations/056_create_referral_settings.sql');
    console.log('   - Incolla ed esegui\n');
    console.log('2. Usa Supabase CLI (se installato):');
    console.log('   - supabase db push --db-url <your-connection-string>\n');

    // Mostra il contenuto SQL per comodità
    console.log('📋 Contenuto SQL da eseguire:');
    console.log('─'.repeat(80));
    console.log(sql);
    console.log('─'.repeat(80));
    console.log('\n✅ Script completato. Segui le istruzioni sopra per applicare la migrazione.');

  } catch (error) {
    console.error('❌ Errore durante la migrazione:', error);
  }
}

// Esegui la migrazione
migrateReferralSettings();
