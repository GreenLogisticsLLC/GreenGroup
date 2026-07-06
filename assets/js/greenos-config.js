/**
 * GreenOS employee credentials (static preview until subdomain auth is live).
 * Add entries when you are ready — one object per employee:
 * { email: "name@greengrouplogistics.com", password: "your-password", name: "Display Name" }
 *
 * When your subdomain is ready, set appUrl (e.g. "https://os.greengrouplogistics.com").
 * Successful logins will redirect there instead of the on-site dashboard.
 */
window.GL_GREENOS_CONFIG = {
  appUrl: "https://os.greengrouplogistics.com/greenos-dashboard.html",
  users: []
};
