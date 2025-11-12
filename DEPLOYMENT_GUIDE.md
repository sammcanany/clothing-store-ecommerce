# Deployment Guide

Complete guide for deploying your e-commerce store to production with multiple hosting options optimized for cost and performance.

## Table of Contents

- [Overview](#overview)
- [Deployment Options](#deployment-options)
- [Prerequisites](#prerequisites)
- [Recommended: Vercel + Railway](#recommended-vercel--railway)
- [Alternative: Free Tier](#alternative-free-tier)
- [Alternative: Railway Only](#alternative-railway-only)
- [Troubleshooting](#troubleshooting)
- [Post-Deployment](#post-deployment)
- [Scaling Guide](#scaling-guide)

---

## Overview

This application can be deployed using various strategies depending on your budget and traffic expectations. The recommended approach uses Vercel for the frontend (free) and Railway for the backend ($5-10/month).

### Cost Comparison

| Strategy | Monthly Cost | Traffic Capacity | Setup Time | Best For |
|----------|-------------|------------------|------------|----------|
| **Vercel + Railway** | **$5-10** | 50k visitors | 30 min | **Most users** |
| Free Tier | $0 | 10k visitors | 30 min | Testing |
| Railway Only | $10-20 | 100k visitors | 15 min | Simplicity |
| VPS Self-Hosted | $6-12 | Unlimited | 4-8 hours | Advanced |

---

## Deployment Options

### Option 1: Vercel + Railway (Recommended)

**Architecture:**
```
Frontend (Next.js) -> Vercel (FREE)
Backend (Medusa)   -> Railway ($5-10/month)
PostgreSQL         -> Railway (included)
Redis              -> Railway (included)
```

**Cost:** $5-10/month (may be $0 with Railway's $5 monthly credit)

**Pros:**
- Vercel free tier: 100GB bandwidth, global CDN, zero cold starts
- Railway optimized: PostgreSQL + Redis included
- Professional performance
- Easy scaling

**Limitations:**
- Frontend: 100GB bandwidth/month
- Backend: Must fit within budget initially

---

### Option 2: Full Free Tier

**Architecture:**
```
Frontend (Next.js) -> Vercel (FREE)
Backend (Medusa)   -> Render (FREE with cold starts)
PostgreSQL         -> Supabase (FREE 500MB)
Redis              -> Upstash (FREE 10k commands/day)
```

**Cost:** $0/month

**Pros:**
- Completely free
- Good for testing and validation

**Limitations:**
- Backend sleeps after 15 min inactivity (30-60s cold starts)
- 500MB database storage limit
- 10k Redis commands/day limit
- Not suitable for production traffic

---

### Option 3: Railway Only

**Architecture:**
```
Everything on Railway (all services in one platform)
```

**Cost:** $10-20/month (net after $5 credit)

**Pros:**
- Everything in one dashboard
- Easy management
- Good scaling options

**Cons:**
- Higher cost than hybrid approach
- No free CDN like Vercel provides

---

## Prerequisites

### Required Accounts

1. **GitHub account** (you already have this)
2. **Vercel account** - Sign up at [vercel.com](https://vercel.com) with GitHub
3. **Railway account** - Sign up at [railway.app](https://railway.app) with GitHub

### Required API Keys

1. **Stripe API Keys**
   - Secret key (sk_live_... or sk_test_...)
   - Publishable key (pk_live_... or pk_test_...)
   - Get from: [dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys)

2. **USPS API Credentials**
   - Client ID
   - Client Secret
   - Get from: [developer.usps.com](https://developer.usps.com)

3. **Security Secrets** (generate with commands below)
   - JWT_SECRET (32+ characters)
   - COOKIE_SECRET (32+ characters)

4. **Admin Credentials**
   - Email address for admin account
   - Strong password for admin account

5. **Warehouse Address**
   - Street address, city, state, ZIP code

### Optional

- SendGrid API key (for transactional emails)
- Custom domain (for branded URLs)

### Generate Security Secrets

Run these commands locally:

```bash
# Generate JWT_SECRET
openssl rand -base64 32

# Generate COOKIE_SECRET
openssl rand -base64 32
```

Save these values - you'll need them during deployment.

---

## Recommended: Vercel + Railway

This section provides step-by-step instructions for the recommended deployment strategy.

### Step 1: Deploy Backend to Railway (15 minutes)

#### 1.1 Create Railway Account
1. Go to [railway.app](https://railway.app)
2. Click "Login" and sign in with GitHub
3. Authorize Railway to access your repositories

#### 1.2 Create New Project
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose: `sammcanany/clothing-store-ecommerce`
4. Railway will analyze your repository

#### 1.3 Add PostgreSQL Database
1. In your project, click "+ New"
2. Select "Database" -> "PostgreSQL"
3. Railway automatically provisions it
4. Note: DATABASE_URL will be available as `${{Postgres.DATABASE_URL}}`

#### 1.4 Add Redis Cache
1. Click "+ New" again
2. Select "Database" -> "Redis"
3. Railway automatically provisions it
4. Note: REDIS_URL will be available as `${{Redis.REDIS_URL}}`

#### 1.5 Deploy Backend Service
1. Click "+ New" -> "GitHub Repo"
2. Select your repository
3. Configure settings:
   - Root Directory: `backend`
   - Railway will detect `backend/railway.json`
   - Dockerfile will be used automatically

#### 1.6 Configure Backend Environment Variables

Click on backend service -> "Variables" tab -> "Raw Editor" -> Paste:

```bash
# Database & Cache (Reference from Railway services)
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}

# Security Secrets (Use values generated in Prerequisites)
JWT_SECRET=your-generated-jwt-secret-here
COOKIE_SECRET=your-generated-cookie-secret-here

# Admin Credentials
ADMIN_EMAIL=admin@yourstore.com
ADMIN_PASSWORD=your-secure-password-here

# CORS (Update after Vercel deployment)
STORE_CORS=http://localhost:3000
ADMIN_CORS=${{RAILWAY_PUBLIC_DOMAIN}}
AUTH_CORS=http://localhost:3000,${{RAILWAY_PUBLIC_DOMAIN}}

# Stripe
STRIPE_API_KEY=your-stripe-secret-key

# USPS Shipping
USPS_CLIENT_ID=your-usps-client-id
USPS_CLIENT_SECRET=your-usps-client-secret
USPS_ENVIRONMENT=production

# Warehouse Address
WAREHOUSE_ADDRESS=123 Main St
WAREHOUSE_CITY=San Francisco
WAREHOUSE_STATE=CA
WAREHOUSE_ZIP=94105
WAREHOUSE_COUNTRY=US

# Optional: SendGrid Email
SENDGRID_API_KEY=your-sendgrid-key
SENDGRID_FROM_EMAIL=noreply@yourstore.com

# Environment
NODE_ENV=production
MEDUSA_DISABLE_TELEMETRY=true
```

Replace all placeholder values with your actual credentials.

#### 1.7 Deploy Backend
1. Click "Deploy"
2. Wait 5-10 minutes for deployment
3. Monitor logs for any errors
4. Once deployed, go to Settings and copy the "Public Domain"
5. Your backend URL will be: `https://backend-production-xxxx.up.railway.app`

### Step 2: Deploy Frontend to Vercel (10 minutes)

#### 2.1 Create Vercel Account
1. Go to [vercel.com](https://vercel.com)
2. Click "Sign Up" -> Continue with GitHub
3. Authorize Vercel to access your repositories

#### 2.2 Import Project
1. Click "Add New..." -> "Project"
2. Import `sammcanany/clothing-store-ecommerce`
3. Configure project:
   - Framework Preset: Next.js (auto-detected)
   - Root Directory: `frontend`
   - Build Command: `npm run build` (auto-detected)
   - Output Directory: `.next` (auto-detected)

#### 2.3 Configure Frontend Environment Variables

Before clicking "Deploy", add these environment variables:

```bash
# Backend URL (use your Railway backend URL from Step 1.7)
NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://your-backend.railway.app

# Frontend URL (Vercel will assign this - update after first deploy)
NEXT_PUBLIC_BASE_URL=https://your-project.vercel.app

# Medusa API credentials (add after initial setup)
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=placeholder
NEXT_PUBLIC_MEDUSA_REGION_ID=placeholder

# Stripe Public Key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key

# Environment
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
```

#### 2.4 Deploy Frontend
1. Click "Deploy"
2. Wait 3-5 minutes for build
3. Once deployed, Vercel shows your live URL
4. Copy this URL for the next step

### Step 3: Update CORS Configuration (5 minutes)

Now that both services are deployed, update backend CORS:

1. Go to Railway -> Backend Service -> "Variables"
2. Update these three variables with your Vercel URL:

```bash
STORE_CORS=https://your-actual-project.vercel.app
AUTH_CORS=https://your-actual-project.vercel.app,${{RAILWAY_PUBLIC_DOMAIN}}
ADMIN_CORS=${{RAILWAY_PUBLIC_DOMAIN}}
```

3. Save changes - backend will automatically redeploy

### Step 4: Initial Setup (10 minutes)

#### 4.1 Check Backend Health

Visit: `https://your-backend.railway.app/health`

Expected response:
```json
{
  "status": "ok",
  "service": "clothing-store-backend",
  "timestamp": "2024-...",
  "uptime": 123
}
```

#### 4.2 Access Medusa Admin

1. Go to: `https://your-backend.railway.app/app`
2. Login with your ADMIN_EMAIL and ADMIN_PASSWORD
3. You should see the Medusa admin dashboard

#### 4.3 Get API Credentials

**Get Publishable Key:**
1. Medusa admin -> Settings -> Publishable API Keys
2. Copy the default key (starts with `pk_`)

**Get Region ID:**
1. Medusa admin -> Settings -> Regions
2. Copy the region ID (starts with `reg_`)

#### 4.4 Update Frontend Environment Variables

1. Go to Vercel -> Project -> Settings -> Environment Variables
2. Update these variables:

```bash
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_actual_key_from_admin
NEXT_PUBLIC_MEDUSA_REGION_ID=reg_actual_region_id
NEXT_PUBLIC_BASE_URL=https://your-actual-vercel-url.vercel.app
```

3. Go to Deployments tab
4. Click "..." on latest deployment -> "Redeploy"

### Step 5: Testing (5 minutes)

#### Test Backend API

```bash
# Check health
curl https://your-backend.railway.app/health

# Check products endpoint
curl https://your-backend.railway.app/store/products
```

#### Test Frontend

1. Visit: `https://your-project.vercel.app`
2. Browse products
3. Add item to cart
4. View cart
5. Proceed to checkout

#### Test Stripe Payment

Use Stripe test card:
- Card Number: 4242 4242 4242 4242
- Expiry: Any future date
- CVC: Any 3 digits
- ZIP: Any 5 digits

### Step 6: Production Checklist

- [ ] Frontend loads without errors
- [ ] Products display correctly
- [ ] Can add items to cart
- [ ] Cart functions properly
- [ ] Checkout page loads
- [ ] Stripe payment form appears
- [ ] Can complete test purchase
- [ ] Health endpoints respond
- [ ] Admin dashboard accessible

---

## Alternative: Free Tier

For testing or very low traffic sites.

### Architecture

- Frontend: Vercel (FREE)
- Backend: Render (FREE with cold starts)
- Database: Supabase (FREE 500MB PostgreSQL)
- Cache: Upstash (FREE 10k Redis commands/day)

### Setup Steps

#### 1. Create Supabase Database

1. Go to [supabase.com](https://supabase.com)
2. Create account and new project
3. Copy connection string from Settings -> Database -> Connection String
4. Format: `postgresql://postgres:[password]@[host]:5432/postgres`

#### 2. Create Upstash Redis

1. Go to [upstash.com](https://upstash.com)
2. Create account
3. Create Redis database
4. Copy REDIS_URL (format: `rediss://...`)

#### 3. Deploy Backend to Render

**Option A: Using render.yaml**
1. Go to [render.com/new](https://render.com/new)
2. Connect GitHub repository
3. Render detects `render.yaml`
4. Click "Apply"
5. Add environment variables from `backend/.env.render`

**Option B: Manual Setup**
1. Render Dashboard -> New -> Web Service
2. Connect repository
3. Settings:
   - Name: clothing-store-backend
   - Root Directory: backend
   - Environment: Docker
   - Dockerfile Path: backend/Dockerfile.railway
   - Instance Type: Free
4. Add environment variables
5. Deploy

#### 4. Deploy Frontend to Vercel

Same as Step 2 in Vercel + Railway section above.

#### 5. Configure Environment Variables

Use `backend/.env.render` and `frontend/.env.vercel` templates.

### Limitations

- Backend sleeps after 15 minutes of inactivity
- First request after sleep takes 30-60 seconds (cold start)
- 500MB database storage limit
- 10k Redis commands per day
- Not recommended for production with real users

---

## Alternative: Railway Only

Deploy everything on Railway for simplified management.

### Cost

$10-20/month (net after $5 credit) with optimized resources.

### Setup

Follow Railway deployment steps but include frontend service:

1. Add PostgreSQL service
2. Add Redis service
3. Add Backend service (root: `backend`)
4. Add Frontend service (root: `frontend`)

### Resource Optimization

The Railway configuration files already include optimized resource limits:

**Backend (backend/railway.json):**
- Memory: 512Mi
- CPU: 0.5 vCPU

**Frontend (frontend/railway.json):**
- Memory: 256Mi
- CPU: 0.25 vCPU

These limits reduce costs by ~50% while maintaining good performance.

---

## Troubleshooting

### Frontend Shows "Failed to Fetch"

**Cause:** CORS misconfiguration

**Solution:**
1. Check CORS settings in Railway backend
2. Verify STORE_CORS includes exact Vercel URL (with https://)
3. Ensure no trailing slash in URLs
4. Redeploy backend after changes

### Backend Won't Start

**Cause:** Missing or invalid environment variables

**Solution:**
1. Check Railway logs (Service -> Logs tab)
2. Verify all required environment variables are set
3. Ensure JWT_SECRET and COOKIE_SECRET are 32+ characters
4. Verify DATABASE_URL is correctly referenced: `${{Postgres.DATABASE_URL}}`

### Database Connection Errors

**Cause:** PostgreSQL service not running or misconfigured

**Solution:**
1. Check PostgreSQL service status in Railway
2. Verify DATABASE_URL reference is correct
3. Ensure database has finished provisioning
4. Check for SSL configuration issues

### Payment Processing Fails

**Cause:** Stripe configuration issues

**Solution:**
1. Verify Stripe API keys are correct
2. Check using test keys for testing, live keys for production
3. Ensure STRIPE_API_KEY in backend matches key type
4. Verify NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY in frontend

### Health Check Fails

**Cause:** Service not fully started or health endpoint issue

**Solution:**
1. Wait 2-3 minutes for service to fully start
2. Check logs for startup errors
3. Verify migrations completed successfully
4. Test health endpoint manually: `curl https://your-backend.railway.app/health`

### Cold Starts (Free Tier Only)

**Cause:** Render free tier sleeps after 15 minutes

**Solution:**
- Upgrade to paid tier ($7/month)
- Or use Railway/Vercel hybrid approach
- Cold starts are normal behavior for free tier

---

## Post-Deployment

### Add Products

1. Access admin: `https://your-backend.railway.app/app`
2. Go to Products section
3. Click "Add Product"
4. Upload images and set details
5. Publish products

### Configure Shipping

1. Admin -> Settings -> Shipping
2. Create shipping profiles
3. Set up shipping options
4. Configure USPS rate calculation
5. Test with real addresses

### Set Up Stripe Webhooks

For order notifications and payment confirmations:

1. Stripe Dashboard -> Webhooks
2. Add endpoint: `https://your-backend.railway.app/stripe/webhooks`
3. Subscribe to events:
   - payment_intent.succeeded
   - charge.succeeded
4. Copy webhook signing secret
5. Add to Railway environment variables: `STRIPE_WEBHOOK_SECRET`

### Add Custom Domain

**For Frontend (Vercel):**
1. Vercel -> Project -> Settings -> Domains
2. Add custom domain (e.g., yourstore.com)
3. Configure DNS records as instructed
4. Wait for SSL certificate (automatic)

**For Backend (Railway):**
1. Railway -> Service -> Settings -> Domains
2. Add custom domain (e.g., api.yourstore.com)
3. Add CNAME record to DNS
4. Wait for SSL certificate

**Update Environment Variables:**

After adding custom domains, update:

Backend:
```bash
STORE_CORS=https://yourstore.com
AUTH_CORS=https://yourstore.com,https://api.yourstore.com
ADMIN_CORS=https://api.yourstore.com
```

Frontend:
```bash
NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://api.yourstore.com
NEXT_PUBLIC_BASE_URL=https://yourstore.com
```

Redeploy both services.

### Enable Email Notifications

1. Create SendGrid account (free tier: 100 emails/day)
2. Get API key from SendGrid dashboard
3. Verify sender email address
4. Add to Railway environment variables:
   ```bash
   SENDGRID_API_KEY=SG.your_api_key
   SENDGRID_FROM_EMAIL=noreply@yourstore.com
   ```
5. Redeploy backend
6. Test order confirmation emails

### Set Up Monitoring

**Cost Monitoring:**
- Railway: Dashboard -> Usage tab -> Set budget alerts
- Vercel: Dashboard -> Settings -> Usage alerts

**Uptime Monitoring:**
- Use UptimeRobot (free tier available)
- Monitor: `https://your-backend.railway.app/health`
- Set up email/SMS alerts for downtime

**Error Tracking:**
- Optional: Set up Sentry for error tracking
- Add Sentry DSN to environment variables
- Monitor application errors in real-time

---

## Scaling Guide

### Traffic Growth Strategy

**0-5k visitors/month:**
- Current setup: $0-5/month
- No changes needed

**5k-50k visitors/month:**
- Current setup: $5-15/month
- No changes needed
- Monitor bandwidth usage

**50k-100k visitors/month:**
- Upgrade Railway resources: $15-30/month
- Increase backend memory to 1GB
- Increase CPU to 1 vCPU
- Consider Vercel Pro ($20/month) for analytics

**100k+ visitors/month:**
- Consider AWS/GCP migration: $100-500/month
- Add load balancing
- Dedicated databases
- Redis cluster
- CDN for all static assets

### Upgrade Railway Resources

When you need more capacity:

1. Railway -> Service -> Settings -> Resources
2. Adjust memory/CPU:
   - Backend: 1GB RAM, 1 vCPU
   - Frontend: 512MB RAM, 0.5 vCPU (if hosting on Railway)
3. Railway adjusts billing automatically
4. Monitor performance and costs

### Database Optimization

As your database grows:

```sql
-- Add indexes for common queries
CREATE INDEX idx_products_handle ON product(handle);
CREATE INDEX idx_orders_customer_id ON "order"(customer_id);
CREATE INDEX idx_line_items_order_id ON line_item(order_id);
```

Run during low-traffic periods.

### Cost Optimization Tips

1. **Use CDN for Images**
   - Cloudflare R2 (free 10GB)
   - Cloudinary (free 25GB)
   - Don't store images in database

2. **Enable Caching**
   - Redis already configured
   - Set appropriate cache TTLs
   - Cache product data, shipping rates

3. **Optimize Frontend Bundle**
   ```bash
   cd frontend
   npm run build
   npx @next/bundle-analyzer
   ```

4. **Monitor Costs Weekly**
   - Check Railway usage dashboard
   - Review Vercel bandwidth usage
   - Adjust resources as needed

5. **Use Staging on Free Tier**
   - Production: Vercel + Railway ($5-10/month)
   - Staging: Render + Supabase (free)
   - Save money on test environments

---

## Security Checklist

Before going live:

- [ ] Use strong, unique passwords for admin
- [ ] JWT_SECRET and COOKIE_SECRET are 32+ characters
- [ ] Using live Stripe keys (not test keys)
- [ ] All API keys stored as environment variables (not in code)
- [ ] Enable 2FA on Vercel and Railway accounts
- [ ] CORS configured correctly (no wildcards)
- [ ] SSL/HTTPS enabled on all services (automatic)
- [ ] Rate limiting enabled (automatic in production mode)
- [ ] Database SSL enabled (automatic in production)
- [ ] Security headers configured
- [ ] Error messages sanitized (already done)

---

## Summary

### Recommended Setup: Vercel + Railway

**Total Time:** 30-45 minutes
**Total Cost:** $5-10/month (likely $0 initially with credits)

**What You Get:**
- Production-ready e-commerce store
- Global CDN for fast loading
- Managed PostgreSQL and Redis
- Automatic SSL/HTTPS
- Easy scaling path
- Professional infrastructure

**Next Steps:**
1. Create accounts (Vercel, Railway)
2. Gather API keys (Stripe, USPS)
3. Follow Step 1-6 above
4. Test thoroughly
5. Add products and go live

For detailed environment variable templates, see:
- `backend/.env.railway` (Railway backend variables)
- `frontend/.env.vercel` (Vercel frontend variables)
- `backend/.env.render` (Render free tier variables)

For security configuration details, see `SECURITY_MODES.md`.

For production readiness assessment, see `PRODUCTION_READINESS_REVIEW.md`.
