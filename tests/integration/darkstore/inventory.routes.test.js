const request = require('supertest');
const createTestApp = require('../../helpers/testApp');
const { getAuthHeaders, testUsers } = require('../../helpers/mockAuth');
const { clearDatabase } = require('../../helpers/mockDatabase');
const InventoryItem = require('../../../src/darkstore/models/InventoryItem');
const InventoryAdjustment = require('../../../src/darkstore/models/InventoryAdjustment');

const app = createTestApp();

describe('Darkstore Inventory API', () => {
  beforeEach(() => {
    clearDatabase();
  });

  describe('GET /api/v1/darkstore/inventory', () => {
    beforeEach(async () => {
      await InventoryItem.create({
        sku: 'SKU-001',
        name: 'Test Product',
        stock: 100,
        store_id: 'STORE-001',
      });
    });

    it('should list inventory items when authenticated', async () => {
      const response = await request(app)
        .get('/api/v1/darkstore/inventory')
        .set(getAuthHeaders(testUsers.darkstore))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should filter by store_id', async () => {
      await InventoryItem.create({
        sku: 'SKU-002',
        name: 'Product 2',
        stock: 50,
        store_id: 'STORE-002',
      });

      const response = await request(app)
        .get('/api/v1/darkstore/inventory?storeId=STORE-001')
        .set(getAuthHeaders(testUsers.darkstore))
        .expect(200);

      expect(response.body.success).toBe(true);
      if (response.body.data.length > 0) {
        expect(response.body.data.every(item => item.store_id === 'STORE-001')).toBe(true);
      }
    });

    it('should return 401 without auth', async () => {
      await request(app)
        .get('/api/v1/darkstore/inventory')
        .expect(401);
    });
  });

  describe('POST /api/v1/darkstore/inventory/adjust', () => {
    beforeEach(async () => {
      await InventoryItem.create({
        sku: 'SKU-003',
        name: 'Adjustable Product',
        stock: 100,
        store_id: 'STORE-001',
      });
    });

    it('should adjust inventory when authenticated', async () => {
      const adjustmentData = {
        sku: 'SKU-003',
        store_id: 'STORE-001',
        action: 'adjust',
        quantity: -10,
        reason: 'Damaged goods',
      };

      const response = await request(app)
        .post('/api/v1/darkstore/inventory/adjust')
        .set(getAuthHeaders(testUsers.darkstore))
        .send(adjustmentData)
        .expect(200);

      expect(response.body.success).toBe(true);
      
      // Verify inventory was adjusted
      const item = await InventoryItem.findOne({ sku: 'SKU-003' });
      expect(item.stock).toBe(90);
    });

    it('should create adjustment record', async () => {
      const adjustmentData = {
        sku: 'SKU-003',
        store_id: 'STORE-001',
        action: 'adjust',
        quantity: -5,
        reason: 'Test adjustment',
      };

      await request(app)
        .post('/api/v1/darkstore/inventory/adjust')
        .set(getAuthHeaders(testUsers.darkstore))
        .send(adjustmentData)
        .expect(200);

      const adjustment = await InventoryAdjustment.findOne({ sku: 'SKU-003' });
      expect(adjustment).toBeDefined();
      expect(adjustment.quantity).toBe(-5);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/v1/darkstore/inventory/adjust')
        .set(getAuthHeaders(testUsers.darkstore))
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/darkstore/inventory/shelf-view', () => {
    beforeEach(async () => {
      await InventoryItem.create({
        sku: 'SKU-004',
        name: 'Shelf Product',
        stock: 50,
        store_id: 'STORE-001',
        location: 'A1-B2-C3',
        zone: 'Zone 1 (Ambient)',
      });
    });

    it('should return shelf view when authenticated', async () => {
      const response = await request(app)
        .get('/api/v1/darkstore/inventory/shelf-view?storeId=STORE-001')
        .set(getAuthHeaders(testUsers.darkstore))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('shelves');
    });

    it('should filter by zone', async () => {
      const response = await request(app)
        .get('/api/v1/darkstore/inventory/shelf-view?storeId=STORE-001&zone=Zone 1 (Ambient)')
        .set(getAuthHeaders(testUsers.darkstore))
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });
});
