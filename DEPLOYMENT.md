# 🚀 Deployment Guide

## Deploy to Replit (Recommended - Free Tier Available)

### Quick Deploy Steps:

1. **Go to Replit:** https://replit.com/

2. **Import from GitHub:**

   - Click "Create Repl"
   - Select "Import from GitHub"
   - Paste: `https://github.com/Rla102277/mission-gallery`
   - Click "Import from GitHub"

3. **Configure Secrets (Environment Variables):**

   Click on "Secrets" (🔒 icon) in the left sidebar and add:

   ```
   # Required
   MONGODB_URI=your_mongodb_atlas_connection_string
   SESSION_SECRET=your_random_secret_here
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret

   # Cloudinary (for image hosting)
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret

   # AI Provider (choose at least one)
   GROQ_API_KEY=gsk_your_key_here
   GEMINI_API_KEY=AIza_your_key_here

   # URLs (update after first deploy)
   CALLBACK_URL=https://your-repl-name.your-username.repl.co/auth/google/callback
   CLIENT_URL=https://your-repl-name.your-username.repl.co
   PORT=3001
   ```

4. **Get Your Replit URL:**

   - After first run, copy your Replit URL
   - Format: `https://your-repl-name.your-username.repl.co`

5. **Update Google OAuth:**

   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Update authorized redirect URI with your Replit URL + `/auth/google/callback`
   - Update `CALLBACK_URL` and `CLIENT_URL` secrets in Replit

6. **Run the Application:**

   - Click the "Run" button
   - Wait for `npm install` to complete
   - Server will start on port 3001
   - Frontend will start on port 5173

7. **Access Your App:**
   - Replit will provide a web view
   - Or open the URL directly in your browser

### MongoDB Atlas Setup (Free):

1. Go to: https://www.mongodb.com/cloud/atlas
2. Create free account
3. Create free cluster (M0)
4. Click "Connect" → "Connect your application"
5. Copy connection string
6. Replace `<password>` with your database password
7. Add to Replit Secrets as `MONGODB_URI`

### Cloudinary Setup (Free):

1. Go to: https://cloudinary.com/
2. Sign up for free account
3. Get credentials from dashboard:
   - Cloud Name
   - API Key
   - API Secret
4. Add to Replit Secrets

### AI Provider Setup (Free):

**Groq (Recommended - Best Free Tier):**

1. Go to: https://console.groq.com/
2. Sign up (no credit card)
3. Create API key
4. Add to Replit Secrets as `GROQ_API_KEY`

See [AI_PROVIDERS_SETUP.md](AI_PROVIDERS_SETUP.md) for other providers.

---

## Deploy to Render (Alternative - Free Tier)

### Steps:

1. **Go to Render:** https://render.com/

2. **Create New Web Service:**

   - Click "New +"
   - Select "Web Service"
   - Connect your GitHub repository

3. **Configure Service:**

   - Name: `mission-gallery`
   - Environment: `Node`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Instance Type: `Free`

4. **Add Environment Variables:**

   - Click "Environment" tab
   - Add all variables from `.env.example`
   - Update `CALLBACK_URL` and `CLIENT_URL` with your Render URL

5. **Deploy:**

   - Click "Create Web Service"
   - Wait for deployment (5-10 minutes)
   - Get your URL: `https://mission-gallery.onrender.com`

6. **Update Google OAuth:**
   - Add Render URL to authorized redirect URIs
   - Format: `https://mission-gallery.onrender.com/auth/google/callback`

### Note on Free Tier:

- Render free tier spins down after 15 minutes of inactivity
- First request after spin-down takes 30-60 seconds
- Upgrade to paid tier ($7/mo) for always-on service

---

## Deploy to Railway (Alternative - $5 Free Credit)

### Steps:

1. **Go to Railway:** https://railway.app/

2. **Deploy from GitHub:**

   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose `mission-gallery`

3. **Add Environment Variables:**

   - Click on your service
   - Go to "Variables" tab
   - Add all variables from `.env.example`

4. **Generate Domain:**

   - Go to "Settings" tab
   - Click "Generate Domain"
   - Copy your Railway URL

5. **Update Environment Variables:**

   - Update `CALLBACK_URL` and `CLIENT_URL` with Railway URL

6. **Update Google OAuth:**
   - Add Railway URL to authorized redirect URIs

### Railway Pricing:

- $5 free credit per month
- Pay-as-you-go after credit
- ~$5-10/month for small apps

---

## Deploy to Vercel (Frontend Only - Not Recommended)

Vercel is great for static sites but doesn't support long-running Node.js servers well. Use Replit, Render, or Railway instead for this full-stack app.

---

## Deploy to Heroku (Paid Only)

Heroku removed their free tier. Minimum cost is $7/month per dyno.

---

## Recommended Deployment Stack:

### For Development/Testing:

- **Replit** - Free, easy setup, great for testing

### For Production:

- **Render** - Free tier available, easy deployment
- **Railway** - $5 free credit, good performance
- **Replit** - Can upgrade to paid for always-on

### Database:

- **MongoDB Atlas** - Free M0 tier (512MB)

### Image Hosting:

- **Cloudinary** - Free tier (25 credits/month)

### AI Provider:

- **Groq** - Best free tier (30 req/min)
- **Gemini** - Cheap backup (15 req/min free)

---

## Troubleshooting Deployment:

### Issue: "Cannot connect to MongoDB"

- Check MongoDB Atlas IP whitelist (allow 0.0.0.0/0 for all IPs)
- Verify connection string is correct
- Ensure database user has read/write permissions

### Issue: "Google OAuth not working"

- Verify redirect URI matches exactly (including https://)
- Check Google Console credentials
- Ensure `CALLBACK_URL` and `CLIENT_URL` are set correctly

### Issue: "Images not uploading"

- Verify Cloudinary credentials
- Check Cloudinary upload preset settings
- Review browser console for errors

### Issue: "AI generation failing"

- Verify API key is correct
- Check API provider status
- Try different AI model from dropdown
- Review server logs for specific errors

---

## Post-Deployment Checklist:

- [ ] MongoDB connected successfully
- [ ] Google OAuth working (can login)
- [ ] Images uploading to Cloudinary
- [ ] AI mission generation working
- [ ] Public galleries accessible
- [ ] All environment variables set
- [ ] HTTPS enabled
- [ ] Domain configured (optional)

---

## Need Help?

1. Check server logs in deployment platform
2. Check browser console for frontend errors
3. Verify all environment variables are set
4. Review [README.md](README.md) for setup details
5. Check [AI_PROVIDERS_SETUP.md](AI_PROVIDERS_SETUP.md) for AI issues

---

**Ready to deploy? Start with Replit for the easiest experience!** 🚀
