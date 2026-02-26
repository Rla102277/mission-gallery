# Firebase Deployment Guide

## Overview

This guide will help you deploy Mission Gallery to Firebase. We'll use:

- **Firebase Hosting** - For the frontend (React app)
- **Firebase Functions** - For the backend API (optional)
- **External Backend** - Or keep backend on Replit/Railway/Render

## Prerequisites

- Firebase account (free tier works)
- Firebase CLI installed
- Node.js 18+ installed

## Option 1: Frontend Only (Recommended for Start)

Deploy just the frontend to Firebase, keep backend on Replit/Railway.

### Step 1: Install Firebase CLI

```bash
npm install -g firebase-tools
```

### Step 2: Login to Firebase

```bash
firebase login
```

### Step 3: Initialize Firebase Project

```bash
firebase init
```

Select:

- ✅ Hosting
- Choose "Create a new project" or select existing
- Build directory: `dist`
- Single-page app: `Yes`
- GitHub auto-deploy: `No` (for now)

### Step 4: Update Environment Variables

Create `.env.production`:

```env
VITE_API_URL=https://your-backend-url.repl.co/api
VITE_ADOBE_CLIENT_ID=your_adobe_client_id
VITE_GOOGLE_PHOTOS_CLIENT_ID=your_google_client_id
```

### Step 5: Build Frontend

```bash
npm run build
```

### Step 6: Deploy

```bash
firebase deploy --only hosting
```

Your frontend will be live at: `https://your-project.web.app`

### Step 7: Update Backend CORS

Update your backend (on Replit) to allow Firebase domain:

```javascript
// server/index.js
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://your-project.web.app",
      "https://your-project.firebaseapp.com",
    ],
    credentials: true,
  })
);
```

## Option 2: Full Stack (Frontend + Backend)

Deploy both frontend and backend to Firebase.

### Step 1: Create Functions Directory

```bash
mkdir functions
cd functions
npm init -y
```

### Step 2: Install Dependencies

```bash
npm install express cors dotenv mongoose passport passport-google-oauth20 express-session axios cloudinary exifr groq-sdk
```

### Step 3: Create Functions Entry Point

Create `functions/index.js`:

```javascript
const functions = require("firebase-functions");
const express = require("express");
const app = require("../server/index.js"); // Your Express app

exports.api = functions.https.onRequest(app);
```

### Step 4: Update Package.json

Add to `functions/package.json`:

```json
{
  "engines": {
    "node": "18"
  },
  "scripts": {
    "build": "echo 'No build needed'"
  }
}
```

### Step 5: Set Environment Variables

```bash
firebase functions:config:set \
  mongodb.uri="your-mongodb-uri" \
  session.secret="your-session-secret" \
  groq.api_key="your-groq-key" \
  adobe.client_id="your-adobe-id" \
  adobe.client_secret="your-adobe-secret"
```

### Step 6: Deploy Everything

```bash
npm run build
firebase deploy
```

## Configuration Files Created

### firebase.json

- Hosting configuration
- Rewrites API calls to functions
- Cache headers for assets
- SPA routing

### .firebaserc

- Project configuration
- Default project name

## Environment Setup

### Production Environment Variables

**Frontend (.env.production):**

```env
VITE_API_URL=https://your-project.web.app/api
VITE_ADOBE_CLIENT_ID=your_adobe_client_id
VITE_GOOGLE_PHOTOS_CLIENT_ID=your_google_client_id
```

**Backend (Firebase Functions Config):**

```bash
firebase functions:config:set \
  mongodb.uri="your-mongodb-connection-string" \
  session.secret="your-session-secret" \
  groq.api_key="your-groq-api-key" \
  adobe.client_id="your-adobe-client-id" \
  adobe.client_secret="your-adobe-client-secret" \
  google.client_id="your-google-client-id" \
  google.client_secret="your-google-client-secret" \
  cloudinary.cloud_name="your-cloudinary-name" \
  cloudinary.api_key="your-cloudinary-key" \
  cloudinary.api_secret="your-cloudinary-secret"
```

## Deployment Commands

### Deploy Frontend Only

```bash
npm run build
firebase deploy --only hosting
```

### Deploy Functions Only

```bash
firebase deploy --only functions
```

### Deploy Everything

```bash
npm run build
firebase deploy
```

### View Logs

```bash
firebase functions:log
```

## Update OAuth Callbacks

After deployment, update these URLs:

### Google OAuth

- Console: https://console.cloud.google.com
- Authorized redirect URIs:
  - `https://your-project.web.app/auth/google/callback`
  - `https://your-project.firebaseapp.com/auth/google/callback`

### Adobe Lightroom

- Console: https://developer.adobe.com/console
- Redirect URIs:
  - `https://your-project.web.app/test/lightroom`
  - `https://your-project.firebaseapp.com/test/lightroom`

## Recommended Architecture

### For Production:

1. **Frontend**: Firebase Hosting
2. **Backend**: Railway/Render (better for long-running processes)
3. **Database**: MongoDB Atlas
4. **Storage**: Cloudinary

### Why?

- Firebase Functions have cold starts
- Firebase Functions timeout after 60s (paid) or 9s (free)
- Backend needs persistent connections (MongoDB, sessions)
- Lightroom API calls can be slow

## Alternative: Hybrid Approach

**Frontend on Firebase:**

```bash
firebase deploy --only hosting
```

**Backend on Railway:**

1. Connect GitHub repo to Railway
2. Set environment variables
3. Deploy automatically on push

**Benefits:**

- Fast frontend (Firebase CDN)
- Reliable backend (Railway always-on)
- Best of both worlds

## Troubleshooting

### Build Fails

```bash
# Clear cache and rebuild
rm -rf dist node_modules
npm install
npm run build
```

### Functions Timeout

- Increase timeout in firebase.json
- Or move to dedicated backend service

### CORS Errors

- Update backend CORS to include Firebase domains
- Check CLIENT_URL environment variable

### Environment Variables Not Working

```bash
# View current config
firebase functions:config:get

# Unset and reset
firebase functions:config:unset key
firebase functions:config:set key="value"
```

## Cost Estimate

### Firebase Free Tier:

- Hosting: 10 GB storage, 360 MB/day transfer
- Functions: 125K invocations/month, 40K GB-seconds
- Usually sufficient for small-medium apps

### Paid (Blaze Plan):

- Pay as you go
- Hosting: $0.026/GB storage, $0.15/GB transfer
- Functions: $0.40/million invocations

## Next Steps

1. ✅ Install Firebase CLI
2. ✅ Initialize Firebase project
3. ✅ Build frontend
4. ✅ Deploy to Firebase
5. ✅ Update OAuth callbacks
6. ✅ Test deployment
7. ✅ Set up custom domain (optional)

## Support

- Firebase Docs: https://firebase.google.com/docs
- Firebase Console: https://console.firebase.google.com
- Status: https://status.firebase.google.com
