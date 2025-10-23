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

async function resetPassword() {
  try {
    await client.connect();
    console.log('✅ Connesso al database Neon\n');

    // Nuova password semplice per il reset
    const newPassword = 'Admin123!';
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Reset password per l'utente admin
    const result = await client.query(`
      UPDATE admin_users
      SET password = $1
      WHERE email = 'linolucci78@gmail.com'
      RETURNING id, email, firstname, lastname
    `, [hashedPassword]);

    if (result.rows.length > 0) {
      console.log('✅ Password resettata con successo!\n');
      console.log('👤 Utente:', result.rows[0].firstname, result.rows[0].lastname);
      console.log('📧 Email:', result.rows[0].email);
      console.log('🔑 Nuova password:', newPassword);
      console.log('\n💡 Usa queste credenziali per il login:');
      console.log(`   Email: ${result.rows[0].email}`);
      console.log(`   Password: ${newPassword}`);
    } else {
      console.log('❌ Utente non trovato!');
    }

  } catch (error) {
    console.error('❌ Errore:', error.message);
  } finally {
    await client.end();
  }
}

resetPassword();
