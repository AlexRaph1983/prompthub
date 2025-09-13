#!/bin/bash

echo "🚀 Deploying multilingual categories to server..."

# Connect to server and update code
ssh root@83.166.244.71 << 'EOF'
cd ~/prompthub
echo "📥 Pulling latest changes..."
git pull origin main

echo "🔄 Restarting application..."
pm2 restart prompthub

echo "✅ Deployment completed!"
echo "🌐 Categories should now display in interface language"
EOF

echo "🎉 Deployment finished!"
echo "📱 Check https://prompt-hub.site to see multilingual categories"
