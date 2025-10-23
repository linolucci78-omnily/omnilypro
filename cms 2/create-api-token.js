/**
 * Script per creare un API Token con i permessi corretti
 * Eseguire con: node create-api-token.js
 */

const axios = require('axios');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔑 Script Creazione API Token Strapi\n');

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function createToken() {
  try {
    // 1. Login come admin
    console.log('Inserisci le credenziali del tuo account admin Strapi:\n');

    const email = await question('Email admin: ');
    const password = await question('Password admin: ');

    console.log('\n🔐 Login in corso...\n');

    // Login
    const loginResponse = await axios.post('http://localhost:1337/admin/login', {
      email: email.trim(),
      password: password.trim(),
    });

    const jwt = loginResponse.data.data.token;
    console.log('✅ Login effettuato con successo!\n');

    // 2. Crea API Token
    console.log('📝 Creazione API Token...\n');

    const tokenData = {
      name: 'Frontend Website Builder',
      description: 'Token per accesso frontend al CMS siti web',
      type: 'custom', // full-access o custom
      lifespan: null, // null = unlimited
      permissions: {
        'api::website-template.website-template': {
          controllers: {
            'website-template': {
              find: {
                enabled: true
              },
              findOne: {
                enabled: true
              }
            }
          }
        },
        'api::organization-website.organization-website': {
          controllers: {
            'organization-website': {
              find: {
                enabled: true
              },
              findOne: {
                enabled: true
              },
              create: {
                enabled: true
              },
              update: {
                enabled: true
              },
              delete: {
                enabled: true
              }
            }
          }
        }
      }
    };

    const tokenResponse = await axios.post(
      'http://localhost:1337/admin/api-tokens',
      tokenData,
      {
        headers: {
          Authorization: `Bearer ${jwt}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const newToken = tokenResponse.data.data.accessKey;

    console.log('✅ Token creato con successo!\n');
    console.log('📋 Copia questo token:\n');
    console.log('─'.repeat(80));
    console.log(newToken);
    console.log('─'.repeat(80));
    console.log('\n🔧 Aggiorna il file frontend/.env.local alla riga 8:\n');
    console.log(`VITE_STRAPI_API_TOKEN=${newToken}\n`);
    console.log('💡 Poi riavvia il frontend (npm run dev) per applicare la modifica.\n');

  } catch (error) {
    console.error('❌ Errore:', error.response?.data || error.message);

    if (error.response?.status === 400) {
      console.error('\n💡 Suggerimento: Verifica che email e password siano corretti');
    }
  } finally {
    rl.close();
  }
}

createToken();
