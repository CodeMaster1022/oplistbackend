# OpsList Backend API

Node.js/Express REST API for the OpsList restaurant management system.

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the `backend` directory:
```bash
# Copy the example file
cp .env.example .env

# Or create it manually with these variables:
```

Required environment variables:
```env
MONGODB_URI=mongodb://localhost:27017/restaurant
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d
PORT=5000
NODE_ENV=development
```

**Important:**
- Update `MONGODB_URI` with your MongoDB connection string
  - Local MongoDB: `mongodb://localhost:27017/restaurant`
  - MongoDB Atlas: `mongodb+srv://username:password@cluster.mongodb.net/database`
- Change `JWT_SECRET` to a strong random string in production
- Make sure MongoDB is running on your system (or update `MONGODB_URI` to point to your MongoDB instance)

4. Initialize sample data:
```bash
node scripts/initData.js
```

5. Run the development server:
```bash
npm run dev
```

The API will be available at `http://localhost:5000`

## API Endpoints

### Authentication

- `POST /api/auth/login` - Login user
  - Body: `{ email, password }`
  - Returns: `{ user, token }`

- `GET /api/auth/me` - Get current user (requires auth)
  - Headers: `Authorization: Bearer <token>`
  - Returns: User object

- `POST /api/auth/register` - Register new user (public, creates 'user' role)
  - Body: `{ email, password, name, phone? }`
  - Returns: User object

- `POST /api/auth/register-admin` - Register new user (admin only, can set any role)
  - Headers: `Authorization: Bearer <token>` (admin token required)
  - Body: `{ email, password, name, role, phone?, lane?, subArea?, roleName?, plantId? }`
  - Returns: User object

### Plants

- `GET /api/plants` - Get all plants
  - Query: `plantId` (optional)
  - Returns: Array of plants

- `GET /api/plants/:id` - Get plant by ID
  - Returns: Plant object

- `POST /api/plants` - Create plant (admin only)
  - Body: `{ name }`
  - Returns: Plant object

- `PUT /api/plants/:id` - Update plant (admin only)
  - Body: `{ name }`
  - Returns: Updated plant

- `DELETE /api/plants/:id` - Delete plant (admin only)
  - Returns: Success message

### Lanes

- `GET /api/lanes` - Get all lanes
  - Query: `plantId` (optional)
  - Returns: Array of lanes

- `GET /api/lanes/:id` - Get lane by ID
  - Returns: Lane object

- `POST /api/lanes` - Create lane (admin only)
  - Body: `{ name, plantId, subAreas?, roles? }`
  - Returns: Lane object

- `PUT /api/lanes/:id` - Update lane (admin only)
  - Body: `{ name?, subAreas?, roles? }`
  - Returns: Updated lane

- `DELETE /api/lanes/:id` - Delete lane (admin only)
  - Returns: Success message

### Checklists

- `GET /api/checklists` - Get all checklists
  - Query: `plantId` (optional, use 'all' for all plants)
  - Returns: Array of checklists

- `GET /api/checklists/:id` - Get checklist by ID
  - Returns: Checklist object

- `POST /api/checklists` - Create checklist (admin only)
  - Body: `{ name, plantId, lane, area, role, activities, generalRecurrence?, requiresLocation?, location? }`
  - Returns: Checklist object

- `PUT /api/checklists/:id` - Update checklist (admin only)
  - Body: `{ name?, activities?, generalRecurrence?, requiresLocation?, location? }`
  - Returns: Updated checklist

- `DELETE /api/checklists/:id` - Delete checklist (admin only)
  - Returns: Success message

### Users

- `GET /api/users` - Get all users
  - Query: `plantId` (optional, use 'all' for all users)
  - Returns: Array of users (without passwords)

- `GET /api/users/:id` - Get user by ID
  - Returns: User object (without password)

- `POST /api/users` - Create user (admin only)
  - Body: `{ email, password, name, role, phone?, lane?, subArea?, roleName?, plantId? }`
  - Returns: User object

- `PUT /api/users/:id` - Update user
  - Body: `{ email?, name?, role?, phone?, lane?, subArea?, roleName?, plantId?, password? }`
  - Returns: Updated user

- `DELETE /api/users/:id` - Delete user (admin only)
  - Returns: Success message

### Insights

- `GET /api/insights` - Get dashboard insights (admin only)
  - Query: `plantId` (optional), `period` (week/month/year)
  - Returns: `{ kpis, lowComplianceUsers, complianceTrends, complianceByPlant }`

### Geofencing

- `POST /api/geofence/validate` - Validate location for checklist
  - Body: `{ checklistId, latitude, longitude }`
  - Returns: `{ valid, message, distance?, requiredRadius? }`

### Activities

- `GET /api/activities/checklists` - Get user's assigned checklists
  - Returns: Array of checklists with completion status

- `POST /api/activities/complete` - Complete an activity
  - Body: `{ checklistId, activityId, latitude?, longitude?, photo? }`
  - Returns: Activity completion object

## Authentication

Most endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your-token>
```

## Database

Using MongoDB for data storage. Make sure MongoDB is installed and running.

### MongoDB Setup

1. Install MongoDB: https://www.mongodb.com/try/download/community
2. Start MongoDB service
3. Update `MONGODB_URI` in `.env` if using a different connection string

### Models

- `User` - User accounts
- `Plant` - Plant locations
- `Lane` - Operational lanes with sub-areas and roles
- `Checklist` - Checklist definitions with activities
- `Activity` - Activity completion records
- `RecurrenceRule` - Recurrence pattern rules

## Environment Variables

- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment (development/production)
- `MONGODB_URI` - MongoDB connection string (default: mongodb://localhost:27017/opslist)
- `JWT_SECRET` - Secret key for JWT tokens
- `JWT_EXPIRES_IN` - Token expiration (default: 7d)
