require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const mongoose = require("mongoose");
const { metricsMiddleware, getMetrics } = require("./services/metricsService");

const app = express();
const PORT = process.env.PORT || 8080;

// MongoDB Connection
mongoose
  .connect(
    process.env.MONGODB_URI || "mongodb://localhost:27017/eventspark-dev",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https:"],
      fontSrc: ["'self'", "https:", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https:", "https://eventspark-7vdt.onrender.com"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"]
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  frameguard: {
    action: 'deny'
  },
  noSniff: true,
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin'
  }
}));

// Additional security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' https://eventspark-7vdt.onrender.com; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'");
  next();
});

app.use(morgan("combined"));
app.use(express.json());

// Add metrics middleware
app.use(metricsMiddleware);

/* ───────────  CORS configuration  ─────────── */
const allowedProd = [
  "https://event-spark-self.vercel.app",
  "https://event-spark-prod.vercel.app",
];

app.use(
  cors({
    origin: (origin, cb) => {
      // allow requests with no Origin header (mobile apps, curl, etc.)
      if (!origin) return cb(null, true);

      // allow any localhost:* in dev
      if (origin.startsWith("http://localhost")) return cb(null, true);

      // allow the two Vercel front-end URLs in prod
      return allowedProd.includes(origin)
        ? cb(null, true)
        : cb(new Error(`CORS blocked for origin: ${origin}`));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true, // set to true only if you send cookies / auth headers
  })
);

/* ───────────  Routes  ─────────── */
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api", require("./routes/healthRoutes"));
app.use("/api/events", require("./routes/eventRoutes"));
app.use("/api/bookings", require("./routes/bookingRoutes"));

// Prometheus metrics endpoint
app.get("/metrics", getMetrics);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "An error occurred",
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Endpoint not found",
  });
});

app.listen(PORT, () => {
  console.log(`EventSpark Auth Backend is running on port ${PORT}!`);
});

module.exports = app;
