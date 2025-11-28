/**
 * Plants routes
 */

import express from 'express';
import { body, validationResult } from 'express-validator';
import Plant from '../models/Plant.js';
import Checklist from '../models/Checklist.js';
import User from '../models/User.js';
import Lane from '../models/Lane.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get all plants
router.get('/', async (req, res) => {
  try {
    const plants = await Plant.find().sort({ createdAt: -1 });
    res.json(plants);
  } catch (error) {
    console.error('Get plants error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get plant by ID
router.get('/:id', async (req, res) => {
  try {
    const plant = await Plant.findById(req.params.id);
    
    if (!plant) {
      return res.status(404).json({ error: 'Plant not found' });
    }
    
    res.json(plant);
  } catch (error) {
    console.error('Get plant error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create plant (admin only)
router.post('/', [
  requireRole('admin'),
  body('name').notEmpty().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name } = req.body;
    
    // Check if plant with same name exists
    const existingPlant = await Plant.findOne({ 
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } 
    });
    
    if (existingPlant) {
      return res.status(400).json({ error: 'Plant with this name already exists' });
    }

    const newPlant = new Plant({
      name: name.trim()
    });

    await newPlant.save();

    res.status(201).json(newPlant);
  } catch (error) {
    console.error('Create plant error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update plant (admin only)
router.put('/:id', [
  requireRole('admin'),
  body('name').notEmpty().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name } = req.body;
    const plant = await Plant.findById(req.params.id);
    
    if (!plant) {
      return res.status(404).json({ error: 'Plant not found' });
    }

    // Check if another plant with same name exists
    const existingPlant = await Plant.findOne({ 
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
      _id: { $ne: req.params.id }
    });
    
    if (existingPlant) {
      return res.status(400).json({ error: 'Plant with this name already exists' });
    }

    plant.name = name.trim();
    await plant.save();

    res.json(plant);
  } catch (error) {
    console.error('Update plant error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete plant (admin only)
router.delete('/:id', requireRole('admin'), async (req, res) => {
  try {
    const plant = await Plant.findById(req.params.id);
    
    if (!plant) {
      return res.status(404).json({ error: 'Plant not found' });
    }

    // Check if plant has associated data
    const hasChecklists = await Checklist.exists({ plantId: req.params.id });
    const hasUsers = await User.exists({ plantId: req.params.id });
    const hasLanes = await Lane.exists({ plantId: req.params.id });

    if (hasChecklists || hasUsers || hasLanes) {
      return res.status(400).json({
        error: 'Cannot delete plant with associated data',
        hasChecklists: !!hasChecklists,
        hasUsers: !!hasUsers,
        hasLanes: !!hasLanes
      });
    }

    await Plant.findByIdAndDelete(req.params.id);

    res.json({ message: 'Plant deleted successfully' });
  } catch (error) {
    console.error('Delete plant error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

