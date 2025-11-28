/**
 * Geofencing utility functions
 */

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in meters
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth's radius in meters
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Check if user is within geofence
 * @param {number} userLat - User's latitude
 * @param {number} userLon - User's longitude
 * @param {number} geofenceLat - Geofence center latitude
 * @param {number} geofenceLon - Geofence center longitude
 * @param {number} radiusMeters - Geofence radius in meters
 * @returns {boolean} True if user is within geofence
 */
export function isWithinGeofence(userLat, userLon, geofenceLat, geofenceLon, radiusMeters) {
  const distance = calculateDistance(userLat, userLon, geofenceLat, geofenceLon);
  return distance <= radiusMeters;
}

/**
 * Get distance to geofence center
 * @param {number} userLat - User's latitude
 * @param {number} userLon - User's longitude
 * @param {number} geofenceLat - Geofence center latitude
 * @param {number} geofenceLon - Geofence center longitude
 * @returns {number} Distance in meters
 */
export function getDistanceToGeofence(userLat, userLon, geofenceLat, geofenceLon) {
  return calculateDistance(userLat, userLon, geofenceLat, geofenceLon);
}

function toRad(degrees) {
  return degrees * (Math.PI / 180);
}

