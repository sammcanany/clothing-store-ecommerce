# Security Configuration Modes

This application has three environment modes with different security settings to make development easy while keeping production secure.

## Quick Start

### Development Mode (Default)
```bash
# Run with relaxed security for easy testing
npm run dev

# Or explicitly:
NODE_ENV=development npm run dev
```

### Testing Mode
```bash
# Run with moderate security for pre-production testing
NODE_ENV=testing npm run dev
```

### Production Mode
```bash
# Run with maximum security
NODE_ENV=production npm start
```

---

## What Changes Between Modes?

| Feature | Development | Testing | Production |
|---------|-------------|---------|------------|
| **Rate Limiting** | Disabled (or 10,000/min) | Enabled (moderate) | Enabled (strict) |
| **Database SSL** | Disabled | Disabled | **Required** |
| **Cookie SameSite** | `lax` | `lax` | `strict` |
| **Cookie Secure** | `false` (HTTP OK) | `false` | `true` (HTTPS only) |
| **Secret Validation** | Min 8 chars | Min 8 chars | **Min 32 chars** |
| **Error Details** | Full details | Info only | Generic only |
| **CSRF Protection** | Relaxed | Moderate | Strict |

---

## Rate Limiting Details

### Development Mode
- **Auth**: 1,000 requests/minute (basically unlimited)
- **Reviews**: 100 requests/minute
- **USPS API**: 1,000 requests/minute
- **General API**: 10,000 requests/minute

### Production Mode
- **Auth**: 5 attempts per 15 minutes (brute force protection)
- **Reviews**: 3 per hour per user (spam protection)
- **USPS API**: 30 requests per minute (API quota protection)
- **General API**: 100 requests per minute

---

## Temporarily Disable Rate Limiting (Dev Only)

If you need to test something rapidly even in dev mode:

```bash
# Completely disable rate limiting
RATE_LIMITING_ENABLED=false npm run dev
```

---

## Testing Production Security Locally

Want to test production-level security on localhost?

```bash
# Set production mode
NODE_ENV=production npm run dev
```

**Note**: This will require:
- Strong secrets (32+ characters)
- HTTPS for cookies to work
- SSL-enabled database connection

---

## Environment Variables for Testing

### Minimal Development Setup
```bash
# .env for development
NODE_ENV=development
JWT_SECRET=testsecret
COOKIE_SECRET=testcookie
DATABASE_URL=postgres://medusa_user:medusa_password@localhost:5432/medusa_db
```

### Production-Ready Setup
```bash
# .env for production
NODE_ENV=production
JWT_SECRET=<32+ random characters>
COOKIE_SECRET=<32+ random characters>
DATABASE_URL=<production-database-with-ssl>
```

Generate strong secrets:
```bash
# Linux/Mac
openssl rand -base64 32

# Windows PowerShell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | % {[char]$_})
```

---

## Override Individual Security Features

You can mix and match security settings using environment variables:

```bash
# Enable rate limiting in development
RATE_LIMITING_ENABLED=true NODE_ENV=development npm run dev

# Disable rate limiting in testing
RATE_LIMITING_ENABLED=false NODE_ENV=testing npm run dev
```

---

## Common Testing Scenarios

### Scenario 1: Rapid API Testing
```bash
# Disable rate limiting for API development
RATE_LIMITING_ENABLED=false npm run dev
```

### Scenario 2: Integration Testing with Postman
```bash
# Use testing mode (rate limits but not too strict)
NODE_ENV=testing npm run dev
```

### Scenario 3: Pre-Production Validation
```bash
# Use production mode with test database
NODE_ENV=production DATABASE_URL=<test-db> npm run dev
```

### Scenario 4: Load Testing
```bash
# Disable rate limiting for load tests
RATE_LIMITING_ENABLED=false NODE_ENV=testing npm run dev
```

---

## Security Best Practices

### ✅ Do This
- Use `development` mode for local development
- Use `testing` mode for staging/pre-production
- Use `production` mode for live deployments
- Generate strong random secrets for production
- Test with production mode before deploying

### ❌ Don't Do This
- Don't use development secrets in production
- Don't disable rate limiting in production
- Don't commit `.env` files with real secrets
- Don't use HTTP (non-HTTPS) in production

---

## Troubleshooting

### "Rate limit exceeded" during testing
```bash
# Solution 1: Use development mode
NODE_ENV=development npm run dev

# Solution 2: Disable rate limiting
RATE_LIMITING_ENABLED=false npm run dev
```

### "JWT_SECRET must be at least 32 characters"
```bash
# You're in production mode with a weak secret
# Solution 1: Use development mode
NODE_ENV=development npm run dev

# Solution 2: Generate a strong secret
export JWT_SECRET=$(openssl rand -base64 32)
export COOKIE_SECRET=$(openssl rand -base64 32)
```

### Cookies not working in production
```bash
# Production requires HTTPS
# Solution: Deploy behind HTTPS proxy (nginx, CloudFlare, etc.)
```

---

## Configuration File Location

All security settings are centralized in:
```
/backend/src/config/security.ts
```

You can modify this file to customize security behavior for your needs.

---

## Quick Environment Switch

Add these to your `package.json` for easy mode switching:

```json
{
  "scripts": {
    "dev": "NODE_ENV=development npm run start:dev",
    "dev:testing": "NODE_ENV=testing npm run start:dev",
    "dev:production": "NODE_ENV=production npm run start:dev",
    "dev:no-limits": "RATE_LIMITING_ENABLED=false npm run start:dev"
  }
}
```

Then run:
```bash
npm run dev              # Development mode
npm run dev:testing      # Testing mode
npm run dev:production   # Production mode (locally)
npm run dev:no-limits    # Dev mode, no rate limits
```
