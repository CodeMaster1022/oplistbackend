/**
 * Insights/Dashboard routes
 */

import express from 'express';
import User from '../models/User.js';
import Checklist from '../models/Checklist.js';
import Plant from '../models/Plant.js';
import Activity from '../models/Activity.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication and admin role
router.use(authenticateToken);
router.use(requireRole('admin'));

// Get dashboard insights
router.get('/', async (req, res) => {
  try {
    const { plantId, period = 'month' } = req.query;
    
    // Filter by plant if specified
    const userQuery = (plantId && plantId !== 'all') ? { plantId } : {};
    const checklistQuery = (plantId && plantId !== 'all') ? { plantId } : {};
    
    const users = await User.find(userQuery);
    const checklists = await Checklist.find(checklistQuery);
    
    // Calculate KPIs
    const activeUsers = users.filter(u => u.role === 'user').length;
    const usersWithoutChecklist = users.filter(u => {
      const userChecklists = checklists.filter(c => 
        c.lane === u.lane && c.area === u.subArea && c.role === u.roleName
      );
      return userChecklists.length === 0;
    }).length;
    
    // Calculate compliance
    const totalCompliance = users.reduce((sum, user) => sum + (user.compliance || 0), 0);
    const operationalCompliance = users.length > 0 
      ? Math.round(totalCompliance / users.length) 
      : 0;
    
    // Get low compliance users (compliance < 80%)
    const lowComplianceUsers = users
      .filter(u => (u.compliance || 0) < 80)
      .sort((a, b) => (a.compliance || 0) - (b.compliance || 0))
      .slice(0, 10)
      .map(u => u.toJSON());
    
    // Calculate compliance trends from real data
    const complianceTrends = await generateComplianceTrends(period, plantId);
    const complianceByPlant = await generateComplianceByPlant();
    
    res.json({
      kpis: {
        operationalCompliance,
        activeUsers,
        usersWithoutChecklist
      },
      lowComplianceUsers,
      complianceTrends,
      complianceByPlant
    });
  } catch (error) {
    console.error('Get insights error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper function to generate compliance trends from real data
async function generateComplianceTrends(period, plantId) {
  const now = new Date();
  const data = [];
  
  // Determine date range
  let days = 30;
  if (period === 'day') days = 1;
  else if (period === 'week') days = 7;
  else if (period === 'month') days = 30;
  else if (period === 'year') days = 365;
  
  // Get all unique lanes from checklists
  const checklistQuery = (plantId && plantId !== 'all') ? { plantId } : {};
  const allChecklists = await Checklist.find(checklistQuery);
  const uniqueLanes = [...new Set(allChecklists.map(c => c.lane).filter(Boolean))];
  
  // If no lanes found, return empty data
  if (uniqueLanes.length === 0) {
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toISOString().split('T')[0],
        general: 0
      });
    }
    return data;
  }
  
  // Calculate compliance for each date
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    const dateData = {
      date: date.toISOString().split('T')[0]
    };
    
    // Calculate compliance for each lane
    for (const lane of uniqueLanes) {
      const laneChecklists = allChecklists.filter(c => c.lane === lane);
      
      if (laneChecklists.length === 0) {
        dateData[lane.toLowerCase()] = 0;
        continue;
      }
      
      // Get all activities completed for this lane on this date
      const checklistIds = laneChecklists.map(c => c._id);
      const activities = await Activity.find({
        checklistId: { $in: checklistIds },
        completedAt: {
          $gte: startOfDay,
          $lte: endOfDay
        }
      });
      
      // Calculate total expected vs completed activities
      let totalExpected = 0;
      let totalCompleted = 0;
      
      for (const checklist of laneChecklists) {
        const totalActivities = checklist.activities.length;
        totalExpected += totalActivities;
        
        // Count unique activity completions for this checklist on this date
        const checklistCompletions = activities.filter(a => 
          a.checklistId.toString() === checklist._id.toString()
        );
        const uniqueActivityIds = new Set(
          checklistCompletions.map(a => a.activityId.toString())
        );
        totalCompleted += uniqueActivityIds.size;
      }
      
      const compliance = totalExpected > 0
        ? Math.round((totalCompleted / totalExpected) * 100)
        : 0;
      
      // Use lane name as key (normalized to lowercase for consistency)
      dateData[lane.toLowerCase()] = compliance;
    }
    
    // Calculate general compliance (average of all lanes)
    const laneCompliances = uniqueLanes.map(lane => dateData[lane.toLowerCase()] || 0);
    const generalCompliance = laneCompliances.length > 0
      ? Math.round(laneCompliances.reduce((sum, val) => sum + val, 0) / laneCompliances.length)
      : 0;
    
    dateData.general = generalCompliance;
    
    data.push(dateData);
  }
  
  return data;
}

// Helper function to generate compliance by plant
async function generateComplianceByPlant() {
  const plants = await Plant.find();
  
  const complianceByPlant = await Promise.all(
    plants.map(async (plant) => {
      const users = await User.find({ plantId: plant._id });
      const totalCompliance = users.reduce((sum, user) => sum + (user.compliance || 0), 0);
      const compliance = users.length > 0 ? Math.round(totalCompliance / users.length) : 0;
      
      return {
        plant: plant.name,
        compliance
      };
    })
  );
  
  return complianceByPlant;
}

export default router;

