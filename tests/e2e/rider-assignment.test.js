/**
 * E2E Test: Rider Assignment Flow
 * Tests: Login → View pending orders → Auto-assign riders → Track delivery
 */

const request = require('supertest');
const createTestApp = require('../helpers/testApp');
const { getAuthHeaders, testUsers } = require('../helpers/mockAuth');
const { clearDatabase } = require('../helpers/mockDatabase');
const Order = require('../../src/rider/models/Order');
const Rider = require('../../src/rider/models/Rider');

const app = createTestApp();

describe('E2E: Rider Assignment Flow', () => {
  beforeEach(async () => {
    clearDatabase();
    
    // Create test rider
    await Rider.create({
      riderId: 'RIDER-001',
      name: 'Test Rider',
      status: 'available',
      zone: 'ZONE-001',
      location: { lat: 12.9716, lng: 77.5946 },
    });

    // Create test order ready for dispatch
    await Order.create({
      orderId: 'ORD-001',
      customerId: 'CUST-001',
      status: 'ready_for_dispatch',
      deliveryAddress: {
        street: '123 Test St',
        city: 'Test City',
        location: { lat: 12.9352, lng: 77.6245 },
      },
      zone: 'ZONE-001',
    });
  });

  it('should complete full rider assignment workflow', async () => {
    const authHeaders = getAuthHeaders(testUsers.darkstore);

    // Step 1: View pending orders ready for dispatch
    const pendingOrdersResponse = await request(app)
      .get('/api/v1/rider/orders?status=ready_for_dispatch')
      .set(authHeaders)
      .expect(200);

    expect(pendingOrdersResponse.body.success).toBe(true);
    const pendingOrder = pendingOrdersResponse.body.data.find(
      o => o.orderId === 'ORD-001'
    );
    expect(pendingOrder).toBeDefined();

    // Step 2: Auto-assign rider to order
    const assignResponse = await request(app)
      .post('/api/v1/rider/orders/ORD-001/assign')
      .set(authHeaders)
      .send({ autoAssign: true })
      .expect(200);

    expect(assignResponse.body.success).toBe(true);
    expect(assignResponse.body.data.riderId).toBeDefined();

    const assignedRiderId = assignResponse.body.data.riderId;

    // Step 3: Verify rider status updated to busy
    const rider = await Rider.findOne({ riderId: assignedRiderId });
    expect(['busy', 'assigned']).toContain(rider.status);

    // Step 4: Update order status to out_for_delivery
    const dispatchResponse = await request(app)
      .patch('/api/v1/rider/orders/ORD-001')
      .set(authHeaders)
      .send({ status: 'out_for_delivery' })
      .expect(200);

    expect(dispatchResponse.body.data.status).toBe('out_for_delivery');

    // Step 5: Track delivery (update location)
    const trackResponse = await request(app)
      .patch('/api/v1/rider/orders/ORD-001/track')
      .set(authHeaders)
      .send({
        location: { lat: 12.9352, lng: 77.6245 },
        status: 'in_transit',
      })
      .expect(200);

    expect(trackResponse.body.success).toBe(true);

    // Step 6: Mark order as delivered
    const deliverResponse = await request(app)
      .patch('/api/v1/rider/orders/ORD-001')
      .set(authHeaders)
      .send({ 
        status: 'delivered',
        deliveredAt: new Date().toISOString(),
      })
      .expect(200);

    expect(deliverResponse.body.data.status).toBe('delivered');

    // Step 7: Verify rider status updated back to available
    const updatedRider = await Rider.findOne({ riderId: assignedRiderId });
    expect(updatedRider.status).toBe('available');
  });
});
