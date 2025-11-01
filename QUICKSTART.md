# Complete Beginner's Guide - Get Your Store Running

This guide assumes you've never used Docker, GitHub, or a terminal before. Follow these steps exactly and you'll have a working e-commerce store in about 15-20 minutes.

---

## What You'll Need

1. **A computer** (Mac, Windows, or Linux)
2. **Internet connection**
3. **30 minutes of time**

That's it! Everything else is free and we'll download it together.

---

## Part 1: Install Required Software

### Step 1: Install Docker Desktop

Docker is like a container that runs your entire store. It handles all the technical stuff for you.

**For Mac:**
1. Go to [https://www.docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop)
2. Click "Download for Mac"
3. Choose the version for your Mac:
   - **Apple Silicon (M1/M2/M3)**: Click "Mac with Apple chip"
   - **Intel Mac**: Click "Mac with Intel chip"
   - Not sure? Click the Apple logo () in top-left corner → "About This Mac" → Look for "Chip" or "Processor"
4. Open the downloaded file (Docker.dmg)
5. Drag Docker icon to Applications folder
6. Open Docker from Applications
7. Click "Accept" on the license agreement
8. Wait for Docker to start (you'll see a whale icon in your menu bar)

**For Windows:**
1. Go to [https://www.docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop)
2. Click "Download for Windows"
3. Run the installer (Docker Desktop Installer.exe)
4. Make sure "Use WSL 2 instead of Hyper-V" is checked
5. Click "OK" and wait for installation
6. Restart your computer when prompted
7. Open Docker Desktop from Start Menu
8. Click "Accept" on the license agreement
9. Wait for Docker to start (you'll see a whale icon in your taskbar)

**For Linux:**
1. Go to [https://docs.docker.com/desktop/install/linux-install/](https://docs.docker.com/desktop/install/linux-install/)
2. Follow instructions for your distribution (Ubuntu, Fedora, etc.)
3. Start Docker Desktop
4. Wait for Docker to fully start

**How to know Docker is ready:**
- Mac: Green light next to whale icon in menu bar
- Windows: Green light next to whale icon in system tray
- Linux: Docker Desktop shows "Engine running"

---

## Part 2: Download the Store Files

You need to get the store files onto your computer. There are two ways to do this:

### Option A: Use Git (Recommended)

**Why Git?** If the store gets updated, you can easily pull the latest changes with one command. You can also share updates with others working on the store.

1. **Install Git:**
   - **Mac:** Open Terminal (press Cmd+Space, type "Terminal", press Enter) and run:
     ```bash
     git --version
     ```
     If Git isn't installed, macOS will prompt you to install it. Click "Install" and follow the prompts.

   - **Windows:**
     1. Download Git from [https://git-scm.com/download/win](https://git-scm.com/download/win)
     2. Run the installer
     3. Use all default settings (just keep clicking "Next")
     4. When finished, search for "Git Bash" in Start Menu and open it

   - **Linux:** Open terminal and run:
     ```bash
     sudo apt-get install git
     ```
     (Ubuntu/Debian) or `sudo yum install git` (Fedora/RedHat)

2. **Clone the repository:**

   Open your terminal (Terminal on Mac/Linux, Git Bash on Windows) and run:

   **Mac/Linux:**
   ```bash
   cd ~/Desktop
   git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   cd YOUR_REPO_NAME
   ```

   **Windows (in Git Bash):**
   ```bash
   cd ~/Desktop
   git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   cd YOUR_REPO_NAME
   ```

   Replace `YOUR_USERNAME/YOUR_REPO_NAME` with the actual GitHub repository path.

   **To get updates later:**
   ```bash
   git pull
   ```

### Option B: Download as ZIP (Quick but no updates)

**Note:** With this method, you won't be able to easily get updates. You'll need to re-download the entire ZIP each time.

1. If you received this as a GitHub link:
   - Go to the GitHub page
   - Click the green "Code" button
   - Click "Download ZIP"
   - Find the ZIP file in your Downloads folder (will be named something like `clothing-store-ecommerce-main.zip`)
   - Double-click to unzip it (creates a folder like `clothing-store-ecommerce-main`)
   - Move the unzipped folder to your Desktop

2. If you received this as a folder:
   - Move it to an easy location (like your Desktop)

---

## Part 3: Open the Terminal

The "terminal" or "command line" is where you type commands to control your computer. Don't worry - we'll give you exact commands to copy and paste.

### Opening Terminal on Mac:
1. Press `Cmd + Space` (this opens Spotlight search)
2. Type "Terminal"
3. Press Enter
4. A window with white or black background will open - this is your terminal!

### Opening Terminal on Windows:
1. Click the Start button
2. Type "PowerShell"
3. Click "Windows PowerShell" (NOT "Windows PowerShell ISE")
4. A blue window will open - this is your terminal!

### Opening Terminal on Linux:
1. Press `Ctrl + Alt + T`
2. Or search for "Terminal" in your applications
3. A window will open - this is your terminal!

---

## Part 4: Navigate to Your Store Folder

In the terminal, you need to "go to" the folder where you put the store files. We call this "changing directory" or "cd" for short.

**If you used Git (Option A):** You're already in the right folder! Skip to Part 5.

**If you downloaded the ZIP (Option B):** Follow the instructions below.

**Copy one of these commands based on where you put the folder:**

**Mac:**
```bash
cd ~/Desktop/clothing-store-ecommerce-main
```
Or if you renamed/moved it:
```bash
cd "/Users/YourName/Desktop/your-folder-name"
```

**Windows:**
```powershell
cd "C:\Users\YourName\Desktop\clothing-store-ecommerce-main"
```
Replace `YourName` with your actual Windows username, and adjust the folder name if you renamed it.

**Linux:**
```bash
cd ~/Desktop/clothing-store-ecommerce-main
```
Or:
```bash
cd "/home/YourName/Desktop/clothing-store-ecommerce-main"
```

**How to know it worked:**
- The terminal should now show your folder path
- Mac/Linux: You'll see something like `~/Desktop/clothing-store-ecommerce-main`
- Windows: You'll see something like `C:\Users\...\clothing-store-ecommerce-main>`

**Tip:** If you get "No such file or directory" or "cannot find path", the path is wrong. Try dragging the folder into the terminal window to auto-complete the path!

---

## Part 5: Start Your Store (6 Easy Steps)

Now we'll run some commands to get your store running. Just copy and paste each command, press Enter, and wait for it to finish before running the next one.

### Step 1: Start Docker (if it's not running)

Make sure Docker Desktop is open and shows "Engine running" (green light).

### Step 2: Start the Store Containers

**All platforms - Copy and paste this:**
```bash
docker compose up -d
```

**What this does:** Downloads and starts all the parts of your store (database, backend, frontend)

**Wait time:**
- First time: 5-10 minutes (it's downloading a lot of files)
- After first time: 30-60 seconds

**How to know it's done:**
- You'll see messages like "Container clothing-store-frontend Started"
- Your terminal will show a new prompt (where you can type again)

### Step 3: Set Up Your Store Data

**Copy and paste this:**
```bash
docker exec clothing-store-backend npm run full-setup
```

**What this does:** Creates your database, admin account, sample products, and collections

**Wait time:** 30-60 seconds

**Important:** At the end, you'll see output like this:
```
⚠ NEXT STEPS:
1. Update .env file - Add these values:
   NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_01abc123def456...
   NEXT_PUBLIC_MEDUSA_REGION_ID=reg_01xyz789...
   NEXT_PUBLIC_MEDUSA_SALES_CHANNEL_ID=sc_01abc456...
```

**COPY THESE THREE VALUES!** Write them down or keep the terminal window open. You'll need them in the next step. They will be unique keys generated specifically for your store.

### Step 4: Configure Your Environment Variables

Now you need to create a configuration file with those keys you just copied.

**Option A: Using a Text Editor (Easiest)**

1. Open the store folder in your file browser:
   - Mac: Open Finder, navigate to the folder
   - Windows: Open File Explorer, navigate to the folder
   - Linux: Open your file manager

2. Look for a file called `.env.example`
   - **Mac/Linux:** You might need to show hidden files:
     - Mac: Press `Cmd + Shift + .` (period key)
     - Linux: Press `Ctrl + H`
   - **Windows:** Make sure "Hidden items" is checked in View tab

3. Make a copy of `.env.example`:
   - Right-click on `.env.example`
   - Select "Duplicate" (Mac) or "Copy" then "Paste" (Windows/Linux)
   - Rename the copy to `.env` (just `.env` with no `.example`)

4. Open `.env` in a text editor:
   - Mac: Right-click → Open With → TextEdit
   - Windows: Right-click → Open With → Notepad
   - Linux: Right-click → Open With → gedit or Text Editor

5. Find these three lines and replace the values with what you copied from Step 3:
   ```
   NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_your_actual_key_here
   NEXT_PUBLIC_MEDUSA_REGION_ID=reg_your_actual_id_here
   NEXT_PUBLIC_MEDUSA_SALES_CHANNEL_ID=sc_your_actual_id_here
   ```

6. Save the file (Cmd+S on Mac, Ctrl+S on Windows/Linux)

**Option B: Using Terminal (Faster if you're comfortable)**

**Mac/Linux:**
```bash
cp .env.example .env
nano .env
```
Then use arrow keys to navigate, edit the three lines, press `Ctrl+X`, then `Y`, then Enter to save.

**Windows:**
```powershell
copy .env.example .env
notepad .env
```
Then edit the three lines and save.

### Step 5: Restart Everything

Now restart the containers so they pick up your new configuration:

```bash
docker compose restart
```

**Wait time:** 10-20 seconds

If products don't show up on your site, do a full rebuild:
```bash
docker compose down
docker compose up -d --build
```
**Wait time:** 2-3 minutes

### Step 6: Open Your Store!

Your store is now running! Open your web browser and go to:

**Storefront (what customers see):**
```
http://localhost:3000
```

**Admin Panel (where you manage products):**
```
http://localhost:9000/app
```

**Admin login:**
- Email: `admin@test.com`
- Password: `supersecret`

**If you see products on the homepage and can click around, congratulations! Your store is working!**

---

## Part 6: Set Up Payments (Optional but Recommended)

To actually accept payments, you need to connect Stripe:

### Get Stripe Account

1. Go to [https://stripe.com](https://stripe.com)
2. Click "Sign up" (it's free)
3. Fill out your info and verify your email
4. Once logged in, you'll see a Dashboard

### Get Your Stripe Secret Key

1. In Stripe Dashboard, click "Developers" in the top right
2. Click "API keys" in the left sidebar
3. You'll see "Secret key" - click "Reveal test key"
4. Click the copy icon to copy the key (starts with `sk_test_`)

### Add Stripe Key to Your Store

1. Open your `.env` file again (same way as Step 4)
2. Find the line that says `STRIPE_API_KEY=`
3. Paste your key after the `=`:
   ```
   STRIPE_API_KEY=sk_test_51ABC...your_key_here
   ```
4. Save the file

### Enable Stripe in Admin

1. Go to your admin panel: http://localhost:9000/app
2. Log in with `admin@test.com` / `supersecret`
3. Click "Settings" in the left sidebar
4. Click "Regions"
5. Click on "United States"
6. Scroll down to "Payment Providers"
7. Click "+ Add Payment Provider"
8. Select "Stripe (STRIPE)"
9. Click "Save"

### Restart to Apply Changes

In your terminal:
```bash
docker compose restart
```

### Test a Purchase

1. Go to your store: http://localhost:3000
2. Add a product to cart
3. Click cart and "Checkout"
4. Fill out the form
5. For card number, use Stripe's test card: `4242 4242 4242 4242`
6. Any future date for expiration
7. Any 3 digits for CVC
8. Complete the order

**If it works, you'll see "Order placed successfully!" Congrats!**

---

## Part 7: Set Up Order Emails (Optional)

To send confirmation emails when customers place orders:

### Get SendGrid Account

1. Go to [https://signup.sendgrid.com](https://signup.sendgrid.com)
2. Sign up for free account
3. Verify your email

### Get API Key

1. Log into SendGrid
2. Click "Settings" in left sidebar
3. Click "API Keys"
4. Click "Create API Key"
5. Name it "My Store"
6. Select "Full Access"
7. Click "Create & View"
8. Copy the key (starts with `SG.`)

### Verify Your Email Address

1. In SendGrid, go to Settings → Sender Authentication
2. Click "Verify a Single Sender"
3. Fill out the form with your email
4. Check your email and click the verification link

### Add to Your Store

1. Open `.env` file
2. Add these lines:
   ```
   SENDGRID_API_KEY=SG.your_key_here
   SENDGRID_FROM_EMAIL=your_verified_email@example.com
   ```
3. Save

### Restart

```bash
docker compose restart
```

**Now when someone places an order, they'll get a confirmation email!**

---

## Common Tasks

### Stop Your Store
```bash
docker compose down
```
Your data is saved. You can start it again anytime with `docker compose up -d`

### Start Your Store Again
```bash
docker compose up -d
```

### View Logs (if something goes wrong)
```bash
docker compose logs -f
```
Press `Ctrl+C` to stop viewing logs

### Complete Reset (Start Over)
```bash
docker compose down -v
docker compose up -d
docker exec clothing-store-backend npm run full-setup
```
**Warning:** This deletes ALL data including products and orders!

### Add Products

1. Go to admin: http://localhost:9000/app
2. Click "Products" in sidebar
3. Click "+ Product" button
4. Fill out:
   - Title (e.g., "Blue Jeans")
   - Description
   - Upload images
   - Add variants (sizes, colors)
   - Set prices
5. Click "Publish"

### Manage Collections

Collections group products together (like "T-Shirts", "Jeans", "Hoodies").

1. Go to admin: http://localhost:9000/app
2. Click "Products" → "Collections"
3. Click on a collection to add/remove products
4. Or create new collections

---

## Troubleshooting

### "docker: command not found"
- Docker isn't installed or isn't running
- Make sure Docker Desktop is open with green light
- Try restarting Docker Desktop

### "Cannot connect to Docker daemon"
- Docker isn't running
- Open Docker Desktop
- Wait for green light to appear

### "Port is already in use"
- Something else is using port 3000 or 9000
- Restart your computer
- Or change ports in `docker-compose.yml`

### Store shows but no products
- Make sure you ran the setup command: `docker exec clothing-store-backend npm run full-setup`
- Make sure you updated the `.env` file with API keys
- Try: `docker compose restart`

### Can't see .env file
- Mac: Press `Cmd + Shift + .` in Finder
- Windows: In File Explorer, click View tab → check "Hidden items"
- Linux: Press `Ctrl + H` in file manager

### Need more help?
1. Check the full README.md file
2. Look at the error message carefully
3. Google the error message
4. Check Docker Desktop for error logs

---

## What Each File/Folder Does

- `backend/` - The server that handles products, orders, payments
- `frontend/` - The website customers see
- `docker-compose.yml` - Tells Docker how to run everything
- `.env` - Your configuration (API keys, passwords)
- `QUICKSTART.md` - This file!
- `README.md` - More detailed documentation

---

## Next Steps

Now that your store is running:

1. **Customize products**: Delete sample products and add your own
2. **Change styling**: Edit files in `frontend/src/` to change colors, layout
3. **Add your domain**: When ready to go live, point your domain to your server
4. **Enable live payments**: Switch from Stripe test keys to live keys
5. **Add more features**: See README.md for advanced customization

**Congratulations! You now have a working e-commerce store!** 🎉
