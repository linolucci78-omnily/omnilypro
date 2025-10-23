const { Client } = require('pg');

const client = new Client({
  host: 'ep-red-heart-abs55dqq-pooler.eu-west-2.aws.neon.tech',
  port: 5432,
  database: 'neondb',
  user: 'neondb_owner',
  password: 'npg_ZUhFqO7XRv2A',
  ssl: {
    rejectUnauthorized: false
  }
});

async function checkTables() {
  try {
    await client.connect();
    console.log('✅ Connesso al database Neon');

    // Verifica se esiste la tabella organization_websites
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'organization_websites'
      );
    `);

    console.log('\n📊 Tabella organization_websites esiste:', tableCheck.rows[0].exists);

    // Mostra tutte le tabelle che contengono 'organization' o 'website'
    const relatedTables = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND (table_name LIKE '%organization%' OR table_name LIKE '%website%')
      ORDER BY table_name;
    `);

    console.log('\n📋 Tabelle correlate trovate:');
    relatedTables.rows.forEach(row => {
      console.log('  -', row.table_name);
    });

    // Se la tabella non esiste, mostralo chiaramente
    if (!tableCheck.rows[0].exists) {
      console.log('\n⚠️  PROBLEMA: La tabella organization_websites non esiste!');
      console.log('Strapi dovrebbe crearla automaticamente al riavvio.');
    } else {
      // Mostra la struttura della tabella
      const columns = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'organization_websites'
        ORDER BY ordinal_position;
      `);

      console.log('\n📐 Struttura tabella organization_websites:');
      columns.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(required)' : ''}`);
      });

      // Conta i record
      const count = await client.query('SELECT COUNT(*) FROM organization_websites');
      console.log('\n📈 Record presenti:', count.rows[0].count);
    }

  } catch (error) {
    console.error('❌ Errore:', error.message);
    if (error.code === 'ENOTFOUND') {
      console.error('   Il database non è raggiungibile');
    } else if (error.code === '28P01') {
      console.error('   Password o username errati');
    } else if (error.code === '42P01') {
      console.error('   Tabella non trovata');
    }
  } finally {
    await client.end();
  }
}

checkTables();
