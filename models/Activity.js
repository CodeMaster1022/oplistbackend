/**
 * Activity completion model
 */

import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
  checklistId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Checklist',
    required: true
  },
  activityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  completedAt: {
    type: Date,
    required: true,
    default: Date.now
  },
  latitude: {
    type: Number,
    default: null
  },
  longitude: {
    type: Number,
    default: null
  },
  photo: {
    type: String, // Base64 or URL
    default: null
  }
}, {
  timestamps: true
});

// Index for efficient queries
activitySchema.index({ checklistId: 1, userId: 1, completedAt: 1 });
activitySchema.index({ userId: 1, completedAt: 1 });

export default mongoose.model('Activity', activitySchema);

