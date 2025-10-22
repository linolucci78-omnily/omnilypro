module.exports = {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register({ strapi }) {
    // Force insecure cookies by intercepting Koa response
    strapi.server.app.use(async (ctx, next) => {
      await next();

      // Intercept and modify Set-Cookie headers
      const setCookie = ctx.response.get('Set-Cookie');
      if (setCookie) {
        if (Array.isArray(setCookie)) {
          ctx.response.set('Set-Cookie', setCookie.map(cookie =>
            cookie.replace(/;\s*Secure/gi, '')
          ));
        } else {
          ctx.response.set('Set-Cookie', setCookie.replace(/;\s*Secure/gi, ''));
        }
      }
    });
  },

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  bootstrap(/* { strapi } */) {},
};
