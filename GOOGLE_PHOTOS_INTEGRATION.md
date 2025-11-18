# 📸 Google Photos Integration - Replace Cloudinary

## Overview

Google Photos is a **superior alternative** to Cloudinary for the Mission Gallery platform. This document outlines how to integrate Google Photos as the primary image storage solution.

---

## Why Google Photos > Cloudinary

### Cost Comparison

| Feature       | Cloudinary Free | Cloudinary Paid | Google Photos Free | Google Photos Paid |
| ------------- | --------------- | --------------- | ------------------ | ------------------ |
| Storage       | 25 GB           | 100 GB = $99/mo | 15 GB              | 100 GB = $1.99/mo  |
| Bandwidth     | 25 GB/mo        | 100 GB = $99/mo | Unlimited          | Unlimited          |
| API Access    | Yes             | Yes             | Yes (better)       | Yes (better)       |
| **Cost/Year** | **$0**          | **$1,188**      | **$0**             | **$24**            |

**Savings: $1,164/year** (or $1,176/year if you need 100 GB)

### Feature Comparison

| Feature               | Cloudinary      | Google Photos          |
| --------------------- | --------------- | ---------------------- |
| Image Transformations | ✅ Excellent    | ⚠️ Basic (resize only) |
| CDN                   | ✅ Global       | ✅ Google's CDN        |
| API Quality           | ✅ Good         | ✅ Excellent           |
| Direct Links          | ✅ Yes          | ✅ Yes                 |
| Auto-Backup           | ❌ No           | ✅ Yes                 |
| Smart Search          | ❌ No           | ✅ Yes (AI-powered)    |
| Face Detection        | ❌ No           | ✅ Yes                 |
| Auto-Enhance          | ❌ No           | ✅ Yes                 |
| Mobile App            | ❌ No           | ✅ Yes (iOS/Android)   |
| Already Using         | ❌ Probably not | ✅ Most people         |

---

## Test Page

**URL:** `/test/google-photos`

Navigate to: `http://localhost:5175/test/google-photos`

### Features:

- Google OAuth authentication
- List all albums
- View photos in albums
- Upload photos to Google Photos
- Copy direct URLs
- Test API integration

---

## Setup Guide

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project: "Mission Gallery"
3. Enable APIs:
   - Google Photos Library API
   - (Already have: Google+ API for OAuth)

### 2. Create OAuth Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth 2.0 Client ID**
3. Application type: **Web application**
4. Name: "Mission Gallery - Google Photos"
5. Authorized redirect URIs:
   ```
   http://localhost:5175/test/google-photos
   https://your-domain.com/test/google-photos
   ```
6. Copy **Client ID** and **Client Secret**

### 3. Add to Environment Variables

```env
# .env file
VITE_GOOGLE_PHOTOS_CLIENT_ID=your_client_id_here.apps.googleusercontent.com

# Backend .env
GOOGLE_PHOTOS_CLIENT_SECRET=your_client_secret_here
```

### 4. Install Dependencies

```bash
# No new dependencies needed!
# Google Photos API uses standard fetch()
```

---

## Implementation Plan

### Phase 1: Backend Integration (2-3 hours)

**Create Google Photos Service:**

```javascript
// server/services/googlePhotosService.js
import axios from "axios";

export async function uploadToGooglePhotos(file, accessToken) {
  // Step 1: Upload bytes
  const uploadResponse = await axios.post(
    "https://photoslibrary.googleapis.com/v1/uploads",
    file.buffer,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/octet-stream",
        "X-Goog-Upload-File-Name": file.originalname,
        "X-Goog-Upload-Protocol": "raw",
      },
    }
  );

  const uploadToken = uploadResponse.data;

  // Step 2: Create media item
  const createResponse = await axios.post(
    "https://photoslibrary.googleapis.com/v1/mediaItems:batchCreate",
    {
      newMediaItems: [
        {
          description: file.originalname,
          simpleMediaItem: {
            uploadToken: uploadToken,
          },
        },
      ],
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );

  const mediaItem = createResponse.data.newMediaItemResults[0].mediaItem;

  return {
    url: mediaItem.baseUrl,
    id: mediaItem.id,
    filename: mediaItem.filename,
  };
}

export async function getPhotoUrl(baseUrl, width = 2048, height = null) {
  // Google Photos URL parameters
  // =w2048 = width 2048px
  // =h1080 = height 1080px
  // =w2048-h1080 = both
  // =w2048-h1080-c = crop to fit

  if (height) {
    return `${baseUrl}=w${width}-h${height}`;
  }
  return `${baseUrl}=w${width}`;
}
```

**Update Image Model:**

```javascript
// server/models/Image.js
const imageSchema = new mongoose.Schema({
  // ... existing fields ...

  // Google Photos fields
  googlePhotosId: String,
  googlePhotosBaseUrl: String, // Store base URL

  // Deprecated Cloudinary fields (keep for migration)
  cloudinaryPublicId: String,
  cloudinaryUrl: String,
});

// Virtual for display URL
imageSchema.virtual("displayUrl").get(function () {
  if (this.googlePhotosBaseUrl) {
    return `${this.googlePhotosBaseUrl}=w2048`;
  }
  return this.cloudinaryUrl; // Fallback for old images
});
```

