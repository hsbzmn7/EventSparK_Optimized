const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Simple metrics storage (in production, use a real database)
let metrics = {
  cpu: [],
  memory: [],
  requests: [],
  errors: [],
  latency: []
};

// Add metrics endpoint
app.post('/api/metrics', (req, res) => {
  const { cpu, memory, requests, errors, latency } = req.body;
  const timestamp = Date.now();
  
  if (cpu !== undefined) metrics.cpu.push({ timestamp, value: cpu });
  if (memory !== undefined) metrics.memory.push({ timestamp, value: memory });
  if (requests !== undefined) metrics.requests.push({ timestamp, value: requests });
  if (errors !== undefined) metrics.errors.push({ timestamp, value: errors });
  if (latency !== undefined) metrics.latency.push({ timestamp, value: latency });
  
  // Keep only last 1000 data points
  Object.keys(metrics).forEach(key => {
    if (metrics[key].length > 1000) {
      metrics[key] = metrics[key].slice(-1000);
    }
  });
  
  res.json({ success: true });
});

// Get metrics endpoint
app.get('/api/metrics', (req, res) => {
  res.json(metrics);
});

// Dashboard endpoint
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.listen(PORT, () => {
  console.log(`Monitoring service running on port ${PORT}`);
}); 