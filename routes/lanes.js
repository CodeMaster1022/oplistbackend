/**
 * Lanes, Sub-areas, and Roles routes
 */

import express from 'express';
import { body, validationResult } from 'express-validator';
import Lane from '../models/Lane.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get all lanes (optionally filtered by plantId)
router.get('/', async (req, res) => {
  try {
    const { plantId } = req.query;
    const query = plantId ? { plantId } : {};
    
    const lanes = await Lane.find(query).populate('plantId', 'name').sort({ createdAt: -1 });
    res.json(lanes);
  } catch (error) {
    console.error('Get lanes error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get lane by ID
router.get('/:id', async (req, res) => {
  try {
    const lane = await Lane.findById(req.params.id).populate('plantId', 'name');
    
    if (!lane) {
      return res.status(404).json({ error: 'Lane not found' });
    }
    
    res.json(lane);
  } catch (error) {
    console.error('Get lane error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create lane (admin only)
router.post('/', [
  requireRole('admin'),
  body('name').notEmpty().trim(),
  body('plantId').notEmpty().withMessage('plantId is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, plantId, subAreas = [], roles = [] } = req.body;
    
    // Validate plantId is a valid MongoDB ObjectId
    if (!plantId || typeof plantId !== 'string') {
      return res.status(400).json({ error: 'Invalid plantId' });
    }
    
    // Check if lane with same name exists for this plant
    const existingLane = await Lane.findOne({
      plantId,
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') }
    });
    
    if (existingLane) {
      return res.status(400).json({ error: 'Lane with this name already exists for this plant' });
    }

    const newLane = new Lane({
      plantId,
      name: name.trim(),
      subAreas: subAreas.map(sa => ({
        name: typeof sa === 'string' ? sa : sa.name
      })),
      roles: roles.map(r => typeof r === 'string' ? r : r)
    });

    await newLane.save();

    res.status(201).json(newLane);
  } catch (error) {
    console.error('Create lane error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update lane (admin only)
router.put('/:id', [
  requireRole('admin'),
  body('name').optional().notEmpty().trim(),
  body('subAreas').optional().isArray(),
  body('roles').optional().isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const lane = await Lane.findById(req.params.id);
    
    if (!lane) {
      return res.status(404).json({ error: 'Lane not found' });
    }

    if (req.body.name) lane.name = req.body.name.trim();
    if (req.body.subAreas) {
      lane.subAreas = req.body.subAreas.map(sa => ({
        name: typeof sa === 'string' ? sa : sa.name
      }));
    }
    if (req.body.roles) {
      lane.roles = req.body.roles.map(r => typeof r === 'string' ? r : r);
    }

    await lane.save();
    res.json(lane);
  } catch (error) {
    console.error('Update lane error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete lane (admin only)
router.delete('/:id', requireRole('admin'), async (req, res) => {
  try {
    const lane = await Lane.findById(req.params.id);
    
    if (!lane) {
      return res.status(404).json({ error: 'Lane not found' });
    }

    await Lane.findByIdAndDelete(req.params.id);

    res.json({ message: 'Lane deleted successfully' });
  } catch (error) {
    console.error('Delete lane error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

