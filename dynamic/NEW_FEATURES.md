# 🎨 New Features - Heritage Edition

## Overview

Major update transforming the Mission Gallery into a full-featured photography portfolio and e-commerce platform with a heritage aesthetic inspired by Orvis, Fjällräven, and Filson.

---

## ✨ New Features

### 1. Manual Gallery Creation (`/galleries/create`)

**What it does:**

- Create galleries manually without needing a mission first
- Select specific images from any mission
- Configure print sales and pricing
- Set gallery visibility (public/private)
- Choose layout styles

**Key Features:**

- Image selection interface with visual previews
- Print pricing configuration for 5 standard sizes
- Layout options: Grid, Masonry, Slideshow
- Public/private toggle
- Mission-based image sourcing

**Usage:**

```
Navigate to: /galleries/create
or
Click "Create Gallery" from Admin Dashboard
```

### 2. Admin Dashboard (`/admin`)

**What it does:**

- Centralized management for all galleries and missions
- CRUD operations (Create, Read, Update, Delete)
- Quick visibility toggles
- Statistics overview

**Key Features:**

- **Galleries Tab:**

  - View all galleries with status indicators
  - Toggle public/private visibility
  - Edit gallery settings
  - Delete galleries
  - See print sales status
  - Direct links to public pages

- **Missions Tab:**

  - View all missions
  - Quick access to mission details
  - Delete missions
  - See mission metadata

- **Quick Actions:**
  - Create new gallery
  - Create new mission
  - View statistics

**Usage:**

```
Navigate to: /admin
```

### 3. E-Commerce Integration (Ready for Shopify & Luma Prints)

**Database Schema Updates:**

- `enablePrints`: Boolean flag to enable/disable print sales per gallery
- `printPricing`: Configurable pricing for 5 standard print sizes:
  - 8x10" - Default: $25
  - 11x14" - Default: $35
  - 16x20" - Default: $65
  - 20x30" - Default: $95
  - 24x36" - Default: $145
- `shopifyProductIds`: Map of image IDs to Shopify product IDs
- `lumaLabId`: Luma Prints lab identifier

**Ready for Integration:**

- Gallery model supports all necessary e-commerce fields
- Print pricing can be customized per gallery
- Infrastructure ready for Shopify Buy Button SDK
- Infrastructure ready for Luma Prints API

**Next Steps for Full Integration:**

1. Add Shopify Buy Button SDK to `index.html`
2. Create Shopify products for each image
3. Integrate Luma Prints API for fulfillment
4. Add "Buy Print" buttons to public galleries

### 4. Heritage Design System

**Color Palette:**

**Sand (Warm Earth Tones)**

- Primary background colors
- Inspired by canvas and natural materials
- Range: #faf8f5 to #3a2f20

**Forest (Deep Greens)**

- Primary accent color
- Inspired by outdoor adventure brands
- Range: #f3f6f4 to #172821

**Leather (Rich Browns)**

- Secondary accent
- Inspired by quality leather goods
- Range: #f9f7f4 to #2a2013

**Canvas (Natural Neutrals)**

- Background and text colors
- Warm, inviting neutrals
- Range: #fdfcfb to #3d362c

**Brass (Copper Accents)**

- Call-to-action and highlights
- Inspired by vintage hardware
- Range: #fdf8f3 to #432810

**Typography:**

- **Display:** Playfair Display (elegant, classic)
- **Serif:** Merriweather (readable, warm)
- **Sans:** Inter (modern, clean)

**Design Philosophy:**

- Warm, inviting color palette
- Natural textures and materials
- Classic, timeless aesthetic
- High-quality, craftsmanship feel
- Outdoor/adventure inspiration

---

## 🎯 Usage Examples

### Creating a Manual Gallery

1. Navigate to `/admin` or `/galleries/create`
2. Fill in gallery details:
   - Title: "Iceland Winter Collection"
   - Description: "Capturing the raw beauty of Iceland's winter landscape"
3. Select source mission (optional)
4. Choose layout style
5. Enable print sales if desired
6. Configure print pricing
7. Select images from the preview grid
8. Click "Create Gallery"

### Managing Galleries

1. Go to `/admin`
2. Click "Galleries" tab
3. For each gallery you can:
   - Toggle visibility (eye icon)
   - Edit settings (pencil icon)
   - Delete (trash icon)
   - View public page (external link)

### Setting Up Print Sales

1. When creating/editing a gallery
2. Check "Enable print sales"
3. Configure pricing for each size:
   - 8x10" - Recommended: $25-35
   - 11x14" - Recommended: $35-50
   - 16x20" - Recommended: $65-85
   - 20x30" - Recommended: $95-125
   - 24x36" - Recommended: $145-195
4. Save gallery

---

## 🔧 Technical Details

### New Files Created

**Frontend:**

- `src/pages/CreateGallery.jsx` - Manual gallery creation interface
- `src/pages/AdminDashboard.jsx` - Admin CRUD interface

