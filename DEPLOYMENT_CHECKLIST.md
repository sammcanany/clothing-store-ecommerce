# Vercel + Railway Deployment Checklist

## ✅ Before You Start

### Required Accounts (Free to Create):
- [ ] **GitHub account** (you already have this ✓)
- [ ] **Vercel account** - Sign up at [vercel.com](https://vercel.com) with GitHub
- [ ] **Railway account** - Sign up at [railway.app](https://railway.app) with GitHub

### Required API Keys & Credentials:
- [ ] **Stripe API keys**
  - [ ] Secret key (sk_live_... or sk_test_...)
  - [ ] Publishable key (pk_live_... or pk_test_...)
  - Get from: [dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys)

- [ ] **USPS API credentials**
  - [ ] Client ID
  - [ ] Client Secret
  - Get from: [developer.usps.com](https://developer.usps.com)

- [ ] **Admin credentials** (choose secure passwords)
  - [ ] Admin email address
  - [ ] Admin password (strong password)

- [ ] **Security secrets** (we'll generate these together)
  - [ ] JWT_SECRET (32+ characters)
  - [ ] COOKIE_SECRET (32+ characters)

- [ ] **Warehouse shipping address**
  - [ ] Street address
  - [ ] City
  - [ ] State
  - [ ] ZIP code

### Optional (Can Add Later):
- [ ] **SendGrid API key** - For transactional emails
- [ ] **Custom domain** - For branded URLs

---

## 🚀 Deployment Steps

### Step 1: Generate Security Secrets (5 minutes)

Run these commands locally to generate secure secrets:

```bash
# Generate JWT_SECRET
openssl rand -base64 32

# Generate COOKIE_SECRET
openssl rand -base64 32
```

**Save these values!** You'll need them for Railway configuration.

---

### Step 2: Deploy Backend to Railway (15 minutes)

#### 2.1 Create Railway Account
1. Go to [railway.app](https://railway.app)
2. Click "Login" → Sign in with GitHub
3. Authorize Railway to access your repositories

#### 2.2 Create New Project
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Select: `sammcanany/clothing-store-ecommerce`
4. Railway will analyze your repository

#### 2.3 Add PostgreSQL Database
1. In your project, click "+ New"
2. Select "Database" → "PostgreSQL"
3. Railway automatically provisions it
4. **Note**: Railway will provide `DATABASE_URL` automatically

#### 2.4 Add Redis Cache
1. Click "+ New" again
2. Select "Database" → "Redis"
3. Railway automatically provisions it
4. **Note**: Railway will provide `REDIS_URL` automatically

#### 2.5 Deploy Backend Service
1. Click "+ New" → "GitHub Repo"
2. Select your repository again
3. Click "Add variables" → Set **Root Directory**: `backend`
4. Railway will detect `backend/railway.json` and use optimized settings

#### 2.6 Configure Backend Environment Variables

Click on backend service → "Variables" tab → "Raw Editor" → Paste:

```bash
# Database & Cache (Reference from Railway services)
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}

# Security Secrets (Use the ones you generated above!)
JWT_SECRET=<paste-your-generated-jwt-secret>
COOKIE_SECRET=<paste-your-generated-cookie-secret>

# Admin Credentials
ADMIN_EMAIL=admin@yourstore.com
ADMIN_PASSWORD=<your-secure-password>

# CORS (We'll update this after Vercel deployment)
STORE_CORS=http://localhost:3000
ADMIN_CORS=${{RAILWAY_PUBLIC_DOMAIN}}
AUTH_CORS=http://localhost:3000,${{RAILWAY_PUBLIC_DOMAIN}}

# Stripe
STRIPE_API_KEY=<your-stripe-secret-key>

# USPS Shipping
USPS_CLIENT_ID=<your-usps-client-id>
USPS_CLIENT_SECRET=<your-usps-client-secret>
USPS_ENVIRONMENT=production

# Warehouse Address
WAREHOUSE_ADDRESS=123 Main St
WAREHOUSE_CITY=San Francisco
WAREHOUSE_STATE=CA
WAREHOUSE_ZIP=94105
WAREHOUSE_COUNTRY=US

# Environment
NODE_ENV=production
MEDUSA_DISABLE_TELEMETRY=true
```

**Important**: Replace all `<placeholders>` with your actual values!

#### 2.7 Deploy Backend
1. Click "Deploy"
2. Wait for deployment (5-10 minutes)
3. Watch the logs for any errors
4. Once deployed, copy your backend URL:
   - Click on backend service → "Settings" tab
   - Copy the "Public Domain" (e.g., `https://backend-production-xxxx.up.railway.app`)

**✅ Backend is now live!**

---

### Step 3: Deploy Frontend to Vercel (10 minutes)

#### 3.1 Create Vercel Account
1. Go to [vercel.com](https://vercel.com)
2. Click "Sign Up" → Continue with GitHub
3. Authorize Vercel to access your repositories

#### 3.2 Import Project
1. Click "Add New..." → "Project"
2. Import `sammcanany/clothing-store-ecommerce`
3. Configure project:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `.next` (auto-detected)

#### 3.3 Configure Frontend Environment Variables

Before clicking "Deploy", add these environment variables:

```bash
# Backend URL (use your Railway backend URL from Step 2.7)
NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://your-backend.railway.app

# Frontend URL (use Vercel's assigned URL - we'll update this after)
NEXT_PUBLIC_BASE_URL=https://your-project.vercel.app

# These we'll add after initial setup
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=placeholder
NEXT_PUBLIC_MEDUSA_REGION_ID=placeholder

# Stripe Public Key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=<your-stripe-publishable-key>

# Environment
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
```

#### 3.4 Deploy Frontend
1. Click "Deploy"
2. Wait for build (3-5 minutes)
3. Once deployed, Vercel will show your live URL
4. **Copy this URL** - you'll need it for the next step

**✅ Frontend is now live!**

---

### Step 4: Update CORS Configuration (5 minutes)

Now that both services are deployed, update backend CORS to allow frontend access:

#### 4.1 Update Backend Environment Variables in Railway
1. Go to Railway → Your Backend Service → "Variables"
2. Update these three variables with your actual Vercel URL:

```bash
STORE_CORS=https://your-actual-project.vercel.app
AUTH_CORS=https://your-actual-project.vercel.app,${{RAILWAY_PUBLIC_DOMAIN}}
ADMIN_CORS=${{RAILWAY_PUBLIC_DOMAIN}}
```

3. Click "Save Changes"
4. Backend will automatically redeploy with new CORS settings

---

### Step 5: Initial Database Setup (10 minutes)

#### 5.1 Wait for Backend to Restart
After updating CORS, wait for backend to redeploy (~2 minutes)

#### 5.2 Check Backend Health
Visit: `https://your-backend.railway.app/health`

You should see:
```json
{
  "status": "ok",
  "service": "clothing-store-backend",
  "timestamp": "...",
  "uptime": ...
}
```

#### 5.3 Access Medusa Admin
1. Go to: `https://your-backend.railway.app/app`
2. Login with your `ADMIN_EMAIL` and `ADMIN_PASSWORD`
3. You should see the Medusa admin dashboard

#### 5.4 Get API Credentials

**Get Publishable Key:**
1. In Medusa admin → Settings → Publishable API Keys
2. Click on the default key or create a new one
3. Copy the key (starts with `pk_`)

**Get Region ID:**
1. In Medusa admin → Settings → Regions
2. You should see a default region (or create one)
3. Copy the region ID (starts with `reg_`)

#### 5.5 Update Frontend Environment Variables in Vercel
1. Go to Vercel → Your Project → Settings → Environment Variables
2. Update these two variables:

```bash
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_actual_key_from_step_5.4
NEXT_PUBLIC_MEDUSA_REGION_ID=reg_actual_region_from_step_5.4
```

3. Also update `NEXT_PUBLIC_BASE_URL` with your actual Vercel URL if you haven't already

4. Go to "Deployments" tab → Click "..." on latest deployment → "Redeploy"

---

### Step 6: Testing (5 minutes)

#### 6.1 Test Backend API
```bash
# Check health
curl https://your-backend.railway.app/health

# Check store endpoint
curl https://your-backend.railway.app/store/products
```

#### 6.2 Test Frontend
1. Visit your Vercel URL: `https://your-project.vercel.app`
2. Browse products
3. Add item to cart
4. Proceed to checkout (test with Stripe test card)

**Stripe Test Card:**
- Card: 4242 4242 4242 4242
- Expiry: Any future date
- CVC: Any 3 digits
- ZIP: Any 5 digits

#### 6.3 Verify Everything Works
- [ ] Frontend loads without errors
- [ ] Products display correctly
- [ ] Can add items to cart
- [ ] Can view cart
- [ ] Checkout page loads
- [ ] Stripe payment form appears
- [ ] Can complete test purchase

---

## 🎉 Deployment Complete!

### Your Live URLs:
- **Frontend (Store)**: `https://your-project.vercel.app`
- **Backend (API)**: `https://your-backend.railway.app`
- **Admin Dashboard**: `https://your-backend.railway.app/app`

### Your Costs:
- **Frontend (Vercel)**: $0/month (free tier)
- **Backend (Railway)**: ~$5-10/month (may be $0 with $5 credit)
- **Total**: **$0-10/month**

---

## 📊 Monitoring & Maintenance

### Check Costs:
- **Railway**: Dashboard → Usage tab (set budget alerts at $10)
- **Vercel**: Dashboard → Usage section

### Monitor Uptime:
- Railway: Built-in metrics in service dashboard
- Health check: `https://your-backend.railway.app/health`

### View Logs:
- Railway: Service → "Logs" tab
- Vercel: Project → "Logs" tab

### Update Environment Variables:
- Railway: Service → "Variables" tab → Edit → Redeploy
- Vercel: Settings → Environment Variables → Edit → Redeploy

---

## 🚨 Troubleshooting

### Frontend shows "Failed to fetch"
→ Check CORS settings in Railway backend
→ Verify `STORE_CORS` includes your exact Vercel URL

### Backend won't start
→ Check logs in Railway dashboard
→ Verify all required environment variables are set
→ Ensure JWT_SECRET and COOKIE_SECRET are 32+ characters

### "Payment failed" errors
→ Check Stripe API keys are correct
→ Ensure you're using test keys for testing
→ Verify Stripe webhook is configured (if needed)

### Database connection errors
→ Verify `DATABASE_URL` is correctly referenced: `${{Postgres.DATABASE_URL}}`
→ Check PostgreSQL service is running in Railway

### Health check fails
→ Wait a few minutes for backend to fully start
→ Check Railway logs for startup errors
→ Verify migrations completed successfully

---

## 🔒 Security Reminders

- [ ] Use strong, unique passwords for admin
- [ ] Keep JWT_SECRET and COOKIE_SECRET private
- [ ] Use live Stripe keys only when ready for production
- [ ] Never commit API keys to git
- [ ] Enable 2FA on Vercel and Railway accounts

---

## 📈 Next Steps

### After Successful Deployment:

1. **Add Products**
   - Go to Admin → Products
   - Add your product catalog
   - Upload product images

2. **Configure Shipping**
   - Set up shipping profiles
   - Test USPS rate calculation
   - Configure warehouse address

3. **Set Up Stripe Webhooks** (for order notifications)
   - Stripe Dashboard → Webhooks
   - Add endpoint: `https://your-backend.railway.app/stripe/webhooks`
   - Subscribe to: `payment_intent.succeeded`, `charge.succeeded`

4. **Add Custom Domain** (Optional)
   - Vercel: Settings → Domains → Add custom domain
   - Railway: Settings → Domains → Add custom domain
   - Update CORS settings after adding domains

5. **Set Up Email Notifications**
   - Create SendGrid account
   - Get API key
   - Add to Railway environment variables
   - Test order confirmation emails

6. **Enable Monitoring**
   - Set up UptimeRobot for health checks
   - Configure Railway budget alerts
   - Set up error tracking (Sentry)

---

## 💰 Cost Scaling

As your traffic grows:

**0-5k visitors/month**: $0-5/month (current setup)
**5k-50k visitors/month**: $5-15/month (no changes needed)
**50k-100k visitors/month**: $15-30/month (upgrade Railway resources)

To upgrade Railway resources later:
1. Service → Settings → Resources
2. Increase memory/CPU as needed
3. Railway will adjust billing automatically

---

## 📚 Additional Resources

- Railway deployment guide: `RAILWAY_DEPLOYMENT.md`
- Security configuration: `SECURITY_MODES.md`
- Production readiness review: `PRODUCTION_READINESS_REVIEW.md`
- Cost optimization: `COST_OPTIMIZATION.md`

---

**You're ready to deploy! Follow the steps above in order, and you'll be live in ~30-45 minutes.**

Good luck! 🚀
