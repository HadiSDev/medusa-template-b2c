import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

// In production over HTTPS, express-session's defaults (secure=true, SameSite=None)
// are correct. Over plain HTTP (local dev behind Traefik on *.localhost), the
// browser would drop the Secure cookie and the admin SPA would fall back to
// the login page on every request. MEDUSA_COOKIE_SECURE=false flips both flags
// to something the browser will keep.
const cookieSecure = process.env.MEDUSA_COOKIE_SECURE !== 'false'

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || 'supersecret',
      cookieSecret: process.env.COOKIE_SECRET || 'supersecret',
    },
    cookieOptions: {
      secure: cookieSecure,
      sameSite: cookieSecure ? 'none' : 'lax',
    },
  },
})
