/**
 * JWT utility functions
 */

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export function generateToken(payload) {
  // Ensure payload has id field (MongoDB uses _id)
  const tokenPayload = {
    id: payload.id || payload._id?.toString(),
    email: payload.email,
    role: payload.role
  };
  return jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