**Update Upload Route:**

```javascript
// server/routes/images.js
router.post(
  "/upload/:missionId",
  auth,
  upload.array("images"),
  async (req, res) => {
    try {
      const { accessToken } = req.body; // Google Photos access token

      const uploadedImages = [];

      for (const file of req.files) {
        // Upload to Google Photos instead of Cloudinary
        const googlePhoto = await uploadToGooglePhotos(file, accessToken);

        const image = new Image({
          missionId: req.params.missionId,
          userId: req.user.id,
          googlePhotosId: googlePhoto.id,
          googlePhotosBaseUrl: googlePhoto.url,
          title: file.originalname,
          // ... other fields
        });

        await image.save();
        uploadedImages.push(image);
      }

      res.json(uploadedImages);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);
```

### Phase 2: Frontend Integration (2-3 hours)

**Add Google OAuth to Auth Context:**

```javascript
// src/context/AuthContext.jsx
export function AuthProvider({ children }) {
  const [googlePhotosToken, setGooglePhotosToken] = useState(null);

  const connectGooglePhotos = () => {
    const authUrl =
      `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${GOOGLE_PHOTOS_CLIENT_ID}&` +
      `redirect_uri=${window.location.origin}/auth/google-photos&` +
      `response_type=token&` +
      `scope=https://www.googleapis.com/auth/photoslibrary`;

    window.location.href = authUrl;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        googlePhotosToken,
        connectGooglePhotos,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
```

**Update Image Upload Component:**

```javascript
// In MissionDetail.jsx
const handleImageUpload = async (files) => {
  const { googlePhotosToken } = useAuth();

  if (!googlePhotosToken) {
    // Prompt user to connect Google Photos
    alert("Please connect Google Photos first");
    return;
  }

  const formData = new FormData();
  files.forEach((file) => formData.append("images", file));
  formData.append("accessToken", googlePhotosToken);

  await axios.post(`/api/images/upload/${missionId}`, formData);
};
```

**Update Image Display:**

```javascript
// Use Google Photos URLs with size parameters
<img
  src={`${image.googlePhotosBaseUrl}=w800`}
  srcSet={`
    ${image.googlePhotosBaseUrl}=w400 400w,
    ${image.googlePhotosBaseUrl}=w800 800w,
    ${image.googlePhotosBaseUrl}=w1200 1200w,
    ${image.googlePhotosBaseUrl}=w2048 2048w
  `}
  sizes="(max-width: 768px) 100vw, 50vw"
  alt={image.title}
/>
```

### Phase 3: Migration (1-2 hours)

**Migrate Existing Cloudinary Images:**

```javascript
// server/scripts/migrateToGooglePhotos.js
async function migrateImage(image, accessToken) {
  // Download from Cloudinary
  const response = await axios.get(image.cloudinaryUrl, {
    responseType: "arraybuffer",
  });

  // Upload to Google Photos
  const googlePhoto = await uploadToGooglePhotos(
    {
      buffer: response.data,
      originalname: image.title,
    },
    accessToken
  );

  // Update database
  image.googlePhotosId = googlePhoto.id;
  image.googlePhotosBaseUrl = googlePhoto.url;
  await image.save();

  console.log(`Migrated: ${image.title}`);
}

// Run migration
const images = await Image.find({ googlePhotosId: { $exists: false } });
for (const image of images) {
  await migrateImage(image, ADMIN_ACCESS_TOKEN);
}
```

---

## Workflow: Apple Photos → Google Photos → Mission Gallery

### Recommended User Workflow:

1. **Organize in Apple Photos:**

   - Create "Finished" album
   - Add portfolio-worthy photos
   - Edit and enhance

2. **Export from Apple Photos:**

   - Select album
   - File → Export → Export Unmodified Originals
   - Save to local folder

3. **Upload to Google Photos:**

   - Open Mission Gallery
   - Go to mission detail page
   - Click "Upload Images"
   - Select exported photos
   - Photos upload to Google Photos automatically

4. **Manage in Mission Gallery:**
   - Photos stored in Google Photos
   - Mission Gallery links to Google Photos URLs
   - Create galleries, enable print sales, etc.

### Benefits of This Workflow:

- ✅ Apple Photos for organization and editing
- ✅ Google Photos for cloud storage and backup
- ✅ Mission Gallery for public presentation
- ✅ No duplicate storage costs
- ✅ Best tool for each job

---

## URL Parameters

Google Photos supports dynamic URL parameters for image transformation:

```javascript
// Size
baseUrl + '=w2048'        // Width 2048px
baseUrl + '=h1080'        // Height 1080px
baseUrl + '=w2048-h1080'  // Both dimensions

// Crop
baseUrl + '=w800-h800-c'  // Crop to square

// Quality
baseUrl + '=w2048-l90'    // 90% quality (lossy)
baseUrl + '=w2048-l100'   // 100% quality (lossless)

