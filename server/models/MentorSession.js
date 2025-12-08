import mongoose from 'mongoose';

const cropSchema = new mongoose.Schema(
  {
    name: String,
    url: String,
    box: {
      left: Number,
      top: Number,
      width: Number,
      height: Number,
    },
  },
  { _id: false }
);

const imageSchema = new mongoose.Schema(
  {
    url: String,
    path: String,
    filename: String,
    lightroomAlbumId: String,
    lightroomAssetId: String,
    metadata: mongoose.Schema.Types.Mixed,
  },
  { _id: false }
);

const mentorSessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      default: 'MentorEdit Session',
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    image: imageSchema,
    exif: mongoose.Schema.Types.Mixed,
    crops: {
      type: [cropSchema],
      default: [],
    },
    edits: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    critique: mongoose.Schema.Types.Mixed,
    presetPath: String,
    shareId: {
      type: String,
      unique: true,
      index: true,
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.models.MentorSession || mongoose.model('MentorSession', mentorSessionSchema);
