import mongoose from 'mongoose';

const gallerySchema = new mongoose.Schema({
  missionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Mission',
    required: false, // Optional - can be null for Lightroom-only galleries
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: String,
  thumbnail: {
    url: String,
    publicId: String,
  },
  heroImage: {
    publicId: String,
    url: String,
    thumbnailUrl: String,
    width: Number,
    height: Number,
  },
  cloudinaryFolder: String,
  cloudinaryAssets: [{
    publicId: String,
    url: String,
    secureUrl: String,
    thumbnailUrl: String,
    width: Number,
    height: Number,
    format: String,
    resourceType: String,
    tags: [String],
    bytes: Number,
    folder: String,
    createdAt: Date,
  }],
  isPublic: {
    type: Boolean,
    default: false,
  },
  isPortfolio: {
    type: Boolean,
    default: false,
  },
  slug: {
    type: String,
    unique: true,
    sparse: true,
  },
  images: [{
    imageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Image',
    },
    order: Number,
    layoutType: {
      type: String,
      enum: ['single', 'diptych', 'triptych'],
      default: 'single',
    },
  }],
  layout: {
    type: String,
    enum: ['grid', 'masonry', 'slideshow', 'custom'],
    default: 'grid',
  },
  designPreset: {
    type: String,
    enum: ['immersive', 'masonry', 'storyboard'],
    default: 'immersive',
  },
  theme: {
    type: String,
    enum: ['dark', 'light', 'earth'],
    default: 'dark',
  },
  layoutConfig: mongoose.Schema.Types.Mixed,
  sections: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  // E-commerce fields
  enablePrints: {
    type: Boolean,
    default: false,
  },
  printPricing: {
    '8x10': { type: Number, default: 25 },
    '11x14': { type: Number, default: 35 },
    '16x20': { type: Number, default: 65 },
    '20x30': { type: Number, default: 95 },
    '24x36': { type: Number, default: 145 },
  },
  shopifyProductIds: {
    type: Map,
    of: String, // Maps image ID to Shopify product ID
  },
  lumaLabId: String, // Luma Prints lab ID
  // Lightroom integration
  lightroomAlbum: {
    id: String,
    name: String,
    catalogId: String,
  },
  // Track which Lightroom photos are visible (hidden by default for new photos)
  visibleLightroomPhotos: [{
    type: String, // Lightroom photo IDs
  }],
  // Store additional data like enhanced Lightroom photos
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

gallerySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  if (this.isPublic && !this.slug) {
    this.slug = this.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now();
  }
  next();
});

export default mongoose.model('Gallery', gallerySchema);
