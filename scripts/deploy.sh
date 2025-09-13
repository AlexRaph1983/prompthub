#!/bin/bash

# Deployment script for PromptHub on reg.ru

echo "🚀 Starting PromptHub deployment..."

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --production=false

# Generate Prisma client
echo "🗄️ Generating Prisma client..."
npx prisma generate

# Build application
echo "🔨 Building application..."
npm run build

# Run database migrations
echo "🗃️ Running database migrations..."
npx prisma migrate deploy

# Seed database (optional)
echo "🌱 Seeding database..."
npm run seed

echo "✅ Deployment completed successfully!"
echo "🌐 Your app should be running at the configured domain"
