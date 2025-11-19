import mongoose from 'mongoose';

const missionSchema = new mongoose.Schema({
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
  location: String,
  startDate: Date,
  endDate: Date,
  summary: String,
  aiGenerated: {
    type: Boolean,
    default: false,
  },
  isPortfolio: {
    type: Boolean,
    default: false,
  },
  includeDiptychs: {
    type: Boolean,
    default: false,
  },
  includeTriptychs: {
    type: Boolean,
    default: false,
  },
  layout: {
    type: String,
    enum: ['grid', 'masonry', 'slideshow', 'custom'],
    default: 'grid',
  },
  layoutConfig: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  gearList: [{
    name: String,
    category: String,
    description: String,
    specifications: mongoose.Schema.Types.Mixed,
    aiGenerated: Boolean,
  }],
  gearRolesText: {
    type: String,
    default: '',
  },
  baseRecipesText: {
    type: String,
    default: '',
  },
  seriesChecklistText: {
    type: String,
    default: '',
  },
  compositionNotesText: {
    type: String,
    default: '',
  },
  fieldCardText: {
    type: String,
    default: '',
  },
  // Detailed mission structure from AI generation
  structuredPlan: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
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
      shutterSpeed: String,
    },
    specialNotes: String,
    linkedPhotos: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Image',
    }],
    lightroomPhotoIds: [String], // For Lightroom photos
  }],
  // Lightroom album link
  lightroomAlbum: {
    id: String,
    name: String,
    catalogId: String,
  },
  // Published gallery reference
  publishedGalleryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Gallery',
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

missionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('Mission', missionSchema);
