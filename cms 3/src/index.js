module.exports = {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register({ strapi }) {
    // Override Strapi's cookie options at the lowest level
    const originalUse = strapi.server.app.use;
    strapi.server.app.use = function(...args) {
      return originalUse.apply(this, args);
    };

    // Monkey-patch ctx.cookies.set to force secure: false
    strapi.server.app.use(async (ctx, next) => {
      const originalSet = ctx.cookies.set.bind(ctx.cookies);
      ctx.cookies.set = function(name, value, opts = {}) {
        opts.secure = false;
        opts.httpOnly = true;
        opts.sameSite = 'lax';
        return originalSet(name, value, opts);
      };
      await next();
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
