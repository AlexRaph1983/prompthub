#!/bin/bash
cd /root/prompthub
echo "📦 Fetching latest changes..."
git fetch origin
git reset --hard origin/main
echo "📋 Installing dependencies..."
npm install
echo "🏗️ Building application..."
npm run build
echo "🔄 Restarting PM2..."
pm2 stop prompthub || true
pm2 delete prompthub || true
pm2 start ecosystem.config.js
pm2 save
echo "🌐 Restarting Nginx..."
systemctl restart nginx
echo "✅ Deployment completed successfully!"
echo "🌍 Site should be available at: http://YOUR_SERVER_IP_HERE"
