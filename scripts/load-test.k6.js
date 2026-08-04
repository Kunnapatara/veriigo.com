import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 100 },  // Ramp up to 100 users
    { duration: '1m', target: 500 },   // Ramp up to 500 users
    { duration: '1m', target: 1000 },  // Spike to 1000 users
    { duration: '30s', target: 5000 },  // Peak load 5000 users
    { duration: '30s', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete within 500ms
    http_req_failed: ['rate<0.01'],    // Error rate must be < 1%
  },
};

const BASE_URL = __ENV.TARGET_URL || 'http://localhost:3000';

export default function () {
  // 1. Search Query
  const searchRes = http.get(`${BASE_URL}/api/v2/search?q=%E0%B8%9E%E0%B8%99%E0%B8%B1%E0%B8%81%E0%B8%87%E0%B8%B2%E0%B8%99`);
  check(searchRes, {
    'Search Status 200': (r) => r.status === 200,
    'Search latency < 400ms': (r) => r.timings.duration < 400,
  });

  // 2. National Scheduler Pipeline Trigger
  const healthRes = http.get(`${BASE_URL}/health/readiness`);
  check(healthRes, {
    'Health Status 200': (r) => r.status === 200,
  });

  sleep(1);
}
