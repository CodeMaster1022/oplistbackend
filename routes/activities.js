/**
 * Activities/Checklist completion routes
 */

import express from 'express';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import Checklist from '../models/Checklist.js';
import Activity from '../models/Activity.js';
import { authenticateToken } from '../middleware/auth.js';
import { isWithinGeofence } from '../utils/geofence.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get user's assigned checklists
router.get('/checklists', async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user || user.role !== 'user') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Find checklists assigned to user based on lane, area, and role
    const query = {
      lane: user.lane,
      area: user.subArea,
      role: user.roleName
    };
    
    if (user.plantId) {
      query.plantId = user.plantId;
    }

    const assignedChecklists = await Checklist.find(query).populate('plantId', 'name');

    // Get completion status for each checklist
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const checklistsWithStatus = await Promise.all(
      assignedChecklists.map(async (checklist) => {
        const completions = await Activity.find({
          checklistId: checklist._id,
          userId: req.user.id,
          completedAt: {
            $gte: today,
            $lt: tomorrow
          }
        });

        const completedActivities = completions.length;
        const totalActivities = checklist.activities.length;
        const completionPercentage = totalActivities > 0
          ? Math.round((completedActivities / totalActivities) * 100)
          : 0;

        return {
          ...checklist.toObject(),
          completionPercentage,
          completedActivities,
          totalActivities
        };
      })
    );

    res.json(checklistsWithStatus);
  } catch (error) {
    console.error('Get checklists error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Complete an activity
router.post('/complete', [
  body('checklistId').notEmpty(),
  body('activityId').notEmpty(),
  body('latitude').optional().isFloat(),
  body('longitude').optional().isFloat(),
  body('photo').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { checklistId, activityId, latitude, longitude, photo } = req.body;
    const checklist = await Checklist.findById(checklistId);
    
    if (!checklist) {
      return res.status(404).json({ error: 'Checklist not found' });
    }

    // Validate location if required
    if (checklist.requiresLocation && checklist.location) {
      if (!latitude || !longitude) {
        return res.status(400).json({ error: 'Location is required for this checklist' });
      }

      const valid = isWithinGeofence(
        parseFloat(latitude),
        parseFloat(longitude),
        checklist.location.latitude,
        checklist.location.longitude,
        checklist.location.radius
      );

      if (!valid) {
        return res.status(400).json({ error: 'You are not at the required location' });
      }
    }

    // Check if activity requires photo
    // MongoDB subdocuments use _id, so we need to find by _id string
    const activity = checklist.activities.find(a => a._id.toString() === activityId);
    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    if (activity.requiresPhoto && !photo) {
      return res.status(400).json({ error: 'Photo is required for this activity' });
    }

    // Save activity completion
    const newActivity = new Activity({
      checklistId,
      activityId,
      userId: req.user.id,
      completedAt: new Date(),
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      photo: photo || null
    });

    await newActivity.save();

    // Update user compliance
    await updateUserCompliance(req.user.id);

    res.status(201).json(newActivity);
  } catch (error) {
    console.error('Complete activity error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper function to check if date is today
function isToday(date) {
  const today = new Date();
  return date.getDate() === today.getDate() &&
         date.getMonth() === today.getMonth() &&
         date.getFullYear() === today.getFullYear();
}

// Helper function to update user compliance
async function updateUserCompliance(userId) {
  const user = await User.findById(userId);
  if (!user) return;

  const query = {
    lane: user.lane,
    area: user.subArea,
    role: user.roleName
  };
  
  if (user.plantId) {
    query.plantId = user.plantId;
  }

  const userChecklists = await Checklist.find(query);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  let totalCompliance = 0;
  let checklistCount = 0;

  for (const checklist of userChecklists) {
    const todayCompletions = await Activity.find({
      checklistId: checklist._id,
      userId: userId,
      completedAt: {
        $gte: today,
        $lt: tomorrow
      }
    });

    const completedActivities = todayCompletions.length;
    const totalActivities = checklist.activities.length;
    const compliance = totalActivities > 0
      ? (completedActivities / totalActivities) * 100
      : 0;

    totalCompliance += compliance;
    checklistCount++;
  }

  const averageCompliance = checklistCount > 0
    ? Math.round(totalCompliance / checklistCount)
    : 0;

  user.compliance = averageCompliance;
  await user.save();
}

export default router;

