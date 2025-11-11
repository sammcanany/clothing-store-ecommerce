# Cost Optimization Guide

This guide shows you how to deploy your e-commerce store for **minimum cost** while maintaining production quality and security.

## 📊 Cost Comparison Summary

| Strategy | Monthly Cost | Traffic Limit | Best For |
|----------|-------------|---------------|----------|
| **Option 1: Vercel + Railway** | $0-20 | ~50k visitors/month | **Recommended for most** |
| **Option 2: Full Free Tier** | $0 (with limits) | ~10k visitors/month | Testing, low traffic |
| **Option 3: Railway Only** | $15-30 | ~100k visitors/month | Simplicity |
| **Option 4: VPS Self-Hosted** | $6-12 | Unlimited* | Advanced users |

---

## 🏆 Option 1: Vercel (Frontend) + Railway (Backend) - **$0-20/month** ⭐ RECOMMENDED

This is the **sweet spot** for cost vs. performance.

### Architecture:
```
Frontend (Next.js) → Vercel (FREE)
Backend (Medusa)   → Railway ($15-20/month)
PostgreSQL         → Railway ($0 - included in $5 credit)
Redis             → Railway ($0 - included in $5 credit)
```

### Cost Breakdown:
- **Frontend**: $0/month (Vercel hobby tier)
- **Backend**: $10-15/month (with $5 credit = $5-10 net)
- **PostgreSQL**: Included in Railway usage
- **Redis**: Included in Railway usage
- **Total**: **$5-10/month** (or $0 for first few months with credits)

### What You Get:
- ✅ **Vercel Free Tier**:
  - 100GB bandwidth/month
  - Unlimited sites
  - Global CDN (super fast!)
  - Automatic HTTPS
  - Preview deployments for PRs
  - Zero cold starts

- ✅ **Railway $5 Credit/month**:
  - Can run small workload FREE
  - PostgreSQL with backups
  - Redis included
  - Easy scaling when needed

### Limitations:
- Frontend: 100GB bandwidth/month (usually enough for ~50k visitors)
- Backend: Must fit within $5 credit initially (~100 hours uptime)

### Deployment Steps:

#### 1. Deploy Frontend to Vercel (5 minutes)

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy from frontend directory
cd frontend
vercel

# Follow prompts:
# - Link to GitHub? Yes
# - Root directory: frontend
# - Build settings: Auto-detected ✓
```

**Or use Vercel Dashboard:**
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Set root directory: `frontend`
4. Add environment variables from `frontend/.env.vercel`
5. Click Deploy

**Add Environment Variables in Vercel:**
- Go to Settings → Environment Variables
- Add each variable from `frontend/.env.vercel`
- Use your Railway backend URL for `NEXT_PUBLIC_MEDUSA_BACKEND_URL`

#### 2. Deploy Backend to Railway (10 minutes)

Follow the Railway deployment guide (`RAILWAY_DEPLOYMENT.md`) but **skip frontend** since it's on Vercel.

**Key changes:**
- Deploy only: PostgreSQL + Redis + Backend
- In backend CORS settings, use your Vercel URL:
  ```bash
  STORE_CORS=https://yourstore.vercel.app
  AUTH_CORS=https://yourstore.vercel.app,https://your-backend.railway.app
  ```

#### 3. Cost Optimization Tips:

**Reduce Railway costs:**
```bash
# Set resource limits in backend/railway.json (already done!)
"resources": {
  "memory": "512Mi",  # Enough for Medusa
  "cpu": "0.5"        # Half vCPU
}
```

**Monitor usage:**
- Railway Dashboard → Usage
- Stay within $5 credit for free operation
- Upgrade only when traffic increases

### Total Setup Time: **15 minutes**

### When to Upgrade:
- Vercel: When you exceed 100GB bandwidth (~50k visitors)
- Railway: When you exceed $5/month usage (~30k API requests/day)

---

## 🆓 Option 2: Full Free Tier - **$0/month** (with limitations)

For **testing, staging, or very low traffic** sites.

### Architecture:
```
Frontend (Next.js) → Vercel (FREE)
Backend (Medusa)   → Render (FREE)
PostgreSQL         → Supabase (FREE) or Render (FREE for 90 days)
Redis             → Upstash (FREE)
```

### Cost Breakdown:
- **Frontend**: $0 (Vercel hobby)
- **Backend**: $0 (Render free tier)
- **Database**: $0 (Supabase free tier: 500MB, unlimited API requests)
- **Redis**: $0 (Upstash free tier: 10k commands/day)
- **Total**: **$0/month** 🎉

### What You Get:
- ✅ Vercel: Same as Option 1
- ✅ Render Free Tier:
  - 750 hours/month uptime
  - **Sleeps after 15 min inactivity** ⚠️
  - Slow cold starts (30-60 seconds)
  - Auto-wakes on request
- ✅ Supabase PostgreSQL:
  - 500MB storage
  - Unlimited API requests
  - Auto-backups
  - Pauses after 7 days inactivity
- ✅ Upstash Redis:
  - 10,000 commands/day
  - 256MB storage
  - No connection limit

### Limitations:
- ⚠️ **Cold starts**: Backend sleeps, first request takes 30-60s to wake
- ⚠️ **Storage**: 500MB database (fine for <1000 products)
- ⚠️ **Redis commands**: 10k/day (enough for ~500 visitors/day)
- ⚠️ **Not suitable for production** with real traffic

### Deployment Steps:

#### 1. Create Supabase Database (5 minutes)

1. Go to [supabase.com](https://supabase.com)
2. Create account (free)
3. Create new project
4. Copy connection string:
   - Settings → Database → Connection String → URI
   - Format: `postgresql://postgres:[password]@[host]:5432/postgres`

