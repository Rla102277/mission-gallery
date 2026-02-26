# Firebase Quick Start - 5 Minutes

## 🚀 Deploy Frontend to Firebase

### Step 1: Install Firebase CLI

```bash
npm install -g firebase-tools
```

### Step 2: Login

```bash
firebase login
```

### Step 3: Initialize (First Time Only)

```bash
firebase init hosting
```

Choose:

- Use existing project or create new
- Public directory: `dist`
- Single-page app: `Yes`
- Overwrite index.html: `No`

### Step 4: Create Production Environment

```bash
cp .env.production.template .env.production
```

Edit `.env.production` with your values from REPLIT_SECRETS.txt:

```env
VITE_API_URL=https://your-replit-backend.repl.co/api
VITE_ADOBE_CLIENT_ID=your_adobe_client_id
VITE_GOOGLE_PHOTOS_CLIENT_ID=your_google_client_id
```

### Step 5: Deploy!

```bash
./deploy-firebase.sh
```

Or manually:

```bash
npm run build
firebase deploy --only hosting
```

## 📋 Post-Deployment Checklist

### 1. Update Backend CORS

Add Firebase domain to your backend CORS settings:

```javascript
// On Replit backend - server/index.js
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://mission-gallery.web.app",
      "https://mission-gallery.firebaseapp.com",
    ],
    credentials: true,
  })
);
```

### 2. Update OAuth Callbacks

**Google OAuth:**

- Go to: https://console.cloud.google.com
- APIs & Services → Credentials
- Add authorized redirect URI:
  - `https://your-project.web.app/auth/google/callback`

**Adobe Lightroom:**

- Go to: https://developer.adobe.com/console
- Your project → Credentials
- Add redirect URI:
  - `https://your-project.web.app/test/lightroom`

### 3. Test Deployment

- ✅ Homepage loads
- ✅ Login works
- ✅ Lightroom connection works
- ✅ Mission creation works
- ✅ Gallery viewing works

## 🎯 Recommended Setup

**Frontend:** Firebase Hosting (this deployment)
**Backend:** Keep on Replit (already working)
**Database:** MongoDB Atlas (already configured)

## 💡 Tips

- Firebase hosting is FREE for reasonable traffic
- Deploy updates with: `./deploy-firebase.sh`
- View logs: `firebase hosting:channel:list`
- Custom domain: `firebase hosting:sites:list`

## 🔧 Troubleshooting

**Build fails:**

```bash
rm -rf dist node_modules
npm install
npm run build
```

**CORS errors:**

- Check backend CORS includes Firebase domain
- Verify VITE_API_URL in .env.production

**OAuth fails:**

- Update callback URLs in Google/Adobe consoles
- Clear browser cache

## 📚 Full Documentation

See `FIREBASE_DEPLOYMENT.md` for complete guide.
