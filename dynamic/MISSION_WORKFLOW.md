# New Mission Workflow

## Overview

Missions are now the primary planning tool. You create a mission plan, link photos to specific mission ideas, then publish as a gallery.

## Workflow Steps

### 1. Create Mission Plan

- Generate AI mission plan with detailed ideas
- Each mission idea includes:
  - Title & location
  - Camera gear recommendations
  - Settings (aperture, ISO, shutter speed)
  - Creative ideas
  - Special notes
- Save as mission (no gallery yet)

### 2. Link Lightroom Album (Optional)

- From mission detail page
- Click "Link Lightroom Album"
- Select from your Lightroom albums
- Photos become available for linking

### 3. Link Photos to Mission Ideas

- Each mission idea can be linked to photos
- Two types of photos:
  - **Uploaded photos** - From your uploads
  - **Lightroom photos** - From linked album
- Drag & drop or click to link
- Multiple photos per mission idea

### 4. Publish as Gallery

- Click "Publish as Gallery"
- Creates gallery with all linked photos
- Gallery inherits mission details
- Can be made public
- Maintains link to mission

## Data Structure

### Mission Model

```javascript
{
  title: String,
  description: String,
  location: String,

  // AI-generated structured plan
  structuredPlan: {
    locations: [String],
    coreMissions: [...],
    diptychs: [...],
    triptychs: [...]
  },

  // Individual mission ideas with photo links
  missionIdeas: [{
    id: String,
    title: String,
    location: String,
    description: String,
    gear: String,
    settings: {
      mode: String,
      aperture: String,
      iso: String,
      shutterSpeed: String
    },
    specialNotes: String,
    linkedPhotos: [ObjectId], // Uploaded photos
    lightroomPhotoIds: [String] // Lightroom photos
  }],

  // Lightroom integration
  lightroomAlbum: {
    id: String,
    name: String,
    catalogId: String
  },

  // Published gallery reference
  publishedGalleryId: ObjectId
}
```

### Gallery Model

```javascript
{
  title: String,
  description: String,
  thumbnail: {
    url: String,
    publicId: String
  },
  missionId: ObjectId, // Link back to mission
  images: [{
    imageId: ObjectId,
    order: Number,
    layoutType: String
  }],
  lightroomAlbum: {...},
  isPublic: Boolean
}
```

## API Endpoints

### Mission Endpoints

- `POST /api/missions/:id/link-lightroom` - Link Lightroom album
- `POST /api/missions/:id/ideas/:ideaId/link-photos` - Link photos to idea
- `POST /api/missions/:id/publish-gallery` - Publish as gallery
- `PUT /api/missions/:id` - Update mission details

### Gallery Endpoints

- `POST /api/galleries/:id/create-lightroom-album` - Create Lightroom album
- `POST /api/galleries/:id/link-lightroom` - Link existing album
- `PUT /api/galleries/:id` - Update gallery (including thumbnail)

## UI Components Needed

### Mission Detail Page

- [x] Mission header with details
- [x] Structured plan display
- [ ] Lightroom album linker
- [ ] Mission ideas list with photo linking
- [ ] Photo selector modal
- [ ] Publish gallery button

### Gallery List

- [ ] Thumbnail display
- [ ] Grid/list view toggle
- [ ] Filter by mission

### Photo Linking UI

- [ ] Drag & drop interface
- [ ] Photo grid selector
- [ ] Lightroom photo browser
- [ ] Link status indicators

## Implementation Status

### Backend ✅

- [x] Mission model updated
- [x] Gallery model updated with thumbnail
- [x] Link Lightroom album route
- [x] Link photos to ideas route
- [x] Publish gallery route

### Frontend 🚧

- [x] Mission creation saves ideas
- [ ] Mission detail shows ideas
- [ ] Lightroom album linker UI
- [ ] Photo linking interface
- [ ] Gallery thumbnail display
- [ ] Publish gallery button

## Next Steps

1. Update MissionDetailEnhanced to show mission ideas
2. Add Lightroom album linker UI
3. Create photo linking interface
4. Add publish gallery button
5. Update gallery list to show thumbnails
6. Test complete workflow
