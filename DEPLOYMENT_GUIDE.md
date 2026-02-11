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
```bash
cd /root
git clone git@github.com:DnyaneshwarWantace/ignite.git ignite
cd /root/ignite
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

Create `.env.production`:

```env
NEXTAUTH_URL="https://editor.scalez.in/ignite"
NEXT_PUBLIC_BACKEND_URL="https://editor.scalez.in/ignite/api/v1"

# Copy all other vars from .env file
```

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
    cwd: '/root/ignite',
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
cd /root/ignite
git pull origin master
npm install
npm run build
pm2 restart ignite
```

## PM2 Commands
```bash
pm2 logs ignite
pm2 restart ignite
pm2 status
pm2 monit
```

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

