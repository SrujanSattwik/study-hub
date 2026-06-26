// In-memory session store mapping active session tokens (UUIDs) to user objects
const activeSessions = new Map();

module.exports = activeSessions;
