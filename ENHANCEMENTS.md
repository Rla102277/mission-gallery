# Mission Gallery Enhancements

## New Features Implemented

### 1. Structured AI Mission Generation

The mission generator now creates detailed, day-by-day mission plans with:

- **Day Structure**: Each day has a title, locations, and missions
- **Core Missions**: Individual photo missions with:
  - Specific gear recommendations (camera + lens)
  - Detailed camera settings (mode, aperture, ISO, shutter speed)
  - Special notes (filters, techniques)
  - Creative ideas and goals
- **Series Missions**: Diptychs and Triptychs that combine core missions

#### API Usage:

```javascript
POST /api/missions/generate
{
  "location": "Iceland",
  "summary": "7-day winter photography trip...",
  "duration": "7 days",
  "gearRoles": "GFX 100S II with 32-64mm and 135mm, X-E5 with 10-24mm, Hexar RF with 28mm, Insta360, iPhone",
  "includeDiptychs": true,
  "includeTriptychs": true
}
```

#### Response Format:

```json
{
  "missions": [
    {
      "dayNumber": 1,
      "title": "Day 1 - The Dragon's Coast",
      "locations": ["Seljalandsfoss", "Skógafoss"],
      "coreMissions": [
        {
          "id": "M1",
          "title": "Soaked Hero at the Cave Mouth",
          "location": "Seljalandsfoss",
          "gear": "X-E5 + 10-24mm @ 12mm",
          "settings": {
            "mode": "A",
            "aperture": "f/8",
            "iso": "800-1600",
            "shutterSpeed": "1/125-1/250"
          },
          "specialNotes": "Black Mist OFF (heavy spray)",
          "idea": "From behind the falls, cave arch framing subject..."
        }
      ],
      "seriesMissions": [
        {
          "id": "S1",
          "title": "Seljalandsfoss Triptych",
          "type": "triptych",
          "frames": [
            {
              "label": "Frame A",
              "description": "Wide view of falls",
              "missionRef": "M1"
            },
            {
              "label": "Frame B",
              "description": "Inside cave",
              "missionRef": "M2"
            },
            {
              "label": "Frame C",
              "description": "Portrait after",
              "missionRef": "M3"
            }
          ]
        }
      ]
    }
  ]
}
```

### 2. Gear List from User Inventory

The gear list generator now accepts your existing gear inventory and creates a curated packing list.

#### API Usage:

```javascript
POST /api/missions/:missionId/gear
{
  "duration": "7 days",
  "userInputs": {
    "userGearInventory": `
      GFX 100S II ("The Portfolio"): 100MP, IBIS hero camera
      Lenses: GF 32-64mm f/4, Mitakon 135mm f/2.5
      X-E5 ("The Specialist"): Ultra-Wide dedicated
      Lens: XF 10-24mm f/4
      Konica Hexar RF ("The Artist"): Low-light, film-look
      Lens: 28mm f/2.8
      Insta360 ("The Experience"): 360° POV camera
      iPhone: Diary, quick clips, timelapses
    `,
    "weatherConditions": "Winter, cold, possible snow",
    "photoStyle": "Landscape and adventure photography",
    "budget": "Professional gear"
  }
}
```

#### Response:

```json
{
  "gearList": [
    {
      "name": "GFX 100S II",
      "category": "Camera Body",
      "description": "100MP medium format with IBIS",
      "specifications": {
        "resolution": "102MP",
        "sensor": "Medium Format",
        "stabilization": "5-axis IBIS"
      },
      "recommendation": "Primary camera for portfolio shots",
      "usageScenarios": [
        "Landscape photography at Jökulsárlón",
        "Vestrahorn sunset shots",
        "Diamond Beach ice details"
      ],
      "aiGenerated": true
    }
  ]
}
```

### 3. About Me Page with AI Refinement

Create and refine your About Me page with AI assistance.

#### API Endpoints:

**Get About Page:**

```javascript
GET / api / about;
```

**Create/Update:**

```javascript
POST /api/about
{
  "rawText": "Your original text...",
  "refinedText": "AI refined version...",
  "style": "professional", // or "casual", "artistic", "adventurous"
  "isPublished": false
}
```

**AI Refine:**

