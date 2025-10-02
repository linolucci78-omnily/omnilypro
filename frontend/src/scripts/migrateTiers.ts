/**
 * Script di migrazione per aggiornare i tier dei clienti esistenti
 * da valori hardcoded (Bronze, Bronzo, ecc.) ai tier dinamici configurati dall'organizzazione
 */

import { createClient } from '@supabase/supabase-js';

// Carica le variabili d'ambiente (stesse del file supabase.ts)
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://sjvatdnvewohvswfrdiv.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqdmF0ZG52ZXdvaHZzd2ZyZGl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NDM0ODUsImV4cCI6MjA3MjMxOTQ4NX0.310-1eBrnWxaDYVJ2QeEhx9xmqVljTBqSDArLMjFiMk';

const supabase = createClient(supabaseUrl, supabaseKey);

interface Organization {
  id: string;
  name: string;
  loyalty_tiers: Array<{
    name: string;
    threshold: string;
    multiplier: string;
    color?: string;
  }>;
}

interface Customer {
  id: string;
  organization_id: string;
  points: number;
  tier: string;
  name: string;
}

async function migrateTiers() {
  console.log('🚀 Inizio migrazione tier clienti...\n');

  try {
    // 1. Ottieni tutte le organizzazioni con i loro tier configurati
    const { data: organizations, error: orgError } = await supabase
      .from('organizations')
      .select('id, name, loyalty_tiers');

    if (orgError) {
      console.error('❌ Errore caricamento organizzazioni:', orgError);
      return;
    }

    console.log(`📊 Trovate ${organizations?.length || 0} organizzazioni\n`);

    for (const org of organizations || []) {
      console.log(`\n🏢 Elaborazione organizzazione: ${org.name} (${org.id})`);

      // Verifica se ha tier configurati
      if (!org.loyalty_tiers || org.loyalty_tiers.length === 0) {
        console.log('   ⚠️  Nessun tier configurato, skip');
        continue;
      }

      const tiers = org.loyalty_tiers as Array<{
        name: string;
        threshold: string;
        multiplier: string;
        color?: string;
      }>;

      console.log(`   ✅ Tier configurati: ${tiers.map(t => t.name).join(', ')}`);

      // Ordina tier per soglia (dal più basso al più alto)
      const sortedTiers = [...tiers].sort((a, b) =>
        parseInt(a.threshold) - parseInt(b.threshold)
      );

      // 2. Ottieni tutti i clienti di questa organizzazione
      const { data: customers, error: custError } = await supabase
        .from('customers')
        .select('id, name, points, tier, organization_id')
        .eq('organization_id', org.id);

      if (custError) {
        console.error(`   ❌ Errore caricamento clienti:`, custError);
        continue;
      }

      console.log(`   👥 Trovati ${customers?.length || 0} clienti da aggiornare`);

      // 3. Aggiorna ogni cliente con il tier corretto basato sui punti
      let updatedCount = 0;
      for (const customer of customers || []) {
        // Calcola il tier corretto in base ai punti
        let correctTier = sortedTiers[0].name; // Default: primo tier (più basso)

        for (const tier of sortedTiers.reverse()) {
          if (customer.points >= parseInt(tier.threshold)) {
            correctTier = tier.name;
            break;
          }
        }

        // Aggiorna solo se il tier è cambiato
        if (customer.tier !== correctTier) {
          const { error: updateError } = await supabase
            .from('customers')
            .update({ tier: correctTier })
            .eq('id', customer.id);

          if (updateError) {
            console.error(`   ❌ Errore aggiornamento ${customer.name}:`, updateError);
          } else {
            console.log(`   ✅ ${customer.name}: "${customer.tier}" → "${correctTier}" (${customer.points} punti)`);
            updatedCount++;
          }
        }
      }

      console.log(`   📊 Aggiornati ${updatedCount}/${customers?.length || 0} clienti`);
    }

    console.log('\n\n✅ Migrazione completata con successo!');

  } catch (error) {
    console.error('❌ Errore durante la migrazione:', error);
  }
}

// Esegui la migrazione
migrateTiers();
