// Run with: k6 run load-test.ts
// Oct 28: 50 max users/RPS  -->  p95 of 1.29s
//         30 max users/RPS  -->  p95 of 479ms
//         10 max users/RPS  -->  p95 of 156ms
// So can handle 20-30 RPS, and prob worse in prod (maybe 15 RPS).
// Prob could handle 1000 users in an hour.

import http from 'k6/http';
import { check, sleep } from 'k6';

// Define options with stages
export const options = {
  stages: [
    { duration: '30s', target: 10 },   // Ramp up to 10 users
    { duration: '1m', target: 30 },    // Maintain at 10 users
    { duration: '30s', target: 0 },    // Ramp down to 0 users
  ],
};

// Arrays of possible values for randomization
const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const directions = ['comingFrom', 'goingTo'];
const stations = Array.from({ length: 400 }, (_, i) => i + 1);  // Replace with valid station IDs if needed

export default function () {
  // Generate random values
  const selectedDay = days[Math.floor(Math.random() * days.length)];
  const selectedStation = stations[Math.floor(Math.random() * stations.length)];
  const selectedDirection = directions[Math.floor(Math.random() * directions.length)];

  // Construct the URL with random parameters
  const url = `http://localhost:3000/ridership-by-station?selectedDay=${selectedDay}&selectedStation=${selectedStation}&selectedDirection=${selectedDirection}&selectedMonths=1,2,3,4,5,6,7,8,9,10,11,12`;

  // Send GET request
  const response = http.get(url);

  // Validate response
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time is below 600ms': (r) => r.timings.duration < 600,
  });

  // Wait 1 second between requests
  sleep(1);
}
