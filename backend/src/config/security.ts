/**
 * Environment-based Security Configuration
 *
 * This allows you to easily toggle security features for different environments:
 * - development: Local development (minimal security for easy testing)
 * - testing: Pre-production testing (moderate security)
 * - production: Live production (maximum security)
 *
 * Set via: NODE_ENV=development|testing|production
 */

export const SecurityConfig = {
  // Current environment
  env: process.env.NODE_ENV || 'development',

  get isDevelopment() {
    return this.env === 'development'
  },

  get isTesting() {
    return this.env === 'testing'
  },

  get isProduction() {
    return this.env === 'production'
  },

  // Rate Limiting Configuration
  rateLimiting: {
    get enabled() {
      // Disable in development, enable in testing and production
      return process.env.RATE_LIMITING_ENABLED === 'true' ||
             SecurityConfig.isTesting ||
             SecurityConfig.isProduction
    },

    // You can temporarily disable rate limiting for testing:
    // RATE_LIMITING_ENABLED=false npm run dev

    auth: {
      get windowMs() {
        return SecurityConfig.isDevelopment ? 60 * 1000 : 15 * 60 * 1000 // 1 min dev, 15 min prod
      },
      get maxRequests() {
        return SecurityConfig.isDevelopment ? 1000 : 5 // Generous in dev
      }
    },

    reviews: {
      get windowMs() {
        return SecurityConfig.isDevelopment ? 60 * 1000 : 60 * 60 * 1000 // 1 min dev, 1 hour prod
      },
      get maxRequests() {
        return SecurityConfig.isDevelopment ? 100 : 3 // Generous in dev
      }
    },

    usps: {
      get windowMs() {
        return 60 * 1000 // Always 1 minute
      },
      get maxRequests() {
        return SecurityConfig.isDevelopment ? 1000 : 30 // Generous in dev
      }
    },

    api: {
      get windowMs() {
        return 60 * 1000 // Always 1 minute
      },
      get maxRequests() {
        return SecurityConfig.isDevelopment ? 10000 : 100 // Very generous in dev
      }
    }
  },

  // Input Validation Configuration
  inputValidation: {
    get enabled() {
      // Always enabled (but can be relaxed in dev)
      return true
    },

    get strict() {
      // Strict validation in production/testing only
      return SecurityConfig.isTesting || SecurityConfig.isProduction
    }
  },

  // Database Configuration
  database: {
    get ssl() {
      return SecurityConfig.isProduction ? {
        rejectUnauthorized: true
      } : false
    }
  },

  // Cookie/Session Configuration
  cookies: {
    get sameSite() {
      // 'lax' allows easier testing with external tools (Postman, etc.)
      // 'strict' is more secure for production
      return SecurityConfig.isProduction ? 'strict' : 'lax'
    },

    get secure() {
      // Only require HTTPS in production
      return SecurityConfig.isProduction
    },

    get httpOnly() {
      // Always HTTP-only (prevents XSS)
      return true
    }
  },

  // Secrets Validation
  secrets: {
    get requireStrong() {
      // Only require strong secrets (32+ chars) in production
      return SecurityConfig.isProduction
    },

    get minLength() {
      return SecurityConfig.isProduction ? 32 : 8
    }
  },

  // Logging Configuration
  logging: {
    get level() {
      if (SecurityConfig.isDevelopment) return 'debug'
      if (SecurityConfig.isTesting) return 'info'
      return 'warn'
    },

    get exposeErrors() {
      // Show detailed errors in development, generic in production
      return SecurityConfig.isDevelopment
    }
  }
}

export default SecurityConfig
