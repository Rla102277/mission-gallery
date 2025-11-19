#!/bin/bash

# Firebase Deployment Script for Mission Gallery

echo "🚀 Mission Gallery - Firebase Deployment"
echo "========================================"
echo ""

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found!"
    echo "Install it with: npm install -g firebase-tools"
    exit 1
fi

echo "✅ Firebase CLI found"
echo ""

# Check if logged in
if ! firebase projects:list &> /dev/null; then
    echo "🔐 Please login to Firebase..."
    firebase login
fi

echo "✅ Logged in to Firebase"
echo ""

# Build the frontend
echo "📦 Building frontend..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ Build successful"
echo ""

# Deploy
echo "🚀 Deploying to Firebase..."
firebase deploy --only hosting

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Deployment successful!"
    echo ""
    echo "🌐 Your app is live!"
    echo "View it at: https://your-project.web.app"
    echo ""
    echo "📝 Next steps:"
    echo "1. Update OAuth callback URLs"
    echo "2. Update backend CORS settings"
    echo "3. Test the deployment"
else
    echo "❌ Deployment failed!"
    exit 1
fi
