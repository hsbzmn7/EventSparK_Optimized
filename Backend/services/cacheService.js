const NodeCache = require("node-cache");

// Create cache instances for different data types
const eventCache = new NodeCache({ 
  stdTTL: 300, // 5 minutes default TTL
  checkperiod: 60, // Check for expired keys every minute
  useClones: false // Better performance
});

const userCache = new NodeCache({ 
  stdTTL: 600, // 10 minutes for user data
  checkperiod: 120,
  useClones: false
});

const bookingCache = new NodeCache({ 
  stdTTL: 180, // 3 minutes for booking data
  checkperiod: 60,
  useClones: false
});

// Cache keys
const CACHE_KEYS = {
  EVENTS: {
    ALL_APPROVED: 'events:all:approved',
    BY_ORGANIZER: 'events:organizer:',
    BY_ID: 'event:',
    PENDING: 'events:pending'
  },
  USERS: {
    BY_ID: 'user:',
    BY_EMAIL: 'user:email:',
    ALL_USERS: 'users:all',
    BY_ROLE: 'users:role:'
  },
  BOOKINGS: {
    BY_USER: 'bookings:user:',
    BY_EVENT: 'bookings:event:',
    SEATS_BY_EVENT: 'seats:event:'
  }
};

// Event cache methods
const eventCacheService = {
  // Get all approved events
  getApprovedEvents: () => eventCache.get(CACHE_KEYS.EVENTS.ALL_APPROVED),
  
  // Set all approved events
  setApprovedEvents: (events) => eventCache.set(CACHE_KEYS.EVENTS.ALL_APPROVED, events),
  
  // Get events by organizer
  getOrganizerEvents: (organizerId) => eventCache.get(CACHE_KEYS.EVENTS.BY_ORGANIZER + organizerId),
  
  // Set events by organizer
  setOrganizerEvents: (organizerId, events) => eventCache.set(CACHE_KEYS.EVENTS.BY_ORGANIZER + organizerId, events),
  
  // Get event by ID
  getEvent: (eventId) => eventCache.get(CACHE_KEYS.EVENTS.BY_ID + eventId),
  
  // Set event by ID
  setEvent: (eventId, event) => eventCache.set(CACHE_KEYS.EVENTS.BY_ID + eventId, event),
  
  // Get pending events
  getPendingEvents: () => eventCache.get(CACHE_KEYS.EVENTS.PENDING),
  
  // Set pending events
  setPendingEvents: (events) => eventCache.set(CACHE_KEYS.EVENTS.PENDING, events),
  
  // Invalidate event caches
  invalidateEvent: (eventId) => {
    eventCache.del(CACHE_KEYS.EVENTS.BY_ID + eventId);
    eventCache.del(CACHE_KEYS.EVENTS.ALL_APPROVED);
    eventCache.del(CACHE_KEYS.EVENTS.PENDING);
  },
  
  // Invalidate organizer events
  invalidateOrganizerEvents: (organizerId) => {
    eventCache.del(CACHE_KEYS.EVENTS.BY_ORGANIZER + organizerId);
    eventCache.del(CACHE_KEYS.EVENTS.ALL_APPROVED);
    eventCache.del(CACHE_KEYS.EVENTS.PENDING);
  },
  
  // Clear all event caches
  clearAll: () => eventCache.flushAll()
};

