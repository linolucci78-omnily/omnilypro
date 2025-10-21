module.exports = ({ env }) => ({
  auth: {
    secret: env('ADMIN_JWT_SECRET'),
    options: {
      expiresIn: '7d',
      cookieSecure: false, // CRITICAL: Disable secure cookies for Render proxy
    },
  },
  apiToken: {
    salt: env('API_TOKEN_SALT'),
  },
  transfer: {
    token: {
      salt: env('TRANSFER_TOKEN_SALT'),
    },
  },
  secrets: {
    encryptionKey: env('ENCRYPTION_KEY'),
  },
  flags: {
    nps: env.bool('FLAG_NPS', true),
    promoteEE: env.bool('FLAG_PROMOTE_EE', true),
  },
  // Localizzazione Admin Panel in Italiano
  locales: ['it'],
  defaultLocale: 'it',
  // Fix per cookie sicuri dietro proxy
  url: env('PUBLIC_ADMIN_URL', env('PUBLIC_URL', 'https://omnilypro.onrender.com/admin')),
  serveAdminPanel: env.bool('SERVE_ADMIN', true),
});
