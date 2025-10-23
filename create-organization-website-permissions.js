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

async function createPermissions() {
  try {
    await client.connect();
    console.log('✅ Connesso al database Neon\n');

    // Trova il role pubblico
    const publicRole = await client.query(`
      SELECT id, document_id FROM up_roles WHERE type = 'public'
    `);

    if (publicRole.rows.length === 0) {
      console.error('❌ Role pubblico non trovato!');
      return;
    }

    const roleId = publicRole.rows[0].id;
    console.log(`📋 Role pubblico ID: ${roleId}\n`);

    // Azioni da creare per organization-websites
    const actions = [
      'api::organization-website.organization-website.find',
      'api::organization-website.organization-website.findOne',
    ];

    console.log('🔧 Creazione permessi per organization-websites...\n');

    for (const action of actions) {
      // Verifica se esiste già
      const existing = await client.query(`
        SELECT id FROM up_permissions WHERE action = $1
      `, [action]);

      let permissionId;

      if (existing.rows.length > 0) {
        permissionId = existing.rows[0].id;
        console.log(`✓ Permesso già esistente: ${action}`);
      } else {
        // Crea il permesso
        const result = await client.query(`
          INSERT INTO up_permissions (document_id, action, created_at, updated_at, published_at)
          VALUES (
            substring(md5(random()::text) from 1 for 24),
            $1,
            NOW(),
            NOW(),
            NOW()
          )
          RETURNING id
        `, [action]);

        permissionId = result.rows[0].id;
        console.log(`✓ Creato permesso: ${action}`);
      }

      // Collega al role pubblico
      const linkExists = await client.query(`
        SELECT 1 FROM up_permissions_role_lnk
        WHERE permission_id = $1 AND role_id = $2
      `, [permissionId, roleId]);

      if (linkExists.rows.length === 0) {
        await client.query(`
          INSERT INTO up_permissions_role_lnk (permission_id, role_id)
          VALUES ($1, $2)
        `, [permissionId, roleId]);
        console.log(`  → Collegato al role pubblico`);
      } else {
        console.log(`  → Già collegato al role pubblico`);
      }
    }

    console.log('\n✅ Permessi configurati con successo!');
    console.log('\n🧪 Testa l\'API con:');
    console.log('curl "https://omnilypro.onrender.com/api/organization-websites"');

  } catch (error) {
    console.error('❌ Errore:', error.message);
    console.error(error);
  } finally {
    await client.end();
  }
}

createPermissions();
