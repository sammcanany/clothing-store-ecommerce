# Railway Deployment Guide

This guide will walk you through deploying your Clothing Store E-commerce application to Railway with optimized configuration.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Architecture Overview](#architecture-overview)
- [Step 1: Create Railway Account](#step-1-create-railway-account)
- [Step 2: Create Project & Services](#step-2-create-project--services)
- [Step 3: Deploy PostgreSQL Database](#step-3-deploy-postgresql-database)
- [Step 4: Deploy Redis Cache](#step-4-deploy-redis-cache)
- [Step 5: Deploy Backend (Medusa)](#step-5-deploy-backend-medusa)
- [Step 6: Deploy Frontend (Next.js)](#step-6-deploy-frontend-nextjs)
- [Step 7: Configure Custom Domains (Optional)](#step-7-configure-custom-domains-optional)
- [Step 8: Initial Setup & Testing](#step-8-initial-setup--testing)
- [Troubleshooting](#troubleshooting)
- [Cost Estimation](#cost-estimation)

---

## Prerequisites

Before starting, ensure you have:

- ✅ GitHub account with this repository
- ✅ Railway account (sign up at [railway.app](https://railway.app))
- ✅ Stripe account with API keys
- ✅ USPS API credentials
- ✅ (Optional) SendGrid account for emails
- ✅ (Optional) Custom domain for production

---

## Architecture Overview

Your Railway project will contain **4 services**:

```
┌─────────────────────────────────────────────────────┐
│                  Railway Project                     │
├─────────────────────────────────────────────────────┤
│                                                       │
│  ┌──────────────┐      ┌──────────────┐            │
│  │  PostgreSQL  │◄─────┤   Backend    │            │
│  │  (Database)  │      │   (Medusa)   │            │
│  └──────────────┘      │   Port 9000  │            │
│                         └──────▲───────┘            │
│  ┌──────────────┐             │                     │
│  │    Redis     │◄────────────┤                     │
│  │   (Cache)    │             │                     │
│  └──────────────┘             │                     │
│                                │                     │
│                         ┌──────┴───────┐            │
│                         │   Frontend   │            │
│                         │   (Next.js)  │            │
│                         │   Port 3000  │            │
│                         └──────────────┘            │
│                                                       │
└─────────────────────────────────────────────────────┘
```

---

## Step 1: Create Railway Account

1. Go to [railway.app](https://railway.app)
2. Click **"Start a New Project"**
3. Sign in with GitHub (recommended for easy repo access)
4. New accounts get **$5 free credit** per month

---

## Step 2: Create Project & Services

### Option A: Deploy from GitHub (Recommended)

1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Authorize Railway to access your GitHub
4. Select this repository: `sammcanany/clothing-store-ecommerce`
5. Railway will detect the monorepo structure

### Option B: Empty Project

1. Click **"New Project"**
2. Select **"Empty Project"**
3. Name it: `clothing-store-ecommerce`

---

## Step 3: Deploy PostgreSQL Database

1. In your Railway project, click **"+ New"**
2. Select **"Database"** → **"PostgreSQL"**
3. Railway will automatically provision the database
4. **Copy the connection string** (you'll need this for backend)

### Get Database Credentials:

```bash
# Railway automatically provides these variables:
DATABASE_URL (full connection string)
POSTGRES_HOST
POSTGRES_PORT
POSTGRES_USER
POSTGRES_PASSWORD
POSTGRES_DB
```

✅ **Important**: Railway's PostgreSQL includes SSL by default - your security config will automatically use it!

---

## Step 4: Deploy Redis Cache

1. Click **"+ New"** in your project
2. Select **"Database"** → **"Redis"**
3. Railway will provision Redis automatically

### Get Redis Credentials:

```bash
# Railway automatically provides:
REDIS_URL (full connection string)
```

---

## Step 5: Deploy Backend (Medusa)

### 5.1 Create Backend Service

1. Click **"+ New"** → **"GitHub Repo"**
2. Select **"Add Service"** → Choose your repo
3. Set **Root Directory**: `backend`
4. Railway will auto-detect the Dockerfile

### 5.2 Configure Backend Environment Variables

Click on your backend service → **"Variables"** tab → Add these:

**Copy from** `backend/.env.railway` and customize:

```bash
# Database (Reference from PostgreSQL service)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Redis (Reference from Redis service)
REDIS_URL=${{Redis.REDIS_URL}}

# Security Secrets (Generate new ones!)
JWT_SECRET=<generate-with-openssl-rand-base64-32>
COOKIE_SECRET=<generate-with-openssl-rand-base64-32>

# Admin Credentials
ADMIN_EMAIL=admin@yourstore.com
ADMIN_PASSWORD=<your-secure-password>

# CORS (Update after frontend deployment)
STORE_CORS=https://your-frontend.up.railway.app
ADMIN_CORS=https://your-backend.up.railway.app
AUTH_CORS=https://your-frontend.up.railway.app,https://your-backend.up.railway.app

# Stripe
STRIPE_API_KEY=sk_live_your_stripe_key

# USPS Shipping
USPS_CLIENT_ID=your_usps_client_id
USPS_CLIENT_SECRET=your_usps_client_secret
USPS_ENVIRONMENT=production

# Warehouse Address
WAREHOUSE_ADDRESS=123 Main St
WAREHOUSE_CITY=San Francisco
WAREHOUSE_STATE=CA
WAREHOUSE_ZIP=94105
WAREHOUSE_COUNTRY=US

# Optional: SendGrid
SENDGRID_API_KEY=SG.your_key
SENDGRID_FROM_EMAIL=noreply@yourstore.com

# Environment
NODE_ENV=production
MEDUSA_DISABLE_TELEMETRY=true
```

### 5.3 Generate Secrets

Run locally to generate secure secrets:

```bash
openssl rand -base64 32  # For JWT_SECRET
openssl rand -base64 32  # For COOKIE_SECRET
```

### 5.4 Configure Build Settings

- **Build Command**: Auto-detected from Dockerfile
- **Start Command**: `npm run start:railway`
- **Health Check Path**: `/health`

### 5.5 Deploy Backend

1. Click **"Deploy"**
2. Watch the build logs
3. Wait for deployment to complete (~5-10 minutes)
4. **Copy the public URL** (e.g., `https://your-backend.up.railway.app`)

---

## Step 6: Deploy Frontend (Next.js)

### 6.1 Create Frontend Service

1. Click **"+ New"** → **"GitHub Repo"**
2. Set **Root Directory**: `frontend`
3. Railway will detect the Dockerfile

### 6.2 Configure Frontend Environment Variables

Click on frontend service → **"Variables"** → Add:

```bash
# Backend URL (Use your backend Railway URL)
NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://your-backend.up.railway.app

# Frontend URL (Railway will provide this after deployment)
NEXT_PUBLIC_BASE_URL=https://your-frontend.up.railway.app

# Medusa Credentials (Get these after initial setup)
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_your_key_here
NEXT_PUBLIC_MEDUSA_REGION_ID=reg_your_region_id

# Stripe Public Key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_key

# Environment
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
```

### 6.3 Deploy Frontend

1. Click **"Deploy"**
2. Wait for build to complete (~3-5 minutes)
3. **Copy the public URL**

### 6.4 Update Backend CORS

Now that you have the frontend URL, go back to **backend environment variables** and update:

```bash
STORE_CORS=https://your-actual-frontend.up.railway.app
AUTH_CORS=https://your-actual-frontend.up.railway.app,https://your-backend.up.railway.app
```

Then **redeploy the backend** service.

---

## Step 7: Configure Custom Domains (Optional)

### Backend Domain

1. Click backend service → **"Settings"** → **"Domains"**
2. Click **"Custom Domain"**
3. Enter: `api.yourstore.com`
4. Add the CNAME record to your DNS:
   ```
   CNAME api.yourstore.com → your-backend.up.railway.app
   ```
5. Wait for SSL certificate (automatic, ~5 minutes)

### Frontend Domain

1. Click frontend service → **"Settings"** → **"Domains"**
2. Enter: `www.yourstore.com` or `yourstore.com`
3. Add DNS records as instructed
4. Wait for SSL certificate

### Update Environment Variables

After adding custom domains, update:

**Backend:**
```bash
STORE_CORS=https://yourstore.com
AUTH_CORS=https://yourstore.com,https://api.yourstore.com
ADMIN_CORS=https://api.yourstore.com
```

**Frontend:**
```bash
NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://api.yourstore.com
NEXT_PUBLIC_BASE_URL=https://yourstore.com
```

Redeploy both services.

---

## Step 8: Initial Setup & Testing

### 8.1 Run Initial Database Setup

Railway will automatically run migrations on first deployment via `start:railway` script.

If you need to manually run setup:

1. Go to backend service → **"Settings"** → **"Deploy"**
2. Temporarily change start command to: `npm run railway:setup`
3. Redeploy
4. Change back to: `npm run start:railway`
5. Redeploy again

### 8.2 Access Medusa Admin

1. Go to: `https://your-backend.up.railway.app/app`
2. Login with your `ADMIN_EMAIL` and `ADMIN_PASSWORD`
3. **Copy the Publishable API Key**:
   - Go to Settings → Publishable API Keys
   - Copy the key (starts with `pk_`)
4. **Get Region ID**:
   - Go to Settings → Regions
   - Copy the region ID (starts with `reg_`)

### 8.3 Update Frontend Variables

Add the keys to frontend environment variables:

```bash
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_actual_key_from_admin
NEXT_PUBLIC_MEDUSA_REGION_ID=reg_actual_region_id
```

Redeploy frontend.

### 8.4 Test the Application

1. Visit your frontend URL
2. Browse products
3. Add items to cart
4. Test checkout flow
5. Verify email notifications (if SendGrid configured)

---

## Troubleshooting

### Backend Won't Start

**Check logs:**
```bash
# In Railway dashboard, click backend → "Logs" tab
```

**Common issues:**
- ❌ Missing required environment variables
- ❌ Database connection failed (check DATABASE_URL)
- ❌ Redis connection failed (check REDIS_URL)
- ❌ JWT/COOKIE secrets too short (must be 32+ chars in production)

**Solution:** Verify all required variables in `backend/.env.railway`

### Frontend Build Fails

**Common issues:**
- ❌ Missing `NEXT_PUBLIC_MEDUSA_BACKEND_URL`
- ❌ Backend URL not accessible during build
- ❌ Out of memory during build

**Solution:**
- Ensure backend is deployed first
- Check frontend environment variables
- Upgrade Railway plan if memory limited

### CORS Errors

**Symptoms:**
```
Access to fetch at 'https://backend...' from origin 'https://frontend...'
has been blocked by CORS policy
```

**Solution:**
1. Verify `STORE_CORS` includes your exact frontend URL (with `https://`)
2. Redeploy backend after updating CORS variables
3. Clear browser cache

### Health Check Failing

**Check endpoints:**
- Backend: `https://your-backend.up.railway.app/health`
- Frontend: `https://your-frontend.up.railway.app/api/health`

Both should return JSON with `"status": "ok"`

### Database Migration Issues

**Manually run migrations:**

1. Go to backend service → **"Settings"**
2. Change start command to: `npm run railway:migrate`
3. Redeploy
4. Check logs for migration results
5. Change back to: `npm run start:railway`
6. Redeploy

### Payment Processing Not Working

**Stripe issues:**
- ✅ Verify you're using **live** keys (not test keys)
- ✅ Check Stripe webhook configuration
- ✅ Ensure `STRIPE_API_KEY` is set in backend
- ✅ Ensure `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` matches in frontend

---

## Cost Estimation

### Railway Pricing (as of 2024)

| Service | Resource Usage | Estimated Cost |
|---------|---------------|----------------|
| **PostgreSQL** | 1GB storage, shared CPU | $5-10/month |
| **Redis** | 512MB memory | $5/month |
| **Backend** | 512MB RAM, 0.5 vCPU | $10-15/month |
| **Frontend** | 512MB RAM, 0.5 vCPU | $5-10/month |
| **Total** | | **$25-40/month** |

**Free tier:** $5/month credit (can run small sites free!)

### Scaling Up

For high traffic:
- Upgrade to 1GB RAM per service: ~$50-80/month
- Add redundancy: ~$80-150/month
- Enterprise: Custom pricing

### External Costs

- **Stripe:** 2.9% + 30¢ per transaction
- **USPS API:** Free for address verification, small fee for shipping labels
- **SendGrid:** Free up to 100 emails/day, then $15/month for 40k emails
- **Custom Domain:** ~$10-15/year (from your registrar)

---

## Optimizations Included

✅ **Multi-stage Docker builds** - Smaller images, faster deploys
✅ **Production-only dependencies** - Reduced container size
✅ **Health check endpoints** - Better monitoring
✅ **Non-root user in containers** - Enhanced security
✅ **Automatic migrations** - Deploy and migrate in one step
✅ **SSL/TLS by default** - All Railway services use HTTPS
✅ **Environment-based security** - Production mode enabled automatically
✅ **Standalone Next.js build** - Optimized for production

---

## Next Steps

1. ✅ Set up monitoring with Railway's built-in metrics
2. ✅ Configure automated backups for PostgreSQL
3. ✅ Set up staging environment (duplicate the project)
4. ✅ Configure webhooks for Stripe
5. ✅ Add custom error pages
6. ✅ Set up proper logging/alerting
7. ✅ Configure CDN for static assets (Cloudflare)

---

## Support & Resources

- **Railway Docs**: https://docs.railway.app
- **Medusa Docs**: https://docs.medusajs.com
- **Next.js Docs**: https://nextjs.org/docs
- **Your Production Readiness Review**: See `PRODUCTION_READINESS_REVIEW.md`
- **Security Configuration**: See `SECURITY_MODES.md`

---

## Summary of What We've Optimized

### 1. **Railway Configuration Files**
- `railway.json` - Monorepo configuration
- `backend/railway.json` - Backend service config with health checks
- `frontend/railway.json` - Frontend service config with health checks

### 2. **Production Dockerfiles**
- `backend/Dockerfile.railway` - Multi-stage optimized build
- `frontend/Dockerfile.railway` - Standalone Next.js build

### 3. **Health Check Endpoints**
- `backend/src/api/health/route.ts` - Backend health monitoring
- `frontend/src/pages/api/health.ts` - Frontend health monitoring

### 4. **Deployment Scripts**
- `npm run start:railway` - Auto-migrate and start
- `npm run railway:migrate` - Manual migrations
- `npm run railway:setup` - Initial setup with seed data

### 5. **Environment Templates**
- `backend/.env.railway` - All required backend variables
- `frontend/.env.railway` - All required frontend variables

### 6. **Next.js Optimizations**
- Standalone output enabled in `next.config.js`
- Optimized for production deployment

---

**Your application is now fully optimized for Railway deployment!** 🚀

Start with Step 1 and follow the guide sequentially. Each step builds on the previous one.

Good luck with your production deployment! 🎉
