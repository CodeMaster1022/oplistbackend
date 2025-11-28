/**
 * Recurrence Rule model
 */

import mongoose from 'mongoose';

const recurrenceConfigSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['none', 'daily', 'weekly', 'monthly', 'custom']
  },
  everyNDays: Number,
  daysOfWeek: [Number],
  everyNWeeks: Number,
  dayOfMonth: Number,
  everyNMonths: Number,
  customPattern: String
}, { _id: false });

const recurrenceRuleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  config: {
    type: recurrenceConfigSchema,
    required: true
  },
  isDefault: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

export default mongoose.model('RecurrenceRule', recurrenceRuleSchema);

