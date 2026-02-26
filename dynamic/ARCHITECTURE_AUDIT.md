# Mission Gallery - Complete Architecture Audit & Rebuild Plan

## Current State Analysis

### Core Requirements (User Specified)
1. **Static pages as foundation** - Gallery, Portfolio, About pages are the primary UI
2. **Lightroom as image source** - All photos come from Adobe Lightroom API
3. **Web-ready image renditions** - Pull optimized renders from Lightroom (2048px, thumbnails)
4. **AI functions working** - About refinement, Mission generation, Gallery enhancement
5. **Gallery data storage** - Store gallery metadata in MongoDB, images referenced from Lightroom
6. **Everything should work** - Complete end-to-end workflow

### Current Architecture Components

#### 1. Static Pages (Foundation)
- `/pages/gallery.html` - Main gallery showcase
- `/pages/portfolio.html` - Portfolio display
- `/pages/about.html` - About page (hydrates from backend)
- `/assets/js/tia-data.js` - Data layer for static pages
- **Config Source**: Cloudinary JSON (`tia-config.json`)

#### 2. React Admin (Management)
- `/src/pages/AdminDashboard.jsx` - Main admin interface
- `/src/pages/CreateGallery.jsx` - Gallery creation (currently Cloudinary-dependent)
- `/src/pages/LightroomTest.jsx` - Lightroom integration testing
- `/src/components/AboutMeEditor.jsx` - About content editor with AI
- `/admin/index.html` - Legacy static admin

#### 3. Backend API
- **Express server** on Render
- **MongoDB** for data storage
- **Routes**:
  - `/api/adobe/*` - Lightroom OAuth and image proxy
  - `/api/galleries/*` - Gallery CRUD with Lightroom support
  - `/api/missions/*` - Mission planning with AI
  - `/api/about/*` - About content with AI refinement
  - `/api/cloudinary/*` - Cloudinary integration (to be removed)

#### 4. Image Sources
- **Primary**: Adobe Lightroom API
- **Legacy**: Cloudinary (to be phased out)
- **Rendition URLs**: 
  - Thumbnail: `/rels/rendition_type/thumbnail2x`
  - Web: `/rels/rendition_type/2048`
  - Full: `/rels/rendition_type/fullsize`

### Problems Identified

1. **Dual Image Systems**: Cloudinary and Lightroom competing
2. **CreateGallery depends on Cloudinary**: Tries to load folders that don't exist
3. **Static pages can't load photos**: No `tia-config.json` published yet
4. **Image URL handling**: Need consistent Lightroom rendition URLs
5. **Gallery model confusion**: Has both `cloudinaryAssets` and `lightroomAlbum`

## Recommended Architecture

### Unified System Design

```
┌─────────────────────────────────────────────────────────────┐
│                    USER EXPERIENCE                          │
├─────────────────────────────────────────────────────────────┤
│  Static Pages (Public)          │  React Admin (Private)    │
│  - gallery.html                 │  - AdminDashboard         │
│  - portfolio.html               │  - LightroomGalleryEditor │
│  - about.html                   │  - AboutMeEditor          │
│                                 │  - MissionPlanner         │
└─────────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                   DATA LAYER                                │
├─────────────────────────────────────────────────────────────┤
│  TIA Config (Cloudinary JSON)   │  MongoDB Collections      │
│  - series metadata              │  - galleries              │
│  - photo assignments            │  - missions               │
│  - Lightroom asset URLs         │  - about                  │
│  - portfolio slots              │  - users                  │
└─────────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                 IMAGE SOURCE                                │
├─────────────────────────────────────────────────────────────┤
│           Adobe Lightroom API (Primary)                     │
│  - OAuth authentication                                     │
│  - Album/catalog browsing                                   │
│  - Web-ready renditions (2048px, thumbnails)                │
│  - Direct CDN URLs (no proxy needed)                        │
└─────────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                   AI SERVICES                               │
├─────────────────────────────────────────────────────────────┤
│  - OpenAI (About refinement)                                │
│  - Groq (Missions, Galleries, Photos)                       │
│  - Gemini (Fallback)                                        │
└─────────────────────────────────────────────────────────────┘
```

### Key Decisions

1. **Remove Cloudinary dependency** from gallery creation
2. **Keep Cloudinary** only for TIA config storage (JSON file hosting)
3. **Lightroom as single source** for all images
4. **Direct Lightroom URLs** in galleries (no backend proxy)
5. **TIA config** bridges static pages and admin data

