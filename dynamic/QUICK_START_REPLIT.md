# Quick Start - Replit Deployment

## 🚀 Deploy in 5 Minutes

### 1. Import to Replit

- Go to https://replit.com
- Click "Create Repl" → "Import from GitHub"
- Paste: `https://github.com/Rla102277/mission-gallery`

### 2. Add Environment Secrets

Click the lock icon (Secrets) and add:

```
MONGODB_URI=your-mongodb-connection-string
SESSION_SECRET=any-random-string-here
GROQ_API_KEY=your-groq-api-key
ADOBE_CLIENT_ID=your-adobe-client-id
ADOBE_CLIENT_SECRET=your-adobe-client-secret
CLIENT_URL=https://your-repl-url.repl.co
```

### 3. Get Your URLs

After creating the Repl, Replit will give you a URL like:
`https://mission-gallery-username.repl.co`

Update these secrets:

- `CLIENT_URL` = your Repl URL
- `CALLBACK_URL` = your Repl URL + `/auth/google/callback`

### 4. Configure Adobe OAuth

- Go to https://developer.adobe.com/console
- Add redirect URI: `https://your-repl-url.repl.co/test/lightroom`

### 5. Click Run!

That's it! Your app is live.

## 📋 Checklist

- [ ] MongoDB Atlas cluster created
- [ ] Groq API key obtained
- [ ] Adobe Developer project created
- [ ] All secrets added to Replit
- [ ] URLs updated in secrets
- [ ] Adobe redirect URI configured
- [ ] Clicked "Run" button

## 🎯 First Steps After Deployment

1. Visit your Repl URL
2. Click "Login" (Google OAuth)
3. Go to Admin → Lightroom tab
4. Connect to Adobe Lightroom
5. Create your first mission!

## 💡 Tips

- **Free MongoDB**: Use MongoDB Atlas free tier (512MB)
- **Free Groq**: Groq offers free API access
- **Adobe**: Free developer account works
- **Always On**: Upgrade Replit for 24/7 uptime

## 🐛 Common Issues

**"Cannot connect to database"**

- Check MongoDB Atlas whitelist (allow 0.0.0.0/0)
- Verify MONGODB_URI is correct

**"Adobe OAuth failed"**

- Ensure redirect URI matches exactly
- Check CLIENT_ID and CLIENT_SECRET

**"Port already in use"**

- Restart the Repl
- Check .replit port configuration

## 📚 Full Documentation

See `REPLIT_DEPLOYMENT.md` for detailed instructions.
