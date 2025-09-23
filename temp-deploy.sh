#!/bin/bash
cd /root/prompthub
echo "рџ“¦ Fetching latest changes..."
git fetch origin
git reset --hard origin/main
echo "рџ“‹ Installing dependencies..."
npm install
echo "рџЏ—пёЏ Building application..."
npm run build
echo "рџ”„ Restarting PM2..."
pm2 stop prompthub || true
pm2 delete prompthub || true
pm2 start ecosystem.config.js
pm2 save
echo "рџЊђ Restarting Nginx..."
systemctl restart nginx
echo "вњ… Deployment completed successfully!"
echo "рџЊЌ Site should be available at: http://REDACTED_IP"
