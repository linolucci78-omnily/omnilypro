/**
 * Create Strapi API Token directly in database
 * Bypasses admin login completely
 */

const { Client } = require('pg');
const crypto = require('crypto');

const DATABASE_URL = 'postgresql://neondb_owner:npg_ZUhFqO7XRv2A@ep-red-heart-abs55dqq-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require';
const API_TOKEN_SALT = '2dece4f312508f44a80003742390e3c0bfbb7bc4ac991a3f6e5f2ba3e68500a4';

// Generate a random API token
const generateToken = () => {
  const buffer = crypto.randomBytes(128);
  return buffer.toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 128);
};

// Hash the token with Strapi's method
const hashToken = (token, salt) => {
  return crypto
    .createHash('sha512')
    .update(`${token}${salt}`)
    .digest('hex');
};

async function createAPIToken() {
  const client = new Client({
    connectionString: DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Connesso a Neon database');

    // Generate token
    const plainToken = generateToken();
    const hashedToken = hashToken(plainToken, API_TOKEN_SALT);

    console.log('🔐 Token generato');

    // Insert token into database
    const result = await client.query(
      `INSERT INTO strapi_api_tokens
       (name, description, type, access_key, last_used_at, expires_at, lifespan, created_at, updated_at, created_by_id, updated_by_id)
       VALUES ($1, $2, $3, $4, NULL, NULL, NULL, NOW(), NOW(), NULL, NULL)
       RETURNING id, name, type`,
      [
        'Frontend Full Access Token',
        'Auto-generated token for frontend integration',
        'full-access',
        hashedToken
      ]
    );

    console.log('✅ Token creato con successo!');
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('📋 IMPORTANTE - Salva questo token!');
    console.log('');
    console.log('🔑 API Token (copia questo):');
    console.log('');
    console.log(plainToken);
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('📝 Configurazione:');
    console.log('   Token Name:', result.rows[0].name);
    console.log('   Token Type:', result.rows[0].type);
    console.log('   Token ID:', result.rows[0].id);
    console.log('');
    console.log('🔗 Strapi URL: https://omnilypro.onrender.com');
    console.log('');
    console.log('⚠️  Questo token NON verrà più mostrato!');
    console.log('   Salvalo subito in un posto sicuro!');
    console.log('');

    await client.end();
  } catch (error) {
    console.error('❌ Errore:', error.message);
    process.exit(1);
  }
}

createAPIToken();
