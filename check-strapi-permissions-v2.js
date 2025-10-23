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

async function checkPermissions() {
  try {
    await client.connect();
    console.log('✅ Connesso al database Neon\n');

    // Verifica struttura tabella permessi
    const tables = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name LIKE '%permission%'
      ORDER BY table_name
    `);

    console.log('📋 Tabelle permessi disponibili:');
    tables.rows.forEach(t => console.log(`  - ${t.table_name}`));

    // Verifica colonne tabella up_permissions
    const columns = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'up_permissions'
      ORDER BY ordinal_position
    `);

    console.log('\n📐 Colonne in up_permissions:');
    columns.rows.forEach(c => console.log(`  - ${c.column_name} (${c.data_type})`));

    // Conta i permessi
    const count = await client.query('SELECT COUNT(*) FROM up_permissions');
    console.log(`\n📊 Totale permessi: ${count.rows[0].count}`);

    // Mostra alcuni permessi
    const sample = await client.query('SELECT * FROM up_permissions LIMIT 3');
    console.log('\n🔍 Esempio permessi:');
    console.log(JSON.stringify(sample.rows, null, 2));

  } catch (error) {
    console.error('❌ Errore:', error.message);
  } finally {
    await client.end();
  }
}

checkPermissions();
