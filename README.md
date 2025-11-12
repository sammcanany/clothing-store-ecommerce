# Clothing Store - E-Commerce Platform

A modern, fully automated e-commerce platform built with Next.js and Medusa 2.11.1. Complete setup in 4 simple commands!

## Tech Stack

- **Frontend**: Next.js 14, React 18, Tailwind CSS (Node.js 22)
- **Backend**: Medusa v2.11.1 (headless commerce, Node.js 22)
- **Database**: PostgreSQL 15
- **Cache**: Redis 7
- **Containerization**: Docker & Docker Compose

## Features

- Clean, responsive UI optimized for clothing retail
- Full shopping cart and checkout functionality
- Fully automated setup with one script
- Complete Docker containerization
- Admin panel for store management
- Real-time pricing with tax calculation
- Product images from Unsplash
- Mobile-responsive design
- **Authentication**: Email/password and Google OAuth sign-in
- **Account Management**: Orders history and profile pages

## Prerequisites

- **Docker Desktop** installed and running
  - Windows: [Download here](https://docs.docker.com/desktop/install/windows-install/) (Windows 10 64-bit or later, WSL 2 enabled)
  - macOS: [Download here](https://docs.docker.com/desktop/install/mac-install/) (macOS 11 or newer)

Verify installation:
```bash
docker --version
docker compose version
# If docker compose doesn't work, try: docker-compose --version
```

## Quick Start (6 Steps)

### 1. Configure Environment (REQUIRED)

**š ï¸ IMPORTANT: Do this BEFORE starting Docker containers!**

Copy the environment template and configure your settings:

```bash
cp .env.example .env
```

**Edit the `.env` file and set these REQUIRED variables:**

```bash
# REQUIRED: Your warehouse/shipping location
WAREHOUSE_ADDRESS=123 Main St
WAREHOUSE_CITY=Overland Park
WAREHOUSE_STATE=KS
WAREHOUSE_ZIP=66217
WAREHOUSE_COUNTRY=US

# REQUIRED for USPS shipping (if using USPS integration)
USPS_CLIENT_ID=your_usps_client_id_here
USPS_CLIENT_SECRET=your_usps_client_secret_here
USPS_ENVIRONMENT=testing

# Optional: Stripe keys for payment processing
STRIPE_API_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

**Why this is required:**
- The setup script creates a stock location using your warehouse address
- USPS shipping rates are calculated from this origin location
- If you skip this, default values (Overland Park, KS) will be used

### 2. Start Docker Containers

```bash
cd "E-Commerce Site"
docker compose up -d
```

Wait ~60 seconds for health checks. This starts all services:
- PostgreSQL database (port 5432)
- Redis cache (port 6379)  
- Medusa backend (port 9000)
- Next.js frontend (port 3000)

**Note**: First startup takes 5-10 minutes to download images and install dependencies.

### 3. Run Complete Setup

```bash
docker exec clothing-store-backend npm run full-setup
```

This single command automatically:
- Runs database migrations
- Creates admin user (default: admin@test.com / supersecret)
- Creates sales channel
- Creates US region with USD currency
- Creates and links publishable API key
- Creates 6 sample products with prices
- Creates 3 product collections (T-Shirts, Jeans, Hoodies)
- Assigns products to collections automatically
- Links products to sales channel

**Copy the API key, Region ID, and Sales Channel ID shown in the output!** You'll need them for the next step.

**Optional**: To use custom admin credentials, set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in your `.env` file before running this step.

### 4. Update Environment with API Keys

Edit your `.env` file (or `docker-compose.yml` if not using .env) and add the values from Step 3:

```bash
# In .env file:
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_your_actual_key_from_setup
NEXT_PUBLIC_MEDUSA_REGION_ID=reg_your_actual_id_from_setup
NEXT_PUBLIC_MEDUSA_SALES_CHANNEL_ID=sc_your_actual_id_from_setup
```

### 5. Restart All Services

**Recommended (most reliable):**
```bash
docker compose down
docker compose up -d
```

**Alternative (quick restart):**
```bash
docker compose restart
```

**Note**: Full restart is more reliable for picking up environment variable changes.

### 6. Access Your Store

- **Storefront**: http://localhost:3000
- **Admin Panel**: http://localhost:9000/app
  - Email: `admin@test.com`
  - Password: `supersecret`

## Package Updates

The project uses stable, tested package versions. To check for updates:

```bash
# Backend updates
cd backend && npm outdated

# Frontend updates
cd frontend && npm outdated
```

### Safe Updates (Recommended)
```bash
# Update patch/minor versions only
cd backend && npm update
cd frontend && npm update
```

### Major Version Updates (Advanced)
š ï¸ **Test thoroughly before deploying** - Major updates may have breaking changes:

- **Next.js 15**: Significant performance improvements but API changes
- **React 19**: New features but potential compatibility issues
- **TanStack Query 5**: Simplified API but migration needed

**To apply package updates:**
```bash
# Rebuild with updated packages
docker compose down
docker compose up -d --build

# If build fails with npm errors, clean and retry
docker system prune -f
docker compose build --no-cache backend
docker compose up -d
```

## Sample Products

The setup creates 6 ready-to-sell products:
- Classic White T-Shirt ($29.99)
- Slim Fit Jeans ($59.99)
- Leather Jacket ($199.99)
- Running Shoes ($89.99)
- Cotton Hoodie ($49.99)
- Denim Jacket ($79.99)

## Product Management (Admin Panel)

Once your store is running, use the admin panel to manage your products. Access it at: http://localhost:9000/app

### Add New Products

1. **Login** with `admin@test.com` / `supersecret`
2. **Go to Products** in the sidebar
3. **Click "Create"** in the top right
4. **Fill in product details:**
   - Title, subtitle, description
   - Handle (URL slug)
   - Material, weight, dimensions
   - Status (Published/Draft)
5. **Add media:** Upload product images
6. **Set thumbnail:** Choose main product image
7. **Add variants:** Different sizes, colors, prices
8. **Set pricing:** Add prices for different regions
9. **Organize:** Add to collections and categories
10. **Save product**

### Edit Existing Products

1. **Go to Products** page
2. **Click on any product** to open details
3. **Edit details:** Click ‹® menu â†’ Edit
4. **Manage images:** Add, reorder, delete, set thumbnail
5. **Update variants:** Add sizes, change prices
6. **Change status:** Published/Draft
7. **Organize:** Move between collections/categories

### Product Variants

Each product can have multiple variants (sizes, colors, etc.):

1. **Open product details**
2. **Go to Variants section**
3. **Click "Create"** to add new variant
4. **Set options:** Size, color, etc.
5. **Set pricing:** Different prices per variant
6. **Set inventory:** Stock levels per variant

### Product Collections

Organize products into collections:

1. **Go to Products †’ Collections**
2. **Create collection:** Name and handle
3. **Add products:** Select products to include
4. **Edit collection:** Change name, products

### Product Categories

Create hierarchical categories:

1. **Go to Products †’ Categories**
2. **Create category:** Name, handle, description
3. **Add products:** Assign products to categories
4. **Nested categories:** Create subcategories

### Delete Products

**Warning:** Deleting is permanent!

1. **Open product details**
2. **Click ‹® menu â†’ Delete**
3. **Confirm deletion**

### Bulk Operations

- **Select multiple products** using checkboxes
- **Export products** to CSV
- **Import products** from CSV
- **Bulk edit** status, collections, etc.

### Product Status

- **Published:** Visible on storefront
- **Draft:** Hidden, work in progress
- **Proposed:** Awaiting approval
- **Rejected:** Not approved for publishing

## Payment Setup (Stripe)

The store is pre-configured with Stripe payment provider. To enable payments:

### 1. Get Stripe API Keys

1. Create a [Stripe account](https://stripe.com/) (if you don't have one)
2. Go to [Stripe Dashboard > Developers > API keys](https://dashboard.stripe.com/apikeys)
3. Copy your **Secret key** (starts with `sk_test_` for test mode)
4. Copy your **Publishable key** (starts with `pk_test_` for test mode)

### 2. Configure Stripe

Add your Stripe keys to your environment:

```bash
# In .env file (if using environment file):
STRIPE_API_KEY=sk_test_51...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51...

# Or in docker-compose.yml:
environment:
  STRIPE_API_KEY: sk_test_51...
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: pk_test_51...
```

### 3. Enable Stripe in Region

1. Start the containers: `docker-compose up -d`
2. Open Admin Panel: http://localhost:9000/app
3. Login with: `admin@test.com` / `supersecret`
4. Go to **Settings > Regions**
5. Click on your region (e.g., "Default Region")
6. Click the **‹®** menu > **Edit**
7. In **Payment Providers** field, select **"Stripe (STRIPE)"**
8. Click **Save**

### 4. Test Payments

- Use test card: `4242 4242 4242 4242`
- Any future expiry date and CVC
- See [Stripe test cards](https://stripe.com/docs/testing#cards)

## Email Setup (SendGrid)

The store is pre-configured with SendGrid for email notifications. To enable emails:

### 1. Get SendGrid API Key

1. Create a [SendGrid account](https://signup.sendgrid.com/) (if you don't have one)
2. Go to [SendGrid Dashboard > Settings > API Keys](https://app.sendgrid.com/settings/api_keys)
3. Create a new API key with "Full Access" permissions
4. Copy the API key (starts with `SG.`)

### 2. Verify Sender Email

1. In SendGrid Dashboard, go to **Settings > Sender Authentication**
2. Verify a single sender or authenticate your domain
3. Use the verified email as your `SENDGRID_FROM_EMAIL`

### 3. Configure SendGrid

Add your SendGrid credentials to your environment:

```bash
# In .env file (if using environment file):
SENDGRID_API_KEY=SG.YourApiKeyHere
SENDGRID_FROM_EMAIL=noreply@yourstore.com

# Or in docker-compose.yml:
environment:
  SENDGRID_API_KEY: SG.YourApiKeyHere
  SENDGRID_FROM_EMAIL: noreply@yourstore.com
```

### 4. Test Emails

SendGrid will automatically send emails for:
- Order confirmations
- Shipping updates
- Password resets
- Admin notifications

**Note**: SendGrid offers 100 free emails per day, then $15+/month for higher volumes.

## Shipping Setup (USPS)

The store includes a USPS fulfillment provider for real-time shipping rate calculation. This is completely free to use (no third-party fees like ShipStation).

### Overview

The USPS integration provides:
- œ… Real-time shipping rate calculations
- œ… Multiple mail classes (Priority, Express, Ground Advantage, First-Class)
- œ… Calculated pricing based on weight, dimensions, and destination
- œ… Free API access (no monthly fees)

### 1. Get USPS API Credentials

1. Go to [USPS Developer Portal](https://developer.usps.com/)
2. Create an account or sign in
3. Create a new OAuth2 application
4. Copy your **Client ID** and **Client Secret**

### 2. Configure USPS

Add your USPS credentials to your environment:

```bash
# In .env file:
USPS_CLIENT_ID=your_usps_client_id_here
USPS_CLIENT_SECRET=your_usps_client_secret_here
USPS_ENVIRONMENT=testing
WAREHOUSE_ADDRESS=123 Main St
WAREHOUSE_CITY=Overland Park
WAREHOUSE_STATE=KS
WAREHOUSE_ZIP=66217
WAREHOUSE_COUNTRY=US
```

**Important**:
- Start with `USPS_ENVIRONMENT=testing` for development
- Change `WAREHOUSE_*` variables to your warehouse/shipping location address
- Switch to `USPS_ENVIRONMENT=production` when ready to go live

### 3. Install Dependencies & Restart

```bash
# Rebuild the backend container to install dependencies
docker compose build backend
docker compose up -d

# Or install in running container
docker compose exec backend npm install
docker compose restart backend
```

### 4. Configure Shipping Options in Admin

1. Open Admin Panel: http://localhost:9000/app
2. Go to **Settings †’ Locations & Shipping**
3. Click on your location (or create a new one)
4. In **Fulfillment Providers** section:
   - Click the three-dots icon †’ **Edit**
   - Check the box next to **USPS**
   - Click **Save**
5. Create shipping options:
   - Click **Create option** under the Shipping section
   - Set **Price Type** to **Calculated**
   - Enter a **Name** (e.g., "USPS Priority Mail")
   - Select **Shipping Profile** (usually "Default")
   - Choose **Fulfillment Provider**: **USPS**
   - Choose **Fulfillment Option**: Select from available mail classes
   - Click **Save**

### 5. Available Mail Classes

| Mail Class | Delivery Time | Best For |
|------------|---------------|----------|
| Priority Mail | 1-3 days | Standard shipping, most popular |
| Priority Mail Express | Overnight-2 days | Express shipping, guaranteed |
| Ground Advantage | 2-5 days | Economy shipping, cost-effective |
| First-Class Package | 1-5 days | Lightweight items under 1 lb |

### 6. How It Works

1. Customer adds items to cart and enters shipping address
2. Backend calculates package weight and dimensions
3. USPS API returns real-time rates for available mail classes
4. Customer selects preferred shipping method
5. Order is placed with accurate shipping cost

### Customization

The integration includes default weight and dimension calculations. To customize based on your products:

**Weight Calculation**: Edit `backend/src/modules/usps-fulfillment/service.ts` †’ `calculateWeight()` method

**Dimensions**: Edit `backend/src/modules/usps-fulfillment/service.ts` †’ `calculateDimensions()` method

### Testing

1. Use `USPS_ENVIRONMENT=testing` to test against USPS sandbox
2. Create test orders with various ZIP codes and weights
3. Verify rates are calculated correctly
4. Switch to `production` when ready

### Frontend Features

The USPS integration includes three customer-facing features:

#### 1. Address Validation at Checkout
- Click "Verify Address" during checkout
- USPS validates and standardizes the address
- Suggests corrected address with ZIP+4
- One-click to accept suggested address

#### 2. Shipping Calculator on Product Pages
- Enter ZIP code on any product page
- See real-time shipping rates for all mail classes
- Compare delivery times and costs
- Helps customers make informed purchase decisions

#### 3. Real-time Rate Calculation at Checkout
- Automatic rate calculation when shipping address is entered
- Multiple shipping options displayed with costs
- Accurate rates based on package weight and destination

### Troubleshooting

**"USPS API Error: Unauthorized"**
- Check `USPS_CLIENT_ID` and `USPS_CLIENT_SECRET` are correct
- Verify credentials are active in USPS developer dashboard

**"Shipping address with postal code is required"**
- Ensure customer enters complete shipping address at checkout

**Rates seem incorrect**
- Verify `WAREHOUSE_ZIP` is set correctly
- Check weight calculation logic matches your products

**Address validation not working**
- Verify USPS API credentials are correct
- Check that backend API routes are accessible
- Review browser console for error messages

For more details, see: `backend/src/modules/usps-fulfillment/README.md`

## Development

### Useful Commands

```bash
# Run complete setup (creates products, API keys, etc.)
docker exec clothing-store-backend npm run setup

# View all logs
docker compose logs -f

# View specific service logs
docker compose logs -f backend
docker compose logs -f frontend

# Restart all services
docker compose restart

# Restart specific service
docker compose restart backend

# Stop all services
docker compose down

# Stop and remove all data (complete reset)
docker compose down -v

# Rebuild after code changes
docker compose up -d --build
```

### Add More Products

Option 1: **Admin Panel** (Recommended)
1. Go to http://localhost:9000/app
2. Navigate to **Products** †’ **Add Product**
3. Fill details, add variants, set prices
4. Assign to "Default Sales Channel"

Option 2: **Programmatically**
Edit `backend/src/scripts/complete-setup.ts` and add more products, then rerun.

## Project Structure

```
E-Commerce Site/
”œâ”€â”€ docker-compose.yml          # Docker orchestration
”œâ”€â”€ backend/                    # Medusa v2 backend
”‚   â”œâ”€â”€ Dockerfile
”‚   â”œâ”€â”€ medusa-config.ts       # Medusa configuration
”‚   â””â”€â”€ src/
”‚       â”œâ”€â”€ api/               # Custom API routes
”‚       â”œâ”€â”€ scripts/
”‚       â”‚   â””â”€â”€ complete-setup.ts  # Automated store setup
”‚       â””â”€â”€ subscribers/       # Event subscribers
”œâ”€â”€ frontend/                   # Next.js storefront
”‚   â”œâ”€â”€ Dockerfile
”‚   â”œâ”€â”€ .env.local             # Auto-generated API keys
”‚   â””â”€â”€ src/
”‚       â”œâ”€â”€ pages/             # Next.js routes
”‚       â”œâ”€â”€ components/        # React components
”‚       â””â”€â”€ lib/               # Hooks & utilities
””â”€â”€ README.md
```

## Troubleshooting

### Products Not Showing

The complete-setup script handles everything automatically. If products still don't appear:

```bash
# Restart frontend to pick up new config
docker compose restart frontend

# Check backend is running
docker compose ps

# View backend logs for errors
docker compose logs backend --tail 50
```

### Backend Won't Start

```bash
# Check logs for specific error
docker compose logs backend --tail 50

# Rebuild without cache
docker compose build --no-cache backend
docker compose up -d backend
```

### Port Already in Use

Edit `docker-compose.yml` to change conflicting ports:

```yaml
ports:
  - "3001:3000"  # Change frontend to port 3001
  - "9001:9000"  # Change backend to port 9001
```

### Complete Fresh Start

```bash
# Stop everything and delete all data
docker-compose down -v

# Start fresh
docker-compose up -d

# Wait 60 seconds, then run setup
docker exec clothing-store-backend npx medusa user -e admin@test.com -p supersecret
docker exec clothing-store-backend npm run setup
```

## Production Deployment

### Environment Variables

Create `.env.production` files:

**Backend (`backend/.env.production`):**
```env
DATABASE_URL=your_production_database_url
REDIS_URL=your_production_redis_url
JWT_SECRET=generate_strong_secret
COOKIE_SECRET=generate_strong_secret
STORE_CORS=https://yourdomain.com
STRIPE_API_KEY=sk_live_51...
```

**Frontend (`frontend/.env.production`):**
```env
NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://api.yourdomain.com
```

### Recommended Hosting

- **Frontend**: [Vercel](https://vercel.com) (Next.js optimized)
- **Backend**: [Railway](https://railway.app), [Render](https://render.com), or [DigitalOcean](https://digitalocean.com)
- **Database**: [Supabase](https://supabase.com), [Railway](https://railway.app), or [Neon](https://neon.tech)
- **Redis**: [Upstash](https://upstash.com) or Railway

## Development Commands

### Windows (Command Prompt)

```cmd
# Start all services
docker-compose up -d

# Stop all services
## Advanced

### Google Authentication Setup

The platform includes full Google OAuth integration. To enable Google sign-in:

#### 1. Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to "APIs & Services" > "Credentials"
4. Click "Create Credentials" > "OAuth client ID"
5. Choose "Web application" as the application type
6. Add authorized redirect URI: `http://localhost:3000/auth/callback`
7. For production, add your production URL: `https://yourdomain.com/auth/callback`
8. Save and copy the Client ID and Client Secret

#### 2. Add Environment Variables

Add the following to your backend `.env` file:

```env
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/callback
```

For production:
```env
GOOGLE_CALLBACK_URL=https://yourdomain.com/auth/callback
```

#### 3. Restart Backend

After adding the environment variables:

```bash
docker compose restart backend
```

#### Current Authentication Features

- œ… Email/password authentication (fully functional)
- œ… Google OAuth sign-in (requires credentials above)
- œ… Account modal with sign-in/sign-out
- œ… Protected orders and profile pages
- œ… Automatic redirect after authentication

### Access Container Shells

```bash
# Backend shell
docker exec -it clothing-store-backend sh

# Frontend shell  
docker exec -it clothing-store-frontend sh

# Database shell
docker exec -it clothing-store-db psql -U medusa_user -d medusa_db
```

### Modify Sample Products

Edit `backend/src/scripts/complete-setup.ts` to customize:
- Product names and descriptions
- Prices
- Images (use any Unsplash URL)
- Quantities and variants

### Reset Specific Data

```bash
# Delete all products (keeps other data)
docker exec clothing-store-db psql -U medusa_user -d medusa_db -c "DELETE FROM product CASCADE"

# Rerun setup to recreate products
docker exec clothing-store-backend npm run setup
```

The `complete-setup.ts` script handles:
- Sales channel creation
- Region setup (United States, USD)
- Publishable API key generation
- API key to sales channel linking
- Product creation with variants
- Price configuration
- Product to sales channel linking
- Collection creation and product assignment

No manual steps required!

## Next Steps

After setup, you can:

1. **Customize Branding**
   - Edit `frontend/src/components/layout/Header.tsx`
   - Modify colors in `frontend/tailwind.config.js`

2. **Add Real Products**
   - Use admin panel at http://localhost:9000/app
   - Upload your product images
   - Set actual prices

3. **Configure Payments**
   - Add Stripe or PayPal in admin
   - Set up payment processing

4. **Deploy to Production** - See section below

---

## USPS Shipping Integration

The store includes **real-time USPS shipping rate calculation** with three shipping methods:

### Current Features
- œ… **Live Rate Calculation**: Real-time pricing for USPS Ground Advantage, Priority Mail, and Priority Mail Express
- œ… **Address Validation**: Automatic address verification and correction using USPS Address API
- œ… **Dynamic Weight Calculation**: Total weight calculated from all items in cart
- œ… **Three-Step Checkout**: Contact info â†’ Shipping method â†’ Payment

### Testing Environment
The current setup uses USPS testing credentials (`USPS_CLIENT_ID` and `USPS_CLIENT_SECRET` in `.env`).

**Available Shipping Methods:**
1. **USPS Ground Advantage** - Affordable ground shipping (2-5 business days)
2. **USPS Priority Mail** - Fast delivery (1-3 business days)
3. **USPS Priority Mail Express** - Overnight delivery to most locations

### Future Enhancement: Automated Label Creation

To enable **automatic shipping label generation** and include labels in order confirmation emails:

**Requirements:**
1. **USPS Business Account**: Sign up at [USPS Business Customer Gateway](https://gateway.usps.com/)
2. **Enterprise Payment Account (EPS) or Permit**: Required to create labels via API
3. **Payment Authorization Token**: Call `POST /payments/v3/payment-authorization` with your payment credentials

**Implementation Steps:**
1. Upgrade from OAuth-only testing credentials to a full USPS Business Account
2. Obtain EPS account number or Permit number
3. Implement label creation workflow:
   - Listen for `order.placed` event
   - Call USPS Labels API `POST /labels/v3/label` with payment token
   - Store label URL and tracking number in order metadata
   - Attach label PDF to order confirmation email
4. Update email templates to include tracking number and label download link

**Alternative Solution:**
Consider third-party services like **ShipStation**, **EasyPost**, or **Shippo** which:
- Provide easier testing/sandbox environments
- Support multiple carriers (USPS, UPS, FedEx, etc.)
- Include label generation without complex payment setup
- Offer simpler API integration

**API Documentation:**
- Prices API: https://developers.usps.com/domesticpricesv3 (œ… Currently implemented)
- Labels API: https://developers.usps.com/domesticlabelsv3 (Ready for future implementation)
- Address API: https://developers.usps.com/addressesv3 (œ… Currently implemented)

---

## Production Deployment

To make this production-ready, update these settings in `docker-compose.yml`:

### Backend Environment Variables (Required):

```yaml
backend:
  environment:
    # Database - Use strong password
    DATABASE_URL: postgres://medusa_user:YOUR_STRONG_PASSWORD@postgres:5432/medusa_db
    
    # Security Secrets - Generate random 32+ character strings
    JWT_SECRET: YOUR_RANDOM_JWT_SECRET_HERE
    COOKIE_SECRET: YOUR_RANDOM_COOKIE_SECRET_HERE
    
    # CORS - Replace with your actual domains
    STORE_CORS: https://yourstore.com
    ADMIN_CORS: https://admin.yourstore.com
    AUTH_CORS: https://yourstore.com,https://admin.yourstore.com
    
    # Admin Credentials - Change from defaults
    ADMIN_EMAIL: your-email@example.com
    ADMIN_PASSWORD: your-secure-password
    
    # Environment
    NODE_ENV: production
```

### Frontend Environment Variables (Required):

```yaml
frontend:
  environment:
    NEXT_PUBLIC_MEDUSA_BACKEND_URL: https://api.yourstore.com
    NEXT_PUBLIC_BASE_URL: https://yourstore.com
    NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY: pk_your_api_key_from_setup
    NEXT_PUBLIC_MEDUSA_REGION_ID: reg_your_region_id_from_setup
    NEXT_PUBLIC_MEDUSA_SALES_CHANNEL_ID: sc_your_sales_channel_id_from_setup
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: pk_test_51... # If using Stripe
```

### Additional Production Requirements:

1. **SSL/HTTPS**: Use nginx or Caddy as reverse proxy with Let's Encrypt certificates
2. **Database Backups**: Set up automated PostgreSQL backups
3. **File Storage**: Configure AWS S3 or similar for product images instead of local volumes
4. **Monitoring**: Add error tracking (Sentry) and uptime monitoring
5. **Rate Limiting**: Implement API rate limiting to prevent abuse
6. **Firewall**: Restrict database/redis ports, only expose 80/443

### Generate Secure Secrets:

```bash
# Generate random secrets (Linux/Mac)
openssl rand -base64 32

# Windows PowerShell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | % {[char]$_})
```

---

**Ready to sell in 5 commands**
