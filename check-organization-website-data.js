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

async function checkData() {
  try {
    await client.connect();

    // Mostra i dati
    const data = await client.query('SELECT * FROM organization_websites');
    console.log('📊 Dati in organization_websites:\n');
    console.log(JSON.stringify(data.rows, null, 2));

    // Verifica le relazioni
    const links = await client.query('SELECT * FROM organization_websites_template_lnk');
    console.log('\n🔗 Collegamenti template:\n');
    console.log(JSON.stringify(links.rows, null, 2));

  } catch (error) {
    console.error('❌ Errore:', error.message);
  } finally {
    await client.end();
  }
}

checkData();
