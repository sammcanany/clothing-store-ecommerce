import { loadEnv, defineConfig, Modules, ContainerRegistrationKeys } from "@medusajs/utils"
import { SecurityConfig } from "./src/config/security"

loadEnv(process.env.NODE_ENV || "development", process.cwd())

// Validate critical secrets based on environment
if (SecurityConfig.secrets.requireStrong) {
  const minLength = SecurityConfig.secrets.minLength

  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < minLength) {
    throw new Error(`JWT_SECRET must be set and at least ${minLength} characters in production`)
  }
  if (!process.env.COOKIE_SECRET || process.env.COOKIE_SECRET.length < minLength) {
    throw new Error(`COOKIE_SECRET must be set and at least ${minLength} characters in production`)
  }
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL must be set in production")
  }
}

// Environment-appropriate fallback secrets
const jwtSecret = process.env.JWT_SECRET ||
  (SecurityConfig.isDevelopment ? "dev_jwt_secret_change_in_production" : undefined)
const cookieSecret = process.env.COOKIE_SECRET ||
  (SecurityConfig.isDevelopment ? "dev_cookie_secret_change_in_production" : undefined)

if (!jwtSecret || !cookieSecret) {
  throw new Error("JWT_SECRET and COOKIE_SECRET must be set")
}

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret,
      cookieSecret,
    },
    databaseDriverOptions: SecurityConfig.database.ssl || {
      ssl: false,
      sslmode: "disable",
    },
  },
  admin: {
    backendUrl: process.env.MEDUSA_BACKEND_URL || "http://localhost:9000",
  },
  modules: [
    {
      resolve: "@medusajs/medusa/auth",
      dependencies: [Modules.CACHE, ContainerRegistrationKeys.LOGGER],
      options: {
        providers: [
          {
            resolve: "@medusajs/medusa/auth-emailpass",
            id: "emailpass",
          },
          // Only add Google auth if credentials are provided
          ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
            ? [
                {
                  resolve: "@medusajs/medusa/auth-google",
                  id: "google",
                  options: {
                    clientId: process.env.GOOGLE_CLIENT_ID,
                    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                    callbackUrl: process.env.GOOGLE_CALLBACK_URL || "http://localhost:3000/auth/callback",
                  },
                },
              ]
            : []),
        ],
      },
    },
    {
      resolve: "@medusajs/medusa/event-bus-redis",
      options: {
        redisUrl: process.env.REDIS_URL,
      },
    },
    {
      resolve: "@medusajs/medusa/payment",
      options: {
        providers: [
          {
            resolve: "@medusajs/medusa/payment-stripe",
            id: "stripe",
            options: {
              apiKey: process.env.STRIPE_API_KEY,
            },
          },
        ],
      },
    },
    {
      resolve: "@medusajs/medusa/notification",
      options: {
        providers: [
          {
            resolve: "@medusajs/medusa/notification-sendgrid",
            id: "sendgrid",
            options: {
              channels: ["email"],
              api_key: process.env.SENDGRID_API_KEY,
              from: process.env.SENDGRID_FROM_EMAIL,
            },
          },
        ],
      },
    },
    {
      resolve: "@medusajs/medusa/fulfillment",
      options: {
        providers: [
          {
            resolve: "./src/modules/usps-fulfillment",
            id: "usps",
            options: {
              clientId: process.env.USPS_CLIENT_ID,
              clientSecret: process.env.USPS_CLIENT_SECRET,
              environment: process.env.USPS_ENVIRONMENT || "testing",
              originZIPCode: process.env.WAREHOUSE_ZIP || "66217",
              defaultMailClass: "PRIORITY_MAIL",
            },
          },
        ],
      },
    },
  ],
})
