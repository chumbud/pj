#!/bin/bash
# Deployment script for PM2-managed Node.js application

echo "🚀 Starting deployment..."

# Navigate to project directory (adjust path as needed)
cd /path/to/pj || exit 1

# Pull latest changes from git
echo "📥 Pulling latest changes..."
git pull origin main

# Install/update dependencies
echo "📦 Installing dependencies..."
npm install

# Compile SCSS to CSS (production)
echo "🎨 Compiling SCSS..."
npm run sass-prod

# Restart PM2 process
echo "🔄 Restarting PM2 process..."
pm2 restart pj || pm2 start server.js --name pj

# Show PM2 status
echo "✅ Deployment complete! PM2 status:"
pm2 status

echo "🎉 Done!"
