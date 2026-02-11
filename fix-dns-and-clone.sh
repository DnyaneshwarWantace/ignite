#!/bin/bash
# Fix DNS and clone repository on server

echo "🔧 Fixing DNS configuration..."

# Backup existing DNS config
sudo cp /etc/resolv.conf /etc/resolv.conf.backup

# Set Google DNS
echo "Setting Google DNS (8.8.8.8, 8.8.4.4)..."
sudo bash -c 'cat > /etc/resolv.conf << EOF
nameserver 8.8.8.8
nameserver 8.8.4.4
nameserver 1.1.1.1
EOF'

# Prevent resolv.conf from being overwritten
sudo chattr +i /etc/resolv.conf

echo "✅ DNS fixed!"

# Test DNS
echo "Testing DNS resolution..."
ping -c 2 8.8.8.8
ping -c 2 github.com

# Clone repository
echo "📦 Cloning repository..."
cd /root
git clone -b ignite-main https://github.com/DnyaneshwarWantace/ignite.git ignite

echo "✅ Done! Repository cloned to /root/ignite"
