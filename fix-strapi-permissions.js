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

async function fixPermissions() {
  try {
    await client.connect();
    console.log('✅ Connesso al database Neon\n');

    // Trova il role pubblico
    const publicRole = await client.query(`
      SELECT id, document_id, name, type FROM up_roles WHERE type = 'public'
    `);

    console.log('📋 Role pubblico:', publicRole.rows[0]);
    const roleId = publicRole.rows[0].id;

    // Verifica permessi esistenti per organization-website
    const existingPerms = await client.query(`
      SELECT p.id, p.action
      FROM up_permissions p
      WHERE p.action LIKE '%organization-website%'
    `);

    console.log('\n🔍 Permessi organization-website esistenti:', existingPerms.rows.length);
    existingPerms.rows.forEach(p => console.log(`  - ${p.action}`));

    // Verifica se sono collegati al role pubblico
    if (existingPerms.rows.length > 0) {
      const linked = await client.query(`
        SELECT l.permission_id, l.role_id
        FROM up_permissions_role_lnk l
        WHERE l.permission_id = ANY($1)
      `, [existingPerms.rows.map(p => p.id)]);

      console.log('\n🔗 Collegamenti al role pubblico:', linked.rows.length);

      if (linked.rows.length === 0) {
        console.log('\n⚠️  I permessi esistono ma NON sono collegati al role pubblico!');
        console.log('Aggiungendo collegamenti...\n');

        for (const perm of existingPerms.rows) {
          await client.query(`
            INSERT INTO up_permissions_role_lnk (permission_id, role_id)
            VALUES ($1, $2)
            ON CONFLICT DO NOTHING
          `, [perm.id, roleId]);
          console.log(`✅ Collegato permesso: ${perm.action}`);
        }
      } else {
        console.log('✅ I permessi sono già collegati al role pubblico');
      }
    } else {
      console.log('\n❌ PROBLEMA: Nessun permesso trovato per organization-website!');
      console.log('Questo significa che Strapi non ha ancora generato i permessi per questo content-type.');
      console.log('\nDobbiamo attendere che il deploy su Render si completi.');
      console.log('Dopo il deploy, Strapi genererà automaticamente i permessi.');
    }

    // Mostra tutti i permessi API esistenti
    const apiPerms = await client.query(`
      SELECT action FROM up_permissions
      WHERE action LIKE 'api::%'
      ORDER BY action
    `);

    console.log(`\n📊 Content-types API disponibili (${apiPerms.rows.length}):`);
    apiPerms.rows.forEach(p => console.log(`  - ${p.action}`));

  } catch (error) {
    console.error('❌ Errore:', error.message);
    console.error(error);
  } finally {
    await client.end();
  }
}

fixPermissions();
