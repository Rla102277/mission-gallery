# Replit Deployment Guide

## Prerequisites

- Replit account
- MongoDB Atlas account (free tier works)
- Adobe Lightroom API credentials
- Groq API key (for AI features)

## Step 1: Create New Repl

1. Go to [Replit](https://replit.com)
2. Click "Create Repl"
3. Choose "Import from GitHub"
4. Enter repository URL: `https://github.com/Rla102277/mission-gallery`
5. Click "Import from GitHub"

## Step 2: Configure Environment Variables

Click on "Secrets" (lock icon) in the left sidebar and add these variables:

### Required Variables:

```
MONGODB_URI=mongodb+srv://your-connection-string
SESSION_SECRET=your-random-secret-key-here
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GROQ_API_KEY=your-groq-api-key
ADOBE_CLIENT_ID=your-adobe-client-id
ADOBE_CLIENT_SECRET=your-adobe-client-secret
CLIENT_URL=https://your-repl-name.your-username.repl.co
CALLBACK_URL=https://your-repl-name.your-username.repl.co/auth/google/callback
```

### Optional Variables:

```
OPENAI_API_KEY=your-openai-key (if using OpenAI)
ANTHROPIC_API_KEY=your-anthropic-key (if using Claude)
TOGETHER_API_KEY=your-together-key (if using Together AI)
```

The `CLIENT_URL` and `CALLBACK_URL` values must match your deployed frontend URL and Google OAuth redirect settings exactly.

## Step 3: MongoDB Atlas Setup

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Click "Connect" → "Connect your application"
4. Copy the connection string
5. Replace `<password>` with your database password
6. Add to Replit Secrets as `MONGODB_URI`

## Step 4: Adobe Lightroom API Setup

1. Go to [Adobe Developer Console](https://developer.adobe.com/console)
2. Create new project
3. Add "Lightroom API"
4. Configure OAuth:
   - Redirect URI: `https://your-repl-name.your-username.repl.co/test/lightroom`
   - Scopes: `openid`, `lr_partner_apis`, `lr_partner_write`
5. Copy Client ID and Client Secret to Replit Secrets

## Step 5: Groq API Setup

1. Go to [Groq Console](https://console.groq.com)
2. Create API key
3. Add to Replit Secrets as `GROQ_API_KEY`

## Step 6: Install Dependencies

Replit should auto-install, but if needed:

```bash
npm install
```

## Step 7: Run the Application

Click the "Run" button in Replit. The app will:

1. Install dependencies
2. Start the backend server (port 3001)
3. Start the frontend dev server (port 5173)

## Step 8: Initial Setup

1. Navigate to your Repl URL
2. Click "Login" and authenticate with Google
3. Go to Admin Dashboard → Lightroom tab
4. Connect to Adobe Lightroom
5. You're ready to create missions and galleries!

## Deployment (Production)

To deploy to production:

1. Click "Deploy" button in Replit
2. Replit will build the frontend and serve it from the backend
3. Your app will be available at the deployment URL

## Troubleshooting

### Port Issues

- Backend runs on port 3001
- Frontend dev server runs on port 5173
- Replit maps these to external ports

### Database Connection

- Make sure MongoDB Atlas allows connections from anywhere (0.0.0.0/0)
- Or add Replit's IP ranges to whitelist

### Adobe OAuth

- Make sure redirect URI matches exactly
- Use HTTPS URLs (Replit provides this)

### Environment Variables

- Double-check all secrets are set correctly
- Restart the Repl after adding new secrets

## Features to Test

1. ✅ **Mission Creation** - Generate AI mission plans
2. ✅ **Lightroom Integration** - Connect and sync albums
3. ✅ **Gallery Management** - Create and edit galleries
4. ✅ **EXIF Extraction** - View camera settings
5. ✅ **AI Descriptions** - Generate photo descriptions
6. ✅ **Public Galleries** - Share galleries publicly
7. ✅ **About Me** - Edit about page
8. ✅ **My Gear** - AI-generated gear descriptions

## Support

If you encounter issues:

1. Check Replit console for errors
2. Verify all environment variables are set
3. Check MongoDB connection
4. Ensure Adobe OAuth is configured correctly

## Notes

- First load may be slow as dependencies install
- Replit provides HTTPS automatically
- Free tier has some limitations on always-on status
- Consider upgrading for production use
