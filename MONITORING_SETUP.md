# EventSpark Monitoring Setup Guide

## Overview
This guide will help you set up Prometheus and Grafana to monitor your EventSpark application with real-time metrics for CPU, memory, request latency, and error rates.

## Prerequisites
- Docker and Docker Compose installed
- Node.js application running on port 8080
- Git repository with the monitoring configuration

## Step-by-Step Setup

### 1. Install Dependencies
```bash
# Navigate to the backend directory
cd Backend

# Install the prom-client dependency
npm install prom-client
```

### 2. Start the Monitoring Stack
```bash
# Navigate to the project root
cd ..

# Start Prometheus and Grafana using Docker Compose
docker-compose up -d
```

### 3. Verify Services are Running
```bash
# Check if containers are running
docker-compose ps

# Expected output:
# Name                Command               State           Ports
# grafana             /run.sh                 Up      0.0.0.0:3000->3000/tcp
# prometheus          /bin/prometheus --c ... Up      0.0.0.0:9090->9090/tcp
```

### 4. Access the Monitoring Dashboards

#### Prometheus (Metrics Collection)
- **URL:** http://localhost:9090
- **Purpose:** View raw metrics and test queries
- **Features:** 
  - Query metrics using PromQL
  - View targets and their status
  - Check configuration

#### Grafana (Visualization)
- **URL:** http://localhost:3000
- **Login:** 
  - Username: `admin`
  - Password: `admin123`
- **Purpose:** View beautiful dashboards with real-time metrics

### 5. Verify Metrics Endpoint
```bash
# Test if your application is exposing metrics
curl http://localhost:8080/metrics

# You should see Prometheus-formatted metrics like:
# # HELP http_requests_total Total number of HTTP requests
# # TYPE http_requests_total counter
# http_requests_total{method="GET",route="/api/events",status_code="200"} 42
```

## Dashboard Features

### CPU Usage Panel
- **Metric:** `rate(process_cpu_seconds_total[5m]) * 100`
- **Display:** Real-time CPU percentage
- **Thresholds:** Green (<50%), Yellow (50-80%), Red (>80%)

### Memory Usage Panel
- **Metric:** `process_resident_memory_bytes / 1024 / 1024`
- **Display:** Memory usage in MB
- **Thresholds:** Green (<500MB), Yellow (500-1000MB), Red (>1000MB)

### Request Latency Panel
- **Metrics:** 
  - 95th percentile: `histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))`
  - 50th percentile: `histogram_quantile(0.50, rate(http_request_duration_seconds_bucket[5m]))`
- **Display:** Response time trends over time

### Error Rate Panel
- **Metric:** `rate(http_request_errors_total[5m])`
- **Display:** Error rate per second
- **Purpose:** Monitor application health

### Total Requests Panel
- **Metric:** `rate(http_requests_total[5m])`
- **Display:** Requests per second
- **Purpose:** Monitor application traffic

### Active Connections Panel
- **Metric:** `active_connections`
- **Display:** Current number of active connections
- **Purpose:** Monitor connection pool usage

### Cache Hit Ratio Panel
- **Metric:** `cache_hit_ratio`
- **Display:** Cache effectiveness (0-1)
- **Thresholds:** Red (<50%), Yellow (50-80%), Green (>80%)

## Custom Metrics Available

### HTTP Metrics
- `http_requests_total` - Total request count by method, route, and status
- `http_request_duration_seconds` - Request duration histogram
- `http_request_errors_total` - Error count by type

### System Metrics
- `process_cpu_seconds_total` - CPU usage
- `process_resident_memory_bytes` - Memory usage
- `nodejs_heap_size_total_bytes` - Heap size
- `nodejs_heap_size_used_bytes` - Used heap

### Application Metrics
- `active_connections` - Active database connections
- `cache_hit_ratio` - Cache effectiveness
- `database_query_duration_seconds` - Database query performance

## Troubleshooting

### Prometheus Can't Scrape Metrics
1. Check if your app is running: `curl http://localhost:8080/health`
2. Verify metrics endpoint: `curl http://localhost:8080/metrics`
3. Check Prometheus targets: http://localhost:9090/targets

### Grafana Can't Connect to Prometheus
1. Verify Prometheus is running: `docker-compose ps`
2. Check Prometheus logs: `docker-compose logs prometheus`
3. Verify datasource configuration in Grafana

### No Data in Dashboards
1. Ensure your application is generating traffic
2. Check if metrics are being collected: http://localhost:9090/graph
3. Verify time range in Grafana (should be "Last 1 hour")

## Performance Impact
- **Prometheus:** Minimal impact, scrapes metrics every 15 seconds
- **Application:** Very low overhead, metrics collection is asynchronous
- **Storage:** Prometheus stores data locally, ~1GB per month for typical usage

## Security Considerations
- **Grafana:** Change default password after first login
- **Prometheus:** Runs on localhost only by default
- **Metrics:** No sensitive data is exposed in metrics
- **Network:** All communication is local, no external dependencies

## Scaling Considerations
- **Prometheus:** Can handle thousands of metrics per second
- **Grafana:** Supports multiple data sources and dashboards
- **Storage:** Consider long-term storage solutions for production
- **High Availability:** Use Prometheus federation for multiple instances 