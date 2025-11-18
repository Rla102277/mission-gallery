import mongoose from 'mongoose';

const gallerySchema = new mongoose.Schema({
  missionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Mission',
    required: true,
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
  layoutConfig: mongoose.Schema.Types.Mixed,
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
