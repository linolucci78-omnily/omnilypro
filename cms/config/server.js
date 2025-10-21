module.exports = ({ env }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  app: {
    keys: env.array('APP_KEYS'),
  },
  url: env('PUBLIC_URL', 'https://omnilypro.onrender.com'),
  proxy: true, // Force proxy mode
  cron: {
    enabled: env.bool('CRON_ENABLED', false),
  },
  admin: {
    auth: {
      secret: env('ADMIN_JWT_SECRET'),
    },
  },
  // Force HTTP mode for cookies behind proxy
  settings: {
    cors: {
      enabled: true,
    },
  },
});
