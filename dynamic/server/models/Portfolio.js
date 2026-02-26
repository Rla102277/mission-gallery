import mongoose from 'mongoose';

const portfolioSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  slug: {
    type: String,
    unique: true,
    sparse: true,
  },
  heroImage: {
    url: String,
    publicId: String,
  },
  aboutContent: {
    type: String,
    default: '',
  },
  gearSummary: {
    type: String,
    default: '',
  },
  galleryIds: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Gallery',
    },
  ],
  layout: {
    type: String,
    enum: ['simple'],
    default: 'simple',
  },
  featuredMissionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Mission',
  },
  isPublished: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    enum: ['draft', 'published'],
    default: 'draft',
  },
  settings: {
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

portfolioSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  if (this.isPublished && !this.slug && this.title) {
    this.slug = `${this.title}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '')
      + '-' + Date.now().toString(36);
  }
  next();
});

export default mongoose.model('Portfolio', portfolioSchema);