#### 2. Create Upstash Redis (3 minutes)

1. Go to [upstash.com](https://upstash.com)
2. Create account (free)
3. Create Redis database
4. Copy `REDIS_URL` (format: `rediss://...`)

#### 3. Deploy Backend to Render (10 minutes)

**Option A: Using render.yaml (One-Click)**
1. Go to [render.com/new](https://render.com/new)
2. Connect GitHub repository
3. Render will detect `render.yaml`
4. Click "Apply"
5. Add environment variables manually (from `backend/.env.render`)

**Option B: Manual Setup**
1. Go to Render Dashboard → New → Web Service
2. Connect repository
3. Settings:
   - Name: `clothing-store-backend`
   - Root Directory: `backend`
   - Environment: `Docker`
   - Dockerfile Path: `backend/Dockerfile.railway`
   - Instance Type: **Free**
4. Add environment variables from `backend/.env.render`
5. Deploy

#### 4. Deploy Frontend to Vercel (same as Option 1)

#### 5. Update CORS Settings

Update backend environment variables with your Vercel URL:
```bash
STORE_CORS=https://yourstore.vercel.app
AUTH_CORS=https://yourstore.vercel.app,https://your-backend.onrender.com
```

### Total Setup Time: **20 minutes**

### When to Upgrade:
- When you get real users (cold starts are bad UX)
- When you exceed free tier limits
- When you need better uptime guarantees

---

## 🚂 Option 3: Railway Only (Optimized) - **$15-30/month**

Deploy everything on Railway with optimized resources.

### Cost Breakdown (Optimized):
- **Frontend**: $3-5/month (256MB RAM, 0.25 vCPU)
- **Backend**: $8-12/month (512MB RAM, 0.5 vCPU)
- **PostgreSQL**: $2-5/month (shared)
- **Redis**: $2-5/month (shared)
- **$5 Credit**: -$5/month
- **Total**: **$10-22/month net**

### Optimizations Applied:
```json
// backend/railway.json (already updated)
"resources": {
  "memory": "512Mi",  // Minimal for Medusa
  "cpu": "0.5"        // Half vCPU
}

// frontend/railway.json (already updated)
"resources": {
  "memory": "256Mi",  // Minimal for Next.js
  "cpu": "0.25"       // Quarter vCPU
}
```

### Additional Cost Reduction Tips:

1. **Use shared databases** (cheaper than dedicated):
   - Railway → Add PostgreSQL → Select "Shared"
   - Railway → Add Redis → Select "Shared"

2. **Monitor resource usage**:
   - Railway Dashboard → Metrics
   - Adjust memory/CPU if under-utilized

3. **Enable sleep mode for development** (production should NOT sleep):
   ```json
   "sleepApplication": true  // Only for dev/staging
   ```

4. **Optimize images**:
   - Use multi-stage builds (✓ already done)
   - Minimize Docker layers

### When to Use:
- You want everything in one platform
- You value simplicity over saving $10-15/month
- You plan to scale later (Railway scales easily)

---

## 💻 Option 4: VPS Self-Hosted - **$6-12/month**

For advanced users comfortable with DevOps.

### Providers:
| Provider | Cost | RAM | CPU | Storage | Bandwidth |
|----------|------|-----|-----|---------|-----------|
| **Hetzner Cloud** | €4.15/mo | 2GB | 1 vCPU | 20GB | 20TB |
| **DigitalOcean** | $6/mo | 1GB | 1 vCPU | 25GB | 1TB |
| **Vultr** | $6/mo | 1GB | 1 vCPU | 25GB | 1TB |
| **Linode/Akamai** | $5/mo | 1GB | 1 vCPU | 25GB | 1TB |

### What You Need to Manage:
- ⚠️ Server setup and hardening
- ⚠️ PostgreSQL installation and backups
- ⚠️ Redis installation
- ⚠️ Nginx/Caddy reverse proxy
- ⚠️ SSL certificates (Let's Encrypt)
- ⚠️ Monitoring and logging
- ⚠️ Security updates
- ⚠️ Firewall configuration
- ⚠️ Server restarts after crashes

### Pros:
- ✅ Lowest cost for unlimited traffic
- ✅ Full control
- ✅ Root access
- ✅ Can run other services

### Cons:
- ❌ Requires DevOps knowledge
- ❌ Time-consuming setup (4-8 hours)
- ❌ Ongoing maintenance
- ❌ No automatic scaling
- ❌ You're responsible for uptime
- ❌ Single point of failure

### When to Use:
- You're experienced with Linux server administration
- You have time for maintenance
- You want to learn DevOps
- You run multiple services on same server

### Quick Setup (if you choose this):

```bash
# On a fresh Ubuntu 22.04 server
# 1. Install Docker
curl -fsSL https://get.docker.com | sh

# 2. Clone your repository
git clone https://github.com/yourusername/clothing-store-ecommerce
cd clothing-store-ecommerce

# 3. Copy environment files
cp .env.example .env
# Edit .env with your credentials

# 4. Start with Docker Compose
docker-compose up -d

# 5. Set up Nginx reverse proxy
sudo apt install nginx certbot python3-certbot-nginx
# Configure Nginx for your domain
# Get SSL certificate with certbot
```

**Not recommended unless you know what you're doing!**

---

## 🎯 Recommendations by Use Case

### Just Starting / Testing:
→ **Option 2: Full Free Tier** ($0/month)
- No credit card required
- Test everything risk-free
- Upgrade later when ready

### Small Store (<1000 orders/month):
→ **Option 1: Vercel + Railway** ($5-10/month)
- Best performance for the price
- Professional setup
- Easy to scale
- Fast frontend (Vercel CDN)
- Reliable backend (Railway)

### Medium Store (1000-10k orders/month):
→ **Option 1 or 3** ($10-30/month)
- Upgrade Railway resources as needed
- Still cheaper than alternatives

### Large Store (>10k orders/month):
→ **Upgrade to paid tiers** ($50-200/month)
- Railway Pro plan
- Vercel Pro ($20/month)
- Dedicated databases
- Or migrate to AWS/GCP

### Learning / Side Project:
→ **Option 2: Full Free Tier**
- Learn without spending
- Upgrade when profitable

---

## 💡 Cost-Saving Tips

### 1. **Use CDN for Images**
- Store product images on Cloudflare R2 (free 10GB)
- Or use Cloudinary (free 25GB)
- Don't store images in database

### 2. **Optimize Frontend Bundle**
```bash
# In frontend directory
npm run build
# Check bundle size
npx @next/bundle-analyzer
```

### 3. **Enable Caching**
Your app already has Redis caching - make sure it's configured:
```typescript
// Already implemented in your SecurityConfig
// Redis will reduce database queries
```

### 4. **Monitor Costs**
- Railway: Dashboard → Usage → Set budget alerts
- Vercel: Dashboard → Settings → Emails → Enable usage alerts
- Set alert at 80% of your budget

### 5. **Use Staging Environment on Free Tier**
- Production: Vercel + Railway ($5-10/month)
- Staging: Render + Supabase (free)
- Save money on test environment

### 6. **Optimize Database**
```sql
-- Add indexes for common queries (do this after deployment)
CREATE INDEX idx_products_handle ON product(handle);
CREATE INDEX idx_orders_customer_id ON "order"(customer_id);
```

### 7. **Reduce API Calls**
```typescript
// Use React Query caching (already implemented)
// Frontend will make fewer backend requests
staleTime: 5 * 60 * 1000, // 5 minutes
```

---

## 📈 Scaling Plan

### Traffic Growth Strategy:

**0-100 visitors/day**: Option 2 (Free) - $0/month
→ Test and validate product-market fit

**100-1000 visitors/day**: Option 1 (Vercel + Railway) - $5-10/month
→ Production-ready, fast performance

**1000-5000 visitors/day**: Upgrade Railway - $20-40/month
→ Increase memory to 1GB, CPU to 1 vCPU

**5000-20k visitors/day**: Vercel Pro + Railway - $50-100/month
→ Upgrade Vercel for analytics, better support
→ Railway: 2GB RAM, 2 vCPU

**>20k visitors/day**: Consider migration - $200-500/month
→ AWS/GCP with load balancing
→ Dedicated databases
→ CDN for all static assets
→ Redis cluster

---

## 🎬 Quick Start: Recommended Setup

For most users, I recommend **Option 1: Vercel + Railway**.

### Step-by-Step (30 minutes total):

1. **Deploy Frontend to Vercel** (5 min)
   ```bash
   cd frontend
   npx vercel --prod
   ```

2. **Deploy Backend to Railway** (15 min)
   - Follow `RAILWAY_DEPLOYMENT.md`
   - Skip frontend service
   - Add PostgreSQL + Redis + Backend only

3. **Configure environment variables** (5 min)
   - Vercel: Add variables from `frontend/.env.vercel`
   - Railway: Add variables from `backend/.env.railway`

4. **Update CORS** (2 min)
   - Set `STORE_CORS` to your Vercel URL
   - Redeploy backend

5. **Test** (3 min)
   - Visit your Vercel URL
   - Check backend health: `your-backend.railway.app/health`
   - Test a purchase

**Total cost: $5-10/month**
**Total time: 30 minutes**

---

## 📊 Cost Calculator

Estimate your monthly cost:

```
Frontend (Vercel):
- Free tier: $0 (up to 100GB bandwidth)
- Pro tier: $20/month (1TB bandwidth)

Backend (Railway):
- Free credit: $5/month included
- Basic: $10-15/month (512MB RAM, 0.5 vCPU)
- Medium: $20-30/month (1GB RAM, 1 vCPU)
- Large: $40-60/month (2GB RAM, 2 vCPU)

Database (Railway PostgreSQL):
- Shared: Included in backend usage
- Dedicated: +$10-20/month

Redis (Railway):
- Shared: Included in backend usage
- Dedicated: +$5-10/month

Expected cost per traffic level:
- 0-5k visitors/month: $0-5/month
- 5k-50k visitors/month: $5-15/month
- 50k-100k visitors/month: $15-30/month
- 100k-500k visitors/month: $30-100/month
- 500k+ visitors/month: $100-500/month
```

---

## ✅ Summary

| Priority | Choose | Cost | Why |
|----------|--------|------|-----|
| **Cheapest** | Option 2 (Free Tier) | $0 | Testing only |
| **Best Value** | Option 1 (Vercel + Railway) | $5-10 | **Recommended** |
| **Simplest** | Option 3 (Railway Only) | $10-20 | All in one place |
| **Most Control** | Option 4 (VPS) | $6-12 | For experts only |

**My recommendation for you: Start with Option 1 (Vercel + Railway).**

You'll get:
- Professional infrastructure
- Fast performance
- Easy scaling
- ~$5-10/month cost (may be $0 with credits)
- 30 minutes setup time

When your store grows and makes money, upgrading is easy!

---

## 🚀 Ready to Deploy?

1. Choose your strategy above
2. Follow the deployment steps
3. Monitor costs in dashboards
4. Scale up as you grow

Need help? Check:
- `RAILWAY_DEPLOYMENT.md` - Full Railway guide
- Frontend deployment: Use `frontend/.env.vercel`
- Backend deployment: Use `backend/.env.railway` or `.env.render`

Good luck with your cost-optimized deployment! 💰
