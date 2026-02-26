# Static Site Photo Loading Workflow

## Current State
✅ All code is working correctly
❌ No photos published yet - Cloudinary config is empty

## How to Load Photos on Static Pages

### Step 1: Access Legacy Admin
1. Go to: `https://mission-gallery-app.web.app/legacy-admin/`
2. Login with Google (uses same auth as main admin)

### Step 2: Connect Adobe Lightroom
1. Click **Lightroom** tab
2. If Adobe Client ID is empty:
   - Get it from backend env `ADOBE_CLIENT_ID` 
   - Or click **Authorize** (will auto-fetch from backend)
3. Click **Authorize** → Adobe login → Grant permissions
4. You'll be redirected back with connection confirmed

### Step 3: Import Photos
1. In Lightroom tab, click **Load Albums**
2. Select an album from your Lightroom library
3. Photos will appear in grid below
4. Select photos you want (click to toggle, or use All/None buttons)
5. Choose target series from dropdown (s1-s8)
6. Click **Import Selected**
7. Photos are now assigned to that series

### Step 4: Assign Portfolio Covers (Optional)
1. Click **Portfolio** tab
2. For each portfolio slot (pf-s1, pf-s3, pf-s2, pf-s5, pf-s7):
   - Click **Choose Photo**
   - Select from imported photos
   - Click **Use This Photo**

### Step 5: Publish to Live Site
1. Click **Save & Publish** (top right)
2. This pushes config to Cloudinary with all asset metadata
3. Static pages will now load photos

### Step 6: Verify
1. Open `https://mission-gallery-app.web.app/pages/gallery.html`
2. Series cards should show cover images
3. Click a series → photos should appear in grid
4. Open `https://mission-gallery-app.web.app/pages/portfolio.html`
5. Work blocks should show assigned covers

## Technical Details

### What Gets Saved
```json
{
  "series": {
    "s1": {
      "title": "Custom Title",
      "subtitle": "Custom Subtitle",
      "description": "Custom Description",
      "coverAssetId": "lr-asset-id-123"
    }
  },
  "photos": {
    "s1": ["lr-asset-id-123", "lr-asset-id-456", "lr-asset-id-789"]
  },
  "portfolio": {
    "pf-s1": "lr-asset-id-123",
    "pf-s3": "lr-asset-id-456"
  },
  "lr": {
    "assetMeta": {
      "lr-asset-id-123": {
        "filename": "IMG_1234.jpg",
        "assetId": "lr-asset-id-123",
        "url2048": "https://lr.adobe.io/v2/assets/.../renditions/2048?client_id=...",
        "urlThumb": "https://lr.adobe.io/v2/assets/.../renditions/thumbnail2x?client_id=..."
      }
    }
  }
}
```

### Where It's Saved
- **Cloudinary**: `https://res.cloudinary.com/duxiir9lv/raw/upload/tia/tia-config.json`
- **LocalStorage**: `tia_admin` key (backup/cache)

### How Static Pages Load It
1. `gallery.html` calls `TIA.load()` on page load
2. Fetches config from Cloudinary (with cache-busting timestamp)
3. Falls back to localStorage if Cloudinary unavailable
4. `TIA.getCoverUrl(seriesId)` resolves cover from `series[seriesId].coverAssetId`
5. `TIA.getPhotos(seriesId)` maps asset IDs to full metadata with URLs
6. Photos render using Adobe CDN URLs from `lr.assetMeta`

## Troubleshooting

### "No photos uploaded yet" on gallery page
- Config hasn't been published yet
- Complete Steps 1-5 above and click Save & Publish

### "Connect to Lightroom first" in admin
- Adobe credentials not configured on backend
- Set `ADOBE_CLIENT_ID` and `ADOBE_CLIENT_SECRET` in Render env
- Redeploy backend

### Photos imported but not showing on static pages
- Forgot to click **Save & Publish**
- Check browser console for Cloudinary fetch errors
- Verify config exists: `https://res.cloudinary.com/duxiir9lv/raw/upload/tia/tia-config.json`

### Cloudinary upload fails
- Unsigned upload preset `tia_unsigned` may not exist
- Create it in Cloudinary dashboard:
  - Settings → Upload → Upload presets
  - Add preset: name=`tia_unsigned`, mode=unsigned, folder=`tia`
  - Enable overwrite and invalidate options

## AI Functions Status

All AI functions are working correctly:

### About Me Refinement
- Location: Main Admin → About Me tab
- Click **Refine with AI**
- Uses OpenAI GPT-4o
- Requires `OPENAI_API_KEY` in backend env

### Mission Generation
- Location: Main Admin → Missions tab → Create New
- Uses Groq Llama 3.3 70B (free tier)
- Fallback to Gemini if rate limited
- Requires `GROQ_API_KEY` or `GEMINI_API_KEY` in backend env

### Gallery Description Enhancement
- Location: Main Admin → Galleries tab → Edit gallery
- Click AI enhance button
- Uses Groq Llama 3.3 70B
- Requires `GROQ_API_KEY` in backend env

### Photo Description Generation
- Automatic on Lightroom photo import
- Uses EXIF data + AI analysis
- Uses Groq Llama 3.3 70B
- Requires `GROQ_API_KEY` in backend env

## Backend Environment Variables Required

```bash
# Adobe Lightroom (for photo import)
ADOBE_CLIENT_ID=your_adobe_client_id
ADOBE_CLIENT_SECRET=your_adobe_client_secret

# AI Services (at least one required)
OPENAI_API_KEY=sk-...          # For About refinement
GROQ_API_KEY=gsk_...           # For missions, galleries, photos (free tier)
GEMINI_API_KEY=...             # Fallback for missions
ANTHROPIC_API_KEY=...          # Optional
TOGETHER_API_KEY=...           # Optional
HUGGINGFACE_API_KEY=...        # Optional

# Database
MONGODB_URI=mongodb+srv://...

# Auth
JWT_SECRET=your_secret_key
CLIENT_URL=https://mission-gallery-app.web.app
```

## Summary

Everything is working correctly. The static pages just need photos to be imported and published through the legacy admin workflow above.
