import mongoose from 'mongoose';

const aboutSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  rawText: {
    type: String,
    required: true,
  },
  refinedText: String,
  style: {
    type: String,
    enum: ['professional', 'casual', 'artistic', 'adventurous'],
    default: 'professional',
  },
  isPublished: {
    type: Boolean,
    default: false,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

aboutSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('About', aboutSchema);
