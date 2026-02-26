# Free Deployment Plan (No Firebase Blaze)

This project can run without paid Firebase by splitting responsibilities:

- **Frontend**: Firebase Hosting (free)
- **Backend API**: Free Node host (Render/Replit/Railway free tier)
- **Database**: MongoDB Atlas free tier

## 1) Deploy Backend API (free host)

Deploy this same repo as a backend service with:

- **Build command**: `npm install`
- **Start command**: `npm run start:api`

The backend server entrypoint is `server/index.js`.

### Required backend environment variables

```bash
MONGODB_URI=your_mongodb_connection_string
SESSION_SECRET=your_random_long_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
CLIENT_URL=https://mission-gallery-app.web.app
CALLBACK_URL=https://YOUR_BACKEND_DOMAIN/auth/google/callback
PORT=3001
```

## 2) Configure Google OAuth

In Google Cloud Console, for your OAuth client:

- **Authorized JavaScript origins**
  - `https://mission-gallery-app.web.app`
  - `https://mission-gallery-app.firebaseapp.com`
- **Authorized redirect URIs**
  - `https://YOUR_BACKEND_DOMAIN/auth/google/callback`

## 3) Point frontend to backend

Create `.env.production` in this repo:

```bash
VITE_API_URL=https://YOUR_BACKEND_DOMAIN/api
```

Then rebuild and redeploy hosting:

```bash
npm run build
firebase deploy --only hosting
```

## 4) Verify login flow

1. Open `https://mission-gallery-app.web.app/login`
2. Confirm backend status shows connected
3. Click **Continue with Google**
4. After OAuth, confirm redirect returns to app with active admin session

## Notes

- Firebase `firebase.json` is now **hosting-only** to avoid Functions/Blaze requirements.
- API/auth calls are expected to go to your external backend via `VITE_API_URL`.
