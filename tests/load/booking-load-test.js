import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const bookingSuccessRate = new Rate('booking_success');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 10 },   // Ramp up to 10 users
    { duration: '1m', target: 50 },    // Ramp up to 50 users
    { duration: '2m', target: 100 },   // Ramp up to 100 users
    { duration: '2m', target: 100 },   // Stay at 100 users
    { duration: '1m', target: 50 },    // Ramp down to 50 users
    { duration: '30s', target: 0 },    // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
    errors: ['rate<0.1'],             // Error rate must be below 10%
    booking_success: ['rate>0.9'],    // Booking success rate must be above 90%
  },
};

const BASE_URL = 'http://localhost:8082';
const PROPERTY_SERVICE_URL = 'http://localhost:8081';

// Test data
const PROPERTY_ID = __ENV.PROPERTY_ID || 'a5d8f7e1-4c3b-4f2a-b8e9-1234567890ab';
const ROOM_TYPE_ID = __ENV.ROOM_TYPE_ID || 'b6e9f8e2-5d4c-5f3b-c9fa-2345678901bc';

function generateUserId() {
  return 'user-' + Math.random().toString(36).substring(7);
}

function generateBookingDates() {
  const checkIn = new Date();
  checkIn.setDate(checkIn.getDate() + Math.floor(Math.random() * 30) + 1);
  
  const checkOut = new Date(checkIn);
  checkOut.setDate(checkOut.getDate() + Math.floor(Math.random() * 7) + 1);
  
  return {
    checkIn: checkIn.toISOString().split('T')[0],
    checkOut: checkOut.toISOString().split('T')[0],
  };
}

export function setup() {
  // Create test property if not exists
  const propertyPayload = JSON.stringify({
    name: 'Load Test Hotel',
    description: 'Hotel for load testing',
    address: {
      street: 'Test Street 1',
      city: 'Amsterdam',
      state: 'North Holland',
      country: 'Netherlands',
      zipCode: '1000AA',
    },
    latitude: 52.3702,
    longitude: 4.8952,
    amenities: ['WiFi', 'Pool'],
    totalRooms: 1000, // Large number for load testing
    basePrice: 100.00,
  });

  const propertyResponse = http.post(`${PROPERTY_SERVICE_URL}/api/properties`, propertyPayload, {
    headers: { 'Content-Type': 'application/json' },
  });

  if (propertyResponse.status === 201) {
    const property = JSON.parse(propertyResponse.body);
    console.log(`Created test property: ${property.id}`);
    return { propertyId: property.id };
  }
  
  return { propertyId: PROPERTY_ID };
}

export default function (data) {
  // Test 1: Check availability
  const dates = generateBookingDates();
  const availabilityUrl = `${BASE_URL}/api/v1/bookings/availability?` +
    `propertyId=${data.propertyId || PROPERTY_ID}&` +
    `roomTypeId=${ROOM_TYPE_ID}&` +
    `checkIn=${dates.checkIn}&` +
    `checkOut=${dates.checkOut}`;
  
  const availabilityResponse = http.get(availabilityUrl);
  
  check(availabilityResponse, {
    'availability check status is 200': (r) => r.status === 200,
    'availability check response time < 200ms': (r) => r.timings.duration < 200,
  });
  
  errorRate.add(availabilityResponse.status !== 200);
  
  sleep(1);
  
  // Test 2: Create booking
  const bookingPayload = JSON.stringify({
    propertyId: data.propertyId || PROPERTY_ID,
    userId: generateUserId(),
    roomTypeId: ROOM_TYPE_ID,
    checkIn: dates.checkIn,
    checkOut: dates.checkOut,
    numberOfRooms: Math.floor(Math.random() * 3) + 1,
    numberOfGuests: Math.floor(Math.random() * 4) + 1,
    specialRequests: 'Load test booking',
    idempotencyKey: `load-test-${Date.now()}-${Math.random()}`,
  });
  
  const bookingResponse = http.post(`${BASE_URL}/api/v1/bookings`, bookingPayload, {
    headers: { 'Content-Type': 'application/json' },
  });
  
  const bookingSuccess = check(bookingResponse, {
    'booking creation status is 201': (r) => r.status === 201,
    'booking has confirmation code': (r) => {
      const body = JSON.parse(r.body);
      return body.confirmationCode !== undefined;
    },
    'booking response time < 500ms': (r) => r.timings.duration < 500,
  });
  
  bookingSuccessRate.add(bookingSuccess);
  errorRate.add(bookingResponse.status >= 400);
  
  if (bookingResponse.status === 201) {
    const booking = JSON.parse(bookingResponse.body);
    
    sleep(2);
    
    // Test 3: Get booking details
    const getBookingResponse = http.get(`${BASE_URL}/api/v1/bookings/${booking.id}`);
    
    check(getBookingResponse, {
      'get booking status is 200': (r) => r.status === 200,
      'get booking response time < 100ms': (r) => r.timings.duration < 100,
    });
    
    // Test 4: Random cancellation (10% chance)
    if (Math.random() < 0.1) {
      sleep(1);
      
      const cancelResponse = http.post(
        `${BASE_URL}/api/v1/bookings/${booking.id}/cancel?reason=Load%20test%20cancellation`
      );
      
      check(cancelResponse, {
        'cancellation status is 200': (r) => r.status === 200,
        'cancelled booking has CANCELLED status': (r) => {
          const body = JSON.parse(r.body);
          return body.status === 'CANCELLED';
        },
      });
    }
  }
  
  sleep(Math.random() * 3 + 1); // Random think time between 1-4 seconds
}

export function teardown(data) {
  console.log('Load test completed');
}