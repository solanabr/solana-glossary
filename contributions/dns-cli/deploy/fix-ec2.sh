#!/bin/bash
# fix-ec2.sh — Run this on your EC2 instance to fix the DNS timeout
# Usage: bash fix-ec2.sh

set -e

echo "=== Step 1: Check if PM2 / server is running ==="
pm2 status || echo "PM2 not found or no processes running"

echo ""
echo "=== Step 2: Check if port 5300 is listening ==="
ss -ulnp | grep 5300 || echo "Nothing listening on UDP 5300 — server is DOWN"

echo ""
echo "=== Step 3: Check iptables nat rules ==="
sudo iptables -t nat -L PREROUTING -n --line-numbers

echo ""
echo "=== Step 4: Pull latest code changes ==="
cd ~/solana-glossary/contributions/dns-cli
git pull origin feat/dns-cli-glossary
npm install

echo ""
echo "=== Step 5: Restart / start the server ==="
pm2 restart solana-dns 2>/dev/null || PUBLIC_HOST=sdns.fun pm2 start server.js --name solana-dns

echo ""
echo "=== Step 6: Re-apply iptables rules (idempotent) ==="
# Flush existing nat rules first to avoid duplicates
sudo iptables -t nat -F PREROUTING

# Redirect port 53 → 5300 (both UDP and TCP)
sudo iptables -t nat -A PREROUTING -p udp --dport 53 -j REDIRECT --to-port 5300
sudo iptables -t nat -A PREROUTING -p tcp --dport 53 -j REDIRECT --to-port 5300

# Save rules so they persist across reboots
sudo netfilter-persistent save 2>/dev/null || sudo iptables-save | sudo tee /etc/iptables/rules.v4

echo ""
echo "=== Step 7: Local test (direct to port 5300) ==="
dig @127.0.0.1 -p 5300 help +short

echo ""
echo "=== Step 8: Local test (through iptables on port 53) ==="
dig @127.0.0.1 help +short

echo ""
echo "=== Step 9: Make PM2 startup on reboot ==="
pm2 save
pm2 startup | tail -1

echo ""
echo "=== ALL DONE ==="
echo "Now test from your Windows machine:"
echo "  dig @3.236.22.2 help +short"
echo "  dig @sdns.fun help +short"
