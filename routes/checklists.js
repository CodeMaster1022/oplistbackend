/**
 * Checklists routes
 */

import express from 'express';
import { body, validationResult } from 'express-validator';
import Checklist from '../models/Checklist.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get all checklists (optionally filtered by plantId)
router.get('/', async (req, res) => {
  try {
    const { plantId } = req.query;
    const query = (plantId && plantId !== 'all') ? { plantId } : {};
    
    const checklists = await Checklist.find(query)
      .populate('plantId', 'name')
      .sort({ createdAt: -1 });
    
    res.json(checklists);
  } catch (error) {
    console.error('Get checklists error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get checklist by ID
router.get('/:id', async (req, res) => {
  try {
    const checklist = await Checklist.findById(req.params.id).populate('plantId', 'name');
    
    if (!checklist) {
      return res.status(404).json({ error: 'Checklist not found' });
    }
    
    res.json(checklist);
  } catch (error) {
    console.error('Get checklist error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create checklist (admin only)
router.post('/', [
  requireRole('admin'),
  body('name').notEmpty().trim(),
  body('plantId').notEmpty().withMessage('plantId is required'),
  body('lane').notEmpty(),
  body('area').notEmpty(),
  body('role').notEmpty(),
  body('activities').isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      name,
      plantId,
      lane,
      area,
      role,
      activities,
      generalRecurrence,
      requiresLocation,
      location
    } = req.body;

    // Validate plantId is a valid MongoDB ObjectId
    if (!plantId || typeof plantId !== 'string') {
      return res.status(400).json({ error: 'Invalid plantId' });
    }

    const newChecklist = new Checklist({
      plantId,
      name: name.trim(),
      lane,
      area,
      role,
      activities: activities.map(act => ({
        name: act.name,
        requiresPhoto: act.requiresPhoto || false,
        recurrence: act.recurrence || null
      })),
      generalRecurrence: generalRecurrence || null,
      requiresLocation: requiresLocation || false,
      location: requiresLocation && location ? {
        address: location.address,
        latitude: parseFloat(location.latitude),
        longitude: parseFloat(location.longitude),
        radius: parseInt(location.radius) || 50
      } : null
    });

    await newChecklist.save();

    res.status(201).json(newChecklist);
  } catch (error) {
    console.error('Create checklist error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update checklist (admin only)
router.put('/:id', [
  requireRole('admin'),
  body('name').optional().notEmpty().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const checklist = await Checklist.findById(req.params.id);
    
    if (!checklist) {
      return res.status(404).json({ error: 'Checklist not found' });
    }

    if (req.body.name) checklist.name = req.body.name.trim();
    if (req.body.activities) {
      checklist.activities = req.body.activities.map(act => ({
        name: act.name,
        requiresPhoto: act.requiresPhoto || false,
        recurrence: act.recurrence || null
      }));
    }
    if (req.body.generalRecurrence !== undefined) checklist.generalRecurrence = req.body.generalRecurrence;
    if (req.body.requiresLocation !== undefined) checklist.requiresLocation = req.body.requiresLocation;
    if (req.body.location !== undefined) {
      checklist.location = req.body.location ? {
        address: req.body.location.address,
        latitude: parseFloat(req.body.location.latitude),
        longitude: parseFloat(req.body.location.longitude),
        radius: parseInt(req.body.location.radius) || 50
      } : null;
    }

    await checklist.save();
    res.json(checklist);
  } catch (error) {
    console.error('Update checklist error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete checklist (admin only)
router.delete('/:id', requireRole('admin'), async (req, res) => {
  try {
    const checklist = await Checklist.findById(req.params.id);
    
    if (!checklist) {
      return res.status(404).json({ error: 'Checklist not found' });
    }

    await Checklist.findByIdAndDelete(req.params.id);

    res.json({ message: 'Checklist deleted successfully' });
  } catch (error) {
    console.error('Delete checklist error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

