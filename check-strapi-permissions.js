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

    // Trova il role "public"
    const publicRole = await client.query(`
      SELECT id, name, type FROM up_roles WHERE type = 'public'
    `);

    console.log('📋 Role pubblico:', publicRole.rows);

    if (publicRole.rows.length > 0) {
      const roleId = publicRole.rows[0].id;

      // Verifica permessi per organization-website
      const permissions = await client.query(`
        SELECT p.id, p.action, p.role
        FROM up_permissions p
        WHERE p.role = $1
        AND p.action LIKE '%organization-website%'
      `, [roleId]);

      console.log('\n🔐 Permessi per organization-website:');
      if (permissions.rows.length === 0) {
        console.log('  ❌ NESSUN PERMESSO TROVATO!');
        console.log('  Questo spiega il 404 - il content-type non è accessibile pubblicamente');
      } else {
        permissions.rows.forEach(perm => {
          console.log(`  - ${perm.action}`);
        });
      }

      // Mostra tutti i permessi pubblici per riferimento
      const allPublicPerms = await client.query(`
        SELECT action FROM up_permissions WHERE role = $1 ORDER BY action
      `, [roleId]);

      console.log(`\n📊 Totale permessi pubblici: ${allPublicPerms.rows.length}`);
      console.log('\n🔍 Permessi API disponibili:');
      allPublicPerms.rows
        .filter(p => p.action.startsWith('api::'))
        .slice(0, 10)
        .forEach(perm => {
          console.log(`  - ${perm.action}`);
        });
    }

  } catch (error) {
    console.error('❌ Errore:', error.message);
  } finally {
    await client.end();
  }
}

checkPermissions();
