/**
 * Reset Strapi Admin Password
 *
 * Questo script resetta la password dell'admin Strapi nel database Neon
 */

const { Client } = require('pg');
const bcrypt = require('bcryptjs');

const DATABASE_URL = 'postgresql://neondb_owner:npg_ZUhFqO7XRv2A@ep-red-heart-abs55dqq-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require';
const ADMIN_EMAIL = 'linolucci78@gmail.com';
const NEW_PASSWORD = 'Admin123!'; // Cambia questa password se vuoi

async function resetPassword() {
  const client = new Client({
    connectionString: DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Connesso a Neon database');

    // Hash della nuova password
    const hashedPassword = await bcrypt.hash(NEW_PASSWORD, 10);
    console.log('🔐 Password hashata');

    // Update password
    const result = await client.query(
      'UPDATE admin_users SET password = $1 WHERE email = $2 RETURNING id, email, username',
      [hashedPassword, ADMIN_EMAIL]
    );

    if (result.rowCount === 0) {
      console.log('❌ Admin user non trovato con email:', ADMIN_EMAIL);
    } else {
      console.log('✅ Password resettata con successo!');
      console.log('');
      console.log('📋 Credenziali di accesso:');
      console.log('   Email:', ADMIN_EMAIL);
      console.log('   Password:', NEW_PASSWORD);
      console.log('');
      console.log('🔗 Login URL: https://omnilypro.onrender.com/admin');
    }

    await client.end();
  } catch (error) {
    console.error('❌ Errore:', error.message);
    process.exit(1);
  }
}

resetPassword();
