# Replit Setup - Step by Step

## ✅ Your Secrets Are Ready!

All your secrets have been saved to `REPLIT_SECRETS.txt` (not committed to git).

## 🚀 Deployment Steps

### Step 1: Create Repl

1. Go to https://replit.com
2. Click "Create Repl"
3. Choose "Import from GitHub"
4. Paste: `https://github.com/Rla102277/mission-gallery`
5. Click "Import from GitHub"

### Step 2: Add Secrets

1. In your new Repl, click the **lock icon** (🔒) in the left sidebar
2. Open `REPLIT_SECRETS.txt` on your local machine
3. Copy each secret one by one:
   - Click "New Secret" in Replit
   - Paste the key name (e.g., `MONGODB_URI`)
   - Paste the value
   - Click "Add Secret"

**Required Secrets (add these first):**

- ✅ MONGODB_URI
- ✅ SESSION_SECRET
- ✅ GROQ_API_KEY
- ✅ ADOBE_CLIENT_ID
- ✅ ADOBE_CLIENT_SECRET

### Step 3: Get Your Replit URL

After creating the Repl, Replit will assign you a URL like:

```
https://mission-gallery-yourusername.repl.co
```

### Step 4: Update URL Secrets

Go back to Secrets and update:

- `CLIENT_URL` = `https://mission-gallery-yourusername.repl.co`
- `CALLBACK_URL` = `https://mission-gallery-yourusername.repl.co/auth/google/callback`

### Step 5: Update Adobe Redirect URI

1. Go to https://developer.adobe.com/console
2. Open your project
3. Go to OAuth Web credentials
4. Add redirect URI: `https://mission-gallery-yourusername.repl.co/test/lightroom`
5. Save

### Step 6: Run!

Click the big green "Run" button at the top of Replit.

Wait for:

- ✅ Dependencies to install
- ✅ "Connected to MongoDB" message
- ✅ "Server running on port 3001" message

### Step 7: Test

1. Click "Open website" or visit your Replit URL
2. You should see the Mission Gallery homepage
3. Click "Login" to test authentication
4. Go to Admin → Lightroom to test Adobe integration

## 🎯 Quick Checklist

- [ ] Repl created from GitHub
- [ ] All required secrets added
- [ ] Replit URL obtained
- [ ] CLIENT_URL updated
- [ ] CALLBACK_URL updated
- [ ] Adobe redirect URI updated
- [ ] Clicked "Run"
- [ ] Site loads successfully
- [ ] Login works
- [ ] Lightroom connection works

## 🐛 Troubleshooting

**"Cannot connect to database"**

- Check MONGODB_URI is correct
- Verify MongoDB Atlas allows connections from 0.0.0.0/0

**"Adobe OAuth failed"**

- Ensure redirect URI in Adobe Console matches exactly
- Check ADOBE_CLIENT_ID and ADOBE_CLIENT_SECRET

**"Module not found"**

- Click "Shell" tab
- Run: `npm install`
- Click "Run" again

**"Port already in use"**

- Stop the Repl
- Click "Run" again

## 📝 Notes

- Keep `REPLIT_SECRETS.txt` safe on your local machine
- Never commit it to git (it's in .gitignore)
- You can always add more secrets later
- Free Replit tier works great for testing
- Consider upgrading for production use

## 🎉 Success!

Once running, your app will be live at your Replit URL with all features working:

- Mission planning with AI
- Lightroom integration
- Gallery management
- EXIF data extraction
- AI photo descriptions
- Public galleries

Enjoy! 🚀