// User cache methods
const userCacheService = {
  // Get user by ID
  getUser: (userId) => userCache.get(CACHE_KEYS.USERS.BY_ID + userId),
  
  // Set user by ID
  setUser: (userId, user) => userCache.set(CACHE_KEYS.USERS.BY_ID + userId, user),
  
  // Get user by email
  getUserByEmail: (email) => userCache.get(CACHE_KEYS.USERS.BY_EMAIL + email),
  
  // Set user by email
  setUserByEmail: (email, user) => userCache.set(CACHE_KEYS.USERS.BY_EMAIL + email, user),
  
  // Get all users
  getAllUsers: () => userCache.get(CACHE_KEYS.USERS.ALL_USERS),
  
  // Set all users
  setAllUsers: (users) => userCache.set(CACHE_KEYS.USERS.ALL_USERS, users),
  
  // Get users by role
  getUsersByRole: (role) => userCache.get(CACHE_KEYS.USERS.BY_ROLE + role),
  
  // Set users by role
  setUsersByRole: (role, users) => userCache.set(CACHE_KEYS.USERS.BY_ROLE + role, users),
  
  // Invalidate user caches
  invalidateUser: (userId, email) => {
    userCache.del(CACHE_KEYS.USERS.BY_ID + userId);
    if (email) userCache.del(CACHE_KEYS.USERS.BY_EMAIL + email);
    userCache.del(CACHE_KEYS.USERS.ALL_USERS);
    // Invalidate role-based caches
    userCache.del(CACHE_KEYS.USERS.BY_ROLE + 'admin');
    userCache.del(CACHE_KEYS.USERS.BY_ROLE + 'organizer');
    userCache.del(CACHE_KEYS.USERS.BY_ROLE + 'user');
  },
  
  // Clear all user caches
  clearAll: () => userCache.flushAll()
};

// Booking cache methods
const bookingCacheService = {
  // Get user bookings
  getUserBookings: (userId) => bookingCache.get(CACHE_KEYS.BOOKINGS.BY_USER + userId),
  
  // Set user bookings
  setUserBookings: (userId, bookings) => bookingCache.set(CACHE_KEYS.BOOKINGS.BY_USER + userId, bookings),
  
  // Get event bookings
  getEventBookings: (eventId) => bookingCache.get(CACHE_KEYS.BOOKINGS.BY_EVENT + eventId),
  
  // Set event bookings
  setEventBookings: (eventId, bookings) => bookingCache.set(CACHE_KEYS.BOOKINGS.BY_EVENT + eventId, bookings),
  
  // Get event seats
  getEventSeats: (eventId) => bookingCache.get(CACHE_KEYS.BOOKINGS.SEATS_BY_EVENT + eventId),
  
  // Set event seats
  setEventSeats: (eventId, seats) => bookingCache.set(CACHE_KEYS.BOOKINGS.SEATS_BY_EVENT + eventId, seats),
  
  // Invalidate booking caches
  invalidateUserBookings: (userId) => {
    bookingCache.del(CACHE_KEYS.BOOKINGS.BY_USER + userId);
  },
  
  // Invalidate event booking caches
  invalidateEventBookings: (eventId) => {
    bookingCache.del(CACHE_KEYS.BOOKINGS.BY_EVENT + eventId);
    bookingCache.del(CACHE_KEYS.BOOKINGS.SEATS_BY_EVENT + eventId);
  },
  
  // Clear all booking caches
  clearAll: () => bookingCache.flushAll()
};

// Cache middleware for API responses
const cacheMiddleware = (cacheKey, ttl = 300) => {
  return (req, res, next) => {
    const key = typeof cacheKey === 'function' ? cacheKey(req) : cacheKey;
    const cachedData = eventCache.get(key) || userCache.get(key) || bookingCache.get(key);
    
    if (cachedData) {
      return res.json(cachedData);
    }
    
    // Store original send method
    const originalSend = res.json;
    
    // Override send method to cache response
    res.json = function(data) {
      eventCache.set(key, data, ttl);
      originalSend.call(this, data);
    };
    
    next();
  };
};

// Cache statistics
const getCacheStats = () => {
  return {
    events: eventCache.getStats(),
    users: userCache.getStats(),
    bookings: bookingCache.getStats()
  };
};

module.exports = {
  eventCacheService,
  userCacheService,
  bookingCacheService,
  cacheMiddleware,
  getCacheStats,
  CACHE_KEYS
}; 