const crypto = require('crypto');

// Genera un token API con Full Access
const token = crypto.randomBytes(128).toString('hex');

console.log('\n==============================================');
console.log('NUOVO API TOKEN CON FULL ACCESS:');
console.log('==============================================\n');
console.log(token);
console.log('\n==============================================');
console.log('COPIA QUESTO TOKEN NEL FILE .env:');
console.log('==============================================\n');
console.log(`VITE_STRAPI_API_TOKEN=${token}`);
console.log('\n');
console.log('Poi vai su Strapi Admin → Settings → API Tokens');
console.log('e crea manualmente un token chiamato "Frontend Full"');
console.log('con Token Type = "Full access"');
console.log('e incolla questo stesso token quando richiesto.');
console.log('\n');
