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
