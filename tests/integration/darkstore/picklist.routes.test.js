const request = require('supertest');
const createTestApp = require('../../helpers/testApp');
const { getAuthHeaders, testUsers } = require('../../helpers/mockAuth');
const { clearDatabase } = require('../../helpers/mockDatabase');
const Order = require('../../../src/darkstore/models/Order');
const Picklist = require('../../../src/darkstore/models/Picklist');
const InventoryItem = require('../../../src/darkstore/models/InventoryItem');

const app = createTestApp();

describe('Darkstore Picklist API', () => {
  beforeEach(async () => {
    clearDatabase();
    
    // Create test inventory
    await InventoryItem.create({
      sku: 'SKU-001',
      name: 'Test Product',
      stock: 100,
      store_id: 'STORE-001',
    });

    // Create test order
    await Order.create({
      orderId: 'ORD-001',
      customerId: 'CUST-001',
      status: 'pending',
      items: [
        { sku: 'SKU-001', quantity: 2, price: 100 },
      ],
      total: 200,
    });
  });

  describe('POST /api/v1/darkstore/picklists', () => {
    it('should create picklist when authenticated', async () => {
      const picklistData = {
        orderIds: ['ORD-001'],
        storeId: 'STORE-001',
      };

      const response = await request(app)
        .post('/api/v1/darkstore/picklists')
        .set(getAuthHeaders(testUsers.darkstore))
        .send(picklistData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('picklistId');
    });

    it('should return 401 without auth', async () => {
      await request(app)
        .post('/api/v1/darkstore/picklists')
        .send({})
        .expect(401);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/v1/darkstore/picklists')
        .set(getAuthHeaders(testUsers.darkstore))
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/darkstore/picklists', () => {
    beforeEach(async () => {
      await Picklist.create({
        picklistId: 'PICK-001',
        orderIds: ['ORD-001'],
        status: 'pending',
        storeId: 'STORE-001',
      });
    });

    it('should list picklists when authenticated', async () => {
      const response = await request(app)
        .get('/api/v1/darkstore/picklists')
        .set(getAuthHeaders(testUsers.darkstore))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should filter by status', async () => {
      const response = await request(app)
        .get('/api/v1/darkstore/picklists?status=pending')
        .set(getAuthHeaders(testUsers.darkstore))
        .expect(200);

      expect(response.body.success).toBe(true);
      if (response.body.data.length > 0) {
        expect(response.body.data.every(p => p.status === 'pending')).toBe(true);
      }
    });
  });

  describe('PATCH /api/v1/darkstore/picklists/:picklistId/assign', () => {
    it('should assign picker to picklist when authenticated', async () => {
      const picklist = await Picklist.create({
        picklistId: 'PICK-002',
        orderIds: ['ORD-001'],
        status: 'pending',
        storeId: 'STORE-001',
      });

      const response = await request(app)
        .patch(`/api/v1/darkstore/picklists/${picklist.picklistId}/assign`)
        .set(getAuthHeaders(testUsers.darkstore))
        .send({ pickerId: 'PICKER-001' })
        .expect(200);

      expect(response.body.success).toBe(true);
      
      // Verify picker was assigned
      const updated = await Picklist.findOne({ picklistId: 'PICK-002' });
      expect(updated.pickerId).toBe('PICKER-001');
    });
  });
});
