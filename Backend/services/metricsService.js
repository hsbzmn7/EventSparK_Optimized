const promClient = require('prom-client');

// Create a Registry to register the metrics
const register = new promClient.Registry();

// Enable the collection of default metrics
promClient.collectDefaultMetrics({ register });

// Custom metrics
const httpRequestDurationMicroseconds = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5, 10]
});

const httpRequestTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

const httpRequestErrors = new promClient.Counter({
  name: 'http_request_errors_total',
  help: 'Total number of HTTP request errors',
  labelNames: ['method', 'route', 'error_type']
});

const activeConnections = new promClient.Gauge({
  name: 'active_connections',
  help: 'Number of active connections'
});

const databaseQueryDuration = new promClient.Histogram({
  name: 'database_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation', 'collection'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5]
});

const cacheHitRatio = new promClient.Gauge({
  name: 'cache_hit_ratio',
  help: 'Cache hit ratio (0-1)'
});

// Register all metrics
register.registerMetric(httpRequestDurationMicroseconds);
register.registerMetric(httpRequestTotal);
register.registerMetric(httpRequestErrors);
register.registerMetric(activeConnections);
register.registerMetric(databaseQueryDuration);
register.registerMetric(cacheHitRatio);

// Middleware to collect request metrics
const metricsMiddleware = (req, res, next) => {
  const start = Date.now();
  
  // Increment total requests
  httpRequestTotal.inc({ method: req.method, route: req.route?.path || req.path, status_code: res.statusCode });
  
  // Track response time
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000; // Convert to seconds
    httpRequestDurationMicroseconds.observe(
      { method: req.method, route: req.route?.path || req.path, status_code: res.statusCode },
      duration
    );
    
    // Track errors
    if (res.statusCode >= 400) {
      httpRequestErrors.inc({ 
        method: req.method, 
        route: req.route?.path || req.path, 
        error_type: res.statusCode >= 500 ? 'server_error' : 'client_error' 
      });
    }
  });
  
  next();
};

// Function to update cache metrics
const updateCacheMetrics = (hitRatio) => {
  cacheHitRatio.set(hitRatio);
};

// Function to update database metrics
const recordDatabaseQuery = (operation, collection, duration) => {
  databaseQueryDuration.observe({ operation, collection }, duration);
};

// Function to update connection metrics
const updateConnectionCount = (count) => {
  activeConnections.set(count);
};

// Metrics endpoint
const getMetrics = async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    res.status(500).end(err);
  }
};

module.exports = {
  register,
  metricsMiddleware,
  updateCacheMetrics,
  recordDatabaseQuery,
  updateConnectionCount,
  getMetrics,
  httpRequestDurationMicroseconds,
  httpRequestTotal,
  httpRequestErrors,
  activeConnections,
  databaseQueryDuration,
  cacheHitRatio
}; 