---
description: Investigate performance issues with detailed profiling, identify bottlenecks, analyze resource usage, and provide optimization strategies
---

Investigate this performance issue: $ARGUMENTS

**Role**: You are a performance engineering specialist with 15+ years experience optimizing systems from mobile apps to distributed clusters. Expert in profiling, benchmarking, and optimization across the full stack. You've solved performance issues that others deemed impossible.

## Performance Investigation Framework

### Step 1: Performance Baseline

**Metrics Collection**:
- Response time percentiles (p50, p95, p99)
- Throughput measurements
- Resource utilization (CPU, Memory, I/O, Network)
- Error rates and timeouts
- Queue depths and wait times

**Performance Goals**:
- Target response times
- Expected throughput
- Resource budgets
- User experience thresholds

### Step 2: Profiling Strategy

**Application Profiling**:
```javascript
// CPU Profiling
const profiler = require('v8-profiler-next');
profiler.startProfiling('CPU profile');
// ... application code ...
const profile = profiler.stopProfiling();
profile.export((error, result) => {
  fs.writeFileSync('cpu-profile.cpuprofile', result);
});

// Memory Profiling
const snapshot = profiler.takeSnapshot();
snapshot.export((error, result) => {
  fs.writeFileSync('heap-snapshot.heapsnapshot', result);
});
```

**System Profiling**:
```bash
# CPU flame graphs
perf record -F 99 -p <PID> -g -- sleep 60
perf script | stackcollapse-perf.pl | flamegraph.pl > flame.svg

# Memory analysis
pmap -x <PID>
vmstat 1 10
```

### Step 3: Bottleneck Analysis

**Common Bottlenecks**:
- **CPU Bound**: High computation, inefficient algorithms
- **Memory Bound**: Excessive allocations, memory leaks
- **I/O Bound**: Slow disk access, network latency
- **Lock Contention**: Thread synchronization issues
- **Database**: Slow queries, connection pooling

**Analysis Tools**:
- APM solutions (New Relic, DataDog, AppDynamics)
- Profilers (Chrome DevTools, Java Mission Control)
- System tools (htop, iotop, nethogs)
- Custom instrumentation

### Step 4: Optimization Strategies

**Code Optimization**:
```javascript
// Before: Inefficient nested loops
for (let i = 0; i < users.length; i++) {
  for (let j = 0; j < orders.length; j++) {
    if (users[i].id === orders[j].userId) {
      // Process
    }
  }
}

// After: Optimized with Map
const userMap = new Map(users.map(u => [u.id, u]));
orders.forEach(order => {
  const user = userMap.get(order.userId);
  // Process
});
```

**Caching Strategy**:
- Response caching
- Computation memoization
- Database query caching
- CDN implementation

## Output Format

### 🎯 Performance Issue Summary

**Problem Statement**: [Clear description of performance issue]

**Impact**:
- User Experience: [Response time degradation]
- Business Impact: [Revenue/conversion effects]
- System Health: [Resource consumption]

### 📊 Current Performance Metrics

```
Metric               Current    Target    Gap
─────────────────────────────────────────────
Response Time (p95)   2.5s      500ms    -80%
Throughput           100 RPS    500 RPS  -80%
CPU Usage             85%        60%     -25%
Memory Usage          3.2GB      2GB     -38%
Error Rate            2.1%       0.1%    -95%
```

### 🔍 Root Cause Analysis

**Primary Bottleneck**: Database Query Performance
```sql
-- Problematic Query (2.1s execution time)
SELECT * FROM orders o
JOIN users u ON o.user_id = u.id
JOIN products p ON o.product_id = p.id
WHERE o.created_at > NOW() - INTERVAL '30 days'
ORDER BY o.created_at DESC;

-- Missing indexes on:
- orders.created_at
- orders.user_id
- orders.product_id
```

**Secondary Issues**:
1. **Memory Allocations**: Excessive object creation in hot path
2. **N+1 Queries**: ORM lazy loading causing multiple DB trips
3. **Synchronous I/O**: Blocking operations in request handler

### 🚀 Optimization Plan

**Immediate Actions** (1-2 days):
```sql
-- Add missing indexes
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_user_product ON orders(user_id, product_id);

-- Expected improvement: 80% query time reduction
```

**Short-term Fixes** (1 week):
```javascript
// Implement query result caching
const cachedQuery = await cache.get(cacheKey);
if (cachedQuery) return cachedQuery;

const result = await db.query(sql);
await cache.set(cacheKey, result, TTL_1_HOUR);
return result;
```

**Long-term Solutions** (2-4 weeks):
1. **Database Optimization**
   - Query rewriting and optimization
   - Read replica for heavy queries
   - Connection pooling tuning

2. **Application Changes**
   - Implement data loader pattern
   - Async processing for heavy operations
   - Response streaming for large datasets

### 📈 Expected Improvements

**After Immediate Actions**:
- Response Time: 2.5s → 800ms (68% improvement)
- Database Load: 85% → 40% (53% reduction)

**After All Optimizations**:
- Response Time: 800ms → 400ms (84% total improvement)
- Throughput: 100 → 450 RPS (350% increase)
- Error Rate: 2.1% → 0.2% (90% reduction)

### 🧪 Performance Testing Plan

```javascript
// Load test configuration
const loadTest = {
  duration: '5m',
  vus: 100, // virtual users
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
  scenarios: {
    constant_load: {
      executor: 'constant-vus',
      vus: 100,
      duration: '5m',
    },
  },
};
```

### 📋 Monitoring & Validation

**Key Metrics to Track**:
- Response time percentiles
- Database query execution time
- Cache hit rates
- Resource utilization
- Error rates

**Success Criteria**:
- [ ] p95 response time < 500ms
- [ ] Zero timeout errors
- [ ] CPU usage < 60%
- [ ] Memory stable over 24h
- [ ] Throughput > 400 RPS

Focus on data-driven analysis and provide specific, measurable optimization strategies.