## Implementation Plan

### Phase 1: Core Lightroom Integration ✅
- [x] Adobe OAuth working
- [x] Lightroom API endpoints functional
- [x] Gallery model supports Lightroom albums
- [x] Backend routes for Lightroom galleries

### Phase 2: Gallery Workflow (Next)
- [ ] Create `LightroomGalleryEditor` component
- [ ] Remove Cloudinary dependency from gallery creation
- [ ] Store Lightroom rendition URLs in gallery documents
- [ ] Sync gallery data to TIA config for static pages

### Phase 3: Static Page Integration
- [ ] Publish TIA config with Lightroom asset metadata
- [ ] Verify static pages load photos from config
- [ ] Test gallery.html with real Lightroom photos
- [ ] Test portfolio.html with assigned covers

### Phase 4: AI Functions Verification
- [ ] Test About Me AI refinement
- [ ] Test Mission generation with all providers
- [ ] Test Gallery description enhancement
- [ ] Verify all API keys are configured

### Phase 5: Complete Workflow
- [ ] Admin: Authorize Lightroom
- [ ] Admin: Create gallery from Lightroom album
- [ ] Admin: Publish gallery
- [ ] Static: View gallery with photos
- [ ] Admin: Edit About with AI
- [ ] Static: See updated About content

## Recommended Code Changes

### 1. New Component: `LightroomGalleryEditor.jsx`
Replace `CreateGallery.jsx` with Lightroom-focused component:
- Load Lightroom albums
- Select photos from album
- Store Lightroom rendition URLs
- Publish to MongoDB + TIA config

### 2. Update Gallery Model
Simplify to Lightroom-only:
```javascript
{
  title: String,
  description: String,
  lightroomAlbum: {
    id: String,
    name: String,
    catalogId: String
  },
  lightroomPhotos: [{
    assetId: String,
    thumbnail: String,  // Direct Lightroom URL
    web: String,        // 2048px rendition
    full: String,       // Full-size rendition
    filename: String,
    metadata: Object
  }],
  isPublic: Boolean,
  slug: String
}
```

### 3. TIA Config Sync
Backend route to publish gallery data to Cloudinary config:
```javascript
POST /api/galleries/:id/publish-to-static
- Fetch gallery from MongoDB
- Build TIA config structure
- Upload to Cloudinary as tia-config.json
- Invalidate cache
```

### 4. Remove Cloudinary Routes
Delete or deprecate:
- `/api/cloudinary/folders`
- `/api/cloudinary/resources`

### 5. Update Static Pages
Already working, just need config published.

## Environment Variables Required

```bash
# Adobe Lightroom ✅
ADOBE_CLIENT_ID=afd0ee2721d04f0c8fd9ac505713e014
ADOBE_CLIENT_SECRET=p8e-1xAlIzDHRkQEIapxsBSnXdf3w-M9yU-G

# AI Services ✅
OPENAI_API_KEY=sk-proj-...
GROQ_API_KEY=gsk_...
GEMINI_API_KEY=AIzaSy...
ANTHROPIC_API_KEY=sk-ant-...

# Cloudinary (for config storage only) ✅
CLOUDINARY_CLOUD_NAME=duxiir9lv
CLOUDINARY_API_KEY=251616931124225
CLOUDINARY_API_SECRET=oTewUjuvbf-2ayKgNGEIRO1qs6I

# Database ✅
MONGODB_URI=mongodb+srv://...

# Auth ✅
JWT_SECRET=mission-gallery-secret-key-change-this-to-random-string-12345
GOOGLE_CLIENT_ID=845751693086-...
GOOGLE_CLIENT_SECRET=GOCSPX-...

# URLs ✅
CLIENT_URL=https://mission-gallery-app.web.app
CALLBACK_URL=https://mission-gallery.onrender.com/auth/google/callback
```

All keys are present in `.env` ✅

## Next Steps

1. **Create LightroomGalleryEditor** - Clean Lightroom-only gallery creation
2. **Implement TIA config sync** - Publish gallery data to static pages
3. **Test complete workflow** - End-to-end verification
4. **Deploy and document** - Final working system

## Success Criteria

- [ ] Static pages display photos from Lightroom
- [ ] Admin can create galleries from Lightroom albums
- [ ] All AI functions work (About, Missions, Galleries)
- [ ] No Cloudinary folder errors
- [ ] Complete workflow documented
- [ ] System is maintainable and clear
