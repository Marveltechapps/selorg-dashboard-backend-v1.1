/**
 * Rider test fixtures
 */

const sampleRider = {
  riderId: 'RIDER-001',
  name: 'Test Rider',
  email: 'rider@selorg.com',
  phone: '+1234567890',
  status: 'available',
  zone: 'ZONE-001',
  location: {
    lat: 12.9716,
    lng: 77.5946,
  },
  vehicle: {
    type: 'bike',
    number: 'BIKE-001',
  },
  rating: 4.5,
  totalDeliveries: 100,
};

const sampleRiders = [
  sampleRider,
  {
    ...sampleRider,
    riderId: 'RIDER-002',
    name: 'Test Rider 2',
    status: 'busy',
    zone: 'ZONE-002',
  },
  {
    ...sampleRider,
    riderId: 'RIDER-003',
    name: 'Test Rider 3',
    status: 'offline',
  },
];

module.exports = {
  sampleRider,
  sampleRiders,
};