**Backend:**

- Updated `server/models/Gallery.js` - Added e-commerce fields

**Configuration:**

- Updated `tailwind.config.js` - Heritage color system

**Routes:**

- `/admin` - Admin dashboard
- `/galleries/create` - Manual gallery creation

### Database Schema Changes

```javascript
// Gallery Model Additions
{
  enablePrints: Boolean,
  printPricing: {
    '8x10': Number,
    '11x14': Number,
    '16x20': Number,
    '20x30': Number,
    '24x36': Number
  },
  shopifyProductIds: Map<String, String>,
  lumaLabId: String
}
```

### API Endpoints (Existing, Now Used by New Features)

- `GET /api/galleries` - List all galleries
- `POST /api/galleries` - Create gallery
- `PUT /api/galleries/:id` - Update gallery
- `DELETE /api/galleries/:id` - Delete gallery
- `GET /api/missions` - List all missions
- `DELETE /api/missions/:id` - Delete mission
- `GET /api/images/mission/:missionId` - Get mission images

---

## 🚀 Future Enhancements

### Shopify Integration (Ready to Implement)

**Step 1: Add Shopify Buy Button SDK**

```html
<!-- Add to index.html -->
<script src="https://sdks.shopifycdn.com/buy-button/latest/buy-button-storefront.min.js"></script>
```

**Step 2: Create Products**

- For each image in a print-enabled gallery
- Create Shopify product with variants for each size
- Store product ID in `shopifyProductIds` map

**Step 3: Add Buy Buttons**

- Update `PublicGallery.jsx` to show "Buy Print" buttons
- Initialize Shopify Buy Button for each image
- Handle cart and checkout

### Luma Prints Integration (Ready to Implement)

**Step 1: Get Luma Prints API Credentials**

- Sign up at https://www.lumaprints.com/
- Get API key and lab ID

**Step 2: Create API Service**

```javascript
// server/services/lumaPrintsService.js
export async function createPrintOrder(imageUrl, size, quantity) {
  // Call Luma Prints API
  // Return order details
}
```

**Step 3: Integrate with Shopify**

- On Shopify order webhook
- Call Luma Prints API to fulfill order
- Update order status

---

## 🎨 Design Guidelines

### Heritage Aesthetic Principles

**1. Color Usage:**

- Primary backgrounds: Canvas/Sand tones
- Primary text: Forest/Leather dark shades
- Accents: Brass for CTAs, Forest for links
- Avoid pure black/white - use warm tones

**2. Typography:**

- Headings: Playfair Display (display font)
- Body: Merriweather (serif) or Inter (sans)
- Maintain hierarchy with size and weight
- Generous line-height for readability

**3. Spacing:**

- Use generous whitespace
- Comfortable padding and margins
- Let content breathe

**4. Components:**

- Subtle borders (not harsh)
- Soft shadows
- Rounded corners (moderate, not too round)
- Texture overlays where appropriate

**5. Imagery:**

- High-quality, large format
- Natural lighting preferred
- Landscape/adventure themes
- Authentic, not overly processed

---

## 📝 Migration Notes

### For Existing Galleries

Existing galleries will continue to work without changes. New fields have default values:

- `enablePrints`: false
- `printPricing`: Default pricing structure
- `shopifyProductIds`: Empty map
- `lumaLabId`: null

### Updating Existing Galleries

To enable print sales on existing galleries:

1. Go to `/admin`
2. Click edit on the gallery
3. Check "Enable print sales"
4. Configure pricing
5. Save

---

## 🐛 Known Issues / TODO

- [ ] Implement Shopify Buy Button integration
- [ ] Implement Luma Prints API integration
- [ ] Add gallery edit page (`/galleries/:id/edit`)
- [ ] Add image reordering in gallery creation
- [ ] Add bulk image selection tools
- [ ] Implement print preview/mockups
- [ ] Add customer order management
- [ ] Implement analytics for print sales

---

## 📚 Resources

**Design Inspiration:**

- Orvis: https://www.orvis.com/
- Fjällräven: https://www.fjallraven.com/
- Filson: https://www.filson.com/

**E-Commerce Integration:**

- Shopify Buy Button: https://shopify.dev/custom-storefronts/tools/buy-button
- Luma Prints API: https://www.lumaprints.com/api-documentation

**Color Tools:**

- Coolors: https://coolors.co/
- Adobe Color: https://color.adobe.com/

---

## 🎉 Summary

This update transforms the Mission Gallery from a simple portfolio tool into a comprehensive photography business platform with:

✅ Manual gallery curation
✅ Full admin CRUD capabilities  
✅ E-commerce infrastructure
✅ Heritage-inspired design system
✅ Ready for Shopify & Luma Prints integration

The platform now supports the full workflow from mission planning to print sales, all wrapped in a beautiful, heritage-inspired design that evokes quality, craftsmanship, and outdoor adventure.
