const express = require("express");
const router = express.Router();

/**
 * GET /api/health
 * Health check endpoint - same as Spring Boot HealthController.health()
 */
router.get("/health", (req, res) => {
  res.send("Calculator Backend is running!");
});


module.exports = router;
