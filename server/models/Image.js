import mongoose from 'mongoose';

const imageSchema = new mongoose.Schema({
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
  filename: {
    type: String,
    required: true,
  },
  originalName: String,
  cloudinaryId: String,
  url: {
    type: String,
    required: true,
  },
  thumbnailUrl: String,
  path: String, // Legacy field for backward compatibility
  thumbnailPath: String, // Legacy field
  size: Number,
  mimeType: String,
  width: Number,
  height: Number,
  caption: String,
  tags: [String],
  isPublic: {
    type: Boolean,
    default: false,
  },
  order: {
    type: Number,
    default: 0,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
});

imageSchema.index({ missionId: 1, order: 1 });

export default mongoose.model('Image', imageSchema);
