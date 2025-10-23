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

async function checkAdminUsers() {
  try {
    await client.connect();
    console.log('✅ Connesso al database Neon\n');

    // Verifica utenti admin
    const admins = await client.query(`
      SELECT id, firstname, lastname, username, email, is_active, blocked
      FROM admin_users
      ORDER BY id
    `);

    console.log(`📋 Utenti admin trovati: ${admins.rows.length}\n`);

    if (admins.rows.length === 0) {
      console.log('❌ Nessun utente admin trovato!');
      console.log('   Devi creare il primo utente admin.');
      console.log('\n💡 Puoi crearlo via browser andando su:');
      console.log('   👉 https://omnilypro.onrender.com/admin/auth/register-admin');
    } else {
      admins.rows.forEach((user, i) => {
        console.log(`👤 Utente ${i + 1}:`);
        console.log(`   ID: ${user.id}`);
        console.log(`   Nome: ${user.firstname} ${user.lastname}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Username: ${user.username || 'N/A'}`);
        console.log(`   Attivo: ${user.is_active ? '✅' : '❌'}`);
        console.log(`   Bloccato: ${user.blocked ? '🚫 SÌ' : '✓ No'}`);
        console.log('');
      });

      console.log('💡 Per accedere usa una di queste email con la password che hai impostato.');
    }

  } catch (error) {
    console.error('❌ Errore:', error.message);
  } finally {
    await client.end();
  }
}

checkAdminUsers();
