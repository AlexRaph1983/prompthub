#!/bin/bash

# Deploy script for Orange Curium server
# Usage: ./deploy-orange-curium.sh

SERVER="REDACTED_IP"
USER="root"
PASSWORD="REDACTED_PASSWORD"
BRANCH="main"
PORT="3000"

echo "🚀 Deploying to Orange Curium server ($SERVER)"

# Check if sshpass is available
if ! command -v sshpass &> /dev/null; then
    echo "❌ sshpass not found. Installing..."
    if command -v apt-get &> /dev/null; then
        sudo apt-get update && sudo apt-get install -y sshpass
    elif command -v yum &> /dev/null; then
        sudo yum install -y sshpass
    elif command -v brew &> /dev/null; then
        brew install hudochenkov/sshpass/sshpass
    else
        echo "❌ Cannot install sshpass automatically. Please install it manually."
        echo "Then run: sshpass -p '$PASSWORD' ssh -o StrictHostKeyChecking=no $USER@$SERVER 'cd /root/prompthub && git fetch origin && git reset --hard origin/main && bash scripts/deploy.sh'"
        exit 1
    fi
fi

echo "📡 Connecting to server..."

# Deploy command
sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no "$USER@$SERVER" "
    set -e
    echo '🔧 Setting up repository...'
    if [ ! -d /root/prompthub ]; then
        echo '📁 Cloning repository...'
        git clone https://github.com/alexeykuznetsov/prompthub.git /root/prompthub
    fi
    cd /root/prompthub
    echo '📥 Fetching latest changes...'
    git fetch origin
    git reset --hard origin/$BRANCH
    echo '🚀 Running deployment script...'
    bash scripts/deploy.sh
    echo '✅ Deployment completed successfully!'
"

if [ $? -eq 0 ]; then
    echo "🎉 Deployment to Orange Curium completed successfully!"
    echo "🌐 Your app should be available at: http://$SERVER:$PORT"
else
    echo "❌ Deployment failed!"
    exit 1
fi
