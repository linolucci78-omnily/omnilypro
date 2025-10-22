/**
 * Force insecure cookies middleware
 *
 * This middleware intercepts all responses and removes the 'Secure' flag
 * from Set-Cookie headers to work with Render's HTTPS proxy.
 *
 * This is a workaround for Strapi 5 admin refresh session issue.
 */

module.exports = (config, { strapi }) => {
  return async (ctx, next) => {
    await next();

    // Intercept response and modify Set-Cookie headers
    if (ctx.response.headers['set-cookie']) {
      const cookies = ctx.response.headers['set-cookie'];

      if (Array.isArray(cookies)) {
        ctx.response.headers['set-cookie'] = cookies.map(cookie => {
          // Remove 'Secure' flag from cookie
          return cookie.replace(/;\s*Secure/gi, '');
        });
      } else if (typeof cookies === 'string') {
        ctx.response.headers['set-cookie'] = cookies.replace(/;\s*Secure/gi, '');
      }
    }
  };
};