// Format
baseUrl + '=w2048-rw'     // Force re-encode (better compression)

// Download
baseUrl + '=d'            // Force download

// Examples
${baseUrl}=w400           // Thumbnail
${baseUrl}=w800           // Medium
${baseUrl}=w2048          // Full size
${baseUrl}=w2048-h1080-c  // Cover image (cropped)
```

---

## API Limits

### Google Photos API Quotas:

- **Requests per day:** 10,000 (free)
- **Requests per 100 seconds:** 1,000
- **Upload size:** 200 MB per file
- **Storage:** 15 GB free, 100 GB for $1.99/mo

### Comparison to Cloudinary:

| Metric         | Cloudinary Free | Google Photos Free |
| -------------- | --------------- | ------------------ |
| Daily Requests | Unlimited       | 10,000             |
| Storage        | 25 GB           | 15 GB              |
| Bandwidth      | 25 GB/mo        | Unlimited          |
| File Size      | 10 MB           | 200 MB             |

**Verdict:** Google Photos is better for most use cases.

---

## Security Considerations

### OAuth Token Storage:

```javascript
// Store in database per user
const userSchema = new mongoose.Schema({
  // ... existing fields ...
  googlePhotos: {
    accessToken: String,
    refreshToken: String,
    expiresAt: Date,
  },
});

// Refresh token when expired
async function getValidToken(user) {
  if (user.googlePhotos.expiresAt < new Date()) {
    // Refresh token
    const response = await axios.post("https://oauth2.googleapis.com/token", {
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: user.googlePhotos.refreshToken,
      grant_type: "refresh_token",
    });

    user.googlePhotos.accessToken = response.data.access_token;
    user.googlePhotos.expiresAt = new Date(
      Date.now() + response.data.expires_in * 1000
    );
    await user.save();
  }

  return user.googlePhotos.accessToken;
}
```

### Best Practices:

1. ✅ Store tokens encrypted in database
2. ✅ Use refresh tokens for long-term access
3. ✅ Never expose tokens in frontend
4. ✅ Validate tokens before each API call
5. ✅ Handle token expiration gracefully

---

## Advantages Over Cloudinary

### 1. Cost

- **98% cheaper** for paid tier ($24/year vs $1,188/year)
- Free tier is competitive (15 GB vs 25 GB)

### 2. Integration

- Users already have Google Photos
- Familiar interface
- Mobile app access
- Auto-backup

### 3. Features

- AI-powered search
- Face detection
- Auto-enhance
- Smart albums
- Memories

### 4. Reliability

- Google's infrastructure
- 99.9% uptime
- Global CDN
- Automatic backups

### 5. Flexibility

- Easy export
- No vendor lock-in
- Standard REST API
- Well-documented

---

## Disadvantages vs Cloudinary

### 1. Image Transformations

- ❌ No advanced transformations (blur, filters, effects)
- ❌ Only basic resize/crop
- ✅ But: Most use cases only need resize

### 2. API Complexity

- ⚠️ Two-step upload process (upload bytes, then create item)
- ⚠️ Token management required
- ✅ But: Better documented than Cloudinary

### 3. Quota Limits

- ⚠️ 10,000 requests/day (vs unlimited)
- ✅ But: More than enough for most users

---

## Migration Checklist

- [ ] Create Google Cloud project
- [ ] Enable Google Photos Library API
- [ ] Create OAuth credentials
- [ ] Add credentials to .env
- [ ] Create googlePhotosService.js
- [ ] Update Image model
- [ ] Update upload route
- [ ] Add Google OAuth to frontend
- [ ] Update image display components
- [ ] Test upload flow
- [ ] Test image display
- [ ] Migrate existing Cloudinary images
- [ ] Update documentation
- [ ] Deploy to production

---

## Estimated Timeline

- **Setup:** 30 minutes
- **Backend Integration:** 2-3 hours
- **Frontend Integration:** 2-3 hours
- **Testing:** 1-2 hours
- **Migration:** 1-2 hours
- **Total:** 1 day

---

## Recommendation

**✅ Switch to Google Photos**

**Reasons:**

1. **Cost:** Save $1,164/year
2. **Features:** Better API, smart features, mobile app
3. **Integration:** Users already have it
4. **Reliability:** Google's infrastructure
5. **Flexibility:** No vendor lock-in

**When to Keep Cloudinary:**

- If you need advanced image transformations
- If you're already heavily invested
- If you need more than 10,000 API calls/day

**For Mission Gallery:** Google Photos is the better choice.

---

## Next Steps

1. **Test the integration:** Go to `/test/google-photos`
2. **Set up OAuth credentials**
3. **Implement backend service**
4. **Update frontend components**
5. **Migrate existing images**
6. **Deploy to production**

---

## Resources

- [Google Photos Library API](https://developers.google.com/photos/library/guides/overview)
- [OAuth 2.0 Setup](https://developers.google.com/identity/protocols/oauth2)
- [API Reference](https://developers.google.com/photos/library/reference/rest)
- [Quotas and Limits](https://developers.google.com/photos/library/guides/api-limits-quotas)
