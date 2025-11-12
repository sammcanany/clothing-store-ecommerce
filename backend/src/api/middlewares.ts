import { defineMiddlewares } from "@medusajs/medusa"
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { NextFunction } from "express"
import { SecurityConfig } from "../config/security"

// Simple in-memory rate limiter (for production, use Redis-based solution)
// Rate limiting is automatically disabled in development mode unless RATE_LIMITING_ENABLED=true
interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key)
    }
  }
}, 5 * 60 * 1000)

function rateLimit(options: {
  windowMs: number
  maxRequests: number
  keyPrefix: string
}) {
  return (req: MedusaRequest, res: MedusaResponse, next: NextFunction) => {
    // Skip rate limiting if disabled (e.g., in development)
    if (!SecurityConfig.rateLimiting.enabled) {
      return next()
    }

    // Get client identifier (IP address or customer ID if authenticated)
    const identifier = req.auth_context?.actor_id ||
                      req.headers['x-forwarded-for'] ||
                      req.headers['x-real-ip'] ||
                      req.ip ||
                      'unknown'

    const key = `${options.keyPrefix}:${identifier}`
    const now = Date.now()

    let entry = rateLimitStore.get(key)

    if (!entry || entry.resetTime < now) {
      // Create new entry or reset expired entry
      entry = {
        count: 1,
        resetTime: now + options.windowMs
      }
      rateLimitStore.set(key, entry)
      return next()
    }

    entry.count++

    if (entry.count > options.maxRequests) {
      // Rate limit exceeded
      res.status(429).json({
        error: "Too many requests. Please try again later.",
        retryAfter: Math.ceil((entry.resetTime - now) / 1000)
      })
      return
    }

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', options.maxRequests.toString())
    res.setHeader('X-RateLimit-Remaining', (options.maxRequests - entry.count).toString())
    res.setHeader('X-RateLimit-Reset', new Date(entry.resetTime).toISOString())

    next()
  }
}

export default defineMiddlewares({
  routes: [
    // Rate limit authentication endpoints
    // Dev: 1000 requests per minute | Prod: 5 attempts per 15 minutes
    {
      matcher: "/auth/*",
      middlewares: [
        rateLimit({
          windowMs: SecurityConfig.rateLimiting.auth.windowMs,
          maxRequests: SecurityConfig.rateLimiting.auth.maxRequests,
          keyPrefix: "auth"
        })
      ]
    },
    // Rate limit review submissions
    // Dev: 100 per minute | Prod: 3 per hour per user
    {
      matcher: "/store/products/*/reviews",
      method: "POST",
      middlewares: [
        rateLimit({
          windowMs: SecurityConfig.rateLimiting.reviews.windowMs,
          maxRequests: SecurityConfig.rateLimiting.reviews.maxRequests,
          keyPrefix: "review"
        })
      ]
    },
    // Rate limit USPS rate calculations
    // Dev: 1000 per minute | Prod: 30 per minute per IP
    {
      matcher: "/store/usps/calculate-rates",
      method: "POST",
      middlewares: [
        rateLimit({
          windowMs: SecurityConfig.rateLimiting.usps.windowMs,
          maxRequests: SecurityConfig.rateLimiting.usps.maxRequests,
          keyPrefix: "usps"
        })
      ]
    },
    // General API rate limit
    // Dev: 10000 per minute | Prod: 100 requests per minute per IP
    {
      matcher: "/store/*",
      middlewares: [
        rateLimit({
          windowMs: SecurityConfig.rateLimiting.api.windowMs,
          maxRequests: SecurityConfig.rateLimiting.api.maxRequests,
          keyPrefix: "api"
        })
      ]
    }
  ]
})
