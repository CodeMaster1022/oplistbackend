/**
 * Lane model
 */

import mongoose from 'mongoose';

const subAreaSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  }
}, { _id: true });

const laneSchema = new mongoose.Schema({
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
  subAreas: [subAreaSchema],
  roles: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

// Compound index to ensure unique lane names per plant
laneSchema.index({ plantId: 1, name: 1 }, { unique: true });

export default mongoose.model('Lane', laneSchema);

