/**
 * Initialize MongoDB with sample data
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDatabase } from '../config/database.js';
import User from '../models/User.js';
import Plant from '../models/Plant.js';
import Lane from '../models/Lane.js';
import Checklist from '../models/Checklist.js';
import Activity from '../models/Activity.js';
import RecurrenceRule from '../models/RecurrenceRule.js';

async function initSampleData() {
  try {
    await connectDatabase();

    // Clear existing data (optional - remove in production)
    await User.deleteMany({});
    await Plant.deleteMany({});
    await Lane.deleteMany({});
    await Checklist.deleteMany({});
    await Activity.deleteMany({});
    await RecurrenceRule.deleteMany({});

    // Create users
    const hashedAdminPassword = await bcrypt.hash('admin123', 10);
    const hashedUserPassword = await bcrypt.hash('user123', 10);

    const adminUser = new User({
      email: 'admin@restaurant.com',
      password: hashedAdminPassword,
      name: 'Admin User',
      role: 'admin',
      phone: '+1 (555) 000-0001',
      compliance: 0
    });
    await adminUser.save();

    // Create plants
    const plant1 = new Plant({ name: 'Plant 1' });
    await plant1.save();

    const plant2 = new Plant({ name: 'Plant 2' });
    await plant2.save();

    // Create users with plant assignments
    const user1 = new User({
      email: 'john.smith@restaurant.com',
      password: hashedUserPassword,
      name: 'John Smith',
      role: 'user',
      phone: '+1 (555) 123-4567',
      lane: 'Operations',
      subArea: 'Reception',
      roleName: 'Hosts',
      plantId: plant1._id,
      compliance: 92
    });
    await user1.save();

    const user2 = new User({
      email: 'jane.doe@restaurant.com',
      password: hashedUserPassword,
      name: 'Jane Doe',
      role: 'user',
      phone: '+1 (555) 234-5678',
      lane: 'Kitchen',
      subArea: 'Hot Kitchen',
      roleName: 'Chef',
      plantId: plant1._id,
      compliance: 88
    });
    await user2.save();

    // Create lanes
    const lane1 = new Lane({
      plantId: plant1._id,
      name: 'Operations',
      subAreas: [
        { name: 'Reception' },
        { name: 'Valet Parking' }
      ],
      roles: ['Hosts', 'Receptionists', 'Valet Staff']
    });
    await lane1.save();

    const lane2 = new Lane({
      plantId: plant1._id,
      name: 'Kitchen',
      subAreas: [
        { name: 'Hot Kitchen' },
        { name: 'Cold Kitchen' }
      ],
      roles: ['Chef', 'Sous Chef', 'Line Cook']
    });
    await lane2.save();

    // Create default recurrence rules
    const defaultRules = [
      {
        name: 'Daily',
        description: 'Every day',
        config: { type: 'daily', everyNDays: 1 },
        isDefault: true
      },
      {
        name: 'Every Weekday',
        description: 'Monday to Friday',
        config: { type: 'weekly', everyNWeeks: 1, daysOfWeek: [1, 2, 3, 4, 5] },
        isDefault: true
      },
      {
        name: 'Every Monday',
        description: 'Every Monday',
        config: { type: 'weekly', everyNWeeks: 1, daysOfWeek: [1] },
        isDefault: true
      },
      {
        name: 'Every Wednesday',
        description: 'Every Wednesday',
        config: { type: 'weekly', everyNWeeks: 1, daysOfWeek: [3] },
        isDefault: true
      },
      {
        name: 'Every Friday',
        description: 'Every Friday',
        config: { type: 'weekly', everyNWeeks: 1, daysOfWeek: [5] },
        isDefault: true
      }
    ];

    for (const rule of defaultRules) {
      const recurrenceRule = new RecurrenceRule(rule);
      await recurrenceRule.save();
    }

    console.log('✅ Sample data initialized successfully!');
    console.log(`   - Created ${await User.countDocuments()} users`);
    console.log(`   - Created ${await Plant.countDocuments()} plants`);
    console.log(`   - Created ${await Lane.countDocuments()} lanes`);
    console.log(`   - Created ${await RecurrenceRule.countDocuments()} recurrence rules`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error initializing data:', error);
    process.exit(1);
  }
}

initSampleData();
