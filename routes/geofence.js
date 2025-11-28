/**
 * Geofencing validation routes
 */

import express from 'express';
import { body, validationResult } from 'express-validator';
import Checklist from '../models/Checklist.js';
import { authenticateToken } from '../middleware/auth.js';
import { isWithinGeofence, getDistanceToGeofence } from '../utils/geofence.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Validate location for checklist
router.post('/validate', [
  body('checklistId').notEmpty(),
  body('latitude').isFloat(),
  body('longitude').isFloat()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { checklistId, latitude, longitude } = req.body;
    const checklist = await Checklist.findById(checklistId);
    
    if (!checklist) {
      return res.status(404).json({ error: 'Checklist not found' });
    }

    if (!checklist.requiresLocation || !checklist.location) {
      return res.json({
        valid: true,
        message: 'This checklist does not require location validation'
      });
    }

    const { latitude: geofenceLat, longitude: geofenceLng, radius } = checklist.location;
    const valid = isWithinGeofence(
      parseFloat(latitude),
      parseFloat(longitude),
      geofenceLat,
      geofenceLng,
      radius
    );

    const distance = getDistanceToGeofence(
      parseFloat(latitude),
      parseFloat(longitude),
      geofenceLat,
      geofenceLng
    );

    if (valid) {
      res.json({
        valid: true,
        message: 'Location validated successfully'
      });
    } else {
      res.status(400).json({
        valid: false,
        message: `You are ${Math.round(distance)}m away from the required location`,
        distance: Math.round(distance),
        requiredRadius: radius
      });
    }
  } catch (error) {
    console.error('Geofence validation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

