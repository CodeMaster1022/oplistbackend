import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDatabase } from './config/database.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

// Load environment variables FIRST
dotenv.config();

// Routes
import authRoutes from './routes/auth.js';
import plantsRoutes from './routes/plants.js';
import lanesRoutes from './routes/lanes.js';
import checklistsRoutes from './routes/checklists.js';
import usersRoutes from './routes/users.js';
import insightsRoutes from './routes/insights.js';
import geofenceRoutes from './routes/geofence.js';
import activitiesRoutes from './routes/activities.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
await connectDatabase();

// Routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'OpsList API is running!',
    status: 'success',
    version: '1.0.0'
  });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/plants', plantsRoutes);
app.use('/api/lanes', lanesRoutes);
app.use('/api/checklists', checklistsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/insights', insightsRoutes);
app.use('/api/geofence', geofenceRoutes);
app.use('/api/activities', activitiesRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});
