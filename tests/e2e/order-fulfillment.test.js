/**
 * E2E Test: Order Fulfillment Flow
 * Tests the complete workflow: Login → View orders → Create picklist → Assign picker → Pack → Dispatch
 */

const request = require('supertest');
const createTestApp = require('../helpers/testApp');
const { getAuthHeaders, testUsers } = require('../helpers/mockAuth');
const { clearDatabase } = require('../helpers/mockDatabase');
const Order = require('../../src/darkstore/models/Order');
const Picklist = require('../../src/darkstore/models/Picklist');
const InventoryItem = require('../../src/darkstore/models/InventoryItem');

const app = createTestApp();

describe('E2E: Order Fulfillment Flow', () => {
  beforeEach(async () => {
    clearDatabase();
    
    // Setup test inventory
    await InventoryItem.create({
      sku: 'SKU-001',
      name: 'Test Product 1',
      stock: 100,
      store_id: 'STORE-001',
      location: 'A1-B2-C3',
    });

    await InventoryItem.create({
      sku: 'SKU-002',
      name: 'Test Product 2',
      stock: 50,
      store_id: 'STORE-001',
      location: 'A2-B3-C4',
    });
  });

  it('should complete full order fulfillment workflow', async () => {
    const authHeaders = getAuthHeaders(testUsers.darkstore);

    // Step 1: Create an order
    const orderResponse = await request(app)
      .post('/api/v1/darkstore/orders')
      .set(authHeaders)
      .send({
        customerId: 'CUST-001',
        customerName: 'Test Customer',
        items: [
          { sku: 'SKU-001', quantity: 2, price: 100 },
          { sku: 'SKU-002', quantity: 1, price: 200 },
        ],
        deliveryAddress: {
          street: '123 Test St',
          city: 'Test City',
          zipCode: '12345',
        },
      })
      .expect(201);

    expect(orderResponse.body.success).toBe(true);
    const orderId = orderResponse.body.data.orderId;

    // Step 2: View orders (verify order appears in list)
    const ordersResponse = await request(app)
      .get('/api/v1/darkstore/orders?status=pending')
      .set(authHeaders)
      .expect(200);

    expect(ordersResponse.body.success).toBe(true);
    const createdOrder = ordersResponse.body.data.find(o => o.orderId === orderId);
    expect(createdOrder).toBeDefined();
    expect(createdOrder.status).toBe('pending');

    // Step 3: Create picklist for the order
    const picklistResponse = await request(app)
      .post('/api/v1/darkstore/picklists')
      .set(authHeaders)
      .send({
        orderIds: [orderId],
        storeId: 'STORE-001',
      })
      .expect(201);

    expect(picklistResponse.body.success).toBe(true);
    const picklistId = picklistResponse.body.data.picklistId;

    // Step 4: Assign picker to picklist
    const assignResponse = await request(app)
      .patch(`/api/v1/darkstore/picklists/${picklistId}/assign`)
      .set(authHeaders)
      .send({ pickerId: 'PICKER-001' })
      .expect(200);

    expect(assignResponse.body.success).toBe(true);

    // Step 5: Verify picklist status updated
    const picklistDetails = await request(app)
      .get(`/api/v1/darkstore/picklists/${picklistId}`)
      .set(authHeaders)
      .expect(200);

    expect(picklistDetails.body.data.pickerId).toBe('PICKER-001');

    // Step 6: Update order status to processing (simulating packing)
    const updateOrderResponse = await request(app)
      .patch(`/api/v1/darkstore/orders/${orderId}`)
      .set(authHeaders)
      .send({ status: 'processing' })
      .expect(200);

    expect(updateOrderResponse.body.data.status).toBe('processing');

    // Step 7: Update order status to ready_for_dispatch
    const dispatchResponse = await request(app)
      .patch(`/api/v1/darkstore/orders/${orderId}`)
      .set(authHeaders)
      .send({ status: 'ready_for_dispatch' })
      .expect(200);

    expect(dispatchResponse.body.data.status).toBe('ready_for_dispatch');

    // Step 8: Verify inventory was reduced
    const inventoryItem = await InventoryItem.findOne({ sku: 'SKU-001' });
    expect(inventoryItem.stock).toBeLessThan(100); // Stock should be reduced
  });
});
