/**
 * Checklist model
 */

import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  requiresPhoto: {
    type: Boolean,
    default: false
  },
  recurrence: {
    type: String,
    default: null
  }
}, { _id: true });

const locationSchema = new mongoose.Schema({
  address: {
    type: String,
    required: true
  },
  latitude: {
    type: Number,
    required: true
  },
  longitude: {
    type: Number,
    required: true
  },
  radius: {
    type: Number,
    required: true,
    default: 50 // meters
  }
});

const checklistSchema = new mongoose.Schema({
  plantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plant',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  lane: {
    type: String,
    required: true
  },
  area: {
    type: String,
    required: true
  },
  role: {
    type: String,
    required: true
  },
  activities: [activitySchema],
  generalRecurrence: {
    type: String,
    default: null
  },
  requiresLocation: {
    type: Boolean,
    default: false
  },
  location: {
    type: locationSchema,
    default: null
  }
}, {
  timestamps: true
});

export default mongoose.model('Checklist', checklistSchema);

