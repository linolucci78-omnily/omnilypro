const { Client } = require('pg');
const bcrypt = require('bcryptjs');

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

async function createNewAdmin() {
  try {
    await client.connect();
    console.log('✅ Connesso al database Neon\n');

    // Prima elimina il vecchio utente
    await client.query(`DELETE FROM admin_users WHERE email = 'linolucci78@gmail.com'`);
    console.log('🗑️  Vecchio utente eliminato\n');

    // Credenziali nuovo admin
    const email = 'linolucci78@gmail.com';
    const password = 'Admin123!';
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crea nuovo utente admin
    const result = await client.query(`
      INSERT INTO admin_users (
        firstname,
        lastname,
        email,
        password,
        is_active,
        blocked,
        created_at,
        updated_at
      ) VALUES (
        'Pasquale',
        'Lucci',
        $1,
        $2,
        true,
        false,
        NOW(),
        NOW()
      )
      RETURNING id, email, firstname, lastname
    `, [email, hashedPassword]);

    console.log('✅ Nuovo admin creato con successo!\n');
    console.log('👤 Nome:', result.rows[0].firstname, result.rows[0].lastname);
    console.log('📧 Email:', result.rows[0].email);
    console.log('🔑 Password:', password);
    console.log('\n🎯 USA QUESTE CREDENZIALI:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);

  } catch (error) {
    console.error('❌ Errore:', error.message);
  } finally {
    await client.end();
  }
}

createNewAdmin();
