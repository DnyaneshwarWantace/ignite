# Complete Server Deployment Guide for Ignite
## Deploy to: editor.scalez.in/ignite

---

## Prerequisites on Server

### 1. System Requirements
```bash
# Check Node.js version (Need 18.x or 20.x)
node -v

# If not installed or old version:
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node -v  # Should show v20.x.x
npm -v   # Should show 10.x.x
```

### 2. Install Essential Tools
```bash
# Git
sudo apt-get update
sudo apt-get install -y git

# PM2 (Process Manager)
sudo npm install -g pm2

# Update Remotion (if old version exists)
sudo npm install -g @remotion/cli@latest @remotion/lambda@latest

# PostgreSQL client
sudo apt-get install -y postgresql-client

# Nginx (if not installed)
sudo apt-get install -y nginx

# FFmpeg (required for video processing)
sudo apt-get install -y ffmpeg

# Certbot (for SSL)
sudo apt-get install -y certbot python3-certbot-nginx
```

---

## Step 1: Clone Repository with SSH

### Setup SSH Key for GitHub
```bash
# Generate SSH key (if not exists)
ssh-keygen -t ed25519 -C "your-email@example.com"

# Copy public key
cat ~/.ssh/id_ed25519.pub

# Add to GitHub: https://github.com/settings/keys
```

### Clone Repository

**Option 1: Using HTTPS (Recommended - Simpler)**
```bash
cd /var/www
git clone -b ignite-main https://github.com/DnyaneshwarWantace/ignite.git ignite
cd /var/www/ignite
```

**Option 2: Using SSH (If SSH key is set up)**
```bash
cd /var/www
git clone -b ignite-main git@github.com:DnyaneshwarWantace/ignite.git ignite
cd /var/www/ignite
```

**If DNS Error (Could not resolve host: github.com):**
```bash
# Fix 1: Set Google DNS (RECOMMENDED)
sudo bash -c 'cat > /etc/resolv.conf << EOF
nameserver 8.8.8.8
nameserver 8.8.4.4
nameserver 1.1.1.1
EOF'

# Prevent it from being overwritten
sudo chattr +i /etc/resolv.conf

# Test DNS
ping -c 2 github.com

# If ping works, try clone again
git clone -b ignite-main https://github.com/DnyaneshwarWantace/ignite.git ignite
```

**Alternative: Add GitHub IP to hosts file:**
```bash
echo "140.82.121.3 github.com" | sudo tee -a /etc/hosts
git clone -b ignite-main https://github.com/DnyaneshwarWantace/ignite.git ignite
```

---

## Step 2: Configure Next.js for Subdirectory

Edit `next.config.js` and add:

```javascript
const nextConfig = {
  basePath: '/ignite',
  assetPrefix: '/ignite',
  // ... rest of existing config
};
```

---

## Step 3: Environment Variables

Create `/var/www/ignite/.env.production` with these values:

```bash
cat > .env.production << 'EOF'
DATABASE_URL="postgresql://postgres:postgres678@0.0.0.0:5432/ignite?schema=public"

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://nrfujyhdlrszkbtsfuac.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yZnVqeWhkbHJzemtidHNmdWFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY3NTA4MzgsImV4cCI6MjA4MjMyNjgzOH0.D7DiAn81QUUax6mRIHrbFBzIcp6ywbzBZlJiLdmiTrg
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yZnVqeWhkbHJzemtidHNmdWFjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Njc1MDgzOCwiZXhwIjoyMDgyMzI2ODM4fQ.EEnQDdRT3dUy9s8vjYPAE5PHNXZ6h09qF0JbVJbKJOE

# Auth js
NEXTAUTH_SECRET="3+sdBgEhEe2uzw3xdZKlwLtj/UU92OycSYFIUPSWBHA="
AUTH_SECRET="3+sdBgEhEe2uzw3xdZKlwLtj/UU92OycSYFIUPSWBHA="
AUTH_TRUST_HOST=1
AUTH_URL="https://editor.scalez.in/ignite"

# Google Auth
AUTH_GOOGLE_ID="403934823504-qjuou59jk3kfc7bv6ejuko8h3dktu8db.apps.googleusercontent.com"
AUTH_GOOGLE_SECRET="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"

NEXT_PUBLIC_BACKEND_URL="https://editor.scalez.in/ignite/api/v1"
EOF
```

**Copy remaining environment variables from your local `.env` file** (AWS keys, API keys, etc.)

---

## Step 4: Build

```bash
npm install
npm run db:production_generate
npm run db:production_push
npm run build
```

---

## Step 5: PM2 Setup

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'ignite',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/ignite',
    instances: 1,
    autorestart: true,
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    }
  }]
};
```

```bash
mkdir -p logs
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

---

## Step 6: Nginx Config

Create `/etc/nginx/sites-available/editor.scalez.in`:

```nginx
server {
    listen 443 ssl http2;
    server_name editor.scalez.in;

    # Root (existing editor)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    # Ignite subdirectory
    location /ignite {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        # CVE-2025-29927: block middleware bypass (strip before Next.js sees it)
        proxy_set_header x-middleware-subrequest "";
    }

    client_max_body_size 100M;
}
```

```bash
sudo ln -s /etc/nginx/sites-available/editor.scalez.in /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## Step 7: SSL
```bash
sudo certbot --nginx -d editor.scalez.in
```

---

## Step 8: Update Google OAuth
Add redirect URI: `https://editor.scalez.in/ignite/api/auth/callback/google`

---

## Deployment Commands

```bash
# Pull & deploy
cd /var/www/ignite
git pull origin ignite-main
npm install
npm run build
pm2 restart ignite
```

**If you cloned with HTTPS and git asks for password:**
```bash
# Store credentials
git config --global credential.helper store

# Or use personal access token
git config --global credential.helper cache

# Next pull will ask for username/token once, then cache it
```

## PM2 Commands
```bash
pm2 logs ignite
pm2 restart ignite
pm2 status
pm2 monit
```

## Security: Next.js middleware bypass (CVE-2025-29927)

Older Next.js versions can be abused so auth is bypassed via the `x-middleware-subrequest` header. This app is patched by:

1. **Upgrading Next.js** to 14.2.25+ (see `package.json`).
2. **Middleware** rejecting requests that send that header (see `src/middleware.ts`).
3. **Nginx** (above) overwriting that header with an empty value before the request reaches Next.js.

After any deploy, run `npm install` and `npm run build` so the upgraded Next.js is used. If you use another reverse proxy (e.g. Caddy, HAProxy), strip or clear the `x-middleware-subrequest` request header before proxying to Next.js.

---

## Troubleshooting
```bash
# Logs
pm2 logs ignite --lines 100
sudo tail -f /var/log/nginx/error.log

# Check ports
sudo lsof -i :3001

# Restart all
pm2 restart ignite
sudo systemctl restart nginx
```

