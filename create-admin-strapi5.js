const { Client } = require('pg');

// Usiamo bcryptjs con le stesse impostazioni di Strapi 5
const bcrypt = require('bcryptjs');

const client = new Client({
  host: 'ep-red-heart-abs55dqq-pooler.eu-west-2.aws.neon.tech',
  port: 5432,
  database: 'neondb',
  user: 'neondb_owner',
  password: 'npg_ZUhFqO7XRv2A',
  ssl: { rejectUnauthorized: false }
});

async function createAdmin() {
  try {
    await client.connect();
    console.log('✅ Connesso al database\n');

    // Password che userai
    const password = 'OmnilyAdmin2024!';

    // Hash con le stesse impostazioni di Strapi 5 (10 rounds)
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log('🔐 Password hashata:', hashedPassword.substring(0, 20) + '...\n');

    // Prima crea il ruolo super admin se non esiste
    let roleResult = await client.query(`
      SELECT id FROM admin_roles WHERE code = 'strapi-super-admin'
    `);

    let roleId;
    if (roleResult.rows.length === 0) {
      const newRole = await client.query(`
        INSERT INTO admin_roles (name, code, description, created_at, updated_at)
        VALUES ('Super Admin', 'strapi-super-admin', 'Super Admins can access and manage all features and settings.', NOW(), NOW())
        RETURNING id
      `);
      roleId = newRole.rows[0].id;
      console.log('✅ Ruolo Super Admin creato\n');
    } else {
      roleId = roleResult.rows[0].id;
      console.log('✅ Ruolo Super Admin trovato\n');
    }

    // Elimina vecchio admin se esiste
    await client.query(`DELETE FROM admin_users WHERE email = 'admin@omnilypro.com'`);

    // Crea nuovo admin con Strapi 5 structure
    const result = await client.query(`
      INSERT INTO admin_users (
        firstname,
        lastname,
        email,
        password,
        is_active,
        blocked,
        prefered_language,
        created_at,
        updated_at
      ) VALUES (
        'Admin',
        'OmnilyPro',
        'admin@omnilypro.com',
        $1,
        true,
        false,
        'en',
        NOW(),
        NOW()
      )
      RETURNING id, email, firstname, lastname
    `, [hashedPassword]);

    const userId = result.rows[0].id;
    console.log('✅ Admin creato:', result.rows[0].firstname, result.rows[0].lastname);
    console.log('📧 Email:', result.rows[0].email);
    console.log('🆔 ID:', userId);

    // Collega l'admin al ruolo super admin
    await client.query(`
      INSERT INTO admin_users_roles_lnk (user_id, role_id)
      VALUES ($1, $2)
    `, [userId, roleId]);

    console.log('✅ Ruolo Super Admin assegnato\n');

    // Marca come "admin già creato" in strapi_core_store_settings
    await client.query(`
      INSERT INTO strapi_core_store_settings (key, value, type, environment, tag)
      VALUES ('strapi_admin', '{"hasAdmin":true}', 'object', '', '')
      ON CONFLICT (key) DO UPDATE SET value = '{"hasAdmin":true}'
    `);

    console.log('✅ Flag hasAdmin impostato\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 ADMIN CREATO CON SUCCESSO!\n');
    console.log('📋 USA QUESTE CREDENZIALI:');
    console.log('   Email: admin@omnilypro.com');
    console.log('   Password:', password);
    console.log('\n👉 Vai su: https://circular-rhinoceros-omnilypro-5ba2e0a7.koyeb.app/admin');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Errore:', error.message);
    console.error(error);
  } finally {
    await client.end();
  }
}

createAdmin();