```javascript
POST /api/about/refine
{
  "rawText": "I love taking photos of nature and landscapes...",
  "style": "professional"
}
```

**Response:**

```json
{
  "about": {
    "rawText": "Original text...",
    "refinedText": "Polished, engaging text...",
    "style": "professional",
    "isPublished": false
  },
  "suggestions": [
    "Added more specific details about your photography style",
    "Improved flow between paragraphs",
    "Highlighted your unique perspective"
  ]
}
```

**Toggle Publish:**

```javascript
PATCH / api / about / publish;
```

**Public View:**

```javascript
GET /api/about/public/:userId
```

### 4. Admin Gallery Controls

Enhanced gallery management with show/hide controls for individual images.

#### Features:

- **Image Visibility Toggle**: Mark images as public/private
- **Gallery Filtering**: Public galleries only show images marked as public
- **Admin View**: Mission galleries show all images with visibility indicators
- **Bulk Operations**: Update multiple image visibility states

#### Usage in Frontend:

```javascript
// Toggle single image visibility
PUT /api/images/:imageId
{
  "isPublic": true
}

// Images in public galleries are automatically filtered
GET /api/galleries/public/:slug
// Only returns images where isPublic === true
```

### 5. Cloudinary Integration

All images are now stored in Cloudinary instead of local storage.

#### Setup:

1. Create a Cloudinary account at https://cloudinary.com
2. Get your credentials from the dashboard
3. Add to `.env`:

```env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

#### Features:

- **Automatic Upload**: Images uploaded directly to Cloudinary
- **Automatic Thumbnails**: Generated on-the-fly with URL parameters
- **Optimized Delivery**: Automatic format and quality optimization
- **CDN**: Fast global delivery
- **Transformations**: Resize, crop, and optimize on-the-fly

#### Image URLs:

```javascript
// Full image
image.url; // Direct Cloudinary URL

// Thumbnail (400x400)
image.thumbnailUrl; // Pre-generated thumbnail URL

// Custom transformations via Cloudinary URL API
// e.g., https://res.cloudinary.com/your-cloud/image/upload/w_800,h_600,c_fill/image-id.jpg
```

#### Benefits:

- No local storage management
- Automatic backups
- Better performance
- Scalable infrastructure
- Built-in CDN

## Installation

Install new dependencies:

```bash
npm install
```

## Environment Variables

Update your `.env` file:

```env
# Existing variables...
MONGODB_URI=mongodb+srv://...
SESSION_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
OPENAI_API_KEY=...

# New Cloudinary variables
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Updated ports
CALLBACK_URL=http://localhost:3001/auth/google/callback
CLIENT_URL=http://localhost:5173
PORT=3001
```

## Frontend Updates Needed

To fully utilize these features, you'll need to update the frontend:

### 1. Mission Generator Form

Add fields for:

- Duration input
- Gear roles textarea
- Display structured mission format (days, core missions, series missions)

### 2. Gear List Generator

Add:

- Gear inventory textarea
- Display usage scenarios for each item

### 3. About Me Page

Create new page with:

- Text editor for raw text
- Style selector (professional/casual/artistic/adventurous)
- "Refine with AI" button
- Side-by-side comparison
- Publish toggle

### 4. Gallery Admin Controls

Update gallery editor:

- Show/hide toggle for each image
- Visual indicator (eye icon) for public/private status
- Bulk select and update

### 5. Image Display

Update image components to use:

- `image.url` instead of `image.path`
- `image.thumbnailUrl` instead of `image.thumbnailPath`

## Testing

1. **Mission Generation**: Test with your Iceland gear roles
2. **Gear List**: Provide your full inventory and test recommendations
3. **About Page**: Write a draft and refine it with AI
4. **Gallery Controls**: Upload images and toggle visibility
5. **Cloudinary**: Upload images and verify they appear in your Cloudinary dashboard

## Next Steps

1. Set up Cloudinary account
2. Update `.env` with Cloudinary credentials
3. Test image uploads
4. Create frontend components for new features
5. Test AI generation with your specific gear setup

## Notes

- The structured mission format matches your Iceland trip example
- Gear list now intelligently selects from your inventory
- About page refinement maintains your voice while improving readability
- Gallery controls give you full control over what's public
- Cloudinary handles all image optimization automatically
