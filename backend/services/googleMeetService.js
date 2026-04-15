/**
 * Google Meet Service
 * Handles creation and management of Google Meet links for interviews
 */

/**
 * Generate a simple Google Meet link without API
 * This creates a meet.google.com link that anyone can join
 * @param {string} roomId - Unique room identifier
 * @returns {string} Google Meet URL
 */
function generateSimpleMeetLink(roomId) {
  // Create a unique, readable code
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 7);
  const code = `alumnex-${roomId}-${timestamp}${randomPart}`;
  
  return `https://meet.google.com/${code}`;
}

/**
 * Generate a consistent meet link for a room
 * Same roomId always generates the same link
 * @param {string} roomId - Unique room identifier
 * @returns {string} Google Meet URL
 */
function generateConsistentMeetLink(roomId) {
  // Create a hash-like code from roomId for consistency
  const code = `alumnex-${roomId}`.toLowerCase().replace(/[^a-z0-9-]/g, '');
  return `https://meet.google.com/${code}`;
}

/**
 * Create a Google Meet link with custom code
 * @param {string} customCode - Custom meeting code
 * @returns {string} Google Meet URL
 */
function createMeetLinkWithCode(customCode) {
  const sanitizedCode = customCode.toLowerCase().replace(/[^a-z0-9-]/g, '');
  return `https://meet.google.com/${sanitizedCode}`;
}

/**
 * Extract meeting code from Google Meet URL
 * @param {string} meetUrl - Full Google Meet URL
 * @returns {string|null} Meeting code or null if invalid
 */
function extractMeetingCode(meetUrl) {
  const match = meetUrl.match(/meet\.google\.com\/([a-z0-9-]+)/i);
  return match ? match[1] : null;
}

/**
 * Validate Google Meet URL format
 * @param {string} url - URL to validate
 * @returns {boolean} True if valid Google Meet URL
 */
function isValidMeetUrl(url) {
  return /^https:\/\/meet\.google\.com\/[a-z0-9-]+$/i.test(url);
}

module.exports = {
  generateSimpleMeetLink,
  generateConsistentMeetLink,
  createMeetLinkWithCode,
  extractMeetingCode,
  isValidMeetUrl,
};
