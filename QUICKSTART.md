# Quick Start - 6 Steps to Launch

Get your clothing store running in under 5 minutes with complete automation.

## Prerequisites

- **Docker Desktop** installed and running

That's it! Docker includes everything you need - Node.js, npm, databases, etc. are all containerized.

---

## Setup (6 Steps)

### Step 1: Configure Environment

For custom ports, domains, or credentials:

```bash
cp .env.example .env
# Edit .env with your values
```

Skip this step to use defaults (localhost, ports 9000/3000, etc.)

---

### Step 2: Start Docker Containers

**Windows (PowerShell/CMD):**
```powershell
cd "C:\path\to\E-Commerce Site"
docker compose up -d
```

**Mac/Linux:**
```bash
cd "/path/to/E-Commerce Site"
docker compose up -d
```

*Note: If `docker compose` doesn't work, try `docker-compose` (older syntax)*

Wait ~60 seconds for health checks (first time: 5-10 minutes)

---

### Step 3: Run Complete Setup

**Optional**: To use custom admin credentials, set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env` before this step.

```bash
docker exec clothing-store-backend npm run full-setup
```

This single command automatically:
- Runs database migrations
- Creates admin user (default: admin@test.com / supersecret)
- Creates sales channel
- Creates US region (USD)
- Creates and links API key
- Creates 6 sample products with prices

**Copy the API key and Region ID shown in the output!** You'll need them for the next step.

---

### Step 4: Update Environment with API Keys

Edit `.env` file and add the keys from Step 3:

```bash
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_your_actual_key
NEXT_PUBLIC_MEDUSA_REGION_ID=reg_your_actual_id
```

---

### Step 5: Restart All Services

```bash
docker compose restart
```

This restarts all containers to pick up the new environment variables.

**If the frontend doesn't show products after restart, rebuild:**
```bash
docker compose down
docker compose up -d --build
```

---

### Step 6: Open Your Store

**Storefront:** http://localhost:3000  
**Admin Panel:** http://localhost:9000/app
- Email: `admin@test.com`
- Password: `supersecret`

---

## Enable Payments (Stripe)

To accept payments, set up Stripe:

### 1. Get Stripe API Key

- Create [Stripe account](https://stripe.com/)
- Get **Secret key** from [API keys](https://dashboard.stripe.com/apikeys)

### 2. Configure Environment

Add to `.env` or `docker-compose.yml`:
```bash
STRIPE_API_KEY=sk_test_51...
```

### 3. Enable in Admin

1. Open Admin: http://localhost:9000/app
2. Go to **Settings > Regions**
3. Edit your region
4. Add **Stripe (STRIPE)** to Payment Providers
5. Save

### 4. Test Checkout

Use test card: `4242 4242 4242 4242`

---

## Enable Emails (SendGrid)

To send order confirmations and notifications:

### 1. Get SendGrid API Key

- Create [SendGrid account](https://signup.sendgrid.com/)
- Get API key from [API Keys](https://app.sendgrid.com/settings/api_keys)

### 2. Configure Environment

Add to `.env` or `docker-compose.yml`:
```bash
SENDGRID_API_KEY=SG.YourApiKeyHere
SENDGRID_FROM_EMAIL=noreply@yourstore.com
```

### 3. Verify Sender

In SendGrid Dashboard > Settings > Sender Authentication, verify your email.

### 4. Test

SendGrid sends emails automatically for orders, shipping, etc.

---

## Common Commands

```bash
# View logs
docker compose logs -f

# Restart everything
docker compose restart

# Stop everything
docker compose down

# Complete reset (deletes all data)
docker compose down -v
```

---

## Troubleshooting

**Products not showing?**
```bash
docker compose restart frontend
```

**Backend not starting?**
```bash
docker compose logs backend --tail 50
```

**Fresh start:**
```bash
docker compose down -v
docker compose up -d
# Wait 60 seconds, then repeat steps 2-3
```

---

## Manage Products

Your store comes with 6 sample products. To add your own:

1. **Open Admin:** http://localhost:9000/app
2. **Login:** admin@test.com / supersecret
3. **Go to Products** → Click "Create"
4. **Add details:** Title, description, images, variants, prices
5. **Publish:** Set status to "Published"

**Edit existing products:** Click any product → Use ⋮ menu to edit, add images, manage variants.

**Organize:** Create collections and categories under Products menu.

---

For detailed documentation, see [README.md](./README.md)
