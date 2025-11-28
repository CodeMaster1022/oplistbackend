/**
 * Users routes
 */

import express from 'express';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get all users (optionally filtered by plantId)
router.get('/', async (req, res) => {
  try {
    const { plantId } = req.query;
    const query = (plantId && plantId !== 'all') ? { plantId } : {};
    
    const users = await User.find(query)
      .populate('plantId', 'name')
      .sort({ createdAt: -1 });
    
    // User model already removes password in toJSON()
    res.json(users.map(u => u.toJSON()));
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('plantId', 'name');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Users can only view their own profile unless admin
    if (req.user.role !== 'admin' && req.user.id !== user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    res.json(user.toJSON());
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create user (admin only)
router.post('/', [
  requireRole('admin'),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').notEmpty(),
  body('role').isIn(['user', 'admin'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, name, role, phone, lane, subArea, roleName, plantId } = req.body;
    
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      email: email.toLowerCase(),
      password: hashedPassword,
      name,
      role,
      phone: phone || null,
      lane: lane || null,
      subArea: subArea || null,
      roleName: roleName || null,
      plantId: plantId || null,
      compliance: 0
    });

    await newUser.save();

    res.status(201).json(newUser.toJSON());
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user
router.put('/:id', [
  body('email').optional().isEmail().normalizeEmail(),
  body('name').optional().notEmpty(),
  body('role').optional().isIn(['user', 'admin'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Users can only update their own profile unless admin
    if (req.user.role !== 'admin' && req.user.id !== user._id?.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Only admins can change role
    if (req.body.role && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can change user roles' });
    }

    if (req.body.email) user.email = req.body.email.toLowerCase();
    if (req.body.name) user.name = req.body.name;
    if (req.body.role && req.user.role === 'admin') user.role = req.body.role;
    if (req.body.phone !== undefined) user.phone = req.body.phone;
    if (req.body.lane !== undefined) user.lane = req.body.lane;
    if (req.body.subArea !== undefined) user.subArea = req.body.subArea;
    if (req.body.roleName !== undefined) user.roleName = req.body.roleName;
    if (req.body.plantId !== undefined) user.plantId = req.body.plantId;

    // Update password if provided
    if (req.body.password) {
      user.password = await bcrypt.hash(req.body.password, 10);
    }

    await user.save();

    res.json(user.toJSON());
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete user (admin only)
router.delete('/:id', requireRole('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

